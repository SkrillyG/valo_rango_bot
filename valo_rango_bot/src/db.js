"use strict";

const { Pool } = require("pg");

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS streamers (
  twitch_id            TEXT PRIMARY KEY,
  twitch_login         TEXT NOT NULL,
  twitch_display_name  TEXT NOT NULL DEFAULT '',
  token_hash           TEXT NOT NULL UNIQUE,
  api_key_cifrada      TEXT NOT NULL,
  riot_name            TEXT NOT NULL,
  riot_tag             TEXT NOT NULL,
  region               TEXT NOT NULL DEFAULT 'eu',
  platform             TEXT NOT NULL DEFAULT 'pc',
  lang                 TEXT NOT NULL DEFAULT 'es',
  creado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS streamers_token_hash_idx ON streamers (token_hash);
`;

let pool = null;

function init(config, poolExistente) {
  if (poolExistente) {
    pool = poolExistente;
    return pool;
  }
  if (!config.databaseUrl) throw new Error("DATABASE_URL no configurada");
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  if (typeof pool.on === "function") {
    pool.on("error", (error) => {
      console.error("[ERROR] pool de PostgreSQL:", error.message);
    });
  }
  return pool;
}

async function preparar() {
  if (!pool) throw new Error("pool de PostgreSQL no inicializado");
  await pool.query(ESQUEMA);
}

async function consultar(texto, valores) {
  if (!pool) throw new Error("pool de PostgreSQL no inicializado");
  return pool.query(texto, valores);
}

const CAMPOS =
  "twitch_id, twitch_login, twitch_display_name, token_hash, api_key_cifrada, riot_name, riot_tag, region, platform, lang, creado_en, actualizado_en";

async function porTokenHash(hash) {
  const { rows } = await consultar(`SELECT ${CAMPOS} FROM streamers WHERE token_hash = $1`, [hash]);
  return rows[0] || null;
}

async function porTwitchId(twitchId) {
  const { rows } = await consultar(`SELECT ${CAMPOS} FROM streamers WHERE twitch_id = $1`, [twitchId]);
  return rows[0] || null;
}

async function guardar(streamer) {
  const cliente = await porTwitchId(streamer.twitch_id);
  if (cliente) {
    const { rows } = await consultar(
      `UPDATE streamers
         SET twitch_login = $2,
             twitch_display_name = $3,
             token_hash = $4,
             api_key_cifrada = $5,
             riot_name = $6,
             riot_tag = $7,
             region = $8,
             platform = $9,
             lang = $10,
             actualizado_en = NOW()
       WHERE twitch_id = $1
       RETURNING ${CAMPOS}`,
      [
        streamer.twitch_id,
        streamer.twitch_login,
        streamer.twitch_display_name,
        streamer.token_hash,
        streamer.api_key_cifrada,
        streamer.riot_name,
        streamer.riot_tag,
        streamer.region,
        streamer.platform,
        streamer.lang,
      ]
    );
    return rows[0];
  }

  const { rows } = await consultar(
    `INSERT INTO streamers
       (twitch_id, twitch_login, twitch_display_name, token_hash, api_key_cifrada, riot_name, riot_tag, region, platform, lang)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${CAMPOS}`,
    [
      streamer.twitch_id,
      streamer.twitch_login,
      streamer.twitch_display_name,
      streamer.token_hash,
      streamer.api_key_cifrada,
      streamer.riot_name,
      streamer.riot_tag,
      streamer.region,
      streamer.platform,
      streamer.lang,
    ]
  );
  return rows[0];
}

async function actualizarTokenHash(twitchId, tokenHash) {
  const { rows } = await consultar(
    `UPDATE streamers SET token_hash = $2, actualizado_en = NOW() WHERE twitch_id = $1 RETURNING ${CAMPOS}`,
    [twitchId, tokenHash]
  );
  return rows[0] || null;
}

async function eliminar(twitchId) {
  const { rowCount } = await consultar("DELETE FROM streamers WHERE twitch_id = $1", [twitchId]);
  return rowCount > 0;
}

async function contar() {
  const { rows } = await consultar("SELECT COUNT(*)::int AS total FROM streamers");
  return rows[0] ? rows[0].total : 0;
}

async function cerrar() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { init, preparar, porTokenHash, porTwitchId, guardar, actualizarTokenHash, eliminar, contar, cerrar };
