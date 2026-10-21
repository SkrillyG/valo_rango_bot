"use strict";

const { REGIONES, PLATAFORMAS, IDIOMAS } = require("./messages");

function escapar(texto) {
  return String(texto === undefined || texto === null ? "" : texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ESTILOS = `
:root{--bg:#0d1117;--panel:#161b22;--panel2:#1c2330;--line:#2b3441;--text:#e6edf3;--muted:#9aa7b4;--accent:#ff4655;--ok:#3fb950;--warn:#d29922}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 80px}
header.brand{display:flex;align-items:center;gap:12px;margin-bottom:8px}
header.brand .logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--accent),#ff7a5c);display:grid;place-items:center;font-weight:700}
header.brand h1{font-size:20px;margin:0;letter-spacing:.2px}
.sub{color:var(--muted);margin:0 0 26px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:18px}
.card h2{font-size:15px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);margin:0 0 14px}
label{display:block;font-size:13px;color:var(--muted);margin:0 0 6px}
input,select{width:100%;padding:10px 12px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-size:15px;font-family:inherit}
input:focus,select:focus{outline:2px solid var(--accent);outline-offset:1px}
.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.field{margin-bottom:14px}
.btn{display:inline-block;padding:11px 18px;border-radius:9px;border:1px solid transparent;background:var(--accent);color:#fff;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
.btn:hover{filter:brightness(1.08)}
.btn.sec{background:transparent;border-color:var(--line);color:var(--text)}
.btn.danger{background:transparent;border-color:#7d2b33;color:#ff8b95}
.btn.twitch{background:#9146ff}
code,pre,.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{background:#0b0f14;border:1px solid var(--line);border-radius:10px;padding:13px 15px;overflow-x:auto;font-size:13.5px;white-space:pre-wrap;word-break:break-all;margin:0 0 10px}
.tag{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;border:1px solid var(--line);color:var(--muted);margin-right:6px}
.tag.ok{color:var(--ok);border-color:#1d4429}
.tag.warn{color:var(--warn);border-color:#4d3a12}
.alert{border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:14.5px}
.alert.ok{background:#0f2c17;border:1px solid #1d4429;color:#8ee29a}
.alert.warn{background:#2a2410;border:1px solid #4d3a12;color:#e3c778}
.alert.err{background:#2c1418;border:1px solid #7d2b33;color:#ff8b95}
.muted{color:var(--muted)}
.small{font-size:13.5px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.copy{position:relative}
.copy button{position:absolute;right:8px;top:8px;padding:4px 10px;font-size:12px;border-radius:7px;border:1px solid var(--line);background:var(--panel2);color:var(--muted);cursor:pointer}
.steps{counter-reset:paso;list-style:none;padding:0;margin:0}
.steps li{counter-increment:paso;margin-bottom:12px;padding-left:34px;position:relative}
.steps li::before{content:counter(paso);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--panel2);border:1px solid var(--line);display:grid;place-items:center;font-size:13px;color:var(--muted)}
footer{color:var(--muted);font-size:13px;text-align:center;margin-top:34px}
`;

function layout({ titulo, cuerpo }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(titulo)} - ValoRangoBot</title>
<style>${ESTILOS}</style>
</head>
<body>
<div class="wrap">
<header class="brand">
  <div class="logo">V</div>
  <h1>ValoRangoBot</h1>
</header>
${cuerpo}
<footer>API publica de rangos de Valorant para comandos de Nightbot y StreamElements.</footer>
</div>
</body>
</html>`;
}

function inicio({ baseUrl }) {
  return layout({
    titulo: "Inicio",
    cuerpo: `
<p class="sub">Rangos de Valorant para el chat de Twitch, con tu propia key y tu propio comando.</p>
<div class="card">
  <h2>Como usarlo</h2>
  <ol class="steps">
    <li>Entra en <a href="${escapar(baseUrl)}/setup">${escapar(baseUrl)}/setup</a> e inicia sesion con Twitch.</li>
    <li>Pega tu key del proveedor de rangos, tu Riot ID y tu region.</li>
    <li>Copia el comando que te da la pagina y pegalo en el chat de tu canal.</li>
  </ol>
  <a class="btn" href="${escapar(baseUrl)}/setup">Configurar mi bot</a>
</div>
<div class="card">
  <h2>Como funciona</h2>
  <p class="small muted">Tu bot (Nightbot o StreamElements) llama a <code>/rank</code> con tu token y muestra en el chat lo que devuelve esta API: texto plano, corto y siempre con tu nombre.</p>
</div>`,
  });
}

function opcion(valor, texto, seleccionado) {
  return `<option value="${escapar(valor)}"${valor === seleccionado ? " selected" : ""}>${escapar(texto)}</option>`;
}

function selectorRegion(seleccionado) {
  return REGIONES.map((r) => opcion(r, r.toUpperCase(), seleccionado)).join("");
}

function selectorPlataforma(seleccionado) {
  const etiquetas = { pc: "PC", console: "Consola", ps: "PlayStation" };
  return PLATAFORMAS.map((p) => opcion(p, etiquetas[p] || p, seleccionado)).join("");
}

function selectorIdioma(seleccionado) {
  const etiquetas = { es: "Espanol", en: "English" };
  return IDIOMAS.map((i) => opcion(i, etiquetas[i], seleccionado)).join("");
}

function bloqueComando(titulo, texto, copiable = true) {
  return `
  <h2>${escapar(titulo)}</h2>
  <div class="copy">
    <pre id="${escapar(titulo)}">${escapar(texto)}</pre>
    ${copiable ? `<button type="button" onclick="copiar('${escapar(titulo)}')">Copiar</button>` : ""}
  </div>`;
}

function paginaSetup({ baseUrl, streamer, configurado, token, error, aviso, comandos, comandosEnmascarados }) {
  const cuerpo = [];

  if (error) cuerpo.push(`<div class="alert err">${escapar(error)}</div>`);
  if (aviso) cuerpo.push(`<div class="alert warn">${escapar(aviso)}</div>`);

  if (!streamer) {
    cuerpo.push(`
<div class="card">
  <h2>Paso 1 - Identificate</h2>
  <p class="small muted">Cada streamer usa su propia configuracion, su propia key y su propio comando. Para empezar, inicia sesion con Twitch: solo asi sabemos que canal es el tuyo.</p>
  <a class="btn twitch" href="/auth/login">Iniciar sesion con Twitch</a>
</div>`);
    return layout({ titulo: "Configuracion", cuerpo: cuerpo.join("\n") });
  }

  if (token) {
    cuerpo.push(`
<div class="alert ok">
  <strong>Guardado.</strong> Copia ahora tu comando: el token solo se muestra una vez. Si lo pierdes, puedes regenerarlo cuando quieras.
</div>
<div class="card">
  ${bloqueComando("Nightbot", comandos.nightbot)}
  ${bloqueComando("StreamElements", comandos.streamelements)}
  <p class="small muted">Pega el comando en el chat de tu canal (los moderadores pueden escribirlo en su propio chat para crearlo).</p>
</div>`);
  } else if (configurado) {
    cuerpo.push(`
<div class="card">
  <h2>Tu comando</h2>
  <p class="small muted">Tu configuracion esta guardada. El token ya fue entregado, asi que aqui solo se muestra enmascarado. Si no lo guardaste, regenera el token para volver a ver los comandos.</p>
  <pre>${escapar(comandosEnmascarados.nightbot)}</pre>
  <pre>${escapar(comandosEnmascarados.streamelements)}</pre>
  <form method="post" action="/setup/token" onsubmit="return confirm('El token actual dejara de funcionar. Continuar?')">
    <button class="btn sec" type="submit">Regenerar token</button>
  </form>
</div>`);
  }

  cuerpo.push(`
<div class="card">
  <h2>Tu canal</h2>
  <p class="small"><span class="tag ok">${escapar(streamer.twitch_login)}</span> <span class="tag ${configurado ? "ok" : "warn"}">${configurado ? "configurado" : "sin configurar"}</span></p>
  <form method="post" action="/auth/logout"><button class="btn sec" type="submit">Cerrar sesion</button></form>
</div>

<div class="card">
  <h2>Configuracion</h2>
  <form method="post" action="/setup">
    <div class="field">
      <label for="api_key">Key del proveedor de rangos</label>
      <input id="api_key" name="api_key" type="password" autocomplete="off" placeholder="${configurado ? "Key guardada. Dejalo vacio para no cambiarla" : "Pega aqui tu key"}">
      <p class="small muted">Se guarda cifrada y nunca se muestra otra vez. Se usa solo para consultar tu rango.</p>
    </div>
    <div class="grid">
      <div class="field">
        <label for="riot_name">Riot ID (nombre)</label>
        <input id="riot_name" name="riot_name" value="${escapar(streamer.riot_name || "")}" placeholder="nombre" required>
      </div>
      <div class="field">
        <label for="riot_tag">Riot ID (tag)</label>
        <input id="riot_tag" name="riot_tag" value="${escapar(streamer.riot_tag || "")}" placeholder="tag" required>
      </div>
    </div>
    <div class="grid">
      <div class="field">
        <label for="region">Region</label>
        <select id="region" name="region">${selectorRegion(streamer.region || "eu")}</select>
      </div>
      <div class="field">
        <label for="platform">Plataforma</label>
        <select id="platform" name="platform">${selectorPlataforma(streamer.platform || "pc")}</select>
      </div>
      <div class="field">
        <label for="lang">Idioma del chat</label>
        <select id="lang" name="lang">${selectorIdioma(streamer.lang || "es")}</select>
      </div>
    </div>
    <button class="btn" type="submit">${configurado ? "Guardar cambios" : "Guardar y generar mi comando"}</button>
  </form>
</div>

<div class="card">
  <h2>Zona sensible</h2>
  <p class="small muted">El token va dentro de la URL del comando, asi que los moderadores de tu canal pueden verlo en el panel de Nightbot o StreamElements. Si se filtra, regenera el token: el anterior deja de funcionar al instante.</p>
</div>

<div class="card">
  <h2>Borrar mis datos</h2>
  <p class="small muted">Se elimina tu configuracion, tu key y tu token. El comando !rank dejara de funcionar.</p>
  <form method="post" action="/setup/delete" onsubmit="return confirm('Se borraran todos tus datos. Continuar?')">
    <button class="btn danger" type="submit">Borrar todos mis datos</button>
  </form>
</div>

<script>
function copiar(id){
  const nodo = document.getElementById(id);
  if(!nodo) return;
  navigator.clipboard.writeText(nodo.textContent).then(()=>{
    const boton = nodo.parentElement.querySelector('button');
    const original = boton.textContent;
    boton.textContent = 'Copiado';
    setTimeout(()=>{boton.textContent = original;},1200);
  });
}
</script>`);

  return layout({ titulo: "Configuracion", cuerpo: cuerpo.join("\n") });
}

function paginaSimple(titulo, mensaje) {
  return layout({
    titulo,
    cuerpo: `<div class="card"><h2>${escapar(titulo)}</h2><p class="small">${escapar(mensaje)}</p><p><a class="btn sec" href="/setup">Volver a la configuracion</a></p></div>`,
  });
}

module.exports = { escapar, layout, inicio, paginaSetup, paginaSimple };
