"use client";

import { useEffect, useRef } from "react";

/**
 * Deja arrastrar el riel del bento con el dedo y, al soltar, lo devuelve a su
 * movimiento automático DESDE DONDE QUEDÓ.
 *
 * SE MUEVE EL RELOJ DE LA ANIMACIÓN, NO EL ELEMENTO
 *
 * La versión anterior apagaba la animación (`animation: none`), escribía el
 * `translate` a mano y al soltar la reenganchaba con un `animation-delay`
 * negativo. Funcionaba en el papel y saltaba en la práctica: era reconstruir a
 * mano un estado que el navegador ya tiene, y cualquier discrepancia entre la
 * fracción calculada y la real se veía como un salto.
 *
 * Acá se arrastra la MISMA animación: `riel.getAnimations()` devuelve el objeto
 * que el navegador ya está reproduciendo, y arrastrar es mover su
 * `currentTime`. Al soltar alcanza con `play()`. La continuidad no se calcula,
 * está garantizada: nunca se creó una animación nueva de la cual empalmar.
 *
 * Como el recorrido es un bucle, el tiempo se lleva con módulo: pasarse del
 * final entra por el principio y nunca se ve un borde.
 *
 * EL ARRASTRE NO TOCA EL ESTADO DE REPRODUCCIÓN. NUNCA.
 *
 * Llamar a `Animation.pause()` le quita a CSS la autoridad sobre esa animación
 * PARA SIEMPRE: `animation-play-state` deja de gobernarla, y se puede ver la
 * propiedad computada en `running` con el objeto obstinadamente en `paused`.
 * Como el botón de pausa funciona por CSS, el arrastre le arrancaba el volante
 * y después el botón no volvía a arrancar nada.
 *
 * Por eso acá la API se usa para UNA sola cosa —mover el reloj, que es lo
 * único que CSS no sabe hacer— y el pausar/reanudar queda entero del lado del
 * CSS: durante el arrastre se marca `data-arrastrando` en el contenedor y al
 * soltar se quita. Quién manda sobre el movimiento es siempre la hoja de
 * estilos, así que el botón conserva su autoridad y una pausa pedida por el
 * usuario sobrevive al arrastre sin ninguna lógica que la recuerde.
 *
 * ACCESIBILIDAD — WCAG 2.5.7 pide que todo lo que se haga arrastrando tenga
 * una alternativa de un solo toque. Se cumple sin agregar nada: el contenido se
 * mueve solo, así que arrastrar nunca es la ÚNICA forma de llegar a un
 * expositor; es un atajo para adelantar.
 */
export function useArrastreRiel<V extends HTMLElement, R extends HTMLElement>(activo: boolean) {
  const refVentana = useRef<V>(null);
  const refRiel = useRef<R>(null);

  useEffect(() => {
    const ventana = refVentana.current;
    const riel = refRiel.current;
    if (!ventana || !riel || !activo) return;

    const contenedor = riel.closest(".bento");
    let animacion: Animation | null = null;
    let arrastrando = false;
    let yInicial = 0;
    let tInicial = 0;
    let duracion = 0;

    const alApoyar = (e: PointerEvent) => {
      // Con `prefers-reduced-motion` no hay animación: no hay nada que
      // arrastrar, y tampoco hace falta —ahí la columna se despliega entera.
      const [a] = riel.getAnimations();
      if (!a) return;
      const d = Number(a.effect?.getComputedTiming().duration ?? 0);
      if (!d) return;

      animacion = a;
      duracion = d;
      tInicial = Number(a.currentTime ?? 0);
      yInicial = e.clientY;
      arrastrando = true;
      // Pausa POR CSS, no por API. Ver el encabezado.
      contenedor?.setAttribute("data-arrastrando", "");

      // AL FINAL Y DENTRO DE UN try: `setPointerCapture` lanza NotFoundError si
      // el pointerId no corresponde a un puntero activo. Si estuviera antes,
      // esa excepción abortaría el handler dejando el arrastre a medias —la
      // animación sin pausar y el estado inicial sin registrar—, y al soltar se
      // reengancharía desde una fracción que ya no es la real. Ese era el salto.
      try {
        ventana.setPointerCapture(e.pointerId);
      } catch {
        // Sin captura el arrastre funciona igual mientras el dedo no se vaya
        // fuera de la ventana. Degradar es mejor que romper.
      }
    };

    const alMover = (e: PointerEvent) => {
      if (!arrastrando || !animacion) return;
      // Media vuelta del riel es un ciclo completo de la animación, así que la
      // regla de tres va de píxeles de dedo a milisegundos de reloj.
      const medioRiel = riel.getBoundingClientRect().height / 2;
      if (!medioRiel) return;
      // Hacia abajo el dedo devuelve contenido: el reloj retrocede.
      const avance = ((e.clientY - yInicial) / medioRiel) * duracion;
      const t = tInicial - avance;
      animacion.currentTime = ((t % duracion) + duracion) % duracion;
    };

    const alSoltar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      animacion = null;
      // Quitar la marca alcanza: el CSS resuelve solo si toca seguir o quedar
      // quieto, según el botón. Si el usuario había pausado, sigue pausado sin
      // que haya que recordarlo en ningún lado.
      contenedor?.removeAttribute("data-arrastrando");
    };

    ventana.addEventListener("pointerdown", alApoyar);
    ventana.addEventListener("pointermove", alMover);
    ventana.addEventListener("pointerup", alSoltar);
    ventana.addEventListener("pointercancel", alSoltar);

    return () => {
      ventana.removeEventListener("pointerdown", alApoyar);
      ventana.removeEventListener("pointermove", alMover);
      ventana.removeEventListener("pointerup", alSoltar);
      ventana.removeEventListener("pointercancel", alSoltar);
      // Que un desmontaje a mitad de arrastre no deje el riel clavado.
      contenedor?.removeAttribute("data-arrastrando");
    };
  }, [activo]);

  return { refVentana, refRiel };
}
