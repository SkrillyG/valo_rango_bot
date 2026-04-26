const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

let cache = null;
let lastFetch = 0;

async function obtenerRango() {
  try {
    const now = Date.now();

    if (cache && now - lastFetch < 10000) {
      console.log("Usando cache");
      return cache;
    }

    console.log("Consultando API...");

    const response = await axios.get(
      "https://api.henrikdev.xyz/valorant/v1/mmr/eu/macarrones/pato"
    );

    if (!response.data || !response.data.data) {
      throw new Error("Respuesta inválida de la API");
    }

    cache = {
      rango: response.data.data.currenttierpatched,
      rr: response.data.data.ranking_in_tier,
    };

    lastFetch = now;

    return cache;

  } catch (error) {
    console.error("ERROR EN API:", error.response?.data || error.message);

    // 🔥 fallback: devolver cache si existe
    if (cache) {
      return cache;
    }

    throw error;
  }
}

// ruta base
app.get("/", (req, res) => {
  res.send("API activa 🚀");
});

// español
app.get("/rango", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`El rango de Sofi es: ${rango} (${rr} RR)`);
  } catch {
    res.send("No se pudo obtener el rango en este momento.");
  }
});

// inglés
app.get("/rank", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`Sofi's current rank is: ${rango} (${rr} RR)`);
  } catch {
    res.send("Could not retrieve the rank right now.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});