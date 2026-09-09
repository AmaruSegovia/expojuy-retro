import { ESCALA_RETICULA, RETICULA } from "../constants/plano";

/**
 * Proyección isométrica del predio, en funciones puras.
 *
 * Es exactamente la misma que hacía el CSS con `rotateX(58deg) rotateZ(-45deg)`
 * y sin `perspective`: una proyección ORTOGRÁFICA. Se escribe acá para poder
 * dibujar la maqueta en un lienzo en vez de en 783 nodos del documento, que es
 * lo que la hacía inusable en celular. Ver `use-maqueta-canvas.ts` para la
 * medición que motivó el cambio.
 *
 * No hay React ni DOM en este archivo: entra geometría y salen coordenadas.
 */

/** Estado de cámara: los dos ángulos y la escala del dibujo. */
export type Camara = {
  /** Giro alrededor del eje vertical, en grados. */
  giroZ: number;
  /** Inclinación, en grados. 90 sería mirar desde arriba a plomo. */
  giroX: number;
  /** Píxeles por unidad de retícula. */
  u: number;
  /** Centro del dibujo en píxeles, dentro del lienzo. */
  cx: number;
  cy: number;
};

/** Un punto proyectado: dos coordenadas de pantalla y su profundidad. */
export type Proyectado = { x: number; y: number; z: number };

const RAD = Math.PI / 180;

/**
 * Lleva un punto del predio a la pantalla.
 *
 * `x` e `y` van en unidades de retícula y `alto` es la altura sobre el suelo, en
 * las mismas unidades. El orden de las rotaciones es el del CSS que reemplaza:
 * primero la de eje vertical, después la inclinación.
 *
 * La tercera coordenada que devuelve NO se dibuja: es la profundidad, y sirve
 * para ordenar los volúmenes de atrás hacia adelante.
 */
export function proyectar(camara: Camara, x: number, y: number, alto = 0): Proyectado {
  const rz = camara.giroZ * RAD;
  const rx = camara.giroX * RAD;
  // Se gira alrededor del centro de la retícula, no de su esquina, para que la
  // maqueta no se vaya de cuadro al girar.
  const dx = x - RETICULA.columnas / 2;
  const dy = y - RETICULA.filas / 2;
  const gx = dx * Math.cos(rz) - dy * Math.sin(rz);
  const gy = dx * Math.sin(rz) + dy * Math.cos(rz);
  return {
    x: camara.cx + gx * camara.u,
    y: camara.cy + gy * camara.u * Math.cos(rx) - alto * camara.u * Math.sin(rx),
    z: gy,
  };
}

/** Convierte una coordenada del viewBox del plano a unidades de retícula. */
export function aReticula([x, y]: readonly [number, number]): [number, number] {
  return [x / ESCALA_RETICULA, y / ESCALA_RETICULA];
}

/**
 * Ordena de atrás hacia adelante para el algoritmo del pintor.
 *
 * MEJORA RESPECTO DE LA VERSIÓN ANTERIOR: el orden en CSS estaba precalculado
 * por `x + y` creciente, que es correcto solo cerca del ángulo de reposo. Al
 * girar la maqueta ese orden dejaba de valer y algún bloque podía taparse mal.
 * Acá la profundidad se calcula con el ángulo actual, así que el dibujo es
 * correcto en cualquier posición.
 */
export function ordenarPorProfundidad<T>(
  items: readonly T[],
  camara: Camara,
  centro: (item: T) => readonly [number, number],
): T[] {
  return items
    .map((item) => {
      const [x, y] = centro(item);
      return { item, z: proyectar(camara, x, y).z };
    })
    .sort((a, b) => a.z - b.z)
    .map((p) => p.item);
}

/**
 * Cuánto ocupa la retícula proyectada, en unidades, en el PEOR caso del giro.
 *
 * No alcanza con medirla en la posición de reposo: al girar, la diagonal de la
 * retícula se acuesta y la maqueta ocupa más ancho, y al enderezarla ocupa más
 * alto. Se recorren los extremos permitidos y se toma el máximo de cada eje, así
 * el lienzo se dimensiona una sola vez y la maqueta nunca se sale ni queda
 * flotando en un lienzo demasiado grande.
 *
 * De acá salen las dos cosas: la proporción del lienzo y la escala del dibujo.
 */
export function extensionProyectada(
  giroXMin: number,
  giroXMax: number,
): { anchoU: number; altoU: number } {
  let anchoU = 0;
  let altoU = 0;
  // Se recorre la vuelta entera y no unos pocos ángulos: el giro en Z no tiene
  // tope, así que la maqueta puede quedar en cualquier posición y el lienzo se
  // dimensiona una sola vez para la peor de todas. El paso de un grado alcanza
  // porque la función es suave; el máximo real cae en la diagonal.
  for (let z = 0; z < 360; z += 1) {
    const c = Math.abs(Math.cos(z * RAD));
    const s = Math.abs(Math.sin(z * RAD));
    const ancho = RETICULA.columnas * c + RETICULA.filas * s;
    if (ancho > anchoU) anchoU = ancho;
    for (const x of [giroXMin, giroXMax]) {
      const alto = (RETICULA.columnas * s + RETICULA.filas * c) * Math.cos(x * RAD);
      if (alto > altoU) altoU = alto;
    }
  }
  return { anchoU, altoU };
}

/**
 * Si un punto de pantalla cae dentro de un polígono ya proyectado.
 *
 * Es el test del rayo: se tira una semirrecta horizontal desde el punto y se
 * cuentan los cruces con los lados. Impar, adentro; par, afuera. Sirve para
 * cualquier polígono, cóncavo incluido, y no le importa el sentido en que estén
 * ordenadas las esquinas, que es justo lo que hace falta acá: las caras de un
 * bloque cambian de sentido según desde dónde se mire.
 *
 * Va en este archivo y no en el hook porque es geometría pura: entra un punto,
 * sale un booleano, y no toca ni React ni el documento.
 */
export function dentroDelPoligono(pts: readonly Proyectado[], x: number, y: number): boolean {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (!a || !b) continue;
    // El lado cruza la altura del punto, y el cruce cae a su derecha.
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      dentro = !dentro;
    }
  }
  return dentro;
}
