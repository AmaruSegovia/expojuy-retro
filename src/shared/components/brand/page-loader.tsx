"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./brand-mark";
import { LoaderBackdrop } from "./loader-backdrop";
import { STORAGE_KEYS } from "@/shared/constants/storage";

/**
 * Duración total. DEBE coincidir con la suma de los tiempos declarados en
 * globals.css (bloque PANTALLA DE CARGA):
 *   barrido 620 + caída 780 = 1400 de entrada
 *   + 300 de pausa
 *   + 1400 de salida
 */
const DURACION_MS = 3100;

/** Cuánto dura la salida. Debe coincidir con --l-salida-dur en globals.css. */
const SALIDA_MS = 1400;

/**
 * Pantalla de carga: las cuatro piezas del isologotipo entran una por una y
 * después la "J" crece y se desvanece dejando ver el hero.
 *
 * POR QUÉ LA VISIBILIDAD NO ESTÁ EN EL ESTADO DE REACT
 *
 * La decisión de mostrarlo la toma un script inline en el layout, que marca
 * `data-loader` en el <html>. El CSS lo muestra a partir de ese atributo. Si
 * dependiera de un efecto de React el orden sería pintar el hero → hidratar →
 * recién ahí tapar con el morado: el usuario vería la página y DESPUÉS el
 * loader. Con el atributo puesto antes del primer pintado, el morado está
 * desde el frame cero. React acá solo maneja los temporizadores de salida.
 *
 * OTRAS DECISIONES QUE NO SON ESTÉTICAS
 *
 * - No bloquea el contenido: el HTML se sirve completo debajo del overlay, así
 *   que el LCP no lo espera y los buscadores no ven una página vacía.
 * - `aria-hidden` y sin foco: para un lector de pantalla no existe.
 * - Una vez por sesión.
 * - Con `prefers-reduced-motion` el script no pone el atributo, así que no se
 *   muestra en absoluto. No "más rápido": no se muestra.
 */
export function PageLoader() {
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    // Si el script inline no marcó el atributo, este loader no corresponde:
    // el CSS ya lo tiene oculto y no hay nada que temporizar.
    if (!raiz.hasAttribute("data-loader")) return;

    document.body.style.overflow = "hidden";

    // Estos setState viven dentro de callbacks asíncronos, no en el cuerpo del
    // efecto: no provocan el render extra que penaliza set-state-in-effect.
    const aSalir = setTimeout(() => setSaliendo(true), DURACION_MS - SALIDA_MS);
    const aTerminar = setTimeout(() => {
      raiz.removeAttribute("data-loader");
      document.body.style.overflow = "";
      try {
        sessionStorage.setItem(STORAGE_KEYS.loaderVisto, "1");
      } catch {
        // Incógnito o storage bloqueado: que falle no debe romper nada.
      }
    }, DURACION_MS);

    return () => {
      clearTimeout(aSalir);
      clearTimeout(aTerminar);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      // Sin `grid place-items-center`: ese layout lo define .page-loader en
      // globals.css. Ver el comentario ahí - usar utilidades acá haría que
      // ningún `display: none` pudiera ocultarlo (las capas ganan a la
      // especificidad).
      className="page-loader fixed inset-0 z-[200]"
      data-saliendo={saliendo ? "" : undefined}
      aria-hidden="true"
    >
      {/* El morado NO es un color de fondo: es un rect con la "J" recortada
          como ventana. Ver loader-backdrop.tsx. */}
      <LoaderBackdrop />
      <BrandMark className="page-loader__mark" />
    </div>
  );
}
