import { Reveal } from "@/shared/components/motion/reveal";
import { CONTACTO } from "@/shared/constants/site";
import { Acordeon } from "./acordeon";
import { PREGUNTAS } from "../constants/preguntas";

/**
 * PREGUNTAS FRECUENTES - introducción a la izquierda, acordeón a la derecha.
 *
 * LA INTRODUCCIÓN QUEDA PEGADA AL SCROLL en pantallas grandes. No es un
 * efecto: mientras se recorren seis preguntas que crecen y se achican, el
 * título y el correo de contacto siguen a la vista, así que en cualquier punto
 * de la lista hay una salida para lo que no está respondido acá. El `top` se
 * calcula con `--alto-nav`, el mismo token que usa la barra: si la barra
 * cambia de alto, esto acompaña solo.
 *
 * ESTE COMPONENTE ES DE SERVIDOR. El estado vive entero en `Acordeon`, que es
 * el único con `"use client"`.
 *
 * El `id` y el nombre exportado no se tocan: el menú ancla contra `#faq` y
 * `page.tsx` importa `FaqSection`.
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-titulo"
      className="en-papel border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <div className="grid items-start gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
          {/* Los guiones bajos son espacios: es como Tailwind admite un
              `calc` dentro de un valor arbitrario. Sin ellos el `+` queda
              pegado y el CSS resultante es inválido. */}
          <Reveal className="lg:sticky lg:top-[calc(var(--alto-nav)_+_1.5rem)]">
            <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
              Sección 08
            </p>
            <h2 id="faq-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 max-w-prose text-lg text-text-muted">
              Lo que más nos consultan antes de venir. Si falta algo, escribinos.
            </p>
            {/* El correo va como enlace y no como texto: en un teléfono abre el
                cliente de correo con el destinatario puesto. Es PROVISORIO,
                como todo lo de site.ts. */}
            <a
              href={`mailto:${CONTACTO.email}`}
              className="mt-6 inline-flex min-h-9 items-center rounded-full border border-border-strong px-5 py-2 text-sm font-semibold text-text-muted transition-colors duration-micro ease-standard hover:border-link hover:text-link"
            >
              {CONTACTO.email}
            </a>
          </Reveal>

          <Reveal delay={80}>
            <Acordeon preguntas={PREGUNTAS} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
