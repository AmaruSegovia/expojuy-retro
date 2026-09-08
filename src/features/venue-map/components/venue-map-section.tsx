"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { useCarruselCircular } from "@/shared/hooks/use-carrusel-circular";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import {
  ANGULO_EJE,
  ARENA,
  EDIFICIOS,
  CALLES_TRAZADO,
  ROTONDA,
  PARCELA,
  PUNTOS,
  type Punto,
  VERDES,
  VIEW_BOX,
  calcularRuta,
  rutaAPath,
} from "../constants/plano";

const ACCESO = "acceso";

const ETIQUETA_CATEGORIA: Record<Punto["categoria"], string> = {
  acceso: "Acceso",
  expositores: "Expositores",
  gastronomia: "Gastronomía",
  servicios: "Servicios",
  escenario: "Escenarios",
};

/**
 * MAPA - plano del predio con un riel de lugares y el recorrido desde el acceso.
 *
 * UN SOLO ESTADO PARA DOS CONTROLES. El plano y el riel no se sincronizan
 * entre sí: los dos leen la misma posición. Tocar un punto del plano mueve el
 * riel; mover el riel cambia el punto marcado y redibuja el recorrido. No hay
 * un "seleccionado" aparte que pueda quedar desfasado del riel.
 *
 * EL RIEL VA SIEMPRE POR EL CAMINO MÁS CORTO. De la novena tarjeta a la
 * primera se avanza uno hacia adelante, no ocho hacia atrás: el destino se
 * calcula como diferencia CON SIGNO sobre el anillo.
 *
 * CÓMO SE LOGRA EL CICLO SIN SALTOS - mismo mecanismo que "Sobre ExpoJuy": el
 * riel monta la lista tres veces y trabaja sobre la copia del medio. La
 * posición puede salirse del rango; al terminar la transición se normaliza y
 * el riel se recoloca, y ese reacomodo es invisible porque muestra la misma
 * tarjeta en el mismo lugar de la pantalla.
 *
 * LOS PUNTOS DEL PLANO SON BOTONES DE HTML, NO FORMAS DEL SVG. El `<svg>`
 * entero va `aria-hidden`: es el dibujo. Encima se posicionan `<button>` de
 * verdad, en porcentajes del viewBox para que acompañen al plano cuando
 * escala. Se gana foco, rol, nombre accesible y recorrido del teclado sin
 * reconstruir nada, y se puede dar área táctil de 36px sin engordar el punto.
 */
export function VenueMapSection() {
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
    <section id="mapa" className="border-t border-border py-24 md:py-32">
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 05
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text md:text-4xl">Cómo moverse</h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            El predio de la Ciudad Cultural. Elegí un lugar y el plano dibuja el recorrido desde el
            acceso principal.
          </p>
        </Reveal>

        {/* Un cuarto para el plano y tres cuartos para el riel, PERO con piso:
            por debajo de 252px el plano escala tanto que dos áreas táctiles de
            36px se tocan. La proporción cede antes que la accesibilidad. */}
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(252px,1fr)_minmax(0,3fr)] lg:gap-10">
          {/* ── PLANO ───────────────────────────────────────────────── */}
          {/* El plano ya no manda el alto de la fila: lo manda el riel, y el
              plano se centra dentro de lo que quede. Así la columna angosta no
              arrastra al riel a ser bajito. */}
          <div
            // EL ANCHO DEL PLANO NO ES ESTÉTICO, ES UNA COTA. Los marcadores
            // están a 60 unidades de viewBox como mínimo y los botones miden
            // 36px: por debajo de ~227px de ancho el plano escala tanto que dos
            // áreas táctiles se tocan. A 288 quedan a 51px, con margen.
            className="relative mx-auto w-full max-w-72 sm:max-w-80 lg:max-w-none"
            style={{ aspectRatio: `${VIEW_BOX.ancho} / ${VIEW_BOX.alto}` }}
          >
            <Plano ruta={ruta} destino={punto.id} />

            {PUNTOS.map((p, i) => {
              const esActivo = i === activo;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={esActivo}
                  onClick={() => irA(i)}
                  // 36px de área táctil, por encima de los 24 de WCAG 2.5.8,
                  // con un punto visible de 12: el dibujo no engorda.
                  className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                  style={{
                    left: `${((p.posicion[0] - VIEW_BOX.x) / VIEW_BOX.ancho) * 100}%`,
                    top: `${((p.posicion[1] - VIEW_BOX.y) / VIEW_BOX.alto) * 100}%`,
                  }}
                >
                  <span className="sr-only-focusable">{p.nombre}</span>
                  {/* El pulso solo cuando el lugar activo ES el acceso: marca
                      de dónde arranca el recorrido. Se monta al activarse, y
                      montarse es lo que dispara la animación otra vez. */}
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
          </div>

          {/* ── RIEL DE LUGARES ─────────────────────────────────────── */}
          {/* `min-w-0` NO es decorativo. Un ítem de grid trae `min-width: auto`, así
              que se niega a achicarse por debajo de su contenido: el <ul> del riel
              lleva 27 tarjetas en fila y, aunque el recorte las oculte, esa medida
              estiraba la celda más allá del contenedor. Con la celda desbordada, la
              tarjeta salía corrida y el plano quedaba fuera del centro. */}
          <div className="flex aspect-[3/4] min-w-0 flex-col sm:aspect-[4/3] lg:aspect-[4/3]">
            {/* `relative` para que las flechas se apoyen sobre los asomos, y
                `flex-1` para que el riel tome el alto del plano: las dos
                columnas terminan a la misma altura sin fijar ningún píxel. */}
            <div
              className="relative min-w-0 flex-1"
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
              <Flecha
                etiqueta="Lugar anterior"
                onClick={() => mover(posicion - 1)}
                className="left-0"
              >
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

            {/* Se ANUNCIA pero no se ve: la tarjeta ya dice de qué lugar se
                trata. Sin esto, mover el riel no produce ningún efecto
                perceptible para un lector de pantalla. */}
            <p aria-live="polite" className="sr-only-focusable">
              {punto.nombre}
              {punto.id !== ACCESO && ", recorrido marcado desde el acceso"}
            </p>
          </div>
        </div>
      </div>
    </section>
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
        "relative h-full min-h-80 w-full overflow-hidden border border-border bg-surface-raised",
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

/**
 * Cómo se pinta cada pieza.
 *
 * EL PLANO ES DIBUJO DE LÍNEA, NO MANCHAS.
 *
 * La versión anterior resolvía todo con rellenos oscuros y bandas anchas para
 * las calles. El resultado eran huecos negros entre bloques negros: el plano se
 * leía pesado y los bordes parecían recortes, no trazos.
 *
 * Ahora manda el TRAZO. Todo se dibuja con líneas finas de lavanda a distintas
 * opacidades -una sola familia de color, así el conjunto se lee como un sistema
 * y no como piezas sueltas- y el relleno es apenas un velo donde hace falta
 * distinguir una masa. La jerarquía la da la opacidad del trazo, no el peso:
 * naves 0.5, stands 0.4, servicios 0.28.
 *
 * Los espacios abiertos van en cian muy tenue, sin trazo: lo construido tiene
 * borde, lo abierto no. Se distinguen por HUE y por presencia de línea, no por
 * claridad, que es lo que hacía que todo se confundiera.
 *
 * LOS RELLENOS SON OPACOS, Y ESE ES EL PUNTO. Con rellenos translúcidos las
 * bandas de las calles se veían A TRAVÉS de las naves y los stands, así que
 * parecían pasar por encima. El color se premezcla con `color-mix` contra la
 * superficie de la parcela: queda el mismo tono de antes, pero tapa. Las
 * calles se dibujan primero y todo lo construido se apoya encima, como en un
 * plano de verdad.
 *
 * El recorrido conserva el degradado lavanda→cian a opacidad plena: es lo único
 * saturado del dibujo, así que siempre gana.
 */
const PINTURA = {
  nave: {
    fill: "color-mix(in oklab, var(--color-brand-violet-deep) 32%, var(--color-surface))",
    stroke: "var(--color-brand-lavender)",
    strokeOpacity: 0.5,
    strokeWidth: 1.2,
  },
  stand: {
    fill: "color-mix(in oklab, var(--color-brand-violet) 18%, var(--color-surface))",
    stroke: "var(--color-brand-lavender)",
    strokeOpacity: 0.4,
    strokeWidth: 0.9,
  },
  servicio: {
    fill: "var(--color-surface)",
    stroke: "var(--color-brand-lavender)",
    strokeOpacity: 0.28,
    strokeWidth: 1,
  },
} as const;

function Plano({ ruta, destino }: { ruta: [number, number][] | null; destino: string }) {
  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.ancho} ${VIEW_BOX.alto}`}
      className="absolute inset-0 size-full"
      // Trazos finos parejos: sin esto el navegador ajusta cada línea a la
      // grilla de píxeles y unas salen más gruesas que otras.
      shapeRendering="geometricPrecision"
      // El dibujo entero es decorativo: lo operable y lo legible son los
      // botones de HTML que van encima y el riel de al lado.
      aria-hidden="true"
    >
      <defs>
        {/* Todo lo de adentro se recorta contra el contorno. Sin esto las masas
            verdes -que son polígonos aproximados- se derraman fuera de la
            parcela y el plano parece mal dibujado. */}
        <clipPath id="recorte-parcela">
          <polygon points={PARCELA.map((p) => p.join(",")).join(" ")} />
        </clipPath>

        {/* `userSpaceOnUse` y no el `objectBoundingBox` por defecto: la caja de
            un tramo recto del recorrido puede tener ancho o alto CERO, y un
            elemento con caja degenerada que referencia un degradado en
            objectBoundingBox NO SE PINTA. No sale tenue: no sale. */}
        <linearGradient
          id="ruta-degradado"
          gradientUnits="userSpaceOnUse"
          x1={VIEW_BOX.x}
          y1={VIEW_BOX.y + VIEW_BOX.alto}
          x2={VIEW_BOX.x + VIEW_BOX.ancho}
          y2={VIEW_BOX.y}
        >
          <stop offset="0" style={{ stopColor: "var(--color-brand-lavender)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-brand-cyan)" }} />
        </linearGradient>
      </defs>

      <polygon
        points={PARCELA.map((p) => p.join(",")).join(" ")}
        fill="var(--color-surface)"
        stroke="var(--color-brand-lavender)"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />

      <g clipPath="url(#recorte-parcela)">
        {/* CALLES. Bandas anchas al 7%: no se miran, pero se ven. Van primero
            para que todo lo construido se apoye encima, como en un plano de
            verdad, y van dentro del recorte para que no se derramen fuera. */}
        <g
          fill="none"
          stroke="var(--color-brand-lavender)"
          strokeOpacity="0.07"
          strokeLinecap="square"
        >
          <polygon
            points={PARCELA.map((p) => p.join(",")).join(" ")}
            fill="none"
            strokeWidth="22"
          />
          {CALLES_TRAZADO.map((calle, i) => (
            <polyline key={i} points={calle.map((p) => p.join(",")).join(" ")} strokeWidth="16" />
          ))}
          <circle cx={ROTONDA.centro[0]} cy={ROTONDA.centro[1]} r={ROTONDA.r} strokeWidth="16" />
        </g>
        {VERDES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map((p) => p.join(",")).join(" ")}
            fill="color-mix(in oklab, var(--color-brand-cyan) 8%, var(--color-surface))"
          />
        ))}

        {/* Filete de la rotonda, apenas por encima de la banda: marca el giro
            sin convertirse en un elemento más del dibujo. */}
        <circle
          cx={ROTONDA.centro[0]}
          cy={ROTONDA.centro[1]}
          r={ROTONDA.r}
          fill="none"
          stroke="var(--color-brand-lavender)"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        <ellipse
          cx={ARENA.centro[0]}
          cy={ARENA.centro[1]}
          rx={ARENA.rx}
          ry={ARENA.ry}
          transform={`rotate(${ANGULO_EJE} ${ARENA.centro[0]} ${ARENA.centro[1]})`}
          fill="color-mix(in oklab, var(--color-brand-cyan) 12%, var(--color-surface))"
          stroke="var(--color-brand-cyan)"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />

        {EDIFICIOS.map((e) => (
          <rect
            key={e.id}
            x={e.centro[0] - e.ancho / 2}
            y={e.centro[1] - e.alto / 2}
            width={e.ancho}
            height={e.alto}
            transform={`rotate(${ANGULO_EJE} ${e.centro[0]} ${e.centro[1]})`}
            {...PINTURA[e.tipo]}
          />
        ))}
      </g>

      {/* RECORRIDO. `key` con el destino a propósito: al cambiar de lugar el
          elemento se reemplaza y la animación de dibujado vuelve a empezar.
          Sin eso, el trazo nuevo aparecería ya dibujado. */}
      {ruta && (
        <path
          key={destino}
          className="mapa-ruta"
          d={rutaAPath(ruta)}
          fill="none"
          stroke="url(#ruta-degradado)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          // Normaliza el largo a 1 para dibujarlo con dashoffset sin que ningún
          // JavaScript tenga que medir el path.
          pathLength="1"
        />
      )}
    </svg>
  );
}
