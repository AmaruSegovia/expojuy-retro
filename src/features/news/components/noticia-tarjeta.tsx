import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { cn } from "@/shared/lib/cn";
import { NOMBRE_CATEGORIA, fechaLarga, type Noticia } from "../constants/noticias";

/**
 * TARJETA DE NOTICIA - el diseño viene del prototipo de Astro, tal cual.
 *
 * Cuatro piezas apiladas bajo un filete de 2px: figura, título, resumen y una
 * línea de metadatos con la fecha y la categoría. La figura es el HUECO EXACTO
 * donde va a ir la fotografía cuando exista: se reemplaza su contenido y nada
 * más, porque la relación de aspecto la reserva la figura y no la imagen.
 *
 * NO ES UN COMPONENTE DE CLIENTE. No tiene estado ni eventos: el carrusel la
 * usa igual que la grilla sin JavaScript, y así el mismo marcado sirve para
 * los dos caminos sin duplicar el diseño.
 *
 * `position: relative` en la tarjeta NO es decorativo (ver styles.css): es el
 * bloque contenedor del `::after` de área completa que va a necesitar el
 * título el día que exista una ruta de detalle.
 */
export function NoticiaTarjeta({
  noticia: n,
  className,
}: {
  noticia: Noticia;
  className?: string;
}) {
  return (
    <article className={cn("noticia", className)}>
      {/* `aria-hidden` porque hoy es un relleno geométrico: no describe nada
          real todavía. Cuando llegue la foto, lleva su propio alt. */}
      <div className="noticia__figura" aria-hidden="true">
        {/* El envoltorio existe para que el levante al señalar la nota lo
            mueva ALGO QUE NO TIENE UTILIDADES ENCIMA. `PlaceholderVisual`
            trae `relative` de Tailwind, y las utilidades viven en una capa
            posterior a la nuestra: cualquier `position` que le pusiéramos acá
            perdería en silencio. Este div es nuestro y no tiene ninguna. */}
        <div className="noticia__visual">
          <PlaceholderVisual paleta={n.paleta} />
        </div>
      </div>

      <h3 className="noticia__titulo">{n.titulo}</h3>
      <p className="noticia__resumen">{n.resumen}</p>

      {/* La fecha y la categoría van AL PIE, no como etiqueta sobre el título:
          ordenan la nota una vez leída, no antes de leerla. */}
      <ul role="list" className="noticia__meta">
        <li>
          <time dateTime={n.fecha}>{fechaLarga(n.fecha)}</time>
        </li>
        <li>{NOMBRE_CATEGORIA[n.categoria]}</li>
      </ul>
    </article>
  );
}
