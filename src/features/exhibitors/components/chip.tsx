import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Chip de filtro: un interruptor, no una pestaña ni una opción de radio.
 *
 * `aria-pressed` es lo que lo comunica. La diferencia importa: un `radio`
 * obliga a elegir una opción y una `tab` cambia de panel, mientras que acá
 * cada chip prende y apaga un recorte de la MISMA lista, que es exactamente lo
 * que describe un botón de dos estados. El grupo que los contiene aporta el
 * nombre accesible ("Filtrar por rubro"); ver el buscador.
 *
 * `min-h-9` son los 36px de área táctil mínima que pide el sistema. No engorda
 * el dibujo: el alto ya rondaba ese valor, esto solo lo garantiza cuando la
 * tipografía fluida se achica en pantallas angostas.
 */
export function Chip({
  children,
  presionado,
  onClick,
  className,
}: {
  children: ReactNode;
  presionado: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={presionado}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center rounded-full px-4 py-2 text-sm font-semibold",
        "transition-colors duration-micro ease-standard",
        presionado
          ? "bg-primary text-on-primary hover:bg-primary-hover"
          : "border border-border-strong text-text-muted hover:border-link hover:text-link",
        className,
      )}
    >
      {children}
    </button>
  );
}
