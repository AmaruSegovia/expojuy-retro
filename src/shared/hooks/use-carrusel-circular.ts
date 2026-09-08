"use client";

import { useState, type TransitionEvent } from "react";

type Opciones = {
  /** Porcentaje del ancho visible que ocupa una tarjeta. El resto es el asomo. */
  anchoTarjeta?: number;
  /** Separación entre tarjetas, en rem. Entra en la cuenta del desplazamiento. */
  separacionRem?: number;
  /** Cuántas veces se monta la lista en el riel. Tres es lo mínimo que cicla. */
  repeticiones?: number;
};

/**
 * Carrusel circular con asomo: una tarjeta al frente y un pedazo de la anterior
 * y la siguiente a los costados, girando en los dos sentidos sin saltos.
 *
 * VIVE EN shared/ PORQUE LO USAN TRES FEATURES: las láminas de "Sobre ExpoJuy",
 * el riel de lugares del Mapa y las tarjetas de Noticias. La frontera de
 * arquitectura prohíbe que un feature importe de otro, así que lo compartido
 * sube acá. Solo sube la MÁQUINA DE ESTADOS: el marcado y el aspecto de cada
 * tarjeta son de cada feature, porque no se parecen en nada.
 *
 * CÓMO SE LOGRA EL CICLO SIN SALTOS
 *
 * El riel monta la lista TRES VECES y trabaja siempre sobre la copia del medio.
 * La posición es un contador que puede salirse del rango: desde la última,
 * "siguiente" lleva a la posición N, que en el riel cae sobre la primera
 * tarjeta de la tercera copia. El desplazamiento sigue siendo hacia adelante y
 * se ve natural.
 *
 * Cuando esa transición termina, la posición se normaliza al rango real y el
 * riel se recoloca sobre la copia del medio. Ese reacomodo es invisible porque
 * muestra exactamente la misma tarjeta en el mismo lugar de la pantalla.
 *
 * EL REACOMODO NO USA TEMPORIZADORES
 *
 * Mientras está pendiente, la transición queda desactivada; se vuelve a activar
 * recién en el siguiente movimiento que pida el usuario, dentro de la misma
 * actualización de estado que cambia la posición. Así no hace falta ningún
 * `requestAnimationFrame` ni `setTimeout` para "esperar un frame", que es donde
 * este patrón suele volverse frágil.
 */
export function useCarruselCircular<T>(items: T[], opciones: Opciones = {}) {
  const { anchoTarjeta = 80, separacionRem = 1, repeticiones = 3 } = opciones;
  const total = items.length;
  const [posicion, setPosicion] = useState(0);
  const [reacomodando, setReacomodando] = useState(false);

  /** Índice real de la tarjeta que se está mostrando. */
  const activo = ((posicion % total) + total) % total;

  const mover = (destino: number) => {
    // Reactivar la transición y mover, todo en la misma actualización: React
    // las agrupa en un solo render, así que el movimiento sale animado.
    setReacomodando(false);
    setPosicion(destino);
  };

  /**
   * Va al índice pedido POR EL LADO MÁS CORTO del anillo. De la última a la
   * primera se avanza uno hacia adelante, no N−1 hacia atrás.
   */
  const irA = (indice: number) => {
    const adelante = (indice - activo + total) % total;
    mover(posicion + (adelante <= total / 2 ? adelante : adelante - total));
  };

  const alTerminarTransicion = (e: TransitionEvent) => {
    // Solo interesa la del propio riel; las opacidades de las tarjetas también
    // burbujean hasta acá.
    if (e.target !== e.currentTarget || e.propertyName !== "translate") return;
    if (posicion >= 0 && posicion < total) return;
    setReacomodando(true);
    setPosicion(activo);
  };

  const posibleEnRiel = posicion + total;
  // RED DE SEGURIDAD. La normalización depende de que llegue `transitionend`, y
  // hay casos en los que no llega: clics muy rápidos que interrumpen la
  // transición anterior, o una pestaña en segundo plano, donde el navegador
  // directamente no ejecuta transiciones. Si la posición se escapara del riel,
  // no habría ninguna tarjeta que mostrar. Ante la duda se cae a la copia del
  // medio, que siempre existe.
  const enRiel =
    posibleEnRiel >= 0 && posibleEnRiel < total * repeticiones ? posibleEnRiel : activo + total;

  const desplazamiento = `calc(10% - ${enRiel * anchoTarjeta}% - ${enRiel * separacionRem}rem)`;
  const repetidos = Array.from({ length: repeticiones }, () => items).flat();

  return {
    /** Índice real de la tarjeta al frente. */
    activo,
    /** Índice dentro del riel repetido, para saber cuál está al frente. */
    enRiel,
    /** La lista montada `repeticiones` veces. */
    repetidos,
    /** Si el riel se está recolocando: hay que desactivar las transiciones. */
    reacomodando,
    /** Valor para la propiedad `translate` del riel. */
    desplazamiento,
    posicion,
    total,
    mover,
    irA,
    alTerminarTransicion,
  };
}
