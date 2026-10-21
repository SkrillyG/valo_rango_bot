"use strict";

const LIMITE_CARACTERES = 380;

const REGIONES = ["eu", "na", "ap", "kr", "latam", "br"];
const PLATAFORMAS = ["pc", "console", "ps"];
const IDIOMAS = ["es", "en"];

function posesivo(nombre, lang) {
  const base = String(nombre || "");
  if (lang === "en") return base.endsWith("'") ? base : `${base}'s`;
  return `de ${base}`;
}

function sanitizarNombre(nombre) {
  return String(nombre || "")
    .replace(/[^\p{L}\p{N}_ .'-]/gu, "")
    .replace(/^[\s./!]+/, "")
    .trim()
    .slice(0, 40);
}

function sanitizarMensaje(texto) {
  let limpio = String(texto || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  while (/^[./!]/.test(limpio)) limpio = limpio.slice(1).trim();
  if (limpio.length > LIMITE_CARACTERES) limpio = limpio.slice(0, LIMITE_CARACTERES - 1).trim();
  return limpio;
}

function resolverUsername(streamer) {
  const candidatos = [streamer.twitch_display_name, streamer.twitch_login, streamer.riot_name];
  for (const candidato of candidatos) {
    const limpio = sanitizarNombre(candidato);
    if (limpio) return limpio;
  }
  return "jugador";
}

function idioma(streamer) {
  return IDIOMAS.includes(streamer.lang) ? streamer.lang : "es";
}

const PLANTILLAS = {
  es: {
    rango: "Rango de {username}: {rango} ({rr} RR)",
    rango_posesivo: "El rango {posesivo} {username} es {rango} ({rr} RR)",
  },
  en: {
    rango: "{posesivo} current rank is: {rango} ({rr} RR)",
    rango_posesivo: "{posesivo} current rank is: {rango} ({rr} RR)",
  },
};

function renderizar(plantilla, valores) {
  return plantilla.replace(/\{(\w+)\}/g, (_, nombre) =>
    valores[nombre] === undefined || valores[nombre] === null ? "" : String(valores[nombre])
  );
}

function mensajeRango(streamer, datos, estilo = "rango") {
  const lang = idioma(streamer);
  const username = resolverUsername(streamer);
  const plantilla = PLANTILLAS[lang][estilo] || PLANTILLAS[lang].rango;
  return sanitizarMensaje(
    renderizar(plantilla, {
      username,
      posesivo: posesivo(username, lang),
      rango: datos.rango,
      rr: datos.rr,
    })
  );
}

const ERRORES = {
  CONFIG_NO_ENCONTRADA: {
    es: "Configuración no encontrada. Revisa tu comando.",
    en: "Configuration not found. Check your command.",
  },
  FALTA_CONFIGURACION: {
    es: "Falta configurar el bot en {url}.",
    en: "Bot is not configured yet at {url}.",
  },
  JUGADOR_NO_ENCONTRADO: {
    es: "No se encontró el jugador. Revisa tu Riot ID.",
    en: "Player not found. Check your Riot ID.",
  },
  PROVEEDOR_ERROR: {
    es: "No se pudo obtener el rango, intenta de nuevo en un momento.",
    en: "Could not get the rank, try again in a moment.",
  },
  KEY_INVALIDA: {
    es: "La key del proveedor no es válida. Revisa tu configuración.",
    en: "The provider key is not valid. Check your setup.",
  },
  MUCHAS_PETICIONES: {
    es: "Demasiadas peticiones, espera un momento.",
    en: "Too many requests, wait a moment.",
  },
};

function mensajeError(codigo, { lang = "es", url = "" } = {}) {
  const plantilla = ERRORES[codigo] || ERRORES.PROVEEDOR_ERROR;
  const texto = renderizar(plantilla[IDIOMAS.includes(lang) ? lang : "es"], { url });
  return sanitizarMensaje(texto);
}

module.exports = {
  REGIONES,
  PLATAFORMAS,
  IDIOMAS,
  LIMITE_CARACTERES,
  posesivo,
  sanitizarNombre,
  sanitizarMensaje,
  resolverUsername,
  idioma,
  mensajeRango,
  mensajeError,
};
