"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type RevealProps = {
  children: ReactNode;
  /** Etiqueta a renderizar. Por defecto `div`, pero casi siempre conviene el elemento semántico real. */
  as?: ElementType;
  /** Retardo en ms para escalonar hermanos. Se aplica como variable CSS, no como timer de JS. */
  delay?: number;
  /** Dirección desde la que entra el contenido. */
  from?: "bottom" | "left" | "right" | "none";
  className?: string;
  /** Para poder referenciarlo desde aria-labelledby. */
  id?: string;
};

/**
 * Aparición al entrar en viewport.
 *
 * MEJORA PROGRESIVA — el estado oculto NO se aplica desde el servidor. El
 * HTML sale visible; la regla que lo oculta vive detrás de la clase `.js`
 * que un script inline agrega al <html> antes del primer pintado. Si el JS
 * no corre, la clase nunca aparece, la regla nunca aplica y el contenido se
 * ve completo. Sin esto, un fallo de JS dejaría el sitio entero en blanco.
 *
 * La animación en sí es CSS (opacity + translate, ambas compuestas por GPU):
 * el observer solo cambia un atributo.
 */
export function Reveal({
  children,
  as: Comp = "div",
  delay = 0,
  from = "bottom",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        // Una sola vez: reaparecer al volver a scrollear hacia arriba se siente
        // como un glitch, no como una animación.
        observer.disconnect();
      },
      // -12% inferior: dispara cuando el elemento ya entró de verdad, no
      // apenas asoma un píxel por el borde de la pantalla.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Comp
      ref={ref}
      id={id}
      data-reveal={shown ? "shown" : "hidden"}
      data-reveal-from={from}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Comp>
  );
}
