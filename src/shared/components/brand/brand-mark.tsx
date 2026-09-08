import { BRAND_FLIP_Y, BRAND_PATHS, BRAND_VIEW_BOX } from "./brand-mark-paths";
import { cn } from "@/shared/lib/cn";

type BrandMarkProps = {
  className?: string;
  /**
   * Texto alternativo. Si se omite, la marca se trata como decorativa y se
   * oculta a los lectores de pantalla - que es lo correcto cuando va al lado
   * de un texto que ya dice "ExpoJuy 2026".
   */
  title?: string;
  /**
   * Pinta las cuatro piezas con `currentColor` en vez de con sus colores de
   * marca, para que el color lo gobierne el contexto.
   *
   * NO es un capricho estético: existe porque la grilla de Sponsors usa la "J"
   * como marcador de posición de un logotipo que todavía no tenemos, y ahí la
   * marca no está actuando como marca sino como relleno. En policromía, las
   * dieciséis fichas serían dieciséis logotipos de ExpoJuy y la sección diría
   * que ExpoJuy se auspicia a sí misma.
   *
   * La geometría sigue siendo la misma y sale del mismo módulo: acá cambia el
   * relleno, no el dibujo.
   */
  monocromo?: boolean;
};

/**
 * Isologotipo de ExpoJuy 2026 - la "J".
 * La geometría y su procedencia están documentadas en `brand-mark-paths.ts`.
 */
export function BrandMark({ className, title, monocromo }: BrandMarkProps) {
  const decorativa = !title;

  return (
    <svg
      viewBox={BRAND_VIEW_BOX}
      className={cn("block", className)}
      role={decorativa ? "presentation" : "img"}
      aria-hidden={decorativa || undefined}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <g transform={BRAND_FLIP_Y}>
        {BRAND_PATHS.map((p) => (
          <path
            key={p.className}
            className={p.className}
            fill={monocromo ? "currentColor" : p.fill}
            fillRule={p.fillRule}
            d={p.d}
          />
        ))}
      </g>
    </svg>
  );
}
