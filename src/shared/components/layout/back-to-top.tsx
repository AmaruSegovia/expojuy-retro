"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/lib/cn";

/**
 * Botón de volver arriba. Aparece recién pasada la segunda sección, como pide
 * el plan: antes de eso el usuario tiene el inicio a un scroll de distancia y
 * el botón sería solo ruido tapando contenido.
 *
 * El umbral se expresa en alturas de viewport, no en píxeles fijos: "dos
 * pantallas" significa lo mismo en un monitor de 1440px que en un celular.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const reducirMovimiento = usePrefersReducedMotion();

  const lenis = useLenis((instancia) => {
    const deberia = instancia.scroll > window.innerHeight * 2;
    setVisible((actual) => (actual === deberia ? actual : deberia));
  });

  return (
    <button
      type="button"
      onClick={() =>
        // `immediate` respeta la preferencia del sistema: con movimiento
        // reducido el salto es instantáneo en vez de un viaje animado por
        // toda la página.
        lenis?.scrollTo(0, { immediate: reducirMovimiento, duration: 1.1 })
      }
      // `inert` además de las clases: sin esto el botón invisible seguiría
      // siendo alcanzable con Tab, dejando una parada fantasma en el recorrido
      // de teclado.
      inert={!visible}
      aria-hidden={!visible}
      className={cn(
        // Por debajo de 64rem la barra móvil ocupa los últimos 3.5rem del
        // viewport: el botón se apoya arriba de ella (3.5rem + 1rem de aire)
        // en vez de quedar pisado. De `lg` para arriba la barra no existe.
        "fixed right-5 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-[85] sm:right-8 lg:bottom-8",
        "grid size-12 place-items-center rounded-full",
        "border border-border-strong bg-surface-overlay/90 text-text backdrop-blur-md",
        "hover:border-primary hover:bg-primary hover:text-on-primary",
        "transition-all duration-control ease-standard",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp size={20} aria-hidden />
      <span className="sr-only">Volver al inicio de la página</span>
    </button>
  );
}
