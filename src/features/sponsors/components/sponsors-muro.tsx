"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { GRUPOS, LIENZO_LOGO, SPONSORS, type GrupoSponsors } from "../constants/sponsors";
import { useFichaEnVista } from "../hooks/use-ficha-en-vista";

/**
 * EL MURO - grilla por nivel del prototipo de Astro, marcador viajero del
 * prototipo de Next.
 *
 * EL MARCADOR NO SE MIDE, SE CALCULA
 *
 * No son cuatro esquinas por ficha que se encienden y se apagan: es UNA caja
 * del tamaño exacto de una celda que se mueve de una a otra. Esa diferencia es
 * la que produce el viaje; encender y apagar daría un parpadeo.
 *
 * Y se traslada SIN MEDIR NADA. Su posición sale de dos números: `--sponsors-i`
 * -el índice, que escribe este componente- y `--sponsors-cols` -que declara el
 * CSS en cada breakpoint-. La columna es el resto y la fila el cociente
 * entero, los dos resueltos por CSS con `mod()` y `round(down, ...)`. No hay
 * `getBoundingClientRect`, no hay `ResizeObserver`, no hay listener de resize:
 * el marcador queda alineado en cualquier viewport por construcción, y cuando
 * el breakpoint cambia la cantidad de columnas se reacomoda solo.
 *
 * QUÉ HUBO QUE ADAPTAR AL AGRUPAR POR NIVEL
 *
 * En el prototipo de origen había una sola grilla de 4x4, así que había un
 * solo marcador. Acá hay una grilla POR NIVEL, con distinta cantidad de
 * columnas y distinto alto de fila, así que cada grilla tiene el suyo y solo
 * se ve el de la grilla donde está la ficha activa. La jerarquía manda: la
 * animación se adapta a la retícula del diseño y no al revés.
 *
 * Y la retícula tuvo que dejar de ser `auto-fill`: con `repeat(auto-fill,
 * minmax(...))` la cantidad de columnas la decide el ancho disponible y NO
 * hay número que ponerle a `--sponsors-cols`, así que el marcador tendría que
 * medir, que es exactamente lo que este mecanismo evita. Las columnas ahora se
 * declaran por nivel y por breakpoint. Ver styles.css.
 *
 * ÍNDICE ESTACIONADO: una grilla que no tiene la ficha activa deja su marcador
 * en la celda del BORDE por el que se va a entrar -la primera si el activo
 * está más adelante, la última si está más atrás-. Así, cuando le toca
 * aparecer, ya está en su lugar y solo se funde; sin eso, se vería viajar
 * desde la celda cero mientras aparece.
 *
 * QUIÉN ELIGE LA FICHA ACTIVA
 *
 * El marcador señala la ÚLTIMA ficha activa y se queda ahí. El puntero es
 * quien la activa; mientras nadie la haya activado con el puntero, la activa
 * el scroll. En un teléfono, donde el hover no existe, eso es siempre el
 * scroll.
 *
 * SACAR EL MOUSE NO DESACTIVA NADA, y por eso no hay `onPointerLeave`: apuntar
 * una ficha es una acción, dejar de apuntarla no es otra. El puntero se filtra
 * por `pointerType === "mouse"` a propósito, porque un dedo también dispara
 * `pointerenter` y el hover táctil es pegajoso.
 *
 * NADA ESTÁ ESCONDIDO DETRÁS DEL HOVER. Las fichas no son interactivas -no hay
 * URLs de patrocinadores en los datos- y el marcador es puro énfasis: va
 * `aria-hidden` y no transporta información. Por eso tampoco entran en el
 * recorrido del teclado: un elemento enfocable que no hace nada es peor que
 * uno que no lo es.
 */
export function SponsorsMuro() {
  const [conPuntero, setConPuntero] = useState<number | null>(null);
  const { indice: enVista, registrar } = useFichaEnVista(SPONSORS.length);

  const activo = conPuntero ?? enVista;

  /** El grupo tiene la ficha activa. Solo ese muestra su marcador. */
  const tieneElActivo = (g: GrupoSponsors) =>
    activo >= g.desde && activo < g.desde + g.items.length;

  /** Índice local, acotado a los extremos del grupo. Ver "índice estacionado". */
  const indiceLocal = (g: GrupoSponsors) =>
    Math.min(Math.max(activo - g.desde, 0), g.items.length - 1);

  return (
    <div className="muro-sponsors">
      {GRUPOS.map((grupo) => (
        <section key={grupo.clave} aria-labelledby={`nivel-${grupo.clave}`}>
          <h3 id={`nivel-${grupo.clave}`} className="muro-sponsors__nivel">
            {grupo.titulo}
          </h3>

          <ul
            role="list"
            className="muro-sponsors__grilla"
            data-escala={grupo.escala}
            data-activo={tieneElActivo(grupo) ? "" : undefined}
            style={{ "--sponsors-i": String(indiceLocal(grupo)) } as CSSProperties}
          >
            {/* El marcador va DENTRO de la lista y es un <li> porque un <ul>
                solo admite <li>. No rompe la lista para nadie: está fuera de
                flujo -`position: absolute`, así que ni siquiera es un ítem de
                la grilla- y `aria-hidden` lo saca del árbol de accesibilidad. */}
            <li className="muro-sponsors__marcador" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </li>

            {grupo.items.map((s, j) => {
              const i = grupo.desde + j;
              return (
                <li
                  key={s.id}
                  ref={registrar(i)}
                  data-indice={i}
                  data-activa={i === activo ? "" : undefined}
                  className="muro-sponsors__marca"
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") setConPuntero(i);
                  }}
                >
                  {s.logo ? (
                    <Image
                      src={`/sponsors/${s.id}.png`}
                      alt={s.nombre}
                      width={LIENZO_LOGO.ancho}
                      height={LIENZO_LOGO.alto}
                      className="muro-sponsors__logo"
                    />
                  ) : (
                    /* Sin archivo: el nombre compuesto, y dicho que falta. Es
                       el criterio del prototipo de origen, donde lo que no
                       llegó se declara en vez de disimularse. */
                    <span className="muro-sponsors__nombre">
                      {s.nombre}
                      <span className="muro-sponsors__pendiente">Isologotipo pendiente</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
