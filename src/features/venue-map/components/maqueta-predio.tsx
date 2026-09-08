"use client";

import { cn } from "@/shared/lib/cn";
import { useMaquetaCanvas } from "../hooks/use-maqueta-canvas";
import { PUNTOS } from "../constants/plano";

const ACCESO = "acceso";

/**
 * Los cuatro tipos de construcción y su nombre visible.
 *
 * El orden es el de la jerarquía del predio, de lo más grande a lo más chico,
 * que es el mismo orden en que sube el porcentaje de color de marca de cada
 * tono. La muestra de color la pinta el CSS desde los mismos tokens que usa el
 * lienzo, así que leyenda y dibujo no pueden desincronizarse.
 */
const TIPOS_DE_CONSTRUCCION = [
  { tipo: "nave", etiqueta: "Pabellones" },
  { tipo: "stand", etiqueta: "Stands" },
  { tipo: "modulo", etiqueta: "Gastronomía" },
  { tipo: "servicio", etiqueta: "Servicios" },
] as const;

/**
 * LA MAQUETA DEL PREDIO.
 *
 * El plano de siempre, con volumen: los edificios son cajas sobre una platea,
 * con una sola fuente de luz arriba a la izquierda y su sombra proyectada.
 *
 * EL DIBUJO ES UN LIENZO, NO NODOS DEL DOCUMENTO. La versión anterior armaba la
 * maqueta con 783 nodos y transformes 3D de CSS, y en celular el giro corría a
 * 6,6 cuadros por segundo. La medición completa y el porqué están en
 * `use-maqueta-canvas.ts`. Acá alcanza con la consecuencia: el lienzo es el
 * dibujo y por eso va `aria-hidden`.
 *
 * LOS MARCADORES SIGUEN SIENDO BOTONES DE HTML. Es lo que hace operable el
 * mapa: 36 píxeles de área táctil, foco visible, orden de tabulación real y
 * nombre accesible. El hook los reubica en cada cuadro escribiendo dos
 * propiedades por botón, que son nueve elementos y no cientos.
 *
 * SIN JAVASCRIPT NO HAY LIENZO, y por eso la sección no depende de él: la lista
 * de lugares con su descripción se sirve desde el servidor, fuera de este
 * componente. Ver `venue-map-section.tsx`.
 */
export function MaquetaPredio({
  activo,
  ruta,
  onElegir,
}: {
  /** Id del lugar elegido en el riel. */
  activo: string;
  ruta: [number, number][] | null;
  onElegir: (indice: number) => void;
}) {
  const { marco, lienzo, rotulos, girada, usada, volver } = useMaquetaCanvas({ activo, ruta });

  return (
    // TODO LO VISUAL CUELGA DE `.js`, Y ESO ES MEJORA PROGRESIVA, NO UN PARCHE.
    // Un lienzo sin JavaScript no es "el dibujo sin animar": es un rectángulo
    // vacío, y los marcadores, que se ubican por script, se apilarían todos en
    // la misma esquina. Servir eso es peor que no servir nada. Sin JavaScript la
    // sección se apoya donde siempre estuvo la información: la lista de lugares
    // con su descripción, que se sirve desde el servidor y no depende de acá.
    <div className="plano-vista">
      <div className="plano-scroll">
        <div
          ref={marco}
          className="plano-marco"
          tabIndex={0}
          role="group"
          aria-label="Maqueta del predio. Se gira arrastrándola o con las flechas del teclado; Inicio la devuelve a su posición."
        >
          <canvas ref={lienzo} aria-hidden="true" className="plano-lienzo" />

          {PUNTOS.map((p, i) => {
            const esActivo = p.id === activo;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={esActivo}
                onClick={() => onElegir(i)}
                data-senalado={esActivo ? "" : undefined}
                className="plano-punto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <span className="sr-only-focusable">{p.nombre}</span>
                {/* El pulso solo cuando el lugar activo ES el acceso: marca de
                    dónde arranca el recorrido. Se monta al activarse, y montarse
                    es lo que dispara la animación otra vez. */}
                {esActivo && p.id === ACCESO && (
                  <span
                    aria-hidden="true"
                    className="mapa-pulso absolute size-4 rounded-full bg-accent"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={cn(
                    "block rounded-full border-2 transition-all duration-control ease-standard",
                    esActivo
                      ? "size-4 border-on-accent bg-accent"
                      : "size-3 border-surface-sunken bg-link",
                    p.id === ACCESO && !esActivo && "size-4 bg-primary",
                  )}
                />
              </button>
            );
          })}

          {/* LOS NOMBRES VAN EN UN SEGUNDO LIENZO, POR ENCIMA DE LOS BOTONES.
              Los marcadores son HTML y el dibujo es un lienzo, así que el punto
              siempre le gana al texto: "Parquesito" salía tachado por su propio
              punto. Con el orden lienzo, botones, lienzo de nombres, el texto
              queda arriba de todo. No intercepta clicks porque no recibe
              eventos, así que los botones siguen siendo los que se tocan. */}
          <canvas ref={rotulos} aria-hidden="true" className="plano-rotulos" />
        </div>
      </div>

      {/* MANDOS. La pista dice que se puede girar, hasta que alguien lo hace.
          El botón de vuelta aparece solo cuando la maqueta está girada. */}
      <div className="mt-3 flex min-h-9 flex-wrap items-center justify-center gap-3">
        {!usada && (
          <p className="plano-pista items-center gap-2 text-xs text-text-subtle">
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            >
              <path d="M2 10h16M5 6l-3 4 3 4M15 6l3 4-3 4" />
            </svg>
            Arrastrá para girar la maqueta
          </p>
        )}
        {girada && (
          <button
            type="button"
            onClick={volver}
            className="rounded-full border border-border-strong px-3 py-1.5 text-xs text-text-muted transition-colors duration-control ease-standard hover:border-link hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Volver a la vista original
          </button>
        )}
      </div>

      {/* LA LEYENDA NO ES UN ADORNO. Los cuatro tonos de la maqueta codifican el
          tipo de construcción, o sea que son información; sin leyenda el color
          es decoración y el visitante no tiene cómo saber que un volumen violeta
          y uno turquesa no son lo mismo. Va en HTML y no dibujada en el lienzo
          para que la lea un lector de pantalla y para que herede la tipografía
          del sitio. */}
      <ul
        role="list"
        className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-text-muted"
      >
        {TIPOS_DE_CONSTRUCCION.map((t) => (
          <li key={t.tipo} className="flex items-center gap-2">
            <span aria-hidden="true" className="plano-muestra" data-tipo={t.tipo} />
            {t.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  );
}
