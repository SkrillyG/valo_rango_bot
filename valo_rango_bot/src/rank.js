"use strict";

const express = require("express");
const db = require("./db");
const crypto = require("./crypto");
const logger = require("./logger");
const valorant = require("./valorant");
const messages = require("./messages");
const { CacheTTL } = require("./cache");
const { Ventana } = require("./ratelimit");
const { baseUrl } = require("./urls");

function crearRouter(config) {
  const router = express.Router();
  const cache = new CacheTTL(config.cacheTtlMs, config.cacheStaleMs);
  const limitador = new Ventana(config.rateLimit.windowMs, config.rateLimit.max);

  function responderTexto(res, cuerpo) {
    res.status(200).type("text/plain; charset=utf-8").set("Cache-Control", "no-store").send(cuerpo);
  }

  async function manejarRank(req, res, idiomaForzado) {
    const inicio = Date.now();
    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    const langPedido = idiomaForzado || (typeof req.query.lang === "string" ? req.query.lang : "es");

    if (!token) {
      responderTexto(res, messages.mensajeError("CONFIG_NO_ENCONTRADA", { lang: langPedido }));
      return;
    }

    const hash = crypto.hashToken(token);
    const limite = limitador.permitir(hash);
    if (!limite.permitido) {
      logger.warn("limite de peticiones alcanzado", { restantes: limite.restantes });
      responderTexto(res, messages.mensajeError("MUCHAS_PETICIONES", { lang: langPedido }));
      return;
    }

    let streamer = null;
    try {
      streamer = await db.porTokenHash(hash);
    } catch (errorDb) {
      logger.error("no se pudo leer la configuracion", errorDb.message);
      responderTexto(res, messages.mensajeError("PROVEEDOR_ERROR", { lang: langPedido }));
      return;
    }

    if (!streamer) {
      responderTexto(res, messages.mensajeError("CONFIG_NO_ENCONTRADA", { lang: langPedido }));
      return;
    }

    const lang = messages.idioma(streamer);
    const urlSetup = `${baseUrl(config, req)}/setup`;

    if (!streamer.api_key_cifrada) {
      responderTexto(res, messages.mensajeError("FALTA_CONFIGURACION", { lang, url: urlSetup }));
      return;
    }

    const cacheado = cache.obtener(streamer.twitch_id);
    if (cacheado && cacheado.edadMs < config.cacheTtlMs) {
      responderTexto(res, messages.mensajeRango(streamer, cacheado));
      logger.info("GET /rank -> 200", { ms: Date.now() - inicio, origen: "cache" });
      return;
    }

    let apiKey = "";
    try {
      apiKey = crypto.descifrar(streamer.api_key_cifrada, config.encryptionKey);
    } catch (errorCifrado) {
      logger.error("no se pudo descifrar la key del proveedor", errorCifrado.message);
      responderTexto(res, messages.mensajeError("PROVEEDOR_ERROR", { lang }));
      return;
    }

    try {
      const datos = await valorant.obtenerRango({
        apiKey,
        region: streamer.region,
        platform: streamer.platform,
        riotName: streamer.riot_name,
        riotTag: streamer.riot_tag,
        config,
      });
      cache.guardar(streamer.twitch_id, datos);
      responderTexto(res, messages.mensajeRango(streamer, datos));
      logger.info("GET /rank -> 200", { ms: Date.now() - inicio, origen: datos.origen });
    } catch (error) {
      const codigo = error.codigo || valorant.CODIGOS.PROVEEDOR_ERROR;
      const obsoleto = cache.obtener(streamer.twitch_id);
      if (obsoleto) {
        responderTexto(res, messages.mensajeRango(streamer, obsoleto));
        logger.warn("proveedor fallo, sirviendo cache", { ms: Date.now() - inicio, codigo });
        return;
      }
      logger.warn("proveedor fallo", { ms: Date.now() - inicio, codigo, detalle: error.message });
      responderTexto(res, messages.mensajeError(codigo, { lang }));
    }
  }

  router.get("/rank", (req, res) => manejarRank(req, res));
  router.get("/rango", (req, res) => manejarRank(req, res, "es"));

  router.get("/api/rank", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token.trim() : "";
    if (!token) {
      res.status(404).json({ ok: false, error: "CONFIG_NO_ENCONTRADA" });
      return;
    }
    try {
      const streamer = await db.porTokenHash(crypto.hashToken(token));
      if (!streamer) {
        res.status(404).json({ ok: false, error: "CONFIG_NO_ENCONTRADA" });
        return;
      }
      const datos = cache.obtener(streamer.twitch_id);
      res.json({
        ok: Boolean(datos),
        twitch_login: streamer.twitch_login,
        riot_id: `${streamer.riot_name}#${streamer.riot_tag}`,
        region: streamer.region,
        platform: streamer.platform,
        lang: streamer.lang,
        rango: datos ? datos.rango : null,
        rr: datos ? datos.rr : null,
        actualizadoEn: datos ? new Date(datos.guardadoEn).toISOString() : null,
      });
    } catch (error) {
      res.status(503).json({ ok: false, error: "PROVEEDOR_ERROR" });
    }
  });

  return router;
}

module.exports = { crearRouter };
