# SkrillyG / valo_rango_bot

Bot de visualizacion de rango en Valorant para twitch.

El codigo del servicio vive en **[`valo_rango_bot/`](./valo_rango_bot/)** y es ese directorio el
que Render usa como **Root Directory**.

```
.
├── .github/workflows/keepalive.yml   # cron cada 7 min contra /health (verificar que Actions lo ejecuta)
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
