"use server";

import webpush, { WebPushError } from "web-push";
import { ICONOS_NOTIFICACION, NOTIFICACION_COMPRA } from "@/shared/constants/notificaciones";

export type ResultadoEnvio =
  | { estado: "enviada" }
  /** El servicio push ya no reconoce la suscripción: hay que desuscribir y reconciliar. */
  | { estado: "vencida" }
  /** La suscripción no tiene la forma esperada o apunta a un servicio no admitido. */
  | { estado: "rechazada" }
  /** Faltan las claves VAPID en el entorno. */
  | { estado: "sin-configurar" }
  | { estado: "error" };

/**
 * Servicios push que admite el envío.
 *
 * NO ES UNA PRECAUCIÓN DE ADORNO. `web-push` hace un POST al `endpoint` que
 * trae la suscripción, y la suscripción la manda el cliente: sin esta lista,
 * cualquiera podría usar este servidor para pegarle a una dirección arbitraria
 * de internet o de su red interna. Son los servicios de Chrome y Samsung
 * Internet (FCM), Firefox, Safari y Edge.
 */
const SERVICIOS_PUSH = [
  (host: string) => host === "fcm.googleapis.com",
  (host: string) => host === "android.googleapis.com",
  (host: string) => host === "updates.push.services.mozilla.com",
  (host: string) => host === "web.push.apple.com",
  (host: string) => host.endsWith(".notify.windows.com"),
];

/** Base64 URL-safe, que es como el navegador serializa las claves de la suscripción. */
const BASE64_URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * Valida la suscripción que llega del cliente. Una Server Action es un endpoint
 * público: el tipo de TypeScript no protege nada en tiempo de ejecución.
 *
 * Largos: `p256dh` es una clave pública P-256 sin comprimir, 65 bytes, que en
 * base64 son 87 caracteres; `auth` son 16 bytes, 22 caracteres. Se admite el
 * relleno opcional de `=`.
 */
function validar(entrada: unknown): webpush.PushSubscription | null {
  if (typeof entrada !== "object" || entrada === null) return null;
  const { endpoint, keys } = entrada as { endpoint?: unknown; keys?: unknown };
  if (typeof endpoint !== "string" || typeof keys !== "object" || keys === null) return null;
  const { p256dh, auth } = keys as { p256dh?: unknown; auth?: unknown };

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!SERVICIOS_PUSH.some((admite) => admite(url.hostname))) return null;

  const claveValida = (valor: unknown, largo: number): valor is string =>
    typeof valor === "string" &&
    BASE64_URL.test(valor) &&
    valor.replace(/=+$/, "").length === largo;
  if (!claveValida(p256dh, 87) || !claveValida(auth, 22)) return null;

  return { endpoint, keys: { p256dh, auth } };
}

/**
 * Envía la notificación de compra a la suscripción del dispositivo.
 *
 * Sin base de datos: la suscripción viaja en la misma llamada, así que el
 * servidor no guarda nada. El contenido es constante y lo fija este módulo.
 */
export async function enviarNotificacionCompra(suscripcion: unknown): Promise<ResultadoEnvio> {
  const destino = validar(suscripcion);
  if (!destino) return { estado: "rechazada" };

  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const sujeto = process.env.VAPID_SUBJECT;
  if (!publica || !privada || !sujeto) return { estado: "sin-configurar" };

  const contenido = JSON.stringify({
    titulo: NOTIFICACION_COMPRA.titulo,
    url: NOTIFICACION_COMPRA.url,
    etiqueta: NOTIFICACION_COMPRA.etiqueta,
    icono: ICONOS_NOTIFICACION.icono,
    insignia: ICONOS_NOTIFICACION.insignia,
  });

  try {
    await webpush.sendNotification(destino, contenido, {
      vapidDetails: { subject: sujeto, publicKey: publica, privateKey: privada },
      // Una hora: una entrada que avisa tarde ya no sirve, y así el servicio
      // push no la guarda días si el teléfono está apagado.
      TTL: 60 * 60,
      urgency: "high",
      // Con el mismo `topic`, un envío pendiente reemplaza al anterior en vez
      // de llegar los dos juntos cuando el dispositivo se conecta.
      topic: NOTIFICACION_COMPRA.etiqueta,
    });
    return { estado: "enviada" };
  } catch (error) {
    // 404 y 410 son la forma en que los servicios push dicen "esta suscripción
    // ya no existe", típicamente porque se revocó el permiso.
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
      return { estado: "vencida" };
    }
    console.error("No se pudo enviar la notificación push:", error);
    return { estado: "error" };
  }
}
