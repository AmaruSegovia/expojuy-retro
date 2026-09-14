"use client";

import { useEffect } from "react";
import { STORAGE_KEYS } from "@/shared/constants/storage";

/**
 * Lleva un `<time>` de CSS a milisegundos. Hace falta mirar la unidad: el
 * minificador reescribe `300ms` como `.3s`, y un `parseFloat` a secas leía
 * una pausa de 0,3ms. Medido en el navegador, no supuesto.
 */
function aMilisegundos(valor: string): number {
  const numero = parseFloat(valor);
  if (Number.isNaN(numero)) return 0;
  return valor.trim().endsWith("ms") ? numero : numero * 1000;
}

/**
 * Marca las fases de la pantalla de carga. Es el único pedazo del loader que
 * necesita JavaScript, y por eso el único Client Component: el marcado entero
 * sale del servidor.
 *
 *   data-entrando   arrancan las cuatro piezas
 *   data-saliendo   se retira el telón y crece la ventana
 *   (sin data-loader en el <html>)   el loader desaparece
 *
 * POR QUÉ LAS FASES VAN POR ATRIBUTO Y NO COMO RETARDOS DE CSS
 *
 * Porque la entrada no puede arrancar a una hora fija contada desde el primer
 * pintado: en un teléfono de gama baja, ese primer segundo la página todavía
 * está cargando y el comienzo de la animación se pierde. Arranca cuando este
 * efecto corre, o sea con la página ya hidratada; hasta ahí se ve solo el
 * morado. Y encadenar por `animationend` evita que un zoom quede asignado
 * durante toda la entrada, que es trabajo de GPU sin ningún efecto visible.
 *
 * Las duraciones no se repiten acá. La entrada termina cuando dispara el
 * `animationend` de la caída; la salida, cuando dispara el del zoom de la
 * ventana. La única que se lee es la pausa, y se lee del propio CSS.
 */
export function CoreografiaLoader({ idLoader }: { idLoader: string }) {
  useEffect(() => {
    const raiz = document.documentElement;
    const loader = document.getElementById(idLoader);
    // Si el script inline no marcó el atributo, este loader no corresponde:
    // el CSS ya lo tiene oculto y no hay nada que coreografiar.
    if (!raiz.hasAttribute("data-loader") || !loader) return;

    const pausaMs = aMilisegundos(getComputedStyle(loader).getPropertyValue("--l-pausa"));
    let salida: ReturnType<typeof setTimeout> | undefined;

    const alTerminarAnimacion = (e: AnimationEvent) => {
      if (e.animationName === "loader-caida") {
        salida = setTimeout(() => loader.setAttribute("data-saliendo", ""), pausaMs);
        return;
      }
      const esLaVentana =
        e.target instanceof Element && e.target.classList.contains("page-loader__ventana");
      if (e.animationName === "loader-zoom" && esLaVentana) {
        raiz.removeAttribute("data-loader");
        try {
          sessionStorage.setItem(STORAGE_KEYS.loaderVisto, "1");
        } catch {
          // Incógnito o storage bloqueado: que falle no debe romper nada.
        }
      }
    };

    loader.addEventListener("animationend", alTerminarAnimacion);
    // Un cuadro después y no en el acto: el cuadro que pinta la hidratación
    // ya viene cargado, y la entrada no tiene por qué compartirlo.
    const entrada = requestAnimationFrame(() => loader.setAttribute("data-entrando", ""));

    return () => {
      cancelAnimationFrame(entrada);
      clearTimeout(salida);
      loader.removeEventListener("animationend", alTerminarAnimacion);
    };
  }, [idLoader]);

  return null;
}
