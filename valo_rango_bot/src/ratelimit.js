"use strict";

class Ventana {
  constructor(windowMs, max) {
    this.windowMs = windowMs;
    this.max = max;
    this.contadores = new Map();
  }

  permitir(clave, ahora = Date.now()) {
    const entrada = this.contadores.get(clave);
    if (!entrada || ahora - entrada.inicio >= this.windowMs) {
      this.contadores.set(clave, { inicio: ahora, cuenta: 1 });
      this.podar(ahora);
      return { permitido: true, restantes: this.max - 1 };
    }
    entrada.cuenta += 1;
    const restantes = Math.max(0, this.max - entrada.cuenta);
    return { permitido: entrada.cuenta <= this.max, restantes };
  }

  reiniciar(clave) {
    this.contadores.delete(clave);
  }

  podar(ahora = Date.now()) {
    if (this.contadores.size < 2000) return;
    for (const [clave, entrada] of this.contadores) {
      if (ahora - entrada.inicio >= this.windowMs) this.contadores.delete(clave);
    }
  }

  get tamano() {
    return this.contadores.size;
  }
}

module.exports = { Ventana };
