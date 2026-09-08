"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ARENA,
  BLOQUES,
  CALLES_TRAZADO,
  GIRO,
  HITO,
  LIMITE_GIRO,
  PARCELA,
  PARCELA_RETICULA,
  PUNTOS,
  PUNTOS_RETICULA,
  RETICULA,
  ROTONDA,
  VERDES,
  type Bloque,
} from "../constants/plano";
import {
  aReticula,
  extensionProyectada,
  ordenarPorProfundidad,
  proyectar,
} from "../lib/proyeccion";
import type { Camara } from "../lib/proyeccion";

/**
 * LA MAQUETA SE DIBUJA EN UN LIENZO, NO EN EL DOCUMENTO. NO VOLVER ATRÁS.
 *
 * La primera versión construía la maqueta con nodos del documento y transformes
 * 3D de CSS: 31 bloques por cinco caras más la sombra, 783 nodos, girados
 * escribiendo dos propiedades registradas con `@property`. Se veía bien en
 * escritorio y era inusable en celular.
 *
 * Medido sobre el build de producción en Chrome headless, viewport 412x915 a
 * 3x, arrastrando de verdad la maqueta durante 90 cuadros. Milisegundos por
 * cuadro, menos es mejor:
 *
 *                                        CPU 6x                CPU 4x
 *   DOM, variables en el ancestro      151,4 ms  6,6 fps     75,5 ms  13,2 fps
 *   DOM, transform en los consumidores  51,7 ms 19,4 fps     33,7 ms  29,7 fps
 *   lienzo 2D con descarte de caras     32,7 ms 30,5 fps     13,6 ms  73,3 fps
 *
 * Cuatro veces y media contra la primera versión. La razón es estructural y no
 * se arregla afinando CSS: cada cuadro del arrastre obligaba al navegador a
 * recalcular estilo, disposición y pintado de cientos de nodos. En el lienzo un
 * cuadro son unos noventa rellenos sobre un solo elemento.
 *
 * El número de 6x es pesimista: en headless la rasterización del lienzo también
 * corre por CPU, mientras que un teléfono real la compone en la GPU.
 *
 * Se descartaron por medición, no vale la pena reintentarlas:
 *   - Sacar el `filter: blur()` de las 31 sombras. No cambia el número.
 *   - Declarar las propiedades del giro con `inherits: false`. Empeora.
 *
 * QUÉ NO CAMBIÓ. La geometría sigue viniendo entera de `constants/plano.ts`,
 * que es la fuente única. Los colores se leen de los tokens del sistema en
 * tiempo de ejecución, así que no hay un solo color escrito acá. Los marcadores
 * siguen siendo `<button>` de HTML de 36 píxeles sobre el dibujo, con teclado y
 * foco visible: el lienzo es el dibujo y va `aria-hidden`, igual que iba el SVG.
 */

/** Las cuatro caras verticales, en el orden en que se dibujan. */
const PAREDES = [
  { dx: [0, 1, 1, 0], dy: [0, 0, 0, 0], luz: 76 },
  { dx: [1, 1, 1, 1], dy: [0, 1, 1, 0], luz: 56 },
  { dx: [1, 0, 0, 1], dy: [1, 1, 1, 1], luz: 56 },
  { dx: [0, 0, 0, 0], dy: [1, 0, 0, 1], luz: 76 },
] as const;

/**
 * Los lugares que se rotulan sobre el dibujo, con su ancla ya resuelta.
 *
 * Un lugar puede ocupar muchos volúmenes: el sector B de stands son veinticuatro
 * módulos. El rótulo no va sobre cada uno sino sobre el CENTRO del conjunto, y a
 * la altura del más alto, así que se apoya arriba del grupo y no lo tapa.
 *
 * Se calcula una vez al cargar el módulo, no por cuadro: son datos derivados de
 * la geometría, que no cambia.
 */
const GRUPOS_ROTULADOS = PUNTOS.map((p, i) => {
  const suyos = BLOQUES.filter((b) => b.punto === p.id);
  if (suyos.length > 0) {
    const centro = suyos.reduce(
      (a, b) => ({ x: a.x + (b.x + b.w / 2), y: a.y + (b.y + b.h / 2) }),
      { x: 0, y: 0 },
    );
    return {
      id: p.id,
      rotulo: p.rotulo,
      x: centro.x / suyos.length,
      y: centro.y / suyos.length,
      alto: Math.max(...suyos.map((b) => b.volumen)),
      /** Un bloque cualquiera del grupo, para leer su levantada al señalarlo. */
      referencia: suyos[0]?.id ?? "",
    };
  }
  // Los que no ocupan volúmenes se apoyan en su propio marcador: la rotonda, el
  // polideportivo y el parquesito son accidentes del suelo, no edificios.
  const lugar = PUNTOS_RETICULA[i];
  return {
    id: p.id,
    rotulo: p.rotulo,
    x: lugar?.x ?? 0,
    y: lugar?.y ?? 0,
    alto: lugar?.z ?? 0,
    referencia: "",
  };
});

/** Grados de giro por píxel arrastrado, distintos por eje. */
const POR_PIXEL = { z: 0.25, x: 0.15 };
const UMBRAL_ARRASTRE = 4;
const PASO_TECLADO: Record<string, [number, number]> = {
  ArrowLeft: [5, 0],
  ArrowRight: [-5, 0],
  ArrowUp: [0, 3],
  ArrowDown: [0, -3],
};

/** Duración de la construcción y de la vuelta del giro, en milisegundos. */
const MS_CONSTRUCCION = 900;
const MS_VUELTA = 520;

/**
 * A cuánto baja un rótulo cuando otro se le monta encima.
 *
 * NO SE APAGA DEL TODO, Y ESA ES LA DIFERENCIA. Llevarlo a cero deja al lugar
 * sin nombre, que es información que se pierde por un problema de dibujo.
 * Atenuado sigue leyéndose, solo que se lee segundo: el de adelante manda y el
 * de atrás acompaña, que es exactamente lo que pasa en el dibujo con los
 * volúmenes. Sobre fondo oscuro, 0,4 conserva el texto legible y a la vez deja
 * clarísimo cuál de los dos está por delante.
 */
const OPACIDAD_TAPADO = 0.4;

/**
 * Debajo de esta escala la maqueta nombra SOLO el lugar elegido.
 *
 * No es una preferencia de diseño, es que los nueve nombres no entran. El
 * predio mide 8,5 x 18 unidades y en reposo se apoya en diagonal, que es su
 * posición más ancha, así que el lienzo se dimensiona para 19,9 unidades de
 * ancho. En un teléfono de 412 px eso deja la escala en 19,9 px por unidad,
 * contra 45 en escritorio. La letra no acompaña esa reducción porque tiene piso
 * de legibilidad en 11 px, así que pesa el doble sobre el dibujo:
 *
 *   escritorio   45,3 px/unidad   letra 13,6 px   =  0,30 unidades
 *   celular      19,9 px/unidad   letra 11 px     =  0,61 unidades
 *
 * Y en números absolutos: nueve nombres suman unos 765 px de texto, que no
 * entran en 412 px de ancho por más que se los acomode.
 *
 * El corte está en 27 px por unidad, donde la letra llega a 0,41 unidades: un
 * 36 por ciento más gruesa que en escritorio, que es el límite en que los
 * nombres todavía se separan. Debajo de eso el mapa nombra el lugar elegido y
 * los otros ocho se leen donde ya estaban: el riel de tarjetas de abajo y la
 * lista de lugares en texto.
 *
 * SE ELIGIÓ ESTO Y NO ACHICAR LA LETRA NI ACOTAR EL GIRO. Bajar de 11 px deja
 * el texto ilegible justo donde más chico se ve. Apoyar el predio derecho y
 * limitar el giro a 15 grados subiría la escala a 30,7 px por unidad y los
 * nueve entrarían, pero a costa del giro libre en celular, que es lo que hace
 * que la maqueta sirva de algo en un teléfono.
 */
const U_MINIMA_PARA_NUEVE = 27;

const acotar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Diferencia más corta entre dos ángulos, en el rango -180 a 180. */
const diferenciaDeAngulo = (desde: number, hasta: number) =>
  ((((hasta - desde) % 360) + 540) % 360) - 180;

/** Si la maqueta está fuera de su posición de reposo, con margen de un grado. */
const estaGirada = (z: number, x: number) =>
  Math.abs(diferenciaDeAngulo(z, GIRO.z)) > 1 || Math.abs(x - GIRO.x) > 1;
const suave = (t: number) => 1 - Math.pow(1 - t, 3);

/** Los tokens que el dibujo necesita. Se resuelven una vez, al montar. */
const TOKENS = [
  "--plano-terreno",
  "--plano-sombra",
  "--tono-nave",
  "--tono-stand",
  "--tono-servicio",
  "--tono-modulo",
  "--color-surface-sunken",
  "--color-surface-overlay",
  "--color-brand-cyan",
  "--color-brand-lavender",
  "--color-accent",
  "--color-border",
  "--color-text",
] as const;

type Paleta = Record<(typeof TOKENS)[number], [number, number, number]>;

/**
 * Resuelve un color de CSS a tres canales.
 *
 * Los tokens de la maqueta son `color-mix(in oklab, ...)`, que el navegador
 * serializa como `oklab(...)`. En vez de reimplementar esa conversión, se le
 * pide al propio lienzo que pinte un píxel con ese color y se lee el resultado:
 * lo que se dibuja es exactamente lo que el navegador entiende, y funciona con
 * cualquier sintaxis de color que soporte, hoy y más adelante.
 */
function resolverColor(ctx: CanvasRenderingContext2D, valor: string): [number, number, number] {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillStyle = valor.trim();
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  ctx.restore();
  return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
}

const rgb = ([r, g, b]: [number, number, number], alfa = 1) =>
  alfa === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alfa})`;

/** Oscurece hacia el negro del sistema, que es lo que hacía el CSS. */
function aLuz(
  tono: [number, number, number],
  fondo: [number, number, number],
  pct: number,
): [number, number, number] {
  const k = pct / 100;
  return [
    Math.round(tono[0] * k + fondo[0] * (1 - k)),
    Math.round(tono[1] * k + fondo[1] * (1 - k)),
    Math.round(tono[2] * k + fondo[2] * (1 - k)),
  ];
}

export function useMaquetaCanvas({
  activo,
  ruta,
}: {
  activo: string;
  ruta: [number, number][] | null;
}) {
  const marco = useRef<HTMLDivElement | null>(null);
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const rotulos = useRef<HTMLCanvasElement | null>(null);
  const [girada, setGirada] = useState(false);
  const [usada, setUsada] = useState(false);

  /** Todo lo que cambia por cuadro vive en refs: no dispara renders de React. */
  // El tipo va anotado porque `GIRO` es `as const`: sin esto TypeScript infiere
  // los literales -45 y 58 y despues rechaza cualquier angulo girado.
  const giro = useRef<{ z: number; x: number }>({ z: GIRO.z, x: GIRO.x });
  const construccion = useRef(0);
  const eco = useRef(new Map<string, number>());
  /** Opacidad de cada rótulo, para que apagarse sea gradual y no un parpadeo. */
  const velo = useRef(new Map<string, number>());
  const pintar = useRef<(() => void) | null>(null);
  const animarEcoRef = useRef<(() => void) | null>(null);
  /**
   * Cuenta las vueltas al reposo para poder cancelar la que esté corriendo.
   * Sin esto, agarrar la maqueta mientras vuelve dejaba dos cosas escribiendo el
   * mismo ángulo: el arrastre y la animación, peleándose cuadro por medio.
   */
  const vuelta = useRef(0);
  const activoRef = useRef(activo);
  const rutaRef = useRef(ruta);

  const volver = useCallback(() => {
    const desdeZ = giro.current.z;
    const desdeX = giro.current.x;
    if (!estaGirada(desdeZ, desdeX)) return;
    const t0 = performance.now();
    const propia = ++vuelta.current;
    const paso = () => {
      if (propia !== vuelta.current) return;
      const t = Math.min(1, (performance.now() - t0) / MS_VUELTA);
      const k = suave(t);
      // Por el camino corto: si alguien dio tres cuartos de vuelta, volver
      // deshaciendo el giro entero sería un mareo. Se interpola la diferencia
      // más chica entre los dos ángulos, que es como vuelve cualquier brújula.
      giro.current = {
        z: desdeZ + diferenciaDeAngulo(desdeZ, GIRO.z) * k,
        x: desdeX + (GIRO.x - desdeX) * k,
      };
      pintar.current?.();
      if (t < 1) requestAnimationFrame(paso);
      else setGirada(false);
    };
    requestAnimationFrame(paso);
  }, []);

  const volverYEnfocar = useCallback(() => {
    volver();
    // `preventScroll` NO es opcional acá. El botón de volver desaparece apenas
    // la maqueta llega a su posición, así que el foco tiene que ir a algún lado
    // o se cae al `body` y quien navega con teclado pierde el lugar. Pero
    // enfocar arrastra la página hasta el elemento, y eso daba un salto hacia
    // arriba al tocar el botón: se volvía la vista Y se movía el sitio.
    marco.current?.focus({ preventScroll: true });
  }, [volver]);

  useEffect(() => {
    const cont = marco.current;
    const cv = lienzo.current;
    const cvRot = rotulos.current;
    if (!cont || !cv || !cvRot) return;
    const ctx = cv.getContext("2d", { alpha: false });
    // El de los nombres SÍ lleva alfa: se apoya sobre el dibujo y tiene que
    // dejarlo ver. El de abajo no, que es más barato de componer.
    const ctxRot = cvRot.getContext("2d");
    if (!ctx || !ctxRot) return;
    const tinta = ctxRot;
    // Se fija la referencia ya estrechada: dentro de una declaracion `function`
    // TypeScript descarta el estrechamiento, porque el hoisting permite llamarla
    // antes de la comprobacion.
    const pincel = ctx;

    const estilo = getComputedStyle(cont);
    const paleta = Object.fromEntries(
      TOKENS.map((t) => [t, resolverColor(ctx, estilo.getPropertyValue(t))]),
    ) as Paleta;

    const fondo = paleta["--color-surface-sunken"];
    const tonoDe = (b: Bloque) =>
      b.tipo === "nave"
        ? paleta["--tono-nave"]
        : b.tipo === "stand"
          ? paleta["--tono-stand"]
          : b.tipo === "modulo"
            ? paleta["--tono-modulo"]
            : paleta["--tono-servicio"];

    let dpr = 1;
    let anchoCss = 0;
    let altoCss = 0;
    const camara: Camara = { giroZ: GIRO.z, giroX: GIRO.x, u: 1, cx: 0, cy: 0 };

    const medir = () => {
      if (!cv || !cont) return;
      // Se topa en 2: a 3 el lienzo de un celular pasa de cuatro millones de
      // píxeles y el costo de pintarlo se come lo que se gana por no usar DOM.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      anchoCss = cont.clientWidth;
      // La proporcion del lienzo y la escala salen de la MISMA medida: cuanto
      // ocupa la reticula proyectada en el peor angulo permitido. Asi el dibujo
      // entra siempre y no sobra lienzo vacio arriba ni abajo.
      const ext = extensionProyectada(LIMITE_GIRO.xMin, LIMITE_GIRO.xMax);
      altoCss = Math.round((anchoCss * ext.altoU) / ext.anchoU);
      cv.width = Math.round(anchoCss * dpr);
      cv.height = Math.round(altoCss * dpr);
      cv.style.height = `${altoCss}px`;
      cvRot.width = cv.width;
      cvRot.height = cv.height;
      cvRot.style.height = `${altoCss}px`;
      camara.u = (anchoCss * 0.96) / ext.anchoU;
      camara.cx = anchoCss / 2;
      camara.cy = altoCss / 2;
    };

    /**
     * Área con signo del polígono ya proyectado.
     *
     * Sirve para saber de qué lado se está mirando una cara: si el recorrido de
     * sus esquinas queda en un sentido, la cara mira a la cámara, y si queda en
     * el otro, mira para el lado contrario y siempre la tapa el propio bloque.
     * Es el criterio estándar de descarte de caras traseras y funciona en
     * cualquier ángulo, sin tablas ni casos especiales.
     */
    const areaConSigno = (pts: { x: number; y: number }[]) => {
      let a = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const q = pts[(i + 1) % pts.length];
        if (!p || !q) continue;
        a += p.x * q.y - q.x * p.y;
      }
      return a / 2;
    };

    const poligono = (pts: { x: number; y: number }[], color: string) => {
      pincel.beginPath();
      const p0 = pts[0];
      if (!p0) return;
      pincel.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (p) pincel.lineTo(p.x, p.y);
      }
      pincel.closePath();
      pincel.fillStyle = color;
      pincel.fill();
    };

    const linea = (
      pts: readonly (readonly [number, number])[],
      color: string,
      ancho: number,
      cerrar = false,
    ) => {
      if (pts.length < 2) return;
      pincel.beginPath();
      pts.forEach((p, i) => {
        const [rx, ry] = aReticula(p);
        const q = proyectar(camara, rx, ry);
        if (i === 0) pincel.moveTo(q.x, q.y);
        else pincel.lineTo(q.x, q.y);
      });
      if (cerrar) pincel.closePath();
      pincel.strokeStyle = color;
      pincel.lineWidth = ancho;
      pincel.lineJoin = "round";
      pincel.lineCap = "round";
      pincel.stroke();
    };

    /** Una elipse del suelo, proyectada como polígono de 24 lados. */
    const ovalo = (
      centro: readonly [number, number],
      rx: number,
      ry: number,
      color: string,
      relleno: boolean,
    ) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const [cx, cy] = aReticula(centro);
        pts.push(proyectar(camara, cx + (Math.cos(a) * rx) / 40, cy + (Math.sin(a) * ry) / 40));
      }
      if (relleno) {
        poligono(pts, color);
        return;
      }
      pincel.beginPath();
      pts.forEach((p, i) => (i === 0 ? pincel.moveTo(p.x, p.y) : pincel.lineTo(p.x, p.y)));
      pincel.closePath();
      pincel.strokeStyle = color;
      pincel.lineWidth = 1.4;
      pincel.stroke();
    };

    const dibujar = () => {
      if (!cv) return;
      // Se prende si alguna opacidad todavía está en camino: al final del cuadro
      // se pide otro, y así el fundido termina aunque nadie toque nada.
      let sigueAnimando = false;
      camara.giroZ = giro.current.z;
      camara.giroX = giro.current.x;
      pincel.setTransform(dpr, 0, 0, dpr, 0, 0);
      pincel.fillStyle = rgb(fondo);
      pincel.fillRect(0, 0, anchoCss, altoCss);

      const crece = construccion.current;

      // 1. La platea: el terreno completo.
      poligono(
        [
          proyectar(camara, 0, 0),
          proyectar(camara, RETICULA.columnas, 0),
          proyectar(camara, RETICULA.columnas, RETICULA.filas),
          proyectar(camara, 0, RETICULA.filas),
        ],
        rgb(paleta["--plano-terreno"]),
      );

      // 2. El pavimento de la parcela.
      const p = PARCELA_RETICULA;
      poligono(
        [
          proyectar(camara, p.x, p.y),
          proyectar(camara, p.x + p.w, p.y),
          proyectar(camara, p.x + p.w, p.y + p.h),
          proyectar(camara, p.x, p.y + p.h),
        ],
        rgb(paleta["--color-surface-overlay"]),
      );

      // 3. El dibujo del suelo: masas verdes, calles, rotonda y pista.
      for (const verde of VERDES) {
        poligono(
          verde.map((v) => {
            const [rx, ry] = aReticula(v);
            return proyectar(camara, rx, ry);
          }),
          rgb(paleta["--color-brand-cyan"], 0.1),
        );
      }
      linea(PARCELA, rgb(paleta["--color-brand-lavender"], 0.35), 1.2, true);
      for (const calle of CALLES_TRAZADO) {
        linea(calle, rgb(paleta["--color-border"], 0.9), Math.max(1, camara.u * 0.05));
      }
      ovalo(ROTONDA.centro, ROTONDA.r, ROTONDA.r, rgb(paleta["--color-border"], 0.9), false);
      ovalo(ARENA.centro, ARENA.rx, ARENA.ry, rgb(paleta["--color-brand-cyan"], 0.12), true);
      ovalo(ARENA.centro, ARENA.rx, ARENA.ry, rgb(paleta["--color-brand-cyan"], 0.45), false);

      // 4. El recorrido desde el acceso, si hay lugar elegido.
      const r = rutaRef.current;
      if (r && r.length > 1) {
        linea(r, rgb(paleta["--color-accent"]), Math.max(2, camara.u * 0.09));
      }

      // 5. Los volúmenes, de atrás hacia adelante con el ángulo actual.
      const orden = ordenarPorProfundidad(BLOQUES, camara, (b) => [b.x + b.w / 2, b.y + b.h / 2]);
      for (const b of orden) {
        const e = eco.current.get(b.id) ?? 0;
        const alto = b.volumen * crece;
        const base = e * 0.55;
        const tono = tonoDe(b);
        const esquina = (ix: number, iy: number, z: number) =>
          proyectar(camara, b.x + ix * b.w, b.y + iy * b.h, z);

        // Sombra: se queda en el piso y se aclara cuando el bloque se levanta.
        if (alto > 0.01) {
          const desp = { x: 0.06 * camara.u * alto, y: 0.3 * camara.u * alto };
          poligono(
            [esquina(0, 0, 0), esquina(1, 0, 0), esquina(1, 1, 0), esquina(0, 1, 0)].map((q) => ({
              x: q.x + desp.x,
              y: q.y + desp.y,
            })),
            rgb(paleta["--plano-sombra"], 0.72 * crece * (1 - 0.55 * e)),
          );
        }

        // Solo se pintan las dos paredes que miran a la cámara. Las otras dos
        // quedan siempre detrás del propio bloque, así que dibujarlas es
        // trabajo tirado: son 62 rellenos por cuadro sobre 186.
        for (const pared of PAREDES) {
          const cara = [
            esquina(pared.dx[0] ?? 0, pared.dy[0] ?? 0, base),
            esquina(pared.dx[1] ?? 0, pared.dy[1] ?? 0, base),
            esquina(pared.dx[2] ?? 0, pared.dy[2] ?? 0, base + alto),
            esquina(pared.dx[3] ?? 0, pared.dy[3] ?? 0, base + alto),
          ];
          if (areaConSigno(cara) <= 0) continue;
          poligono(cara, rgb(aLuz(tono, fondo, pared.luz)));
        }
        poligono(
          [
            esquina(0, 0, base + alto),
            esquina(1, 0, base + alto),
            esquina(1, 1, base + alto),
            esquina(0, 1, base + alto),
          ],
          rgb(e > 0.02 ? aLuz(tono, [255, 255, 255], 100 - e * 16) : tono),
        );
      }

      // 6. Dónde cae cada marcador, para ubicar los botones más abajo.
      const cajasMarcador = PUNTOS_RETICULA.map((pt) =>
        proyectar(camara, pt.x, pt.y, (pt.z ?? 0) + 0.12),
      );

      // 7. Los rótulos de los edificios.
      //
      // Van SOBRE el dibujo y siempre visibles, no en el cartel del marcador:
      // un plano donde nada tiene nombre hasta que lo tocás obliga a explorar a
      // ciegas. Se escriben horizontales aunque la maqueta gire, porque un
      // rótulo acostado con la perspectiva se vuelve ilegible justo en el
      // ángulo en el que uno está mirando.
      //
      // CADA RÓTULO SIEMPRE EN EL MISMO LUGAR DE SU EDIFICIO. NO SE MUEVEN.
      //
      // Hubo dos intentos de acomodarlos para que no se pisaran, y los dos
      // salieron peor que el problema. Primero se descartaba el que chocaba, y
      // los nombres desaparecían solos al girar. Después se probaban cinco
      // alturas antes de dibujar, y entonces alguno se iba lejos de su edificio
      // o se metía abajo, encima de los stands.
      //
      // El problema de fondo es que la referencia se mueve: si un rótulo cambia
      // de lugar según quién tenga al lado, deja de señalar lo que nombra, que
      // es lo único que un rótulo tiene que hacer. Que dos se rocen de vez en
      // cuando en algún ángulo se lee sin drama; que uno flote lejos del
      // edificio, no. Así que la posición es fija y nadie la negocia.
      //
      // El halo oscuro no es un efecto: el mismo texto cruza techos claros y
      // piso oscuro, así que sin contorno pierde contraste en alguno de los dos.
      // El cuerpo tiene piso además de techo, porque escalando solo con la
      // maqueta caía a 5px en un teléfono, que es donde más falta hace.
      const cuerpo = acotar(camara.u * 0.3, 11, 14);
      // El lienzo de los nombres se limpia entero: es transparente y se apoya
      // sobre el dibujo, así que lo que no se repinta deja ver lo de abajo.
      tinta.setTransform(dpr, 0, 0, dpr, 0, 0);
      tinta.clearRect(0, 0, anchoCss, altoCss);
      tinta.font = `600 ${cuerpo}px ${estilo.fontFamily}`;
      tinta.textAlign = "center";
      tinta.textBaseline = "middle";
      tinta.lineJoin = "round";
      // EL DESPEJE ESCALA CON LA MAQUETA, CON UN PISO MEDIDO.
      //
      // Antes eran 24 px fijos, calculados contra los 36 px del área táctil del
      // marcador. Pero el área táctil es invisible: lo que hay que esquivar es
      // el punto dibujado, que mide 16 px de diámetro. Y 24 px fijos, en un
      // teléfono, son 1,35 unidades del predio contra 0,53 en escritorio, así
      // que cada nombre se despegaba de su edificio y todos caían en la misma
      // franja horizontal.
      //
      // El piso de 17 px sale de sumar lo que de verdad hay que despejar: 8 de
      // radio del punto, 5,5 de media letra y 3 de aire.
      const despeje = Math.max(17, camara.u * 0.53);

      // Se resuelven primero las cajas de los nueve, en su posición fija.
      const cajas = GRUPOS_ROTULADOS.map((grupo) => {
        const e = eco.current.get(grupo.referencia) ?? 0;
        const q = proyectar(camara, grupo.x, grupo.y, grupo.alto * crece + e * 0.55);
        return {
          grupo,
          x: q.x,
          y: q.y - despeje,
          /** Profundidad ya rotada: a mayor valor, más cerca de la cámara. */
          z: q.z,
          ancho: tinta.measureText(grupo.rotulo).width,
          elegido: grupo.id === activoRef.current,
        };
      });

      // CUANDO DOS NOMBRES SE PISAN DE VERDAD, EL DE ATRÁS SE ATENÚA.
      //
      // "De verdad" es la parte que costó. La primera versión medía CERCANÍA con
      // un margen generoso, y apagaba nombres que a la vista no se tocaban:
      // "Stands A" desaparecía teniendo lugar de sobra. Ahora se calcula el
      // solape real de las dos cajas de texto y hace falta que se monten unos
      // píxeles para que una ceda.
      //
      // Ninguno se mueve ni se borra: mover el rótulo lo desprende de lo que
      // nombra, y borrarlo deja al lugar sin nombre. Lo que cede es la
      // PRESENCIA del que está más lejos de la cámara, que es el que de todos
      // modos queda detrás en el dibujo. El lugar elegido nunca se atenúa: es el
      // que el visitante fue a mirar.
      //
      // La atenuación es gradual, interpolando la opacidad cuadro a cuadro, así
      // que al girar los nombres se funden en vez de parpadear.
      // EN PANTALLA CHICA SE NOMBRA SOLO EL LUGAR ELEGIDO.
      // No es que se escondan los otros ocho: es que no entran. El porqué, con
      // los números, está en `U_MINIMA_PARA_NUEVE`. El corte es por escala del
      // dibujo y no por ancho de pantalla, porque lo que decide es cuánto pesa
      // la letra sobre la maqueta, no cuántos píxeles mide el teléfono.
      const rotulados = camara.u < U_MINIMA_PARA_NUEVE ? cajas.filter((c) => c.elegido) : cajas;

      const MONTE_MINIMO = 3;
      for (const caja of rotulados) {
        const tapado = rotulados.some((otra) => {
          if (otra === caja || caja.elegido) return false;
          if (!otra.elegido && otra.z <= caja.z) return false;
          const solapeX = (otra.ancho + caja.ancho) / 2 - Math.abs(otra.x - caja.x);
          const solapeY = cuerpo * 0.95 - Math.abs(otra.y - caja.y);
          return solapeX > MONTE_MINIMO && solapeY > MONTE_MINIMO;
        });
        const destino = tapado ? OPACIDAD_TAPADO : 1;
        const actual = velo.current.get(caja.grupo.id) ?? destino;
        const siguiente = actual + (destino - actual) * 0.2;
        const listo = Math.abs(destino - siguiente) <= 0.01;
        velo.current.set(caja.grupo.id, listo ? destino : siguiente);
        if (!listo) sigueAnimando = true;
      }

      // De atrás hacia adelante: si un rótulo atenuado se pintara último, su
      // halo oscuro ensuciaría al que tiene delante. Pintando por opacidad
      // creciente, el que manda queda entero arriba.
      const enOrden = [...rotulados].sort(
        (a, b) => (velo.current.get(a.grupo.id) ?? 1) - (velo.current.get(b.grupo.id) ?? 1),
      );
      for (const caja of enOrden) {
        const opacidad = velo.current.get(caja.grupo.id) ?? 1;
        if (opacidad < 0.02) continue;
        tinta.globalAlpha = opacidad;
        if (caja.elegido) {
          // EL LUGAR ELEGIDO VA EN CAJA, Y ES EL ÚNICO.
          // Es el destino del recorrido, así que se distingue del resto de los
          // nombres igual que se distinguía antes: fondo opaco y una raya del
          // color de acento al costado.
          const alto = cuerpo * 1.9;
          const pad = cuerpo * 0.6;
          const izq = caja.x - caja.ancho / 2 - pad;
          const arriba = caja.y - alto / 2;
          tinta.fillStyle = rgb(paleta["--color-surface-overlay"]);
          tinta.fillRect(izq, arriba, caja.ancho + pad * 2, alto);
          tinta.fillStyle = rgb(paleta["--color-accent"]);
          tinta.fillRect(izq, arriba, Math.max(2, cuerpo * 0.22), alto);
          tinta.fillStyle = rgb(paleta["--color-text"]);
          tinta.fillText(caja.grupo.rotulo, caja.x + pad / 2, caja.y);
        } else {
          // El halo oscuro no es un efecto: el mismo texto cruza techos claros y
          // piso oscuro, así que sin contorno pierde contraste en alguno.
          tinta.lineWidth = Math.max(2, cuerpo * 0.3);
          tinta.strokeStyle = rgb(fondo, 0.9);
          tinta.strokeText(caja.grupo.rotulo, caja.x, caja.y);
          tinta.fillStyle = rgb(paleta["--color-text"]);
          tinta.fillText(caja.grupo.rotulo, caja.x, caja.y);
        }
        tinta.globalAlpha = 1;
      }

      // 8. El mástil del acceso.
      const pieHito = proyectar(camara, HITO.x, HITO.y, 0);
      const puntaHito = proyectar(camara, HITO.x, HITO.y, 1.15 * crece);
      pincel.beginPath();
      pincel.moveTo(pieHito.x, pieHito.y);
      pincel.lineTo(puntaHito.x, puntaHito.y);
      pincel.strokeStyle = rgb(paleta["--color-accent"]);
      pincel.lineWidth = 2;
      pincel.stroke();

      // 9. Los marcadores son botones de HTML: acá solo se los reubica, con las
      // posiciones que ya se calcularon para esquivarlos al rotular.
      const botones = cont?.querySelectorAll<HTMLElement>(".plano-punto");
      if (botones) {
        cajasMarcador.forEach((punto, i) => {
          const boton = botones[i];
          if (!boton) return;
          boton.style.left = `${punto.x}px`;
          boton.style.top = `${punto.y}px`;
          // UN NOMBRE POR LUGAR, NUNCA DOS.
          //
          // El cartel del marcador existe para decir cómo se llama el lugar. Si
          // el nombre ya quedó escrito sobre el edificio, el cartel lo repite:
          // pasaba al pasar el mouse por un pabellón rotulado, que mostraba
          // "Pabellón techado" dos veces, una en el dibujo y otra en el globo.
          //
          // El lienzo es el único que sabe qué rótulos entraron en este cuadro,
          // porque depende del ángulo y del espacio, así que se lo cuenta al
          // botón con un atributo y el CSS decide. Al revés no se puede: el
          // dibujo no se entera de que alguien está pasando el mouse.
        });
      }

      if (sigueAnimando) solicitar();
    };

    pintar.current = dibujar;

    // ── Animaciones ────────────────────────────────────────────────────────
    let vivo = true;
    let pedido = 0;
    let soltarObservador: (() => void) | undefined;
    const solicitar = () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => {
        pedido = 0;
        if (vivo) dibujar();
      });
    };

    /** Lleva el eco de cada bloque hacia su destino y redibuja mientras cambie. */
    const animarEco = () => {
      let sigue = false;
      for (const b of BLOQUES) {
        const destino = b.punto && b.punto === activoRef.current ? 1 : 0;
        const actual = eco.current.get(b.id) ?? 0;
        const siguiente = actual + (destino - actual) * 0.18;
        if (Math.abs(destino - siguiente) > 0.004) sigue = true;
        eco.current.set(b.id, Math.abs(destino - siguiente) <= 0.004 ? destino : siguiente);
      }
      dibujar();
      if (sigue && vivo) requestAnimationFrame(animarEco);
    };
    animarEcoRef.current = animarEco;

    medir();

    // Construcción: una sola vez, cuando la sección entra en pantalla. Con
    // movimiento reducido la maqueta aparece ya construida.
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) {
      construccion.current = 1;
      dibujar();
    } else {
      const observador = new IntersectionObserver(
        ([entrada]) => {
          if (!entrada?.isIntersecting) return;
          observador.disconnect();
          const t0 = performance.now();
          const paso = () => {
            const t = Math.min(1, (performance.now() - t0) / MS_CONSTRUCCION);
            construccion.current = suave(t);
            dibujar();
            if (t < 1 && vivo) requestAnimationFrame(paso);
          };
          requestAnimationFrame(paso);
        },
        { threshold: 0.05 },
      );
      observador.observe(cont);
      dibujar();
      soltarObservador = () => observador.disconnect();
    }

    const observadorTamano = new ResizeObserver(() => {
      medir();
      solicitar();
    });
    observadorTamano.observe(cont);

    // ── Giro ───────────────────────────────────────────────────────────────
    let origen: { x: number; y: number } | null = null;
    /**
     * Ángulo que tenía la maqueta al empezar ESTE arrastre. Ver `alBajar`.
     * El tipo va anotado porque `GIRO` es `as const` y si no TypeScript lo fija
     * en los literales -45 y 58.
     */
    let desde: { z: number; x: number } = { z: GIRO.z, x: GIRO.x };
    let movio = false;

    const alBajar = (e: PointerEvent) => {
      if (e.button !== 0 || reducido) return;
      origen = { x: e.clientX, y: e.clientY };
      // DESDE DÓNDE GIRA ESTE ARRASTRE.
      //
      // Se guarda el ángulo que la maqueta tiene AHORA, al agarrarla. Antes el
      // arrastre se calculaba siempre desde la posición de reposo, así que al
      // volver a tomarla después de haberla girado, el primer píxel de
      // movimiento la teletransportaba al reposo más el desplazamiento. El error
      // estaba desde el principio y quedaba tapado porque soltar la devolvía
      // sola; al dejarla quedarse donde la sueltan, salió a la luz.
      desde = { ...giro.current };
      // Si venía volviendo por su cuenta, el arrastre manda: se invalida esa
      // animación para que no siga escribiendo el ángulo por debajo.
      vuelta.current++;
      movio = false;
      try {
        cont.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura */
      }
    };

    const alMover = (e: PointerEvent) => {
      if (!origen) return;
      const dx = e.clientX - origen.x;
      const dy = e.clientY - origen.y;
      if (!movio) {
        if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
        movio = true;
        cont.dataset.arrastre = "";
        setUsada(true);
      }
      // EL GIRO EN Z ES LIBRE, LA VUELTA ENTERA.
      // Antes estaba acotado a 35 grados con el argumento de que más allá una de
      // las dos caras visibles queda de canto. Eso era cierto cuando el dibujo
      // lo hacía CSS con un orden de apilado fijo: pasado cierto ángulo los
      // bloques se tapaban mal. En el lienzo el orden se calcula con el ángulo
      // de cada cuadro y las caras traseras se descartan por área con signo, así
      // que el dibujo es correcto mire desde donde mire. El tope ya no defiende
      // nada y sí impedía ver el predio desde el otro lado.
      giro.current = {
        z: desde.z - dx * POR_PIXEL.z,
        x: acotar(desde.x - dy * POR_PIXEL.x, LIMITE_GIRO.xMin, LIMITE_GIRO.xMax),
      };
      solicitar();
    };

    /**
     * Al soltar, LA MAQUETA SE QUEDA DONDE LA DEJARON.
     *
     * Antes volvía sola a la posición original apenas se levantaba el dedo, y
     * eso hacía imposible lo único para lo que sirve girarla: mirar el predio
     * desde otro ángulo. Había que sostener el gesto para poder ver, o sea que
     * en un teléfono se miraba con el dedo tapando el dibujo.
     *
     * La vuelta sigue estando, pero como decisión de quien mira: el botón
     * aparece justamente cuando hay algo a lo que volver, y con teclado la
     * devuelven Inicio y Escape. Es la misma regla que ya regía el giro por
     * teclado, que nunca volvía solo.
     */
    const soltar = () => {
      if (!origen) return;
      origen = null;
      delete cont.dataset.arrastre;
      if (movio) setGirada(estaGirada(giro.current.z, giro.current.x));
    };

    const alTeclear = (e: KeyboardEvent) => {
      if (reducido) return;
      if (e.key === "Home" || e.key === "Escape") {
        if (!estaGirada(giro.current.z, giro.current.x)) return;
        e.preventDefault();
        volver();
        return;
      }
      const paso = PASO_TECLADO[e.key];
      if (!paso) return;
      e.preventDefault();
      vuelta.current++;
      giro.current = {
        z: giro.current.z + paso[0],
        x: acotar(giro.current.x + paso[1], LIMITE_GIRO.xMin, LIMITE_GIRO.xMax),
      };
      setGirada(true);
      setUsada(true);
      solicitar();
    };

    // Salir con el teclado tampoco devuelve la maqueta. Antes sí, y era
    // coherente con que soltar el arrastre también la devolviera; ahora que se
    // queda donde la dejaron, resetearla al mover el foco sería quitarle al
    // visitante algo que eligió. Vuelve con el botón, con Inicio o con Escape.

    const alHacerClic = (e: MouseEvent) => {
      if (!movio) return;
      e.preventDefault();
      e.stopPropagation();
      movio = false;
    };

    cont.addEventListener("pointerdown", alBajar);
    cont.addEventListener("pointermove", alMover);
    cont.addEventListener("pointerup", soltar);
    cont.addEventListener("pointercancel", soltar);
    cont.addEventListener("lostpointercapture", soltar);
    cont.addEventListener("keydown", alTeclear);
    cont.addEventListener("click", alHacerClic, true);

    return () => {
      vivo = false;
      pintar.current = null;
      if (pedido) cancelAnimationFrame(pedido);
      observadorTamano.disconnect();
      soltarObservador?.();
      cont.removeEventListener("pointerdown", alBajar);
      cont.removeEventListener("pointermove", alMover);
      cont.removeEventListener("pointerup", soltar);
      cont.removeEventListener("pointercancel", soltar);
      cont.removeEventListener("lostpointercapture", soltar);
      cont.removeEventListener("keydown", alTeclear);
      cont.removeEventListener("click", alHacerClic, true);
    };
  }, [volver]);

  /**
   * Al cambiar el lugar elegido, el bloque señalado se levanta.
   *
   * Los dos refs se escriben ACÁ y no durante el render: el dibujo corre fuera
   * del ciclo de React y necesita el valor actual, pero escribir un ref mientras
   * React renderiza es justamente lo que rompe con el compilador activado.
   */
  useEffect(() => {
    activoRef.current = activo;
    rutaRef.current = ruta;
    animarEcoRef.current?.();
  }, [activo, ruta]);

  return { marco, lienzo, rotulos, girada, usada, volver: volverYEnfocar };
}
