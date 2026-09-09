import { Reveal } from "@/shared/components/motion/reveal";
import { CIFRAS, PRESENTACION, VALORES } from "../constants/contenido";
import { MontanaTrazo } from "./montana-trazo";

/**
 * SOBRE EXPOJUY - portado del prototipo de Maru (`src/components/Sobre.astro`
 * más `src/pages/sobre.astro`).
 *
 * ES UN COMPONENTE DE SERVIDOR. No tiene estado ni eventos: la sección entera
 * es texto y retícula. Lo único que baja al cliente es `Reveal`, que ya es un
 * componente cliente propio y aparece acá como hijo. Cada `"use client"` de
 * más cuesta puntaje, y esta sección no necesita ninguno: la versión anterior
 * era un slider y arrastraba el archivo completo al bundle.
 *
 * QUÉ SE TRAJO Y QUÉ NO
 *
 * `Sobre.astro` sólo importa `CabeceraSeccion` y el helper de rutas: ni
 * `Cifras`, ni `Estratos`, ni `IconoEje`. La cabecera se resuelve acá con el
 * copete numerado que ya usan las otras ocho secciones del sitio, así que ese
 * componente no hace falta.
 *
 * `Cifras.astro` SÍ se trajo, aunque cuelgue de `pages/sobre.astro` y no del
 * componente: la versión anterior de esta sección llevaba un dato duro por
 * lámina y sin la banda esos cuatro números se perdían. Acá cierra la sección
 * en vez de asomar al pie del hero, que era su función en el sitio de origen,
 * así que no lleva la calibración de `--asomo` ni el hueco de 4rem que
 * separaba el dato de la glosa.
 *
 * El enlace "Conocer la historia de ExpoJuy" tampoco se trajo: en el origen
 * apunta a la página `/sobre`, y este sitio es una sola página con anclas. Un
 * enlace a una ruta que no existe es peor que no tenerlo.
 *
 * MEJORA PROGRESIVA. El HTML se sirve completo y legible: sin JavaScript esto
 * son tres párrafos, cuatro valores y cuatro cifras, todo visible. El estado
 * oculto lo agrega `Reveal` detrás de la clase `.js`, nunca el marcado.
 */
export function AboutSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="sobre en-papel border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 02
          </p>
          <h2
            id="sobre-titulo"
            className="mt-3 max-w-prose text-3xl font-bold text-balance text-text md:text-4xl"
          >
            {PRESENTACION.titulo}
          </h2>
        </Reveal>

        {/* La proporción 1.4 / 1 es la del prototipo de origen: la columna de
            texto pesa más que la de valores porque es la que se lee de corrido.
            Debajo de `lg` se apilan, texto primero. */}
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-[clamp(2rem,5vw,5rem)]">
          <Reveal className="grid max-w-prose gap-4">
            {/* La entrada va en cuerpo mayor y en el color de título: es la
                definición de qué es ExpoJuy, no un párrafo más. */}
            <p className="text-lg text-pretty text-text">{PRESENTACION.entrada}</p>
            {PRESENTACION.parrafos.map((parrafo) => (
              <p key={parrafo.slice(0, 24)} className="text-base text-pretty text-text-muted">
                {parrafo}
              </p>
            ))}
          </Reveal>

          {/* Entra con retardo: primero se lee el texto, después aparece la
              lista. El retardo es una variable CSS y no un temporizador, así
              que con movimiento reducido las dos cosas aparecen a la vez y
              quietas. La entrada NO es lateral: apilada en móvil, un
              desplazamiento horizontal de 2rem sobre un bloque a ancho
              completo asoma por el borde derecho y saca una barra de scroll
              hasta que se revela. */}
          <Reveal delay={120}>
            <div className="sobre-valores">
              <ul role="list">
                {VALORES.map((valor) => (
                  <li key={valor.id}>
                    <h3 className="text-base font-semibold text-text">{valor.titulo}</h3>
                    <p className="mt-1 text-sm text-pretty text-text-muted">{valor.texto}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* BANDA DE CIFRAS. El encabezado existe pero no se ve: le da nombre a
            la lista en el árbol de accesibilidad y mantiene el esquema de
            encabezados, sin agregar un rótulo que en pantalla sería ruido
            arriba de cuatro números que ya se explican solos. */}
        <Reveal as="section" className="mt-16 md:mt-24">
          <h3 id="sobre-cifras-titulo" className="sr-only">
            ExpoJuy 2026 en números
          </h3>
          <ul
            role="list"
            aria-labelledby="sobre-cifras-titulo"
            className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8"
          >
            {CIFRAS.map((cifra) => (
              // El filete superior en cian es del prototipo de origen, donde
              // el turquesa institucional es el color del dato. Acá el token
              // equivalente es `accent`, y sobre superficie oscura da 9.02:1.
              <li key={cifra.id} className="border-t-2 border-accent pt-3">
                <p className="text-3xl font-bold text-text tabular-nums">{cifra.valor}</p>
                <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                  {cifra.etiqueta}
                </p>
                <p className="mt-3 max-w-[32ch] text-sm text-pretty text-text-muted">
                  {cifra.detalle}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      {/* VA ÚLTIMO EN EL MARCADO Y PRIMERO EN EL DIBUJO. Último porque es
          decorativo y no debe interponerse en el orden de lectura ni en el de
          tabulación; primero en profundidad porque el texto tiene que pasarle
          por encima, y de eso se encarga el z-index del contenedor. */}
      <MontanaTrazo className="sobre-cordon" />
    </section>
  );
}
