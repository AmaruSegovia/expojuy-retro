"use client";

import { useState, type CSSProperties } from "react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { Reveal } from "@/shared/components/motion/reveal";
import { SPONSORS } from "../constants/sponsors";
import { useFichaEnVista } from "../hooks/use-ficha-en-vista";

/**
 * SPONSORS - grilla de 4×4 con un marcador de esquinas que viaja.
 *
 * FRANJA DE CIERRE, SIN COPETE NUMERADO. Es la única sección del sitio sin
 * número, y no es un olvido: el número existe si y solo si la sección está en
 * NAV_SECTIONS. Los auspiciantes son crédito institucional, no un destino al
 * que alguien navegue. Ver la invariante escrita en `shared/constants/site.ts`.
 *
 * EL MARCADOR ES UN SOLO ELEMENTO QUE SE TRASLADA
 *
 * No son cuatro esquinas por ficha que se encienden y se apagan: es UNA caja
 * del tamaño exacto de una celda que se mueve de una a otra. Esa diferencia es
 * la que produce el viaje; encender y apagar daría un parpadeo.
 *
 * Y se traslada SIN MEDIR NADA. Como las dieciséis celdas son idénticas, el
 * marcador no necesita cambiar de tamaño nunca: solo cambia `translate`, que
 * es justamente la propiedad que el compositor resuelve sin recalcular layout.
 * El paso lo calcula el CSS a partir de dos números -el índice activo y la
 * cantidad de columnas-, así que no hay `getBoundingClientRect`, no hay
 * `ResizeObserver` y el marcador queda bien alineado en cualquier viewport por
 * construcción. Ver el bloque `.sponsors` en globals.css.
 *
 * QUIÉN ELIGE LA FICHA ACTIVA
 *
 * El marcador señala la ÚLTIMA ficha activa, y se queda ahí. El puntero es
 * quien la activa; mientras nadie la haya activado con el puntero, la activa
 * el scroll. En un teléfono, donde el hover no existe, eso es siempre el
 * scroll y el marcador lo acompaña en los dos sentidos.
 *
 * SACAR EL MOUSE NO DESACTIVA NADA, y por eso no hay `onPointerLeave`. Si al
 * salir de la grilla el marcador volviera a la ficha que señala el scroll,
 * estaría deshaciendo lo último que el usuario hizo a propósito: apuntar una
 * ficha es una acción, dejar de apuntarla no es otra. El puntero, una vez que
 * tomó el mando, se lo queda.
 *
 * El puntero se filtra por `pointerType === "mouse"` A PROPÓSITO. Un dedo
 * también dispara `pointerenter`, y el proyecto ya se quemó con el hover
 * táctil: es pegajoso, se queda activo después de soltar y le gana a
 * cualquier lógica. Filtrando por tipo de puntero, el táctil ni entra en ese
 * camino en vez de tener que salir de él.
 *
 * NADA ESTÁ ESCONDIDO DETRÁS DEL HOVER. Las fichas no son interactivas -no hay
 * URLs de auspiciantes- y el marcador es puro énfasis: va `aria-hidden` y no
 * transporta información. Por eso tampoco entran en el recorrido del teclado:
 * un elemento enfocable que no hace nada es peor que uno que no lo es.
 */
export function SponsorsSection() {
  const [conPuntero, setConPuntero] = useState<number | null>(null);
  const { indice: enVista, registrar } = useFichaEnVista(SPONSORS.length);

  const activo = conPuntero ?? enVista;

  return (
    <section
      id="sponsors"
      aria-labelledby="sponsors-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <h2 id="sponsors-titulo" className="text-3xl font-bold text-text md:text-4xl">
            Sponsors
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Marcas que hacen posible ExpoJuy 2026
          </p>
        </Reveal>

        <ul
          role="list"
          className="sponsors mt-12"
          style={{ "--sponsors-i": String(activo) } as CSSProperties}
        >
          {/* El marcador va DENTRO de la lista y es un <li> porque un <ul> solo
              admite <li>. No rompe la lista para nadie: está fuera de flujo
              -position: absolute, así que ni siquiera es un ítem de la
              grilla- y `aria-hidden` lo saca del árbol de accesibilidad. */}
          <li className="sponsors__marcador" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </li>

          {SPONSORS.map((s, i) => (
            <li
              key={s.id}
              ref={registrar(i)}
              data-indice={i}
              data-activa={i === activo ? "" : undefined}
              className="sponsors__ficha"
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setConPuntero(i);
              }}
            >
              {/* PROVISORIO - acá va el logotipo del auspiciante. Hasta que
                  exista, la "J" ocupa su lugar EN MONOCROMÍA: dieciséis
                  isologotipos de ExpoJuy a todo color dirían que ExpoJuy se
                  auspicia a sí misma. El nombre viaja como texto alternativo,
                  que es exactamente lo que llevaría la imagen real, así que
                  reemplazarlo por <Image> no cambia ni la semántica ni el
                  layout: la ficha ya reserva su relación de aspecto. */}
              <BrandMark title={s.nombre} monocromo className="h-1/2 w-auto" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
