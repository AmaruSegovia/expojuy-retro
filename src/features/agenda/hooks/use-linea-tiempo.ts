"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/**
 * Dónde vive la "línea de lectura": la altura del viewport, en tanto por uno,
 * a la que consideramos que algo "ya se leyó".
 *
 * Es UN SOLO número para los dos hooks de este archivo, y ese es el motivo de
 * que convivan acá: el frente de la línea dibujada y el encendido de los nodos
 * tienen que cruzar exactamente la misma altura de pantalla. Si cada uno
 * tuviera su propia constante, el punto se encendería antes o después de que
 * la línea lo alcance y la ilusión de una sola cosa avanzando se rompe.
 */
const LINEA_LECTURA = 0.55;

const acotar01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Avance del trazado de la línea, 0→1, escrito como custom property.
 *
 * DOS DECISIONES DE RENDIMIENTO
 *
 * 1. NO hay `setState` por frame. El valor se escribe directo sobre una
 *    custom property del nodo vía ref, igual que la barra de progreso: React
 *    no se entera y el navegador solo recalcula el `stroke-dashoffset` del
 *    path, que es pintura, no layout.
 *
 * 2. NO hay `getBoundingClientRect` por frame. La posición y el alto de la
 *    lista se miden una vez y se recalculan solo cuando algo cambia de
 *    tamaño (ResizeObserver). Leer el rect en cada frame fuerza un
 *    recálculo de layout sincrónico justo cuando el hilo principal está
 *    ocupado interpolando el scroll suave; midiendo aparte, el frame de
 *    scroll queda en aritmética pura.
 *
 * MEJORA PROGRESIVA - el valor de reposo es 1 (línea completa) y la clase
 * `.js` lo baja a 0. Si el JavaScript no corre, la línea se ve entera en vez
 * de quedar invisible. Ver `.agenda-tiempo` en globals.css.
 */
export function useAvanceLinea<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const metricas = useRef({ top: 0, alto: 1 });
  const reducido = usePrefersReducedMotion();

  const escribir = useCallback((scroll: number) => {
    const el = ref.current;
    if (!el) return;
    const { top, alto } = metricas.current;
    // Cuánto de la lista quedó por encima de la línea de lectura.
    const avance = (scroll + window.innerHeight * LINEA_LECTURA - top) / alto;
    el.style.setProperty("--avance", String(acotar01(avance)));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Con movimiento reducido la línea no se dibuja: ya está dibujada. Quitar
    // la animación nunca debe quitar el contenido.
    if (reducido) {
      el.style.setProperty("--avance", "1");
      return;
    }

    const medir = () => {
      const r = el.getBoundingClientRect();
      metricas.current = { top: r.top + window.scrollY, alto: Math.max(1, r.height) };
      // Recalcular en el acto: si se entra por un ancla directo a #agenda,
      // no va a haber ningún evento de scroll que dispare el primer cálculo.
      escribir(window.scrollY);
    };

    medir();
    // Se observa el body y no solo la lista: el alto de la lista puede no
    // cambiar y aun así moverse su `top` porque creció algo de más arriba.
    const observador = new ResizeObserver(medir);
    observador.observe(document.body);
    return () => observador.disconnect();
  }, [reducido, escribir]);

  useLenis(({ scroll }) => {
    if (reducido) return;
    escribir(scroll);
  });

  return ref;
}

/**
 * Si el elemento ya cruzó la línea de lectura hacia arriba.
 *
 * NO SE USA `isIntersecting`, Y ESE ES EL PUNTO.
 *
 * El `rootMargin` recorta el borde inferior del viewport hasta LINEA_LECTURA,
 * pero eso no define una línea: define una FRANJA, la que va del borde
 * superior a esa altura. `isIntersecting` responde "¿está dentro de la
 * franja?", y vuelve a `false` cuando el elemento sale por arriba. Con eso,
 * los nodos que ya quedaron atrás se apagaban al alejarse: la línea dibujada
 * los cubría y ellos estaban grises. Se detectó midiendo -un nodo en
 * `top: -463px`, medio kilómetro por encima de la línea, reportaba `false`.
 *
 * Lo que se pregunta acá es "¿ya lo pasó?", y eso sale de la geometría:
 * el borde superior del elemento contra el borde inferior de la franja. El
 * `rootMargin` sigue haciendo falta, pero para otra cosa: es lo que hace que
 * el navegador AVISE justo en ese cruce, en los dos sentidos.
 *
 * Es un BOOLEANO, no un valor continuo: el `setState` corre una vez por
 * cruce, no una vez por frame.
 */
export function useCruzoLectura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [cruzo, setCruzo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        // `rootBounds` puede venir null en contextos aislados; el cálculo a
        // mano da lo mismo porque el recorte de abajo es exactamente este.
        const linea = entrada.rootBounds?.bottom ?? window.innerHeight * LINEA_LECTURA;
        const ahora = entrada.boundingClientRect.top <= linea;
        setCruzo((actual) => (actual === ahora ? actual : ahora));
      },
      { rootMargin: `0px 0px -${(1 - LINEA_LECTURA) * 100}% 0px`, threshold: 0 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return [ref, cruzo] as const;
}
