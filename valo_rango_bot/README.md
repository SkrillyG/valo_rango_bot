# ValoRangoBot

Bot de visualizacion de rango en Valorant para streams de Twitch.
Expone una API HTTP minima que responde con el rango (tier + RR) del jugador y que se
consume desde StreamElements con los comandos `!rango` y `!rank`.

- **Servicio en produccion:** https://valo-rango-bot.onrender.com
- **Render Service ID:** `srv-d7n7dbipmmbs73cbtpng`
- **Repositorio:** https://github.com/SkrillyG/valo_rango_bot

---

## 1. Rutas

| Ruta | Respuesta | Uso |
|---|---|---|
| `GET /rango` | `El rango de Sofi es: Diamond 1 (38 RR)` | Texto plano en espanol, para el comando `!rango` |
| `GET /rank` | `Sofi's current rank is: Diamond 1 (38 RR)` | Texto plano en ingles, para el comando `!rank` |
| `GET /api/rango` | JSON `{ ok, rango, rr, origen, actualizadoEn }` | Consumption programatica |
| `GET /api/rank` | Mismo JSON que `/api/rango` | Alias |
| `GET /health` | JSON de estado del servicio | Keep-alive, monitorizacion y diagnostico |
| `GET /` | Indice de rutas | Comprobacion rapida |

Las rutas de texto plano devuelven **siempre HTTP 200**. Si el API falla se responde con
un mensaje legible en lugar de un 5xx, porque el proxy de StreamElements sustituye
cualquier codigo 4xx/5xx por un error generico que no dice nada.

## 2. Variables de entorno

| Variable | Obligatoria | Default | Descripcion |
|---|---|---|---|
| `HENRIK_API_KEY` | **si** | - | API Key de HenrikDev. Sin ella el API responde `401 Unauthorized` |
| `HENRIK_API_BASE` | no | `https://api.henrikdev.xyz` | Base del API. `https://eu.api.henrikdev.xyz` es mas rapido (sin Cloudflare) |
| `HENRIK_REGION` | no | `eu` | Region del jugador |
| `HENRIK_PLATFORM` | no | `pc` | `pc`, `console` o `ps` |
| `VALORANT_NAME` | no | `macarrones` | Riot ID (nombre) |
| `VALORANT_TAG` | no | `pato` | Riot ID (tag) |
| `DISPLAY_NAME` | no | `Sofi` | Nombre que aparece en el chat |
| `CACHE_TTL_MS` | no | `60000` | Tiempo de vida de la cache en memoria |
| `UPSTREAM_TIMEOUT_MS` | no | `5000` | Timeout de cada peticion al API |
| `UPSTREAM_RETRIES` | no | `1` | Reintentos (solo ante 429, 5xx o error de red) |
| `REQUEST_DEADLINE_MS` | no | `12000` | Presupuesto maximo por peticion antes de servir cache vieja |

La key se lee de `process.env`. Nunca se escribe en el codigo ni se sube al repositorio.

## 3. API de HenrikDev

Desde la v4.0.0 la key es **obligatoria**. El bot usa el endpoint **v3**:

```
GET https://api.henrikdev.xyz/valorant/v3/mmr/{region}/{platform}/{name}/{tag}
Authorization: <HENRIK_API_KEY>
```

Campos usados: `data.current.tier.name` (tier) y `data.current.rr` (RR).

El endpoint **v1** esta deprecado pero se mantiene como fallback automatico por si el v3
cambia de forma:

```
GET https://api.henrikdev.xyz/valorant/v1/mmr/{region}/{name}/{tag}
```

Campos usados: `data.currenttierpatched` y `data.ranking_in_tier`.

Si el v3 falla por `401/403` no se intenta el v1 (misma key, mismo error) y se responde de
inmediato. Si falla por otra razon y hay un valor cacheado, se sirve el valor viejo antes que
un error en pantalla.

### Como conseguir la API Key

1. Entra en https://api.henrikdev.xyz/dashboard/ e inicia sesion.
2. En el menu lateral, **API Keys** -> **Generate New Key**.
3. Ponle un nombre (por ejemplo `valo-rango-bot`) y scope **VALORANT (Basic)**.
4. Copia la key: solo se muestra una vez.
5. Guardala en un gestor de contrasenas y en las variables de entorno de Render.

Alternativa sin registro: Discord https://discord.com/invite/X3GaVkX2YN -> canal `#get-a-key`
-> desplegable **VALORANT (Basic Key)**. La key se genera al instante.

## 4. Deploy en Render

| Ajuste | Valor |
|---|---|
| Repositorio | `SkrillyG/valo_rango_bot` |
| Rama | `main` |
| **Root Directory** | **`valo_rango_bot`** |
| Build Command | `npm ci` (o `npm install`) |
| Start Command | `npm start` |
| Environment | `HENRIK_API_KEY` = tu key |
| Health Check Path | `/health` |

> El **Root Directory** es obligatorio: el `package.json` vive en `valo_rango_bot/`, no en la
> raiz del repositorio. Si se deja vacio, Render no encuentra el `package.json` y el deploy falla
> (Render mantiene la version anterior en linea, asi que no se cae el servicio).

Despues de cambiar el Root Directory hay que lanzar un **Manual Deploy** para que el cambio
aplique al deploy actual.

## 5. Comandos en StreamElements

```
!command add !rango $(customapi https://valo-rango-bot.onrender.com/rango)
!command add !rank $(customapi https://valo-rango-bot.onrender.com/rank)
```

Limitaciones del `$(customapi)` que conviene respetar:

- **Timeout de 15 segundos** (proxy de StreamElements, no configurable).
- **Solo GET** y **no permite cabeceras**: la API Key va en el servidor, nunca en el panel.
- **Trunca la respuesta a 400 bytes**: por eso las rutas de texto plano son planas y cortas.
- **Las redirecciones no se siguen**: usa siempre `https://`. Con `http://` Cloudflare responde
  `301` y en el chat sale `Moved Permanently` en vez del rango.
- **Sin cache**: cada invocacion del comando hace una peticion nueva (el bot cachea 60 s por su lado).

Revisa tambien que el comando no tenga cooldown, que los permisos sean los correctos y que
`!rango` no este deshabilitado.

## 6. Keep-alive (evita el arranque en frio)

El plan gratuito de Render apaga el servicio tras **15 minutos sin trafico**. Cuando vuelve a
recibir una peticion tarda **10-12 segundos** en despertar, y el proxy de StreamElements tiene
un timeout de 15 segundos: por eso el primer comando tras una pausa fallaba mientras el
siguiente funcionaba.

Hay tres capas de proteccion, de mas a menos fiable:

1. **Health Check Path de Render** = `/health`. Render sondea su propia instancia mientras
   esta viva, asi que es la capa que no depende de terceros.
2. **UptimeRobot** (gratis, 5 minutos): monitor HTTP contra `https://valo-rango-bot.onrender.com/health`.
   Es la opcion externa mas fiable y la que se recomienda.
3. **GitHub Actions** (`.github/workflows/keepalive.yml`): cron cada 7 minutos contra la misma
   ruta. OJO: en este repositorio el workflow aparece registrado como `active` pero **GitHub no
   lo ejecuta** (0 ejecuciones tras 15 minutos). Si no es una limitacion de la cuenta,
   hay que activar *Settings -> Actions -> General -> Enable Actions* o desactivar
   *Disable scheduled workflows*. Verificar siempre en la pestana *Actions*.

Con cualquiera de las dos primeras la instancia permanece encendida y la respuesta baja a ~0.5 s.
La opcion definitiva es un plan de pago de Render (sin apagado por inactividad).

## 7. Diagnostico

```bash
curl -s https://valo-rango-bot.onrender.com/health     # estado, sin llamar a HenrikDev
curl -s https://valo-rango-bot.onrender.com/rango      # texto en espanol
curl -s https://valo-rango-bot.onrender.com/rank       # texto en ingles
curl -s https://valo-rango-bot.onrender.com/api/rango  # JSON
curl -s "https://valo-rango-bot.onrender.com/api/rango?force=1"  # salta la cache
```

En los logs de Render cada peticion deja una linea con ruta, duracion y origen del dato
(`cache`, `v3`, `v1`, `stale`):

```
[2026-10-21T18:40:11.204Z] INFO GET /rango -> 200 { ms: 512, origen: 'v3' }
```

| Sintoma | Causa probable | Solucion |
|---|---|---|
| `/rango` devuelve el mensaje de error | API Key ausente, incorrecta o no desplegada | Revisar `apiKeyConfigurada` en `/health` y las env vars de Render |
| `/rango` responde en 10-12 s | Instancia dormida | Activar el keep-alive |
| En el chat sale `Moved Permanently` | El comando usa `http://` | Cambiar a `https://` |
| En el chat sale `Could not connect to remote server` | Timeout del proxy de SE | Keep-alive; el cold start consume 12 de los 15 s |
| En el chat sale `returned status code 404` | URL equivocada en el comando | Debe ser `/rango` o `/rank` en el host `valo-rango-bot.onrender.com` |

## 8. Desarrollo local

```bash
cd valo_rango_bot
npm install
cp .env.example .env      # y pega HENRIK_API_KEY=...
npm start
```

`npm run dev` reinicia el servidor al guardar cambios.

El archivo `.env` esta en `.gitignore`: no se sube nunca.
