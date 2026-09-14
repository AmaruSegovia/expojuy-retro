import type { CSSProperties } from "react";
import { BRAND_CAJA, BRAND_FLIP_Y, BRAND_PATHS, cajaDePieza } from "./brand-mark-paths";
import { CoreografiaLoader } from "./coreografia-loader";

const ID_LOADER = "pantalla-de-carga";

/**
 * Cuánto se extiende la placa más allá de la caja del logo, en unidades de
 * logo. Es SOLAPE, no aire: los bordes de color empiezan en el borde de la caja
 * y la placa los pisa. Si terminaran en la misma línea, cada uno
 * suavizaría ese píxel por su lado y quedaría una línea translúcida que el
 * zoom de 34x agranda a una raya visible.
 */
const SOLAPE_PLACA = 8;

/**
 * Aire alrededor del gancho, en unidades de logo. El gancho recorta a su caja
 * para que la cortina no se vea afuera, y sin este margen el recorte se comería
 * el suavizado de sus bordes.
 */
const AIRE_GANCHO = 1;

const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

/**
 * Pantalla de carga: las cuatro piezas del isologotipo entran una por una y
 * después la "J" crece como una ventana que deja ver el hero.
 *
 * POR QUÉ LA VISIBILIDAD NO ESTÁ EN EL ESTADO DE REACT
 *
 * La decisión de mostrarlo la toma un script inline en el layout, que marca
 * `data-loader` en el <html>. El CSS lo muestra a partir de ese atributo. Si
 * dependiera de un efecto de React el orden sería pintar el hero → hidratar →
 * recién ahí tapar con el morado: el usuario vería la página y DESPUÉS el
 * loader. Con el atributo puesto antes del primer pintado, el morado está
 * desde el frame cero.
 *
 * POR QUÉ ESTÁ ARMADO ASÍ Y NO COMO UN <BrandMark> CON UNA MÁSCARA
 *
 * Medido con la CPU 6x más lenta en un viewport de 412px: con la versión
 * anterior se perdían entre 15 y 44 de cada 45 cuadros durante la entrada.
 * Chrome no componía NINGUNA de las cuatro piezas -`scale` y `translate` sobre
 * un hijo de SVG no se componen (motivo 524288), `clip-path` tampoco (8192)-,
 * así que cada cuadro se pintaba en el hilo principal justo mientras React
 * hidrataba. Ese es el "va a los saltos" de un teléfono de gama baja.
 *
 * - Cada pieza es su propia caja HTML, ubicada con la caja que sale de su `d`.
 *   Sobre HTML, `scale`, `translate`, `rotate` y `opacity` los resuelve el
 *   compositor aunque el hilo principal esté ocupado.
 * - La ventana de salida ya no es un `mask-image`. Una máscara de CSS sobre una
 *   capa a pantalla completa obliga a la GPU a pintarla aparte y enmascararla
 *   en cada cuadro; ahora es una placa SVG con la J restada por `evenodd` más
 *   cuatro bordes de un solo color, que Chrome dibuja sin rasterizar.
 * - Las fases se encadenan por `animationend` y no por temporizadores con
 *   duraciones copiadas del CSS. Antes la salida la disparaba un `setTimeout`
 *   de 1700ms que empezaba a contar recién al hidratar: con la CPU 6x más
 *   lenta arrancaba a los 3,1s y la pausa de 300ms se estiraba a 1,5s.
 * - El zoom lleva `perspective()`. Sin eso Chrome rasteriza la marca a 34x:
 *   en reposo la curva sale escalonada y en un Samsung A13 la salida saltaba
 *   de escala 1 a ~25. Ver la REGLA 2 en globals.css.
 *
 * OTRAS DECISIONES QUE NO SON ESTÉTICAS
 *
 * - No bloquea el contenido: el HTML se sirve completo debajo del overlay, así
 *   que el LCP no lo espera y los buscadores no ven una página vacía.
 * - `aria-hidden` y sin foco: para un lector de pantalla no existe.
 * - Una vez por sesión.
 * - Con `prefers-reduced-motion` el script no pone el atributo, así que no se
 *   muestra en absoluto. No "más rápido": no se muestra.
 */
export function PageLoader() {
  return (
    <div
      id={ID_LOADER}
      // Sin `grid place-items-center`: ese layout lo define .page-loader en
      // globals.css. Ver el comentario ahí - usar utilidades acá haría que
      // ningún `display: none` pudiera ocultarlo (las capas ganan a la
      // especificidad).
      className="page-loader fixed inset-0 z-[200]"
      aria-hidden="true"
    >
      <Ventana />
      <div className="page-loader__marca">
        {BRAND_PATHS.map((pieza) => (
          <Pieza key={pieza.className} {...pieza} />
        ))}
      </div>
      <CoreografiaLoader idLoader={ID_LOADER} />
    </div>
  );
}

/** Los cuatro bordes que cubren el viewport alrededor de la placa. */
const BORDES = ["arriba", "abajo", "izquierda", "derecha"] as const;

/**
 * El fondo morado con la "J" recortada. La placa tiene el agujero; los cuatro
 * bordes cubren el resto del viewport; el telón tapa el agujero durante la
 * entrada, cuando las piezas todavía no están para taparlo.
 */
function Ventana() {
  const { x, y, ancho, alto } = BRAND_CAJA;
  const s = SOLAPE_PLACA;
  // Un solo trazado: el rectángulo y las cuatro piezas. Con `evenodd`, dentro
  // de una pieza el punto queda cubierto dos veces y se vacía. El gancho es un
  // único contorno, así que no hay contraformas que se vuelvan a llenar.
  const rectangulo = `M${x - s} ${y - s}H${x + ancho + s}V${y + alto + s}H${x - s}Z`;
  const d = [rectangulo, ...BRAND_PATHS.map((p) => p.d)].join(" ");

  return (
    <div
      className="page-loader__ventana"
      style={
        {
          "--placa-x": pct(-s / ancho),
          "--placa-y": pct(-s / alto),
          "--placa-ancho": pct((ancho + 2 * s) / ancho),
          "--placa-alto": pct((alto + 2 * s) / alto),
        } as CSSProperties
      }
    >
      <span className="page-loader__telon" />
      {BORDES.map((lado) => (
        <span key={lado} className={`page-loader__borde page-loader__borde--${lado}`} />
      ))}
      <svg viewBox={`${-s} ${-s} ${ancho + 2 * s} ${alto + 2 * s}`} className="page-loader__placa">
        <g transform={BRAND_FLIP_Y}>
          <path fillRule="evenodd" d={d} />
        </g>
      </svg>
    </div>
  );
}

function Pieza({ className, fill, fillRule, d }: (typeof BRAND_PATHS)[number]) {
  const esGancho = className === "brand-mark__hook";
  const a = esGancho ? AIRE_GANCHO : 0;
  const c = cajaDePieza(d);
  const ancho = c.ancho + 2 * a;
  const alto = c.alto + 2 * a;

  const ubicacion: Record<string, string> = {
    "--pieza-x": pct((c.izquierda - a) / BRAND_CAJA.ancho),
    "--pieza-y": pct((c.arriba - a) / BRAND_CAJA.alto),
    "--pieza-ancho": pct(ancho / BRAND_CAJA.ancho),
    "--pieza-alto": pct(alto / BRAND_CAJA.alto),
  };

  if (esGancho) {
    // La cortina gira sobre el centro del borde superior del gancho, así que
    // tiene que alcanzar la esquina más lejana de la caja desde ese punto. El
    // +1 es margen para que el borde de la cortina nunca pase por adentro.
    const radio = Math.hypot(ancho / 2, alto) + 1;
    ubicacion["--cortina-ancho"] = pct((2 * radio) / ancho);
    ubicacion["--cortina-alto"] = pct(radio / alto);
  }

  // Lleva la pieza del PDF a su propia caja: el borde izquierdo al aire, el
  // borde superior -el Y más alto, porque el PDF crece hacia arriba- también.
  const bordeIzquierdo = BRAND_CAJA.x + c.izquierda;
  const bordeSuperior = BRAND_CAJA.y + BRAND_CAJA.alto - c.arriba;

  return (
    <div className={`page-loader__pieza ${className}`} style={ubicacion as CSSProperties}>
      <svg viewBox={`0 0 ${ancho} ${alto}`}>
        <g transform={`translate(${a - bordeIzquierdo} ${a + bordeSuperior}) scale(1 -1)`}>
          <path fill={fill} fillRule={fillRule} d={d} />
        </g>
      </svg>
      {esGancho && <span className="page-loader__cortina" />}
    </div>
  );
}
