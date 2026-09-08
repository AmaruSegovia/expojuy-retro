import { RUBRO_ETIQUETA, type Expositor, type Rubro } from "../constants/expositores";

/**
 * Filtrado de expositores: funciones puras, sin React y sin DOM.
 *
 * Que no dependan de React no es un detalle de estilo: así el buscador se
 * puede probar con una llamada, y el día que la lista venga de una API o se
 * filtre en el servidor, esto se usa igual sin tocar nada.
 */

/**
 * Marcas diacríticas combinantes (U+0300 a U+036F): son las que quedan sueltas
 * después de descomponer con NFD, y borrarlas es lo que convierte "Minería" en
 * "mineria".
 */
const DIACRITICOS = /[\u0300-\u036f]/g;

/** Minúsculas y sin tildes. Base de toda comparación de texto de la sección. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(DIACRITICOS, "").toLowerCase().trim();
}

export type FiltrosExpositor = {
  /** Texto tal cual lo escribió la persona; se normaliza al filtrar. */
  texto: string;
  /** `null` es "todos los rubros", no "ningún rubro". */
  rubro: Rubro | null;
};

/**
 * Expositor con su texto de búsqueda ya normalizado.
 *
 * POR QUÉ SE PRECALCULA. La versión original armaba el texto y lo normalizaba
 * DENTRO del filtro, o sea una vez por expositor y por tecla. Con 16 filas es
 * imperceptible, pero el total declarado de la muestra son 300 y `normalize`
 * es lo más caro del recorrido. Precalculado, cada tecla cuesta solo un
 * `includes` por fila y el costo de normalizar se paga una vez en el módulo.
 */
export type ExpositorIndexado = Expositor & { readonly busqueda: string };

/**
 * Arma el índice de búsqueda. Se llama UNA vez, a nivel de módulo.
 *
 * El texto concatena nombre, ciudad y la ETIQUETA VISIBLE del rubro, no su
 * identificador: quien busca escribe "minería", no "mineria" ni el slug.
 */
export function indexarExpositores(lista: readonly Expositor[]): ExpositorIndexado[] {
  return lista.map((expositor) => ({
    ...expositor,
    busqueda: normalizar(
      `${expositor.nombre} ${expositor.ciudad} ${RUBRO_ETIQUETA[expositor.rubro]}`,
    ),
  }));
}

/**
 * Filtra por rubro y por texto.
 *
 * El rubro se evalúa PRIMERO porque es una comparación de igualdad y corta
 * temprano: lo caro (el `includes` sobre el texto) solo corre sobre lo que ya
 * pasó el filtro barato.
 *
 * La coincidencia es por subcadena simple, sin ranking ni tolerancia a errores
 * de tipeo. Es una limitación conocida y deliberada: "yala sol" no encuentra
 * "Sol de Yala Software". Con 300 filas alcanza; si algún día no alcanza, el
 * reemplazo entra acá y en ningún otro lado.
 */
export function filtrarExpositores(
  lista: readonly ExpositorIndexado[],
  filtros: FiltrosExpositor,
): ExpositorIndexado[] {
  const consulta = normalizar(filtros.texto);

  return lista.filter((expositor) => {
    if (filtros.rubro && expositor.rubro !== filtros.rubro) return false;
    if (!consulta) return true;
    return expositor.busqueda.includes(consulta);
  });
}

/**
 * Rubros presentes en la lista, en el orden en que aparecen.
 *
 * Los chips SE DERIVAN DE LOS DATOS y no de una lista escrita a mano: si
 * mañana no hay ningún expositor textil, el chip de textil no aparece y nadie
 * puede filtrar hasta un resultado vacío garantizado.
 */
export function rubrosDe(lista: readonly Expositor[]): Rubro[] {
  return [...new Set(lista.map((expositor) => expositor.rubro))];
}

/**
 * Iniciales para el monograma: "Sol de Yala Software" da "SY".
 *
 * Descarta las palabras cortas en minúscula -"de", "del", "las"- para que las
 * iniciales sean las de las palabras con peso, y conserva las cortas que van
 * en mayúscula, que suelen ser siglas.
 */
export function iniciales(nombre: string, cantidad = 2): string {
  return nombre
    .split(/\s+/)
    .filter((palabra) => palabra.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(palabra))
    .slice(0, cantidad)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");
}
