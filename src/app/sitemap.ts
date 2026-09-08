import type { MetadataRoute } from "next";
import { SITE } from "@/shared/constants/site";

/**
 * El sitio es de una sola página, así que el sitemap tiene una sola entrada.
 *
 * Las secciones son anclas dentro de ese documento, no URLs: listarlas acá
 * como `#agenda` o `#mapa` no aporta nada porque los buscadores no indexan
 * fragmentos como recursos separados, y algunos validadores lo marcan como
 * error. Si en el futuro alguna sección pasa a ruta propia, se agrega acá.
 *
 * `robots.ts` referencia este archivo. Los tres prototipos declaraban un
 * sitemap en su robots.txt sin generarlo: eso servía un 404 a los rastreadores.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
