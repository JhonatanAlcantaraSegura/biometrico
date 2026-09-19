import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El prototipo no consume datos reales: no hay imagenes remotas ni rewrites.
  // Cuando exista backend, aqui se configura el proxy hacia el gateway (docs/03-ARQUITECTURA.md).
};

export default nextConfig;
