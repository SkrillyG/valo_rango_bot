"use strict";

const http = require("http");
const assert = require("assert");

const PUERTO_APP = 3998;
const PUERTO_PROVEEDOR = 3999;
const BASE = `http://127.0.0.1:${PUERTO_APP}`;
const KEY_PRUEBA = "key-de-prueba-1234567890";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://localhost/valo_prueba";
process.env.ENCRYPTION_KEY = "clave-de-cifrado-de-prueba-1234567890";
process.env.SESSION_SECRET = "secreto-de-sesion-de-prueba-1234567890";
process.env.TWITCH_CLIENT_ID = "client-id-de-prueba";
process.env.TWITCH_CLIENT_SECRET = "client-secret-de-prueba";
process.env.BASE_URL = BASE;
process.env.HENRIK_API_BASE = `http://127.0.0.1:${PUERTO_PROVEEDOR}`;
process.env.RATE_LIMIT_MAX = "8";
process.env.RATE_LIMIT_SETUP_MAX = "200";

const config = require("../src/config");
const db = require("../src/db");
const twitch = require("../src/twitch");
const { crearApp } = require("../src/server");

const USUARIOS = {
  kira: { id: "111", login: "kira", displayName: "Kira" },
  malo: { id: "222", login: "malo", displayName: "Malo" },
  fantasma: { id: "333", login: "fantasma", displayName: "Fantasma" },
  ingles: { id: "444", login: "english", displayName: "English" },
};

twitch.canjearCodigo = async ({ code }) => `token-falso-${code}`;
twitch.validarToken = async (accessToken) => {
  const code = String(accessToken).replace("token-falso-", "");
  const usuario = USUARIOS[code];
  if (!usuario) throw new Error("usuario desconocido");
  return usuario;
};

let pruebas = 0;
let fallos = 0;

function comprobar(titulo, condicion, detalle) {
  pruebas += 1;
  if (condicion) {
    console.log(`  ok  ${titulo}`);
    return;
  }
  fallos += 1;
  console.log(`  FALLO ${titulo}${detalle ? ` -> ${detalle}` : ""}`);
}

function crearJar() {
  const cookies = new Map();
  return {
    async pedir(url, opciones = {}) {
      const headers = Object.assign({}, opciones.headers || {});
      if (cookies.size) headers.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
      const respuesta = await fetch(url, Object.assign({}, opciones, { headers, redirect: "manual" }));
      for (const cruda of respuesta.headers.getSetCookie()) {
        const par = cruda.split(";")[0];
        const sep = par.indexOf("=");
        const nombre = par.slice(0, sep).trim();
        const valor = par.slice(sep + 1).trim();
        if (valor === "") cookies.delete(nombre);
        else cookies.set(nombre, valor);
      }
      return respuesta;
    },
  };
}

async function proveedor() {
  return new Promise((resolve) => {
    const servidor = http.createServer((req, res) => {
      if (req.headers.authorization !== KEY_PRUEBA) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: 401, errors: ["Unauthorized"] }));
        return;
      }
      if (req.url.includes("/macarrones/pato")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ data: { current: { tier: { name: "Diamond 2" }, rr: 45 } } }));
        return;
      }
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: 404, errors: ["Not Found"] }));
    });
    servidor.listen(PUERTO_PROVEEDOR, "127.0.0.1", () => resolve(servidor));
  });
}

async function iniciarSesion(jar, codigo) {
  const login = await jar.pedir(`${BASE}/auth/login`);
  const destino = login.headers.get("location");
  const state = new URL(destino).searchParams.get("state");
  await jar.pedir(`${BASE}/auth/callback?code=${codigo}&state=${state}`);
}

async function guardar(jar, { apiKey = KEY_PRUEBA, riotName = "macarrones", riotTag = "pato", lang = "es" } = {}) {
  const cuerpo = new URLSearchParams({
    api_key: apiKey,
    riot_name: riotName,
    riot_tag: riotTag,
    region: "eu",
    platform: "pc",
    lang,
  });
  await jar.pedir(`${BASE}/setup`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: cuerpo.toString(),
  });
  const pagina = await jar.pedir(`${BASE}/setup`);
  const html = await pagina.text();
  const found = html.match(/token=([A-Za-z0-9_-]{20,})/);
  return found ? found[1] : null;
}

async function principal() {
  const servidorProveedor = await proveedor();

  const { newDb } = require("pg-mem");
  const memoria = newDb();
  const { Pool } = memoria.adapters.createPg();
  const pool = new Pool();
  db.init(config, pool);
  await db.preparar();

  const app = crearApp(config);
  const servidor = app.listen(PUERTO_APP, "127.0.0.1");

  try {
    console.log("\n1. Configuracion del streamer");
    const jar = crearJar();
    const paginaInicial = await jar.pedir(`${BASE}/setup`);
    const htmlInicial = await paginaInicial.text();
    comprobar("sin sesion se ofrece iniciar sesion con Twitch", htmlInicial.includes("Iniciar sesion con Twitch"));
    comprobar("sin sesion no se muestra ninguna key", !htmlInicial.includes(KEY_PRUEBA));

    await iniciarSesion(jar, "kira");
    const paginaSesion = await jar.pedir(`${BASE}/setup`);
    const htmlSesion = await paginaSesion.text();
    comprobar("tras iniciar sesion aparece el canal", htmlSesion.includes("kira"));
    comprobar("la key nunca se muestra", !htmlSesion.includes(KEY_PRUEBA));

    const token = await guardar(jar);
    comprobar("el setup genera un token", Boolean(token));

    const paginaToken = await jar.pedir(`${BASE}/setup`);
    const htmlToken = await paginaToken.text();
    comprobar("se entrega el comando de Nightbot", htmlToken.includes("!commands add !rank $(urlfetch"));
    comprobar("se entrega el comando de StreamElements", htmlToken.includes("!command add !rank $(customapi"));
    comprobar("el token aparece una sola vez en la pagina", (htmlToken.match(new RegExp(token, "g")) || []).length <= 2);
    comprobar("la key no aparece en los comandos", !htmlToken.includes(KEY_PRUEBA));

    console.log("\n2. Respuesta del endpoint /rank");
    const rango = await fetch(`${BASE}/rank?token=${token}`);
    const texto = await rango.text();
    comprobar("responde 200", rango.status === 200);
    comprobar("responde en texto plano", (rango.headers.get("content-type") || "").includes("text/plain"));
    comprobar("usa el nombre del streamer", texto === "Rango de Kira: Diamond 2 (45 RR)", texto);
    comprobar("no empieza por / . ni !", !/^[./!]/.test(texto), texto);
    comprobar("no filtra la key", !texto.includes(KEY_PRUEBA));
    comprobar("no filtra el token", !texto.includes(token));
    comprobar("es corto (<400 caracteres)", texto.length < 400, `${texto.length}`);

    const invalido = await fetch(`${BASE}/rank?token=token-que-no-existe`);
    const textoInvalido = await invalido.text();
    comprobar("token invalido -> mensaje de configuracion", textoInvalido === "Configuración no encontrada. Revisa tu comando.", textoInvalido);
    comprobar("token invalido responde 200", invalido.status === 200);

    const sinToken = await fetch(`${BASE}/rank`);
    const textoSinToken = await sinToken.text();
    comprobar("sin token -> mensaje de configuracion", textoSinToken === "Configuración no encontrada. Revisa tu comando.", textoSinToken);

    console.log("\n3. Errores del proveedor");
    const jarMalo = crearJar();
    await iniciarSesion(jarMalo, "malo");
    const tokenMalo = await guardar(jarMalo, { apiKey: "key-invalida-999999" });
    const rangoMalo = await fetch(`${BASE}/rank?token=${tokenMalo}`);
    const textoMalo = await rangoMalo.text();
    comprobar("key invalida -> mensaje claro", textoMalo === "La key del proveedor no es válida. Revisa tu configuración.", textoMalo);

    const jarFantasma = crearJar();
    await iniciarSesion(jarFantasma, "fantasma");
    const tokenFantasma = await guardar(jarFantasma, { riotName: "noexiste999" });
    const rangoFantasma = await fetch(`${BASE}/rank?token=${tokenFantasma}`);
    const textoFantasma = await rangoFantasma.text();
    comprobar("jugador inexistente -> mensaje de Riot ID", textoFantasma === "No se encontró el jugador. Revisa tu Riot ID.", textoFantasma);

    console.log("\n4. Idioma ingles");
    const jarIngles = crearJar();
    await iniciarSesion(jarIngles, "ingles");
    const tokenIngles = await guardar(jarIngles, { lang: "en" });
    const rangoIngles = await fetch(`${BASE}/rank?token=${tokenIngles}`);
    const textoIngles = await rangoIngles.text();
    comprobar("mensaje en ingles con posesivo", textoIngles === "English's current rank is: Diamond 2 (45 RR)", textoIngles);

    console.log("\n5. Regenerar y borrar token");
    await jar.pedir(`${BASE}/setup/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
    const paginaNuevo = await jar.pedir(`${BASE}/setup`);
    const htmlNuevo = await paginaNuevo.text();
    const tokenNuevo = (htmlNuevo.match(/token=([A-Za-z0-9_-]{20,})/) || [])[1];
    comprobar("se genera un token nuevo", Boolean(tokenNuevo) && tokenNuevo !== token);
    const conTokenViejo = await fetch(`${BASE}/rank?token=${token}`);
    comprobar("el token anterior deja de funcionar", (await conTokenViejo.text()) === "Configuración no encontrada. Revisa tu comando.");

    await jar.pedir(`${BASE}/setup/delete`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    });
    const conTokenBorrado = await fetch(`${BASE}/rank?token=${tokenNuevo}`);
    comprobar("al borrar los datos el comando deja de funcionar", (await conTokenBorrado.text()) === "Configuración no encontrada. Revisa tu comando.");
    const restantes = await db.porTwitchId("111");
    comprobar("la configuracion de ese streamer desaparece", restantes === null);

    console.log("\n6. Limite de peticiones");
    const jarLimite = crearJar();
    await iniciarSesion(jarLimite, "kira");
    const tokenLimite = await guardar(jarLimite);
    let ultimo = "";
    for (let i = 0; i < 10; i += 1) {
      const respuesta = await fetch(`${BASE}/rank?token=${tokenLimite}`);
      ultimo = await respuesta.text();
    }
    comprobar("se bloquea tras superar el limite", ultimo === "Demasiadas peticiones, espera un momento.", ultimo);

    console.log("\n7. Salud del servicio");
    const salud = await fetch(`${BASE}/health`);
    const jsonSalud = await salud.json();
    comprobar("health responde ok", jsonSalud.ok === true);
    comprobar("health no filtra secretos", !JSON.stringify(jsonSalud).includes(KEY_PRUEBA));
  } finally {
    servidor.close();
    servidorProveedor.close();
    await db.cerrar();
  }

  console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
  if (fallos) process.exit(1);
}

principal().catch((error) => {
  console.error("fallo del smoke test:", error);
  process.exit(1);
});
