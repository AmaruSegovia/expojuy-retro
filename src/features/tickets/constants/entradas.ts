/**
 * Tipos de entrada y medios de pago.
 *
 * ATENCION: PROVISORIO - TODO, y los precios son el dato más delicado de este
 * archivo. La organización no confirmó ninguno, y varias respuestas de
 * Preguntas frecuentes ya dependen de ellos: si acá cambian, allá hay que
 * revisar.
 *
 * Por eso la sección MUESTRA que son de referencia en vez de solo declararlo
 * en un comentario. Un precio inventado sin aviso es lo único de la maqueta
 * que alguien podría anotar y presupuestar.
 *
 * PRESUPUESTO DE TEXTO. El panel vive en la mitad izquierda de un contenedor
 * de 1024px, o sea ~460px en escritorio, y a viewport completo en un teléfono
 * de 390px quedan 350. Ahí entran ~44 caracteres por renglón: cada línea de
 * `incluye` se escribió para entrar en una sola.
 */

export type TipoEntrada = {
  id: string;
  /** Texto de la píldora. Corto: las tres tienen que entrar en una fila. */
  nombre: string;
  /** PROVISORIO - sin confirmar por la organización. */
  precio: string;
  /** Para quién es, en una línea. PROVISORIO. */
  para: string;
  /** Tres líneas, una por renglón. PROVISORIO. */
  incluye: string[];
};

/** Ordenadas por precio creciente: la lectura de izquierda a derecha coincide
 *  con la escala, así que la píldora más barata es la primera.
 *
 *  SON TRES. Con tres, las píldoras entran en UNA sola fila hasta en un
 *  teléfono de 390px -339px de píldoras y huecos contra 350 de contenido-, así
 *  que la fila se lee como un selector y no como una grilla de opciones. */
export const TIPOS_ENTRADA: TipoEntrada[] = [
  {
    id: "estudiantes",
    nombre: "Estudiantes",
    precio: "$ 4.000",
    para: "Una jornada, con credencial vigente",
    incluye: [
      "Todo lo de la entrada general",
      "Acreditación en el acceso",
      "Competencia de robótica escolar",
    ],
  },
  {
    id: "general",
    nombre: "General",
    precio: "$ 8.000",
    para: "Una jornada, para recorrer la muestra",
    incluye: ["Acceso a la muestra por un día", "Charlas y paneles abiertos", "Zona gastronómica"],
  },
  {
    id: "empresas",
    nombre: "Empresas",
    precio: "$ 45.000",
    para: "Para participar de las rondas de negocios",
    incluye: [
      "Acceso a los cuatro días",
      "Rondas de negocios y vinculación",
      "Credencial para dos personas",
    ],
  },
];

/**
 * Medios de pago del riel.
 *
 * ATENCION: PROVISORIO, y con un matiz que conviene no perder: nombrar una marca acá
 * AFIRMA que ExpoJuy la acepta, y eso no está confirmado por nadie. Es el
 * mismo problema que los auspiciantes, un escalón más abajo.
 *
 * Van como texto porque no hay logotipos: el kit solo trae los de ExpoJuy. En
 * la versión real esto es una fila de imágenes, y el nombre queda como su
 * texto alternativo.
 */
export const MEDIOS_PAGO: string[] = [
  "Visa",
  "Mastercard",
  "American Express",
  "Cabal",
  "Naranja X",
  "Mercado Pago",
  "MODO",
  "Ualá",
  "Cuenta DNI",
  "Transferencia",
  "Efectivo",
];

/**
 * Métodos que muestra el formulario de pago ilustrativo.
 *
 * Genéricos A PROPÓSITO, a diferencia de MEDIOS_PAGO: son categorías, no
 * marcas. El modal está diciendo "acá iría esto", y nombrar marcas ahí las
 * afirmaría dos veces en la misma sección.
 */
export const METODOS_EJEMPLO: string[] = [
  "Transferencia bancaria",
  "Tarjeta de crédito o débito",
  "Billetera virtual",
];
