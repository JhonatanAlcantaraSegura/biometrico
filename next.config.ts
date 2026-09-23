import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El prototipo no consume datos reales ni imagenes remotas: las fotos de la portada viven
  // en `public/imagenes`. Cuando exista backend, aqui se configura el proxy hacia el gateway
  // (docs/03-ARQUITECTURA.md).
};

export default nextConfig;
