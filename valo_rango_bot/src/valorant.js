"use strict";

const axios = require("axios");
const logger = require("./logger");

const CODIGOS = {
  JUGADOR_NO_ENCONTRADO: "JUGADOR_NO_ENCONTRADO",
  KEY_INVALIDA: "KEY_INVALIDA",
  PROVEEDOR_ERROR: "PROVEEDOR_ERROR",
};

class ErrorProveedor extends Error {
  constructor(codigo, detalle) {
    super(detalle || codigo);
    this.codigo = codigo;
  }
}

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pedir(url, apiKey, deadline, config) {
  const headers = { Accept: "application/json" };
  if (apiKey) headers.Authorization = apiKey;

  let ultimoError = null;
  for (let intento = 0; intento <= config.upstreamRetries; intento++) {
    const restante = deadline ? deadline - Date.now() : config.upstreamTimeoutMs;
    if (restante < 300) break;
    const timeout = Math.max(200, Math.min(config.upstreamTimeoutMs, restante));

    try {
      const respuesta = await axios.get(url, { headers, timeout });
      return { ok: true, status: respuesta.status, data: respuesta.data };
    } catch (error) {
      ultimoError = error;
      const status = error.response ? error.response.status : 0;
      const reintentable = status === 0 || status === 429 || status >= 500;
      logger.warn(`proveedor ${status || "sin respuesta"} (intento ${intento + 1})`, error.message);
      if (!reintentable || intento === config.upstreamRetries) break;
      const espera = 400 * (intento + 1);
      if (deadline && Date.now() + espera >= deadline) break;
      await dormir(espera);
    }
  }

  return {
    ok: false,
    status: ultimoError && ultimoError.response ? ultimoError.response.status : 0,
    data: null,
  };
}

function normalizarV3(payload) {
  const actual = payload && payload.data && payload.data.current;
  if (!actual || !actual.tier || typeof actual.tier.name !== "string") return null;
  const rr = Number(actual.rr);
  return { rango: actual.tier.name, rr: Number.isFinite(rr) ? rr : 0 };
}

function normalizarV1(payload) {
  const datos = payload && payload.data;
  if (!datos) return null;
  const rango = datos.currenttierpatched || (datos.currenttier != null ? String(datos.currenttier) : null);
  if (!rango) return null;
  const rr = Number(datos.ranking_in_tier);
  return { rango, rr: Number.isFinite(rr) ? rr : 0 };
}

function interpretarFallo(status) {
  if (status === 404) return CODIGOS.JUGADOR_NO_ENCONTRADO;
  if (status === 401 || status === 403) return CODIGOS.KEY_INVALIDA;
  return CODIGOS.PROVEEDOR_ERROR;
}

async function obtenerRango({ apiKey, region, platform, riotName, riotTag, config, deadline }) {
  const limite = deadline || Date.now() + config.requestDeadlineMs;
  const nombre = encodeURIComponent(riotName);
  const tag = encodeURIComponent(riotTag);

  const v3 = await pedir(
    `${config.henrikApiBase}/valorant/v3/mmr/${region}/${platform}/${nombre}/${tag}`,
    apiKey,
    limite,
    config
  );
  if (v3.ok) {
    const datos = normalizarV3(v3.data);
    if (datos) return { ...datos, origen: "v3" };
  }

  const falloAuth = v3.status === 401 || v3.status === 403;
  const jugadorNoExiste = v3.status === 404;
  if (!falloAuth && !jugadorNoExiste) {
    const v1 = await pedir(
      `${config.henrikApiBase}/valorant/v1/mmr/${region}/${nombre}/${tag}`,
      apiKey,
      limite,
      config
    );
    if (v1.ok) {
      const datos = normalizarV1(v1.data);
      if (datos) return { ...datos, origen: "v1" };
    }
  }

  throw new ErrorProveedor(interpretarFallo(v3.status), `proveedor respondio ${v3.status || "sin respuesta"}`);
}

module.exports = { obtenerRango, ErrorProveedor, CODIGOS };
