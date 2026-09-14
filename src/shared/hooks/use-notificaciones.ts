"use client";

import { useSyncExternalStore } from "react";
import {
  leerEstado,
  leerEstadoEnServidor,
  suscribirse,
  type EstadoPush,
} from "@/shared/lib/push/estado-push";

/**
 * Estado de las notificaciones push del dispositivo, siempre reconciliado.
 *
 * En el servidor y en la hidratación vale "cargando": el permiso y la
 * suscripción solo existen en el navegador. Quien lo use no debe mostrar nada
 * hasta que deje de valer eso, o la hidratación no coincidiría.
 */
export function useNotificaciones(): EstadoPush {
  return useSyncExternalStore(suscribirse, leerEstado, leerEstadoEnServidor);
}
