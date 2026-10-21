"use strict";

const fs = require("fs");
const path = require("path");

function cargarDotEnv() {
  const archivo = path.join(__dirname, "..", ".env");
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

cargarDotEnv();

function entero(valor, porDefecto, minimo = 1) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < minimo) return porDefecto;
  return Math.floor(n);
}

const puerto = entero(process.env.PORT, 3000);

const config = {
  puerto,
  nodeEnv: process.env.NODE_ENV || "development",
  baseUrl: (process.env.BASE_URL || `http://localhost:${puerto}`).replace(/\/+$/, ""),
  baseUrlEsFijo: Boolean(process.env.BASE_URL),
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: process.env.DATABASE_SSL === "1" || process.env.DATABASE_SSL === "true",
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  sessionSecret: process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY || "",
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || "",
    clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
  },
  henrikApiBase: (process.env.HENRIK_API_BASE || "https://api.henrikdev.xyz").replace(/\/+$/, ""),
  cacheTtlMs: entero(process.env.CACHE_TTL_MS, 90_000),
  cacheStaleMs: entero(process.env.CACHE_STALE_MS, 600_000),
  upstreamTimeoutMs: entero(process.env.UPSTREAM_TIMEOUT_MS, 4_000),
  upstreamRetries: entero(process.env.UPSTREAM_RETRIES, 1),
  requestDeadlineMs: entero(process.env.REQUEST_DEADLINE_MS, 8_000),
  rateLimit: {
    windowMs: entero(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: entero(process.env.RATE_LIMIT_MAX, 30),
  },
  rateLimitSetup: {
    windowMs: entero(process.env.RATE_LIMIT_SETUP_WINDOW_MS, 60_000),
    max: entero(process.env.RATE_LIMIT_SETUP_MAX, 20),
  },
  sesionMaxAgeMs: entero(process.env.SESSION_MAX_AGE_MS, 30 * 24 * 60 * 60 * 1000),
};

config.produccion = config.nodeEnv === "production";

module.exports = config;
