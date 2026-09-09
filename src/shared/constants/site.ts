/**
 * Fuente única de verdad de los datos institucionales del sitio.
 *
 * ATENCION: CONTENIDO PROVISORIO - el kit entregado por la organización solo incluye
 * logotipos. No hay fechas, sede confirmada, precios ni textos oficiales.
 * Todo lo marcado con `PROVISORIO` es contenido de maqueta y debe reemplazarse
 * con datos reales antes de cualquier publicación. Está centralizado acá
 * justamente para que ese reemplazo sea un solo archivo y no una cacería.
 */

export const SITE = {
  name: "ExpoJuy 2026",
  claim: "Conectando países, creando oportunidades",
  organizer: "Cámara de Comercio Exterior de Jujuy",
  /** PROVISORIO - confirmar con la organización */
  venue: "Ciudad Cultural, San Salvador de Jujuy",
  /** PROVISORIO - confirmar con la organización */
  dates: {
    startISO: "2026-09-24",
    endISO: "2026-09-27",
    label: "24 al 27 de septiembre de 2026",
  },
  /**
   * URL de producción. Gobierna el canonical, Open Graph, el sitemap y los
   * datos estructurados, así que un valor equivocado acá no es cosmético: hace
   * que el sitio se declare a sí mismo en un dominio que no existe.
   *
   * El valor por defecto es el dominio real donde está publicado. La variable
   * de entorno queda para cuando la Cámara provea el dominio definitivo: se
   * cambia ahí y no hace falta tocar código.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://expojuy-retro.vercel.app",
  locale: "es_AR",
  description:
    "ExpoJuy 2026 reúne a la producción, la tecnología y la economía del conocimiento de Jujuy. " +
    "Cuatro días de expositores, agenda de actividades y vinculación empresarial en la Ciudad Cultural.",
} as const;

/**
 * Canales de contacto institucionales.
 *
 * ATENCION: PROVISORIO - la organización no entregó ninguno. Son de maqueta y hay que
 * reemplazarlos antes de publicar: el formulario de la sección Contacto abre
 * el cliente de correo apuntando a `email`, así que un valor inventado ahí no
 * es un texto de relleno, es un envío que no llega a ningún lado.
 *
 * `telefonoHref` va aparte y en formato E.164 porque `tel:` no admite los
 * separadores que el número necesita para leerse.
 */
export const CONTACTO = {
  email: "contacto@expojuy2026.com.ar",
  telefono: "+54 388 400-0000",
  telefonoHref: "+543884000000",
  direccion: "Ciudad Cultural, San Salvador de Jujuy",
} as const;

/**
 * Perfiles en redes sociales.
 *
 * ATENCION: PROVISORIO - la organización no entregó ninguno. El usuario es de
 * maqueta, y los `href` apuntan a la PORTADA de cada plataforma a propósito y
 * no al perfil: un enlace a un perfil inventado da 404, y en una propuesta que
 * el jurado va a clickear es peor un enlace roto que uno genérico. Cuando
 * lleguen los perfiles reales se reemplazan `usuario` y `href` JUNTOS, o el
 * texto visible y el destino dejan de coincidir.
 *
 * El mismo usuario en las cuatro no es un descuido: una organización usa un
 * solo nombre en todas, y así es como se va a reemplazar.
 *
 * `id` NO es decorativo: lo lee `IconoRed` para elegir el glifo, y el tipo
 * `RedSocialId` que sale de acá hace que agregar una red sin su ícono no
 * compile. La lista y los íconos no se pueden desincronizar.
 */
export const SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", usuario: "@expojuy", href: "https://instagram.com" },
  { id: "facebook", label: "Facebook", usuario: "/expojuy", href: "https://facebook.com" },
  { id: "linkedin", label: "LinkedIn", usuario: "/expojuy", href: "https://linkedin.com" },
  { id: "youtube", label: "YouTube", usuario: "/expojuy", href: "https://youtube.com" },
] as const;

export type RedSocialId = (typeof SOCIAL_LINKS)[number]["id"];

/**
 * Arquitectura de navegación. El orden de este array ES el orden de las
 * secciones en la página y el orden del menú: una sola lista gobierna ambos,
 * así no pueden desincronizarse.
 *
 * El orden sigue un embudo: todo lo que va antes de Entradas responde "¿vale
 * la pena ir?" -qué es, qué pasa, quiénes están, dónde queda- y Entradas
 * responde "sí, ¿cómo entro?". Noticias y Preguntas quedan después como cola
 * informativa, y Contacto cierra.
 *
 * INVARIANTE: una sección lleva copete numerado si y solo si está en esta
 * lista. Sponsors NO está a propósito: es crédito institucional, no un destino
 * al que alguien navegue, así que va sin número y como franja de cierre
 * después de Contacto. Meterlo acá obligaría a un décimo ítem, y la barra de
 * escritorio ya arranca con nueve más el CTA a 1024px justos.
 */
export const NAV_SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre", label: "Sobre ExpoJuy" },
  { id: "agenda", label: "Agenda" },
  { id: "expositores", label: "Expositores" },
  { id: "mapa", label: "Mapa" },
  { id: "entradas", label: "Entradas" },
  { id: "noticias", label: "Noticias" },
  { id: "faq", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];
