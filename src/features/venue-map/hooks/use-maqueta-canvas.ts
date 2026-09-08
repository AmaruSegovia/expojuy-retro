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

const acotar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
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
  const [girada, setGirada] = useState(false);
  const [usada, setUsada] = useState(false);

  /** Todo lo que cambia por cuadro vive en refs: no dispara renders de React. */
  // El tipo va anotado porque `GIRO` es `as const`: sin esto TypeScript infiere
  // los literales -45 y 58 y despues rechaza cualquier angulo girado.
  const giro = useRef<{ z: number; x: number }>({ z: GIRO.z, x: GIRO.x });
  const construccion = useRef(0);
  const eco = useRef(new Map<string, number>());
  const pintar = useRef<(() => void) | null>(null);
  const animarEcoRef = useRef<(() => void) | null>(null);
  const activoRef = useRef(activo);
  const rutaRef = useRef(ruta);

  const volver = useCallback(() => {
    const desdeZ = giro.current.z;
    const desdeX = giro.current.x;
    if (desdeZ === GIRO.z && desdeX === GIRO.x) return;
    const t0 = performance.now();
    const paso = () => {
      const t = Math.min(1, (performance.now() - t0) / MS_VUELTA);
      const k = suave(t);
      giro.current = {
        z: desdeZ + (GIRO.z - desdeZ) * k,
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
    marco.current?.focus();
  }, [volver]);

  useEffect(() => {
    const cont = marco.current;
    const cv = lienzo.current;
    if (!cont || !cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
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
      const ext = extensionProyectada(GIRO.z, LIMITE_GIRO.z, LIMITE_GIRO.xMin, LIMITE_GIRO.xMax);
      altoCss = Math.round((anchoCss * ext.altoU) / ext.anchoU);
      cv.width = Math.round(anchoCss * dpr);
      cv.height = Math.round(altoCss * dpr);
      cv.style.height = `${altoCss}px`;
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

      // 6. El mástil del acceso.
      const pieHito = proyectar(camara, HITO.x, HITO.y, 0);
      const puntaHito = proyectar(camara, HITO.x, HITO.y, 1.15 * crece);
      pincel.beginPath();
      pincel.moveTo(pieHito.x, pieHito.y);
      pincel.lineTo(puntaHito.x, puntaHito.y);
      pincel.strokeStyle = rgb(paleta["--color-accent"]);
      pincel.lineWidth = 2;
      pincel.stroke();

      // 7. Los marcadores son botones de HTML: acá solo se los reubica.
      const botones = cont?.querySelectorAll<HTMLElement>(".plano-punto");
      if (botones) {
        PUNTOS_RETICULA.forEach((pt, i) => {
          const boton = botones[i];
          if (!boton) return;
          const q = proyectar(camara, pt.x, pt.y, (pt.z ?? 0) + 0.12);
          boton.style.left = `${q.x}px`;
          boton.style.top = `${q.y}px`;
        });
      }
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
    let movio = false;

    const alBajar = (e: PointerEvent) => {
      if (e.button !== 0 || reducido) return;
      origen = { x: e.clientX, y: e.clientY };
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
      giro.current = {
        z: acotar(GIRO.z - dx * POR_PIXEL.z, GIRO.z - LIMITE_GIRO.z, GIRO.z + LIMITE_GIRO.z),
        x: acotar(GIRO.x - dy * POR_PIXEL.x, LIMITE_GIRO.xMin, LIMITE_GIRO.xMax),
      };
      solicitar();
    };

    const soltar = () => {
      if (!origen) return;
      origen = null;
      delete cont.dataset.arrastre;
      volver();
    };

    const alTeclear = (e: KeyboardEvent) => {
      if (reducido) return;
      if (e.key === "Home" || e.key === "Escape") {
        if (giro.current.z === GIRO.z && giro.current.x === GIRO.x) return;
        e.preventDefault();
        volver();
        return;
      }
      const paso = PASO_TECLADO[e.key];
      if (!paso) return;
      e.preventDefault();
      giro.current = {
        z: acotar(giro.current.z + paso[0], GIRO.z - LIMITE_GIRO.z, GIRO.z + LIMITE_GIRO.z),
        x: acotar(giro.current.x + paso[1], LIMITE_GIRO.xMin, LIMITE_GIRO.xMax),
      };
      setGirada(true);
      setUsada(true);
      solicitar();
    };

    const alSalirElFoco = (e: FocusEvent) => {
      const destino = e.relatedTarget as Node | null;
      if (destino && cont.contains(destino)) return;
      volver();
    };

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
    cont.addEventListener("focusout", alSalirElFoco);
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
      cont.removeEventListener("focusout", alSalirElFoco);
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

  return { marco, lienzo, girada, usada, volver: volverYEnfocar };
}
