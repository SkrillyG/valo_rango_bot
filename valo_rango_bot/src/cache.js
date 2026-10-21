"use strict";

class CacheTTL {
  constructor(ttlMs, staleMs) {
    this.ttlMs = ttlMs;
    this.staleMs = staleMs;
    this.datos = new Map();
  }

  obtener(clave) {
    const entrada = this.datos.get(clave);
    if (!entrada) return null;
    const edad = Date.now() - entrada.guardadoEn;
    if (edad > this.staleMs) {
      this.datos.delete(clave);
      return null;
    }
    return { ...entrada.valor, guardadoEn: entrada.guardadoEn, edadMs: edad };
  }

  guardar(clave, valor) {
    const guardadoEn = Date.now();
    this.datos.set(clave, { valor, guardadoEn });
    if (this.datos.size > 5000) this.podar();
    return guardadoEn;
  }

  borrar(clave) {
    this.datos.delete(clave);
  }

  podar() {
    const limite = Date.now() - this.staleMs;
    for (const [clave, entrada] of this.datos) {
      if (entrada.guardadoEn < limite) this.datos.delete(clave);
    }
  }

  get tamano() {
    return this.datos.size;
  }
}

module.exports = { CacheTTL };
