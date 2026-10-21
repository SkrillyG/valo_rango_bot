# SkrillyG / valo_rango_bot

Bot de visualizacion de rango en Valorant para twitch.

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
    ├── README.md                     # guia operativa completa
    ├── index.js
    ├── package.json
    └── package-lock.json
```

- Servicio: https://valo-rango-bot.onrender.com
- Render Service ID: `srv-d7n7dbipmmbs73cbtpng`
- Documentacion del servicio, deploy, comandos de StreamElements y diagnostico:
  [`valo_rango_bot/README.md`](./valo_rango_bot/README.md)

## Despliegue rapido

1. `HENRIK_API_KEY` en las variables de entorno de Render (obligatoria, ver la guia).
2. Root Directory = `valo_rango_bot`, Health Check Path = `/health`.
3. `npm start` como start command.

## Estado

El servicio esta desplegado y funcionando en los dos idiomas:

| Ruta | Idioma | Respuesta |
|---|---|---|
| `/rango` | ES | `El rango de Sofi es: Gold 2 (71 RR)` |
| `/rank` | EN | `Sofi's current rank is: Gold 2 (71 RR)` |

Ambas devuelven texto plano de menos de 400 bytes (limite de StreamElements) y siempre HTTP 200.
El keep-alive es una mejora de latencia, no un requisito: sin el, el bot sigue respondiendo tras
el arranque en frio porque el servidor tiene un deadline de 12 s por peticion.
