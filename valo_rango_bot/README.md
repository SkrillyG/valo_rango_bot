# ValoRangoBot

Un servicio web que responde **el rango de Valorant de un jugador** en una sola linea de texto,
para que puedas tener un comando `!rank` en tu canal de Twitch.

- **Servicio en produccion:** https://valo-rango-bot.onrender.com
- **Repositorio:** https://github.com/SkrillyG/valo_rango_bot
- **Funciona con:** Nightbot y StreamElements
- **Idiomas:** espanol e ingles

---

## Que es esto en 30 segundos

Tu canal de Twitch necesita un bot que, cuando alguien escribe `!rank`, muestre el rango de
Valorant. Nightbot y StreamElements no saben consultar el rango por si solos: solo saben
**llamar a una direccion web** y mostrar lo que esta responda.

`ValoRangoBot` es esa direccion web. Tu canal pide el rango, el bot se lo devuelve escrito.

```
Alguien escribe        el bot de tu canal             ValoRangoBot
      !rank     ----->   pide la informacion   ----->   busca el rango
      <-------------   muestra la respuesta   <-----   "Rango de Kira: Diamante 2 (34 RR)"
```

### Las dos llaves (entiende esto y el resto tiene sentido)

| | Que es | Quien lo tiene | Donde vive | Para que sirve |
|---|---|---|---|---|
| **API key** | Una llave larga que da el servicio de datos de Valorant (HenrikDev) | **Tu**, una por canal | Se guarda **cifrada** en la base de datos del servidor | Para poder preguntar el rango |
| **Token del bot** | Un codigo corto y aleatorio que genera este bot | **Tu**, uno por canal | Va dentro del comando de chat | Es lo que demuestra "este comando es mio" |

Truco para no liarse: **la API key nunca sale de la base de datos** (nadie la ve, ni los
moderadores). **El token si es publico**: va escrito en el comando de chat, asi que los
moderadores de tu canal pueden leerlo. Por eso el bot te avisa de eso y te da un boton para
cambiarlo cuando quieras.

Si pierdes o te roban el token, no pasa nada: entras en `/setup` y le das a **"Regenerar token"**.
Si pierdes la API key, entras en `/setup` y la pegas otra vez.

---

## Parte 1 - Que necesitas antes de empezar

- [ ] Una **cuenta de Twitch** (la misma que usas para tu canal).
- [ ] Una **cuenta de Nightbot** o de **StreamElements** (la que uses para el chat de tu canal).
- [ ] Una **cuenta en el panel de HenrikDev** para sacar tu API key (se explica en la Parte 2).
- [ ] Saber tu **Riot ID** de Valorant: por ejemplo `Kira` + `0123`.
      Lo ves en tu perfil de Valorant, arriba a la derecha, al lado de tu nombre.
      O en tu pagina de Riot ID: https://www.riotgames.com/account (columna "Riot ID").

> **¿No sabes cual es tu region?** `eu` = Europa, `na` = America del Norte, `ap` = Asia-Pacifico,
> `kr` = Corea del Sur, `latam` = America Latina, `br` = Brasil. Si estas en España: `eu`.

---

## Parte 2 - Consigue tu API key (5 minutos)

La API key es el permiso que le das al servicio de datos de Valorant para que te pueda
responder. Es **gratis** y se consigue en un minuto.

### Opcion A - Con el panel web (recomendada)

1. Abre **https://api.henrikdev.xyz/dashboard/** e inicia sesion (puedes entrar con Google o
   Discord).
2. En el **menu lateral**, pulsa **"API Keys"**.
3. Pulsa el boton **"Generate New Key"**.
4. Rellena el formulario:
   - **Name**: el nombre de tu canal (por ejemplo `KiraValorant`)
   - **Description**: escribe algo real, por ejemplo `Comando de rango para el canal de Kira`.
     (Twitch no, HenrikDev: si escribes `test` u `prueba` te lo rechazan automaticamente.)
   - **Scope / permisos**: elige **`VALORANT (Basic)`**.
5. Pulsa **Create** y **copia la key**. **Solo se muestra una vez**: si la pierdes, genera otra.

### Opcion B - Por Discord (la mas rapida, sin registrarte)

1. Entra en el Discord de HenrikDev: https://discord.com/invite/X3GaVkX2YN
2. **Verifica** tu cuenta de Discord con el bot que te aparecera.
3. Ve al canal **`#get-a-key`**.
4. En el desplegable elige **`VALORANT (Basic Key)`**.
5. El bot te devuelve la key al instante.

### Donde pegarla

La key **nunca** se pone en Nightbot ni en StreamElements. Se pega en la pagina de configuracion
del bot (Parte 3), que la guarda cifrada.

---

## Parte 3 - Configura tu canal (3 minutos)

1. Abre **https://valo-rango-bot.onrender.com/setup** en tu navegador.
2. Pulsa el boton **"Conectar con Twitch"** (o "Iniciar sesion").
3. Se abre Twitch: **inicia sesion** si hace falta y pulsa **"Autorizar"** / **"Allow"**.
   Twitch te devuelve a la pagina de configuracion. Ya estas dentro con tu sesion de Twitch.
4. Rellena el formulario:
   - **API key del proveedor** -> pega la key de la Parte 2.
   - **Riot ID - name** -> tu nombre de Valorant (ej. `Kira`).
   - **Riot ID - tag** -> tu etiqueta (ej. `0123`). Son los numeros detras de la `#`.
   - **Region** -> `eu`, `na`, `ap`, `kr`, `latam` o `br`.
   - **Plataforma** -> `pc`, `console` o `ps` (si juegas en PS5, elige `ps`).
   - **Idioma** -> `es` (espanol) o `en` (ingles). Decide el idioma del mensaje que veran en el chat.
5. Pulsa **"Guardar"**.
6. La pagina te muestra:
   - Un **token** (codigo largo). **Copialo**, lo vas a necesitar en la Parte 4.
   - Los **comandos ya montados** para Nightbot y para StreamElements. Solo tienes que copiar el
     que uses y pegarlo en tu bot de chat (Partes 4 y 5).

> **Truco:** hay un boton **"Copiar"** al lado de cada comando. Pulsa ese boton y ya lo tienes en
> el portapapeles, sin errores de tecleo. **Copia el comando entero, desde `!commands` hasta el
> final**, incluyendo el token.

---

## Parte 4 - Nightbot

1. En el **panel de Nightbot** (https://nightbot.tv) entra en tu canal.
2. En el chat de tu canal escribe (o usa el panel de comandos):

   ```
   !commands add !rank $(urlfetch https://valo-rango-bot.onrender.com/rank?token=PEGA_AQUI_TU_TOKEN)
   ```

   Ojo: sustituye `PEGA_AQUI_TU_TOKEN` por tu token. Si copiaste con el boton "Copiar", ya
   vendra todo puesto.
3. Nightbot responde con un mensaje de confirmacion. Listo.

### Si Nightbot no acepta `!commands add`

Las instalaciones mas antiguas de Nightbot usan el comando antiguo. Prueba con:

```
!addcom !rank $(urlfetch https://valo-rango-bot.onrender.com/rank?token=PEGA_AQUI_TU_TOKEN)
```

Las dos formas hacen lo mismo.

### Explicacion de los simbolos (para que no rompas nada)

| Parte | Que significa |
|---|---|
| `!rank` | Lo que escribe la gente en el chat. Puedes cambiarlo a `!rango`, `!val`... |
| `$(urlfetch ...)` | La funcion de Nightbot que "va a esa direccion y me trae lo que pone" |
| `?token=...` | La parte que identifica tu canal. Sin ella el bot no sabe de quien es el rango |

---

## Parte 5 - StreamElements

1. En el **panel de StreamElements** (https://streamelements.com) entra en tu canal.
2. En el chat escribe:

   ```
   !command add !rank $(customapi https://valo-rango-bot.onrender.com/rank?token=PEGA_AQUI_TU_TOKEN)
   ```

   De nuevo: si copiaste con el boton "Copiar", el token ya va incluido.
3. StreamElements responde con un mensaje de confirmacion. Listo.

### Diferencias con Nightbot que conviene saber

| | Nightbot | StreamElements |
|---|---|---|
| Como se llama la funcion | `$(urlfetch ...)` | `$(customapi ...)` |
| Limite de texto | 400 caracteres | 400 bytes (corta lo que sobra) |
| Tiempo maximo de espera | normal | 15 segundos |
| Puede mandar cabeceras | no | no |

Por eso la respuesta del bot es **corta y en texto plano**: si fuera larga, StreamElements la
cortaria a media palabra.

---

## Parte 6 - Probalo

1. En el chat de tu canal escribe `!rank` (o el nombre que le hayas puesto).
2. Deberias ver algo como:

   ```
   Rango de Kira: Diamante 2 (34 RR)
   ```

   o en ingles:

   ```
   Kira's current rank is: Diamond 2 (34 RR)
   ```

3. **Si no funciona**, mira la tabla de la **Parte 9 (Problemas frecuentes)**. Casi siempre es
   una de estas cuatro cosas:
   - el comando tiene un espacio de mas o le falta el token,
   - el token se regenero y el comando tiene el antiguo,
   - la region o el Riot ID estan mal,
   - la API key no se guardo.

---

## Parte 7 - Uso diario

Entra siempre en **https://valo-rango-bot.onrender.com/setup** (con la sesion de Twitch iniciada).

| Quiero... | Que hago | Ojo |
|---|---|---|
| **Cambiar mi Riot ID, region o idioma** | Relleno el formulario y pulso "Guardar" | El token **no** cambia: tu comando de chat sigue funcionando |
| **Cambiar mi API key** | Pego la key nueva en el campo de la key y pulso "Guardar" | Si dejo el campo **vacio**, se conserva la que ya tenia |
| **Cambiar mi token** (por seguridad) | Pulso "Regenerar token" | El token viejo deja de funcionar. **Actualiza el comando** en Nightbot/StreamElements copiandolo otra vez desde `/setup` |
| **Borrar todo y empezar de cero** | Pulso "Borrar mis datos" | Se borra tu fila de la base de datos. Tu comando dejara de responder |

### Por que regenerar el token
El token va escrito dentro del comando de chat, asi que **los moderadores de tu canal pueden
verlo**. Con el token, alguien podria preguntar el rango usando tu servicio. No es grave (solo
muestran tu propio rango), pero si te incomoda, regenera el token y copia el comando nuevo.

---

# Parte 8 - Despliegue desde cero

> Esta parte es para quien **instala** el servicio. Si solo quieres usar el comando de tu canal,
> no necesitas leerla. El servicio ya esta desplegado en https://valo-rango-bot.onrender.com.

## 8.1 Que necesitas

- Una cuenta de **Render** (https://render.com) - el sitio donde vive el servicio.
- Una cuenta de **Twitch de desarrollador** (https://dev.twitch.tv/console/apps) - da las
  credenciales con las que se hace el "Conectar con Twitch".
- Una base de datos **PostgreSQL** - Render la crea gratis en 2 clics.

## 8.2 Crear la base de datos

1. En https://dashboard.render.com pulsa **New +** -> **Postgres**.
2. Nombre: `valo_rango_db`. **Region: la misma** que usaras para el servicio web.
3. Plan: **Free**.
4. **Create Database**. Cuando termine, abre la pestana **Info** y copia la
   **Internal Database URL** (empieza por `postgresql://...` y el host es privado, tipo
   `dpg-xxxx-a`). Esa URL es tu variable `DATABASE_URL`.
   - Usa siempre la **Internal**, no la externa: es mas rapida y no sale a internet.

## 8.3 Crear la app de Twitch

1. Abre https://dev.twitch.tv/console/apps e inicia sesion con Twitch.
2. Pestana **Applications** -> **Register an Application**.
3. Rellena:
   - **Name**: `ValoRangoBot` (tiene que ser unico entre todas las apps de Twitch).
   - **OAuth Redirect URLs**: escribe `https://TU-SERVICIO.onrender.com/auth/callback`
     y pulsa **Add**. La ruta `/auth/callback` es **exacta**: si te equivocas, el login fallara.
   - **Category**: `Website Integration`.
   - Tipo de cliente: **Confidential** (el bot guarda el secret en un servidor; con "Public" no
     se puede usar el flujo de login por codigo).
   - Marca **"I'm not a robot"** y pulsa **Create**.
4. **Client ID**: se ve directamente en la pagina de la app. Copialo.
5. **Client Secret**: abajo, pulsa **New Secret** -> **Show** -> copialo.
   (Cada vez que generes uno nuevo, el anterior deja de funcionar.)

> **Requisito de Twitch:** tu cuenta de Twitch necesita **2FA (doble factor)** activado para poder
> registrar una app. Se activa en Twitch -> foto de perfil -> **Settings** -> **Security and
> Privacy** -> **Set Up Two-Factor Authentication** (te pide el movil + una app de autenticador).

## 8.4 Crear el servicio web

En https://dashboard.render.com -> **New +** -> **Web Service** -> conecta el repositorio
`SkrillyG/valo_rango_bot`.

| Ajuste | Valor | Por que |
|---|---|---|
| Branch | `main` | |
| **Root Directory** | `valo_rango_bot` | **Obligatorio.** El `package.json` esta dentro de esa carpeta. Si lo dejas vacio el deploy falla |
| Runtime | Node | |
| Build Command | `npm ci` | |
| Start Command | `npm start` | |
| Type | **Web Service** | Nunca "Background Worker": este bot escucha peticiones web |
| Health Check Path | `/health` | Render lo usa para saber si el servicio esta vivo |

## 8.5 Variables de entorno

En el servicio web -> menu lateral -> **Environment** -> **+ Add Environment Variable**.
Anade estas 6:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La **Internal Database URL** del punto 8.2 |
| `ENCRYPTION_KEY` | Un texto aleatorio largo (ver abajo) |
| `SESSION_SECRET` | Otro texto aleatorio largo (ver abajo) |
| `TWITCH_CLIENT_ID` | El Client ID de tu app de Twitch |
| `TWITCH_CLIENT_SECRET` | El Client Secret de tu app de Twitch |
| `BASE_URL` | `https://TU-SERVICIO.onrender.com` |

Para generar las dos claves secretas, en una terminal (en Windows con Git Bash, en Mac/Linux con
la Terminal):

```bash
openssl rand -hex 32
```

Ejecutalo dos veces: la primera para `ENCRYPTION_KEY` y la segunda para `SESSION_SECRET`. Son 64
letras y numeros.

En el campo *Value* de Render **pégalas tal cual** (no hace falta usar el botón del ojo, pero si
quieres comprobarlo, ese botón te muestra el valor un momento antes de guardarlo).

Cuando termines de anadir las variables, pulsa **Save** y elige **"Save and deploy"** (no
"Save only": esa deja las variables guardadas pero **no reinicia el servicio**, asi que no se
aplican hasta el proximo deploy).

## 8.6 Desplegar y comprobar

1. En la pestana **Events** espera a ver `Build succeeded` y `Deploy live` (1-2 minutos).
2. Abre `https://TU-SERVICIO.onrender.com/health`. Debe salir:
   ```json
   {"ok":true,"baseDeDatos":true,"degradado":false,"faltantes":[]}
   ```
   Si `degradado` es `true`, el campo `faltantes` te dice **exactamente** que variable falta.
3. Abre `https://TU-SERVICIO.onrender.com/setup` y haz la Parte 3.

## 8.7 Trampas de Render (leelas antes de que te ocurran)

- **El disco no es permanente.** Cada redeploy borra todo el sistema de archivos. Por eso toda la
  configuracion vive en Postgres y nunca en ficheros.
- **El plan gratuito se duerme** tras ~15 minutos sin visitas y tarda ~50 segundos en despertar.
  Eso rompe el limite de 15 segundos de StreamElements: el primer comando tras una pausa dara
  error. **Solucion:** un "keep-alive" que visite `/health` cada 5 minutos.
  Este repositorio ya trae `.github/workflows/keepalive.yml` que lo hace. Para que funcione, en
  GitHub -> **Settings -> Actions -> General**, desmarca **"Disable scheduled workflows"**.
  (Tambien sirve UptimeRobot gratuito, o un plan de pago de Render.)
- **Los cron de Render no existen** en los Web Services. Si necesitas tareas periodicas, crea
  aparte un Worker.
- **Nunca subes un archivo `.env` al repositorio.** Las variables se ponden en el panel de Render.
  El `.env` esta en `.gitignore` y solo se usa en tu ordenador.

## 8.8 Si el deploy falla

| Lo que ves en los logs | Por que pasa | Que hacer |
|---|---|---|
| `npm ci can only install packages when your package.json and package-lock.json ... are in sync` | El `package-lock.json` no coincide con el `package.json` | `npm install --package-lock-only` y subir el lock |
| `npm ERR! code ENOENT ... package.json` | El **Root Directory** no apunta a `valo_rango_bot` | Corregir *Root Directory* y hacer **Manual Deploy** |
| `[ERROR] Variables de entorno obligatorias ausentes: ...` | Faltan variables en *Environment* | Completar la tabla del punto 8.5 |
| `no se pudo preparar la base de datos` | `DATABASE_URL` mal copiada | Copiar de nuevo la **Internal Database URL** |
| `ENCRYPTION_KEY es demasiado corta` | La clave tiene menos de 16 caracteres | `openssl rand -hex 32` |

**Modo degradado (para que no te quedes sin servicio).** Si falta alguna variable, el servicio
**no se cae**: arranca igual, responde `200` en `/health` con `"degradado": true` y la lista de lo
que falta, enseña un aviso en la portada y en `/setup`, y `/rank` devuelve un texto legible en vez
de un error 500. Un despliegue nunca se queda en "failed" por un ajuste de entorno: se ve que
falta algo y se arregla sin parar el servicio.

---

## Parte 9 - Problemas frecuentes

| Lo que ves en el chat | Por que | Como se arregla |
|---|---|---|
| `Configuracion no encontrada. Revisa tu comando.` | El token no existe o esta caducado (regeneraste) | Vuelve a `/setup` y copia el comando otra vez |
| `Falta configurar el bot en https://...` | No has pegado tu API key | Entra en `/setup`, pega la key y guarda |
| `No se encontro el jugador. Revisa tu Riot ID.` | Riot ID o region equivocados | Corrige el nombre, la etiqueta o la region en `/setup` |
| `La key del proveedor no es valida.` | La API key esta caducada o mal copiada | Genera una nueva y pegala en `/setup` |
| `No se pudo obtener el rango, intenta de nuevo en un momento.` | El servicio de datos de Valorant esta caido o te ha dado un limite de peticiones | Espera un minuto y vuelve a probar |
| `Demasiadas peticiones, espera un momento.` | Alguien esta llamando al comando muchisimo | Espera un minuto |
| `Moved Permanently` | El comando usa `http://` en vez de `https://` | Recopialo desde `/setup` |
| `Could not connect to remote server` | El servicio estaba dormido (plan gratis) | Activa el keep-alive contra `/health` |
| El mensaje sale con un `!` o un `/` delante | Se copio un simbolo de mas | Recopiar el comando entero desde `/setup` |
| Sale el rango de otro jugador | El token es de otro canal | Copia tu comando de `/setup` |

### Comprobaciones rapidas (si te mola la terminal)

```bash
# 1. ¿El servicio esta vivo?
curl -s https://valo-rango-bot.onrender.com/health

# 2. ¿Mi token funciona? (pega tu token)
curl -s "https://valo-rango-bot.onrender.com/rank?token=PEGA_AQUI_TU_TOKEN"

# 3. ¿En ingles?
curl -s "https://valo-rango-bot.onrender.com/rank?token=PEGA_AQUI_TU_TOKEN&lang=en"

# 4. ¿La pagina de configuracion carga?
curl -s -o /dev/null -w "%{http_code}\n" https://valo-rango-bot.onrender.com/setup
```

En los logs de Render, cada peticion deja una linea con la ruta, el tiempo y de donde salio el
dato (`cache`, `v3`, `v1`, `stale`):

```
[2026-10-21T18:40:11.204Z] INFO GET /rank -> 200 { ms: 512, origen: 'v3' }
```

---

## Parte 10 - Glosario

| Palabra | Significado |
|---|---|
| **API key** | Llave que da un servicio para que le dejes consultar datos. aqui, la del proveedor de datos de Valorant |
| **Token** | Codigo aleatorio que identifica a tu canal ante el bot |
| **OAuth** | El mecanismo con el que Twitch deja que tu bot "entre" como tu sin pedirte tu contrasena |
| **Web Service** | En Render, un servicio que espera peticiones web (es lo que es este bot) |
| **Postgres / PostgreSQL** | La base de datos donde se guardan las configuraciones (claves cifradas, tokens hasheados) |
| **Cifrar** | Guardar algo de forma que no se pueda leer sin una llave |
| **Hashear** | Convertir algo en una huella digital irreversible: se puede comprobar, pero no recuperar |
| **Root Directory** | En Render, la carpeta del repositorio donde vive el codigo (`valo_rango_bot`) |
| **Keep-alive** | Una visita automatica cada pocos minutos para que el plan gratis no se duerma |
| **Deadline** | Tiempo maximo que el bot se da para responder antes de rendirse |

---

## Parte 11 - Seguridad

- Las **API keys se cifran** (AES-256-GCM) antes de llegar a la base de datos. La llave del cifrado
  vive en `ENCRYPTION_KEY`, fuera del repositorio.
- Los **tokens se guardan hasheados** (SHA-256). En la base de datos no hay ningun token en claro y
  **ningun token se puede recuperar**: solo regenerarlo.
- Los **logs ocultan** cualquier `token`, `key`, `secret` o `password` que aparezca.
- **Ninguna respuesta** enseña la key ni el token. La pagina `/setup` solo muestra el token cuando
  es nuevo, y la key nunca se vuelve a imprimir.
- **Cada streamer usa su propia key** y solo se consultan datos de su propio Riot ID: el token de
  un streamer no puede usarse para preguntar el rango de otro.
- **Limite de peticiones**: 30 por minuto y token, y 20 por minuto y IP en `/setup` y `/auth`.
- El **token va en la URL del comando**, asi que los moderadores del canal pueden verlo. `/setup` te
  avisa y ofrece regenerarlo en un clic.
- La **cookie de sesion** es `httpOnly`, `sameSite=lax` y `secure` en produccion.

### Si crees que se ha filtrado algo

1. **API key**: entra en el panel de HenrikDev, revoca esa key y genera otra. Vuelve a `/setup` y
   pegala.
2. **Token**: `/setup` -> "Regenerar token" -> copia el comando nuevo en Nightbot/StreamElements.
3. **Claves del servidor**: en Render -> Environment -> genera nuevos `ENCRYPTION_KEY` y
   `SESSION_SECRET` -> **Save and deploy**. Ojo: al cambiar `ENCRYPTION_KEY` las API keys ya
   guardadas dejan de descifrarse, asi que los streamers tendran que volver a pegarlas.
4. **Contrasena de la base de datos**: en Render -> Postgres -> **Info** -> **Credentials** ->
   crea un usuario nuevo (Render lo pone como usuario principal y actualiza las URLs), actualiza
   `DATABASE_URL` en el servicio web, espera a que `/health` siga respondiendo `ok:true` y solo
   entonces elimina el usuario antiguo.

---

## Parte 12 - Referencia tecnica

### Rutas

| Ruta | Respuesta | Uso |
|---|---|---|
| `GET /rank?token=<token>` | Texto plano con el rango del dueño del token | Comando de chat |
| `GET /rank?token=<token>&lang=es\|en` | Fuerza el idioma | Igual que el anterior |
| `GET /rango?token=<token>` | Igual que `/rank` pero siempre en espanol | Alias en espanol |
| `GET /api/rank?token=<token>` | JSON `{ ok, twitch_login, riot_id, rango, rr, ... }` | Consumo programatico. Solo devuelve el valor cacheado y nunca expone la key ni el token |
| `GET /setup` | Pagina de configuracion | Login con Twitch + formulario |
| `GET /auth/login` | Redirige a Twitch | Boton "Conectar con Twitch" |
| `GET /auth/callback` | Callback de OAuth | **Aqui va la Redirect URL de Twitch** |
| `GET /auth/logout` | Cierra la sesion | Boton "Salir" |
| `GET /health` | JSON de estado | Health check de Render, UptimeRobot |
| `GET /` | Portada con instrucciones | Comprobacion rapida |

`/rank` y `/rango` devuelven **siempre HTTP 200** con `Content-Type: text/plain; charset=utf-8`.
Si algo falla se responde con un mensaje legible en lugar de un 4xx/5xx, porque el proxy de
StreamElements sustituye cualquier error por un texto generico que no dice nada.

Los mensajes nunca empiezan por `/`, `.` ni `!` y siempre miden menos de 400 caracteres
(Nightbot exige `< 400`; StreamElements trunca a 400 bytes).

### Variables de entorno

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
| `NODE_ENV` | no | - | `production` en Render |
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

> Si cambias `ENCRYPTION_KEY`, las API keys ya guardadas dejan de descifrarse. Habra que volver a
> pegarlas en `/setup`.

### Como se consulta al proveedor

```
GET https://api.henrikdev.xyz/valorant/v3/mmr/{region}/{platform}/{name}/{tag}
Authorization: <API KEY DEL STREAMER>
```

Campos usados: `data.current.tier.name` (tier) y `data.current.rr` (RR).
Si el v3 falla por `401/403` (key invalida) o `404` (Riot ID inexistente) no se intenta el v1 y se
responde con el mensaje de error correspondiente. Para cualquier otro fallo, si hay un valor
cacheado, se sirve el valor viejo antes que un error en pantalla.

### Desarrollo local

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

### Estructura

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
