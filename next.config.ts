import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Fotografia de marcador de posicion del sitio publico (picsum.photos), siempre en
    // escala de grises para que no rompa la paleta monocroma de `DESIGN.md`. Patron
    // estrecho a proposito: solo `/seed/**` y solo la variante `?grayscale`. Sustituir por
    // fotografia propia del hospital en cuanto exista (ver `app/page.tsx`).
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", port: "", pathname: "/seed/**", search: "?grayscale" },
    ],
  },
  // Cuando exista backend, aqui se configura el proxy hacia el gateway (docs/03-ARQUITECTURA.md).
};

export default nextConfig;
