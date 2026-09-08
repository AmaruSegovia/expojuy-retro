"use client";

import { useRef } from "react";
import { useLenis } from "lenis/react";

/**
 * Barra de progreso de lectura, fija arriba del viewport.
 *
 * DECISIÓN DE RENDIMIENTO: el progreso NO vive en el estado de React.
 *
 * Un `setState` por frame de scroll haría re-renderizar el componente ~60 veces
 * por segundo, con su reconciliación correspondiente. En cambio escribimos
 * directo sobre una custom property del nodo vía ref: el navegador solo
 * recompone el `scaleX`, sin tocar React ni recalcular layout.
 *
 * Es la diferencia entre una barra que cuesta ~0ms de JS por frame y una que
 * compite con el scroll suave por el mismo hilo.
 */
export function ScrollProgress() {
  const barra = useRef<HTMLDivElement>(null);

  useLenis((lenis) => {
    const nodo = barra.current;
    if (!nodo) return;
    // `progress` viene 0→1. Number.isFinite lo protege del caso en que la
    // página aún no tiene alto scrolleable y el cálculo da NaN.
    const p = Number.isFinite(lenis.progress) ? lenis.progress : 0;
    nodo.style.setProperty("--progreso", String(Math.min(1, Math.max(0, p))));
  });

  return (
    // El track completo es decorativo: el progreso de lectura no es
    // información que un lector de pantalla necesite anunciar.
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px]" aria-hidden="true">
      <div
        ref={barra}
        className="h-full origin-left bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-lavender"
        style={{ transform: "scaleX(var(--progreso, 0))" }}
      />
    </div>
  );
}
