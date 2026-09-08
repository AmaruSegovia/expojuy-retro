import { Reveal } from "@/shared/components/motion/reveal";
import { MapaPredio } from "./mapa-predio";
import { ETIQUETA_CATEGORIA, PUNTOS } from "../constants/plano";

/**
 * MAPA - cómo moverse por el predio.
 *
 * ESTA CAPA ES SERVIDOR A PROPÓSITO, Y ESO ES ACCESIBILIDAD, NO RENDIMIENTO.
 *
 * Una maqueta isométrica interactiva no es utilizable con lector de pantalla
 * por más ARIA que se le cuelgue: la información está en la geometría. Por eso
 * la sección se parte en dos y la parte que lleva la información en texto
 * -la lista de lugares de acá abajo- se sirve desde el servidor, fuera del
 * componente cliente.
 *
 * La consecuencia es la que importa: si el JavaScript no llega, falla o el
 * visitante lo tiene apagado, la maqueta no se levanta pero la sección sigue
 * diciendo qué hay en el predio y dónde. La alternativa textual no es un
 * agregado que se pueda perder junto con el resto, es la base.
 *
 * `MapaPredio` es el único componente cliente y adentro suyo vive todo el
 * estado: la maqueta y el riel leen la misma posición.
 */
export function VenueMapSection() {
  return (
    <section id="mapa" className="border-t border-border py-24 md:py-32">
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 05
          </p>
          <h2 className="mt-3 text-3xl font-bold text-text md:text-4xl">Cómo moverse</h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            El predio de la Ciudad Cultural. Elegí un lugar y la maqueta lo levanta y dibuja el
            recorrido desde el acceso principal.
          </p>
        </Reveal>

        <MapaPredio />

        {/* ALTERNATIVA TEXTUAL DEL PLANO.
            No está escondida detrás de un "solo para lectores de pantalla": es
            contenido visible, porque a alguien parado en el predio con una mano
            libre le sirve tanto como la maqueta, y porque una lista que solo
            existe para el lector de pantalla es una lista que nadie revisa
            cuando cambian los datos. */}
        <Reveal className="mt-16">
          <h3 className="text-xl font-bold text-text">Los lugares, uno por uno</h3>
          <p className="mt-2 max-w-prose text-base text-text-muted">
            La misma información que muestra la maqueta, en texto.
          </p>

          <ul role="list" className="mt-8 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {PUNTOS.map((punto) => (
              <li key={punto.id} className="bg-surface-raised p-6">
                <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
                  {ETIQUETA_CATEGORIA[punto.categoria]}
                </p>
                <h4 className="mt-2 text-lg font-bold text-text">{punto.nombre}</h4>
                <p className="mt-2 text-base text-pretty text-text-muted">{punto.detalle}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
