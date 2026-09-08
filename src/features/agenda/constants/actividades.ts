/**
 * Programa de actividades de ExpoJuy 2026.
 *
 * ATENCION: CONTENIDO PROVISORIO. La organización todavía no entregó el cronograma:
 * el kit incluye solo logotipos y tipografías. Títulos, horarios, descripciones
 * y expositores son de maqueta y deben reemplazarse antes de publicar.
 *
 * Lo que NO es inventado son los EJES a los que responde cada actividad:
 * innovación, tecnología, producción, desarrollo, vinculación empresarial y
 * economía del conocimiento son los valores que la organización declara en las
 * consignas técnicas del desafío. El cronograma provisorio los recorre todos
 * para que la maqueta muestre la forma real que va a tener la sección.
 *
 * Las fechas salen de SITE.dates (24 al 27 de septiembre de 2026), también
 * provisorias. Están acá en ISO y no como texto suelto para que <time> pueda
 * exponerlas legibles por máquina.
 *
 * ATENCION: LARGO DEL TEXTO. La tarjeta muestra el título en UNA línea y la
 * descripción en TRES como máximo; de eso se encarga el CSS, que recorta con
 * puntos suspensivos si hace falta. Para que hoy no recorte nada, estos textos
 * provisorios están escritos cortos: hasta ~31 caracteres el título y ~78 la
 * descripción. Al reemplazarlos por los reales conviene respetar ese orden de
 * magnitud, o el corte va a empezar a verse.
 */

export type Actividad = {
  id: string;
  /** Fecha y hora de inicio en ISO local. Alimenta el atributo dateTime. */
  inicioISO: string;
  /** Día tal como se muestra. Se escribe a mano para no depender de Intl en el servidor. */
  diaLabel: string;
  /** Hora tal como se muestra, en formato de 24 horas (convención argentina). */
  horaLabel: string;
  /** Quién la da. PROVISORIO. */
  expositor: string;
  /** Eje declarado por la organización al que responde la actividad. */
  eje: string;
  titulo: string;
  descripcion: string;
  /** Índice de paleta del visual provisorio (0–3). Ver PlaceholderVisual. */
  paleta: 0 | 1 | 2 | 3;
};

export const ACTIVIDADES: readonly Actividad[] = [
  {
    id: "apertura",
    inicioISO: "2026-09-24T10:00",
    diaLabel: "Jueves 24",
    horaLabel: "10:00",
    expositor: "Cámara de Comercio Exterior de Jujuy",
    eje: "Vinculación empresarial",
    titulo: "Apertura oficial de la muestra",
    descripcion: "Acto inaugural con autoridades provinciales y las cámaras empresarias invitadas.",
    paleta: 0,
  },
  {
    id: "ronda-negocios",
    inicioISO: "2026-09-24T15:30",
    diaLabel: "Jueves 24",
    horaLabel: "15:30",
    expositor: "Agencia de Promoción de Exportaciones",
    eje: "Vinculación empresarial",
    titulo: "Ronda de negocios internacional",
    descripcion: "Agenda cerrada entre productores jujeños y compradores de la región.",
    paleta: 1,
  },
  {
    id: "litio-energia",
    inicioISO: "2026-09-25T11:00",
    diaLabel: "Viernes 25",
    horaLabel: "11:00",
    expositor: "Panel de industria y academia",
    eje: "Producción y desarrollo",
    titulo: "Litio y energías renovables",
    descripcion:
      "Del salar a la celda: qué parte del valor agregado se produce hoy en la provincia.",
    paleta: 2,
  },
  {
    id: "agroindustria",
    inicioISO: "2026-09-25T17:00",
    diaLabel: "Viernes 25",
    horaLabel: "17:00",
    expositor: "Nodo Tecnológico de Jujuy",
    eje: "Innovación y tecnología",
    titulo: "Tecnología en la agroindustria",
    descripcion: "Sensores de campo, trazabilidad y riego automatizado sobre casos reales.",
    paleta: 3,
  },
  {
    id: "software",
    inicioISO: "2026-09-26T12:00",
    diaLabel: "Sábado 26",
    horaLabel: "12:00",
    expositor: "Polo de Economía del Conocimiento",
    eje: "Economía del conocimiento",
    titulo: "Software jujeño que exporta",
    descripcion: "Cuatro empresas locales cuentan cómo llegaron a facturar afuera.",
    paleta: 0,
  },
  {
    id: "cierre",
    inicioISO: "2026-09-27T18:00",
    diaLabel: "Domingo 27",
    horaLabel: "18:00",
    expositor: "Comité organizador",
    eje: "Innovación y tecnología",
    titulo: "Cierre y premiación",
    descripcion: "Resultados del Programa Provincial de Desafíos Tecnológicos.",
    paleta: 1,
  },
];
