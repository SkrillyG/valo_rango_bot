"use strict";

const config = require("./src/config");
const logger = require("./src/logger");
const db = require("./src/db");
const { crearApp } = require("./src/server");

function validarConfig() {
  const faltan = [];
  if (!config.databaseUrl) faltan.push("DATABASE_URL");
  if (!config.encryptionKey) faltan.push("ENCRYPTION_KEY");
  if (!config.sessionSecret) faltan.push("SESSION_SECRET");
  if (!config.twitch.clientId) faltan.push("TWITCH_CLIENT_ID");
  if (!config.twitch.clientSecret) faltan.push("TWITCH_CLIENT_SECRET");

  if (faltan.length) {
    console.error(`[ERROR] Faltan variables de entorno obligatorias: ${faltan.join(", ")}`);
    console.error("        Copia .env.example a .env (local) o defines las variables en Render.");
    process.exit(1);
  }

  if (config.encryptionKey.length < 16) {
    console.error("[ERROR] ENCRYPTION_KEY es demasiado corta: usa al menos 16 caracteres aleatorios.");
    process.exit(1);
  }

  if (!config.baseUrlEsFijo) {
    console.warn("[WARN] BASE_URL no esta definida: se usara el host de cada peticion.");
  }
}

async function arrancar() {
  validarConfig();

  db.init(config);
  await db.preparar();
  logger.info("base de datos lista", { url: config.databaseUrl.replace(/:[^:@/]*@/, ":****@") });

  const app = crearApp(config);
  const servidor = app.listen(config.puerto, "0.0.0.0", () => {
    logger.info(`servidor escuchando en ${config.puerto}`, { baseUrl: config.baseUrl });
  });

  const cerrar = async (senal) => {
    logger.info(`cerrando por ${senal}`);
    servidor.close(async () => {
      await db.cerrar();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8_000).unref();
  };

  process.on("SIGTERM", () => cerrar("SIGTERM"));
  process.on("SIGINT", () => cerrar("SIGINT"));
}

arrancar().catch((error) => {
  console.error("[ERROR] no se pudo arrancar el servicio:", error.message);
  process.exit(1);
});
