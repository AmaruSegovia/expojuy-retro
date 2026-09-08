import { Reveal } from "@/shared/components/motion/reveal";
import { NOTICIAS } from "../constants/noticias";
import { NoticiaTarjeta } from "./noticia-tarjeta";
import { NoticiasCarrusel } from "./noticias-carrusel";

/**
 * NOTICIAS - tarjeta y grilla del prototipo de Astro, carrusel del de Next.
 *
 * ES UN SERVER COMPONENT. El `"use client"` está una capa más abajo, en el
 * carrusel, que es lo único con estado. La cabecera, la grilla de respaldo y
 * la tarjeta se renderizan en el servidor y no cuestan bundle.
 *
 * MEJORA PROGRESIVA: SE SIRVEN LOS DOS CAMINOS, Y EL QUE MANDA ES EL ESTÁTICO
 *
 * El HTML sale con la grilla COMPLETA de seis notas, que es el diseño de
 * origen tal cual y no un resumen de emergencia. La clase `js` -que un script
 * inline del layout agrega al <html> antes del primer pintado- es la que
 * apaga la grilla y enciende el carrusel. Si el JavaScript no corre, la clase
 * nunca aparece, la regla nunca aplica y quedan las seis notas leíbles.
 *
 * Al revés no funcionaría: el carrusel monta la lista tres veces y muestra
 * una tarjeta por vez, así que servirlo como estado por defecto dejaría
 * dieciocho copias apiladas y cinco de seis noticias inalcanzables.
 *
 * POR QUÉ LA CABECERA CONSERVA EL COPETE NUMERADO
 *
 * Porque Noticias SÍ está en NAV_SECTIONS, en la séptima posición. El número
 * es el mismo con el que el menú identifica la sección: quien llega desde el
 * índice encuentra la misma marca. La sección de origen numeraba igual, con
 * el número en una columna a la izquierda; acá se usa el copete del sistema
 * de destino para no dejar una sola sección con otra cabecera.
 *
 * POR QUÉ LA APARICIÓN NO SE ESCALONA TARJETA POR TARJETA
 *
 * En el origen, la lista llevaba `data-revelar-grupo`, que reparte un `--i`
 * por hijo directo y escalona el retardo. Un carrusel CLONA sus hijos -son
 * dieciocho, no seis- y los reordena, así que ese conteo pierde sentido: el
 * escalonado quedaría en tarjetas que nadie ve. La aparición se aplica al
 * bloque, una sola vez.
 */
export function NewsSection() {
  return (
    <section
      id="noticias"
      aria-labelledby="noticias-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 07
          </p>
          <h2 id="noticias-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Novedades
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Lo último del programa: convocatorias, agenda y avances de la organización.
          </p>
        </Reveal>
      </div>

      {/* CAMINO SIN JAVASCRIPT. Es el estado por defecto del documento. */}
      <div className="container-content noticias-sin-js">
        <ul role="list" className="noticias-grilla">
          {NOTICIAS.map((n) => (
            <li key={n.id}>
              <NoticiaTarjeta noticia={n} />
            </li>
          ))}
        </ul>
      </div>

      <NoticiasCarrusel />
    </section>
  );
}
