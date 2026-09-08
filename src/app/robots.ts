import type { MetadataRoute } from "next";
import { SITE } from "@/shared/constants/site";

/**
 * El sitio es institucional y público: se indexa entero.
 *
 * `sitemap` apunta al que genera `sitemap.ts`, que existe de verdad. Declarar
 * un sitemap inexistente, que es lo que hacían los prototipos, le sirve un 404
 * a cada rastreador que lo pida.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
