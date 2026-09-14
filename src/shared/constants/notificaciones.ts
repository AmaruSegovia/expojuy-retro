/**
 * Contenido de las notificaciones push.
 *
 * Módulo NEUTRAL, sin "use client" ni "use server": lo leen la Server Action
 * que envía la notificación y las rutas que dibujan sus íconos. Si viviera en
 * un módulo cliente, el servidor recibiría un proxy de referencia en vez de los
 * strings (ver la trampa de RSC en AGENTS.md).
 *
 * El contenido lo decide SIEMPRE el servidor: el cliente solo aporta la
 * suscripción. Así nadie puede usar el envío para mandar un texto propio.
 */
export const NOTIFICACION_COMPRA = {
  titulo: "¡Ya podés utilizar tu QR de acceso!",
  /** A dónde lleva tocar la notificación. Ruta propia del sitio, nunca externa. */
  url: "/entrada-digital",
  /** Una notificación nueva de compra reemplaza a la anterior en vez de apilarse. */
  etiqueta: "entrada",
} as const;

/**
 * Rutas de los íconos, generados desde la geometría del isologotipo. Ver
 * `src/app/notificaciones/`.
 */
export const ICONOS_NOTIFICACION = {
  icono: "/notificaciones/icono",
  insignia: "/notificaciones/insignia",
} as const;
