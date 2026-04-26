const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

async function obtenerRango() {
  const response = await axios.get(
    "https://api.henrikdev.xyz/valorant/v1/mmr/eu/macarrones/pato"
  );

  return {
    rango: response.data.data.currenttierpatched,
    rr: response.data.data.ranking_in_tier,
  };
}

// 🇪🇸 Español
app.get("/rango", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`El rango de Sofi es: ${rango} (${rr} RR)`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("No se pudo obtener el rango en este momento.");
  }
});

// 🇬🇧 English
app.get("/rank", async (req, res) => {
  try {
    const { rango, rr } = await obtenerRango();
    res.send(`Sofi's current rank is: ${rango} (${rr} RR)`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("Could not retrieve the rank right now.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// update deploy