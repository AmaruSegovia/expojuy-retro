/**
 * Patrocinadores y organismos que acompañan la edición 2026.
 *
 * ATENCION: DEMOSTRACION. La lista y los isologotipos vienen del prototipo de Astro,
 * donde estaban puestos para poder maquetar un muro de patrocinadores real. NO
 * hay acuerdo comercial confirmado con ninguna de estas instituciones:
 * reemplazar por los acuerdos reales del evento antes de publicar.
 *
 * LOS ARCHIVOS
 *
 * `public/sponsors/<id>.png`. El id ES el nombre del archivo: para sumar un
 * patrocinador alcanza con dejar el PNG y agregar la entrada acá, sin tocar
 * el componente.
 *
 * Los nueve archivos pasaron por el normalizador del prototipo de origen, que
 * les quita el fondo, los lleva a UNA SOLA TINTA y los escala para que todos
 * tengan la misma cantidad de tinta. Sin ese paso, los archivos tal como los
 * manda cada institución traen fondos de distinto color y aire interno del 0%
 * al 79%, y la grilla queda como un collage.
 *
 * MEDIDO EN DISCO, NO COPIADO DEL COMENTARIO DE ORIGEN: los nueve archivos
 * miden 316 x 186. El comentario del componente de Astro decía 400 x 160 y
 * había quedado desactualizado respecto del script que genera los lienzos.
 *
 * TRES ENTRADAS NO TIENEN ARCHIVO, y se declara en vez de disimularse: la
 * tarjeta muestra el nombre compuesto tipográficamente y avisa que el
 * isologotipo está pendiente. Es el mismo criterio del prototipo de origen.
 */

export type NivelSponsor = "institucional" | "principal" | "oro" | "plata";

export type Sponsor = {
  /** También es el nombre del archivo en `public/sponsors/`. */
  id: string;
  nombre: string;
  nivel: NivelSponsor;
  /** Si existe `public/sponsors/<id>.png`. Sin archivo va el nombre en texto. */
  logo: boolean;
};

/** Lienzo real de los nueve archivos normalizados. Verificado en disco. */
export const LIENZO_LOGO = { ancho: 316, alto: 186 } as const;

/**
 * EL ORDEN DE ESTA LISTA ES EL ORDEN DEL DOCUMENTO y agrupa por nivel. Dos
 * cosas dependen de eso: los grupos se arman recorriéndola una sola vez, y el
 * índice de una ficha dentro de la lista PLANA es el que usa el observador
 * que sigue el scroll. Si se desordena, el marcador señala otra ficha.
 */
export const SPONSORS: Sponsor[] = [
  {
    id: "gobierno-jujuy",
    nombre: "Gobierno de la Provincia de Jujuy",
    nivel: "institucional",
    logo: true,
  },
  {
    id: "ministerio-produccion",
    nombre: "Ministerio de Desarrollo Económico y Producción",
    nivel: "institucional",
    logo: true,
  },
  {
    id: "camcomex",
    nombre: "Cámara de Comercio Exterior de Jujuy",
    nivel: "institucional",
    logo: true,
  },
  {
    id: "clustear",
    nombre: "ClusteAR, Cámara de Empresas TICs",
    nivel: "institucional",
    logo: false,
  },
  {
    id: "sbc",
    nombre: "Dirección Provincial de Servicios Basados en el Conocimiento",
    nivel: "principal",
    logo: false,
  },
  { id: "jemse", nombre: "JEMSE", nivel: "oro", logo: true },
  { id: "cauchari", nombre: "Cauchari Solar", nivel: "oro", logo: true },
  { id: "ledesma", nombre: "Ledesma", nivel: "oro", logo: true },
  { id: "banco-jujuy", nombre: "Banco de la Nación Argentina", nivel: "plata", logo: true },
  { id: "uni-jujuy", nombre: "Universidad Nacional de Jujuy", nivel: "plata", logo: true },
  { id: "inti", nombre: "INTI Jujuy", nivel: "plata", logo: false },
  { id: "cfi", nombre: "Consejo Federal de Inversiones", nivel: "plata", logo: true },
];

/**
 * LA JERARQUIA POR NIVEL ES INFORMACION, NO DECORACION.
 *
 * Un muro de patrocinadores dice quién puso cuánto, y eso se lee por el
 * tamaño: el nivel elige cuánto mide el lienzo del logotipo y cuánto mide la
 * ficha, y dentro de cada nivel todos miden igual. Es exactamente por esto que
 * la sección NO es una cinta infinita: una cinta que mezcla niveles pierde la
 * distinción entre institucional, principal, oro y plata, que es justamente lo
 * que la sección comunica.
 *
 * `escala` no es un adjetivo suelto: es el atributo `data-escala` de la
 * grilla, y de él dependen en CSS la cantidad de columnas, el alto de fila y
 * el ancho máximo del logotipo. Ver styles.css.
 */
export type EscalaNivel = "grande" | "principal" | "medio" | "chico";

type DefinicionNivel = {
  clave: NivelSponsor;
  titulo: string;
  escala: EscalaNivel;
};

const NIVELES: DefinicionNivel[] = [
  { clave: "institucional", titulo: "Organizan y acompañan", escala: "grande" },
  { clave: "principal", titulo: "Patrocinador principal", escala: "principal" },
  { clave: "oro", titulo: "Patrocinadores oro", escala: "medio" },
  { clave: "plata", titulo: "Patrocinadores plata", escala: "chico" },
];

export type GrupoSponsors = DefinicionNivel & {
  items: Sponsor[];
  /** Índice del primer ítem del grupo dentro de la lista PLANA. */
  desde: number;
};

/**
 * Los grupos, ya armados en tiempo de módulo.
 *
 * `desde` es la pieza que une los dos sistemas de índices: el observador de
 * scroll trabaja sobre la lista plana, y el marcador de cada grilla necesita
 * un índice LOCAL para que su cuenta de fila y columna dé bien. Restar `desde`
 * es toda la traducción, y no requiere medir nada.
 *
 * Un nivel sin ítems no se dibuja. Hoy los cuatro tienen.
 */
export const GRUPOS: GrupoSponsors[] = NIVELES.map((nivel) => ({
  ...nivel,
  items: SPONSORS.filter((s) => s.nivel === nivel.clave),
  desde: SPONSORS.findIndex((s) => s.nivel === nivel.clave),
})).filter((grupo) => grupo.items.length > 0);
