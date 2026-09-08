/**
 * Expositores de la muestra.
 *
 * ⚠️ PROVISORIO — los nombres, rubros, stands y días son inventados para poder
 * maquetar. La organización todavía no entregó el listado. Lo que NO es
 * provisorio son los EJES: son los cuatro valores que declaran las consignas
 * técnicas, los mismos que usan la Agenda y "Sobre ExpoJuy".
 */

/** Los cuatro ejes de la edición. NO son provisorios. */
export const EJES = [
  "Vinculación empresarial",
  "Producción y desarrollo",
  "Innovación y tecnología",
  "Economía del conocimiento",
] as const;

export type Eje = (typeof EJES)[number];

/**
 * Los cuatro días. Salen de `EVENTO.startISO`/`endISO` en site.ts, pero se
 * escriben acá porque el filtro necesita la etiqueta corta y el día ISO
 * juntos, y derivar un rango de fechas en tiempo de render sería trabajo
 * repetido en cada teclazo del buscador.
 */
export const DIAS = [
  { iso: "2026-09-24", corto: "Jue 24" },
  { iso: "2026-09-25", corto: "Vie 25" },
  { iso: "2026-09-26", corto: "Sáb 26" },
  { iso: "2026-09-27", corto: "Dom 27" },
] as const;

export type DiaISO = (typeof DIAS)[number]["iso"];

export type Expositor = {
  id: string;
  /** PROVISORIO */
  nombre: string;
  /** PROVISORIO — a qué se dedica, en pocas palabras. */
  rubro: string;
  eje: Eje;
  dia: DiaISO;
  /** PROVISORIO */
  stand: string;
  /** Índice de paleta de PlaceholderVisual, hasta que existan fotografías. */
  paleta: 0 | 1 | 2 | 3;
};

export const EXPOSITORES: Expositor[] = [
  // PROVISORIO — todo el bloque.
  {
    id: "litio-andino",
    nombre: "Litio Andino",
    rubro: "Extracción y valor agregado del litio puneño",
    eje: "Producción y desarrollo",
    dia: "2026-09-24",
    stand: "A-01",
    paleta: 0,
  },
  {
    id: "altiplano-software",
    nombre: "Altiplano Software",
    rubro: "Desarrollo a medida y sistemas de gestión",
    eje: "Economía del conocimiento",
    dia: "2026-09-24",
    stand: "C-14",
    paleta: 2,
  },
  {
    id: "tabacalera-del-valle",
    nombre: "Tabacalera del Valle",
    rubro: "Producción tabacalera y comercio exterior",
    eje: "Vinculación empresarial",
    dia: "2026-09-24",
    stand: "B-07",
    paleta: 1,
  },
  {
    id: "puna-solar",
    nombre: "Puna Solar",
    rubro: "Generación fotovoltaica de alta altitud",
    eje: "Innovación y tecnología",
    dia: "2026-09-24",
    stand: "D-03",
    paleta: 3,
  },
  {
    id: "quebrada-agro",
    nombre: "Quebrada Agro",
    rubro: "Agroindustria de altura y cultivos andinos",
    eje: "Producción y desarrollo",
    dia: "2026-09-25",
    stand: "A-09",
    paleta: 1,
  },
  {
    id: "nodo-jujuy",
    nombre: "Nodo Jujuy",
    rubro: "Robótica educativa y automatización industrial",
    eje: "Innovación y tecnología",
    dia: "2026-09-25",
    stand: "D-11",
    paleta: 2,
  },
  {
    id: "camara-binacional",
    nombre: "Cámara Binacional",
    rubro: "Rondas de negocios con Bolivia y Chile",
    eje: "Vinculación empresarial",
    dia: "2026-09-25",
    stand: "B-02",
    paleta: 0,
  },
  {
    id: "datos-del-norte",
    nombre: "Datos del Norte",
    rubro: "Analítica y modelos aplicados a la producción",
    eje: "Economía del conocimiento",
    dia: "2026-09-25",
    stand: "C-06",
    paleta: 3,
  },
  {
    id: "siderurgia-palpala",
    nombre: "Siderurgia Palpalá",
    rubro: "Metalmecánica y manufactura pesada",
    eje: "Producción y desarrollo",
    dia: "2026-09-26",
    stand: "A-15",
    paleta: 2,
  },
  {
    id: "textil-humahuaca",
    nombre: "Textil Humahuaca",
    rubro: "Fibras andinas y diseño con identidad",
    eje: "Vinculación empresarial",
    dia: "2026-09-26",
    stand: "B-12",
    paleta: 3,
  },
  {
    id: "cloud-yungas",
    nombre: "Cloud Yungas",
    rubro: "Infraestructura y servicios en la nube",
    eje: "Economía del conocimiento",
    dia: "2026-09-26",
    stand: "C-04",
    paleta: 1,
  },
  {
    id: "hidrogeno-verde-jujuy",
    nombre: "Hidrógeno Verde Jujuy",
    rubro: "Vectores energéticos y almacenamiento",
    eje: "Innovación y tecnología",
    dia: "2026-09-27",
    stand: "D-08",
    paleta: 0,
  },
];
