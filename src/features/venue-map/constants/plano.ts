/**
 * Geometría del plano de la Ciudad Cultural.
 *
 * DE DÓNDE SALE
 *
 * Trazado ESQUEMÁTICO derivado de datos de OpenStreetMap (ODbL), no un calco
 * de fotografía satelital. La diferencia importa por dos motivos:
 *
 * 1. Licencia. La geometría de un lugar es un hecho y no es de nadie, pero la
 *    imagen satelital tiene dueño y sus términos prohíben las obras derivadas.
 *    Por eso la referencia fue OSM y nunca una foto satelital.
 *
 *    La atribución ODbL NO va renderizada en la sección, y el motivo es que a
 *    esta altura el plano ya no contiene datos de OSM: se enderezó sobre su
 *    propio eje, se ensanchó y se redibujó como esquema, así que ninguna
 *    coordenada de acá sale de su base. OSM fue la referencia para decidir QUÉ
 *    hay y en qué orden, no la fuente de la geometría. Queda anotado igual acá
 *    y corresponde mencionarlo en la memoria descriptiva.
 *
 *    ATENCION: Si alguna vez esto se reemplaza por un trazado fiel -exportando
 *    geometría real de OSM- la atribución vuelve a ser obligatoria y hay que
 *    reponerla en la interfaz.
 * 2. Legibilidad. A 400px de ancho un trazado fiel se lee peor que uno
 *    simplificado. Las proporciones y la DISPOSICIÓN son las reales; el
 *    detalle y las medidas exactas, no.
 *
 * EL ENCUADRE ES VERTICAL
 *
 * El predio es una franja muy alargada. Encuadrado en un cuadrado quedaban dos
 * esquinas enormes vacías y el plano ocupaba la mitad de su caja. En vertical,
 * la franja llena el alto y el dibujo crece: pasa a ser el elemento que manda
 * en la sección, que es lo que un plano tiene que hacer.
 *
 * QUÉ ESTÁ DONDE, Y POR QUÉ AHÍ
 *
 * Cada pieza está anclada a algo que existe en la traza, no puesta a ojo:
 *
 * - La rotonda de la calle interna es el acceso. Es el único punto A posible:
 *   es donde la circulación del predio empieza de verdad.
 * - Los pabellones techados van al NOROESTE, contra Av. de los Estudiantes:
 *   ahí están las naves largas que se ven en la traza.
 * - Los stands van en HILERAS PARALELAS en la franja central, que es como se
 *   arma una feria y también como aparecen en OSM: filas de módulos chicos uno
 *   al lado del otro, alineados con la calle interna y no con el norte.
 * - El polideportivo y el parquesito quedan al sureste del acceso, y el
 *   estacionamiento al noroeste, sobre Estudiantes.
 *
 * EL SISTEMA DE COORDENADAS
 *
 * Nada se ubica con coordenadas sueltas: todo pasa por `sobreEje(avance,
 * desvio)`, que mide a lo largo de la calle interna y perpendicular a ella. Así
 * "el pabellón está 60 más adelante y 30 a la derecha" se escribe tal cual, las
 * separaciones se pueden verificar con una resta, y mover una pieza no obliga a
 * recalcular las vecinas.
 */

/** Encuadre vertical. La franja del predio ocupa casi toda la caja. */
export const VIEW_BOX = { x: 0, y: 0, ancho: 340, alto: 720 } as const;

/** Origen del eje: la rotonda de acceso. */
const ORIGEN: [number, number] = [170, 437];

/**
 * EL PLANO VA DERECHO, NO INCLINADO.
 *
 * En la traza real el predio corre en diagonal, pero un plano de orientación
 * -el que se mira para saber a dónde ir- no se dibuja al norte: se endereza
 * sobre su propio eje de circulación. Inclinado, la caja quedaba medio vacía,
 * los rótulos costaban de leer y el dibujo se veía chico. Derecho, la franja
 * usa todo el ancho disponible y el recorrido se lee de un vistazo.
 *
 * Con el eje vertical, `sobreEje(avance, desvio)` se vuelve trivial -el avance
 * es el alto y el desvío es el ancho- y los edificios quedan alineados con la
 * caja, sin bordes dentados por la rotación.
 */
export const ANGULO_EJE = -90;

/** Dirección del eje mayor: hacia arriba. */
const EJE = { x: 0, y: -1 } as const;
/** Perpendicular al eje: hacia la derecha. */
const PERP = { x: 1, y: 0 } as const;

/**
 * Ubica un punto por avance sobre la calle interna y desvío perpendicular.
 * `avance` positivo va al noreste; `desvio` positivo va al sureste.
 */
export function sobreEje(avance: number, desvio: number): [number, number] {
  return [
    Math.round(ORIGEN[0] + avance * EJE.x + desvio * PERP.x),
    Math.round(ORIGEN[1] + avance * EJE.y + desvio * PERP.y),
  ];
}

/** Contorno de la parcela, generado sobre el mismo eje que todo lo demás. */
export const PARCELA: [number, number][] = [
  sobreEje(-260, -140),
  sobreEje(400, -140),
  sobreEje(400, 140),
  sobreEje(-260, 140),
];

/** Calles del perímetro. Los nombres son datos de OSM, no contenido provisorio. */
export const CALLES = [
  { id: "estudiantes", nombre: "Av. de los Estudiantes Jujeños", a: PARCELA[0], b: PARCELA[1] },
  { id: "san-martin", nombre: "Corrilla de San Martín", a: PARCELA[1], b: PARCELA[2] },
  { id: "carrozas", nombre: "Av. de las Carrozas", a: PARCELA[2], b: PARCELA[3] },
  { id: "pila-sola", nombre: 'Santiago "Pila" Solá', a: PARCELA[3], b: PARCELA[0] },
];

/**
 * La rotonda de acceso, al extremo sur del predio.
 *
 * El punto A sale de su CENTRO: es una rotonda de verdad, así que el recorrido
 * tiene que nacer del medio del anillo y no de un costado. Está bien abajo
 * porque ahí está el ingreso: se entra al predio y recién después se sube.
 */
export const ROTONDA = { centro: sobreEje(-205, 0), r: 26 };

/**
 * RED DE CALLES.
 *
 * Se dibujan como bandas anchas APENAS VISIBLES, no como líneas de color. Una
 * línea marcada compite con el recorrido -que es lo único que el usuario tiene
 * que seguir- y ensucia el dibujo. Una banda al 7% no se mira, pero se ve: da
 * la noción de dónde está uno sin pedir atención.
 *
 * Son trazos y no polígonos porque una calle es un recorrido con un ancho, y
 * así el ancho se cambia en un solo lugar.
 */
export const CALLES_TRAZADO: [number, number][][] = [
  // Avenida interna: del acceso al fondo del predio.
  [sobreEje(-205, 0), sobreEje(375, 0)],
  // Transversal del acceso, a la altura del polideportivo.
  [sobreEje(-60, -140), sobreEje(-60, 140)],
  // Transversales de la feria, entre hileras de stands.
  [sobreEje(150, -140), sobreEje(150, 140)],
  [sobreEje(265, -140), sobreEje(265, 140)],
];

/**
 * Masas verdes. Se declaran como rectángulos en coordenadas de eje, así que
 * salen como paralelogramos alineados con la traza y no como manchas sueltas.
 */
export const VERDES: [number, number][][] = [
  // Parque del noreste, sobre Corrilla de San Martín.
  [sobreEje(340, -128), sobreEje(395, -128), sobreEje(395, 128), sobreEje(340, 128)],
  // Campo abierto del sur. Va en DOS paños a los lados y no en uno solo: el
  // corredor central queda libre para la rotonda y para el arranque del
  // recorrido, que si no nacerían encima de una mancha verde.
  [sobreEje(-250, -128), sobreEje(-90, -128), sobreEje(-90, -44), sobreEje(-250, -44)],
  [sobreEje(-250, 44), sobreEje(-90, 44), sobreEje(-90, 128), sobreEje(-250, 128)],
  // Parquesito, pegado al polideportivo.
  [sobreEje(-60, 84), sobreEje(45, 84), sobreEje(45, 132), sobreEje(-60, 132)],
];

type Edificio = {
  id: string;
  centro: [number, number];
  ancho: number;
  alto: number;
  /** Los stands se dibujan más tenues: son módulos, no arquitectura. */
  tipo: "nave" | "stand" | "servicio";
};

/**
 * HILERAS DE STANDS
 *
 * Cuatro filas de seis módulos alineadas con la calle interna. No es
 * decoración: en la traza de OSM la franja central son exactamente eso, filas
 * de módulos chicos uno al lado del otro, que es como se arma una feria.
 * Generadas y no escritas a mano para que agregar o sacar una fila sea cambiar
 * un número, y para que las separaciones sean verificables con una resta.
 */
const STANDS: Edificio[] = Array.from({ length: 4 }, (_, fila) =>
  Array.from({ length: 6 }, (_, col): Edificio => ({
    id: `stand-${fila}-${col}`,
    centro: sobreEje(95 + col * 23, 16 + fila * 22),
    ancho: 17,
    alto: 16,
    tipo: "stand",
    // El corte entre sectores es por COLUMNA y no por fila: los dos lugares
    // señalizados están en `sobreEje(110, ·)` y `sobreEje(200, ·)`, o sea a la
    // altura de las tres primeras columnas y de las tres últimas.
    punto: col <= 2 ? "stands-a" : "stands-b",
  })),
).flat();

/**
 * PATIO GASTRONÓMICO
 *
 * Cuatro módulos chicos donde el punto `gastronomia` ya decía que hay un patio.
 * Se agregan porque en la maqueta un lugar señalizado sin nada construido
 * debajo queda como un marcador flotando sobre el pasto. Van de a pares a los
 * costados del punto (`sobreEje(150, 116)`): el hueco del medio es la plaza, y
 * de paso deja libre la transversal de la feria, que ocupa 142 a 158 de avance.
 */
const MODULOS_GASTRONOMIA: Edificio[] = [112, 132, 168, 188].map((avance, i) => ({
  id: `modulo-${i}`,
  centro: sobreEje(avance, 114),
  ancho: 16,
  alto: 22,
  tipo: "modulo",
  punto: "gastronomia",
}));

/**
 * Las posiciones y medidas están elegidas para que NINGÚN edificio se solape
 * con otro. Se verifica con una comparación de cajas en coordenadas de eje: al
 * estar todos alineados con la traza, dos rectángulos se tocan solo si se
 * pisan sus dos intervalos, el de avance y el de desvío.
 */
export const EDIFICIOS: Edificio[] = [
  { id: "nave-1", centro: sobreEje(170, -92), ancho: 140, alto: 48, tipo: "nave" },
  { id: "nave-2", centro: sobreEje(300, -92), ancho: 110, alto: 44, tipo: "nave" },
  { id: "cocheras", centro: sobreEje(35, -76), ancho: 92, alto: 56, tipo: "servicio" },
  ...STANDS,
];

/** El polideportivo es una elipse: en la traza real es una pista ovalada. */
export const ARENA = { centro: sobreEje(20, 68), rx: 52, ry: 32 };

export type Punto = {
  id: string;
  nombre: string;
  /** PROVISORIO - qué pasa en ese lugar. Dos renglones como máximo. */
  detalle: string;
  categoria: "acceso" | "expositores" | "gastronomia" | "servicios" | "escenario";
  posicion: [number, number];
  /** Paleta del visual provisorio, hasta que existan fotografías. */
  paleta: 0 | 1 | 2 | 3;
};

/**
 * Los lugares señalizados.
 *
 * ATENCION: Los nombres y las descripciones son PROVISORIOS.
 *
 * Y están escritos CORTOS a propósito, con presupuesto: hasta ~22 caracteres
 * el nombre y ~50 la descripción. La tarjeta muestra el título en una línea y
 * la descripción en dos, y el recorte del CSS es una RED DE SEGURIDAD, no el
 * mecanismo: si hiciera falta recortar, el texto ya estaría mal escrito. Por
 * eso además recorta sin puntos suspensivos -ver `recorte-*` en globals.css-,
 * porque un "…" es un cartel de que falta texto y acá no falta nada.
 *
 * La DISPOSICIÓN no es provisoria: sale de la traza de OSM. La antigua Escuela
 * Provincial de Teatro "Tito Guerra" no se dibuja porque ya no existe.
 */
export const PUNTOS: Punto[] = [
  {
    id: "acceso",
    nombre: "Acceso principal",
    detalle: "Ingreso por la rotonda, con acreditación.",
    categoria: "acceso",
    posicion: sobreEje(-205, 0),
    paleta: 0,
  },
  {
    id: "cocheras",
    nombre: "Estacionamiento",
    detalle: "Cocheras sobre Av. de los Estudiantes.",
    categoria: "servicios",
    posicion: sobreEje(35, -76),
    paleta: 1,
  },
  {
    id: "arena",
    nombre: "Polideportivo de Arena",
    detalle: "Rondas de negocios y vinculación empresarial.",
    categoria: "escenario",
    posicion: sobreEje(20, 68),
    paleta: 2,
  },
  {
    id: "parquesito",
    nombre: "Parquesito",
    detalle: "Zona de descanso sobre Av. de las Carrozas.",
    categoria: "servicios",
    posicion: sobreEje(-10, 120),
    paleta: 3,
  },
  {
    id: "stands-a",
    nombre: "Stands · sector A",
    detalle: "Producción y desarrollo, agroindustria y minería.",
    categoria: "expositores",
    posicion: sobreEje(110, 32),
    paleta: 1,
  },
  {
    id: "stands-b",
    nombre: "Stands · sector B",
    detalle: "Innovación, tecnología y economía del conocimiento.",
    categoria: "expositores",
    posicion: sobreEje(200, 48),
    paleta: 2,
  },
  {
    id: "gastronomia",
    nombre: "Patio gastronómico",
    detalle: "Food trucks y mesas al aire libre.",
    categoria: "gastronomia",
    posicion: sobreEje(150, 116),
    paleta: 3,
  },
  {
    id: "nave-1",
    nombre: "Pabellón techado",
    detalle: "Nave principal. Apertura y cierre.",
    categoria: "escenario",
    posicion: sobreEje(170, -92),
    paleta: 0,
  },
  {
    id: "nave-2",
    nombre: "Pabellón de robótica",
    detalle: "Demostraciones, competencias y talleres.",
    categoria: "expositores",
    posicion: sobreEje(300, -92),
    paleta: 2,
  },
];

/**
 * GRAFO DE CIRCULACIÓN
 *
 * El camino de A a B NO es una recta: sería un trazo que atraviesa naves y
 * canteros, y leería como un error de dibujo. Se recorre la calle interna y se
 * sale por un ramal, que es como se camina el predio.
 *
 * Los nodos `via-*` son puntos de la calle interna y `cruce` es el pasillo
 * transversal de la feria, que evita que el camino al patio gastronómico
 * atraviese las hileras de stands en diagonal.
 */
export const NODOS: Record<string, [number, number]> = {
  ...Object.fromEntries(PUNTOS.map((p) => [p.id, p.posicion])),
  "via-1": sobreEje(60, 0),
  "via-2": sobreEje(125, 0),
  "via-3": sobreEje(195, 0),
  "via-4": sobreEje(265, 0),
  "via-5": sobreEje(330, 0),
  cruce: sobreEje(150, 64),
};

export const ARISTAS: [string, string][] = [
  ["acceso", "via-1"],
  ["via-1", "via-2"],
  ["via-2", "via-3"],
  ["via-3", "via-4"],
  ["via-4", "via-5"],
  ["acceso", "cocheras"],
  ["via-1", "arena"],
  ["arena", "parquesito"],
  ["via-2", "stands-a"],
  ["via-2", "cruce"],
  ["cruce", "gastronomia"],
  ["via-3", "stands-b"],
  ["via-3", "nave-1"],
  ["via-5", "nave-2"],
];

function distancia(a: string, b: string) {
  const [ax, ay] = NODOS[a];
  const [bx, by] = NODOS[b];
  return Math.hypot(ax - bx, ay - by);
}

const VECINOS: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const [a, b] of ARISTAS) {
    (m[a] ??= []).push(b);
    (m[b] ??= []).push(a);
  }
  return m;
})();

/**
 * Camino más corto entre dos lugares, en coordenadas del plano.
 *
 * Dijkstra sobre una docena de nodos: de sobra para este tamaño y, a
 * diferencia de una búsqueda en anchura, respeta que los ramales miden
 * distinto. Se calcula una vez por selección, nunca por frame.
 */
export function calcularRuta(desde: string, hasta: string): [number, number][] {
  if (desde === hasta) return [NODOS[desde]];

  const pendientes = new Set(Object.keys(NODOS));
  const costo: Record<string, number> = {};
  const previo: Record<string, string | undefined> = {};
  for (const id of pendientes) costo[id] = Infinity;
  costo[desde] = 0;

  while (pendientes.size) {
    let actual: string | undefined;
    for (const id of pendientes) {
      if (actual === undefined || costo[id] < costo[actual]) actual = id;
    }
    if (actual === undefined || costo[actual] === Infinity) break;
    if (actual === hasta) break;
    pendientes.delete(actual);

    for (const vecino of VECINOS[actual] ?? []) {
      if (!pendientes.has(vecino)) continue;
      const alternativa = costo[actual] + distancia(actual, vecino);
      if (alternativa < costo[vecino]) {
        costo[vecino] = alternativa;
        previo[vecino] = actual;
      }
    }
  }

  const camino: [number, number][] = [];
  for (let id: string | undefined = hasta; id; id = previo[id]) camino.unshift(NODOS[id]);
  return camino;
}

/** Convierte un camino en el atributo `d` de un path. */
export function rutaAPath(camino: [number, number][]) {
  return camino.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}
