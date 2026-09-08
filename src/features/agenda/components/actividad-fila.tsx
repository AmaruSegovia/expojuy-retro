"use client";

import { Reveal } from "@/shared/components/motion/reveal";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { cn } from "@/shared/lib/cn";
import type { Actividad } from "../constants/actividades";
import { useCruzoLectura } from "../hooks/use-linea-tiempo";

/**
 * Una fila de la agenda: tarjeta a un lado de la línea, datos del otro.
 *
 * ALTERNANCIA - la tarjeta cae a la izquierda en las filas pares y a la
 * derecha en las impares, y los datos siempre enfrente. El zigzag es lo que
 * hace que la línea se lea como un eje y no como un borde.
 *
 * EL ORDEN DEL DOM NO ALTERNA. Los datos van SIEMPRE primero en el marcado y
 * la tarjeta después; el zigzag lo produce `col-start`, que es puramente
 * visual. Así el lector de pantalla y el tabulador recorren siempre
 * "cuándo → qué", en ese orden, sin importar de qué lado quedó dibujado.
 *
 * En pantallas chicas no hay dos lados: todo se apila a la derecha de una
 * línea que se corre al margen izquierdo.
 */
export function ActividadFila({ actividad, indice }: { actividad: Actividad; indice: number }) {
  const [nodo, activo] = useCruzoLectura<HTMLSpanElement>();

  // Par: tarjeta a la izquierda, datos a la derecha. Impar, al revés.
  const tarjetaIzquierda = indice % 2 === 0;

  return (
    <li className="relative grid gap-6 pl-12 lg:grid-cols-2 lg:gap-x-20 lg:pl-0">
      {/* El nodo sobre la línea. Se enciende cuando cruza la misma altura de
          pantalla en la que va el frente del trazo, así que parece que lo
          enciende la línea al pasar. */}
      <span
        ref={nodo}
        data-activo={activo || undefined}
        aria-hidden="true"
        className={cn(
          "absolute top-6 left-[var(--eje)] z-10 size-3 -translate-x-1/2 rounded-full",
          "border-2 border-border-strong bg-surface-sunken",
          "transition-[background-color,border-color,scale] duration-control ease-standard",
          "data-[activo]:scale-125 data-[activo]:border-accent data-[activo]:bg-accent",
        )}
      />

      <Reveal
        from={tarjetaIzquierda ? "right" : "left"}
        className={cn(
          "lg:row-start-1",
          tarjetaIzquierda ? "lg:col-start-2" : "lg:col-start-1 lg:text-right",
        )}
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          {actividad.eje}
        </p>

        {/* Un solo <time> envuelve día y hora: para la máquina es un único
            instante, aunque en pantalla estén en dos renglones. */}
        <time dateTime={actividad.inicioISO} className="mt-3 block">
          <span className="block text-2xl font-bold text-text">{actividad.diaLabel}</span>
          <span className="mt-1 block text-lg text-link">{actividad.horaLabel} h</span>
        </time>

        <p className="mt-5">
          <span className="block text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Expositor
          </span>
          <span className="mt-1 block text-sm text-text-muted">{actividad.expositor}</span>
        </p>
      </Reveal>

      <Reveal
        as="article"
        delay={80}
        from={tarjetaIzquierda ? "left" : "right"}
        className={cn(
          // La imagen va DETRÁS de todo el bloque, no arriba de él: el texto
          // se apoya al pie con `justify-end`. Así la tarjeta es una sola
          // pieza y no una imagen con un cajón de texto colgando abajo.
          //
          // EL ALTO SALE DE LA PROPORCIÓN, NO DE UN VALOR FIJO: 4/5 mantiene
          // la tarjeta PARADA a cualquier ancho de columna, en vez de fijar
          // píxeles que solo sirven para un viewport.
          //
          // Ojo si alguna vez se vuelve apaisada: `aspect-ratio` en una caja de
          // bloque NO crece para acomodar contenido de más, así que una
          // proporción baja desbordaría el texto en columnas angostas y haría
          // falta un `min-h` de red. Parada sobra altura y el riesgo no existe.
          "relative flex aspect-[4/5] flex-col justify-end overflow-hidden",
          "border border-border bg-surface-raised",
          "lg:row-start-1",
          tarjetaIzquierda ? "lg:col-start-1" : "lg:col-start-2",
        )}
      >
        {/* PROVISORIO - sin fotografías institucionales todavía. Ocupa toda la
            tarjeta, así que cambiar esto por <Image> no va a mover el layout. */}
        <PlaceholderVisual paleta={actividad.paleta} className="absolute inset-0 size-full" />

        {/* Velo. NO es un adorno: los rellenos del visual son claros -la
            lavanda llega al 73% de luminosidad- y el texto va encima. Se
            oscurece solo hacia abajo, que es donde se apoya el contenido,
            dejando ver el color arriba.

            Los cortes están puestos para que el texto nunca caiga bajo el 83%
            de opacidad: sobre lavanda, lo peor que puede tocarle, eso deja el
            fondo compuesto en ~#231931 y el texto en 13:1. El texto atenuado,
            que es el piso real, queda en 6,5:1. Los dos por encima de AA. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-surface-sunken/0 from-25% via-surface-sunken/90 via-65% to-surface-sunken/98"
        />

        <div className="relative p-5 sm:p-6">
          {/* Una línea, siempre. `line-clamp` corta en la palabra y no en
              mitad de una letra, que es lo que haría `truncate`. El tamaño
              baja a text-lg -no text-xl- porque en una columna de ~430px el
              renglón no da para más sin recortar títulos normales. */}
          <h3 className="line-clamp-1 text-base font-bold text-text sm:text-lg">
            {actividad.titulo}
          </h3>
          <p className="mt-2 line-clamp-2 text-base text-pretty text-text-muted">
            {actividad.descripcion}
          </p>
        </div>
      </Reveal>
    </li>
  );
}
