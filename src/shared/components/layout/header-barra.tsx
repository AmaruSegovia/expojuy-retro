"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { NAV_SECTIONS, SITE } from "@/shared/constants/site";
import { useActiveSection } from "@/shared/hooks/use-active-section";
import { useClickAncla } from "@/shared/hooks/use-click-ancla";
import { cn } from "@/shared/lib/cn";
import { MenuPrincipal } from "./menu-principal";

/** El mismo id en `aria-controls` y en el <dialog>. Si cambia, cambia acá. */
const ID_MENU = "menu-principal";

/** A partir de este scroll el encabezado enciende su velo. */
const SCROLL_VELO = 40;

/**
 * Barra fija superior. Un solo encabezado responsive: NO hay una versión móvil
 * aparte, hay dos cortes -40rem para el CTA, 64rem para la navegación- y un
 * diálogo a pantalla completa para lo que no entra. Las reglas que hacen eso
 * viven en layout.css, no en utilidades, porque tienen que poder apagarse sin
 * JavaScript.
 *
 * TRES ESTADOS INDEPENDIENTES SOBRE EL MISMO NODO
 *
 *   data-listo     la entrada del encabezado, detrás de `.js`
 *   data-scrolled  el velo de fondo, a partir de 40px
 *   data-seccion   el tema de la sección que tiene debajo
 *
 * Ninguno sabe de los otros: se combinan como atributos y el CSS los compone.
 */
export function HeaderBarra() {
  const [abierto, setAbierto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const encabezado = useRef<HTMLElement>(null);

  const ids = useMemo(() => NAV_SECTIONS.map((s) => s.id), []);
  const [activo, setActivo] = useActiveSection(ids);

  const alClickAncla = useClickAncla(setActivo);

  // La entrada corre recién montado el componente. El atributo se escribe
  // DIRECTO EN EL DOM y no pasa por el estado: es un cambio de una sola vez,
  // así no gasta un render extra ni cae en el setState dentro de un efecto que
  // el compilador de React marca como cascada. React no toca `data-listo`
  // después, porque nunca fue una prop suya.
  //
  // El HTML se sirve con el encabezado VISIBLE y el estado oculto vive detrás
  // de `.js`, así que si el JavaScript no llega nunca, el encabezado igual se
  // ve. Mejora progresiva: lo oculto es la mejora, no el punto de partida.
  useEffect(() => {
    encabezado.current?.setAttribute("data-listo", "");
  }, []);

  // Igual que en la barra de progreso: esto no puede correr un setState por
  // frame de scroll, solo cuando el booleano cambia de valor.
  useLenis((lenis) => {
    const deberia = lenis.scroll > SCROLL_VELO;
    setScrolled((actual) => (actual === deberia ? actual : deberia));
  });

  return (
    <>
      <header
        ref={encabezado}
        className="encabezado"
        data-scrolled={scrolled || undefined}
        // El velo lee el color de la sección de abajo a través de este
        // atributo. Ver `--fondo-seccion` en layout.css.
        data-seccion={activo ?? undefined}
      >
        <div className="encabezado__interior mx-auto flex w-full max-w-[var(--container-wide)] items-center justify-between gap-4 px-5 sm:px-10">
          <a
            href="#inicio"
            onClick={alClickAncla}
            className="flex shrink-0 items-center gap-3"
            aria-label={`${SITE.name}, ir al inicio`}
          >
            <BrandMark className="h-8 w-auto sm:h-9" />
          </a>

          <nav className="encabezado__nav" aria-label="Navegación principal">
            <ul className="flex items-center gap-5">
              {NAV_SECTIONS.map((seccion) => {
                const esActivo = activo === seccion.id;
                return (
                  <li key={seccion.id}>
                    <a
                      href={`#${seccion.id}`}
                      onClick={alClickAncla}
                      // `location` es el valor de aria-current para "dónde
                      // estoy dentro de este documento". Los lectores que no
                      // lo conozcan lo tratan como "true", que también sirve.
                      aria-current={esActivo ? "location" : undefined}
                      className={cn(
                        "encabezado__link inline-block py-1 text-sm",
                        esActivo ? "text-text" : "text-text-muted hover:text-text",
                      )}
                    >
                      {seccion.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#entradas"
              onClick={alClickAncla}
              className="encabezado__cta min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-colors duration-micro ease-standard hover:bg-primary-hover active:bg-primary-active"
            >
              Entradas
            </a>

            <button
              type="button"
              onClick={() => setAbierto(true)}
              // El contrato ARIA completo del disparador. `aria-expanded` no es
              // solo para lectores: también gobierna la animación de la
              // hamburguesa, así que el estado visual y el accesible son el
              // mismo dato y no pueden desincronizarse.
              aria-haspopup="dialog"
              aria-expanded={abierto}
              aria-controls={ID_MENU}
              className="encabezado__disparador min-h-11 items-center gap-2 rounded-full border border-border-strong px-4 text-xs font-semibold tracking-[0.18em] text-text uppercase transition-colors duration-micro hover:bg-surface-raised"
            >
              <span className="hamburguesa" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Menú
            </button>
          </div>
        </div>
      </header>

      <MenuPrincipal
        id={ID_MENU}
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        activo={activo}
        onActivo={setActivo}
      />
    </>
  );
}
