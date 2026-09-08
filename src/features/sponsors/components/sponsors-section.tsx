import { Reveal } from "@/shared/components/motion/reveal";
import { SponsorsMuro } from "./sponsors-muro";

/**
 * SPONSORS - muro agrupado por nivel del prototipo de Astro, con el marcador
 * viajero del prototipo de Next.
 *
 * FRANJA DE CIERRE, SIN COPETE NUMERADO. Es la única sección del sitio sin
 * número, y no es un olvido: el número existe si y solo si la sección está en
 * NAV_SECTIONS. Los patrocinadores son crédito institucional, no un destino al
 * que alguien navegue. Ver la invariante escrita en `shared/constants/site.ts`.
 *
 * ES UN SERVER COMPONENT: el `"use client"` está una capa más abajo, en el
 * muro, que es lo único con estado. La cabecera y el pie no cuestan bundle.
 *
 * MEJORA PROGRESIVA: el muro se sirve COMPLETO. Sin JavaScript están las doce
 * fichas con sus nueve logotipos, agrupadas por nivel y en su orden; lo único
 * que no ocurre es el viaje del marcador, que es énfasis y no información. El
 * marcador arranca invisible y solo la clase `js` lo enciende, así que sin
 * JavaScript no queda una ficha marcada al azar. Ver styles.css.
 */
export function SponsorsSection() {
  return (
    <section
      id="sponsors"
      aria-labelledby="sponsors-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <h2 id="sponsors-titulo" className="text-3xl font-bold text-text md:text-4xl">
            Quiénes lo hacen posible
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Organismos y empresas que acompañan a ExpoJuy 2026.
          </p>
        </Reveal>

        <SponsorsMuro />

        {/* El pie del prototipo de origen: la sección no solo acredita, también
            abre la puerta. Apunta a la sección de contacto de esta misma
            página, que es la que tiene el formulario. */}
        <p className="mt-12 text-sm text-text-muted">
          ¿Querés patrocinar ExpoJuy 2026?{" "}
          <a
            href="#contacto"
            className="text-link underline decoration-from-font underline-offset-4 transition-colors duration-micro ease-standard hover:text-accent"
          >
            Escribinos
          </a>{" "}
          y te enviamos las opciones disponibles.
        </p>
      </div>
    </section>
  );
}
