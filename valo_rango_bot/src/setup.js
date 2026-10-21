"use strict";

const express = require("express");
const db = require("./db");
const crypto = require("./crypto");
const logger = require("./logger");
const views = require("./views");
const { REGIONES, PLATAFORMAS, IDIOMAS } = require("./messages");
const { baseUrl } = require("./urls");

function limpiar(valor, maximo) {
  return String(valor || "")
    .replace(/[^\p{L}\p{N}_ -]/gu, "")
    .trim()
    .slice(0, maximo);
}

function construirComandos(base, token) {
  const url = `${base}/rank?token=${token}`;
  return {
    nightbot: `!commands add !rank $(urlfetch ${url})`,
    streamelements: `!command add !rank $(customapi ${url})`,
  };
}

function comandosEnmascarados(base) {
  const url = `${base}/rank?token=TOKEN-AQUI`;
  return {
    nightbot: `!commands add !rank $(urlfetch ${url})`,
    streamelements: `!command add !rank $(customapi ${url})`,
  };
}

function crearRouter(config) {
  const router = express.Router();

  router.get("/setup", async (req, res) => {
    const usuario = req.session.twitch;
    const error = req.session.flashError;
    const aviso = req.session.flashAviso;
    delete req.session.flashError;
    delete req.session.flashAviso;

    let token = null;
    if (req.session.flashToken) {
      try {
        token = crypto.descifrar(req.session.flashToken, config.encryptionKey);
      } catch (errorDescifrado) {
        logger.error("no se pudo descifrar el token de la sesion", errorDescifrado.message);
      }
      delete req.session.flashToken;
    }

    let fila = null;
    if (usuario) {
      try {
        fila = await db.porTwitchId(usuario.id);
      } catch (errorDb) {
        logger.error("no se pudo leer la configuracion", errorDb.message);
        return res.status(503).type("html").send(views.paginaSimple("Servicio no disponible", "No se pudo contactar con la base de datos."));
      }
    }

    const base = baseUrl(config, req);
    const streamer = usuario
      ? {
          twitch_login: usuario.login,
          twitch_display_name: usuario.displayName,
          riot_name: fila ? fila.riot_name : "",
          riot_tag: fila ? fila.riot_tag : "",
          region: fila ? fila.region : "eu",
          platform: fila ? fila.platform : "pc",
          lang: fila ? fila.lang : "es",
        }
      : null;

    const configurado = Boolean(fila && fila.api_key_cifrada && fila.riot_name && fila.riot_tag);

    res.type("html").send(
      views.paginaSetup({
        baseUrl: base,
        streamer,
        configurado,
        token,
        error,
        aviso,
        comandos: token ? construirComandos(base, token) : comandosEnmascarados(base),
        comandosEnmascarados: comandosEnmascarados(base),
      })
    );
  });

  router.post("/setup", async (req, res) => {
    const usuario = req.session.twitch;
    if (!usuario) {
      req.session.flashError = "Inicia sesion con Twitch antes de guardar la configuracion.";
      return res.redirect("/setup");
    }

    const cuerpo = req.body || {};
    const riotName = limpiar(cuerpo.riot_name, 32);
    const riotTag = limpiar(cuerpo.riot_tag, 16);
    const region = REGIONES.includes(cuerpo.region) ? cuerpo.region : "eu";
    const platform = PLATAFORMAS.includes(cuerpo.platform) ? cuerpo.platform : "pc";
    const lang = IDIOMAS.includes(cuerpo.lang) ? cuerpo.lang : "es";
    const apiKey = String(cuerpo.api_key || "").trim();

    if (!riotName || !riotTag) {
      req.session.flashError = "Escribe tu Riot ID: nombre y tag.";
      return res.redirect("/setup");
    }

    let fila = null;
    try {
      fila = await db.porTwitchId(usuario.id);
    } catch (errorDb) {
      logger.error("no se pudo leer la configuracion", errorDb.message);
      req.session.flashError = "No se pudo contactar con la base de datos.";
      return res.redirect("/setup");
    }

    let apiKeyCifrada = fila ? fila.api_key_cifrada : "";
    if (apiKey) {
      if (apiKey.length < 8 || /\s/.test(apiKey)) {
        req.session.flashError = "La key del proveedor no parece valida.";
        return res.redirect("/setup");
      }
      apiKeyCifrada = crypto.cifrar(apiKey, config.encryptionKey);
    }

    if (!apiKeyCifrada) {
      req.session.flashError = "Necesitas pegar tu key del proveedor de rangos.";
      return res.redirect("/setup");
    }

    const esNuevo = !fila;
    const token = crypto.generarToken();
    const tokenHash = esNuevo ? crypto.hashToken(token) : fila.token_hash;

    try {
      await db.guardar({
        twitch_id: usuario.id,
        twitch_login: usuario.login,
        twitch_display_name: usuario.displayName || usuario.login,
        token_hash: tokenHash,
        api_key_cifrada: apiKeyCifrada,
        riot_name: riotName,
        riot_tag: riotTag,
        region,
        platform,
        lang,
      });
    } catch (errorDb) {
      logger.error("no se pudo guardar la configuracion", errorDb.message);
      req.session.flashError = "No se pudo guardar la configuracion.";
      return res.redirect("/setup");
    }

    if (esNuevo) {
      req.session.flashToken = crypto.cifrar(token, config.encryptionKey);
    }
    req.session.flashAviso = esNuevo ? "Configuracion guardada." : "Cambios guardados.";
    res.redirect("/setup");
  });

  router.post("/setup/token", async (req, res) => {
    const usuario = req.session.twitch;
    if (!usuario) {
      req.session.flashError = "Inicia sesion con Twitch antes de continuar.";
      return res.redirect("/setup");
    }

    const token = crypto.generarToken();
    try {
      const actualizado = await db.actualizarTokenHash(usuario.id, crypto.hashToken(token));
      if (!actualizado) {
        req.session.flashError = "Todavia no hay ninguna configuracion guardada.";
        return res.redirect("/setup");
      }
    } catch (errorDb) {
      logger.error("no se pudo regenerar el token", errorDb.message);
      req.session.flashError = "No se pudo regenerar el token.";
      return res.redirect("/setup");
    }

    req.session.flashToken = crypto.cifrar(token, config.encryptionKey);
    req.session.flashAviso = "Token regenerado. El anterior ya no funciona.";
    res.redirect("/setup");
  });

  router.post("/setup/delete", async (req, res) => {
    const usuario = req.session.twitch;
    if (!usuario) {
      return res.redirect("/setup");
    }

    try {
      await db.eliminar(usuario.id);
    } catch (errorDb) {
      logger.error("no se pudo borrar la configuracion", errorDb.message);
      req.session.flashError = "No se pudieron borrar tus datos.";
      return res.redirect("/setup");
    }

    req.session.flashAviso = "Se han borrado todos tus datos.";
    res.redirect("/setup");
  });

  return router;
}

module.exports = { crearRouter, construirComandos };
