# ValoRangoBot

API publica multi-streamer que devuelve el **rango de Valorant** (tier + RR) en texto plano,
pensada para consumirse desde **Nightbot** y **StreamElements** con un simple `!rank`.

Cada streamer tiene su propia configuracion (su propia API key del proveedor, su propio Riot ID
y su propio token de comando), pero todos comparten el mismo servicio desplegado.

- **Servicio en produccion:** https://valo-rango-bot.onrender.com
- **Repositorio:** https://github.com/SkrillyG/valo_rango_bot
- **Entrada unica:** `index.js` (`npm start`)

---

## 1. Como funciona

```
Streamer                Este servicio                    Proveedor
   |                        |                                |
   |  login Twitch  ------> |  OAuth (state firmado)         |
   |  pega su key  ------> |  key cifrada (AES-256-GCM)     |
   |  Riot ID + region --> |  fila en Postgres              |
   | <--- token + comando |                                |
   |                        |                                |
   |  !rank  --> Nightbot/StreamElements --> GET /rank?token=... |
   |                        |   valida token (hash)          |
   |                        |   descifra key del dueno       |
   |                        |   consulta MMR --------------> |
   |                        |   cachea 90 s por streamer     |
   | <-- "Rango de Kira: Diamante 2 (34 RR)"                 |
```

Claves y responsabilidades:

| Concepto | Quien lo tiene | Para que sirve |
|---|---|---|
| **API key de HenrikDev** | cada streamer, una por canal | consulta el MMR de ese streamer |
| **Token del bot** | cada streamer, uno por canal | se mete en la URL del comando de chat |
| **`ENCRYPTION_KEY`** | el servicio | cifra las API keys en la base de datos |
| **`SESSION_SECRET`** | el servicio | firma la cookie de sesion (login + formulario) |

El token **no** es la key: con el token el bot busca al dueno y usa la key que ese streamer
guardo. La key nunca viaja en la URL del comando ni se imprime en ninguna respuesta.

## 2. Rutas

| Ruta | Respuesta | Uso |
|---|---|---|
| `GET /rank?token=<token>` | Texto plano con el rango del dueno del token | Comando de chat (Nightbot / StreamElements) |
| `GET /rank?token=<token>&lang=es\|en` | Fuerza el idioma del mensaje | Igual que el anterior |
| `GET /rango?token=<token>` | Igual que `/rank` pero siempre en espanol | Alias en espanol |
| `GET /api/rank?token=<token>` | JSON `{ ok, twitch_login, riot_id, rango, rr, ... }` | Consumo programatico. Solo sirve el valor cacheado y nunca expone la key ni el token |
| `GET /setup` | Pagina de configuracion | Login Twitch + formulario |
| `GET /auth/login` | Redirige a Twitch | Boton "Conectar con Twitch" |
| `GET /auth/callback` | Callback OAuth de Twitch | **Registrar aqui la Redirect URL** |
| `GET /auth/logout` | Cierra la sesion | Boton "Salir" |
| `GET /health` | JSON de estado | Health check de Render, UptimeRobot |
| `GET /` | Portada con las instrucciones | Comprobacion rapida |

`/rank` y `/rango` devuelven **siempre HTTP 200** con `Content-Type: text/plain; charset=utf-8`.
Si algo falla se responde con un mensaje legible en lugar de un 4xx/5xx, porque el proxy de
StreamElements sustituye cualquier error por un texto generico que no dice nada.

Los mensajes nunca empiezan por `/`, `.` ni `!` y siempre miden menos de 400 caracteres
(Nightbot exige `< 400`; StreamElements trunca a 400 bytes).

### Mensajes que puede devolver

| Situacion | Mensaje (es) |
|---|---|
| Todo correcto | `Rango de Kira: Diamante 2 (34 RR)` |
| Token vacio o desconocido | `Configuracion no encontrada. Revisa tu comando.` |
| El streamer no ha metido su key | `Falta configurar el bot en https://.../setup.` |
| Riot ID no encontrado en el proveedor | `No se encontro el jugador. Revisa tu Riot ID.` |
| Proveedor caido, limite o key invalida | `No se pudo obtener el rango, intenta de nuevo en un momento.` |
| Demasiadas peticiones con el mismo token | `Demasiadas peticiones, espera un momento.` |

Con `lang=en` los mismos mensajes salen en ingles (`Kira's current rank is: Diamond 2 (34 RR)`).
El idioma por defecto es el que eligio el streamer en `/setup`.

## 3. Guia para el streamer (5 minutos)

1. **Conectar con Twitch.** Abre `https://<TU-DOMINIO>/setup` y pulsa "Conectar con Twitch".
   Se inicia sesion con tu cuenta y se vuelve a la pagina de configuracion.
2. **Pegar tu API key.** Ve a https://api.henrikdev.xyz/dashboard/ -> **API Keys** ->
   **Generate New Key**, scope **VALORANT (Basic)**, y copiala en el campo "API key del proveedor".
   Cada streamer usa su propia key. Si vuelves a entrar mas tarde, el campo aparece vacio y **dejarlo
   vacio conserva la key que ya tenias guardada**.
3. **Riot ID.** Escribe tu nombre y tu etiqueta de Valorant (por ejemplo `Kira` + `0123`), elige
   region (`eu`, `na`, `ap`, `kr`, `latam`, `br`) y plataforma (`pc`, `console`, `ps`).
4. **Idioma.** Elige espanol o ingles para el mensaje del chat.
5. **Guardar.** Recibes tu **token** y los **comandos listos para copiar**. Copia el comando en tu
   Nightbot o StreamElements y ya funciona.

### Editar, regenerar y borrar

- **Editar**: vuelve a `/setup` a cualquier momento, cambia los datos y guarda. El token **no**
  cambia, asi que tu comando de chat sigue funcionando.
- **Regenerar token**: boton "Regenerar token". El token antiguo deja de servir y te se muestra el
  nuevo una sola vez: actualiza el comando de Nightbot/StreamElements.
- **Borrar mis datos**: boton "Borrar mis datos". Se elimina tu fila de la base de datos (Riot ID y
  key) y tu comando deja de responder.

## 4. Comandos en Nightbot

La documentacion actual de Nightbot usa `!commands add`:

```
!commands add !rank $(urlfetch https://TU-DOMINIO/rank?token=TU_TOKEN)
```

- `$(urlfetch url)` devuelve la respuesta cruda del endpoint: por eso `/rank` devuelve **texto plano**.
- El limite de Nightbot es **400 caracteres**, asi que la respuesta debe ser corta (lo es).
- Si tu version de Nightbot todavia acepta el alias legacy `!addcom`, funciona igual:
  `!addcom !rank $(urlfetch https://TU-DOMINIO/rank?token=TU_TOKEN)`.
- Para traducir al vuelo puedes anadir el idioma:
  `!commands add !rankes $(urlfetch https://TU-DOMINIO/rank?token=TU_TOKEN&lang=es)`.

## 5. Comandos en StreamElements

Sintaxis canonica de `$(customapi)`:

```
!command add !rank $(customapi https://TU-DOMINIO/rank?token=TU_TOKEN)
```

Tambien siguen soportadas las formas antiguas con punto y `${...}`:

```
!command add !rank ${customapi.https://TU-DOMINIO/rank?token=TU_TOKEN}
```

Limitaciones de `$(customapi)` que conviene respetar:

- **Solo GET** y **sin cabeceras**: por eso la API key vive en el servidor y nunca en el panel.
- **Timeout de 15 s** (proxy de StreamElements, no configurable).
- **Trunca la respuesta a 400 bytes**: por eso `/rank` es plano y corto.
- **Query params percent-encoded y reordenados alfabeticamente**: no rompe nada, pero si tu token
  acaba en `&` o con espacios, el comando fallara. Copia el comando tal cual.
- **No sigue redirecciones**: usa siempre `https://`.
- **Sin cache**: cada invocacion del comando hace una peticion nueva (el bot cachea 90 s por su lado).

## 6. Variables de entorno

| Variable | Obligatoria | Default | Descripcion |
|---|---|---|---|
| `DATABASE_URL` | **si** | - | Postgres. En Render, la "Internal Database URL" del Postgres enlazado |
| `ENCRYPTION_KEY` | **si** | - | Clave de cifrado (AES-256-GCM) de las API keys. Min. 16 caracteres |
| `SESSION_SECRET` | **si** | - | Firma de la cookie de sesion. Min. 16 caracteres |
| `TWITCH_CLIENT_ID` | **si** | - | Client ID de la app de Twitch (dev.twitch.tv/console/apps) |
| `TWITCH_CLIENT_SECRET` | **si** | - | Client Secret de la misma app |
| `BASE_URL` | recomendado | deduce del Host | Base publica del bot, p.ej. `https://valo-rango-bot.onrender.com` |
| `DATABASE_SSL` | no | `false` | `true` si el proveedor de Postgres exige TLS |
| `PORT` | no | `3000` | Puerto de escucha |
| `HENRIK_API_BASE` | no | `https://api.henrikdev.xyz` | Base del proveedor. `https://eu.api.henrikdev.xyz` es mas rapido (sin Cloudflare) |
| `CACHE_TTL_MS` | no | `90000` | Tiempo de vida de la cache por streamer |
| `CACHE_STALE_MS` | no | `600000` | Ventana de cache obsoleta que se sirve si el proveedor falla |
| `UPSTREAM_TIMEOUT_MS` | no | `4000` | Timeout de cada llamada al proveedor |
| `UPSTREAM_RETRIES` | no | `1` | Reintentos (solo ante 429, 5xx o error de red) |
| `REQUEST_DEADLINE_MS` | no | `8000` | Presupuesto maximo por peticion antes de servir la cache vieja |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` | Ventana del limite por token |
| `RATE_LIMIT_MAX` | no | `30` | Peticiones por token y ventana |
| `RATE_LIMIT_SETUP_WINDOW_MS` | no | `60000` | Ventana del limite por IP en `/setup` y `/auth` |
| `RATE_LIMIT_SETUP_MAX` | no | `20` | Peticiones por IP y ventana en `/setup` y `/auth` |
| `SESSION_MAX_AGE_MS` | no | `2592000000` (30 dias) | Duracion de la cookie de sesion |

Genera las dos claves secretas con:

```bash
openssl rand -base64 32
```

> Si cambias `ENCRYPTION_KEY`, las API keys ya guardadas dejan de descifrarse. Habra que volver a
> pegarlas en `/setup`.

### API key del proveedor (HenrikDev)

Desde la v4.0.0 de la API la key es **obligatoria** para el streamer:

1. Entra en https://api.henrikdev.xyz/dashboard/ e inicia sesion.
2. Menú lateral -> **API Keys** -> **Generate New Key**.
3. Nombre (por ejemplo `valo-rango-bot`) y scope **VALORANT (Basic)**.
4. Copia la key: solo se muestra una vez.

Alternativa sin registro: Discord https://discord.com/invite/X3GaVkX2YN -> canal `#get-a-key` ->
desplegable **VALORANT (Basic Key)**. La key se genera al instante.

El bot consulta el endpoint **v3**:

```
GET https://api.henrikdev.xyz/valorant/v3/mmr/{region}/{platform}/{name}/{tag}
Authorization: <API KEY DEL STREAMER>
```

Campos usados: `data.current.tier.name` (tier) y `data.current.rr` (RR).
Si el v3 falla por `401/403` (key invalida) o `404` (Riot ID inexistente) no se intenta el v1 y se
responde con el mensaje de error correspondiente. Para cualquier otro fallo, si hay un valor
cacheado, se sirve el valor viejo antes que un error en pantalla.

## 7. Deploy en Render

### 7.1 Crear el Postgres

1. En el dashboard de Render, **New + -> Postgres**.
2. Nombre (por ejemplo `valo-rango-db`), region igual a la del servicio, plan gratuito.
3. **Create Database**. Cuando este creado, copiala **Internal Database URL** y guardala: es la
   variable `DATABASE_URL`.

### 7.2 Crear la app de Twitch

1. https://dev.twitch.tv/console/apps -> **Register an Application**.
2. Nombre (por ejemplo `ValoRangoBot`) y una categoria.
3. **OAuth Redirect URL**: `https://TU-DOMINIO/auth/callback` (exactamente esa ruta).
4. Copia el **Client ID** y genera un **Client Secret**.

### 7.3 Crear el Web Service

| Ajuste | Valor |
|---|---|
| Repositorio | `SkrillyG/valo_rango_bot` |
| Rama | `main` |
| **Root Directory** | **`valo_rango_bot`** |
| Runtime | Node |
| Build Command | `npm ci` (o `npm install`) |
| Start Command | `npm start` |
| Type | **Web Service** (nunca Background Worker: este bot escucha HTTP) |
| Health Check Path | `/health` |

> El **Root Directory** es obligatorio: el `package.json` vive en `valo_rango_bot/`, no en la raiz
> del repositorio. Si se deja vacio, Render no encuentra el `package.json` y el deploy falla.
> Despues de cambiarlo hay que lanzar un **Manual Deploy** para que aplique al deploy actual.

### 7.4 Variables de entorno en Render

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Internal Database URL del Postgres del punto 7.1 |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` (guárdala, no se puede recuperar) |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `TWITCH_CLIENT_ID` | Client ID de la app de Twitch |
| `TWITCH_CLIENT_SECRET` | Client Secret de la app de Twitch |
| `BASE_URL` | `https://<TU-SERVICIO>.onrender.com` |
| `NODE_ENV` | `production` |

> **Nunca subas un archivo `.env` al repositorio.** En Render las variables se definen en
> *Environment* del servicio. El `.env` esta en `.gitignore` y solo se usa en local.

### 7.5 Desplegar

1. **Manual Deploy -> Deploy latest commit**.
2. Espera a que el build termine y comprueba `https://<TU-SERVICIO>.onrender.com/health`.
3. Si responde `{"ok":true,...}` el servicio esta vivo.
4. Abre `https://<TU-SERVICIO>.onrender.com/setup`, conecta Twitch y pega tu key.
5. Copia el comando a Nightbot o StreamElements.

### 7.6 Trampas de Render

- **El disco no es persistente.** El sistema de archivos se borra en cada redeploy: toda la
  configuracion vive en Postgres, nunca en ficheros.
- **El plan gratuito se duerme** tras ~15 minutos sin trafico y tarda ~50 s en despertar. Eso rompe
  el timeout de 15 s de StreamElements: el primer comando tras una pausa dara error. La solucion
  es un **keep-alive** contra `/health` (UptimeRobot gratuito cada 5 minutos o un workflow de
  GitHub Actions con cron). Este repositorio ya incluye `.github/workflows/keepalive.yml`, que
  consulta `/health` cada 5 minutos: para que funcione, en GitHub -> *Settings -> Actions ->
  General* debe estar desmarcado "Disable scheduled workflows" (y el propio workflow tiene que
  estar en `.github/workflows/` del repositorio raiz). Un plan de pago elimina el problema.
- **El Cold Start y el timeout.** El bot tiene un deadline por peticion (`REQUEST_DEADLINE_MS`,
  8 s por defecto) siempre por debajo del timeout de los proxies, asi que nunca se cuelga: en el
  peor caso devuelve el mensaje de error legible.
- **Render no ejecuta cron jobs.** Si necesitas tareas periodicas, usa un Worker aparte; este
  servicio solo expone HTTP.

### 7.7 Si el deploy falla

| Sintoma en los logs de Render | Causa | Solucion |
|---|---|---|
| `npm ci can only install packages when your package.json and package-lock.json ... are in sync` | El `package-lock.json` no coincide con `package.json` | Regenerar el lock: `npm install --package-lock-only` y subirlo |
| `npm ERR! code ENOENT ... package.json` | El **Root Directory** no apunta a `valo_rango_bot` | Corregir *Root Directory* y hacer **Manual Deploy** |
| `[ERROR] Variables de entorno obligatorias ausentes: ...` | Faltan variables en *Environment* | Completar la tabla del punto 7.4 |
| `no se pudo preparar la base de datos` | `DATABASE_URL` incorrecta o Postgres no enlazado | Enlazar el Postgres y copiar su *Internal Database URL* |
| `ENCRYPTION_KEY es demasiado corta` | La clave de cifrado tiene menos de 16 caracteres | `openssl rand -base64 32` |

**Modo degradado.** Si falta alguna variable, el servicio **no se cae**: arranca igual, responde
`200` en `/health` con `"degradado": true` y la lista de variables que faltan, muestra un aviso en
la portada y en `/setup`, y `/rank` devuelve un mensaje legible en vez de un error 500. Asi un
despliegue nunca se queda "failed" por un ajuste de entorno: se ve que falta algo y se arregla
sin downtime.

## 8. Seguridad

- Las **API keys se cifran** (AES-256-GCM) antes de tocar la base de datos. La clave de cifrado
  vive en `ENCRYPTION_KEY`, fuera del repositorio.
- Los **tokens se guardan hasheados** (SHA-256). La base de datos no contiene ningun token en
  claro y ningun token se puede recuperar: solo regenerarlo.
- **Los logs redaccionan** cualquier `token`, `key`, `secret` o `password` que aparezca.
- **Ninguna respuesta** muestra la key ni el token del streamer. La pagina `/setup` solo muestra el
  token cuando es nuevo, y la key nunca se vuelve a imprimir.
- **Cada streamer usa su propia key** y solo se consultan datos de su propio Riot ID: el token de
  un streamer no puede usarse para preguntar el rango de otro.
- **Rate limit**: 30 peticiones/minuto por token y 20/minuto por IP en `/setup` y `/auth`.
- **El token va en la URL del comando**, asi que los moderadores del canal pueden verlo. La pagina
  `/setup` avisa de esto y ofrece regenerar el token en un click.
- La cookie de sesion es `httpOnly`, `sameSite=lax` y `secure` en produccion.

## 9. Diagnostico

```bash
curl -s https://<TU-DOMINIO>/health
curl -s "https://<TU-DOMINIO>/rank?token=<TOKEN>"
curl -s "https://<TU-DOMINIO>/rank?token=<TOKEN>&lang=en"
curl -s "https://<TU-DOMINIO>/api/rank?token=<TOKEN>"
curl -s https://<TU-DOMINIO>/setup
```

`/health` devuelve `ok`, `baseDeDatos`, `degradado`, `faltantes`, `uptimeSeg` y
`twitchConfigurado`, y responde siempre `200` (para que Render lo use como health check sin
marcar el deploy como fallido). En los logs de Render cada peticion deja una linea con ruta,
duracion y origen del dato (`cache`, `v3`, `v1`, `stale`):

```
[2026-10-21T18:40:11.204Z] INFO GET /rank -> 200 { ms: 512, origen: 'v3' }
```

| Sintoma | Causa probable | Solucion |
|---|---|---|
| `Configuracion no encontrada. Revisa tu comando.` | Token equivocado o regenerado | Vuelve a copiar el comando desde `/setup` |
| `Falta configurar el bot en ...` | El streamer no ha pegado su API key | Entrar en `/setup` y guardarla |
| `No se encontro el jugador. Revisa tu Riot ID.` | Riot ID o region equivocados | Corregir en `/setup` |
| `La key del proveedor no es valida.` | Key de HenrikDev caducada o mal copiada | Generar una nueva en `/setup` |
| En el chat sale `Moved Permanently` | El comando usa `http://` | Usar `https://` |
| En el chat sale `Could not connect to remote server` | Cold start o timeout del proxy | Activar keep-alive contra `/health` |
| El comando responde con un `!` delante | Prefijo mal pegado al copiar | Recopiar el comando tal cual desde `/setup` |

## 10. Desarrollo local

```bash
cd valo_rango_bot
npm install
cp .env.example .env        # rellena DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET, TWITCH_*
npm start                   # http://localhost:3000
npm run dev                 # reinicia al guardar cambios
```

Para probar sin Twitch ni Postgres reales, `npm test` levanta un Postgres en memoria (`pg-mem`) y
un proveedor falso y recorre el flujo completo:

```bash
npm test
```

El `.env` esta en `.gitignore`: no se sube nunca.

## 11. Estructura

```
valo_rango_bot/
├── index.js              entry point: valida env, migra y levanta el servidor
├── src/
│   ├── config.js         carga de .env y valores por defecto
│   ├── logger.js         log con niveles y redaccion de secretos
│   ├── crypto.js         AES-256-GCM, hash de token, comparacion timing-safe
│   ├── db.js             pool de Postgres y acceso a la tabla streamers
│   ├── cache.js          cache TTL con valores obsoletos
│   ├── ratelimit.js      ventanas de limite por clave
│   ├── messages.js       plantillas ES/EN, posesivo y catalogo de errores
│   ├── valorant.js       cliente HenrikDev (v3 con fallback v1)
│   ├── twitch.js         OAuth de Twitch
│   ├── urls.js           resolucion de la URL publica
│   ├── auth.js           rutas /auth/*
│   ├── views.js          HTML de la portada y de /setup
│   ├── setup.js          rutas /setup (guardar, regenerar, borrar)
│   ├── rank.js           rutas /rank, /rango y /api/rank
│   └── server.js         Express, sesiones, rate limit por IP
├── test/smoke.js         test end-to-end con pg-mem
├── .env.example          plantilla de variables
└── package.json
```
