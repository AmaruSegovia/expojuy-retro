"use client";

import { useId, useState } from "react";
import type { Pregunta } from "../constants/preguntas";

/**
 * ACORDEÓN - una sola respuesta abierta a la vez.
 *
 * EXCLUYENTE POR CONSTRUCCIÓN. El estado es un único id, o `null`, y no un
 * conjunto: no existe forma de representar dos abiertas, así que la
 * exclusividad no depende de ninguna lógica que pueda fallar. Volver a tocar
 * la abierta la cierra, o sea que siempre se puede dejar todo plegado.
 *
 * ARRANCA CON LA PRIMERA ABIERTA. Una lista de seis renglones idénticos no
 * muestra qué hay adentro; con la primera abierta se ve de entrada que cada
 * pregunta tiene su respuesta acá y no en otra página.
 *
 * MEJORA PROGRESIVA: LOS PANELES SE SIRVEN ABIERTOS
 *
 * El marcado NO lleva el atributo `hidden`. El estado plegado es una regla de
 * CSS que solo aplica detrás de la clase `js` del <html>, que un script inline
 * agrega antes del primer pintado. Sin JavaScript esto es una lista de seis
 * preguntas con sus seis respuestas, que se lee perfecto y que un buscador
 * indexa entera.
 *
 * Es también la corrección de un defecto del original, que sí usaba `hidden` y
 * después lo anulaba con `.panel[hidden] { display: grid }` para poder animar
 * el cierre. Esa combinación devolvía el panel al árbol de accesibilidad: el
 * texto quedaba recortado a cero píxeles de alto pero un lector de pantalla lo
 * seguía leyendo. Acá el ocultamiento lo hace `visibility` sobre el panel, que
 * sí lo saca del árbol y admite transición. Ver styles.css.
 *
 * ARIA canónico de disclosure: el `<button>` va DENTRO del `<h3>` -así el
 * lector anuncia "nivel 3" y la pregunta aparece en su lista de encabezados,
 * que es como se navega una página de preguntas frecuentes-, con
 * `aria-expanded` y `aria-controls`, y el panel es un `region` etiquetado por
 * el propio botón.
 */
export function Acordeon({ preguntas }: { preguntas: readonly Pregunta[] }) {
  const [abiertaId, setAbiertaId] = useState<string | null>(preguntas[0]?.id ?? null);
  // Prefijo propio: dos acordeones en la misma página no colisionan ids.
  const idBase = useId();

  const alternar = (id: string) => setAbiertaId((actual) => (actual === id ? null : id));

  return (
    <ul role="list" className="border-t border-border">
      {preguntas.map((p) => {
        const abierta = p.id === abiertaId;
        const idBoton = `${idBase}-${p.id}-boton`;
        const idPanel = `${idBase}-${p.id}-panel`;

        return (
          <li
            key={p.id}
            className="acordeon__item border-b border-border"
            data-abierta={abierta ? "" : undefined}
          >
            <h3>
              <button
                type="button"
                id={idBoton}
                aria-expanded={abierta}
                aria-controls={idPanel}
                onClick={() => alternar(p.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-bold text-text transition-colors duration-micro ease-standard hover:text-link sm:text-xl"
              >
                <span>{p.pregunta}</span>
                {/* Un más que se convierte en menos girando una de sus dos
                    barras. Son dos pseudo-elementos, no un ícono de librería:
                    es un signo, no un dibujo. */}
                <span aria-hidden="true" className="acordeon__icono" />
              </button>
            </h3>

            {/* SIN UTILIDAD DE DISPLAY EN ESTE ELEMENTO. La regla que lo pliega
                vive en @layer components y las utilidades de Tailwind van
                después, en @layer utilities: un `grid` acá le ganaría por capa
                y el panel no se cerraría nunca. El layout va en el hijo. */}
            <div id={idPanel} role="region" aria-labelledby={idBoton} className="acordeon__panel">
              {/* Este hijo existe para dos cosas: recorta el contenido mientras
                  la fila se colapsa y es lo que la grilla mide para saber
                  cuánto vale 1fr. */}
              <div className="acordeon__contenido">
                <p className="max-w-prose pb-5 text-base text-pretty text-text-muted">
                  {p.respuesta}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
