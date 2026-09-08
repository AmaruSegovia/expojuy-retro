"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

/**
 * ARRASTRE PARA EL CARRUSEL CIRCULAR.
 *
 * POR QUÉ ES UN ENVOLTORIO Y NO UN CAMBIO EN `useCarruselCircular`
 *
 * Ese hook vive en `shared/` y lo comparten tres secciones. Sumarle arrastre
 * lo obligaría a conocer el DOM -hoy no toca un solo elemento, solo devuelve
 * números y strings-, así que el arrastre vive acá, en el slice que lo pide, y
 * se compone por encima: mide el gesto, y cuando el gesto termina le pide al
 * hook compartido un `mover()` de un paso. La máquina de estados del ciclo
 * sigue siendo una sola.
 *
 * POR QUÉ NO SECUESTRA EL SCROLL DE LA PÁGINA
 *
 * Por `touch-action: pan-y` en la pista (ver styles.css), no por JavaScript.
 * Con esa declaración el navegador se queda con el desplazamiento VERTICAL y
 * lo resuelve él, en su hilo, sin pasar por acá; si el dedo arranca hacia
 * abajo, el navegador cancela el flujo de punteros y llega `pointercancel`.
 * Solo el gesto horizontal nos llega. Es la única forma de cumplirlo sin
 * `preventDefault` sobre eventos táctiles, que es exactamente lo que la
 * memoria del prototipo de Astro prohíbe.
 *
 * EL UMBRAL ES RELATIVO AL ANCHO, CON PISO ABSOLUTO
 *
 * 12% del ancho visible del riel, nunca menos de 48px. En un teléfono de
 * 390px el 12% son 47px y el piso manda; en escritorio son ~120px. Un umbral
 * fijo se sentiría hipersensible en un monitor y duro en un teléfono.
 */

type Opciones = {
  /** Se le pide al carrusel avanzar `paso` posiciones. -1 o +1. */
  avanzar: (paso: number) => void;
};

export function useArrastreCarrusel({ avanzar }: Opciones) {
  /** Desplazamiento del gesto en píxeles. `null` cuando no se está arrastrando. */
  const [arrastre, setArrastre] = useState<number | null>(null);
  const [inicio, setInicio] = useState(0);

  const alBajarPuntero = (e: ReactPointerEvent<HTMLElement>) => {
    // Solo el puntero primario y, con mouse, solo el botón principal: el clic
    // derecho abre el menú contextual y dejaría el arrastre colgado.
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    // La captura garantiza que `pointerup` llegue aunque el dedo termine
    // fuera del riel. Sin esto, soltar sobre el margen deja el riel corrido.
    e.currentTarget.setPointerCapture(e.pointerId);
    setInicio(e.clientX);
    setArrastre(0);
  };

  const alMoverPuntero = (e: ReactPointerEvent<HTMLElement>) => {
    if (arrastre === null) return;
    setArrastre(e.clientX - inicio);
  };

  const alSoltarPuntero = (e: ReactPointerEvent<HTMLElement>) => {
    if (arrastre === null) return;
    const umbral = Math.max(48, e.currentTarget.clientWidth * 0.12);
    setArrastre(null);
    // Arrastrar hacia la izquierda trae la tarjeta siguiente.
    if (arrastre <= -umbral) avanzar(1);
    else if (arrastre >= umbral) avanzar(-1);
    // Si no llegó al umbral no se llama a nadie: el riel vuelve solo a su
    // posición al desaparecer el desplazamiento, y con transición.
  };

  const alCancelarPuntero = () => setArrastre(null);

  return {
    /** Si hay un gesto en curso: la transición del riel tiene que estar apagada. */
    arrastrando: arrastre !== null,
    /**
     * Compone el desplazamiento del gesto con el que calcula el carrusel.
     * El del carrusel viene como `calc(...)` con porcentajes y rem, así que
     * los dos se suman en CSS y no en JavaScript: acá no hay ni un píxel del
     * ancho del riel medido.
     */
    conArrastre: (desplazamiento: string) =>
      arrastre === null ? desplazamiento : `calc(${desplazamiento} + ${arrastre}px)`,
    manejadores: {
      onPointerDown: alBajarPuntero,
      onPointerMove: alMoverPuntero,
      onPointerUp: alSoltarPuntero,
      onPointerCancel: alCancelarPuntero,
    },
  };
}
