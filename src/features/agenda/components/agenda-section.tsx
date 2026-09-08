"use client";

import { Reveal } from "@/shared/components/motion/reveal";
import { SITE } from "@/shared/constants/site";
import { ACTIVIDADES } from "../constants/actividades";
import { useAvanceLinea } from "../hooks/use-linea-tiempo";
import { ActividadFila } from "./actividad-fila";
import { LineaTiempo } from "./linea-tiempo";

/**
 * Agenda de actividades — línea de tiempo que se dibuja al scrollear.
 *
 * LA LÍNEA ES UN EJE, NO UN ADORNO. `--eje` guarda su posición horizontal y
 * la heredan los dos que tienen que coincidir con ella: el SVG y los nodos de
 * cada fila. Un solo valor, dos consumidores, imposible que se desalineen.
 * En móvil vale 0.75rem (la línea se va al margen) y en escritorio 50%: como
 * la grilla es de dos columnas iguales, el 50% cae exactamente en la canaleta
 * que las separa.
 *
 * `--avance` (0→1) lo escribe useAvanceLinea sobre esta misma lista, y de acá
 * baja por herencia hasta el `stroke-dashoffset` del trazo. Es la única cosa
 * que cambia mientras se scrollea.
 */
export function AgendaSection() {
  const lista = useAvanceLinea<HTMLOListElement>();

  return (
    <section id="agenda" aria-labelledby="agenda-titulo" className="border-t border-border py-24">
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 03
          </p>
          <h2 id="agenda-titulo" className="mt-3 text-3xl font-bold text-balance text-text">
            Agenda de actividades
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            {SITE.dates.label}. Cuatro días de charlas, demostraciones en vivo y rondas de negocios,
            ordenados por el momento en que ocurren.
          </p>
        </Reveal>
      </div>

      <div className="container-content mt-16">
        <ol
          ref={lista}
          // Sin viñetas, Safari deja de anunciar la lista como lista: el role
          // explícito devuelve la semántica que el estilo se llevó puesta.
          role="list"
          className="agenda-tiempo relative flex flex-col gap-20 [--eje:0.75rem] lg:gap-28 lg:[--eje:50%]"
        >
          {/* Empieza a la altura del primer nodo (top-6) para que el trazo
              nazca en él y no un poco más arriba, en el aire.

              EL ALTO VA EXPLÍCITO, NO CON `bottom-0`. Un <svg> con viewBox y
              sin alto declarado es un elemento reemplazado con proporción
              intrínseca: con `height: auto` el navegador usa su alto
              intrínseco e IGNORA `bottom`. Se detectó midiendo el DOM —la
              línea medía 1000px, el alto del viewBox, contra los 3611px de la
              lista— y en una captura habría pasado por un detalle de estilo. */}
          <LineaTiempo className="absolute top-6 left-[var(--eje)] h-[calc(100%-1.5rem)] w-6 -translate-x-1/2" />

          {ACTIVIDADES.map((actividad, i) => (
            <ActividadFila key={actividad.id} actividad={actividad} indice={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
