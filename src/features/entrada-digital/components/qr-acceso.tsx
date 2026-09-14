import { QR_DEMO } from "../constants/qr-demo";

/**
 * Zona de silencio en módulos. La norma del QR pide cuatro, pero con cuatro
 * más el relleno de la tarjeta el marco blanco medía ~40px por lado y se comía
 * la vista. Con dos queda en ~20px, y se verificó que una captura de la
 * pantalla se sigue decodificando a la URL. Los módulos, además, salen más
 * grandes, que es lo que más ayuda a una cámara.
 */
const SILENCIO = 2;

/**
 * Un trazado por fila con los módulos oscuros contiguos fusionados en un solo
 * rectángulo. Mismo dibujo que un rectángulo por módulo, con muchos menos
 * nodos, y sin costuras entre módulos vecinos al escalar.
 */
function trazado(modulos: readonly string[]): string {
  let d = "";
  modulos.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      if (fila[x] !== "1") {
        x++;
        continue;
      }
      const inicio = x;
      while (x < fila.length && fila[x] === "1") x++;
      d += `M${inicio} ${y}h${x - inicio}v1h${inicio - x}z`;
    }
  });
  return d;
}

const D = trazado(QR_DEMO.modulos);
const LADO = QR_DEMO.modulos.length + SILENCIO * 2;

/**
 * El QR de acceso, dibujado como SVG desde la matriz de módulos.
 *
 * `crispEdges` apaga el suavizado: un borde de módulo borroneado es justo lo
 * que le cuesta leer a una cámara. Los colores salen de los tokens de la
 * superficie donde se apoya, que tiene que ser CLARA: un lector espera
 * módulos oscuros sobre fondo claro, y un QR invertido falla en muchas
 * cámaras.
 */
export function QrAcceso({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`${-SILENCIO} ${-SILENCIO} ${LADO} ${LADO}`}
      role="img"
      aria-label="Código QR de acceso"
      shapeRendering="crispEdges"
      className={className}
    >
      {/* `surface-sunken` y no `surface`: sobre papel es el tono más claro de
          la familia, el de más contraste con los módulos, y el mismo que pinta
          `.en-papel` de fondo, así que la zona de silencio no se lee como un
          segundo marco. */}
      <rect
        x={-SILENCIO}
        y={-SILENCIO}
        width={LADO}
        height={LADO}
        className="fill-surface-sunken"
      />
      <path d={D} className="fill-text" />
    </svg>
  );
}
