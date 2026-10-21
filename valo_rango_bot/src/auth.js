"use strict";

const express = require("express");
const crypto = require("./crypto");
const twitch = require("./twitch");
const logger = require("./logger");
const { urlCallback } = require("./urls");

function crearRouter(config) {
  const router = express.Router();

  router.get("/auth/login", (req, res) => {
    if (!config.twitch.clientId || !config.twitch.clientSecret) {
      return res.status(503).type("text/plain").send("El login con Twitch no esta configurado en el servidor.");
    }
    const state = crypto.aleatorio(24);
    req.session.oauthState = state;
    res.redirect(
      twitch.urlAutorizacion({
        clientId: config.twitch.clientId,
        redirectUri: urlCallback(config, req),
        state,
      })
    );
  });

  router.get("/auth/callback", async (req, res) => {
    const esperado = req.session.oauthState;
    delete req.session.oauthState;
    const recibido = typeof req.query.state === "string" ? req.query.state : "";

    if (!esperado || !crypto.compararSeguro(esperado, recibido)) {
      logger.warn("callback de Twitch con state invalido");
      req.session.flashError = "No se pudo validar la sesion de Twitch. Intenta de nuevo.";
      return res.redirect("/setup");
    }

    if (typeof req.query.error === "string") {
      req.session.flashError = "Twitch cancelo el inicio de sesion.";
      return res.redirect("/setup");
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) {
      req.session.flashError = "Twitch no devolvio el codigo de autorizacion.";
      return res.redirect("/setup");
    }

    try {
      const accessToken = await twitch.canjearCodigo({
        code,
        redirectUri: urlCallback(config, req),
        clientId: config.twitch.clientId,
        clientSecret: config.twitch.clientSecret,
      });
      const usuario = await twitch.validarToken(accessToken);
      req.session.twitch = { id: usuario.id, login: usuario.login, displayName: usuario.displayName };
      req.session.flashAviso = `Sesion iniciada como ${usuario.login}.`;
    } catch (error) {
      logger.error("fallo el login con Twitch", error.message);
      req.session.flashError = "No se pudo iniciar sesion con Twitch. Intenta de nuevo.";
    }

    res.redirect("/setup");
  });

  router.post("/auth/logout", (req, res) => {
    req.session = null;
    res.redirect("/setup");
  });

  return router;
}

module.exports = { crearRouter };
