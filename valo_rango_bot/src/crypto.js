"use strict";

const crypto = require("crypto");

const VERSION = "v1";
const SALT = "valo-rango-bot.keys.v1";

let claveCache = null;

function derivarClave(material) {
  if (!material) throw new Error("ENCRYPTION_KEY no configurada");
  return crypto.scryptSync(String(material), SALT, 32);
}

function clave(material) {
  if (!claveCache) claveCache = derivarClave(material);
  return claveCache;
}

function cifrar(texto, material) {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv("aes-256-gcm", clave(material), iv);
  const datos = Buffer.concat([cifrador.update(String(texto), "utf8"), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), datos.toString("base64")].join(".");
}

function descifrar(payload, material) {
  const partes = String(payload || "").split(".");
  if (partes.length !== 4 || partes[0] !== VERSION) throw new Error("formato cifrado invalido");
  const decipher = crypto.createDecipheriv("aes-256-gcm", clave(material), Buffer.from(partes[1], "base64"));
  decipher.setAuthTag(Buffer.from(partes[2], "base64"));
  return Buffer.concat([decipher.update(Buffer.from(partes[3], "base64")), decipher.final()]).toString("utf8");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

function generarToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function aleatorio(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function compararSeguro(a, b) {
  const bufferA = Buffer.from(String(a === undefined || a === null ? "" : a), "utf8");
  const bufferB = Buffer.from(String(b === undefined || b === null ? "" : b), "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

module.exports = { cifrar, descifrar, hashToken, generarToken, aleatorio, compararSeguro };
