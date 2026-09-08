"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/**
 * Scroll suave global (Lenis).
 *
 * Con `root`, ReactLenis NO inserta ningún wrapper en el DOM: renderiza los
 * children tal cual dentro de un context provider, y crea la instancia recién
 * en un efecto. Por eso se puede montar siempre sin riesgo de hidratación.
 *
 * Para `prefers-reduced-motion` NO desmontamos el componente (eso remontaría
 * todo el árbol): degradamos las opciones. Con `smoothWheel: false` y
 * `lerp: 1` el scroll pasa a ser efectivamente el nativo, pero la instancia
 * sigue viva para que `scrollTo` de la navegación siga funcionando.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  return (
    <ReactLenis
      root
      options={{
        lerp: reduced ? 1 : 0.1,
        smoothWheel: !reduced,
        // En táctil el scroll nativo ya es excelente y sincronizarlo con Lenis
        // introduce una latencia que se percibe como "pesada" en gama baja.
        syncTouch: false,
        wheelMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}
