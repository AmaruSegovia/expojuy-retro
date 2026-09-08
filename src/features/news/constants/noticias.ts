/**
 * Noticias del programa.
 *
 * ATENCION: PROVISORIO - títulos, resúmenes y fechas son de maqueta. La
 * organización todavía no entregó contenido editorial.
 *
 * DE DÓNDE SALE ESTE SHAPE
 *
 * Del esquema de la colección `noticias` del prototipo de Astro: título,
 * fecha, resumen y categoría. Se adopta ese y no el anterior -que tenía
 * `copete` y un `tema` de texto libre- por dos motivos medibles: la categoría
 * es un conjunto CERRADO de cuatro valores, así que no se puede escribir mal,
 * y el resumen de esa tarjeta va DEBAJO del título sobre fondo propio, no
 * encima de la imagen, así que no hay presupuesto de caracteres que respetar
 * para no tapar nada.
 *
 * `paleta` no viene del prototipo de Astro: es del destino. Allá la figura de
 * cada nota era una trama vectorial propia; acá ocupa ese lugar
 * `PlaceholderVisual`, que ya es el sustituto de fotografía del sistema y se
 * usa en "Sobre ExpoJuy" y en la Agenda. Cada nota toma un par cromático
 * distinto para que el riel tenga ritmo al desplazarse.
 *
 * SON SEIS Y NO TRES: el prototipo de Astro traía tres notas porque era una
 * grilla de tres columnas. Un carrusel con tres tarjetas monta nueve ítems y
 * la vuelta se nota; con seis la copia del medio nunca queda al borde. Las
 * tres primeras son las del prototipo de Astro, textuales; las otras tres se
 * traen del prototipo de Next, reescritas al shape de acá.
 */

/** Conjunto cerrado. Es el mismo del esquema de la colección de origen. */
export type CategoriaNoticia = "institucional" | "expositores" | "agenda" | "prensa";

export type Noticia = {
  id: string;
  /** PROVISORIO */
  titulo: string;
  /** PROVISORIO */
  resumen: string;
  /** Fecha de publicación, en ISO. PROVISORIO. */
  fecha: string;
  categoria: CategoriaNoticia;
  /** Par cromático del visual provisorio, hasta que existan fotografías. */
  paleta: 0 | 1 | 2 | 3;
};

/** Etiqueta visible de cada categoría. El dato guardado es el identificador. */
export const NOMBRE_CATEGORIA: Record<CategoriaNoticia, string> = {
  institucional: "Institucional",
  expositores: "Expositores",
  agenda: "Agenda",
  prensa: "Prensa",
};

/** Ordenadas de la más nueva a la más vieja, como en el prototipo de origen. */
export const NOTICIAS: Noticia[] = [
  {
    id: "acreditaciones-abiertas",
    titulo: "Se abren las acreditaciones profesionales",
    resumen:
      "El registro de visitantes profesionales ya está disponible en línea. La acreditación es gratuita, nominal y con cupo por jornada.",
    fecha: "2026-09-01",
    categoria: "institucional",
    paleta: 0,
  },
  {
    id: "traslado-gratuito",
    titulo: "Traslado gratuito a la Ciudad Cultural",
    resumen:
      "Combis desde el centro de San Salvador durante los cuatro días, con salidas cada media hora y parada en la terminal.",
    fecha: "2026-08-28",
    categoria: "institucional",
    paleta: 3,
  },
  {
    id: "rueda-internacional",
    titulo: "Doce delegaciones confirman su participación en la rueda internacional",
    resumen:
      "Compradores de la región y de mercados de destino participarán de las reuniones uno a uno con empresas jujeñas.",
    fecha: "2026-08-20",
    categoria: "expositores",
    paleta: 1,
  },
  {
    id: "convocatoria-expositores",
    titulo: "Sigue abierta la convocatoria a expositores",
    resumen:
      "Las empresas jujeñas pueden inscribirse hasta fin de mes. La organización asigna los espacios por rubro y no por orden de llegada.",
    fecha: "2026-08-11",
    categoria: "expositores",
    paleta: 2,
  },
  {
    id: "programa-conferencias",
    titulo: "El programa de conferencias suma un eje de economía del conocimiento",
    resumen:
      "Una sala dedicada reunirá a empresas de software y servicios con la demanda concreta de la minería, la energía y el agro.",
    fecha: "2026-08-05",
    categoria: "agenda",
    paleta: 2,
  },
  {
    id: "competencia-robotica",
    titulo: "Competencia de robótica escolar en el pabellón menor",
    resumen:
      "Escuelas técnicas de toda la provincia compiten durante la tercera jornada, con la final abierta al público general.",
    fecha: "2026-07-29",
    categoria: "agenda",
    paleta: 1,
  },
];

/**
 * Formato "4 de agosto de 2026", en español.
 *
 * `timeZone: "UTC"` explícito: sin eso, una fecha ISO sin hora se interpreta
 * en la zona local y en Argentina (UTC-3) mostraría el día anterior.
 */
export function fechaLarga(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
