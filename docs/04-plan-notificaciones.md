# Plan - Notificaciones push

> Escrito el 14 de septiembre de 2026 y revisado con Leandro el mismo día.
> Estado: **implementado y validado** en un Samsung A13 y en Chrome de PC, en
> cuatro commits sobre `feat/funcionalidades-extra`. Falta cargar las claves
> VAPID en Vercel para que funcione en producción.
>
> Diferencias con lo planeado, todas medidas o pedidas:
>
> - El QR no va como `<img>`: se leyeron sus 29x29 módulos del PNG y se dibuja
>   como SVG, nítido a cualquier tamaño. Verificado decodificando una captura
>   de la pantalla.
> - El fondo de la entrada digital es el morado del loader, a pedido de Leandro.
> - El aviso previo suma una tercera variante, "fallo", para cuando el servicio
>   push del navegador no deja suscribir. Apareció en Brave.

## Objetivo

Que la compra de una entrada termine con una notificación push real en el
dispositivo, que al tocarla lleve a la entrada digital con el QR de acceso, y
que la persona pueda activar o desactivar las notificaciones desde un botón
flotante que refleje siempre el estado verdadero del dispositivo.

Cuatro piezas:

1. **Compra de demostración** en el modal de Entradas: elegir método,
   "Comprar", confirmación en el modal y, dos segundos después, la
   notificación.
2. **Botón flotante de notificaciones**, abajo a la derecha, apilado debajo
   del de volver arriba, con un aviso previo propio antes del pedido de
   permiso del navegador.
3. **Entrada digital** en `/entrada-digital`, la vista a la que lleva la
   notificación.
4. **Reconciliación**: el botón no guarda un estado propio, lo deduce del
   permiso y de la suscripción del dispositivo cada vez que puede haber
   cambiado.

## Decisiones tomadas

| # | Decisión | Elegido |
| --- | --- | --- |
| - | Tipo de notificación | Web Push real, sin base de datos: la suscripción viaja junto con la compra |
| - | Compra con notificaciones apagadas | Se confirma igual, con un texto que invita a activarlas |
| - | Check de compra confirmada | Relleno `bg-primary` con check `text-on-primary`, 5,05:1. Sin token nuevo |
| 1 | Botón después del spinner | Check + **"Comprado"** |
| 2 | Textos de la confirmación | Ver "Compra de demostración". Sin botón de activar y sin aviso de demostración |
| 3 | Espera antes de enviar | 2 s, para que la notificación llegue con la confirmación ya a la vista |
| 4 | Aviso previo | Tarjeta oscura arriba y centrada, adaptada al sistema: esquinas vivas, botón píldora, la J a la izquierda |
| 5 | Claves VAPID | `.env.local` por ahora. El dueño del repositorio las carga en Vercel |
| 6 | Dónde vive el interruptor | Botón flotante abajo a la derecha, **no en el pie**. Aparece al salir del inicio |
| 7 | Destino de la notificación | Vista dedicada `/entrada-digital` con el QR de la demo |

## Arquitectura

La compra vive en `features/tickets`, el botón flotante en `shared/` y la
entrada digital es una ruta propia. Como un feature no puede importar a otro y
`shared/` no puede mirar hacia arriba, **todo lo que toca push sube a
`shared/`** y los consumidores lo importan de ahí.

```
public/
  sw.js                                     service worker: push, notificationclick, activate
  entrada-digital/qr-demo.png               QR que lleva al sitio publicado

src/app/
  entrada-digital/page.tsx                  ruta: compone el feature, noindex
  notificaciones/icono/route.tsx            PNG 192x192 de la J a color, derivado de BRAND_PATHS
  notificaciones/insignia/route.tsx         PNG 96x96 de la J en blanco sobre transparente

src/features/entrada-digital/
  components/entrada-digital.tsx            encabezado, descripción, QR y vuelta al sitio

src/features/tickets/components/
  modal-pago.tsx                            sale de tickets-section.tsx: métodos, compra y confirmación

src/shared/
  lib/push/claves.ts                        clave pública VAPID y conversión a Uint8Array
  lib/push/estado-push.ts                   almacén externo: permiso + suscripción, suscribir y desuscribir
  lib/push/enviar-notificacion.ts           "use server": envía la push de la compra con web-push
  hooks/use-notificaciones.ts               useSyncExternalStore sobre estado-push
  components/ui/aviso-notificaciones.tsx    el aviso previo, <dialog> nativo arriba y centrado
  components/layout/acciones-flotantes.tsx  la pila: volver arriba encima, notificaciones debajo
```

`back-to-top.tsx` se integra en `acciones-flotantes.tsx`: los dos botones
comparten posición, pila y la misma fuente de visibilidad, y separados
tendrían que coordinar su altura a mano.

### Por qué un almacén externo y no estado de React

El botón flotante y la confirmación del modal muestran el mismo dato. Si
alguien activa las notificaciones desde el botón con el modal abierto en otra
pestaña, o al revés, cada parte tiene que enterarse sin recargar. Un almacén
con `useSyncExternalStore` es una sola fuente, y la reconciliación escribe ahí.

## Service worker

`public/sw.js`, sin paso de compilación:

- **`push`**: lee el JSON y llama a `showNotification` con título, `icon`,
  `badge`, `tag: "entrada"` y `data.url`. Si llega sin datos, muestra el
  título por defecto: Chrome penaliza un push que no termina en notificación.
- **`notificationclick`**: cierra la notificación y lleva a
  `/entrada-digital`. Si hay una pestaña del sitio abierta, la enfoca y la
  navega; si no, abre una.
- **`activate`**: `clients.claim()`, para que la pestaña que acaba de activar
  las notificaciones quede controlada sin recargar. Sin eso, al tocar la
  notificación no se la podría navegar y se abriría una pestaña nueva.
- **Nada de `fetch`.** Sin caché ni modo sin conexión: un service worker que
  intercepta pedidos cambia la carga entera y obliga a volver a medir todo.

El registro se hace **recién al activar**, no al cargar la página: quien nunca
toca el botón no instala nada. Para reconciliar alcanza con
`navigator.serviceWorker.getRegistration()`, que no registra.

Encabezados en `next.config.ts` para `/sw.js`: `Cache-Control: no-cache,
no-store, must-revalidate` y `Content-Type: application/javascript;
charset=utf-8`, como indica la guía de PWA de Next 16
(`node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`).

## Íconos

Los dos salen de `BRAND_PATHS`, igual que el favicon: no hay PNG copiados que
se desincronicen del logotipo.

- **Ícono**, 192x192: la J a color sobre `--color-surface`, con el mismo aire
  que el favicon.
- **Insignia**, 96x96: la J en blanco sólido sobre transparente. Android usa
  solo el canal alfa de la insignia, así que a color no se vería.

Se generan con `ImageResponse` de `next/og` en dos rutas estáticas. Verificar
antes que la versión instalada dibuje `<path>` con `fill-rule` y el
`scale(1, -1)` del grupo; si no, se pasa la J como `data:` URI dentro de un
`<img>`.

## Envío

Server Action `enviarNotificacionCompra(suscripcion)`:

- **El contenido lo fija el servidor.** El cliente solo manda la suscripción;
  título, ícono y URL son constantes. Nadie puede usar el endpoint para mandar
  un texto propio.
- **El `endpoint` se valida contra una lista de servicios push** (FCM de
  Google, Mozilla, Apple y Microsoft). `web-push` hace un POST a esa URL: sin
  la lista, cualquiera podría usar el servidor para pegarle a una dirección
  arbitraria.
- **Suscripción vencida** (404 o 410): se devuelve `{ estado: "vencida" }` y el
  cliente se desuscribe y reconcilia.
- Título: **"¡Ya podés utilizar tu QR de acceso!"**, sin cuerpo.

Variables de entorno, **fuera del repositorio** (`.env*` ya está ignorado):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:...
```

Se generan con `pnpm dlx web-push generate-vapid-keys` y van en `.env.local`.
ATENCION: **en producción no funciona hasta que el dueño del repositorio cargue
las tres en Vercel.** Sin la clave pública el botón se muestra como no
disponible en vez de fallar al tocarlo.

## Compra de demostración

Hoy el modal dice que es un ejemplo y no tiene acción. Pasa a esto:

1. Los tres métodos son **radios de verdad** dentro de un `fieldset` con
   `legend`. Siguen sin pedir ningún dato de pago: se elige un método, no se
   carga una tarjeta.
2. "Comprar" nace deshabilitado y se habilita al elegir un método.
3. Al tocarlo: **spinner + "Comprando…"**, botón deshabilitado y `aria-busy`.
   Unos 1,5 s simulados.
4. **Check + "Comprado"** en el botón, unos 600 ms.
5. El contenido del modal se reemplaza por la **confirmación**: disco violeta
   con check blanco en el centro y un `role="status"` que la anuncia.
6. A los **2 s** se llama a la Server Action, si las notificaciones están
   activas.

Textos:

- Con notificaciones activas: **"¡Compra confirmada!"** / "En unos segundos te
  llega una notificación con tu entrada y el QR de acceso."
- Con notificaciones apagadas: **"¡Compra confirmada!"** / "Activá las
  notificaciones para recibir tu entrada y el QR de acceso en este
  dispositivo." Sin botón: el acceso es el botón flotante.

Con `prefers-reduced-motion` el spinner no gira: queda el ícono fijo y el texto
"Comprando…", que es lo que transmite el estado.

## Botón flotante de notificaciones

### Cuándo aparece cada botón

Hoy volver arriba aparece a las dos alturas de viewport. Pasa a depender de la
**sección activa**, con `useActiveSection` sobre `NAV_SECTIONS`, que ya usan el
encabezado y la isla:

| Sección activa | Notificaciones | Volver arriba |
| --- | --- | --- |
| Inicio | no | no |
| Sobre ExpoJuy | sí | no |
| Agenda en adelante, incluidos Sponsors y el pie | sí | sí, encima |

Nunca en el inicio: el hero ya tiene video, rotador, dos llamadas a la acción,
indicador de scroll y la isla móvil. Un botón más lo recarga.

### Pila

- Abajo a la derecha, con la misma posición que hoy tiene volver arriba: sobre
  la isla móvil gracias a `--espacio-barra-movil`, y a `2rem` del borde desde
  `lg`.
- Columna: **notificaciones abajo, volver arriba encima**. El lugar de volver
  arriba se reserva aunque esté oculto, así que al aparecer no empuja al de
  notificaciones: no hay salto de posición.
- Los dos con el mismo dibujo que el botón actual: 48px, píldora, borde
  `border-strong`, fondo `surface-overlay` translúcido con desenfoque.
- Oculto con `inert` y opacidad, como hoy, para que no quede una parada
  fantasma en el tabulador.

### El botón

- `<button role="switch" aria-checked>` con nombre accesible "Notificaciones".
- **El estado no depende del color**: apagado es la campana tachada
  (`BellOff`), encendido es la campana con ondas (`BellRing`) sobre relleno
  `primary`.
- Estados:
  - **apagado** y **encendido**;
  - **bloqueadas** (permiso denegado): campana tachada; al tocarla, el aviso
    previo en su variante informativa, "Las notificaciones están bloqueadas en
    este navegador. Habilitalas desde la configuración del sitio.", con un solo
    botón "Entendido";
  - **no disponibles** (sin `PushManager` o sin clave pública, por ejemplo
    Safari de iOS sin instalar): el botón no se muestra. No hay nada que
    ofrecer.
- Al pasar de un estado a otro, un `role="status"` visualmente oculto anuncia
  "Notificaciones activadas" o "Notificaciones desactivadas".
- **Mejora progresiva**: sin JavaScript no puede hacer nada, así que no se
  renderiza hasta hidratar. No es contenido, es un control que solo existe con
  JavaScript.

### Aviso previo

Se abre al tocar el botón apagado con el permiso sin decidir. `<dialog>`
nativo con `showModal()`, arriba y centrado, como el diálogo de pago: el
navegador resuelve el foco, Escape y la inertización del resto, y hay que
frenar a Lenis.

Tomado de la referencia y adaptado al sistema:

- **Tarjeta en tinta**, `surface-overlay` con borde `border-strong`, **esquinas
  vivas**: el sistema solo usa radio 0 o píldora.
- A la izquierda **la J** del isologotipo, a color.
- A la derecha **"Activá las notificaciones"** en `text` y "No te pierdas las
  novedades y eventos más importantes" en `text-muted`.
- Abajo a la derecha, **"Ahora no"** como botón de texto y **"Activar"** como
  píldora `primary` con la campana. Recién "Activar" llama a
  `Notification.requestPermission()`.
- Ancho máximo 34rem; en un teléfono ocupa el ancho con los márgenes laterales
  del sitio.

El motivo del aviso previo es concreto: si el navegador muestra su pedido y la
persona lo rechaza, el sitio ya no puede volver a preguntar. El aviso propio se
puede descartar sin quemar ese permiso.

### Flujo al tocar el botón

| Estado actual | Permiso | Qué pasa |
| --- | --- | --- |
| Apagado | sin decidir | Aviso previo → "Activar" → pedido del navegador → si acepta, registra el SW, suscribe y queda encendido |
| Apagado | concedido | Registra y suscribe directo, sin aviso: ya dijo que sí |
| Encendido | concedido | `subscription.unsubscribe()` y queda apagado. El permiso no se puede revocar desde JavaScript |
| Bloqueadas | denegado | Aviso informativo con "Entendido" |

## Reconciliación

El estado se **deduce, nunca se guarda**:

```
encendido = Notification.permission === "granted" && suscripción existente
```

Se vuelve a calcular:

- al montar;
- en `visibilitychange` cuando la pestaña vuelve a verse, que es el caso de
  quien fue a los ajustes del sistema y volvió;
- en el `change` de `navigator.permissions.query({ name: "notifications" })`,
  donde el navegador lo soporte;
- cuando la Server Action devuelve `vencida`.

Si el permiso se revoca desde el sistema, la suscripción deja de servir y el
botón pasa a apagado solo. No hay `localStorage` que pueda contradecir al
dispositivo.

## Entrada digital

Ruta **`/entrada-digital`**. Se descartó `/mi-entrada`: en la voz del sitio el
visitante no habla en primera persona ("Elegí la que te sirve"), y
`/entrada-digital` dice qué es sin ambigüedad. `/acceso` también se descartó
porque se lee como una pantalla de inicio de sesión.

Contenido:

- Encabezado **"Bienvenido a la ExpoJuy 2026"**.
- Descripción **"¡Ya podés usar tu código QR de acceso en los puntos de entrada
  habilitados!"**.
- El **QR** de la demo, que lleva al sitio publicado.
- Debajo, en chico, la fecha y la sede de `SITE`, y un enlace "Volver al
  sitio".

Decisiones de construcción:

- **Server Component** entero: no tiene estado ni efectos.
- **El QR va sobre papel.** Un lector necesita módulos oscuros sobre fondo
  claro, así que el QR se apoya en una tarjeta `.en-papel` con su zona de
  silencio, aunque la página sea tinta.
- **`<img>` y no `next/image`, con `image-rendering: pixelated`.** El
  optimizador lo convertiría a WebP con pérdida, que ensucia los bordes de los
  módulos, y un reescalado suave los desenfoca. El PNG mide 500x500 y en un
  teléfono se muestra a unos 260px de CSS.
- **Sin encabezado ni isla del sitio**: sus enlaces son anclas de la página de
  inicio. La vista lleva la J enlazada a `/` y nada más.
- **`robots: noindex`** y fuera del sitemap: es una vista de una entrada, no una
  página para encontrar en un buscador.
- **Sin loader.** Ya corregido: el bloqueo de scroll del loader ahora aplica
  solo en páginas que tienen loader (`html[data-loader]:has(.page-loader)`).
  Antes el script de arranque marcaba el atributo en todas las rutas y
  `/sistema-de-diseno` quedaba sin scroll táctil toda la sesión.

## Dependencias y licencias

- `web-push` y `@types/web-push` en desarrollo. ATENCION: **la licencia de
  `web-push` es MPL-2.0, no MIT** como decía la primera versión de este plan;
  verificado con su `package.json`. Leandro aprobó usarla igual: el copyleft de
  la MPL-2.0 alcanza solo a los archivos de la propia librería, que no se
  modifican. Sus dependencias transitivas son MIT, ISC, BSD-3-Clause y
  Apache-2.0.
- `docs/licencias.md` no existía aunque `CLAUDE.md` lo citaba. Se creó con
  Tabler, Lucide, `web-push` y el resto de las dependencias de ejecución.
- El QR lo aportó Leandro. Se descartaron dos versiones: la de me-qr.com, que
  pasa por una redirección propia del generador, y una con marca de agua de
  the-qrcode-generator.com. La elegida se decodificó y codifica
  `https://expojuy-retro.vercel.app/` directo, versión 3 (29x29 módulos).

## Verificación

- `pnpm run verify` y `pnpm run build`.
- Chrome de escritorio: activar, comprar, recibir, tocar la notificación y
  llegar a `/entrada-digital`, desactivar, revocar desde la configuración del
  sitio y ver que el botón se apaga al volver.
- Samsung A13 por forward de puerto: `localhost` es contexto seguro, así que el
  service worker y push funcionan sin HTTPS local.
- Visibilidad de la pila en cada sección, a 390, 820 y 1440px, y que ningún
  botón tape la isla móvil.
- Teclado y lector de pantalla: foco del aviso, `role="switch"`, anuncios de
  estado y de la confirmación.
- El QR se lee con la cámara de un teléfono desde la pantalla de otro.
- Lighthouse móvil y escritorio, mediana de varias corridas, en inicio y en
  `/entrada-digital`.

## Orden de trabajo

Un commit por pieza aprobada, sin mezclar:

1. `feat(notificaciones)`: service worker, íconos, encabezados y envío.
2. `feat(notificaciones)`: pila flotante con el botón, aviso previo y
   reconciliación.
3. `feat(entradas)`: compra de demostración con confirmación y push.
4. `feat(entrada-digital)`: la vista del QR y el destino de la notificación.
