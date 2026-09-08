"use client";

import { useState, type CSSProperties } from "react";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { BotonPausa } from "@/shared/components/ui/boton-pausa";
import { Reveal } from "@/shared/components/motion/reveal";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { useArrastreRiel } from "../hooks/use-arrastre-riel";
import { EXPOSITORES, type Expositor } from "../constants/expositores";

/**
 * EXPOSITORES — bento de tres columnas deslizándose en bucle.
 *
 * La de la izquierda y la de la derecha suben; la del medio baja. Cada tarjeta
 * ocupa dos módulos de la ventana, así que se ve una entera y la mitad de la
 * siguiente. El recorrido no termina: cada columna lleva su lista
 * DUPLICADA y el riel se desplaza exactamente la mitad de su alto, así que al
 * reiniciarse el ciclo la segunda copia queda donde estaba la primera y el
 * corte no se ve.
 *
 * POR QUÉ HAY UN BOTÓN DE PAUSA
 *
 * No es un adorno ni una preferencia: WCAG 2.2.2 exige un mecanismo para
 * detener todo contenido en movimiento que arranque solo, dure más de cinco
 * segundos y conviva con otro contenido. Un bucle infinito cumple las tres.
 * Sin este botón la sección sola bajaría el puntaje de accesibilidad del
 * sitio, que hoy está en 100.
 *
 * El movimiento además se detiene al pasar el puntero y al entrar el foco con
 * el teclado —para poder leer una tarjeta sin perseguirla—, y con
 * `prefers-reduced-motion` no arranca nunca.
 */

/**
 * Reparto por turnos entre las tres columnas.
 *
 * Round-robin y no bloques contiguos: con bloques, los expositores del mismo
 * día caerían todos en la misma columna y el bento se leería como una agenda
 * ordenada por jornada, que no es lo que esta sección cuenta.
 *
 * Se calcula en el módulo porque EXPOSITORES es una constante: el resultado no
 * puede cambiar entre renders.
 */
const COLUMNAS = [0, 1, 2].map((c) => EXPOSITORES.filter((_, i) => i % 3 === c));

/**
 * DEBE COINCIDIR con el breakpoint de `.bento` en globals.css. Es el único
 * lugar donde el marcado y la hoja de estilos tienen que ponerse de acuerdo:
 * si se separan, el CSS pondría tres columnas y el JS emitiría una sola lista.
 */
const ESCRITORIO = "(width >= 48rem)";

/**
 * Segundos que tarda una tarjeta en avanzar un lugar.
 *
 * ES UN TIEMPO, ASÍ QUE MÁS BAJO ES MÁS RÁPIDO: son los segundos que cuesta un
 * paso, no la velocidad.
 *
 * La duración NO es fija: se multiplica por la cantidad de tarjetas de la
 * columna. Sin eso, el riel de móvil —que lleva los doce expositores en vez de
 * cuatro— daría la vuelta al triple de velocidad.
 *
 * MÓVIL VA AL DOBLE. En escritorio las tres columnas corren en paralelo, así
 * que los doce expositores desfilan en el tiempo de una columna: 4 pasos. En
 * móvil hay una sola columna y los doce van en fila, o sea 12 pasos. A igual
 * segundos por paso, recorrer la muestra entera costaría el TRIPLE de tiempo
 * en el teléfono. Con la mitad de segundos, la vuelta completa baja de 144s a
 * 72s.
 *
 * ⚠️ ESTOS NÚMEROS ESTÁN ATADOS AL ALTO DE LA TARJETA. La animación recorre la
 * mitad del riel, o sea un paso por tarjeta; si el paso mide el doble y el
 * reloj no cambia, la velocidad en píxeles por segundo se duplica sola. Si el
 * alto de `.bento__celda` vuelve a cambiar, hay que decidir estos valores de
 * nuevo a conciencia y no dejarlos por inercia.
 */
const SEGUNDOS_POR_TARJETA = { escritorio: 12, movil: 6 } as const;

/**
 * Multiplicador por columna. Con las tres a la misma velocidad el conjunto se
 * lee como un solo bloque desplazándose, no como tres recorridos.
 */
const VARIACION = [1, 1.13, 1.06];

export function ExhibitorsSection() {
  const [pausado, setPausado] = useState(false);

  // EN MÓVIL ES UNA SOLA COLUMNA, Y ESO NO SE PUEDE HACER CON CSS.
  //
  // Tres columnas apiladas no son una columna: serían tres ventanas contiguas,
  // cada una con su propio bucle de cuatro expositores y su propio
  // desvanecido en los bordes. Se verían las costuras. Para que sea un solo
  // recorrido con los doce hay que emitir OTRA lista, así que el breakpoint se
  // lee en JS. Ver el comentario de useMediaQuery sobre cuándo corresponde.
  const esEscritorio = useMediaQuery(ESCRITORIO);
  const columnas = esEscritorio ? COLUMNAS : [EXPOSITORES];

  // El arrastre solo en móvil, que es donde hay UNA columna. En escritorio son
  // tres recorridos independientes: arrastrar uno dejaría a los otros dos
  // donde estaban y el conjunto se leería roto. Además ahí el gesto vertical
  // le pertenece a la página.
  const { refVentana, refRiel } = useArrastreRiel<HTMLDivElement, HTMLUListElement>(!esEscritorio);

  return (
    <section id="expositores" className="border-t border-border py-24 md:py-32">
      {/* Toda la sección dentro del contenedor de 1024px, como las demás. */}
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 04
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text md:text-4xl">Expositores</h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Doce organizaciones reparten la muestra en los cuatro días, entre producción,
            innovación, economía del conocimiento y vinculación empresarial.
          </p>
        </Reveal>

        {/* El control de pausa hace de separador entre la introducción y el
            bento: una línea que cruza todo el ancho y el botón encima, en el
            medio. */}
        <div className="relative mt-10 flex justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
          />
          {/* El fondo opaco es lo que interrumpe la línea: sin él se le vería
              el trazo cruzando por dentro. */}
          <BotonPausa
            pausado={pausado}
            onCambiar={() => setPausado((p) => !p)}
            className="relative z-10 bg-surface-sunken"
          />
        </div>

        <div className="bento mt-8" data-pausado={pausado ? "" : undefined}>
          {columnas.map((columna, i) => (
            <div
              key={i}
              className="bento__columna"
              ref={esEscritorio ? undefined : refVentana}
              // `touch-action: none` lo pone el CSS a partir de este atributo:
              // sin eso el navegador se queda el gesto vertical para scrollear
              // la página y el arrastre no recibe nada.
              data-arrastrable={esEscritorio ? undefined : ""}
            >
              <ul
                ref={esEscritorio ? undefined : refRiel}
                // `role="list"` explícito: sin viñetas, Safari deja de anunciar
                // la lista como lista.
                role="list"
                className="bento__riel"
                // Izquierda y derecha suben, la del medio baja.
                data-sentido={i === 1 ? "baja" : "sube"}
                style={
                  {
                    "--bento-dur": `${(columna.length * (esEscritorio ? SEGUNDOS_POR_TARJETA.escritorio : SEGUNDOS_POR_TARJETA.movil) * (VARIACION[i] ?? 1)).toFixed(1)}s`,
                  } as CSSProperties
                }
              >
                {columna.map((e) => (
                  <li key={e.id} className="bento__celda">
                    <TarjetaExpositor expositor={e} />
                  </li>
                ))}

                {/* LA COPIA QUE HACE EL BUCLE. Va `aria-hidden` porque para un
                    lector de pantalla estos doce expositores son doce, no
                    veinticuatro: la segunda vuelta es un recurso visual. Las
                    tarjetas no son interactivas, así que ocultarlas no deja
                    nada fuera del recorrido del teclado. */}
                {columna.map((e) => (
                  <li key={`bis-${e.id}`} className="bento__celda" aria-hidden="true">
                    <TarjetaExpositor expositor={e} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TarjetaExpositor({ expositor: e }: { expositor: Expositor }) {
  return (
    <article className="relative h-full overflow-hidden border border-border">
      {/* PROVISORIO — sin fotografías institucionales todavía. Ocupa toda la
          tarjeta, así que cambiar esto por <Image> no va a mover el layout. */}
      <PlaceholderVisual paleta={e.paleta} className="absolute inset-0 size-full" />

      {/* Velo. NO es un adorno: los rellenos del visual son claros —la lavanda
          llega al 73% de luminosidad— y el texto va encima. Se oscurece solo
          hacia abajo, que es donde se apoya el contenido, dejando ver el color
          arriba. Mismos cortes que la tarjeta de la Agenda, donde se
          calcularon: el texto nunca cae bajo el 83% de opacidad, lo que sobre
          lavanda deja el fondo compuesto en ~#231931 y el texto atenuado —el
          piso real— en 6,5:1. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-surface-sunken/0 from-25% via-surface-sunken/90 via-65% to-surface-sunken/98"
      />

      <div className="relative flex h-full flex-col justify-end p-4">
        <p className="line-clamp-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-accent uppercase">
          {e.eje}
        </p>
        {/* Una línea el título y dos la descripción. `line-clamp` corta en la
            palabra y no en mitad de una letra, que es lo que haría `truncate`.
            Los textos de `expositores.ts` están escritos cortos a propósito
            para que el recorte no se active. */}
        <h3 className="mt-1.5 line-clamp-1 text-lg font-bold text-text">{e.nombre}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-pretty text-text-muted">{e.rubro}</p>
      </div>
    </article>
  );
}
