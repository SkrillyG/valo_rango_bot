const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Cache simple
let cache = null;
let lastFetch = 0;

async function obtenerRango() {
  const now = Date.now();

  // ⏱️ Cache por 10 segundos
  if (cache && now - lastFetch < 10000) {
    console.log("Usando cache");
    return cache;
  }

  console.log("Consultando API...");

  const response = await axios.get(
    "https://api.henrikdev.xyz/valorant/v1/mmr/eu/macarrones/pato"
  );

  cache = {
    rango: response.data.data.currenttierpatched,
    rr: response.data.data.ranking_in_tier,
  };

  lastFetch = now;

  return cache;
}

// 🏠 Ruta principal
app.get("/", (req, res) => {
  res.send("API activa 🚀 Usa /rango o /rank");
});

// 🇪🇸 Español
app.get("/rango", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`El rango de Sofi es: ${rango} (${rr} RR)`);
  } catch (error) {
    console.error("ERROR /rango:", error.response?.data || error.message);
    res.send("No se pudo obtener el rango en este momento.");
  }
});

// 🇬🇧 English
app.get("/rank", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`Sofi's current rank is: ${rango} (${rr} RR)`);
  } catch (error) {
    console.error("ERROR /rank:", error.response?.data || error.message);
    res.send("Could not retrieve the rank right now.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});