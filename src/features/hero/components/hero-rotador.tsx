"use client";

import { useEffect, useState } from "react";
import { HERO_PARES, HERO_ROTACION_MS } from "../constants/media";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/**
 * Bajada del hero: dos textos que rotan cada 3 segundos con un giro en 3D.
 * La mitad izquierda sale hacia arriba y la derecha hacia abajo, de modo que
 * la línea se parte en dos que giran en sentidos opuestos.
 *
 * POR QUÉ LA UNIDAD ES LA LÍNEA Y NO CADA MITAD
 * La primera versión daba a cada mitad su propia ranura de ancho fijo, con la
 * coma anclada entre ambas. El efecto funcionaba pero el conjunto se veía
 * descentrado: como las ranuras tenían anchos distintos (una 171px y la otra
 * 293px), la coma no caía en el centro de la línea, y el texto quedaba
 * centrado respecto de la coma en vez de respecto del contenedor.
 *
 * Ahora la unidad es el PAR COMPLETO. Todos los pares se apilan en la misma
 * celda de una grilla con `justify-items: center`, así cada uno queda centrado
 * por sí mismo sin importar cuánto mida. Las mitades siguen girando en
 * sentidos opuestos, pero dentro de una línea que ya está centrada.
 *
 * El apilado además hace que el bloque mida siempre lo que el par más largo y
 * lo más alto que necesite, así que la rotación no mueve nada de lo que está
 * arriba ni abajo.
 *
 * ACCESIBILIDAD
 * La rotación es decorativa: se oculta a los lectores de pantalla y, al lado,
 * va la sede en texto plano solo para ellos. Así el dato real se anuncia una
 * vez y no cinco frases girando.
 *
 * Con `prefers-reduced-motion` no rota: se queda fija en la sede. No se anima
 * más lento, directamente no se mueve, que es lo que corresponde para
 * contenido que se actualiza solo (WCAG 2.2.2).
 */
export function HeroRotador({ className }: { className?: string }) {
  const reducirMovimiento = usePrefersReducedMotion();
  const [indice, setIndice] = useState(0);
  const [anterior, setAnterior] = useState(-1);

  useEffect(() => {
    if (reducirMovimiento) return;
    const id = setInterval(() => {
      setIndice((actual) => {
        setAnterior(actual);
        return (actual + 1) % HERO_PARES.length;
      });
    }, HERO_ROTACION_MS);
    return () => clearInterval(id);
  }, [reducirMovimiento]);

  const estadoDe = (i: number) => {
    if (i === indice) return "entra";
    if (i === anterior) return "sale";
    return "oculto";
  };

  return (
    <p className={className}>
      {/* El dato real, solo para lectores de pantalla. */}
      <span className="sr-only">
        {HERO_PARES[0].izquierda}, {HERO_PARES[0].derecha}
      </span>

      <span aria-hidden="true" className="rotador">
        {HERO_PARES.map((par, i) => (
          // La clave incluye el índice activo para que React remonte las
          // líneas en cada rotación y las animaciones vuelvan a dispararse.
          <span key={`${i}-${indice}`} data-estado={estadoDe(i)} className="rotador__linea">
            <span className="rotador__mitad rotador__mitad--arriba">{par.izquierda}</span>
            <span className="rotador__coma">,</span>{" "}
            <span className="rotador__mitad rotador__mitad--abajo">{par.derecha}</span>
          </span>
        ))}
      </span>
    </p>
  );
}
