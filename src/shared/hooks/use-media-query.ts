"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Lee una media query de forma reactiva y sin desincronizarse de la
 * hidratación. Misma mecánica que `usePrefersReducedMotion`, generalizada.
 *
 * CUÁNDO USARLO Y CUÁNDO NO
 *
 * Solo cuando el breakpoint cambia la ESTRUCTURA del marcado, no cuando cambia
 * cómo se ve. Si alcanza con CSS, va en CSS: esto obliga a un render extra en
 * el cliente y a que el servidor emita una de las dos variantes.
 *
 * QUÉ DEVUELVE EL SERVIDOR
 *
 * `false`. No hay viewport en el servidor, así que se emite la variante más
 * chica —mobile first— y `useSyncExternalStore` corrige en el cliente si la
 * pantalla es más grande. El HTML servido sigue siendo válido y completo: la
 * corrección cambia la disposición, nunca el contenido.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  // `getSnapshot` devuelve un booleano, que se compara por valor: no hace
  // falta cachear el resultado como sí haría falta con un objeto.
  const getSnapshot = useMemo(() => () => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const getServerSnapshot = () => false;
