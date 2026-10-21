"use strict";

const NIVELES = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 };

const NIVEL_MINIMO = process.env.LOG_LEVEL ? NIVELES[process.env.LOG_LEVEL.toUpperCase()] || NIVELES.INFO : NIVELES.INFO;

const SECRETO = /(token|key|secret|password|authorization)=([^&\s"']+)/gi;

function redactar(texto) {
  return String(texto).replace(SECRETO, "$1=[REDACTADO]");
}

function log(nivel, mensaje, extra) {
  if ((NIVELES[nivel] || NIVELES.INFO) < NIVEL_MINIMO) return;
  const extras = extra === undefined ? "" : ` ${redactar(safe(extra))}`;
  console.log(`[${new Date().toISOString()}] ${nivel} ${redactar(mensaje)}${extras}`);
}

function safe(valor) {
  if (valor instanceof Error) return valor.message;
  if (typeof valor === "object" && valor !== null) {
    try {
      return JSON.stringify(valor);
    } catch {
      return String(valor);
    }
  }
  return String(valor);
}

module.exports = {
  log,
  debug: (m, e) => log("DEBUG", m, e),
  info: (m, e) => log("INFO", m, e),
  warn: (m, e) => log("WARN", m, e),
  error: (m, e) => log("ERROR", m, e),
  redactar,
};
