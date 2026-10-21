"use strict";

const config = require("./src/config");
const logger = require("./src/logger");
const db = require("./src/db");
const { crearApp } = require("./src/server");

function validarConfig() {
  if (config.faltantes.length) {
    console.error(`[ERROR] Variables de entorno obligatorias ausentes: ${config.faltantes.join(", ")}`);
    console.error("        El servicio arranca en modo degradado: no se podran guardar configuraciones.");
    console.error("        Copia .env.example a .env (local) o defines las variables en Render.");
  }
  if (config.encryptionKey && !config.encryptionKeyValida) {
    console.error("[ERROR] ENCRYPTION_KEY es demasiado corta: usa al menos 16 caracteres aleatorios.");
  }
  if (!config.baseUrlEsFijo) {
    console.warn("[WARN] BASE_URL no esta definida: se usara el host de cada peticion.");
  }
}

async function arrancar() {
  validarConfig();

  if (config.databaseUrl) {
    try {
      db.init(config);
      await db.preparar();
      logger.info("base de datos lista", { url: config.databaseUrl.replace(/:[^:@/]*@/, ":****@") });
    } catch (error) {
      logger.error("no se pudo preparar la base de datos", error.message);
      await db.cerrar();
    }
  } else {
    logger.error("sin DATABASE_URL: el servicio arranca sin persistencia");
  }

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
