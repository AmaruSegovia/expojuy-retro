import { Reveal } from "@/shared/components/motion/reveal";
import { IconoRed } from "@/shared/components/ui/icono-red";
import { CONTACTO, SITE, SOCIAL_LINKS } from "@/shared/constants/site";
import { ContactForm } from "./contact-form";
import { TramaModular } from "./trama-modular";

/**
 * CONTACTO - portado del prototipo de Maru (`src/components/Contacto.astro`
 * más `src/pages/contacto.astro`).
 *
 * Dos columnas iguales a partir de `lg`: a la izquierda quién responde y cómo
 * encontrarlo por fuera del formulario, a la derecha el formulario. Apiladas
 * debajo de `lg`, con los datos primero: quien entra por el menú a "Contacto"
 * muchas veces sólo quiere el correo, y hacerle pasar un formulario entero por
 * arriba para llegar a una dirección de correo es cobrarle de más.
 *
 * ES UN COMPONENTE DE SERVIDOR. Lo único que baja al cliente es el formulario,
 * que sí tiene estado, y `Reveal`, que ya era cliente. El `"use client"` está
 * lo más abajo posible del árbol.
 *
 * LOS DATOS SALEN DE `shared/constants/site.ts`. Correo, teléfono y sede son
 * provisorios y viven en un solo archivo para que reemplazarlos sea un solo
 * cambio. Acá no se escribe ninguno a mano, ni siquiera el `tel:`, que tiene
 * su propio campo en formato E.164 porque ese esquema no admite separadores.
 */
export function ContactSection() {
  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="border-t border-border bg-surface py-24 md:py-32"
    >
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-[clamp(2rem,5vw,5rem)]">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
              Sección 09
            </p>
            {/* El título de la sección es "Hablemos" y no "Contacto", como en
                el prototipo de origen: el ítem del menú ya dice de qué sección
                se trata, y repetirlo acá gasta el único renglón grande que la
                sección tiene para decir algo. */}
            <h2 id="contacto-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
              Hablemos
            </h2>
            <p className="mt-4 max-w-prose text-lg text-text-muted">
              Si querés exponer, patrocinar o cubrir el evento, escribinos. {SITE.organizer}{" "}
              responde en días hábiles.
            </p>

            <dl className="mt-8 grid gap-4">
              <Dato etiqueta="Correo">
                <Enlace href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</Enlace>
              </Dato>
              <Dato etiqueta="Teléfono">
                <Enlace href={`tel:${CONTACTO.telefonoHref}`}>{CONTACTO.telefono}</Enlace>
              </Dato>
              <Dato etiqueta="Dónde">{CONTACTO.direccion}</Dato>
            </dl>

            <ul role="list" className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {SOCIAL_LINKS.map((red) => (
                <li key={red.id}>
                  {/* NO REUSA `Enlace` A PROPÓSITO. Ese componente subraya todo
                      su contenido, y un subrayado que pasa por debajo del ícono
                      se lee como un error de dibujo. Acá el subrayado es sólo
                      del usuario; el ícono queda afuera pero comparte el color
                      y el hover, que es lo que los mantiene como una sola cosa. */}
                  <a
                    href={red.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 py-1 transition-colors duration-micro ease-standard hover:text-link"
                  >
                    <IconoRed red={red.id} size={16} />
                    <span className="underline decoration-border-strong underline-offset-4 transition-colors duration-micro ease-standard group-hover:decoration-link">
                      {red.usuario}
                    </span>
                    {/* Las cuatro muestran el mismo usuario: sin el nombre de
                        la red, los cuatro enlaces tendrían el mismo nombre
                        accesible (WCAG 2.4.4). Lo que los distingue a la vista
                        es el ícono, que no tiene texto. */}
                    <span className="sr-only"> en {red.label} (se abre en una pestaña nueva)</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Pieza gráfica, sólo cuando la columna tiene ancho de sobra. El
                corte a 75rem es el del prototipo de origen: por debajo la trama
                compite con los datos en vez de acompañarlos. */}
            <div className="mt-12 hidden w-36 min-[75rem]:block">
              <TramaModular className="block h-auto w-full" />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Un par etiqueta / valor del bloque de datos. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-text">{children}</dd>
    </div>
  );
}

/**
 * Enlace de dato o de red.
 *
 * `inline-block` con relleno vertical, no texto en línea: es lo que lleva el
 * objetivo táctil a los 24px que pide WCAG 2.5.8 sin engordar el dibujo. Es la
 * misma solución del prototipo de origen y la misma que usa el pie del sitio.
 */
function Enlace({
  href,
  externo = false,
  children,
}: {
  href: string;
  externo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-block py-1 underline decoration-border-strong underline-offset-4 transition-colors duration-micro ease-standard hover:text-link hover:decoration-link"
    >
      {children}
      {/* Aviso sólo para lectores de pantalla: quien ve el enlace no se entera
          de que abre otra pestaña hasta que ya abrió. */}
      {externo && <span className="sr-only"> (se abre en una pestaña nueva)</span>}
    </a>
  );
}
