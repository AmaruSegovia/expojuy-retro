"use client";

import { useEffect, useRef } from "react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { NAV_SECTIONS, SITE } from "@/shared/constants/site";
import { useBloqueoScroll } from "@/shared/hooks/use-bloqueo-scroll";
import { useClickAncla } from "@/shared/hooks/use-click-ancla";

type MenuPrincipalProps = {
  /** Referenciado por `aria-controls` desde el disparador del encabezado. */
  id: string;
  abierto: boolean;
  onCerrar: () => void;
  activo: string | null;
  onActivo: (id: string) => void;
};

/**
 * Menú a pantalla completa. Es un `<dialog>` nativo abierto con `showModal()`.
 *
 * POR QUÉ `<dialog>` Y NO UN OVERLAY CON FOCUS TRAP ESCRITO A MANO
 *
 * La plataforma ya hace bien las cuatro cosas difíciles, y gratis:
 *
 *   - Foco atrapado adentro del panel mientras está abierto.
 *   - Cierre con Escape.
 *   - Devolución del foco al elemento que lo abrió, al cerrar.
 *   - Semántica de diálogo modal: `role="dialog"` y `aria-modal` implícitos.
 *     Agregarlos a mano acá sería redundante y puede confundir a los lectores.
 *
 * Además vive en el TOP LAYER, así que ningún z-index del sitio puede taparlo,
 * y cerrado es `display: none`: fuera del orden de tabulación y fuera del árbol
 * de accesibilidad. Eso es exactamente lo que aportaba el `inert` del overlay
 * siempre montado del original, sin escribir una línea.
 *
 * LO QUE SÍ QUEDA A CARGO NUESTRO
 *
 * El estado `abierto` vive en el encabezado (el padre), porque el disparador
 * necesita reflejarlo en `aria-expanded`. React no re-renderiza cuando el
 * navegador cierra el diálogo por Escape o por click en el fondo, así que hay
 * que sincronizar en las dos direcciones: el efecto empuja el estado al
 * elemento y `onClose` trae el cierre del navegador de vuelta al estado. Sin
 * esa vuelta, la hamburguesa se quedaría en cruz con el menú ya cerrado.
 *
 * Y el bloqueo de scroll: Lenis intercepta la rueda antes que el navegador, o
 * sea que el diálogo modal por sí solo no lo detiene.
 */
export function MenuPrincipal({ id, abierto, onCerrar, activo, onActivo }: MenuPrincipalProps) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useBloqueoScroll(abierto);

  const alClickAncla = useClickAncla((idSeccion) => {
    onActivo(idSeccion);
    dialogo.current?.close();
  });

  useEffect(() => {
    const nodo = dialogo.current;
    if (!nodo) return;
    // Los guardas no son decorativos: `showModal()` sobre un diálogo ya
    // abierto lanza InvalidStateError.
    if (abierto && !nodo.open) nodo.showModal();
    else if (!abierto && nodo.open) nodo.close();
  }, [abierto]);

  return (
    <dialog
      id={id}
      ref={dialogo}
      className="menu-principal"
      aria-label="Menú de navegación"
      // Cubre las tres formas de cerrar: el botón, Escape y el click en el
      // fondo. Es el único punto donde el estado se entera.
      onClose={onCerrar}
      // El click sobre el ::backdrop llega con el propio <dialog> como target.
      onClick={(evento) => {
        if (evento.target === dialogo.current) dialogo.current?.close();
      }}
    >
      <div className="flex min-h-[var(--alto-nav)] flex-none items-center justify-between gap-4 border-b border-border px-5 sm:px-10">
        <BrandMark className="h-8 w-auto" />
        <span className="sr-only">{SITE.name}</span>
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 text-xs font-semibold tracking-[0.18em] text-text uppercase transition-colors duration-micro hover:bg-surface-raised"
        >
          Cerrar
        </button>
      </div>

      <nav aria-label="Todas las secciones" className="menu-principal__lista">
        <ul>
          {NAV_SECTIONS.map((seccion, i) => (
            <li key={seccion.id}>
              <a
                href={`#${seccion.id}`}
                onClick={alClickAncla}
                // `location` es el valor de aria-current para "dónde estoy
                // dentro de este documento".
                aria-current={activo === seccion.id ? "location" : undefined}
              >
                {/* El número es el mismo que lleva el copete de la sección:
                    sale de la posición en NAV_SECTIONS, no de una lista
                    aparte. Decorativo, no se lee. */}
                <span className="menu-principal__n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {seccion.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* `env(safe-area-inset-bottom)` para que el CTA no quede debajo de la
          barra de gestos del teléfono. */}
      <div className="flex-none px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-10">
        <a
          href="#entradas"
          onClick={alClickAncla}
          className="flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors duration-micro ease-standard hover:bg-primary-hover active:bg-primary-active"
        >
          Conseguir entradas
        </a>
      </div>
    </dialog>
  );
}
