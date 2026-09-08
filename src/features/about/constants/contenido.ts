import { SITE } from "@/shared/constants/site";

/**
 * Contenido de "Sobre ExpoJuy 2026".
 *
 * PORTADO DEL PROTOTIPO DE MARU (`src/components/Sobre.astro`). Allá el texto
 * estaba escrito dentro del propio componente, contra la regla del repo de
 * origen, que pide que todo contenido viva en una colección. Acá se corrige:
 * el componente sólo arma la retícula y el texto vive en este archivo, así que
 * reemplazar una palabra no obliga a abrir un `.tsx`.
 *
 * LOS TRES PÁRRAFOS NO SON DE RELLENO. Nombran a los organizadores reales
 * -Ministerio de Desarrollo Económico y Producción a través de la Dirección
 * Provincial de Servicios Basados en el Conocimiento, la Cámara de Comercio
 * Exterior de Jujuy y el acompañamiento de ClusteAR-, que es exactamente lo
 * que declaran las bases del concurso.
 *
 * ATENCION: LAS CIFRAS SÍ SON PROVISORIAS. Vienen de `src/content/cifras.yaml`
 * del prototipo de origen, donde ya estaban marcadas como demostración. Hay
 * que reemplazarlas por las oficiales antes de publicar.
 */

export const PRESENTACION = {
  titulo: "Cuatro días donde la provincia muestra lo que produce",
  /** Va en cuerpo mayor: es la definición de qué es ExpoJuy. */
  entrada:
    "ExpoJuy es la feria productiva e industrial más importante del Norte Argentino. " +
    "Reúne en un mismo predio a las empresas que sostienen la economía jujeña con los " +
    "compradores, los organismos y las instituciones que pueden hacerla crecer.",
  parrafos: [
    "La edición 2026 se organiza alrededor de seis ejes productivos y suma, por primera vez, " +
      "un espacio propio para la economía del conocimiento. La premisa es simple: que cada " +
      "empresa de la provincia encuentre acá al menos una conversación que no podría haber " +
      "tenido en otro lado.",
    "Organizan el Ministerio de Desarrollo Económico y Producción de la Provincia de Jujuy, " +
      "a través de la Dirección Provincial de Servicios Basados en el Conocimiento, y la " +
      "Cámara de Comercio Exterior de Jujuy, con el acompañamiento de ClusteAR.",
  ],
} as const;

export type Valor = { id: string; titulo: string; texto: string };

/**
 * Los cuatro valores que ordenan la feria.
 *
 * Los títulos van en caja normal y no en versalitas, y eso está decidido en el
 * prototipo de origen con su razón escrita: cuatro rótulos en mayúsculas
 * seguidos leen como un formulario, no como una lista de ideas.
 */
export const VALORES: readonly Valor[] = [
  {
    id: "produccion",
    titulo: "Producción",
    texto: "Lo que Jujuy fabrica, extrae y cultiva, mostrado por quienes lo hacen.",
  },
  {
    id: "vinculacion",
    titulo: "Vinculación",
    texto: "Compradores, proveedores y organismos en el mismo predio y durante cuatro días.",
  },
  {
    id: "conocimiento",
    titulo: "Conocimiento",
    texto: "Tecnología y servicios profesionales aplicados a las cadenas productivas locales.",
  },
  {
    id: "desarrollo",
    titulo: "Desarrollo",
    texto: "Ruedas de negocios, capacitación y acceso a mercados para pymes de la provincia.",
  },
];

export type Cifra = { id: string; valor: string; etiqueta: string; detalle: string };

/**
 * Banda de datos duros. ATENCION: PROVISORIAS, ver arriba.
 *
 * La fecha NO se escribe acá: sale de `SITE.dates.label`, que es la única
 * fuente de verdad de los datos institucionales. Escrita a mano, esta línea
 * sería el segundo lugar del repositorio donde vive la fecha del evento, y el
 * que nadie se acordaría de actualizar.
 */
export const CIFRAS: readonly Cifra[] = [
  {
    id: "expositores",
    valor: "180",
    etiqueta: "Expositores",
    detalle: "Empresas, cámaras y organismos con stand propio en el predio.",
  },
  {
    id: "paises",
    valor: "12",
    etiqueta: "Países",
    detalle: "Delegaciones comerciales de la región y de mercados de destino.",
  },
  {
    id: "rondas",
    valor: "600",
    etiqueta: "Reuniones de negocios",
    detalle: "Encuentros uno a uno agendados en la rueda internacional.",
  },
  {
    id: "jornadas",
    valor: "4",
    etiqueta: "Jornadas",
    detalle: `Del ${SITE.dates.label}, con entrada libre los días de acceso público.`,
  },
];
