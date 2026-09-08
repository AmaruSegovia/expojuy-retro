/**
 * Geometría del isologotipo de ExpoJuy 2026 — fuente única.
 *
 * PROCEDENCIA
 * Los `d` se extrajeron del stream de contenido de
 * `RecursosExpoJuy/RGB/expojuy26_isologotipo.pdf`, descomprimiéndolo con zlib.
 * Las coordenadas están SIN MODIFICAR respecto del archivo oficial, para que
 * sean verificables con un diff. Lo único que se agrega es FLIP_Y, que resuelve
 * la diferencia de ejes: el PDF tiene Y hacia arriba y SVG hacia abajo.
 *
 * Los colores también son los del PDF: sus operadores `scn` declaran
 * 0.4667/0.3098/0.9412 → #774FF0, y así los cuatro. Coinciden exactamente con
 * los tokens de marca de globals.css.
 *
 * Este módulo existe para que la marca visible (brand-mark.tsx) y la máscara
 * del page loader usen la MISMA geometría. Si estuviera duplicada, cualquier
 * ajuste desalinearía la ventana respecto del logotipo.
 */

/** Caja del logo en unidades del PDF: 503.2749−338.5848 × 412.3633−182.5078 */
export const BRAND_VIEW_BOX = "0 0 164.6901 229.8555";

/** Lleva el origen a la esquina de la caja e invierte la vertical. */
export const BRAND_FLIP_Y = "translate(-338.5848, 412.3633) scale(1, -1)";

/**
 * Punto de entrada de la animación de zoom del loader, en porcentaje de la
 * caja del logo.
 *
 * NO es el centro de la caja, y esa es la clave: el centro geométrico
 * (50%, 50%) cae en el HUECO que queda entre la barra púrpura y el asta. Si
 * la máscara creciera desde ahí, lo que se agrandaría sobre el centro de la
 * pantalla sería el vacío — o sea, una mancha morada expandiéndose, justo lo
 * contrario del efecto buscado.
 *
 * Este punto cae dentro del gancho lavanda, en la zona maciza de la curva
 * (verificado contra el PNG oficial: en esa fila el trazo es continuo). Al
 * crecer desde un punto interior, su entorno —todo relleno— termina cubriendo
 * el viewport y el morado desaparece por completo.
 */
export const BRAND_ZOOM_ORIGIN = { x: "49.7%", y: "91.3%" } as const;

type BrandPath = {
  /** Clase para poder animar la pieza individualmente. */
  className: string;
  /** Color de marca como token, para uso dentro de la página. */
  fill: string;
  /**
   * El MISMO color como hex literal, tal cual lo declara el PDF oficial.
   * Hace falta porque hay contextos donde las custom properties de CSS no
   * resuelven: el favicon es un documento aparte y no hereda el :root del
   * sitio, así que un var() ahí saldría sin color.
   */
  hex: string;
  d: string;
  /** Solo el gancho necesita evenodd por su contraforma. */
  fillRule?: "evenodd";
};

/**
 * La misma "J" como data URI, en negro sólido, para usarla como máscara CSS.
 *
 * Se genera a partir de BRAND_PATHS en vez de escribirse aparte: si se
 * duplicara, cualquier ajuste desalinearía la ventana respecto del logotipo.
 *
 * Va como máscara de CSS y no como <mask> de SVG: con una máscara de CSS el
 * agujero está horneado en la capa y crece por `transform`, que el compositor
 * resuelve sin rerasterizar la máscara en cada frame.
 */
function construirMascara(): string {
  const paths = BRAND_PATHS.map(
    (p) =>
      `<path fill="#000"${p.fillRule ? ` fill-rule="${p.fillRule}"` : ""} d="${p.d.replace(/\s+/g, " ").trim()}"/>`,
  ).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="164.6901" height="229.8555" viewBox="${BRAND_VIEW_BOX}">` +
    `<g transform="${BRAND_FLIP_Y}">${paths}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** El orden es el de pintado: primero el asta, último la barra superior. */
export const BRAND_PATHS: readonly BrandPath[] = [
  {
    className: "brand-mark__stem",
    fill: "var(--color-brand-violet)",
    hex: "#774ff0",
    d: "M454.9700 292.1250 L454.9700 412.3630 L503.2749 412.3630 L503.2749 292.1250 Z",
  },
  {
    className: "brand-mark__hook",
    fill: "var(--color-brand-lavender)",
    hex: "#bb8cff",
    fillRule: "evenodd",
    d: `M419.6341 182.5078
        C393.9134 182.5078 373.9757 189.5865 359.8183 203.7438
        C345.6609 217.8998 338.5848 236.7581 338.5848 260.3146
        C338.5848 263.3063 338.7152 266.3929 338.9723 269.5728
        L387.4680 269.5728
        C387.2965 267.3227 387.2120 265.1023 387.2120 262.9086
        C387.2120 251.2378 389.9687 242.1060 395.4804 235.5134
        C400.9921 228.9234 409.1516 225.6259 419.9564 225.6259
        C442.2197 225.6259 453.8673 240.2756 454.8957 269.5728
        L503.2749 269.5728
        L503.2749 262.9086
        C503.2749 237.4053 495.9264 217.6299 481.2293 203.5800
        C466.5334 189.5326 446.0020 182.5078 419.6341 182.5078 Z`,
  },
  {
    className: "brand-mark__bar-low",
    fill: "var(--color-brand-violet-deep)",
    hex: "#820cd0",
    d: "M338.9726 292.1253 L419.9564 292.1253 L419.9564 340.4302 L338.9726 340.4302 Z",
  },
  {
    className: "brand-mark__bar-high",
    fill: "var(--color-brand-cyan)",
    hex: "#25c0d4",
    d: "M338.9726 364.0584 L419.9564 364.0584 L419.9564 412.3633 L338.9726 412.3633 Z",
  },
];

/** Máscara lista para usar en `mask-image`. Ver `construirMascara`. */
export const BRAND_MASK_URL = construirMascara();

/**
 * El isologotipo como SVG autocontenido, sobre el fondo oscuro de la barra de
 * navegación (--color-surface, #0b0911), listo para usar como favicon.
 *
 * Se genera desde BRAND_PATHS igual que la máscara: un favicon escrito aparte
 * quedaría desincronizado del logotipo al primer ajuste.
 *
 * Va como data URI y no como archivo estático a propósito: así el ícono sale
 * de la misma fuente de verdad que la marca de la página, en vez de ser una
 * copia que hay que acordarse de regenerar.
 *
 * Los colores van en hex literal porque el favicon se renderiza en un
 * documento aparte que no hereda el :root del sitio.
 *
 * Geometría: el logo (164.6901 × 229.8555) se escala a 52 de alto dentro de un
 * lienzo de 64 y se centra. Se probó con 46 (~14% de aire) y a 16px la marca
 * quedaba demasiado chica para leerse; 52 deja ~9% y sostiene la forma en la
 * pestaña. Esquinas vivas, como manda la regla de radios del sistema.
 */
function construirIcono(): string {
  const ESCALA = 52 / 229.8555;
  const x = (64 - 164.6901 * ESCALA) / 2;
  const y = (64 - 52) / 2;
  const paths = BRAND_PATHS.map(
    (p) =>
      `<path fill="${p.hex}"${p.fillRule ? ` fill-rule="${p.fillRule}"` : ""} d="${p.d.replace(/\s+/g, " ").trim()}"/>`,
  ).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="#0b0911"/>` +
    `<g transform="translate(${x.toFixed(3)}, ${y}) scale(${ESCALA.toFixed(5)})">` +
    `<g transform="${BRAND_FLIP_Y}">${paths}</g></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Favicon listo para `metadata.icons`. Ver `construirIcono`. */
export const BRAND_ICON_DATA_URI = construirIcono();
