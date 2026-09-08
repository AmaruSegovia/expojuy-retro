/**
 * Noticias del programa.
 *
 * ⚠️ PROVISORIO — títulos, copetes y fechas son de maqueta. La organización
 * todavía no entregó contenido editorial.
 *
 * Los textos están escritos CORTOS con presupuesto, y el presupuesto lo fija
 * el caso PEOR: la tarjeta más angosta, que en un teléfono de 390px deja 232px
 * de contenido. Ahí entran ~29 caracteres por renglón en el título y ~34 en el
 * copete, y los dos van a dos líneas: hasta ~46 el título y ~62 el copete.
 *
 * El recorte del CSS es una red de seguridad, no el mecanismo: si hiciera
 * falta recortar, el texto ya estaría mal escrito. La primera versión se
 * escribió mirando el escritorio y recortaba las 18 tarjetas en móvil.
 */

export type Noticia = {
  id: string;
  /** PROVISORIO */
  titulo: string;
  /** PROVISORIO */
  copete: string;
  /** Fecha de publicación, en ISO. PROVISORIO. */
  fecha: string;
  /** PROVISORIO — la sección del sitio a la que pertenece la noticia. */
  tema: string;
  /** Paleta del visual provisorio, hasta que existan fotografías. */
  paleta: 0 | 1 | 2 | 3;
};

export const NOTICIAS: Noticia[] = [
  {
    id: "convocatoria-abierta",
    titulo: "Se abre la convocatoria a expositores",
    copete: "Las empresas jujeñas se inscriben hasta fin de mes.",
    fecha: "2026-08-04",
    tema: "Convocatorias",
    paleta: 0,
  },
  {
    id: "programa-charlas",
    titulo: "Ya está el programa de charlas",
    copete: "Cuatro días de paneles sobre producción y tecnología.",
    fecha: "2026-08-12",
    tema: "Agenda",
    paleta: 2,
  },
  {
    id: "rondas-binacionales",
    titulo: "Rondas de negocios con Bolivia y Chile",
    copete: "Encuentros con delegaciones de los dos países vecinos.",
    fecha: "2026-08-19",
    tema: "Vinculación",
    paleta: 1,
  },
  {
    id: "competencia-robotica",
    titulo: "Competencia de robótica escolar",
    copete: "Escuelas técnicas de la provincia, en el pabellón menor.",
    fecha: "2026-08-26",
    tema: "Innovación",
    paleta: 3,
  },
  {
    id: "entradas-anticipadas",
    titulo: "Entradas anticipadas en venta",
    copete: "Cupo limitado para las primeras jornadas.",
    fecha: "2026-09-01",
    tema: "Entradas",
    paleta: 2,
  },
  {
    id: "traslado-gratuito",
    titulo: "Traslado gratuito a la Ciudad Cultural",
    copete: "Combis desde el centro durante los cuatro días.",
    fecha: "2026-09-05",
    tema: "Servicios",
    paleta: 1,
  },
];

/** Formato "4 de agosto", en español, para mostrar la fecha en la tarjeta. */
export function fechaLarga(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
