"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Índice de la ficha que el usuario está mirando.
 *
 * Es lo que gobierna el marcador MIENTRAS el puntero no haya tomado el mando.
 * En un teléfono no lo toma nunca, así que ahí "la activa" solo puede
 * definirla el scroll.
 *
 * POR QUÉ ACÁ SÍ SIRVE `isIntersecting`
 *
 * El proyecto ya tropezó con esto en la línea de tiempo de Agenda: un
 * `rootMargin` negativo NO define una línea, define una FRANJA, y por eso
 * `isIntersecting` no sirve para preguntar "¿ya lo pasé?" —vuelve a `false`
 * cuando el elemento sale por arriba—. Acá la pregunta es otra: "¿está DENTRO
 * de la franja?", que es exactamente lo que `isIntersecting` contesta bien.
 * Mismo recorte que `useActiveSection`, y por el mismo motivo.
 *
 * POR QUÉ SE GUARDA UN CONJUNTO Y NO EL ÚLTIMO QUE ENTRÓ
 *
 * El observer solo informa los elementos que CAMBIARON, no todos los que están
 * intersectando. La franja la cruza una fila entera a la vez —dos fichas en un
 * teléfono, cuatro en escritorio—, así que quedarse con la última entrada del
 * callback elegiría una columna al azar según el orden en que el navegador
 * reporte. Con el conjunto de visibles y su mínimo, la regla es determinista:
 * manda la primera ficha —en orden del documento— de la fila que se mira.
 *
 * Si la grilla entera sale de la franja el conjunto queda vacío y el índice se
 * queda donde estaba: el marcador no tiene por qué volver al principio porque
 * la sección salió de pantalla.
 */
export function useFichaEnVista(cantidad: number) {
  const fichas = useRef<(HTMLElement | null)[]>([]);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const observadas = fichas.current.filter((el): el is HTMLElement => el !== null);
    if (observadas.length === 0) return;

    const visibles = new Set<number>();

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const i = Number((entrada.target as HTMLElement).dataset.indice);
          if (entrada.isIntersecting) visibles.add(i);
          else visibles.delete(i);
        }

        if (visibles.size === 0) return;
        const menor = Math.min(...visibles);
        // Solo se escribe si el valor cambió de verdad. El observer no dispara
        // por frame, pero la regla del proyecto es no re-renderizar de gusto.
        setIndice((actual) => (actual === menor ? actual : menor));
      },
      { rootMargin: "-45% 0px -55% 0px", threshold: 0 },
    );

    observadas.forEach((f) => observador.observe(f));
    return () => observador.disconnect();
  }, [cantidad]);

  /** Ref callback por ficha. El bloque no devuelve nada a propósito: en React
   *  19 lo que devuelve un ref callback se interpreta como su limpieza. */
  const registrar = (i: number) => (el: HTMLElement | null) => {
    fichas.current[i] = el;
  };

  return { indice, registrar };
}
