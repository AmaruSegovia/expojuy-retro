"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLenis } from "lenis/react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { BotonPausa } from "@/shared/components/ui/boton-pausa";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import {
  MEDIOS_PAGO,
  METODOS_EJEMPLO,
  TIPOS_ENTRADA,
  type TipoEntrada,
} from "../constants/entradas";

/**
 * ENTRADAS - mitad píldoras de tipo de entrada, mitad collage; abajo, el riel
 * de medios de pago.
 *
 * MEJORA PROGRESIVA: LOS TRES PANELES SE SIRVEN VISIBLES
 *
 * Mismo criterio que el acordeón de Preguntas, y por el mismo motivo. Si los
 * paneles se ocultaran con el atributo `hidden`, el HTML servido traería uno
 * solo visible y los otros dos inalcanzables sin JavaScript: se perderían dos
 * de los tres precios. Acá el estado oculto vive en una regla de CSS detrás de
 * `.js`, así que sin JavaScript esto es una lista de tres tarjetas de precio,
 * una abajo de la otra, y se lee perfecto.
 *
 * El nombre del tipo va dentro de cada panel y se esconde detrás de `.js`: sin
 * JavaScript hace falta para saber de cuál habla cada tarjeta, y con
 * JavaScript la píldora activa ya lo dice. Es el mismo mecanismo usado al
 * revés: no para ocultar contenido, sino para sacar una redundancia.
 *
 * LAS PÍLDORAS SON PESTAÑAS DE VERDAD
 *
 * `tablist`/`tab`/`tabpanel` con tabindex rotante: solo la píldora activa está
 * en el recorrido del tabulador, y entre las tres se navega con las flechas,
 * Inicio y Fin. Sin eso, tres botones seguidos obligan a tabular tres veces
 * para pasar de largo, que es exactamente lo que el patrón de pestañas existe
 * para evitar.
 *
 * EL BOTÓN ABRE UN FORMULARIO DE PAGO ILUSTRATIVO
 *
 * No hay pasarela de pago, así que el modal no simula una: DICE que es un
 * ejemplo y muestra qué iría en su lugar. Un checkout falso que pidiera datos
 * de tarjeta sería otra cosa, y no una que convenga prototipar.
 *
 * Y los precios se muestran como lo que son. Un precio inventado sin aviso es
 * lo único de la maqueta que alguien podría anotar y presupuestar.
 */
export function TicketsSection() {
  const [activo, setActivo] = useState(TIPOS_ENTRADA[0].id);
  const [pausado, setPausado] = useState(false);
  const [pagando, setPagando] = useState<TipoEntrada | null>(null);
  const refsPildoras = useRef<Record<string, HTMLButtonElement | null>>({});

  const idPildora = (id: string) => `entrada-${id}-pildora`;
  const idPanel = (id: string) => `entrada-${id}-panel`;

  /** Flechas, Inicio y Fin mueven la selección y se llevan el foco con ella,
   *  que es lo que especifica el patrón de pestañas de WAI-ARIA. */
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const total = TIPOS_ENTRADA.length;
    const i = TIPOS_ENTRADA.findIndex((t) => t.id === activo);
    const destino =
      e.key === "ArrowRight"
        ? (i + 1) % total
        : e.key === "ArrowLeft"
          ? (i - 1 + total) % total
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? total - 1
              : -1;
    if (destino === -1) return;
    e.preventDefault();
    const siguiente = TIPOS_ENTRADA[destino];
    setActivo(siguiente.id);
    refsPildoras.current[siguiente.id]?.focus();
  };

  return (
    <section
      id="entradas"
      aria-labelledby="entradas-titulo"
      className="en-papel border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 06
          </p>
          <h2 id="entradas-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Entradas
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Tres formas de entrar a los cuatro días. Elegí la que te sirve y reservá tu lugar.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
          <div className="min-w-0">
            {/* `aria-orientation` no es adorno: le dice al lector de pantalla
                qué flechas mueven la selección. Con tres píldoras la fila no
                envuelve ni en un teléfono de 390px, pero `flex-wrap` queda
                igual como red: si mañana se agrega un tipo, envuelve en vez de
                desbordar. */}
            <div
              role="tablist"
              aria-label="Tipo de entrada"
              aria-orientation="horizontal"
              onKeyDown={alTeclear}
              className="flex flex-wrap gap-2"
            >
              {TIPOS_ENTRADA.map((t) => {
                const esActivo = t.id === activo;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      refsPildoras.current[t.id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={idPildora(t.id)}
                    aria-selected={esActivo}
                    aria-controls={idPanel(t.id)}
                    // TABINDEX ROTANTE: la lista entera es UNA parada del
                    // tabulador, no tres.
                    tabIndex={esActivo ? 0 : -1}
                    onClick={() => setActivo(t.id)}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-sm font-semibold",
                      "transition-colors duration-micro ease-standard",
                      esActivo
                        ? "bg-primary text-on-primary hover:bg-primary-hover"
                        : "border border-border-strong text-text-muted hover:border-link hover:text-link",
                    )}
                  >
                    {t.nombre}
                  </button>
                );
              })}
            </div>

            {TIPOS_ENTRADA.map((t) => (
              <Panel
                key={t.id}
                tipo={t}
                activo={t.id === activo}
                id={idPanel(t.id)}
                idPildora={idPildora(t.id)}
                onComprar={() => setPagando(t)}
              />
            ))}
          </div>

          {/* COLLAGE - tres visuales inclinados y superpuestos.
              PROVISORIO: sin fotografías institucionales todavía.

              Se esconde en pantallas chicas, como las franjas de Preguntas y
              Contacto: es decorativo, y media pantalla de patrón entre las
              píldoras y el precio solo aleja del único dato que la sección
              tiene para dar. La rotación es estática, no animada. */}
          <div className="relative hidden aspect-[4/5] lg:block" aria-hidden="true">
            <Lamina paleta={0} ratio="3 / 4" className="top-0 left-0 w-[60%] -rotate-6" />
            <Lamina paleta={2} ratio="4 / 5" className="top-[20%] right-0 w-[52%] rotate-3" />
            <Lamina paleta={1} ratio="4 / 3" className="bottom-0 left-[16%] w-[58%] -rotate-2" />
          </div>
        </div>
      </div>

      <div className="container-content mt-20">
        <div className="flex items-center justify-between gap-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Medios de pago
          </p>
          {/* WCAG 2.2.2: el riel arranca solo, no termina nunca y convive con
              el resto de la sección. El botón es obligatorio, no una
              cortesía. */}
          <BotonPausa pausado={pausado} onCambiar={() => setPausado((p) => !p)} />
        </div>

        {/* Dentro del contenedor de 1024px, alineado con el resto de la
            sección. Lo que evita que se lea como una lista recortada no es el
            ancho sino la MÁSCARA: los dos bordes se desvanecen, así que el riel
            se apaga en vez de chocar contra un corte recto. Ver .medios en
            globals.css. `min-w-0` porque un ítem de flex o grid se niega a
            achicarse por debajo de su contenido, y el riel mide 3155px. */}
        <div className="medios mt-6 min-w-0" data-pausado={pausado ? "" : undefined}>
          <ul role="list" className="medios__riel">
            {MEDIOS_PAGO.map((m) => (
              <Medio key={m} nombre={m} />
            ))}
            {/* LA COPIA QUE HACE EL BUCLE. `aria-hidden` porque los medios de
                pago son once, no veintidós: la segunda vuelta es un recurso
                visual. No hay nada interactivo adentro, así que ocultarla no
                saca nada del recorrido del teclado. */}
            {MEDIOS_PAGO.map((m) => (
              <Medio key={`bis-${m}`} nombre={m} duplicado />
            ))}
          </ul>
        </div>
      </div>

      <ModalPago tipo={pagando} onCerrar={() => setPagando(null)} />
    </section>
  );
}

function Panel({
  tipo: t,
  activo,
  id,
  idPildora,
  onComprar,
}: {
  tipo: TipoEntrada;
  activo: boolean;
  id: string;
  idPildora: string;
  onComprar: () => void;
}) {
  return (
    // SIN UTILIDAD DE DISPLAY EN ESTE ELEMENTO. La regla que lo esconde vive en
    // @layer components, y las utilidades de Tailwind van en @layer utilities,
    // que se aplica después: un `grid` o un `block` acá le ganaría a la regla y
    // el panel no se ocultaría nunca. El layout va en el hijo.
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={idPildora}
      className="entradas-panel"
      data-activo={activo ? "" : undefined}
    >
      <div className="mt-8 border-t border-border pt-8">
        {/* Solo sin JavaScript: con las píldoras funcionando, la activa ya dice
            de cuál se trata. Ver .js .entradas-panel__nombre en globals.css. */}
        <h3 className="entradas-panel__nombre mb-3 text-xl font-bold text-text">{t.nombre}</h3>

        <p className="text-3xl font-bold text-text">{t.precio}</p>
        {/* El aviso es VISIBLE y no un comentario en el código: un precio de
            maqueta sin advertencia es el único dato del sitio que alguien
            podría anotar y presupuestar. */}
        <p className="mt-1.5 text-xs text-text-subtle">
          Precio de referencia - sujeto a confirmación de la organización
        </p>

        <p className="mt-5 text-base text-pretty text-text-muted">{t.para}</p>

        <ul role="list" className="mt-5 grid gap-2.5">
          {t.incluye.map((linea) => (
            <li key={linea} className="flex items-start gap-3 text-sm text-text-muted">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              {linea}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onComprar}
          className={cn(
            "mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-on-primary",
            "transition-colors duration-micro ease-standard",
            "hover:bg-primary-hover active:bg-primary-active",
          )}
        >
          Comprar
        </button>
      </div>
    </div>
  );
}

/**
 * MODAL DE PAGO - ejemplo ilustrativo.
 *
 * NO SIMULA UN CHECKOUT. El prototipo no tiene pasarela de pago, así que el
 * modal dice qué iría en su lugar en vez de pedir datos de tarjeta. Un
 * formulario de pago falso que acepte un número y responda "listo" es la clase
 * de maqueta que se puede confundir con la realidad, y encima entrenaría a
 * alguien a tipear una tarjeta en un sitio que no la procesa.
 *
 * POR QUÉ `<dialog>` NATIVO Y NO UN DIV CON POSITION FIXED
 *
 * `showModal()` trae resuelto, del navegador, todo lo que un modal a mano
 * suele hacer mal: el foco entra al abrir y VUELVE SOLO al botón que lo abrió
 * al cerrar, el resto de la página queda inerte -ni el tabulador ni el lector
 * de pantalla se escapan afuera-, Escape cierra, y el fondo se pinta con
 * `::backdrop` sin agregar un elemento.
 *
 * LO ÚNICO QUE HAY QUE HACER A MANO ES FRENAR A LENIS. El scroll suave escucha
 * `wheel` sobre `window`, y la capa superior del diálogo no le impide recibir
 * el evento: sin `lenis.stop()` la página de atrás se desplaza debajo del
 * modal. Se reanuda en el evento `close`, que dispara tanto si cierra el botón
 * como si cierra Escape, así que no hay dos caminos que mantener.
 */
function ModalPago({ tipo, onCerrar }: { tipo: TipoEntrada | null; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    if (tipo && !dialogo.open) {
      dialogo.showModal();
      lenis?.stop();
    } else if (!tipo && dialogo.open) {
      dialogo.close();
    }
  }, [tipo, lenis]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    // `close` cubre los tres caminos -botón, Escape y click en el fondo-, así
    // que reanudar el scroll y avisar hacia arriba se escribe una sola vez.
    const alCerrar = () => {
      lenis?.start();
      onCerrar();
    };
    dialogo.addEventListener("close", alCerrar);
    return () => dialogo.removeEventListener("close", alCerrar);
  }, [lenis, onCerrar]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pago-titulo"
      aria-describedby="pago-desc"
      // Al hacer click en el fondo, el objetivo del evento es el propio
      // <dialog>: el contenido está en el hijo, así que si el objetivo es este
      // elemento, el click fue afuera.
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="dialogo-pago"
    >
      <div className="p-8">
        <h2 id="pago-titulo" className="text-xl font-bold text-text">
          Formulario de pago
        </h2>
        <p id="pago-desc" className="mt-3 text-sm text-pretty text-text-muted">
          Acá irían los métodos de pago aceptados -transferencia, checkout de la pasarela- con el
          detalle de la compra.
          {tipo ? ` Entrada ${tipo.nombre}, ${tipo.precio}.` : ""}
        </p>

        <ul role="list" className="mt-6 grid gap-2">
          {METODOS_EJEMPLO.map((m) => (
            <li
              key={m}
              className="flex items-center gap-3 border border-border bg-surface px-4 py-3 text-sm text-text-muted"
            >
              {/* Circunferencia vacía: se lee como una opción sin elegir, que es
                  justamente el estado que la sección quiere mostrar. */}
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-border-strong"
              />
              {m}
            </li>
          ))}
        </ul>

        {/* ESTADO VACÍO. La "J" en monocromía y atenuada: ocupa el lugar del
            formulario que no existe y se lee como un hueco a propósito, no
            como algo que falló al cargar. Decorativa, así que `aria-hidden`;
            lo que hay que leer lo dice el texto de abajo. */}
        <div className="mt-8 grid place-items-center gap-4 border border-dashed border-border py-10">
          <BrandMark className="h-14 w-auto text-border-strong" monocromo />
          <p className="max-w-[26ch] text-center text-xs text-text-subtle">
            Ejemplo ilustrativo: el prototipo no tiene pasarela de pago conectada.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            // El foco entra acá al abrir: `showModal()` enfoca el primer
            // elemento enfocable, y que sea "Cerrar" es lo correcto en un modal
            // que no pide nada.
            autoFocus
            onClick={() => ref.current?.close()}
            className={cn(
              "rounded-full bg-primary px-7 py-3 text-sm font-semibold text-on-primary",
              "transition-colors duration-micro ease-standard",
              "hover:bg-primary-hover active:bg-primary-active",
            )}
          >
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Una lámina del collage. La proporción va como estilo y no como clase para no
 *  depender de que Tailwind genere una utilidad arbitraria por cada valor. */
function Lamina({
  paleta,
  ratio,
  className,
}: {
  paleta: 0 | 1 | 2 | 3;
  ratio: string;
  className?: string;
}) {
  return (
    <div
      className={cn("absolute overflow-hidden border border-border", className)}
      style={{ aspectRatio: ratio }}
    >
      <PlaceholderVisual paleta={paleta} className="size-full" />
    </div>
  );
}

function Medio({ nombre, duplicado }: { nombre: string; duplicado?: boolean }) {
  return (
    <li className="medios__item" aria-hidden={duplicado || undefined}>
      {/* PROVISORIO - acá va el logotipo del medio de pago. Hasta que exista,
          el nombre ocupa su lugar, que es además su futuro texto alternativo. */}
      <span className="grid h-14 place-items-center border border-border bg-surface-raised px-7 text-sm font-semibold text-text-muted">
        {nombre}
      </span>
    </li>
  );
}
