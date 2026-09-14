import { CLAVE_PUBLICA_VAPID, claveEnBytes, mismaClave } from "./claves";

/**
 * Estado de las notificaciones push de ESTE dispositivo.
 *
 *   cargando       todavía no se consultó (también es lo que ve el servidor)
 *   no-disponible  el navegador no tiene push, o falta la clave pública
 *   apagado        se puede activar
 *   encendido      permiso concedido y suscripción vigente
 *   bloqueado      el permiso está denegado: el sitio ya no puede preguntar
 */
export type EstadoPush = "cargando" | "no-disponible" | "apagado" | "encendido" | "bloqueado";

/**
 * EL ESTADO SE DEDUCE, NUNCA SE GUARDA.
 *
 * No hay `localStorage` ni estado de React que diga "activado": cada vez que
 * algo pudo haber cambiado se le vuelve a preguntar al dispositivo por el
 * permiso y por la suscripción. Así, si alguien revoca el permiso desde los
 * ajustes del sistema, el botón se apaga solo al volver, y no hay un dato
 * guardado que pueda contradecir al navegador.
 *
 * Es un almacén externo y no un hook con `useState` porque lo leen dos piezas
 * que no se conocen -el botón flotante y la confirmación de compra-, y las dos
 * tienen que ver el mismo valor en el mismo momento.
 */
let estado: EstadoPush = "cargando";
const oyentes = new Set<() => void>();

function emitir(nuevo: EstadoPush) {
  if (nuevo === estado) return;
  estado = nuevo;
  oyentes.forEach((oyente) => oyente());
}

function soportado(): boolean {
  return (
    CLAVE_PUBLICA_VAPID !== "" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Número de consulta. Si dos reconciliaciones se pisan -un `visibilitychange`
 * justo mientras se activa-, solo publica la última que se pidió: una
 * respuesta vieja que llega tarde no puede sobrescribir a una nueva.
 */
let consulta = 0;

export async function reconciliar(): Promise<EstadoPush> {
  const esta = ++consulta;
  let resultado: EstadoPush;

  if (!soportado()) {
    resultado = "no-disponible";
  } else if (Notification.permission === "denied") {
    resultado = "bloqueado";
  } else if (Notification.permission !== "granted") {
    resultado = "apagado";
  } else {
    // `getRegistration` NO registra: quien nunca activó no instala nada.
    const registro = await navigator.serviceWorker.getRegistration("/");
    const suscripcion = registro ? await registro.pushManager.getSubscription() : null;
    resultado = suscripcion ? "encendido" : "apagado";
  }

  if (esta === consulta) emitir(resultado);
  return resultado;
}

/* ── Suscripción al almacén, para useSyncExternalStore ─────────────────── */

let permisoObservado: PermissionStatus | null = null;

const alVolverALaPestana = () => {
  if (document.visibilityState === "visible") void reconciliar();
};
const alCambiarPermiso = () => void reconciliar();

function empezarAObservar() {
  void reconciliar();
  // El caso que esto cubre: alguien fue a los ajustes del sistema, cambió el
  // permiso y volvió a la pestaña.
  document.addEventListener("visibilitychange", alVolverALaPestana);
  // Donde el navegador lo soporta, el cambio de permiso se avisa en el acto.
  navigator.permissions
    ?.query({ name: "notifications" })
    .then((permiso) => {
      permisoObservado = permiso;
      permiso.addEventListener("change", alCambiarPermiso);
    })
    .catch(() => {
      // Sin Permissions API para notificaciones: queda `visibilitychange`.
    });
}

function dejarDeObservar() {
  document.removeEventListener("visibilitychange", alVolverALaPestana);
  permisoObservado?.removeEventListener("change", alCambiarPermiso);
  permisoObservado = null;
}

export function suscribirse(oyente: () => void): () => void {
  oyentes.add(oyente);
  if (oyentes.size === 1) empezarAObservar();
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) dejarDeObservar();
  };
}

export const leerEstado = (): EstadoPush => estado;
export const leerEstadoEnServidor = (): EstadoPush => "cargando";

/* ── Acciones ─────────────────────────────────────────────────────────── */

export type ResultadoActivacion = {
  estado: EstadoPush;
  /**
   * El permiso está concedido pero el servicio push del navegador no dejó
   * suscribir. No es un estado del dispositivo -la próxima vez puede andar-,
   * así que no vive en el almacén: se devuelve para que la interfaz lo
   * explique en el momento.
   */
  fallo: boolean;
};

/**
 * Pide permiso si hace falta, registra el service worker y suscribe.
 *
 * Solo se llama después de un gesto de la persona: el aviso previo o el botón
 * con el permiso ya concedido. Chrome ignora los pedidos de permiso que no
 * vienen de un gesto.
 */
export async function activar(): Promise<ResultadoActivacion> {
  if (!soportado()) return { estado: await reconciliar(), fallo: false };

  const permiso =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permiso !== "granted") return { estado: await reconciliar(), fallo: false };

  let fallo = false;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const registro = await navigator.serviceWorker.ready;
    const clave = claveEnBytes(CLAVE_PUBLICA_VAPID);

    // Una suscripción creada con OTRA clave -porque se regeneraron las claves
    // VAPID- no sirve para enviar, y `subscribe` con la nueva falla mientras
    // la vieja exista. Se da de baja y se vuelve a crear.
    const existente = await registro.pushManager.getSubscription();
    const vigente =
      existente && mismaClave(existente.options.applicationServerKey, clave) ? existente : null;
    if (existente && !vigente) await existente.unsubscribe();
    if (!vigente) {
      await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clave });
    }
  } catch (error) {
    // `AbortError: Registration failed - push service error` es la respuesta
    // de Chromium cuando SU servicio push no deja registrar: medido en una PC
    // mientras el mismo código funcionaba en un Samsung A13. Pasa, por
    // ejemplo, en Brave, que trae apagado el servicio push de Google. No es un
    // error del sitio, así que va como advertencia y la interfaz lo explica;
    // un `console.error` además levanta el overlay de Next en desarrollo.
    console.warn("El servicio push del navegador no permitió suscribir:", error);
    fallo = true;
  }
  const estado = await reconciliar();
  // Si igual quedó encendido -una suscripción previa que sí servía-, no hubo
  // nada que explicar.
  return { estado, fallo: fallo && estado !== "encendido" };
}

/** Da de baja la suscripción. El permiso no se puede revocar desde JavaScript. */
export async function desactivar(): Promise<EstadoPush> {
  try {
    const registro = await navigator.serviceWorker.getRegistration("/");
    const suscripcion = registro ? await registro.pushManager.getSubscription() : null;
    await suscripcion?.unsubscribe();
  } catch (error) {
    console.warn("No se pudo dar de baja la suscripción push:", error);
  }
  return reconciliar();
}

/** La suscripción vigente en el formato que viaja al servidor, o null. */
export async function suscripcionActual(): Promise<PushSubscriptionJSON | null> {
  if (!soportado()) return null;
  const registro = await navigator.serviceWorker.getRegistration("/");
  const suscripcion = registro ? await registro.pushManager.getSubscription() : null;
  return suscripcion ? suscripcion.toJSON() : null;
}
