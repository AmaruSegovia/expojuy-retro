import { SITE, CONTACTO, SOCIAL_LINKS } from "@/shared/constants/site";

/**
 * Datos estructurados schema.org para el evento.
 *
 * POR QUÉ IMPORTA ACÁ Y NO ES UN EXTRA DE SEO
 * Un evento con fecha, sede y organizador declarados en JSON-LD es lo que
 * permite que el buscador lo muestre como evento -con fecha y lugar en el
 * propio resultado- y no como una página más. Para un sitio institucional que
 * existe para que la gente sepa cuándo y dónde, esa diferencia es la función
 * del sitio, no un adorno.
 *
 * Ninguno de los tres prototipos lo tenía.
 *
 * ATENCION: se alimenta de `SITE` y `CONTACTO`, y esos datos son PROVISORIOS
 * mientras la organización no entregue los reales. Publicar datos estructurados
 * con fechas inventadas es peor que no publicarlos, porque el buscador los
 * muestra como si fueran oficiales. Antes de publicar en el dominio definitivo
 * hay que confirmar fecha y sede.
 *
 * No hay riesgo de inyección: todo sale de constantes propias, nada de entrada
 * de usuario.
 */
export function DatosEstructurados() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: SITE.name,
    description: SITE.description,
    startDate: SITE.dates.startISO,
    endDate: SITE.dates.endISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: SITE.url,
    inLanguage: "es-AR",
    location: {
      "@type": "Place",
      name: SITE.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: CONTACTO.direccion,
        addressLocality: "San Salvador de Jujuy",
        addressRegion: "Jujuy",
        addressCountry: "AR",
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE.organizer,
      email: CONTACTO.email,
      telephone: CONTACTO.telefonoHref,
      url: SITE.url,
      sameAs: SOCIAL_LINKS.map((red) => red.href),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
