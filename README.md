# SkrillyG / valo_rango_bot

API HTTP publica **multi-streamer** que devuelve el rango de Valorant de un jugador en texto plano,
para usar como comando en **Nightbot** y **StreamElements**.

Cada streamer se configura el mismo (login con Twitch + su propia key del proveedor) y recibe un
token unico. Las keys se cifran en la base de datos y el token viaja en la URL del comando.

El codigo del servicio vive en **[`valo_rango_bot/`](./valo_rango_bot/)** y es ese directorio el
que Render usa como **Root Directory**.

```
.
├── .github/workflows/keepalive.yml   # cron cada 5 min contra /health (opcional, ver guia)
├── .gitignore
├── README.md
└── valo_rango_bot/                   # Root Directory de Render
    ├── .env.example
    ├── .gitignore
    ├── README.md                     # GUIA COMPLETA (desde cero, paso a paso)
    ├── index.js
    ├── package.json
    ├── package-lock.json
    ├── src/                          # server, db, crypto, cache, oauth, vistas
    └── test/smoke.js
```

- Servicio: https://valo-rango-bot.onrender.com
- Render Service ID: `srv-d7n7dbipmmbs73cbtpng`
- **Guia completa (para quien no sabe de programacion):**
  [`valo_rango_bot/README.md`](./valo_rango_bot/README.md)

## La guia paso a paso

Todo el detalle esta en [`valo_rango_bot/README.md`](./valo_rango_bot/README.md), organizado en:

| Parte | Contenido |
|---|---|
| 1-2 | Que necesitas y como conseguir tu API key de Valorant |
| 3 | Configurar tu canal en la pagina `/setup` |
| 4 | Poner el comando en **Nightbot** |
| 5 | Poner el comando en **StreamElements** |
| 6 | Probarlo y verificar que funciona |
| 7 | Uso diario: editar, regenerar token, borrar datos |
| 8 | Despliegue desde cero (Render + Twitch) |
| 9 | Problemas frecuentes y como se arreglan |
| 10-12 | Glosario, seguridad y referencia tecnica |

## Despliegue rapido

1. Root Directory = `valo_rango_bot`, Health Check Path = `/health`, start command = `npm start`.
2. Variables de entorno en Render (ver `.env.example`):
   `DATABASE_URL`, `ENCRYPTION_KEY`, `SESSION_SECRET`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`,
   `BASE_URL`.
3. App de Twitch en https://dev.twitch.tv/console/apps tipo **Confidential**, con OAuth Redirect URL
   `https://valo-rango-bot.onrender.com/auth/callback`.

> `HENRIK_API_KEY` ya **no se usa**: cada streamer pega su propia key en `/setup` y se guarda
> cifrada en la base de datos.

## Estado

El servicio esta desplegado y funcionando:

| Ruta | Que hace |
|---|---|
| `/setup` | Configuracion del streamer (login con Twitch, key, Riot ID, region, idioma) |
| `/rank?token=...` | Rango del streamer dueño del token (texto plano, siempre HTTP 200) |
| `/rango?token=...` | Igual que `/rank` pero forzando espanol |
| `/api/rank?token=...` | Mismo dato en JSON |
| `/health` | Estado del servicio y de la base de datos |

Las respuestas del rango son de menos de 400 bytes (limite de StreamElements), nunca empiezan por
`/`, `.` ni `!`, e incluyen el nombre del streamer. El keep-alive es una mejora de latencia, no un
requisito: sin el, el bot sigue respondiendo tras el arranque en frio porque el servidor tiene un
deadline por peticion.
