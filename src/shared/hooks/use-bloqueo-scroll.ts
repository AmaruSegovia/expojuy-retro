"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

const CLASE = "scroll-bloqueado";
const VARIABLE = "--ancho-barra-scroll";

/**
 * Congela el scroll de la página mientras hay un diálogo abierto.
 *
 * DOS CAPAS, PORQUE NINGUNA ALCANZA SOLA
 *
 * 1. `overflow: hidden` en <html> frena el scroll nativo, el de la rueda y el
 *    del teclado.
 * 2. `lenis.stop()` frena el motor de scroll suave, que si no seguiría
 *    interpolando por su cuenta: Lenis intercepta la rueda antes que el
 *    navegador, así que el overflow no lo detiene.
 *
 * BUG CORREGIDO: LA BARRA DE SCROLL
 *
 * El original hacía `overflow: hidden` a secas. En Windows la barra de scroll
 * ocupa ancho real -unos 15px-, así que al ocultarla el viewport se ensancha y
 * la página entera salta lateralmente al abrir el menú. Acá se mide ese ancho
 * (`innerWidth - clientWidth`, que da 0 en macOS y en móvil, donde la barra
 * flota) y se devuelve como relleno. El CSS que lo aplica está en layout.css,
 * porque también tiene que compensar a los elementos `fixed`, que no heredan
 * el relleno de <html>.
 */
export function useBloqueoScroll(activo: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!activo) return;

    const raiz = document.documentElement;
    const compensacion = window.innerWidth - raiz.clientWidth;

    raiz.style.setProperty(VARIABLE, `${compensacion}px`);
    raiz.classList.add(CLASE);
    lenis?.stop();

    return () => {
      raiz.classList.remove(CLASE);
      raiz.style.removeProperty(VARIABLE);
      lenis?.start();
    };
  }, [activo, lenis]);
}
