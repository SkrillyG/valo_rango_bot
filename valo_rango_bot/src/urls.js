"use strict";

function baseUrl(config, req) {
  if (config.baseUrlEsFijo) return config.baseUrl;
  if (!req) return config.baseUrl;
  const protocolo = (req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
  const host = req.get("host");
  return host ? `${protocolo}://${host}` : config.baseUrl;
}

function urlCallback(config, req) {
  return `${baseUrl(config, req)}/auth/callback`;
}

module.exports = { baseUrl, urlCallback };
