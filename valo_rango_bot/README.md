# ValoRangoBot

Un servicio web que responde **el rango de Valorant de un jugador** en una sola línea de texto,
para que puedas tener un comando `!rank` en tu canal de Twitch.

- **Servicio en producción:** https://valo-rango-bot.onrender.com
- **Repositorio:** https://github.com/SkrillyG/valo_rango_bot
- **Funciona con:** Nightbot y StreamElements
- **Idiomas:** español e inglés

## Índice

| Parte | Para quién es | Qué encontrarás |
|---|---|---|
| **[Parte 1 - Guía para streamers](#parte-1---guía-para-streamers)** | Cualquiera que quiera su comando `!rank` | Solo lo que tienes que hacer tú, paso a paso |
| **[Parte 2 - Cómo funciona](#parte-2---cómo-funciona)** | Curiosos y quien quiera entender el sistema | Flujo, las dos llaves, seguridad, límites, glosario |
| **[Parte 3 - Para quien mantiene el servicio](#parte-3---para-quien-mantiene-el-servicio)** | Solo el dueño del repositorio | Despliegue en Render, variables, referencia técnica |

---

# Parte 1 - Guía para streamers

> **El servicio ya está montado y funcionando.** No tienes que instalar nada, ni crear bases de
> datos, ni tocar Render, ni registrar apps de Twitch. Solo haces **tres cosas**:
>
> 1. Conseguir **tu API key gratuita** de HenrikDev.
> 2. Rellenar **tu configuración** en `/setup`.
> 3. **Pegar un comando** en Nightbot o StreamElements.

## 1.1 Qué necesitas antes de empezar

- [ ] Tu **cuenta de Twitch** (la de tu canal).
- [ ] Una cuenta de **Nightbot** o de **StreamElements** (la que ya uses en tu chat).
- [ ] Tu **Riot ID** de Valorant, por ejemplo `Kira` + `0123`. Lo ves en tu perfil de Valorant,
      arriba a la derecha, o en https://www.riotgames.com/account (columna "Riot ID").
- [ ] Saber tu **región**: `eu` = Europa, `na` = América del Norte, `ap` = Asia-Pacífico,
      `kr` = Corea del Sur, `latam` = América Latina, `br` = Brasil. Si estás en España: `eu`.

## 1.2 Paso 1 - Consigue tu API key de HenrikDev (5 minutos)

La API key es el permiso que le das al servicio de datos de Valorant (HenrikDev) para que pueda
consultar tu rango. Es **gratis**.

### Opción A - Con el panel web (recomendada)

1. Abre **https://api.henrikdev.xyz/dashboard/** e inicia sesión (puedes entrar con Google o
   Discord).
2. En el **menú lateral**, pulsa **"API Keys"**.
3. Pulsa **"Generate New Key"**.
4. Rellena el formulario:
   - **Name**: el nombre de tu canal (por ejemplo `KiraValorant`).
   - **Description**: algo real, por ejemplo `Comando de rango para el canal de Kira`.
     (HenrikDev rechaza descripciones como `test` o `prueba`.)
   - **Scope / permisos**: elige **`VALORANT (Basic)`**.
5. Pulsa **Create** y **copia la key**. **Solo se muestra una vez**: si la pierdes, genera otra.

### Opción B - Por Discord (la más rápida, sin registrarte)

1. Entra en el Discord de HenrikDev: https://discord.com/invite/X3GaVkX2YN
2. **Verifica** tu cuenta de Discord con el bot que te aparecerá.
3. Ve al canal **`#get-a-key`**.
4. En el desplegable elige **`VALORANT (Basic Key)`**.
5. El bot te devuelve la key al instante.

> La key **nunca** se pone en Nightbot ni en StreamElements. Solo se pega en la página de
> configuración (siguiente paso), que la guarda cifrada.

## 1.3 Paso 2 - Configura tu canal (3 minutos)

1. Abre **https://valo-rango-bot.onrender.com/setup**.
2. Pulsa **"Conectar con Twitch"**.
3. Se abre Twitch: inicia sesión si hace falta y pulsa **"Autorizar"** / **"Allow"**. Twitch te
   devuelve a la página de configuración.
4. Rellena el formulario:
   - **API key del proveedor** → pega la key del paso anterior.
   - **Riot ID - name** → tu nombre de Valorant (ej. `Kira`).
   - **Riot ID - tag** → tu etiqueta, los números detrás de la `#` (ej. `0123`).
   - **Región** → `eu`, `na`, `ap`, `kr`, `latam` o `br`.
   - **Plataforma** → `pc`, `console` o `ps` (si juegas en PS5, elige `ps`).
   - **Idioma** → `es` o `en`. Decide en qué idioma verá el mensaje tu chat.
5. Pulsa **"Guardar"**.
6. La página te muestra tu **token** y los **comandos ya montados** para Nightbot y para
   StreamElements, cada uno con un botón **"Copiar"**.

> **Copia el comando entero con el botón "Copiar"**, desde `!commands` hasta el final, incluyendo
> el token. Así evitas errores de tecleo.

## 1.4 Paso 3 - Pega el comando en tu bot de chat

Usa **solo el que corresponda a tu bot**.

### Nightbot

En el chat de tu canal pega el comando que te dio `/setup`. Tiene esta forma:

```
!commands add !rank $(urlfetch https://valo-rango-bot.onrender.com/rank?token=TU_TOKEN)
```

Si tu Nightbot no acepta `!commands add`, usa la versión antigua (hace lo mismo):

```
!addcom !rank $(urlfetch https://valo-rango-bot.onrender.com/rank?token=TU_TOKEN)
```

### StreamElements

En el chat de tu canal pega:

```
!command add !rank $(customapi https://valo-rango-bot.onrender.com/rank?token=TU_TOKEN)
```

Tu bot responderá con un mensaje de confirmación. Listo.

> Puedes cambiar `!rank` por `!rango`, `!val`, etc. Lo demás déjalo tal cual.

## 1.5 Pruébalo

Escribe `!rank` en tu chat. Deberías ver algo como:

```
Rango de Kira: Diamante 2 (34 RR)
```

o, si elegiste inglés:

```
Kira's current rank is: Diamond 2 (34 RR)
```

Si no funciona, mira **1.7 Problemas frecuentes**.

## 1.6 Uso diario

Entra siempre en **https://valo-rango-bot.onrender.com/setup** (con la sesión de Twitch iniciada).

| Quiero... | Qué hago | Ojo |
|---|---|---|
| **Cambiar mi Riot ID, región o idioma** | Relleno el formulario y pulso "Guardar" | El token **no** cambia: tu comando de chat sigue funcionando |
| **Cambiar mi API key** | Pego la key nueva y pulso "Guardar" | Si dejo el campo **vacío**, se conserva la anterior |
| **Cambiar mi token** (por seguridad) | Pulso "Regenerar token" | El token viejo deja de funcionar: **actualiza el comando** en tu bot copiándolo otra vez desde `/setup` |
| **Borrar todo y empezar de cero** | Pulso "Borrar mis datos" | Se borra tu configuración y tu comando dejará de responder |

**¿Por qué regenerar el token?** Va escrito dentro del comando de chat, así que **los moderadores
de tu canal pueden verlo**. Con él, alguien podría pedir tu rango usando el servicio (solo
verían tu propio rango, no es grave). Si te incomoda, regéneralo y copia el comando nuevo.

## 1.7 Problemas frecuentes

| Lo que ves en el chat | Por qué | Cómo se arregla |
|---|---|---|
| `Configuracion no encontrada. Revisa tu comando.` | El token no existe o lo regeneraste | Vuelve a `/setup` y copia el comando otra vez |
| `Falta configurar el bot en https://...` | No has pegado tu API key | Entra en `/setup`, pega la key y guarda |
| `No se encontro el jugador. Revisa tu Riot ID.` | Riot ID o región equivocados | Corrige nombre, etiqueta o región en `/setup` |
| `La key del proveedor no es valida.` | La API key está caducada o mal copiada | Genera una nueva y pégala en `/setup` |
| `No se pudo obtener el rango, intenta de nuevo en un momento.` | El servicio de datos de Valorant está caído o limitó las peticiones | Espera un minuto y prueba otra vez |
| `Demasiadas peticiones, espera un momento.` | Alguien llama al comando muchísimo | Espera un minuto |
| `Moved Permanently` | El comando usa `http://` en vez de `https://` | Recópialo desde `/setup` |
| `Could not connect to remote server` | El servicio estaba dormido y tardó en despertar | Vuelve a probar a los 30-60 segundos |
| El mensaje sale con un `!` o un `/` delante | Se copió un símbolo de más | Recopia el comando entero desde `/setup` |
| Sale el rango de otro jugador | El token es de otro canal | Copia tu comando desde `/setup` |

**Comprobaciones rápidas** (si te gusta la terminal; sustituye `TU_TOKEN`):

```bash
# ¿El servicio está vivo?
curl -s https://valo-rango-bot.onrender.com/health

# ¿Mi token funciona?
curl -s "https://valo-rango-bot.onrender.com/rank?token=TU_TOKEN"

# ¿Y en inglés?
curl -s "https://valo-rango-bot.onrender.com/rank?token=TU_TOKEN&lang=en"
```

---

# Parte 2 - Cómo funciona

> Esta parte es informativa. No necesitas leerla para usar el bot.

## 2.1 El flujo en 30 segundos

Nightbot y StreamElements no saben consultar el rango de Valorant por sí solos: solo saben
**llamar a una dirección web** y mostrar lo que esta responda. `ValoRangoBot` es esa dirección.

```
Alguien escribe        el bot de tu canal             ValoRangoBot
      !rank     ----->   pide la información   ----->   busca el rango
      <-------------   muestra la respuesta   <-----   "Rango de Kira: Diamante 2 (34 RR)"
```

Por dentro:

1. El comando de chat llama a `/rank?token=...`.
2. El servidor identifica tu canal por el **token** (comparando su huella SHA-256).
3. Descifra **tu API key** y consulta a HenrikDev el rango de **tu** Riot ID.
4. Devuelve una línea de texto plano, corta y sin símbolos al inicio.

## 2.2 Las dos llaves

| | Qué es | Quién la tiene | Dónde vive | Para qué sirve |
|---|---|---|---|---|
| **API key** | Llave larga que da HenrikDev | **Tú**, una por canal | **Cifrada** en la base de datos del servidor | Poder preguntar el rango |
| **Token del bot** | Código corto y aleatorio que genera este bot | **Tú**, uno por canal | Dentro del comando de chat | Demuestra "este comando es mío" |

- **La API key nunca sale de la base de datos**: nadie la ve, ni los moderadores.
- **El token sí es visible**: va escrito en el comando de chat. Por eso `/setup` te avisa y te da
  un botón para regenerarlo cuando quieras.
- Si pierdes el token → `/setup` → **"Regenerar token"**. Si pierdes la API key → `/setup` y la
  pegas otra vez.

## 2.3 Qué hace el servidor para no fallarte

- **Caché por streamer** (90 s por defecto): evita llamar a HenrikDev en cada `!rank`.
- **Valor obsoleto de reserva** (hasta 10 min): si HenrikDev falla, se muestra el último rango
  conocido antes que un error.
- **Siempre responde HTTP 200** con texto legible: el proxy de StreamElements sustituye cualquier
  error 4xx/5xx por un mensaje genérico que no dice nada.
- **Mensajes cortos**: menos de 400 caracteres y nunca empiezan por `/`, `.` ni `!`.
- **Consulta v3 con respaldo v1**: si v3 falla por un motivo distinto de key inválida (401/403) o
  Riot ID inexistente (404), se intenta v1.
- **Modo degradado**: si al mantenedor le falta alguna variable de entorno, el servicio no se cae;
  arranca igual y `/rank` devuelve un texto legible.

### Diferencias entre Nightbot y StreamElements

| | Nightbot | StreamElements |
|---|---|---|
| Función | `$(urlfetch ...)` | `$(customapi ...)` |
| Límite de texto | 400 caracteres | 400 bytes (corta lo que sobra) |
| Tiempo máximo de espera | normal | 15 segundos |
| Puede mandar cabeceras | no | no |

Por eso la respuesta es **corta y en texto plano**.

## 2.4 Seguridad

- Las **API keys se cifran** (AES-256-GCM) antes de llegar a la base de datos.
- Los **tokens se guardan hasheados** (SHA-256): no hay ningún token en claro y **ninguno se puede
  recuperar**, solo regenerar.
- Los **logs ocultan** cualquier `token`, `key`, `secret` o `password`.
- **Ninguna respuesta** muestra la key ni el token. `/setup` solo enseña el token cuando es nuevo.
- **Cada streamer usa su propia key** y solo se consulta su propio Riot ID.
- **Límite de peticiones**: 30 por minuto y token; 20 por minuto y IP en `/setup` y `/auth`.
- **Cookie de sesión**: `httpOnly`, `sameSite=lax` y `secure` en producción.

## 2.5 Glosario

| Palabra | Significado |
|---|---|
| **API key** | Llave que da un servicio para que le dejes consultar datos. Aquí, la de HenrikDev |
| **Token** | Código aleatorio que identifica a tu canal ante el bot |
| **OAuth** | Mecanismo con el que Twitch te deja iniciar sesión sin darle tu contraseña al bot |
| **Cifrar** | Guardar algo de forma que no se pueda leer sin una llave |
| **Hashear** | Convertir algo en una huella irreversible: se puede comprobar, pero no recuperar |
| **Caché** | Copia temporal del último rango para no consultar al proveedor cada vez |

---

# Parte 3 - Para quien mantiene el servicio

> ⚠️ **Los streamers NO necesitan nada de esta parte.** Es solo para quien despliega y mantiene
> el servicio (el dueño del repositorio). Si solo quieres tu comando `!rank`, vuelve a la
> Parte 1.

## 3.1 Qué necesitas

- Una cuenta de **Render** (https://render.com).
- Una cuenta de **Twitch de desarrollador** (https://dev.twitch.tv/console/apps).
- Una base de datos **PostgreSQL** (Render la crea gratis).

## 3.2 Crear la base de datos

1. En https://dashboard.render.com pulsa **New +** → **Postgres**.
2. Nombre: `valo_rango_db`. **Región: la misma** que el servicio web.
3. Plan: **Free** → **Create Database**.
4. En la pestaña **Info** copia la **Internal Database URL** (empieza por `postgresql://...`).
   Esa URL es `DATABASE_URL`. Usa siempre la **Internal**, no la externa.

## 3.3 Crear la app de Twitch

1. Abre https://dev.twitch.tv/console/apps → **Register an Application**.
2. Rellena:
   - **Name**: `ValoRangoBot` (único entre todas las apps de Twitch).
   - **OAuth Redirect URLs**: `https://TU-SERVICIO.onrender.com/auth/callback` y pulsa **Add**.
     La ruta `/auth/callback` es **exacta**.
   - **Category**: `Website Integration`.
   - **Client Type**: **Confidential**.
3. Copia el **Client ID** y, en **New Secret** → **Show**, el **Client Secret** (cada secret
   nuevo invalida el anterior).

> Twitch exige **2FA** activado en tu cuenta para registrar una app: Settings → Security and
> Privacy → Set Up Two-Factor Authentication.

## 3.4 Crear el servicio web

En https://dashboard.render.com → **New +** → **Web Service** → conecta `SkrillyG/valo_rango_bot`.

| Ajuste | Valor | Por qué |
|---|---|---|
| Branch | `main` | |
| **Root Directory** | `valo_rango_bot` | **Obligatorio.** El `package.json` está en esa carpeta |
| Runtime | Node | |
| Build Command | `npm ci` | |
| Start Command | `npm start` | |
| Type | **Web Service** | Nunca "Background Worker" |
| Health Check Path | `/health` | Render lo usa para saber si está vivo |

## 3.5 Variables de entorno

En el servicio → **Environment** → **+ Add Environment Variable**. Añade estas 6:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La **Internal Database URL** del punto 3.2 |
| `ENCRYPTION_KEY` | Texto aleatorio largo (ver abajo) |
| `SESSION_SECRET` | Otro texto aleatorio largo (ver abajo) |
| `TWITCH_CLIENT_ID` | Client ID de tu app de Twitch |
| `TWITCH_CLIENT_SECRET` | Client Secret de tu app de Twitch |
| `BASE_URL` | `https://TU-SERVICIO.onrender.com` |

Genera las dos claves en una terminal (Git Bash en Windows, Terminal en Mac/Linux), una vez para
cada una:

```bash
openssl rand -hex 32
```

Pégalas tal cual en *Value*. Al terminar pulsa **Save** y elige **"Save and deploy"** (con "Save
only" las variables quedan guardadas pero no se aplican hasta el próximo deploy).

## 3.6 Desplegar y comprobar

1. En **Events** espera a ver `Build succeeded` y `Deploy live` (1-2 minutos).
2. Abre `https://TU-SERVICIO.onrender.com/health`. Debe salir:
   ```json
   {"ok":true,"baseDeDatos":true,"degradado":false,"faltantes":[]}
   ```
   Si `degradado` es `true`, `faltantes` indica qué variable falta.
3. Abre `/setup` y haz la configuración de la Parte 1 para tu propio canal.

## 3.7 Trampas de Render

- **El disco no es permanente.** Cada redeploy borra el sistema de archivos. Por eso toda la
  configuración vive en Postgres.
- **El plan gratuito se duerme** tras ~15 min sin visitas y tarda ~22-50 s en despertar, lo que rompe
  el límite de 15 s de StreamElements. **Solución:** un keep-alive que visite `/health` cada
  5 minutos. Hay dos capas, usa **las dos** para que no falle:
  1. **GitHub Actions** (incluido en el repo, `.github/workflows/keepalive.yml`). En
     GitHub → **Settings → Actions → General** desmarca **"Disable scheduled workflows"**.
     Ten en cuenta que el cron de GitHub no es puntual (puede retrasarse 10-30 min) y se desactiva
     solo tras 60 días sin actividad en el repositorio.
  2. **Pinger externo gratuito** (la capa fiable). Crea una cuenta en [UptimeRobot](https://uptimerobot.com)
     o [cron-job.org](https://cron-job.org) y añade un monitor HTTP:
     - URL: `https://TU-SERVICIO.onrender.com/health`
     - Intervalo: **5 minutos**
     - Método: `GET`, sin autenticación
     Con UptimeRobot además recibes aviso por email si el servicio se cae. Si quieres redundancia,
     configura los dos servicios: mientras uno falle, el otro mantiene el bot despierto.
- **Si el workflow de GitHub sale en rojo con exit code 28**, es normal en el primer ping tras la
  siesta: `curl` cortaba a los 20 s y Render tarda más en arrancar. El workflow ya usa
  `--max-time 45` + reintentos, así que un fallo aislado no significa que el servicio esté caído.
- **No hay forma de que un servicio dormido responda en menos de 15 s.** Si no quieres mantenerlo
  caliente, el comando de chat fallará tras cada siesta; para evitarlo hay que pagar Render o
  migrar a un host que no duerma.
- **Los cron de Render no existen** en los Web Services; para tareas periódicas crea aparte un
  Worker.
- **Nunca subas un `.env` al repositorio.** Las variables van en el panel de Render; el `.env`
  está en `.gitignore` y solo se usa en local.

## 3.8 Si el deploy falla

| Lo que ves en los logs | Por qué pasa | Qué hacer |
|---|---|---|
| `npm ci can only install packages when your package.json and package-lock.json ... are in sync` | El lock no coincide con el `package.json` | `npm install --package-lock-only` y subir el lock |
| `npm ERR! code ENOENT ... package.json` | **Root Directory** no apunta a `valo_rango_bot` | Corregirlo y hacer **Manual Deploy** |
| `[ERROR] Variables de entorno obligatorias ausentes: ...` | Faltan variables | Completar la tabla del punto 3.5 |
| `no se pudo preparar la base de datos` | `DATABASE_URL` mal copiada | Copiar de nuevo la **Internal Database URL** |
| `ENCRYPTION_KEY es demasiado corta` | Menos de 16 caracteres | `openssl rand -hex 32` |

## 3.9 Si se ha filtrado algo

1. **API key de un streamer**: revocarla en el panel de HenrikDev, generar otra y pegarla en
   `/setup`.
2. **Token**: `/setup` → "Regenerar token" → copiar el comando nuevo en el bot de chat.
3. **Claves del servidor**: en Render → Environment → nuevos `ENCRYPTION_KEY` y `SESSION_SECRET` →
   **Save and deploy**. Al cambiar `ENCRYPTION_KEY`, las API keys guardadas dejan de descifrarse y
   los streamers tendrán que volver a pegarlas.
4. **Contraseña de la base de datos**: Render → Postgres → **Info** → **Credentials** → crear un
   usuario nuevo, actualizar `DATABASE_URL`, esperar a que `/health` responda `ok:true` y solo
   entonces eliminar el usuario antiguo.

## 3.10 Referencia técnica

### Rutas

| Ruta | Respuesta | Uso |
|---|---|---|
| `GET /rank?token=<token>` | Texto plano con el rango del dueño del token | Comando de chat |
| `GET /rank?token=<token>&lang=es\|en` | Fuerza el idioma | Igual que el anterior |
| `GET /rango?token=<token>` | Como `/rank` pero siempre en español | Alias en español |
| `GET /api/rank?token=<token>` | JSON `{ ok, twitch_login, riot_id, rango, rr, ... }` | Consumo programático. Solo devuelve el valor cacheado; nunca expone key ni token |
| `GET /setup` | Página de configuración | Login con Twitch + formulario |
| `GET /auth/login` | Redirige a Twitch | Botón "Conectar con Twitch" |
| `GET /auth/callback` | Callback de OAuth | **Aquí va la Redirect URL de Twitch** |
| `GET /auth/logout` | Cierra la sesión | Botón "Salir" |
| `GET /health` | JSON de estado | Health check de Render, UptimeRobot |
| `GET /` | Portada con instrucciones | Comprobación rápida |

`/rank` y `/rango` devuelven **siempre HTTP 200** con `Content-Type: text/plain; charset=utf-8`.

### Variables de entorno

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `DATABASE_URL` | **sí** | - | Postgres (en Render, la Internal Database URL) |
| `ENCRYPTION_KEY` | **sí** | - | Clave AES-256-GCM de las API keys. Mín. 16 caracteres |
| `SESSION_SECRET` | **sí** | - | Firma de la cookie de sesión. Mín. 16 caracteres |
| `TWITCH_CLIENT_ID` | **sí** | - | Client ID de la app de Twitch |
| `TWITCH_CLIENT_SECRET` | **sí** | - | Client Secret de la misma app |
| `BASE_URL` | recomendado | se deduce del Host | Base pública, p. ej. `https://valo-rango-bot.onrender.com` |
| `DATABASE_SSL` | no | `false` | `true` si el proveedor de Postgres exige TLS |
| `PORT` | no | `3000` | Puerto de escucha |
| `NODE_ENV` | no | - | `production` en Render |
| `HENRIK_API_BASE` | no | `https://api.henrikdev.xyz` | Base del proveedor (`https://eu.api.henrikdev.xyz` es más rápido) |
| `CACHE_TTL_MS` | no | `90000` | Vida de la caché por streamer |
| `CACHE_STALE_MS` | no | `600000` | Ventana de caché obsoleta servida si el proveedor falla |
| `UPSTREAM_TIMEOUT_MS` | no | `4000` | Timeout de cada llamada al proveedor |
| `UPSTREAM_RETRIES` | no | `1` | Reintentos (solo ante 429, 5xx o error de red) |
| `REQUEST_DEADLINE_MS` | no | `8000` | Presupuesto máximo por petición antes de servir caché vieja |
| `RATE_LIMIT_WINDOW_MS` | no | `60000` | Ventana del límite por token |
| `RATE_LIMIT_MAX` | no | `30` | Peticiones por token y ventana |
| `RATE_LIMIT_SETUP_WINDOW_MS` | no | `60000` | Ventana del límite por IP en `/setup` y `/auth` |
| `RATE_LIMIT_SETUP_MAX` | no | `20` | Peticiones por IP y ventana en `/setup` y `/auth` |
| `SESSION_MAX_AGE_MS` | no | `2592000000` (30 días) | Duración de la cookie de sesión |

### Consulta al proveedor

```
GET https://api.henrikdev.xyz/valorant/v3/mmr/{region}/{platform}/{name}/{tag}
Authorization: <API KEY DEL STREAMER>
```

Campos usados: `data.current.tier.name` (tier) y `data.current.rr` (RR). Si v3 falla por `401/403`
o `404` no se intenta v1 y se responde con el error correspondiente. Ante cualquier otro fallo,
si hay un valor cacheado, se sirve antes que un error.

### Desarrollo local

```bash
cd valo_rango_bot
npm install
cp .env.example .env        # rellena DATABASE_URL, ENCRYPTION_KEY, SESSION_SECRET, TWITCH_*
npm start                   # http://localhost:3000
npm run dev                 # reinicia al guardar cambios
npm test                    # Postgres en memoria (pg-mem) + proveedor falso, flujo completo
```

### Estructura

```
.
├── .github/workflows/keepalive.yml   cron cada 5 min contra /health
├── README.md                         esta guía
└── valo_rango_bot/                   <- Root Directory de Render
    ├── index.js              entry point: valida env, migra y levanta el servidor
    ├── src/
    │   ├── config.js         carga de .env y valores por defecto
    │   ├── logger.js         log con niveles y redacción de secretos
    │   ├── crypto.js         AES-256-GCM, hash de token, comparación timing-safe
    │   ├── db.js             pool de Postgres y acceso a la tabla streamers
    │   ├── cache.js          caché TTL con valores obsoletos
    │   ├── ratelimit.js      ventanas de límite por clave
    │   ├── messages.js       plantillas ES/EN, posesivo y catálogo de errores
    │   ├── valorant.js       cliente HenrikDev (v3 con fallback v1)
    │   ├── twitch.js         OAuth de Twitch
    │   ├── urls.js           resolución de la URL pública
    │   ├── auth.js           rutas /auth/*
    │   ├── views.js          HTML de la portada y de /setup
    │   ├── setup.js          rutas /setup (guardar, regenerar, borrar)
    │   ├── rank.js           rutas /rank, /rango y /api/rank
    │   └── server.js         Express, sesiones, rate limit por IP
    ├── test/smoke.js         test end-to-end con pg-mem
    ├── .env.example          plantilla de variables
    └── package.json
```