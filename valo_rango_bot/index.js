"use strict";

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

cargarDotEnv();

const PORT = Number(process.env.PORT || 3000);
const API_BASE = (process.env.HENRIK_API_BASE || "https://api.henrikdev.xyz").replace(/\/+$/, "");
const API_KEY = process.env.HENRIK_API_KEY || "";
const REGION = process.env.HENRIK_REGION || "eu";
const PLATFORM = process.env.HENRIK_PLATFORM || "pc";
const PLAYER_NAME = process.env.VALORANT_NAME || "macarrones";
const PLAYER_TAG = process.env.VALORANT_TAG || "pato";
const DISPLAY_NAME = process.env.DISPLAY_NAME || "Sofi";
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 60_000);
const TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 5_000);
const RETRIES = Number(process.env.UPSTREAM_RETRIES || 1);
const DEADLINE_MS = Number(process.env.REQUEST_DEADLINE_MS || 12_000);
const MIN_INTENTO_MS = 300;

const MSG_ES_ERROR = "No se pudo obtener el rango en este momento.";
const MSG_EN_ERROR = "Could not retrieve the rank right now.";

const app = express();
app.disable("x-powered-by");

const cache = { valor: null, guardadoEn: 0, origen: null };
const estado = { ultimoOk: null, ultimoStatus: null, ultimoError: null, ultimoAt: null };

function log(nivel, mensaje, extra) {
  console.log(`[${new Date().toISOString()}] ${nivel} ${mensaje}`, extra === undefined ? "" : extra);
}

// Lee .env local. Las variables ya presentes en el entorno (Render, CI) tienen prioridad.
function cargarDotEnv() {
  const archivo = path.join(__dirname, ".env");
  if (!fs.existsSync(archivo)) return;
  for (const cruda of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const linea = cruda.trim();
    if (!linea || linea.startsWith("#")) continue;
    const separador = linea.indexOf("=");
    if (separador === -1) continue;
    const key = linea.slice(0, separador).trim();
    let value = linea.slice(separador + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// GET al API de HenrikDev con Authorization por header y reintento solo ante 429/5xx/red.
// `deadline` es un timestamp absoluto: nunca se puede pasar de ese instante, para no
// agotar el timeout de 15 s del proxy de StreamElements.
async function pedir(url, deadline) {
  const headers = { Accept: "application/json" };
  if (API_KEY) headers.Authorization = API_KEY;

  let ultimoError = null;
  for (let intento = 0; intento <= RETRIES; intento++) {
    const restante = deadline ? deadline - Date.now() : TIMEOUT_MS;
    if (restante < MIN_INTENTO_MS) {
      log("WARN", `sin presupuesto para ${url} (intento ${intento + 1})`);
      break;
    }
    const timeout = Math.max(200, Math.min(TIMEOUT_MS, restante));

    try {
      const respuesta = await axios.get(url, { headers, timeout });
      return { ok: true, status: respuesta.status, data: respuesta.data };
    } catch (error) {
      ultimoError = error;
      const status = error.response ? error.response.status : 0;
      const reintentable = status === 0 || status === 429 || status >= 500;
      log("WARN", `upstream ${status || "sin respuesta"} en ${url} (intento ${intento + 1})`, error.message);
      if (!reintentable || intento === RETRIES) break;

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

// v3 -> data.current.tier.name + data.current.rr
function normalizarV3(payload) {
  const actual = payload && payload.data && payload.data.current;
  if (!actual || !actual.tier || typeof actual.tier.name !== "string") return null;
  const rr = Number(actual.rr);
  return { rango: actual.tier.name, rr: Number.isFinite(rr) ? rr : 0 };
}

// v1 (deprecado, solo como fallback) -> data.currenttierpatched + data.ranking_in_tier
function normalizarV1(payload) {
  const datos = payload && payload.data;
  if (!datos) return null;
  const rango = datos.currenttierpatched || (datos.currenttier != null ? String(datos.currenttier) : null);
  if (!rango) return null;
  const rr = Number(datos.ranking_in_tier);
  return { rango, rr: Number.isFinite(rr) ? rr : 0 };
}

function guardarCache(valor, origen) {
  cache.valor = valor;
  cache.guardadoEn = Date.now();
  cache.origen = origen;
}

function marcarEstado(ok, status, error) {
  estado.ultimoOk = ok;
  estado.ultimoStatus = status;
  estado.ultimoError = error;
  estado.ultimoAt = new Date().toISOString();
}

async function obtenerRango({ forzar = false } = {}) {
  const ahora = Date.now();

  if (!forzar && cache.valor && ahora - cache.guardadoEn < CACHE_TTL_MS) {
    return { ...cache.valor, origen: "cache", guardadoEn: cache.guardadoEn };
  }

  const deadline = ahora + DEADLINE_MS;
  const nombre = encodeURIComponent(PLAYER_NAME);
  const tag = encodeURIComponent(PLAYER_TAG);

  // Primario: v3 (endpoint actual)
  const r3 = await pedir(`${API_BASE}/valorant/v3/mmr/${REGION}/${PLATFORM}/${nombre}/${tag}`, deadline);
  const v3 = r3.ok ? normalizarV3(r3.data) : null;
  if (v3) {
    guardarCache(v3, "v3");
    marcarEstado(true, r3.status, null);
    return { ...v3, origen: "v3", guardadoEn: cache.guardadoEn };
  }

  // Fallback: v1. Si el fallo es de autenticacion la v1 dara lo mismo, asi que no se intenta.
  const falloAuth = r3.status === 401 || r3.status === 403;
  if (!falloAuth) {
    const r1 = await pedir(`${API_BASE}/valorant/v1/mmr/${REGION}/${nombre}/${tag}`, deadline);
    const v1 = r1.ok ? normalizarV1(r1.data) : null;
    if (v1) {
      guardarCache(v1, "v1");
      marcarEstado(true, r1.status, null);
      return { ...v1, origen: "v1", guardadoEn: cache.guardadoEn };
    }
  }

  // Cache vieja: mejor un dato viejo que un error en pantalla.
  if (cache.valor) {
    log("WARN", "upstream fallo, sirviendo cache vieja", { edadMs: ahora - cache.guardadoEn });
    return { ...cache.valor, origen: "stale", guardadoEn: cache.guardadoEn };
  }

  marcarEstado(false, r3.status, `HenrikDev respondio ${r3.status || "sin respuesta"}`);
  throw new Error(estado.ultimoError);
}

// Respuesta en texto plano, igual que antes. Siempre HTTP 200: el proxy de
// StreamElements sustituye cualquier 4xx/5xx por un mensaje de error generico.
function responder(req, res, idioma) {
  const inicio = Date.now();
  obtenerRango({ forzar: req.query.force === "1" })
    .then((datos) => {
      const cuerpo =
        idioma === "es"
          ? `El rango de ${DISPLAY_NAME} es: ${datos.rango} (${datos.rr} RR)`
          : `${DISPLAY_NAME}'s current rank is: ${datos.rango} (${datos.rr} RR)`;
      res.type("text/plain").send(cuerpo);
      log("INFO", `${req.method} ${req.originalUrl} -> 200`, {
        ms: Date.now() - inicio,
        origen: datos.origen,
      });
    })
    .catch((error) => {
      res.status(200).type("text/plain").send(idioma === "es" ? MSG_ES_ERROR : MSG_EN_ERROR);
      log("ERROR", `${req.method} ${req.originalUrl} -> 200 (error en cuerpo)`, {
        ms: Date.now() - inicio,
        detalle: error.message,
      });
    });
}

app.get("/", (req, res) => {
  res.type("text/plain").send(
    [
      "ValoRangoBot online.",
      "",
      "GET /rango     -> El rango de Sofi es: <tier> (<rr> RR)   [ES]",
      "GET /rank      -> Sofi's current rank is: <tier> (<rr> RR) [EN]",
      "GET /api/rango -> JSON",
      "GET /api/rank  -> JSON",
      "GET /health    -> estado del servicio",
    ].join("\n")
  );
});

app.get("/rango", (req, res) => responder(req, res, "es"));
app.get("/rank", (req, res) => responder(req, res, "en"));

async function responderJson(req, res) {
  try {
    const datos = await obtenerRango({ forzar: req.query.force === "1" });
    res.json({
      ok: true,
      rango: datos.rango,
      rr: datos.rr,
      origen: datos.origen,
      actualizadoEn: new Date(datos.guardadoEn).toISOString(),
    });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message, estado });
  }
}

app.get("/api/rango", responderJson);
app.get("/api/rank", responderJson);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    servicio: "valo-rango-bot",
    uptimeSeg: Math.round(process.uptime()),
    apiKeyConfigurada: Boolean(API_KEY),
    ultimoOk: estado.ultimoOk,
    ultimoStatus: estado.ultimoStatus,
    ultimoAt: estado.ultimoAt,
    cache: cache.valor
      ? {
          rango: cache.valor.rango,
          rr: cache.valor.rr,
          origen: cache.origen,
          edadMs: Date.now() - cache.guardadoEn,
        }
      : null,
  });
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("404 - ruta no encontrada");
});

app.use((error, req, res, next) => {
  log("ERROR", "fallo no controlado", error.message);
  res.status(500).type("text/plain").send(MSG_ES_ERROR);
});

app.listen(PORT, "0.0.0.0", () => {
  log("INFO", `Servidor corriendo en puerto ${PORT}`, {
    apiKeyConfigurada: Boolean(API_KEY),
    upstream: `${API_BASE}/valorant/v3/mmr/${REGION}/${PLATFORM}/...`,
  });
});
