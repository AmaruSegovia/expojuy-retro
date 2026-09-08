/**
 * Contenido de "Sobre ExpoJuy 2026".
 *
 * ⚠️ TEXTOS PROVISORIOS. Los TÍTULOS Y EJES no son inventados: se derivan de
 * los valores que la organización declara en las consignas técnicas del
 * desafío —innovación, tecnología, producción, desarrollo, vinculación
 * empresarial y economía del conocimiento—, un eje por lámina. Las
 * descripciones y las cifras sí son de relleno y deben reemplazarse con datos
 * reales antes de la entrega.
 *
 * Las imágenes también son provisorias: el kit entregado no incluye
 * fotografías institucionales. Ver `PlaceholderVisual`.
 */

export type Lamina = {
  id: string;
  /** Eje declarado por la organización al que responde la lámina. */
  eje: string;
  titulo: string;
  descripcion: string;
  /** Dato destacado. PROVISORIO. */
  dato: { valor: string; etiqueta: string };
  /** Índice de paleta para el visual provisorio (0–3). */
  paleta: 0 | 1 | 2 | 3;
};

export const LAMINAS: readonly Lamina[] = [
  {
    id: "vinculacion",
    eje: "Vinculación empresarial",
    titulo: "Donde la provincia se encuentra con el mundo",
    descripcion:
      "Cuatro días de rondas de negocios, encuentros con cámaras de comercio y contacto directo entre productores jujeños y compradores internacionales.",
    dato: { valor: "+120", etiqueta: "empresas participantes" },
    paleta: 0,
  },
  {
    id: "produccion",
    eje: "Producción y desarrollo",
    titulo: "Lo que Jujuy produce, en un solo lugar",
    descripcion:
      "Minería, agroindustria, energías renovables y manufactura. Cada sector con su espacio propio dentro del predio de la Ciudad Cultural.",
    dato: { valor: "8", etiqueta: "sectores productivos" },
    paleta: 1,
  },
  {
    id: "tecnologia",
    eje: "Innovación y tecnología",
    titulo: "Tecnología que ya está funcionando",
    descripcion:
      "Demostraciones en vivo de proyectos aplicados a la industria local, con foco en lo que hoy está en producción y no en prototipos de laboratorio.",
    dato: { valor: "30+", etiqueta: "demostraciones en vivo" },
    paleta: 2,
  },
  {
    id: "conocimiento",
    eje: "Economía del conocimiento",
    titulo: "El talento también es una exportación",
    descripcion:
      "Software, servicios profesionales y biotecnología. El sector que más crece en la provincia, con su propia agenda de charlas y espacios de contratación.",
    dato: { valor: "24", etiqueta: "charlas y paneles" },
    paleta: 3,
  },
];
