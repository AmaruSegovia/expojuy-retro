"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GIRO, LIMITE_GIRO } from "../constants/plano";

const acotar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Grados de giro por píxel arrastrado. Distintos por eje porque la maqueta es
 *  más ancha que alta: con el mismo factor, el volcado se sentía brusco. */
const POR_PIXEL = { z: 0.25, x: 0.15 };

/** Umbral que distingue un clic de un arrastre. */
const UMBRAL_ARRASTRE = 4;

/** Flechas del teclado: 5 grados de giro y 3 de inclinación por pulsación. */
const PASO_TECLADO: Record<string, [number, number]> = {
  ArrowLeft: [5, 0],
  ArrowRight: [-5, 0],
  ArrowUp: [0, 3],
  ArrowDown: [0, -3],
};

/**
 * GIRAR LA MAQUETA.
 *
 * Es el único JavaScript del plano y es mejora progresiva pura: sin él la
 * maqueta es el mismo dibujo, quieto.
 *
 * MANIPULACIÓN DIRECTA. Mientras se arrastra, el ángulo de la escena sigue al
 * puntero: hasta 35 grados a cada lado en Z y entre 50 y 66 de inclinación. No
 * más: pasados los 35 una de las dos caras visibles queda de canto y la maqueta
 * se aplana en un plano con rayas. El giro sirve para mirar alrededor, no para
 * dar la vuelta.
 *
 * LA VUELTA ES UNA TRANSICIÓN, NO UNA ANIMACIÓN ESCRITA. Al soltar, este hook
 * solo QUITA el valor en línea. Como `--giro-z` y `--giro-x` están registradas
 * con `@property`, la variable vuelve al valor de la hoja de estilos y el
 * navegador interpola. Escena, marcadores y carteles leen la misma variable y
 * vuelven todos juntos, sin que nadie coordine nada. Por eso todo esto entra en
 * poco más de un kilobyte.
 *
 * UN ARRASTRE NO ES UN CLIC. Hay un manejador de `click` en fase de CAPTURA que
 * lo cancela si el puntero se movió: sin eso, soltar el arrastre encima de un
 * marcador cambiaría el lugar elegido.
 *
 * `prefers-reduced-motion` no lo atenúa: lo apaga. No se registra un solo
 * listener y la maqueta queda en su posición isométrica.
 */
export function useGiroMaqueta() {
  const maqueta = useRef<HTMLDivElement | null>(null);
  // El tipo va anotado a mano porque `GIRO` es `as const`: sin esto, TypeScript
  // infiere los literales -45 y 58 y después rechaza cualquier ángulo girado.
  const giro = useRef<{ z: number; x: number }>({ z: GIRO.z, x: GIRO.x });
  /** Solo para mostrar el botón de vuelta, que aparece con el giro por teclado. */
  const [girada, setGirada] = useState(false);
  /** La pista se va con el primer gesto, sea de puntero o de teclado. */
  const [usada, setUsada] = useState(false);

  const volver = useCallback(() => {
    const el = maqueta.current;
    if (!el) return;
    giro.current = { z: GIRO.z, x: GIRO.x };
    el.style.removeProperty("--giro-z");
    el.style.removeProperty("--giro-x");
    setGirada(false);
  }, []);

  const volverYEnfocar = useCallback(() => {
    volver();
    maqueta.current?.focus();
  }, [volver]);

  useEffect(() => {
    const el = maqueta.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let origen: { x: number; y: number } | null = null;
    let movio = false;

    const aplicar = (mostrarVuelta: boolean) => {
      el.style.setProperty("--giro-z", `${giro.current.z}deg`);
      el.style.setProperty("--giro-x", `${giro.current.x}deg`);
      setGirada(mostrarVuelta && (giro.current.z !== GIRO.z || giro.current.x !== GIRO.x));
    };

    const alBajar = (e: PointerEvent) => {
      if (e.button !== 0) return;
      origen = { x: e.clientX, y: e.clientY };
      movio = false;
      // La captura hace que el arrastre siga aunque el puntero salga del plano.
      // Si no hay puntero activo con ese id -eventos sintéticos- el giro
      // funciona igual, solo que sin captura.
      try {
        el.setPointerCapture(e.pointerId);
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
        el.dataset.arrastre = "";
        setUsada(true);
      }
      // Arrastrar a la izquierda trae hacia la izquierda la esquina cercana, y
      // arrastrar hacia arriba levanta el frente. Es la convención de cualquier
      // visor 3D, igual con mouse que con dedo.
      giro.current = {
        z: acotar(GIRO.z - dx * POR_PIXEL.z, GIRO.z - LIMITE_GIRO.z, GIRO.z + LIMITE_GIRO.z),
        x: acotar(GIRO.x - dy * POR_PIXEL.x, LIMITE_GIRO.xMin, LIMITE_GIRO.xMax),
      };
      aplicar(false);
    };

    const soltar = () => {
      if (!origen) return;
      origen = null;
      delete el.dataset.arrastre;
      volver();
    };

    const alTeclear = (e: KeyboardEvent) => {
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
      aplicar(true);
      setUsada(true);
    };

    // El giro queda mientras el foco esté en la maqueta o en uno de sus
    // marcadores, y se devuelve al salir.
    const alSalirElFoco = (e: FocusEvent) => {
      const destino = e.relatedTarget as Node | null;
      if (destino && el.contains(destino)) return;
      volver();
    };

    const alHacerClic = (e: MouseEvent) => {
      if (!movio) return;
      e.preventDefault();
      e.stopPropagation();
      movio = false;
    };

    const evitar = (e: Event) => e.preventDefault();

    el.addEventListener("pointerdown", alBajar);
    el.addEventListener("pointermove", alMover);
    el.addEventListener("pointerup", soltar);
    el.addEventListener("pointercancel", soltar);
    el.addEventListener("lostpointercapture", soltar);
    el.addEventListener("keydown", alTeclear);
    el.addEventListener("focusout", alSalirElFoco);
    el.addEventListener("click", alHacerClic, true);
    // Sin esto el navegador querría arrastrar el dibujo como imagen.
    el.addEventListener("dragstart", evitar);

    return () => {
      el.removeEventListener("pointerdown", alBajar);
      el.removeEventListener("pointermove", alMover);
      el.removeEventListener("pointerup", soltar);
      el.removeEventListener("pointercancel", soltar);
      el.removeEventListener("lostpointercapture", soltar);
      el.removeEventListener("keydown", alTeclear);
      el.removeEventListener("focusout", alSalirElFoco);
      el.removeEventListener("click", alHacerClic, true);
      el.removeEventListener("dragstart", evitar);
    };
  }, [volver]);

  return { maqueta, girada, usada, volver: volverYEnfocar };
}
