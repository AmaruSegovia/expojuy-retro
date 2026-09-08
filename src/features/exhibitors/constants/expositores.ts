/**
 * Expositores de la muestra y sus rubros.
 *
 * ATENCION: PROVISORIO - nombres, ciudades, rubros y stands son inventados
 * para poder maquetar el buscador. La organización todavía no entregó el
 * listado, así que este archivo se reemplaza entero antes de publicar. Lo que
 * sí es definitivo es la FORMA del dato: es lo que consume el filtro.
 *
 * El rubro se guarda como identificador estable y su etiqueta visible vive en
 * un mapa aparte. El identificador es lo que puede viajar en una URL o venir
 * del sistema de la organización; el texto tiene que poder cambiar, corregirse
 * o traducirse sin tocar una línea de lógica.
 */

/**
 * Etiqueta visible de cada rubro. Es lo que se muestra en el chip, en la ficha
 * y -esto importa- lo que se busca: quien escribe "bebidas" espera encontrar a
 * la bodega, y "bebidas" solo existe acá, no en el identificador.
 */
export const RUBRO_ETIQUETA = {
  mineria: "Minería",
  energia: "Energía",
  agroindustria: "Agroindustria",
  tecnologia: "Tecnología",
  turismo: "Turismo",
  alimentos: "Alimentos y bebidas",
  textil: "Textil y diseño",
  servicios: "Servicios",
  educacion: "Educación",
  construccion: "Construcción",
} as const;

export type Rubro = keyof typeof RUBRO_ETIQUETA;

/**
 * Relleno del monograma, por rubro.
 *
 * Es un ÍNDICE y no un color: los cuatro rellenos válidos del sistema viven en
 * el componente que los dibuja, así que un rubro nuevo no puede introducir un
 * color inventado. Los cuatro pares fondo/texto están medidos ahí.
 *
 * El color nunca es el único indicador del rubro (WCAG 1.4.1): el nombre del
 * rubro va escrito al lado del monograma, en texto.
 */
export const RUBRO_TONO: Record<Rubro, 0 | 1 | 2 | 3> = {
  mineria: 0,
  energia: 0,
  construccion: 0,
  tecnologia: 1,
  servicios: 1,
  educacion: 1,
  agroindustria: 2,
  alimentos: 2,
  turismo: 3,
  textil: 3,
};

export type Expositor = {
  /** Slug estable: key de React y futura ancla de la ficha. */
  id: string;
  /** PROVISORIO */
  nombre: string;
  rubro: Rubro;
  /** PROVISORIO - ubicación en el predio. */
  stand: string;
  /** PROVISORIO - se busca por ciudad, así que es dato y no adorno. */
  ciudad: string;
};

export const EXPOSITORES: readonly Expositor[] = [
  // PROVISORIO - todo el bloque.
  { id: "puna-litio", nombre: "Puna Litio", rubro: "mineria", stand: "B-12", ciudad: "Susques" },
  {
    id: "sol-de-yala",
    nombre: "Sol de Yala Software",
    rubro: "tecnologia",
    stand: "T-03",
    ciudad: "San Salvador de Jujuy",
  },
  {
    id: "tejidos-humahuaca",
    nombre: "Tejidos Humahuaca",
    rubro: "textil",
    stand: "D-21",
    ciudad: "Humahuaca",
  },
  {
    id: "bodega-cerro-alto",
    nombre: "Bodega Cerro Alto",
    rubro: "alimentos",
    stand: "A-07",
    ciudad: "Maimará",
  },
  {
    id: "quinua-altiplano",
    nombre: "Quinua del Altiplano",
    rubro: "agroindustria",
    stand: "A-15",
    ciudad: "Abra Pampa",
  },
  { id: "puna-solar", nombre: "Puna Solar", rubro: "energia", stand: "B-04", ciudad: "Cauchari" },
  {
    id: "turismo-quebrada",
    nombre: "Turismo Quebrada",
    rubro: "turismo",
    stand: "C-09",
    ciudad: "Tilcara",
  },
  {
    id: "ceramica-tilcara",
    nombre: "Cerámica Tilcara",
    rubro: "textil",
    stand: "D-18",
    ciudad: "Tilcara",
  },
  {
    id: "frutas-de-yuto",
    nombre: "Frutas de Yuto",
    rubro: "agroindustria",
    stand: "A-22",
    ciudad: "Yuto",
  },
  {
    id: "constructora-perico",
    nombre: "Constructora Perico",
    rubro: "construccion",
    stand: "B-30",
    ciudad: "Perico",
  },
  {
    id: "instituto-tecnorte",
    nombre: "Instituto TecNorte",
    rubro: "educacion",
    stand: "T-11",
    ciudad: "San Pedro",
  },
  {
    id: "cafes-yungas",
    nombre: "Cafés de las Yungas",
    rubro: "alimentos",
    stand: "A-31",
    ciudad: "Calilegua",
  },
  {
    id: "andes-logistica",
    nombre: "Andes Logística",
    rubro: "servicios",
    stand: "C-02",
    ciudad: "Palpalá",
  },
  {
    id: "dulces-del-valle",
    nombre: "Dulces del Valle",
    rubro: "alimentos",
    stand: "A-19",
    ciudad: "El Carmen",
  },
  {
    id: "nube-norte",
    nombre: "Nube Norte",
    rubro: "tecnologia",
    stand: "T-08",
    ciudad: "San Salvador de Jujuy",
  },
  {
    id: "tabaco-perico",
    nombre: "Cooperativa Tabacalera",
    rubro: "agroindustria",
    stand: "A-02",
    ciudad: "Perico",
  },
];

/**
 * PROVISORIO - total estimado de expositores de la edición. La lista de arriba
 * es una MUESTRA, así que el número no se deriva de ella: se declara, y la
 * sección avisa en pantalla que lo que se ve es una selección.
 */
export const EXPOSITORES_TOTAL = 300;
