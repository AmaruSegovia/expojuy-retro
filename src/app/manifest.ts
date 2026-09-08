import type { MetadataRoute } from "next";
import { SITE } from "@/shared/constants/site";
import { BRAND_ICON_DATA_URI } from "@/shared/components/brand/brand-mark-paths";

/**
 * Manifiesto de aplicación web.
 *
 * El ícono sale de la misma geometría del isologotipo que usan la marca
 * visible y la máscara del loader, no de un archivo aparte que pueda
 * desincronizarse. Es un SVG, así que una sola declaración cubre todas las
 * escalas y `purpose: "any maskable"` deja que Android lo recorte sin comerse
 * el trazo.
 *
 * `background_color` es el fondo de la pantalla de carga y `theme_color` el de
 * la barra del navegador: son distintos a propósito, igual que en el sitio.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} - ${SITE.claim}`,
    short_name: SITE.name,
    description: SITE.description,
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#230048",
    theme_color: "#0b0911",
    icons: [
      {
        src: BRAND_ICON_DATA_URI,
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
