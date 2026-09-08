"use client";

import { useCallback, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/**
 * Manejador de click para los enlaces internos (`href="#seccion"`).
 *
 * BUG CORREGIDO: `preventDefault` INCONDICIONAL
 *
 * El manejador de origen cancelaba el evento siempre, y eso rompe los gestos
 * que el navegador ya resuelve bien: Ctrl+click y click con la rueda abren en
 * una pestaña nueva, Shift+click en una ventana nueva, Alt+click descarga. Con
 * el evento cancelado, las tres opciones desaparecían sin aviso. Acá se sale
 * antes de tocar nada si hay algún modificador o si el botón no es el
 * principal, y el navegador hace lo suyo.
 *
 * BUG CORREGIDO: EL OFFSET DEL ENCABEZADO
 *
 * El destino no es el borde de la sección sino ese borde menos el alto del
 * encabezado fijo, o el título queda tapado. Ese número NO está escrito acá:
 * se lee del `scroll-margin-top` computado de la sección (lo define
 * layout.css a partir de `--alto-nav`). Así el camino con JavaScript y el
 * salto nativo -sin JavaScript, o con movimiento reducido- usan exactamente el
 * mismo valor y no pueden separarse.
 *
 * @param alNavegar se ejecuta solo cuando la navegación ocurre en esta
 *   pestaña, con el id de destino. Sirve para marcar el ítem activo antes de
 *   que termine el scroll y para cerrar el menú.
 */
export function useClickAncla(alNavegar?: (id: string) => void) {
  const lenis = useLenis();
  const reducido = usePrefersReducedMotion();

  return useCallback(
    (evento: MouseEvent<HTMLAnchorElement>) => {
      // Otro manejador ya decidió; no le pisamos la decisión.
      if (evento.defaultPrevented) return;

      // Gestos del navegador: se respetan tal cual.
      if (
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }

      const href = evento.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const id = href.slice(1);
      const destino = document.getElementById(id);
      // Sin destino en el documento, mejor el salto nativo que un click muerto.
      if (!destino) return;

      evento.preventDefault();
      alNavegar?.(id);

      const margen = Number.parseFloat(getComputedStyle(destino).scrollMarginTop) || 0;

      if (lenis) {
        // `immediate` respeta la preferencia del sistema: con movimiento
        // reducido el salto es instantáneo, pero CONSERVA el offset.
        lenis.scrollTo(destino, { offset: -margen, immediate: reducido });
      } else {
        // Sin Lenis (todavía montando), scrollIntoView respeta por sí solo el
        // scroll-margin-top de la sección.
        destino.scrollIntoView({ behavior: reducido ? "auto" : "smooth" });
      }

      // Deja el ancla en la barra de direcciones para que el enlace sea
      // compartible. `replaceState` no agrega entrada al historial ni provoca
      // un salto, a diferencia de asignar `location.hash`.
      window.history.replaceState(null, "", href);
    },
    [lenis, reducido, alNavegar],
  );
}
