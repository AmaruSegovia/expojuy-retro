# Estado — ExpoJuy 2026

> Actualizado: 8 de septiembre de 2026. Cierre el 8 a las 23:59.

## Dónde estamos

**24 commits en `main`.** Fases 0, 1, 2 y **3 cerradas**: las diez secciones
están construidas y no queda ninguna ruta de la nav apuntando a un marcador.
CI en verde, deploy automático en cada push.

**Lighthouse recorrido el 8/9 con las diez secciones** (móvil): Performance
93 · Accesibilidad **100** · Buenas prácticas **100** · SEO 100. Las cuatro por
encima del objetivo de 90, así que la **fase 4 queda cerrada**.

La segunda medición encontró lo que la primera no podía ver: Buenas prácticas
había caído a 77 por el `action="mailto:"` de Contacto, una sección que no
existía cuando se midió por primera vez con 3 de 10. Detalle en
`03-pendientes.md`.

| | |
| --- | --- |
| Producción | https://expojuy-prototipo.vercel.app |
| Anexo del sistema de diseño | https://expojuy-prototipo.vercel.app/sistema-de-diseno |
| Repositorio | https://github.com/ch0ripain/expojuy-prototipo |

## Lo que ya funciona

**Base.** Next 16.3.4 · React 19.2.8 · Tailwind 4.3.3 · pnpm · React Compiler.
Arquitectura de tres capas con fronteras que hace cumplir ESLint. CI en GitHub
Actions: typecheck, lint, formato y build. Husky en cada commit y push.

**Sistema de diseño.** Paleta medida del logotipo oficial y confirmada después
contra los operadores del PDF. Neutros generados en OKLCH. Escalones de texto y
borde resueltos por búsqueda binaria contra su ratio WCAG. Escala tipográfica
fluida generada por script. Tipografía Ambit vía `next/font/local`.

**Shell.** Nav que se compacta y marca la sección activa por scroll · footer
revelado por debajo del contenido · barra de progreso · volver arriba · page
loader de 3.1s con la "J" y salida tipo intro de Los Simpsons.

El footer va `sticky` contra el borde inferior con z-index negativo, tapado
por el fondo opaco de `main`; al terminar el documento el borde de main sube y
lo destapa. El recorrido del efecto es exactamente el alto del footer, así que
no hay altura que reservar ni número mágico. Antes se intentaba al revés —la
última sección fijada y el footer subiendo a taparla— y no funcionaba; el
porqué, y por qué esa dirección no podía funcionar con un formulario de 1177px,
está en `03-pendientes.md`.

**Inicio.** Video de fondo con poster optimizado como LCP, elección de variante
por viewport, rotador 3D de cinco pares cada 3s.

**Sobre ExpoJuy.** Slider circular de cuatro ejes con asomo del 10% a cada
lado, bordes desvanecidos por máscara y navegación por botones, puntos y
teclado.

**Agenda.** Línea de tiempo con un trazo SVG que se dibuja conforme se
scrollea, la tarjeta alternando de lado y los datos siempre enfrente. El
avance es una custom property escrita por ref: ni un `setState` ni un
`getBoundingClientRect` por frame. Los nodos se encienden al cruzar la misma
altura de pantalla que el frente del trazo, así parece que los enciende la
línea al pasar.

**Expositores.** Bento de tres columnas que se deslizan en bucle infinito
—izquierda y derecha suben, la del medio baja—, cada tarjeta con la imagen a
sangre y el texto encima. La tarjeta ocupa DOS módulos de la ventana: el alto
que antes ocupaban dos tarjetas apiladas, con el hueco del medio incluido. Así
el paso del riel queda en el doble exacto y por ventana entra 1,5 de paso, o
sea una tarjeta entera y la mitad de la siguiente.

El bucle no se ve porque cada columna lleva su lista
duplicada y el riel se desplaza exactamente la mitad de su alto; para que esa
mitad sea exacta las tarjetas se separan con `margin-bottom` y no con `gap`.
Verificado midiendo, y vuelto a verificar tras duplicar la tarjeta: la media
vuelta da 4 pasos justos en escritorio y 12 en móvil, sin decimales. El paso
pasó de 240 a 480px en escritorio y de 176 a 352px en móvil.

La velocidad se fija con `SEGUNDOS_POR_TARJETA`, que es un TIEMPO POR PASO: más
bajo es más rápido. Vale 12 en escritorio y 6 en móvil. Móvil va al doble a
propósito: en escritorio las tres columnas corren en paralelo y los doce
expositores desfilan en el tiempo de una columna —4 pasos—, mientras que en
móvil hay una sola columna con los doce en fila —12 pasos—, así que a igual
tiempo por paso recorrer la muestra entera costaría el triple en el teléfono.

Medido muestreando el `translate` real, no leyendo la duración declarada:
escritorio 48s por columna a 40 px/s, móvil 72s a 58,7 px/s.

⚠️ Igualar los segundos por paso NO iguala la velocidad en píxeles: el paso
mide 480px en escritorio y 352 en móvil, así que las dos cosas no pueden
coincidir. Lo que se empareja es el ritmo con que cambian las tarjetas, que es
lo que se percibe. (Una versión anterior de este documento decía que ambos
breakpoints iban a 20 px/s; era el dato de escritorio nada más.)

Lleva control de pausa porque WCAG 2.2.2 lo exige para
todo lo que se mueve solo. En móvil es una sola columna con los doce, hacia
arriba: es el único caso del proyecto donde el breakpoint se lee en JS, porque
cambia el marcado y no la apariencia. Ahí además se puede arrastrar con el
dedo en los dos sentidos, y al soltar retoma solo: el arrastre mueve el
`currentTime` de la propia animación vía Web Animations API, así que la
continuidad no se calcula, está garantizada. Pausar y reanudar, en cambio,
son siempre del CSS —el arrastre marca `data-arrastrando`, el botón marca
`data-pausado`—: un `pause()` por API le sacaría al botón la autoridad sobre
la animación de forma permanente.

**Mapa.** Plano esquemático del predio de la Ciudad Cultural: derecho y
vertical, dibujo de línea, con las calles como bandas apenas visibles que dan
noción de ubicación sin competir con nada. Nueve lugares señalizados y el
recorrido que se dibuja desde el acceso al elegir uno; no es una recta, sale de
un grafo de circulación con Dijkstra, así que va por la calle y sale por un
ramal. El punto de entrada late mientras es el lugar activo.

Un cuarto de ancho para el plano y tres cuartos para el riel de lugares, con
asomo del 10% a cada lado y borde desvanecido. El plano y el riel no se
sincronizan entre sí: leen la misma posición, así que no hay un "seleccionado"
que pueda quedar desfasado del riel.

Toda la geometría se ubica con `sobreEje(avance, desvio)` sobre el eje de
circulación, así que las separaciones se verifican con una resta. Verificado:
cero solapes entre edificios y ningún marcador a menos de 44px de otro, con
áreas táctiles de 36. Responsive validado a 390, 820 y 1440.

**Noticias.** Slider horizontal de seis tarjetas con asomo del 10% a cada
lado, puntos y flechas, y el borde del asomo desvanecido con máscara.

La máquina del ciclo dejó de estar duplicada: vive en `useCarruselCircular`, en
shared/, y la comparten esta sección y el riel del Mapa. Sube solo la LÓGICA
—lista montada tres veces, normalización sin temporizadores, salto por el lado
más corto del anillo—; el marcado de cada tarjeta queda en su feature porque no
se parecen en nada. "Sobre ExpoJuy" todavía tiene su copia: migra cuando haya
que tocarlo.

**Preguntas frecuentes.** Acordeón excluyente de cinco preguntas —una sola
abierta a la vez, y volver a tocarla la cierra—, con una franja visual de un
quinto de ancho a la derecha que acompaña el alto del acordeón sin ningún alto
fijo. En pantallas chicas la franja no se muestra.

Se sirve ABIERTO: el estado plegado no está en el marcado sino en una regla de
CSS que solo aplica detrás de `.js`. Si el JavaScript no corre, la sección es
una lista de preguntas con sus respuestas a la vista. Verificado sacando la
clase en vivo: los altos pasan de [83, 0, 83, 0, 0] a [83, 83, 83, 83, 83].

Es el único lugar del sitio donde se anima una propiedad de layout
(`grid-template-rows`), y es inevitable: para que el contenido de abajo suba al
plegarse, el panel tiene que dejar de ocupar lugar. El motivo está escrito en
el CSS.

**Contacto.** Tres cuartos de formulario y un cuarto de franja visual a la
derecha, con la misma grilla que Preguntas y estirada a todo el alto de la
fila; en pantallas chicas la franja no se muestra.

El formulario no reimplementa ninguna regla de validación: lee el
`ValidityState` del propio control y solo aporta el texto, que es lo único que
el navegador hace mal —sin traducir, sin estilar y desaparece solo—. La
validación nativa se apaga desde un efecto y NO desde el JSX: si `noValidate`
viajara en el HTML servido, un fallo del script dejaría el formulario sin
ninguna validación. Verificado con `curl`: el HTML servido no trae `novalidate`
y sí trae `required`, `pattern` y `minlength`.

Y el botón hace lo que dice. Sin backend, "enviar" no puede significar "lo
guardamos", así que el formulario COMPONE un correo y abre el cliente de la
persona con todo listo.

El camino sin JavaScript cambió de forma el 8/9. Era un `action="mailto:"` con
`enctype="text/plain"`, que serializaba los campos en el cuerpo, y funcionaba
mejor que lo que hay ahora; pero Chrome trata cualquier `action` con esquema
distinto de https como CONTENIDO MIXTO —aunque un `mailto:` no mande nada por
la red— y eso dejaba Buenas prácticas en 77 contra el objetivo de 90. Ahora el
camino sin JavaScript es un ENLACE `mailto:` con el destinatario y el asunto
puestos, que Lighthouse no marca. Se resigna que los campos escritos viajen en
el cuerpo.

Los dos se excluyen por CSS y no por JavaScript: sin la clase `.js` no se
muestra el botón —no podría hacer nada— y sí el enlace; con `.js`, al revés. Se
sirve el estado degradado, como en todo el resto del proyecto. Verificado
sacando la clase en vivo y con `curl`: el HTML servido no trae `action` ni
`novalidate`, y sí trae el enlace, `required`, `pattern` y `minlength`.

Se agregó el primer color derivado que no sale del logotipo, `--color-danger`,
para el estado de error. El hue es el complementario del cian de marca
(208.67° → 28.67°), el croma es el máximo que admite el gamut sRGB (0.234, ya
dentro del rango de la marca) y la lightness se resolvió por búsqueda binaria
hasta 4.5:1 contra `surface-overlay`. Un solo token sirve para el texto del
error y para el borde del campo. Está renderizado en `/sistema-de-diseno`.

Verificado en el navegador con los ocho pasos de la máquina de validación,
incluido un mensaje de 25 espacios —que el navegador da por válido y nosotros
no— y un teléfono con letras. Contraste medido: 5.54:1 el texto del error sobre
la sección, 5.13:1 el borde sobre el campo.

**Entradas.** Mitad píldoras y mitad collage de tres visuales inclinados, con
el riel de medios de pago abajo. En pantallas chicas el collage no se muestra,
como las franjas de Preguntas y Contacto.

Las píldoras son PESTAÑAS de verdad: `tablist`/`tab`/`tabpanel` con tabindex
rotante —la lista entera es una sola parada del tabulador— y navegación por
flechas, Inicio y Fin. Muestran tipos de entrada con precio y no métodos de
pago: el riel de abajo ya cubre los medios, y leído literal el plan pedía las
dos cosas diciendo lo mismo.

Son TRES —Estudiantes, General y Empresas— y con tres la fila no envuelve ni en
un teléfono de 390px: 338px de píldoras y huecos contra 350 de contenido. Con
cuatro caían en dos filas y se leía como una grilla de opciones en vez de un
selector.

Los tres paneles SE SIRVEN VISIBLES y los pliega una regla de CSS detrás de
`.js`, igual que el acordeón de Preguntas. Con el atributo `hidden`, un fallo
del script dejaría dos de los tres precios inalcanzables. Verificado sacando la
clase en vivo: los altos pasan de [397, 0, 0] a [440, 440, 440], y el nombre
del tipo —escondido por `.js` porque la píldora activa ya lo dice— reaparece en
los tres. El HTML servido trae los tres precios y ningún `hidden`.

"Comprar" abre un FORMULARIO DE PAGO ILUSTRATIVO. No simula un checkout: dice
qué iría en su lugar —tres métodos genéricos, sin marcas— y lo declara con un
estado vacío, la "J" en monocromía sobre un borde punteado. Un checkout falso
que acepte un número de tarjeta y responda "listo" es la clase de maqueta que
se confunde con la realidad, y encima entrena a alguien a tipear una tarjeta en
un sitio que no la procesa.

Es un `<dialog>` NATIVO abierto con `showModal()`, así que el navegador resuelve
el foco al entrar y su devolución al botón que lo abrió, la inertización del
resto de la página, Escape y el `::backdrop`. Lo único a mano es frenar a
Lenis: el scroll suave escucha `wheel` sobre `window` y la capa superior no se
lo impide, así que sin `lenis.stop()` la página de atrás se desplaza debajo del
modal. Verificado: con el modal abierto una rueda de 600px deja el scroll en
8441; al cerrar con Escape el foco vuelve a "Comprar" y la misma rueda lo mueve
a 8927. Cierra también con click en el fondo, y un click adentro no lo cierra.

Los precios se muestran declarados como de referencia en la interfaz y no solo
en un comentario: es el único dato de la maqueta que alguien podría anotar y
presupuestar.

El riel de medios de pago va DENTRO del contenedor de 1024px, alineado con el
resto de la sección. Lo que evita que se lea como una lista recortada no es el
ancho sino la máscara: los dos bordes se desvanecen, así que el riel se apaga
en vez de chocar contra un corte recto. Se mueve solo, así que lleva el
requisito completo de WCAG 2.2.2. Verificado midiendo el objeto `Animation`: 216,7ms de avance
corriendo, 0 pausado, 222,3 al reanudar. El bucle cierra EXACTO —error de 0px—
aunque los once ítems tengan once anchos distintos: cada uno carga su propio
`margin-right`, así que el riel mide el doble justo de una copia. Con
`prefers-reduced-motion` la fila se despliega en vez de congelarse: pasa de 56
a 112px de alto, la copia del bucle se esconde y los once medios quedan a la
vista.

El control de pausa se extrajo a `shared/components/ui/boton-pausa.tsx` y ahora
lo comparten el bento y este riel. No es una limpieza cosmética: es el
mecanismo que WCAG 2.2.2 exige, y duplicado cada copia podía perder por su
cuenta el `aria-pressed`, el nombre accesible o los 48×48. El bento se verificó
después de migrar y quedó idéntico.

**Sponsors.** Grilla de 4×4 con un marcador de cuatro esquinas en "L" que viaja
de una ficha a otra. Es un solo elemento del tamaño exacto de una celda que
únicamente cambia `translate`: como las dieciséis celdas son idénticas, nunca
necesita cambiar de tamaño.

Y NO SE MIDE, SE CALCULA. Su posición sale de dos números —`--sponsors-i`, que
escribe el componente, y `--sponsors-cols`, que declara el CSS por breakpoint—
con `mod()` para la columna y `round(down, …)` para la fila. No hay un solo
`getBoundingClientRect`, ni `ResizeObserver`, ni listener de resize: al cambiar
el breakpoint la posición se reacomoda sola. Los porcentajes del `translate` se
resuelven contra la caja del propio elemento, así que `100% + hueco` es el paso
de la grilla en los dos ejes sin escribir ninguna medida. Verificado: cero
desalineados en las 16 fichas a 402, 767, 768, 1440 y 1920.

El marcador señala la ÚLTIMA ficha activa y se queda ahí. El puntero es quien
la activa —filtrando por `pointerType === "mouse"`, para que un dedo no entre
nunca en ese camino— y una vez que tomó el mando se lo queda: sacar el mouse no
desactiva nada, porque apuntar una ficha es una acción y dejar de apuntarla no
es otra. Mientras el puntero no haya intervenido manda el scroll, que en un
teléfono es siempre.

Nada se mueve solo, así que esta sección NO hereda el control de pausa del
bento. La especificación original —tres sliders horizontales infinitos— sí lo
habría necesitado.

La "J" ocupa el lugar del logotipo del auspiciante, en monocromía vía un
`monocromo` nuevo en `BrandMark` que pinta las piezas con `currentColor`: a
todo color, dieciséis isologotipos dirían que ExpoJuy se auspicia a sí misma.
Contraste medido: esquinas violeta 3,20:1 sobre la ficha activa —pasa WCAG
1.4.11— y la "J" activa 6,38:1.

Va sin copete numerado y fuera de la nav, como franja de cierre después de
Contacto. Ver la invariante en `site.ts`.

## Próximo paso

**Las seis fases están cerradas.** La fase 4 quedó medida en los dos perfiles
de Lighthouse y la fase 6 entregó los dos documentos en `docs/propuesta/`:

- `memoria-descriptiva-purple.html` — memoria y explicación conceptual, con capturas
  del prototipo, paleta y los números medidos. Diseño «expediente retro» en
  papel claro, pensado para exportarse a PDF desde el navegador.
- `declaracion-ia-purple.html` — herramientas, método (especificar → implementar →
  medir → aprobar → commit), documentación IA-first y límites de uso.

Ambos son HTML autocontenidos: tipografía Ambit y capturas embebidas en
base64. Se exportan con Ctrl+P → «Guardar como PDF» → activar «Gráficos de
fondo».

Queda en manos del equipo: exportar los dos PDF, completar el formulario de
inscripción y presentar antes de las 23:59 de HOY, 8 de septiembre.

## Cómo se trabaja

Fase por fase. Dentro de cada una:

1. Implementar
2. Validar en el navegador midiendo el DOM, no mirando capturas
3. **Mostrar el resultado y esperar la validación de Leandro**
4. Aplicar sus mejoras
5. Recién ahí commitear

No commitear sin que haya aprobado.

## Entorno

- **Navegador:** Chrome ("Chrome Leo", `b5e7427f-…`). Brave bloquea todo HTTP y
  no sirve para ver `localhost`.
- **La pestaña suele estar oculta** (`visibilityState: hidden`). Eso hace que
  Chrome throttlee `requestAnimationFrame` a cero y difiera la carga de video.
  Explica falsos "congelamientos" al medir y que `transitionend` no dispare.
- **Las capturas vienen escaladas** respecto del viewport real: sirven para ver,
  no para medir. Para medir, `getBoundingClientRect` desde la consola.
- **Para probar TÁCTIL hace falta `emulate`, no `resize_page`.** `resize_page`
  solo cambia el tamaño: el navegador sigue diciendo `hover: hover` y
  `pointer: fine`, así que las reglas de escritorio siguen aplicando y un bug
  de táctil no aparece. Con `emulate` y `412x823x2.6,mobile,touch` sí.
- **Para cambiar el viewport, `resize_page` del MCP de chrome-devtools.** Cambia
  el tamaño por CDP en vez de mover la ventana del sistema operativo, y sí
  responde en este entorno. Con eso el responsive se puede validar de verdad.
- **Para mover el scroll**, los enlaces de la nav (`a[href="#seccion"].click()`)
  o eventos `wheel` sintéticos, que Lenis sí escucha. Ojo: su inercia amplifica
  los deltas, así que aterrizar en una posición exacta cuesta; si hace falta
  encuadrar algo, sale más barato agrandar el viewport que insistir con el
  scroll.
- **ffmpeg** instalado vía winget, en
  `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_…\bin\`
- **Vercel CLI** se usa con `pnpm dlx vercel@latest` (no está instalado global).
- El proyecto vive dentro de OneDrive.
