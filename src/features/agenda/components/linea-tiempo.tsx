/**
 * La línea vertical de la agenda, en SVG.
 *
 * POR QUÉ pathLength="1"
 * El trazado se dibuja con `stroke-dasharray` / `stroke-dashoffset`, que se
 * miden en unidades de la propia curva. El problema es que el alto real de
 * esta línea depende de cuánto ocupe la lista, que cambia con el viewport y
 * con el contenido: nadie sabe de antemano cuánto mide.
 *
 * `pathLength="1"` le declara al navegador que, a efectos de dashes, la curva
 * mide 1. A partir de ahí `stroke-dashoffset: calc(1 - var(--avance))` es
 * literalmente "el porcentaje que falta", sin que ningún JavaScript tenga que
 * medir el path con getTotalLength() ni volver a hacerlo en cada resize.
 *
 * ⚠️ EL DEGRADADO VA EN userSpaceOnUse, Y NO ES UNA PREFERENCIA
 * `gradientUnits` vale `objectBoundingBox` por defecto: el degradado se mapea
 * sobre la caja del elemento pintado. La caja de una recta VERTICAL tiene
 * ancho CERO, y la especificación dice que un elemento con caja degenerada que
 * referencia un degradado en objectBoundingBox NO SE PINTA. No sale tenue ni
 * mal ubicado: no sale. Los puntos sí se veían —son fondo de CSS, no un
 * servidor de pintura de SVG— y esa asimetría es lo que delató el problema.
 *
 * En userSpaceOnUse las coordenadas del degradado son las del viewBox, así
 * que la caja del path deja de importar.
 *
 * POR QUÉ NO HAY vector-effect
 * El viewBox se estira SOLO en vertical: mide 24 de ancho y el SVG también
 * mide 24px, con lo cual la escala horizontal es exactamente 1. Como el trazo
 * de una recta vertical se mide en horizontal, ya sale de 2px sin ayuda.
 * `non-scaling-stroke` además pasaría los dashes a espacio de pantalla y
 * rompería la normalización de pathLength, que es de lo que depende todo esto.
 *
 * POR QUÉ los colores van en `style` y no en atributos
 * `stop-color="var(--…)"` como atributo de presentación no resuelve de forma
 * confiable en todos los motores. Como propiedad CSS —que es lo que hace
 * `style`— sí. Los tokens del sistema no se duplican en hexadecimal.
 */

const ID_DEGRADE = "agenda-linea-degrade";

/** Alto del viewBox. Se estira en vertical, así que el número es arbitrario. */
const ALTO_VIEWBOX = 1000;
/** Ancho del viewBox. Tiene que coincidir con el ancho en px del SVG (w-6). */
const ANCHO_VIEWBOX = 24;

const TRAZO = `M${ANCHO_VIEWBOX / 2} 0V${ALTO_VIEWBOX}`;

export function LineaTiempo({ className }: { className?: string }) {
  return (
    // Decorativa: la cronología ya la expresa la lista ordenada.
    <svg
      aria-hidden="true"
      className={className}
      viewBox={`0 0 ${ANCHO_VIEWBOX} ${ALTO_VIEWBOX}`}
      preserveAspectRatio="none"
    >
      <defs>
        {/* Los mismos tres colores y el mismo orden que la barra de progreso
            de lectura: las dos cosas miden avance, y se ven como parientes. */}
        <linearGradient
          id={ID_DEGRADE}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={ALTO_VIEWBOX}
        >
          <stop offset="0%" style={{ stopColor: "var(--color-brand-cyan)" }} />
          <stop offset="50%" style={{ stopColor: "var(--color-brand-violet)" }} />
          <stop offset="100%" style={{ stopColor: "var(--color-brand-lavender)" }} />
        </linearGradient>
      </defs>

      {/* Riel apagado: marca el recorrido completo antes de recorrerlo. */}
      <path d={TRAZO} fill="none" strokeWidth="2" className="stroke-border" />

      {/* Trazo que avanza. El dashoffset lo gobierna --avance, que escribe
          useAvanceLinea sobre el contenedor. Ver globals.css. */}
      <path
        className="agenda-tiempo__trazo"
        d={TRAZO}
        pathLength={1}
        fill="none"
        strokeWidth="2"
        strokeLinecap="butt"
        stroke={`url(#${ID_DEGRADE})`}
      />
    </svg>
  );
}
