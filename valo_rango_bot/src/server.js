"use strict";

const express = require("express");
const cookieSession = require("cookie-session");
const db = require("./db");
const logger = require("./logger");
const views = require("./views");
const auth = require("./auth");
const setup = require("./setup");
const rank = require("./rank");
const crypto = require("./crypto");
const { Ventana } = require("./ratelimit");
const { baseUrl } = require("./urls");

function crearApp(config) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  const claveSesion = config.sessionSecret || crypto.aleatorio(32);

  app.use(express.urlencoded({ extended: false, limit: "16kb" }));

  app.use(
    cookieSession({
      name: "vr.sesion",
      keys: [claveSesion],
      maxAge: config.sesionMaxAgeMs,
      httpOnly: true,
      sameSite: "lax",
      secure: config.produccion,
    })
  );

  const limiteSetup = new Ventana(config.rateLimitSetup.windowMs, config.rateLimitSetup.max);

  app.use((req, res, next) => {
    if (!req.path.startsWith("/setup") && !req.path.startsWith("/auth")) return next();
    const ip = req.ip || "desconocida";
    const permiso = limiteSetup.permitir(ip);
    if (!permiso.permitido) {
      res.status(429).type("text/plain").send("Demasiadas peticiones a la configuracion. Espera un momento.");
      return;
    }
    next();
  });

  app.get("/", (req, res) => {
    res.type("html").send(
      views.inicio({ baseUrl: baseUrl(config, req), faltantes: config.faltantes })
    );
  });

  app.get("/health", async (req, res) => {
    let baseDeDatos = false;
    try {
      await db.contar();
      baseDeDatos = true;
    } catch (error) {
      logger.error("health: base de datos no disponible", error.message);
    }
    res.status(200).json({
      ok: baseDeDatos && !config.degradado,
      baseDeDatos,
      degradado: config.degradado,
      faltantes: config.faltantes,
      servicio: "valo-rango-bot",
      uptimeSeg: Math.round(process.uptime()),
      twitchConfigurado: Boolean(config.twitch.clientId && config.twitch.clientSecret),
    });
  });

  app.use(auth.crearRouter(config));
  app.use(setup.crearRouter(config));
  app.use(rank.crearRouter(config));

  app.use((req, res) => {
    res.status(404).type("text/plain").send("404 - ruta no encontrada");
  });

  app.use((error, req, res, next) => {
    logger.error("fallo no controlado", error.message);
    res.status(500).type("text/plain").send("No se pudo obtener el rango, intenta de nuevo.");
  });

  return app;
}

module.exports = { crearApp };
