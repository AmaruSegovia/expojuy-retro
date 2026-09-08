import { Reveal } from "@/shared/components/motion/reveal";
import { BuscadorExpositores } from "./buscador-expositores";
import { EXPOSITORES_TOTAL } from "../constants/expositores";

/**
 * EXPOSITORES - listado buscable, en dos columnas separadas por líneas.
 *
 * No son tarjetas con caja: es una lista editorial, monograma a la izquierda y
 * stand a la derecha. La sección no pide una foto por expositor -que todavía no
 * existe- y se lee igual de bien con dieciséis filas que con trescientas.
 *
 * ESTE COMPONENTE ES DE SERVIDOR. Todo lo que tiene estado vive en
 * `BuscadorExpositores`, que es el único con `"use client"`: el encabezado, el
 * copete y el marco viajan como HTML y no cuestan JavaScript.
 *
 * El `id` y el nombre exportado no se tocan: el menú ancla contra `#expositores`
 * y `page.tsx` importa `ExhibitorsSection`.
 */
export function ExhibitorsSection() {
  return (
    <section
      id="expositores"
      aria-labelledby="expositores-titulo"
      className="border-t border-border py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 04
          </p>
          <h2 id="expositores-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Expositores
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Más de {EXPOSITORES_TOTAL} empresas y productores de toda la provincia. Buscá por
            nombre, ciudad o rubro.
          </p>
        </Reveal>

        <Reveal className="mt-12" delay={80}>
          <BuscadorExpositores />
        </Reveal>
      </div>
    </section>
  );
}
