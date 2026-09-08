import { DatosEstructurados } from "./datos-estructurados";
import { PageLoader } from "@/shared/components/brand/page-loader";
import { ScrollProgress } from "@/shared/components/layout/scroll-progress";
import { SiteHeader } from "@/shared/components/layout/site-header";
import { BackToTop } from "@/shared/components/layout/back-to-top";
import { SiteFooter } from "@/shared/components/layout/site-footer";
import { HeroSection } from "@/features/hero/components/hero-section";
import { AboutSection } from "@/features/about/components/about-section";
import { AgendaSection } from "@/features/agenda/components/agenda-section";
import { ExhibitorsSection } from "@/features/exhibitors/components/exhibitors-section";
import { VenueMapSection } from "@/features/venue-map/components/venue-map-section";
import { TicketsSection } from "@/features/tickets/components/tickets-section";
import { NewsSection } from "@/features/news/components/news-section";
import { FaqSection } from "@/features/faq/components/faq-section";
import { ContactSection } from "@/features/contact/components/contact-section";
import { SponsorsSection } from "@/features/sponsors/components/sponsors-section";

/**
 * La página. Es la capa de composición: ensambla features y no implementa
 * ninguno.
 *
 * EL ORDEN DE ESTE ARCHIVO TIENE QUE COINCIDIR CON NAV_SECTIONS. No es una
 * convención estética: `useActiveSection` recorre esa lista para marcar el
 * ítem del menú, y los enlaces del menú apuntan a estos `id`. Si las dos
 * listas se separan, el menú queda ordenado de una forma y el documento de
 * otra -ya pasó con Mapa y Noticias- y nadie avisa.
 *
 * El número del copete de cada sección es su posición en NAV_SECTIONS. Es el
 * único dato duplicado que queda: vive escrito en cada feature porque forma
 * parte de su composición visual, no de su ubicación.
 */
export default function HomePage() {
  return (
    <>
      <DatosEstructurados />
      <PageLoader />
      <ScrollProgress />
      <SiteHeader />

      {/* DOS COSAS ACÁ SON ESTRUCTURALES, NO ESTÉTICAS, Y LAS DOS SOSTIENEN EL
          FOOTER REVELADO.

          El FONDO OPACO es lo único que tapa al footer, que va `sticky`
          contra el borde inferior durante toda la página. Con `main`
          transparente, el footer asomaría abajo todo el tiempo.

          Y el `relative z-[1]` es lo que lo pone por encima. La primera
          versión lo resolvía al revés -el footer en `z-index: -10`- y el
          footer terminaba SIN PODER RECIBIR CLICKS: un z-index negativo se
          pinta antes que la caja del <body>, que no tapa nada a la vista
          porque su fondo se propaga al canvas, pero igual gana el hit-test.
          Subiendo main en vez de hundir el footer, el efecto es el mismo y los
          enlaces funcionan. Ver SiteFooter y `.footer-revelado`.

          El z-1 es deliberadamente bajo: header (80), volver arriba (85),
          progreso (90), salto de contenido (100) y loader (200) siguen todos
          por encima. */}
      <main id="contenido-principal" className="relative z-[1] bg-surface-sunken">
        <HeroSection />

        <AboutSection />

        <AgendaSection />

        <ExhibitorsSection />

        <VenueMapSection />

        <TicketsSection />

        <NewsSection />

        <FaqSection />

        <ContactSection />

        {/* FRANJA DE CIERRE. No está en NAV_SECTIONS y por eso va sin copete
            numerado - ver la invariante ahí. Va después de Contacto a
            propósito: separa el formulario del footer, que también lleva
            correo y redes, y hoy quedaban pegados repitiendo lo mismo.

            La última sección no necesita nada especial: el efecto de
            superposición lo resuelve el propio footer. Ver SiteFooter. */}
        <SponsorsSection />
      </main>

      <SiteFooter />
      <BackToTop />
    </>
  );
}
