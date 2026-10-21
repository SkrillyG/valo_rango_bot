"use strict";

const axios = require("axios");

const AUTORIZACION = "https://id.twitch.tv/oauth2/authorize";
const TOKEN = "https://id.twitch.tv/oauth2/token";
const VALIDAR = "https://id.twitch.tv/oauth2/validate";

const SCOPES = ["user:read:email"];
const TIMEOUT = 8_000;

function urlAutorizacion({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    force_verify: "true",
  });
  return `${AUTORIZACION}?${params.toString()}`;
}

async function canjearCodigo({ code, redirectUri, clientId, clientSecret }) {
  const cuerpo = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const respuesta = await axios.post(TOKEN, cuerpo.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: TIMEOUT,
  });
  const token = respuesta.data && respuesta.data.access_token;
  if (!token) throw new Error("Twitch no devolvio access_token");
  return token;
}

async function validarToken(accessToken) {
  const respuesta = await axios.get(VALIDAR, {
    headers: { Authorization: `OAuth ${accessToken}` },
    timeout: TIMEOUT,
  });
  const datos = respuesta.data || {};
  if (!datos.user_id) throw new Error("Twitch no devolvio user_id");
  return {
    id: String(datos.user_id),
    login: String(datos.login || "").toLowerCase(),
    displayName: String(datos.display_name || datos.login || ""),
  };
}

module.exports = { urlAutorizacion, canjearCodigo, validarToken, SCOPES };
