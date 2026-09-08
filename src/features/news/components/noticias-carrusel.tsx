"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { useCarruselCircular } from "@/shared/hooks/use-carrusel-circular";
import { NOTICIAS } from "../constants/noticias";
import { useArrastreCarrusel } from "../hooks/use-arrastre-carrusel";
import { NoticiaTarjeta } from "./noticia-tarjeta";

/**
 * CARRUSEL DE NOTICIAS - la máquina de estados es la del prototipo de Next,
 * la tarjeta es la del prototipo de Astro.
 *
 * El ciclo vive en `useCarruselCircular`, en shared/: monta la lista tres
 * veces, trabaja sobre la copia del medio y normaliza SIN TEMPORIZADORES,
 * reactivando la transición y moviendo en el mismo lote de `setState`. Acá no
 * se toca nada de eso.
 *
 * LOS TRES CONTRATOS DEL HOOK, QUE SE CUMPLEN ACÁ
 *
 * 1. El ítem mide 80% del riel (`w-4/5`), que es el `anchoTarjeta` con el que
 *    el hook calcula el desplazamiento. Cambiar uno sin el otro descentra
 *    todo el riel.
 * 2. El `gap` es de 1rem (`gap-4`), que es `separacionRem`.
 * 3. Toda la cadena de contenedores lleva `min-w-0`. Un ítem de flex o grid
 *    trae `min-width: auto` y se niega a achicarse por debajo de su
 *    contenido: sin esto el riel repetido estira al padre y saca todo de eje.
 *    El `overflow: hidden` de adentro no alcanza.
 *
 * "CARRUSEL HONESTO", QUE ES LO QUE EXIGE LA MEMORIA DEL PROTOTIPO DE ASTRO
 *
 * - Arrastre real, con el dedo y con el mouse. Ver `useArrastreCarrusel`.
 * - Flechas visibles y permanentes, más puntos de posición.
 * - No secuestra el scroll de la página: `touch-action: pan-y` en la ventana
 *   del riel deja el desplazamiento vertical en manos del navegador.
 * - Se detiene SIEMPRE en una tarjeta, nunca entre dos. El encastre no lo da
 *   `scroll-snap` porque acá no hay contenedor con scroll -el riel se mueve
 *   con `translate`, no con `scrollLeft`-, lo da la construcción: la posición
 *   del carrusel es un entero y el desplazamiento se deriva de él.
 */
export function NoticiasCarrusel() {
  const {
    enRiel,
    repetidos,
    reacomodando,
    desplazamiento,
    posicion,
    activo,
    total,
    mover,
    irA,
    alTerminarTransicion,
  } = useCarruselCircular(NOTICIAS);

  const { arrastrando, conArrastre, manejadores } = useArrastreCarrusel({
    avanzar: (paso) => mover(posicion + paso),
  });

  const alPresionarTecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") mover(posicion - 1);
    else if (e.key === "ArrowRight") mover(posicion + 1);
    else return;
    // Solo se frena la tecla que se usó: las demás siguen su curso normal,
    // incluido el Tab que saca el foco del riel.
    e.preventDefault();
  };

  return (
    <div className="noticias-carrusel">
      {/* A sangre completa: el asomo de la tarjeta anterior y la siguiente
          necesita ancho para leerse como que el listado sigue, y no como dos
          tarjetas cortadas contra el borde de una caja. */}
      <div className="relative mt-12">
        <div
          // El riel es operable por teclado con las flechas, así que es un
          // grupo enfocable y lo declara. Las tarjetas no tienen nada
          // enfocable adentro: si esto no fuera alcanzable, el carrusel sería
          // exclusivamente de puntero.
          role="group"
          tabIndex={0}
          aria-roledescription="carrusel"
          aria-label="Noticias. Usá las flechas del teclado o arrastrá para cambiar de tarjeta."
          onKeyDown={alPresionarTecla}
          {...manejadores}
          data-arrastrando={arrastrando ? "" : undefined}
          className="noticias-carrusel__ventana mx-auto max-w-5xl min-w-0 px-5 sm:px-10"
        >
          <ul
            role="list"
            className={cn(
              "flex min-w-0 gap-4",
              reacomodando || arrastrando
                ? "transition-none"
                : "transition-[translate] duration-scene ease-in-out-quint",
            )}
            style={{ translate: conArrastre(desplazamiento) }}
            onTransitionEnd={alTerminarTransicion}
          >
            {repetidos.map((n, i) => {
              const activa = i === enRiel;
              return (
                <li
                  key={`${n.id}-${i}`}
                  // Solo la tarjeta al frente participa del árbol de
                  // accesibilidad: sin esto, un lector de pantalla leería las
                  // dieciocho copias y el mismo título tres veces.
                  inert={!activa}
                  aria-hidden={activa ? undefined : true}
                  className={cn(
                    "flex w-4/5 shrink-0",
                    reacomodando
                      ? "transition-none"
                      : "transition-opacity duration-scene ease-in-out-quint",
                    // Las que asoman quedan atenuadas: el foco visual va a la
                    // del frente y el asomo se lee como contexto.
                    activa ? "opacity-100" : "opacity-30",
                  )}
                >
                  <NoticiaTarjeta noticia={n} className="w-full" />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="container-content mt-8">
        <div className="flex items-center justify-between gap-6">
          {/* Los puntos: el punto visible mide 8px, pero el BOTÓN mide 24×24,
              que es el mínimo de área táctil que pide WCAG 2.5.8. El riel va
              sin `gap` porque el relleno lateral de cada botón ya separa. */}
          <ul role="list" className="flex items-center">
            {NOTICIAS.map((n, i) => {
              const esActiva = i === activo;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    aria-label={`Ir a ${n.titulo}`}
                    aria-current={esActiva ? "true" : undefined}
                    onClick={() => irA(i)}
                    className="group grid h-6 place-items-center px-2"
                  >
                    <span
                      className={cn(
                        "h-2 rounded-full transition-all duration-control ease-standard",
                        esActiva
                          ? "w-8 bg-link"
                          : "w-2 bg-border-strong group-hover:bg-text-subtle",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-3">
            <Flecha etiqueta="Noticia anterior" onClick={() => mover(posicion - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Flecha>
            <Flecha etiqueta="Noticia siguiente" onClick={() => mover(posicion + 1)}>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Flecha>
          </div>
        </div>

        {/* Se ANUNCIA pero no se ve: la tarjeta ya dice cuál es. Sin esto,
            mover el riel no produce ningún efecto perceptible para un lector
            de pantalla. */}
        <p aria-live="polite" className="sr-only-focusable">
          {`Noticia ${activo + 1} de ${total}: ${NOTICIAS[activo].titulo}`}
        </p>
      </div>
    </div>
  );
}

function Flecha({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-border-strong text-text-muted transition-colors duration-micro ease-standard hover:border-link hover:text-link"
    >
      {children}
    </button>
  );
}
