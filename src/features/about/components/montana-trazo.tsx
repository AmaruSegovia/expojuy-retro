import { MONTANA_TRANSFORMACION, MONTANA_TRAZOS, MONTANA_VIEWBOX } from "../constants/montana";

/**
 * EL CORDÓN QUE CIERRA "SOBRE EXPOJUY".
 *
 * Un dibujo de línea de la sierra apoyado en el ángulo inferior derecho de la
 * sección, que aparece barriéndose a medida que entra en pantalla. No ilustra
 * un dato: da cierre a la sección y ancla el sitio en el paisaje de Jujuy, que
 * es de lo que la feria habla. Por eso va `aria-hidden` y no lleva título: para
 * un lector de pantalla no existe, y no se pierde nada.
 *
 * APARECE SIN UNA SOLA LÍNEA DE JAVASCRIPT.
 *
 * El ejemplo de referencia resolvía esto con framer-motion: `useScroll` da el
 * progreso, `useTransform` lo mapea a `pathLength` y un `motion.path` reescribe
 * el guionado en cada cuadro. Acá el progreso sale de `animation-timeline`, que
 * es scroll progresivo nativo: lo calcula el compositor del navegador, no el
 * hilo principal, y no agrega una dependencia de unos 100 KB a un sitio cuyo
 * JavaScript entero pesa menos que eso.
 *
 * NO SE USA `pathLength`, Y SE INTENTÓ. Esa técnica dibuja un TRAZO, y este
 * archivo no tiene trazos: viene de un vectorizado automático, así que cada
 * línea de la sierra es una figura rellena muy fina. Al pintarlas como trazo
 * para poder guionarlas, lo que se dibujaba era el CONTORNO de cada figura y
 * cada línea salía doble, con el centro hueco. Se rellenan, que es como está
 * hecho el dibujo, y el progreso del scroll mueve un recorte en vez del
 * guionado. De paso sale más barato: una propiedad sobre un elemento en lugar
 * de dos sobre cuarenta y siete. Ver `styles.css` del feature.
 */
export function MontanaTrazo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${MONTANA_VIEWBOX.ancho} ${MONTANA_VIEWBOX.alto}`}
      // El dibujo se recorta contra el borde derecho de la sección en vez de
      // deformarse: es un paisaje, y achatarlo se nota.
      preserveAspectRatio="xMinYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={MONTANA_TRANSFORMACION}>
        {MONTANA_TRAZOS.map((d, i) => (
          // El índice como clave es correcto acá: la lista es una constante de
          // compilación, no se ordena, no se filtra y no cambia nunca. La
          // alternativa sería usar de clave el propio trazado, que son cientos
          // de caracteres.
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
