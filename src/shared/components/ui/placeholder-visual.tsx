import { cn } from "@/shared/lib/cn";

/**
 * Visual provisorio, en lugar de una fotografía institucional.
 *
 * ⚠️ El kit entregado por la organización NO incluye fotografías. Esto ocupa
 * su lugar hasta que existan. Reemplazar por <Image> cuando lleguen: quien lo
 * usa ya reserva la relación de aspecto, así que el cambio no mueve el layout.
 *
 * VIVE EN shared/ PORQUE LO NECESITAN DOS FEATURES: las láminas de "Sobre
 * ExpoJuy" y las tarjetas de la Agenda. La frontera de arquitectura prohíbe
 * que un feature importe de otro, así que lo compartido sube acá.
 *
 * NO es un rectángulo gris a propósito. La retícula sale del propio
 * isologotipo: sus cuatro piezas están construidas sobre un módulo cuadrado de
 * 48.3 unidades de PDF (el asta mide 48.3 de ancho, las barras 48.3 de alto).
 * Ese mismo módulo se repite acá como patrón, así que el relleno se lee como
 * parte del sistema y no como un hueco.
 *
 * Cada instancia toma un par de colores distinto para que la sección tenga
 * ritmo cromático al desplazarse.
 */

const PARES = [
  ["var(--color-brand-violet-deep)", "var(--color-brand-violet)"],
  ["var(--color-brand-violet)", "var(--color-brand-lavender)"],
  ["var(--color-brand-cyan)", "var(--color-brand-violet)"],
  ["var(--color-brand-lavender)", "var(--color-brand-cyan)"],
] as const;

export function PlaceholderVisual({
  paleta,
  className,
}: {
  paleta: 0 | 1 | 2 | 3;
  className?: string;
}) {
  const [desde, hasta] = PARES[paleta];
  // Un id por instancia: dos patrones con el mismo id se pisarían entre sí.
  const idPatron = `reticula-${paleta}`;

  return (
    <div
      className={cn("relative overflow-hidden bg-surface-raised", className)}
      // Decorativo mientras sea provisorio: no describe nada real todavía.
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: `linear-gradient(135deg, ${desde}, ${hasta})` }}
      />
      <svg className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={idPatron} width="48.3" height="48.3" patternUnits="userSpaceOnUse">
            {/* El módulo del isologotipo: 48.3 unidades de lado. */}
            <rect width="48.3" height="48.3" fill="none" stroke="#000" strokeOpacity="0.18" />
            <rect width="16" height="16" fill="#000" fillOpacity="0.12" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${idPatron})`} />
      </svg>
    </div>
  );
}
