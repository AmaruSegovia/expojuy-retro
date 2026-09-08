"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { useCarruselCircular } from "@/shared/hooks/use-carrusel-circular";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { MaquetaPredio } from "./maqueta-predio";
import { ETIQUETA_CATEGORIA, PUNTOS, type Punto, calcularRuta } from "../constants/plano";

const ACCESO = "acceso";

/**
 * LA PARTE VIVA DEL MAPA: la maqueta más el riel de lugares.
 *
 * Es lo único que necesita cliente. La cabecera de la sección y la lista de
 * lugares en texto se sirven desde el servidor, así que la alternativa textual
 * del plano no depende de que este archivo llegue ni se ejecute.
 *
 * UN SOLO ESTADO PARA DOS CONTROLES. La maqueta y el riel no se sincronizan
 * entre sí: los dos leen la misma posición. Tocar un marcador mueve el riel;
 * mover el riel cambia el lugar señalado, levanta sus bloques y redibuja el
 * recorrido. No hay un "seleccionado" aparte que pueda quedar desfasado.
 *
 * ESE ESTADO ÚNICO ES TAMBIÉN LO QUE REEMPLAZA AL GENERADOR DE REGLAS `:has()`
 * del prototipo de origen. Allá el plano y la agenda eran dos componentes sin
 * nada en común y hacía falta generar una regla CSS por lugar para que se
 * encendieran entre sí. Acá el enlace ya está resuelto por una pieza de estado,
 * así que alcanza con marcar los bloques del lugar activo. Lo que sí se
 * conserva es lo valioso de la técnica: `--eco` sigue siendo un número
 * interpolable, y el cartel de cada marcador se enciende con `:hover` y
 * `:focus-visible` puros, sin un solo listener.
 *
 * EL RIEL VA SIEMPRE POR EL CAMINO MÁS CORTO. De la novena tarjeta a la primera
 * se avanza uno hacia adelante, no ocho hacia atrás: el destino se calcula como
 * diferencia CON SIGNO sobre el anillo.
 *
 * CÓMO SE LOGRA EL CICLO SIN SALTOS - mismo mecanismo que "Sobre ExpoJuy": el
 * riel monta la lista tres veces y trabaja sobre la copia del medio. La
 * posición puede salirse del rango; al terminar la transición se normaliza y el
 * riel se recoloca, y ese reacomodo es invisible porque muestra la misma
 * tarjeta en el mismo lugar de la pantalla.
 */
export function MapaPredio() {
  // La máquina del ciclo vive en shared/: la comparten esta sección, las
  // láminas de "Sobre ExpoJuy" y el riel de Noticias.
  const {
    activo,
    enRiel,
    repetidos,
    reacomodando,
    desplazamiento,
    posicion,
    total,
    mover,
    irA,
    alTerminarTransicion,
  } = useCarruselCircular(PUNTOS);

  const punto = PUNTOS[activo];
  const ruta = punto.id !== ACCESO ? calcularRuta(ACCESO, punto.id) : null;

  return (
    <>
      {/* `Reveal` es además el disparador de la construcción de la maqueta: el
          CSS cuelga de su `data-reveal`, así que no hace falta un segundo
          observador de intersección para levantar los bloques. */}
      <Reveal className="mt-12">
        <MaquetaPredio activo={punto.id} ruta={ruta} onElegir={irA} />
      </Reveal>

      {/* ── RIEL DE LUGARES ─────────────────────────────────────────────── */}
      {/* `min-w-0` NO es decorativo. Un ítem de grid o de flex trae
          `min-width: auto`, así que se niega a achicarse por debajo de su
          contenido: el <ul> del riel lleva 27 tarjetas en fila y, aunque el
          recorte las oculte, esa medida estiraba la celda más allá del
          contenedor y la tarjeta salía corrida. */}
      <div className="mt-10 flex min-w-0 flex-col">
        <div
          className="relative h-72 min-w-0 sm:h-80"
          role="group"
          aria-roledescription="carrusel"
          aria-label="Lugares del predio"
        >
          <div className="mapa-riel h-full min-w-0">
            <ul
              role="list"
              className={cn(
                "flex h-full gap-4",
                reacomodando
                  ? "transition-none"
                  : "transition-[translate] duration-scene ease-in-out-quint",
              )}
              style={{ translate: desplazamiento }}
              onTransitionEnd={alTerminarTransicion}
            >
              {repetidos.map((p, i) => (
                <li key={`${p.id}-${i}`} className="flex h-full w-4/5 shrink-0">
                  <Tarjeta
                    punto={p}
                    activa={i === enRiel}
                    etiqueta={`${(i % total) + 1} de ${total}`}
                    sinTransicion={reacomodando}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Las flechas van ENCIMA del asomo, no debajo del riel: así el
              control queda donde está el contenido que mueve. Llevan fondo
              propio porque se apoyan sobre la imagen de la tarjeta. */}
          <Flecha etiqueta="Lugar anterior" onClick={() => mover(posicion - 1)} className="left-0">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Flecha>
          <Flecha
            etiqueta="Lugar siguiente"
            onClick={() => mover(posicion + 1)}
            className="right-0"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Flecha>
        </div>

        {/* Se ANUNCIA pero no se ve: la tarjeta ya dice de qué lugar se trata.
            Sin esto, mover el riel no produce ningún efecto perceptible para un
            lector de pantalla. */}
        <p aria-live="polite" className="sr-only-focusable">
          {punto.nombre}
          {punto.id !== ACCESO && ", recorrido marcado desde el acceso"}
        </p>
      </div>
    </>
  );
}

function Flecha({
  etiqueta,
  onClick,
  className,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full sm:size-11",
        "border border-border-strong bg-surface-sunken/80 text-text backdrop-blur-sm",
        "transition-colors duration-micro ease-standard hover:border-link hover:text-link",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Tarjeta({
  punto,
  activa,
  etiqueta,
  sinTransicion,
}: {
  punto: Punto;
  activa: boolean;
  etiqueta: string;
  sinTransicion: boolean;
}) {
  return (
    <article
      // Solo la tarjeta activa participa del foco y del árbol de
      // accesibilidad: sin esto, Tab se metería en las copias fuera de la
      // vista y el foco desaparecería de la pantalla.
      inert={!activa}
      aria-hidden={activa ? undefined : true}
      aria-roledescription={activa ? "lugar" : undefined}
      aria-label={activa ? etiqueta : undefined}
      className={cn(
        "relative h-full w-full overflow-hidden border border-border bg-surface-raised",
        sinTransicion ? "transition-none" : "transition-opacity duration-scene ease-in-out-quint",
        activa ? "opacity-100" : "opacity-25",
      )}
    >
      <PlaceholderVisual paleta={punto.paleta} className="absolute inset-0 size-full" />

      {/* Velo. El texto va SOBRE la imagen y los rellenos son claros -lavanda
          llega al 73% de luminosidad-, así que sin esto el contraste no está
          garantizado. Mismos cortes que la Agenda, donde se calcularon. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-surface-sunken/85 via-surface-sunken/25 to-surface-sunken/95"
      />

      {/* El tipo arriba a la derecha y el texto abajo a la izquierda: las dos
          esquinas donde el velo está más oscuro. */}
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        <p className="text-right text-xs font-semibold tracking-[0.16em] text-accent uppercase">
          {ETIQUETA_CATEGORIA[punto.categoria]}
        </p>
        <div>
          {/* Una línea el título y dos la descripción, SIN puntos suspensivos:
              `recorte-*` recorta con `text-overflow: clip`. Los textos de
              `plano.ts` están escritos cortos para que ni llegue a activarse. */}
          <h3 className="recorte-1 text-lg font-bold text-text sm:text-xl">{punto.nombre}</h3>
          <p className="mt-2 recorte-2 text-base text-pretty text-text-muted">{punto.detalle}</p>
        </div>
      </div>
    </article>
  );
}
