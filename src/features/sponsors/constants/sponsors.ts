/**
 * Marcas que acompañan la edición 2026.
 *
 * ⚠️ PROVISORIO, Y ACÁ LA ADVERTENCIA PESA MÁS QUE EN EL RESTO DEL SITIO.
 *
 * Una noticia inventada se lee como maqueta; un auspiciante inventado AFIRMA
 * un vínculo comercial que nadie confirmó. Por eso ninguno de estos nombres
 * corresponde a una empresa real: son composiciones de un topónimo jujeño y un
 * rubro, elegidas justamente para que no se confundan con nadie. La
 * organización no entregó lista de auspiciantes ni un solo logotipo.
 *
 * Tampoco figura la Cámara de Comercio Exterior de Jujuy, que sí tiene su
 * logotipo en el kit: es la organizadora, no una auspiciante, y ponerla acá
 * sería otra afirmación falsa.
 *
 * NINGÚN NOMBRE SE REPITE CON LOS DOCE EXPOSITORES, ni por topónimo ni por
 * rubro. La primera versión tenía "Altiplano Software" en las dos listas y un
 * "Humahuaca Textil" contra el "Textil Humahuaca" de la otra: se lee como un
 * copiar y pegar mal hecho, no como una empresa que expone y además auspicia.
 * La frontera de arquitectura impide que este archivo mire el del otro slice,
 * así que la regla se sostiene a mano: al tocar cualquiera de las dos listas,
 * revisar la otra.
 *
 * SON DIECISÉIS Y NO OTRO NÚMERO: la grilla es de 4×4 y una celda vacía en una
 * grilla completa se lee como un error de carga, no como un espacio libre. Si
 * la lista real trae otra cantidad, hay que decidir la grilla de nuevo.
 *
 * El nombre es el TEXTO ALTERNATIVO del logotipo: hasta que exista la imagen,
 * la "J" ocupa su lugar y este string es lo único que un lector de pantalla
 * tiene para saber de quién se trata.
 */

export type Sponsor = {
  id: string;
  /** PROVISORIO — nombre de fantasía, no es una empresa real. */
  nombre: string;
};

export const SPONSORS: Sponsor[] = [
  { id: "tilcara-turismo", nombre: "Tilcara Turismo" },
  { id: "maimara-vinos", nombre: "Maimará Vinos" },
  { id: "perico-metalurgica", nombre: "Perico Metalúrgica" },
  { id: "reyes-ingenieria", nombre: "Reyes Ingeniería" },
  { id: "abra-pampa-ganadera", nombre: "Abra Pampa Ganadera" },
  { id: "san-pedro-bioenergia", nombre: "San Pedro Bioenergía" },
  { id: "purmamarca-hoteleria", nombre: "Purmamarca Hotelería" },
  { id: "susques-transporte", nombre: "Susques Transporte" },
  { id: "el-carmen-alimentos", nombre: "El Carmen Alimentos" },
  { id: "volcan-constructora", nombre: "Volcán Constructora" },
  { id: "la-quiaca-despachantes", nombre: "La Quiaca Despachantes" },
  { id: "monterrico-riego", nombre: "Monterrico Riego" },
  { id: "tumbaya-grafica", nombre: "Tumbaya Gráfica" },
  { id: "libertador-envases", nombre: "Libertador Envases" },
  { id: "yavi-artesanias", nombre: "Yavi Artesanías" },
  { id: "tres-cruces-logistica", nombre: "Tres Cruces Logística" },
];
