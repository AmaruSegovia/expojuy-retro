"use client";

import { useCallback, type MouseEvent } from "react";
import { useLenis } from "lenis/react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

/**
 * Manejador de click para los enlaces internos (`href="#seccion"`).
 *
 * BUG CORREGIDO: `preventDefault` INCONDICIONAL
 *
 * El manejador de origen cancelaba el evento siempre, y eso rompe los gestos
 * que el navegador ya resuelve bien: Ctrl+click y click con la rueda abren en
 * una pestaña nueva, Shift+click en una ventana nueva, Alt+click descarga. Con
 * el evento cancelado, las tres opciones desaparecían sin aviso. Acá se sale
 * antes de tocar nada si hay algún modificador o si el botón no es el
 * principal, y el navegador hace lo suyo.
 *
 * BUG CORREGIDO: EL OFFSET DEL ENCABEZADO
 *
 * El destino no es el borde de la sección sino ese borde menos el alto del
 * encabezado fijo, o el título queda tapado. Ese número NO está escrito acá y
 * tampoco se lee: lo declara `scroll-padding-top` en `globals.css` y lo aplica
 * el navegador, y Lenis lo respeta igual. Así el camino con JavaScript, el
 * salto nativo sin JavaScript y `scrollIntoView` usan el mismo valor y no
 * pueden separarse. Leerlo acá para volver a restarlo era justamente el bug.
 *
 * @param alNavegar se ejecuta solo cuando la navegación ocurre en esta
 *   pestaña, con el id de destino. Sirve para marcar el ítem activo antes de
 *   que termine el scroll y para cerrar el menú.
 */
/**
 * Duración del salto por menú, en segundos.
 *
 * 0,8s es el punto donde el movimiento todavía se lee como un desplazamiento
 * -o sea, el visitante entiende que bajó y no que cambió de página- pero no se
 * hace esperar. Por encima de 1s el menú empieza a sentirse trabado.
 */
const DURACION_SALTO_S = 0.8;

export function useClickAncla(alNavegar?: (id: string) => void) {
  const lenis = useLenis();
  const reducido = usePrefersReducedMotion();

  return useCallback(
    (evento: MouseEvent<HTMLAnchorElement>) => {
      // Otro manejador ya decidió; no le pisamos la decisión.
      if (evento.defaultPrevented) return;

      // Gestos del navegador: se respetan tal cual.
      if (
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return;
      }

      const href = evento.currentTarget.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const id = href.slice(1);
      const destino = document.getElementById(id);
      // Sin destino en el documento, mejor el salto nativo que un click muerto.
      if (!destino) return;

      evento.preventDefault();
      alNavegar?.(id);

      if (lenis) {
        // `immediate` respeta la preferencia del sistema: con movimiento
        // reducido el salto es instantáneo, pero CONSERVA el offset.
        //
        // BUG CORREGIDO: EL VIAJE INTERMINABLE
        //
        // Sin `duration`, Lenis interpola con el `lerp` global (0.1), que es
        // asintótico: se acerca un 10% por frame. En una página corta no se
        // nota, pero este documento mide más de 16.000px y un salto de Inicio a
        // Noticias recorre 11.362. Medido en navegador: el viaje tardaba más de
        // cinco segundos, y como cada sección está oculta hasta que su
        // observador la revela, durante todo el trayecto la pantalla quedaba
        // NEGRA. Alguien que abre el sitio y toca un ítem del menú veía eso.
        //
        // Con duración fija el tiempo de llegada no depende de la distancia:
        // saltar a la sección de al lado y a la última cuestan lo mismo, que es
        // además lo que el visitante espera de un menú.
        //
        // BUG CORREGIDO: EL OFFSET RESTADO TRES VECES
        //
        // Acá iba `offset: -margen`, leyendo el `scroll-margin-top` de la
        // sección. Sobraba: Lenis ya respeta por su cuenta el área útil que
        // declara el `scroll-padding-top` del documento. Medido sobre `#sobre`,
        // que arranca en el píxel 900: el borde de la sección quedaba a 272px
        // del techo -96 del padding viejo, 88 del scroll-margin que había en
        // las secciones y 88 de este offset- cuando tiene que apoyarse contra
        // el canto de la barra. El número no se escribe acá: vive una sola vez
        // en `globals.css`.
        lenis.scrollTo(destino, {
          duration: DURACION_SALTO_S,
          immediate: reducido,
        });
      } else {
        // Sin Lenis (todavía montando), scrollIntoView respeta por sí solo el
        // `scroll-padding-top` del documento, que es el mismo número.
        destino.scrollIntoView({ behavior: reducido ? "auto" : "smooth" });
      }

      // Deja el ancla en la barra de direcciones para que el enlace sea
      // compartible. `replaceState` no agrega entrada al historial ni provoca
      // un salto, a diferencia de asignar `location.hash`.
      window.history.replaceState(null, "", href);
    },
    [lenis, reducido, alNavegar],
  );
}
