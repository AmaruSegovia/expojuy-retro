"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LAMINAS, type Lamina } from "../constants/slides";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { Reveal } from "@/shared/components/motion/reveal";
import { cn } from "@/shared/lib/cn";

/** Proporción del ancho visible que ocupa una lámina. El resto es el asomo. */
const ANCHO_LAMINA = 80;
/** Separación entre láminas, en rem. Entra en la cuenta del desplazamiento. */
const SEPARACION_REM = 1;

function Tarjeta({
  lamina,
  activa,
  etiqueta,
  sinTransicion,
}: {
  lamina: Lamina;
  activa: boolean;
  etiqueta?: string;
  /**
   * Durante el reacomodo del riel la opacidad TAMPOCO puede transicionar.
   * Si solo se congela el riel, la tarjeta que queda en pantalla es otra
   * instancia de la misma lámina: venía atenuada y subiría a opacidad plena
   * animándose, lo que se ve como un parpadeo justo al dar la vuelta.
   */
  sinTransicion: boolean;
}) {
  return (
    <article
      // Solo la lámina activa participa del foco y del árbol de
      // accesibilidad. Sin esto, Tab se metería en las copias que están fuera
      // de la vista y el foco desaparecería de la pantalla.
      inert={!activa}
      aria-hidden={activa ? undefined : true}
      aria-roledescription={activa ? "lámina" : undefined}
      aria-label={etiqueta}
      className={cn(
        "relative w-4/5 shrink-0 overflow-hidden",
        "aspect-[4/5] sm:aspect-[16/10]",
        "border border-border bg-surface-raised",
        // Las que asoman quedan atenuadas: el foco visual va a la activa y el
        // asomo se lee como contexto, no como contenido a medio mostrar.
        sinTransicion ? "transition-none" : "transition-opacity duration-scene ease-in-out-quint",
        activa ? "opacity-100" : "opacity-40",
      )}
    >
      <PlaceholderVisual paleta={lamina.paleta} className="absolute inset-0 size-full" />

      {/* Velo. El texto va SOBRE la imagen, y los rellenos son claros —lavanda
          y cian llegan al 73% de luminosidad—, así que sin esto el contraste
          del texto no estaría garantizado. Se oscurece arriba y abajo, que es
          donde se apoya el contenido, dejando respirar el centro. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-surface-sunken/85 via-surface-sunken/25 to-surface-sunken/95"
      />

      {/* LA LÁMINA CUENTA DOS HISTORIAS SEGÚN EL ANCHO.

          En un teléfono la lámina mide ~280×350 y el relato completo no entra:
          el título a dos líneas más la descripción a seis desbordaban por
          abajo, y el recorte del `overflow-hidden` los cortaba a mitad de
          palabra. Ahí la lámina se reduce a lo que sí se lee de un vistazo —el
          eje arriba y la cifra al pie— y el relato aparece recién desde `md`.

          EL CORTE VA EN `md` Y NO EN `sm`, y eso se midió, no se supuso. A
          640px la lámina mide 449×280: descontado el relleno quedan 216 de
          alto útil y el relato pide ~262 —eje 20, título a tres líneas 120,
          descripción a cuatro 110—, así que seguía desbordando 46px. A 768 la
          lámina llega a 541×338, o sea 274 útiles contra 195 de contenido
          —título 80, descripción 83, eje 20—: sobran 79, casi tres renglones.

          ⚠️ Ese margen se mide con `getBoundingClientRect` de cada pieza, NO
          con el `scrollHeight` del envoltorio: en un flex con
          `justify-between` el scrollHeight devuelve el alto del contenedor
          aunque el contenido ocupe la mitad, así que parece que está siempre
          al borde del desborde.

          El dato NO se duplica para eso: es un solo elemento que en móvil se
          posiciona absoluto contra el pie y desde `sm` vuelve al flujo, arriba
          a la derecha. Dos copias con `hidden` cruzado se desincronizan la
          primera vez que alguien toque una sola. */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {lamina.eje}
          </p>

          {/* `shrink-0` ERA LA CAUSA DEL DESBORDE EN MÓVIL: le decía a la
              cifra que no se achicara nunca, y "empresas participantes" pide
              ~150px que en 280 de ancho no sobran. Al salir del flujo en móvil
              deja de competir con el eje, y desde `sm` el `shrink-0` sigue
              siendo lo correcto: ahí hay ancho de sobra y lo que no se quiere
              es que el número se parta. */}
          <p className="absolute bottom-6 left-6 md:static md:shrink-0 md:text-right">
            <span className="block text-3xl font-bold text-text">{lamina.dato.valor}</span>
            <span className="mt-1 block text-xs text-text-muted">{lamina.dato.etiqueta}</span>
          </p>
        </div>

        <div className="hidden max-w-prose md:block">
          <h3 className="text-2xl font-bold text-balance text-text">{lamina.titulo}</h3>
          <p className="mt-3 text-base text-pretty text-text-muted">{lamina.descripcion}</p>
        </div>
      </div>
    </article>
  );
}

/**
 * Sobre ExpoJuy 2026 — slider circular de láminas.
 *
 * Se ve UNA lámina por vez con un asomo del 10% de la anterior y la siguiente.
 * La navegación da la vuelta en los dos sentidos y SIEMPRE avanza en el
 * sentido que se pidió: pasar de la última a la primera se ve como un paso
 * hacia adelante, no como un rebobinado de tres láminas.
 *
 * CÓMO SE LOGRA EL CICLO SIN SALTOS
 * El riel monta la lista TRES VECES y trabaja siempre sobre la copia del
 * medio. La posición es un contador que puede salirse del rango: desde la
 * última, "siguiente" lleva a la posición 4, que en el riel cae sobre la
 * primera lámina de la tercera copia. El desplazamiento sigue siendo hacia
 * adelante y se ve natural.
 *
 * Cuando esa transición termina, la posición se normaliza al rango real y el
 * riel se recoloca sobre la copia del medio. Ese reacomodo es invisible
 * porque muestra exactamente la misma lámina en el mismo lugar de la pantalla.
 *
 * EL REACOMODO NO USA TEMPORIZADORES
 * Mientras está pendiente, la transición queda desactivada; se vuelve a
 * activar recién en el siguiente movimiento que pida el usuario, dentro de la
 * misma actualización de estado que cambia la posición. Así no hace falta
 * ningún `requestAnimationFrame` ni `setTimeout` para "esperar un frame", que
 * es donde este patrón suele volverse frágil.
 */
export function AboutSection() {
  const total = LAMINAS.length;
  const [posicion, setPosicion] = useState(0);
  const [reacomodando, setReacomodando] = useState(false);

  /** Índice real de la lámina que se está mostrando. */
  const activo = ((posicion % total) + total) % total;

  const mover = (destino: number) => {
    // Reactivar la transición y mover, todo en la misma actualización: React
    // las agrupa en un solo render, así que el movimiento sale animado.
    setReacomodando(false);
    setPosicion(destino);
  };

  const alTerminarTransicion = (e: React.TransitionEvent) => {
    // Solo interesa la del propio riel; las opacidades de las tarjetas también
    // burbujean hasta acá.
    if (e.target !== e.currentTarget || e.propertyName !== "translate") return;
    if (posicion >= 0 && posicion < total) return;
    setReacomodando(true);
    setPosicion(activo);
  };

  const alPresionar = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      mover(posicion + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      mover(posicion - 1);
    }
  };

  // La lista se repite 3 veces; la copia del medio arranca en `total`.
  const repeticiones = 3;
  const posibleEnRiel = posicion + total;

  // RED DE SEGURIDAD. La normalización depende de que llegue `transitionend`,
  // y hay casos en los que no llega: clics muy rápidos que interrumpen la
  // transición anterior, o una pestaña en segundo plano, donde el navegador
  // directamente no ejecuta transiciones. Si la posición se escapara del riel,
  // no habría ninguna lámina que mostrar. Ante la duda se cae a la copia del
  // medio, que siempre existe.
  const enRiel =
    posibleEnRiel >= 0 && posibleEnRiel < LAMINAS.length * repeticiones
      ? posibleEnRiel
      : activo + total;
  const desplazamiento = `calc(10% - ${enRiel * ANCHO_LAMINA}% - ${enRiel * SEPARACION_REM}rem)`;
  const repetidas = Array.from({ length: repeticiones }, () => LAMINAS).flat();

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="flex min-h-seccion flex-col justify-center border-t border-border py-24"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 02
          </p>
          <h2 id="sobre-titulo" className="mt-3 text-3xl font-bold text-balance text-text">
            Sobre ExpoJuy 2026
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Cuatro ejes que ordenan la muestra, uno por cada valor que la organización puso en el
            centro de esta edición.
          </p>
        </Reveal>
      </div>

      <div className="container-content mt-12">
        <div
          role="group"
          aria-roledescription="carrusel"
          aria-label="Ejes de ExpoJuy 2026"
          tabIndex={0}
          onKeyDown={alPresionar}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
        >
          {/* El recorte y la máscara van en un envoltorio APARTE del elemento
              enfocable. Una máscara recorta todo lo que pinta el elemento,
              incluido su anillo de foco: aplicándola acá adentro, el anillo
              del contenedor de arriba queda intacto.

              La máscara desvanece los 10% de cada lado —exactamente la franja
              del asomo— para que las láminas vecinas se disuelvan contra el
              fondo en vez de quedar cortadas por un canto duro. La zona
              central, donde vive la lámina activa, queda opaca y sin tocar. */}
          <div className="overflow-hidden [mask-image:var(--borde)] [--borde:linear-gradient(to_right,transparent_0%,#000_10%,#000_90%,transparent_100%)] [-webkit-mask-image:var(--borde)]">
            <div
              onTransitionEnd={alTerminarTransicion}
              className={cn(
                "flex gap-4",
                // Durante el reacomodo no puede haber transición: el riel cambia
                // de posición sin que cambie lo que se ve.
                reacomodando
                  ? "transition-none"
                  : "transition-[translate] duration-scene ease-in-out-quint",
              )}
              // Cada lámina mide 80% del ancho visible, así que sobra un 10% de
              // cada lado para el asomo. Los porcentajes se resuelven contra el
              // ANCHO DEL RIEL, que sigue siendo el del contenedor: las láminas
              // llevan `shrink-0` y se desbordan sin ensancharlo.
              style={{ translate: `${desplazamiento} 0` }}
            >
              {repetidas.map((l, i) => {
                const esActiva = i === enRiel;
                return (
                  <Tarjeta
                    key={`${l.id}-${i}`}
                    lamina={l}
                    activa={esActiva}
                    sinTransicion={reacomodando}
                    etiqueta={esActiva ? `${activo + 1} de ${total}: ${l.eje}` : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Navegación. Los puntos indican dónde estamos; los inactivos quedan
            atenuados, como pide el plan. */}
        <div className="mt-8 flex items-center justify-between gap-6">
          {/* Sin `gap`: el área táctil de cada punto ya trae 8px de relleno a
              cada lado, así que dos botones contiguos dejan 16px entre los
              puntos visibles y las áreas quedan pegadas sin superponerse. */}
          <ul className="flex items-center">
            {LAMINAS.map((l, i) => {
              const esActivo = i === activo;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    // Se salta a la copia del medio para que el recorrido sea
                    // el más corto desde donde esté el riel.
                    onClick={() => mover(i)}
                    aria-label={`Ir a ${l.eje}`}
                    aria-current={esActivo ? "true" : undefined}
                    // EL PUNTO NO ES EL BOTÓN. El punto visible mide 8px, pero
                    // WCAG 2.5.8 pide 24×24 CSS px de área táctil y Lighthouse
                    // marcaba los tres puntos por medir 8×8. El botón aporta el
                    // tamaño (h-6 = 24, y px-2 lleva el ancho a 8+16 = 24); el
                    // <span> de adentro conserva la escala del diseño.
                    className="group grid h-6 place-items-center px-2"
                  >
                    <span
                      className={cn(
                        "h-2 rounded-full transition-all duration-control ease-standard",
                        esActivo
                          ? "w-8 bg-link"
                          : "w-2 bg-border-strong group-hover:bg-text-subtle",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => mover(posicion - 1)}
              aria-label="Lámina anterior"
              className="grid size-11 place-items-center rounded-full border border-border-strong text-text transition-colors duration-micro hover:border-link hover:text-link"
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => mover(posicion + 1)}
              aria-label="Lámina siguiente"
              className="grid size-11 place-items-center rounded-full border border-border-strong text-text transition-colors duration-micro hover:border-link hover:text-link"
            >
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
