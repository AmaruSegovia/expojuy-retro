/*
 * Service worker de ExpoJuy 2026. SOLO NOTIFICACIONES.
 *
 * No escucha `fetch` a propósito: un service worker que intercepta pedidos
 * cambia cómo carga el sitio entero, y eso obligaría a volver a medir todo.
 * Lo registra recién quien activa las notificaciones, no cualquier visita.
 *
 * El contenido de cada notificación lo manda el servidor
 * (src/shared/lib/push/enviar-notificacion.ts). Lo de acá abajo es solo el
 * respaldo si un push llega sin datos legibles: Chrome penaliza un push que no
 * termina en una notificación visible.
 */

const POR_DEFECTO = {
  titulo: "ExpoJuy 2026",
  url: "/",
  etiqueta: "expojuy",
  icono: "/notificaciones/icono",
  insignia: "/notificaciones/insignia",
};

self.addEventListener("install", () => {
  // Sin esperar a que se cierren las pestañas viejas: este service worker no
  // cachea nada, así que no hay versiones mezcladas que proteger.
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  // Toma control de la pestaña que lo acaba de registrar. Sin esto, al tocar la
  // notificación esa pestaña no se podría navegar y se abriría otra.
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    // Datos que no son JSON: se muestra el respaldo en vez de no mostrar nada.
  }
  const notificacion = { ...POR_DEFECTO, ...datos };

  evento.waitUntil(
    self.registration.showNotification(notificacion.titulo, {
      icon: notificacion.icono,
      badge: notificacion.insignia,
      tag: notificacion.etiqueta,
      lang: "es-AR",
      data: { url: notificacion.url },
    }),
  );
});

/** Solo rutas del propio sitio: una URL de otro origen cae al inicio. */
function destinoSeguro(url) {
  try {
    const destino = new URL(url, self.location.origin);
    return destino.origin === self.location.origin ? destino.href : self.location.origin;
  } catch {
    return self.location.origin;
  }
}

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = destinoSeguro(evento.notification.data && evento.notification.data.url);

  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const delSitio = ventanas.find(
        (ventana) => new URL(ventana.url).origin === self.location.origin,
      );

      // Si ya hay una pestaña del sitio, se reusa: se enfoca y se navega. Solo
      // se puede navegar una pestaña que este service worker controla; si no la
      // controla, `navigate` falla y se abre una nueva.
      if (delSitio) {
        try {
          await delSitio.focus();
          await delSitio.navigate(destino);
          return;
        } catch {
          // Pestaña no controlada: se sigue con una ventana nueva.
        }
      }
      await self.clients.openWindow(destino);
    })(),
  );
});
