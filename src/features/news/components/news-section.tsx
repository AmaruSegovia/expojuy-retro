"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { useCarruselCircular } from "@/shared/hooks/use-carrusel-circular";
import { NOTICIAS, type Noticia, fechaLarga } from "../constants/noticias";

/**
 * NOTICIAS — slider horizontal de tarjetas con asomo del 10%.
 *
 * La máquina de estados del ciclo vive en `useCarruselCircular`, en shared/:
 * la comparten esta sección, las láminas de "Sobre ExpoJuy" y el riel de
 * lugares del Mapa. Acá queda solo lo propio de Noticias, que es cómo se ve
 * una tarjeta.
 *
 * Se ve UNA por vez con un pedazo de la anterior y la siguiente a los lados, y
 * la navegación da la vuelta en los dos sentidos sin saltos.
 */
export function NewsSection() {
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

  return (
    <section
      id="noticias"
      aria-labelledby="noticias-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 07
          </p>
          <h2 id="noticias-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Novedades
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Lo último del programa: convocatorias, agenda y avances de la organización.
          </p>
        </Reveal>
      </div>

      {/* A sangre completa: el asomo de la tarjeta anterior y la siguiente
          necesita ancho para leerse como que el listado sigue, y no como dos
          tarjetas cortadas contra el borde de una caja. */}
      <div className="relative mt-12">
        {/* `min-w-0` NO es decorativo: un ítem de flex o grid trae
            `min-width: auto` y se niega a achicarse por debajo de su contenido,
            así que el riel repetido estiraría el contenedor y sacaría todo de
            eje. El recorte de adentro no alcanza. */}
        <div className="noticias-riel mx-auto max-w-5xl min-w-0 px-5 sm:px-10">
          <ul
            role="list"
            className={cn(
              "flex gap-4",
              reacomodando
                ? "transition-none"
                : "transition-[translate] duration-scene ease-in-out-quint",
            )}
            style={{ translate: desplazamiento }}
            onTransitionEnd={alTerminarTransicion}
          >
            {/* 4/5 exacto: el hook calcula el desplazamiento con ese mismo 80%,
                así que cambiar el ancho acá y no allá descentra todo el riel. */}
            {repetidos.map((n, i) => (
              <li key={`${n.id}-${i}`} className="flex w-4/5 shrink-0">
                <Tarjeta noticia={n} activa={i === enRiel} sinTransicion={reacomodando} />
              </li>
            ))}
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

        {/* Se ANUNCIA pero no se ve: la tarjeta ya dice cuál es. Sin esto, mover
            el riel no produce ningún efecto perceptible para un lector de
            pantalla. */}
        <p aria-live="polite" className="sr-only-focusable">
          {`Noticia ${activo + 1} de ${total}: ${NOTICIAS[activo].titulo}`}
        </p>
      </div>
    </section>
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

function Tarjeta({
  noticia: n,
  activa,
  sinTransicion,
}: {
  noticia: Noticia;
  activa: boolean;
  sinTransicion: boolean;
}) {
  return (
    <article
      // Solo la tarjeta activa participa del foco y del árbol de
      // accesibilidad: sin esto, Tab se metería en las copias fuera de la vista
      // y el foco desaparecería de la pantalla.
      inert={!activa}
      aria-hidden={activa ? undefined : true}
      className={cn(
        // La proporción cambia con el ancho porque la tarjeta ocupa SIEMPRE el
        // 80% del riel: en escritorio eso son ~755px, y con 3/4 la tarjeta se
        // iba a más de 1000px de alto. Parada en móvil, apaisada en grande.
        "relative flex aspect-[4/5] w-full flex-col overflow-hidden border border-border bg-surface-raised sm:aspect-[4/3] lg:aspect-[16/9]",
        sinTransicion ? "transition-none" : "transition-opacity duration-scene ease-in-out-quint",
        // Las que asoman quedan atenuadas: el foco visual va a la activa y el
        // asomo se lee como contexto, no como contenido a medio mostrar.
        activa ? "opacity-100" : "opacity-30",
      )}
    >
      <PlaceholderVisual paleta={n.paleta} className="absolute inset-0 size-full" />

      {/* Velo. El texto va SOBRE la imagen y los rellenos son claros —la
          lavanda llega al 73% de luminosidad—, así que sin esto el contraste no
          está garantizado. Mismos cortes que la Agenda, donde se calcularon. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-surface-sunken/0 from-25% via-surface-sunken/90 via-65% to-surface-sunken/98"
      />

      <div className="relative mt-auto p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">{n.tema}</p>
        {/* Dos líneas el título y dos el copete, SIN puntos suspensivos:
            `recorte-*` recorta con `text-overflow: clip`. Los textos de
            `noticias.ts` están escritos cortos para que ni llegue a activarse. */}
        <h3 className="mt-2 recorte-2 text-lg font-bold text-balance text-text">{n.titulo}</h3>
        <p className="mt-2 recorte-2 text-sm text-pretty text-text-muted">{n.copete}</p>
        <p className="mt-4 text-sm text-text-subtle">
          <time dateTime={n.fecha}>{fechaLarga(n.fecha)}</time>
        </p>
      </div>
    </article>
  );
}
