"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

// En el servidor no existe la preferencia del usuario. Devolvemos `false` para
// que el HTML emitido coincida con el primer render del cliente; si el usuario
// sí la tiene activada, useSyncExternalStore corrige en el mismo commit.
const getServerSnapshot = () => false;

/**
 * Lee `prefers-reduced-motion` de forma reactiva y sin desincronizarse de la
 * hidratación. Se usa para degradar animaciones en JS; las de CSS ya están
 * cubiertas por el media query de globals.css.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
