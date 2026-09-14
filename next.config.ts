import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        // El service worker tiene que llegar siempre fresco. Con caché, un
        // cambio en sus notificaciones podría tardar días en llegar a quien ya
        // lo tiene instalado. Recomendado por la guía de PWA de Next 16.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
