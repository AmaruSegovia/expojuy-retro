"use client";

import { cn } from "@/shared/lib/cn";

/**
 * Control de pausa de un contenido que se mueve solo.
 *
 * VIVE EN shared/ PORQUE LO NECESITAN DOS FEATURES: el bento de Expositores y
 * el riel de medios de pago de Entradas. La frontera de arquitectura prohíbe
 * que un feature importe de otro, así que lo compartido sube acá — el mismo
 * camino que ya recorrieron `PlaceholderVisual` y `useCarruselCircular`.
 *
 * Y ACÁ IMPORTA MÁS QUE EN OTROS CASOS. Esto no es un botón bonito: es el
 * mecanismo que WCAG 2.2.2 exige para todo contenido en movimiento que
 * arranque solo, dure más de cinco segundos y conviva con otro contenido. Un
 * bucle infinito cumple las tres. Duplicado, cada copia podía perder por su
 * cuenta el `aria-pressed`, el nombre accesible o el área táctil; compartido,
 * las tres condiciones se cumplen o fallan en un solo lugar.
 *
 * QUIÉN MANDA SOBRE LA ANIMACIÓN. Este botón NO llama a `pause()`: solo avisa
 * su estado hacia arriba para que el contenedor marque un atributo y el CSS
 * resuelva. `Animation.pause()` le quita a CSS la autoridad sobre esa
 * animación de forma permanente, y a partir de ahí `animation-play-state` deja
 * de gobernarla. Un solo dueño del estado de reproducción, y es la hoja de
 * estilos.
 */
export function BotonPausa({
  pausado,
  onCambiar,
  className,
}: {
  pausado: boolean;
  onCambiar: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pausado}
      // El botón es solo un icono, así que el nombre accesible tiene que venir
      // de acá: sin `aria-label` un lector de pantalla anunciaría un botón sin
      // nombre.
      aria-label={pausado ? "Reanudar el movimiento" : "Pausar el movimiento"}
      onClick={onCambiar}
      className={cn(
        // size-12 son 48×48: por encima de los 24 de WCAG 2.5.8 y también de
        // los 44 que recomienda la guía táctil.
        "grid size-12 place-items-center rounded-full border border-border-strong",
        "text-text-muted transition-colors duration-micro ease-standard",
        "hover:border-link hover:text-link",
        className,
      )}
    >
      {pausado ? <IconoReanudar /> : <IconoPausar />}
    </button>
  );
}

/**
 * Iconos del control.
 *
 * Dibujados a mano y no traídos de una librería: son dos formas triviales y
 * una dependencia de iconos entera para esto no se justifica. Las barras van
 * con esquinas VIVAS —radio 0— porque el sistema de diseño solo admite 0 o
 * píldora, y el isologotipo se construye con esquinas vivas.
 *
 * `aria-hidden`: el nombre accesible lo da el `aria-label` del botón. Si el
 * icono también se anunciara, el botón se leería dos veces.
 */
function IconoPausar() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <rect x="7" y="5" width="3.5" height="14" />
      <rect x="13.5" y="5" width="3.5" height="14" />
    </svg>
  );
}

function IconoReanudar() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      {/* Ópticamente centrado: un triángulo centrado por su caja se ve corrido
          hacia la izquierda, porque su masa está de ese lado. */}
      <path d="M8.5 5 19 12 8.5 19 Z" />
    </svg>
  );
}
