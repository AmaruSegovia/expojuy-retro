/**
 * Clave pública VAPID. Es PÚBLICA por diseño: el navegador la necesita para
 * suscribirse y cualquiera la puede leer en el bundle. La privada vive solo en
 * el servidor (`VAPID_PRIVATE_KEY`) y nunca pasa por acá.
 *
 * Vacía si el entorno no la trae -por ejemplo, un deploy donde todavía no se
 * cargaron las variables-: en ese caso las notificaciones se muestran como no
 * disponibles en vez de fallar al tocarlas.
 */
export const CLAVE_PUBLICA_VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Pasa una clave en base64 URL-safe a los bytes que pide
 * `pushManager.subscribe`. El navegador no acepta el string directo.
 */
export function claveEnBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Compara la clave con la que se creó una suscripción contra la vigente. */
export function mismaClave(actual: ArrayBuffer | null, vigente: Uint8Array): boolean {
  if (!actual || actual.byteLength !== vigente.byteLength) return false;
  const bytes = new Uint8Array(actual);
  return bytes.every((valor, i) => valor === vigente[i]);
}
