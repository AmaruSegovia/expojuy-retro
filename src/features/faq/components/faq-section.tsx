"use client";

import { useId, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { PREGUNTAS } from "../constants/preguntas";

/**
 * PREGUNTAS FRECUENTES — acordeón.
 *
 * MEJORA PROGRESIVA: EL PANEL SE SIRVE ABIERTO
 *
 * El estado plegado NO vive en el marcado sino en una regla de CSS que solo
 * aplica detrás de la clase `.js`, la que un script inline agrega al <html>
 * antes del primer pintado. El HTML servido tiene las cinco respuestas
 * visibles: si el JavaScript no corre, esto es una lista de preguntas y
 * respuestas, que se lee perfecto. Con JavaScript, el CSS las pliega antes de
 * que se vean y el acordeón funciona.
 *
 * Al revés —plegar en el marcado y desplegar con JavaScript— un fallo del
 * script dejaría el contenido inaccesible, y además un buscador vería una
 * página con cinco preguntas sin respuesta.
 *
 * ACORDEÓN EXCLUYENTE: UNA SOLA ABIERTA
 *
 * Abrir una cierra la que estuviera abierta. El estado es un único id —o
 * `null`— y no un conjunto: la exclusividad no se mantiene con lógica que
 * pueda fallar, sale de que no hay forma de representar dos abiertas.
 *
 * Volver a tocar la que está abierta la cierra, así que siempre se puede dejar
 * la sección plegada.
 */
export function FaqSection() {
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const idBase = useId();

  const alternar = (id: string) => setAbiertaId((actual) => (actual === id ? null : id));

  return (
    <section
      id="faq"
      aria-labelledby="faq-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 08
          </p>
          <h2 id="faq-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Lo que más se consulta sobre fechas, entradas, accesos y cómo participar.
          </p>
        </Reveal>

        {/* Cuatro quintos para las preguntas y uno para el visual, que estira
            a todo el alto del acordeón. `items-stretch` es lo que hace que la
            franja crezca y se achique con las respuestas que estén abiertas,
            sin fijar ningún alto. */}
        <div className="mt-12 grid items-stretch gap-10 lg:grid-cols-[4fr_1fr]">
          <ul role="list" className="border-t border-border">
            {PREGUNTAS.map((p) => {
              const abierta = p.id === abiertaId;
              const idPanel = `${idBase}-${p.id}`;
              return (
                <li key={p.id} className="border-b border-border">
                  <h3>
                    {/* El botón va DENTRO del encabezado, no al revés: así el
                      lector de pantalla anuncia "nivel 3" y ofrece la pregunta
                      en su lista de encabezados, que es como se navega una
                      página de preguntas frecuentes. */}
                    <button
                      type="button"
                      id={`${idPanel}-pregunta`}
                      aria-expanded={abierta}
                      aria-controls={idPanel}
                      onClick={() => alternar(p.id)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    >
                      <span className="text-lg font-bold text-text sm:text-xl">{p.pregunta}</span>
                      <Cruz abierta={abierta} />
                    </button>
                  </h3>

                  <div
                    id={idPanel}
                    role="region"
                    aria-labelledby={`${idPanel}-pregunta`}
                    className="faq-panel"
                    data-abierta={abierta ? "" : undefined}
                  >
                    {/* El hijo existe para que el panel pueda medir su contenido:
                      la fila de la grilla va de 0fr a 1fr y este div es lo que
                      se mide. Ver .faq-panel en globals.css. */}
                    <div className="overflow-hidden">
                      <p className="max-w-prose pb-6 text-base text-pretty text-text-muted">
                        {p.respuesta}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* PROVISORIO — sin fotografías institucionales todavía. Se oculta en
              pantallas chicas: una franja de un quinto de ancho no aporta nada
              en un teléfono, y apilarla debajo empujaría el contenido real. Es
              decorativa, así que esconderla no saca información. */}
          <div className="relative hidden overflow-hidden border border-border lg:block">
            <PlaceholderVisual paleta={2} className="absolute inset-0 size-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * El indicador: una cruz que gira 45° y queda hecha una equis al abrir.
 *
 * Dos rectas y no un ícono de librería: son dos formas triviales. Van con
 * esquinas VIVAS porque el sistema de diseño solo admite radio 0 o píldora.
 */
function Cruz({ abierta }: { abierta: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border border-border-strong",
        "transition-[rotate,border-color] duration-control ease-standard",
        abierta ? "rotate-45 border-link" : "rotate-0",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <rect x="11" y="4" width="2" height="16" />
        <rect x="4" y="11" width="16" height="2" />
      </svg>
    </span>
  );
}
