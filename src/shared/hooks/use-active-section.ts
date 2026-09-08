"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve el id de la sección que el usuario está mirando, y un setter para
 * adelantarse al scroll cuando el usuario hace click en el menú.
 *
 * La detección usa una FRANJA en el medio del viewport, no el borde superior:
 * `rootMargin: "-45% 0px -55% 0px"` recorta el área de observación a una tira
 * horizontal de 0% de alto ubicada al 45% de la pantalla. Una sección solo
 * "intersecta" mientras cruza esa línea, así que en todo momento hay una sola
 * activa y no hay que desempatar entre varias visibles a la vez.
 *
 * El setter existe porque el scroll suave tarda ~1s en llegar: sin él, al
 * hacer click el ítem quedaría sin marcar hasta que la animación termine.
 */
export function useActiveSection(ids: readonly string[]) {
  const [activo, setActivo] = useState<string | null>(null);

  // `ids` suele venir de un `.map()` en línea, que crea un array nuevo en cada
  // render. Se usa su contenido como dependencia, no su identidad.
  const clave = ids.join(",");

  useEffect(() => {
    const secciones = clave
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (secciones.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setActivo(entrada.target.id);
        }
      },
      { rootMargin: "-45% 0px -55% 0px", threshold: 0 },
    );

    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [clave]);

  return [activo, setActivo] as const;
}
