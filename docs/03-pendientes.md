# Pendientes y anotaciones - ExpoJuy 2026

## 🚩 Bloqueantes antes de entregar

### Material de terceros en el hero

`public/media/hero-*` es una aérea nocturna de **una ciudad de EE.UU.** (se
leen carteles de KeyBank y Wells Fargo). Licencia libre y sin marca de agua,
así que sirve para maquetar, pero:

- El plan pide vista cenital de la **Ciudad Cultural de Jujuy**
- Un jurado local va a notar que no es Jujuy
- "Identidad institucional" es criterio de evaluación explícito

Reemplazar manteniendo los nombres de archivo. Encode:

```bash
ffmpeg -i master.mp4 -vf "scale=1920:1080:flags=lanczos" \
       -c:v libvpx-vp9 -b:v 0 -crf 48 -row-mt 1 -tile-columns 3 \
       -cpu-used 2 -pix_fmt yuv420p -an hero-1080.webm
```

`-b:v 0` es lo que hace que `-crf` funcione como calidad constante. Sin eso
libvpx lo trata como un tope dentro de un objetivo de bitrate y el archivo sale
**más pesado que el original** - ya pasó: un WebM de 46,7 MB desde un MP4 de
20,4 MB.

### Se descartó un clip por marca de agua

Un primer video tenía marca de agua de stock. No se usó: quitarla sería
sortear el mecanismo que protege una licencia que el clip no tiene.

### Contenido provisorio

Todo lo textual está marcado `PROVISORIO` en el código:

| Dónde | Qué |
| --- | --- |
| `shared/constants/site.ts` | Fechas, sede, redes sociales y **canales de contacto** |
| `features/about/constants/slides.ts` | Descripciones y cifras de las 4 láminas |
| `features/hero/constants/media.ts` | Mitad derecha de los pares del rotador |
| `features/agenda/constants/actividades.ts` | Las 6 actividades: títulos, horarios, descripciones y expositores |
| `features/exhibitors/constants/expositores.ts` | Los 12 expositores: nombres, rubros, días y stands |
| `features/venue-map/constants/plano.ts` | Nombres y descripciones de los 9 lugares del predio |
| `features/news/constants/noticias.ts` | Las 6 noticias: títulos, copetes, fechas y temas |
| `features/faq/constants/preguntas.ts` | Las 5 respuestas. Varias dependen de datos sin confirmar: precios, horarios y reintegros |
| `features/sponsors/constants/sponsors.ts` | Los 16 auspiciantes: nombres de fantasía, y NO hay un solo logotipo |
| `features/tickets/constants/entradas.ts` | **Los 3 precios**, qué incluye cada entrada y los 11 medios de pago |

ATENCION: Los precios de `entradas.ts` son el dato provisorio más consultable de
todos: alguien puede anotarlos y presupuestar con ellos. Por eso la sección lo
DICE en la interfaz -"precio de referencia, sujeto a confirmación"- en vez de
dejarlo en un comentario. Además varias respuestas de Preguntas frecuentes
dependen de ellos: si cambian acá, revisar allá.

ATENCION: Los once medios de pago tienen el mismo problema que los auspiciantes, un
escalón más abajo: nombrar una marca afirma que ExpoJuy la acepta, y eso no
está confirmado.

ATENCION: Los auspiciantes merecen una advertencia propia, y por el motivo contrario
al del resto: una noticia inventada se lee como maqueta, pero un auspiciante
inventado AFIRMA un vínculo comercial que nadie confirmó. Por eso ninguno de
los dieciséis nombres corresponde a una empresa real -son composiciones de un
topónimo jujeño y un rubro- y la Cámara de Comercio Exterior no figura ahí: es
la organizadora, no una auspiciante.

ATENCION: Los nombres de `sponsors.ts` NO PUEDEN REPETIRSE con los de
`expositores.ts`. La primera versión tenía "Altiplano Software" en las dos
listas y un "Humahuaca Textil" contra el "Textil Humahuaca" de la otra: se lee
como un copiar y pegar mal hecho. La frontera de arquitectura impide que un
slice mire el otro, así que la regla se sostiene a mano: al tocar una lista,
revisar la otra.

ATENCION: El correo de `CONTACTO` merece atención aparte: **el formulario apunta a esa
dirección**, así que un valor de maqueta ahí no es texto de relleno, es un
envío que no llega a ningún lado. Es el único dato provisorio del proyecto que
rompe una función en vez de solo verse mal.

Los **títulos y ejes** de las láminas, las **palabras de la izquierda** del
rotador y los **ejes** de cada actividad NO son provisorios: son los valores
que la organización declara en las consignas técnicas.

ATENCION: Los textos de la agenda además están escritos **cortos a propósito** -hasta
~31 caracteres el título y ~78 la descripción-, porque la tarjeta muestra el
título en una línea y la descripción en dos. El CSS garantiza que el recorte no
rompa el layout, no que el texto se lea bien. Si el cronograma real trae
títulos largos hay que decidir: o se acepta el recorte con puntos suspensivos,
o esa regla se afloja a dos líneas.

### Faltan fotografías institucionales

El kit entregado solo trae logotipos y tipografías. Las láminas de "Sobre
ExpoJuy" y las tarjetas de la Agenda usan `PlaceholderVisual`, un patrón
derivado del módulo de 48,3 unidades del propio isologotipo. Vive en
`shared/components/ui/` justamente porque lo necesitan dos features, y la
frontera que hace cumplir ESLint prohíbe que uno importe del otro.

Reemplazar por `<Image>` cuando existan: los dos consumidores ya reservan la
relación de aspecto, así que el cambio no mueve el layout.

Sponsors es un caso aparte y no usa `PlaceholderVisual`: lo que falta ahí no es
una fotografía sino un LOGOTIPO, y una retícula de relleno no ocupa el lugar de
una marca. Usa la "J" del isologotipo en monocromía, con el nombre del
auspiciante como texto alternativo - exactamente lo que va a llevar la imagen
real, así que el reemplazo no cambia ni la semántica ni el layout.

## Deuda técnica

- ~~**Lighthouse sin correr.**~~ **Corrido el 7/9 con 3 secciones**, contra
  producción, móvil. Resultado: Performance 93 · Accesibilidad 93 → **100**
  tras corregir · Buenas prácticas 100 · SEO 100. Las cuatro categorías por
  encima del objetivo.

  ~~Volver a correrlo al cerrar la fase 3.~~ **Corrido de nuevo el 8/9**, y ahí
  apareció lo que la primera medición no podía ver: **Buenas prácticas había
  caído de 100 a 77**. Los dos fallos -`is-on-https` (peso 5) e
  `inspector-issues` (peso 1)- eran el mismo: el `action="mailto:"` del
  formulario de Contacto, que Chrome trata como contenido mixto aunque un
  `mailto:` no mande nada por la red. No aparecía en la primera medición
  porque entonces la sección Contacto todavía no existía.

  Corregido pasando ese camino a un ENLACE `mailto:` -Lighthouse marca los de
  un `action`, no los de un enlace-. Remedido contra PRODUCCIÓN con el arreglo
  desplegado:

  | Perfil | Rend. | A11y | B. prácticas | SEO | FCP | LCP | Speed Index |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | Escritorio | 99 | 100 | 100 | 100 | 0,3 s | 0,7 s | 1,0 s |
  | Móvil | 93 | 100 | 100 | 100 | 1,0 s | 2,7 s | 4,9 s |

  ATENCION: LOS DOS NÚMEROS SON CORRECTOS Y MIDEN COSAS DISTINTAS. El panel de
  Lighthouse de DevTools corre en ESCRITORIO por defecto -red rápida, CPU sin
  frenar-; el perfil móvil simula 4G lento y CPU 4× más lenta, y es el que
  Google usa como referencia para un sitio público. Al citar un puntaje hay que
  decir con qué perfil se sacó.

  Ahí está además la explicación de por qué el loader no aparece en la medición
  de escritorio: con la CPU sin frenar, el H1 del hero termina su aparición a
  los ~0,6 s -tapado por el loader, pero el LCP no hace test de oclusión- y el
  LCP dispara ahí. Con la CPU 4× más lenta ese mismo H1 sigue en `opacity: 0`
  mucho más tiempo y el LCP se corre a 2,7 s. **El costo del loader solo se
  paga en un teléfono.**

  ATENCION: La lección se generaliza: **medir una parte del sitio no mide el sitio.**
  Una auditoría con 3 de 10 secciones no dice nada de las otras siete, y sin
  embargo ese "100" quedó anotado como bueno durante seis secciones.

  Lo que encontró, ya corregido:

  | Fallo | Causa | Arreglo |
  | --- | --- | --- |
  | 4 nodos de contraste en el footer | `text-subtle` se calibró contra la superficie base y caía a 3,82:1 sobre `surface-overlay` | `#7c7a84` → `#888691` (L+0,040 en OKLCH) |
  | *(no reportado por axe)* | `border-strong` tenía el mismo defecto: 2,54:1. Axe no audita contraste no textual | `#605e69` → `#6c6975` (L+0,040) |
  | 3 puntos del slider a 8×8 | WCAG 2.5.8 pide 24×24 de área táctil | El punto pasó a un `<span>`; el botón mide 24×24 |

- **Speed Index 5,2 s (score 60) - decisión pendiente, no bug.** Es la métrica
  más floja y el único techo real de performance. Causa medida: durante los
  3,1 s del loader el viewport es un campo casi negro (`#230048`), y las
  animaciones de aparición dejan el H1 del hero en `opacity: 0` todo ese
  tiempo, así que el LCP real es 3,5 s. El loader se ve **como fue diseñado**:
  esto es un costo asumido, no un defecto. Si se quisiera recuperar el punto
  hay que discutir el loader, y eso es decisión de Leandro.

- **`prefers-reduced-motion` validado indirectamente.** `emulate` del MCP de
  chrome-devtools no expone esa preferencia. La degradación del bento se
  verificó extrayendo del CSSOM el bloque autorado y aplicándolo sin el
  envoltorio del media query: la columna pasa de 528px recortados a 2112
  desplegados y las 24 celdas bajan a 12. Es fiel a las declaraciones, pero no
  es lo mismo que un usuario con la preferencia activada en su sistema.

- **El pulso del punto de acceso late en bucle, sin control de pausa.**
  Decisión tomada, no descuido. WCAG 2.2.2 exceptúa el movimiento esencial para
  la actividad, y este lo es: es lo que distingue el punto donde nace el
  recorrido de los otros ocho marcadores. Va `aria-hidden`, no transporta
  información que haya que leer, no compite con texto y con
  `prefers-reduced-motion` no late. Si un jurado lo objetara, la salida barata
  es limitarlo a dos ciclos: son 4s, por debajo del umbral de 5s del criterio.

- **Arrastre del bento: falta probarlo en un teléfono real.** Para recibir el
  gesto vertical, la ventana lleva `touch-action: none`, así que un dedo que
  empieza DENTRO del bento ya no scrollea la página. Está mitigado -la ventana
  mide 528px contra ~820 de viewport, así que siempre queda franja libre arriba
  y abajo-, pero es el clásico "scroll atrapado" y el emulador no lo dice:
  hay que probarlo con un pulgar de verdad. Si molesta, la salida es achicar la
  zona que captura el gesto en vez de sacar el efecto.

- ~~**El control de pausa estaba duplicado.**~~ **Extraído** a
  `shared/components/ui/boton-pausa.tsx` al aparecer el segundo consumidor, el
  riel de medios de pago. Importa más que una limpieza: es el mecanismo que
  WCAG 2.2.2 exige, y duplicado cada copia podía perder por su cuenta el
  `aria-pressed`, el nombre accesible o el área táctil de 48×48. El bento se
  verificó después de migrar.

- **"Sobre ExpoJuy" todavía tiene su copia del carrusel.** La máquina de estados
  se extrajo a `shared/hooks/use-carrusel-circular.ts` y ya la usan Mapa y
  Noticias. La sección Sobre no se migró para no refactorizar algo validado a
  esta altura del plazo; migra cuando haya que tocarla. Mientras tanto son dos
  implementaciones del mismo ciclo, y pueden divergir.

- ~~**El footer no se superponía a nada.**~~ **ARREGLADO.** El envoltorio medía
  exactamente lo mismo que su hijo `sticky`, así que el rango de
  desplazamiento era CERO y el hijo nunca se despegaba del flujo. Pero
  arreglarlo no alcanzaba: medido a 1440×900 con el envoltorio ya corregido, la
  sección se fija con su tope en 0 midiendo 1177px contra 900 de viewport, o
  sea que se fija ANTES de que se la pueda recorrer y sus últimos 277px quedan
  inalcanzables. Esa dirección solo es sana si la última sección entra en una
  pantalla, y un formulario no entra.

  Se invirtió: ahora el footer va `sticky` contra el borde INFERIOR con
  z-index negativo, escondido detrás del fondo opaco de `main`, y al terminar
  el documento el borde de main sube y lo destapa. El recorrido del efecto es
  exactamente el alto del footer, sin reservar altura ni conocerla.

  El acoplamiento que reemplaza al viejo: **el footer tiene que entrar en una
  pantalla**, porque `bottom: 0` lo ancla por abajo y si es más alto su tope
  queda fuera de alcance para siempre (medido: 1061px de footer contra 870 de
  viewport dejaban 191px inalcanzables). Por eso el footer pasó a dos columnas
  desde el teléfono y el relleno se suelta recién en `lg`. Alturas medidas:
  373px → 761 · 402px → 762 · 820px → 759 · 1024px → 604 · 1440px → 597. La red
  de seguridad son los dos umbrales de `.footer-revelado` en `globals.css`: si
  el viewport no da, el footer queda estático y se pierde el efecto, nunca el
  contenido. **Si el footer crece, hay que volver a medir y mover esos
  umbrales.**

  Verificado a 1440×900, 820×1180, 402×870 (efecto activo, footer entero a la
  vista al final) y 390×722 (efecto apagado, tope del footer alcanzable), más
  un barrido de 25 posiciones confirmando que no asoma antes de tiempo.

- **JS menor:** 51 KB sin usar y 14 KB de transpilación innecesaria
  (~450 ms estimados), casi todo del framework. Baja prioridad.
- **Responsive: destrabado, validado a medias.** `resize_page` del MCP de
  chrome-devtools SÍ funciona -cambia el viewport por CDP, no la ventana del
  sistema operativo-, así que la herramienta ya no es el problema. Validados a
  390 / 412 / 640 / 768 / 1440 px: el bento de Expositores, las láminas de
  "Sobre ExpoJuy", y las secciones Mapa, Noticias, Preguntas, Entradas y
  Sponsors completas. Sin validar: hero, agenda, nav y footer.

  ATENCION: Las láminas de "Sobre ExpoJuy" estaban ROTAS en móvil y figuraban como
  validadas: el relato desbordaba la lámina y el `overflow-hidden` lo cortaba a
  mitad de palabra. Lo que se había validado ahí eran los PUNTOS del slider, no
  el contenido de la lámina. Validar un componente no valida la sección, y esta
  lista tiene que decir QUÉ se validó de cada una, no solo el nombre.
- **FPS sin medir.** No se puede con `requestAnimationFrame` desde la página:
  la pestaña oculta lo throttlea a cero. Usar el trace de performance de
  DevTools.
- ~~**`public/` pesa 9,6 MB.**~~ **Descartado como problema.** Medido: en móvil
  solo se descarga `hero-720.webm` (1,8 MB). La elección de variante por
  viewport funciona. Lighthouse no lo marca.
- ~~**Rutas de la nav apuntando a marcadores.**~~ **Ya no queda ninguna.** Las
  diez secciones están construidas y el CTA "Comprar entradas" del header
  llega a la sección real.

### El plano del mapa no lleva atribución de OpenStreetMap

Se sacó de la interfaz a pedido. El motivo por el que es defendible: a esta
altura el plano **no contiene datos de OSM**. Se enderezó sobre su propio eje,
se ensanchó y se redibujó como esquema, así que ninguna coordenada sale de su
base. OSM fue la referencia para decidir QUÉ hay y en qué orden, no la fuente
de la geometría.

ATENCION: Si alguna vez se reemplaza por un trazado fiel -exportando geometría real de
OSM- la atribución vuelve a ser obligatoria y hay que reponerla. Queda anotado
en `plano.ts` y corresponde mencionar la procedencia en la memoria descriptiva.

## Decisiones tomadas

Cosas que ya se discutieron y no conviene reabrir sin motivo:

| Decisión | Por qué |
| --- | --- |
| CSS nativo, sin GSAP ni Motion | Todo lo necesario se resolvió con CSS; la única dependencia de movimiento es Lenis |
| Radios solo `0` o píldora | El isologotipo se construye con esquinas vivas y una semicircunferencia; no usa el rango intermedio |
| Sin tema claro | El plan lo define así: negro y morado |
| ~~Sin autoplay en los sliders~~ **Revertida el 7/9** | El bento de Expositores se desliza solo por decisión de diseño. La regla de fondo NO se revierte: lo que se mueve solo lleva control de pausa. El bento tiene botón, pausa al puntero y al foco, y con `prefers-reduced-motion` no arranca. Todo slider nuevo que se mueva solo hereda ese requisito |
| El violeta no se usa para texto | Medido: 2,74:1 sobre el fondo. Solo lavanda y cian sirven como acento textual |
| Tinte violeta fuera del hero | Teñía toda la imagen y mataba los colores propios de la toma nocturna |

## Trampas ya pisadas

Están documentadas en detalle en `AGENTS.md`, sección "Trampas ya pisadas".
Resumen:

1. **RSC** - importar un valor de runtime desde un módulo `"use client"` hacia
   un Server Component devuelve un proxy de referencia, no el valor
2. **Capas en cascada** - le ganan a la especificidad; una regla en
   `components` no puede anular una utilidad de Tailwind
3. **`transform-box`** - en SVG hay que poner `fill-box` o el origen se calcula
   contra el viewBox
4. **El `<g>` del isologotipo lleva `scale(1, -1)`** - invierte el signo de los
   `translate` de sus hijos
5. **`tsc` solo no alcanza** - `LayoutProps` lo genera Next en `.next/types/`,
   que está en `.gitignore`
6. **`getComputedStyle` dentro de `<defs>`** devuelve valores poco fiables
7. **Medir FPS con `requestAnimationFrame`** no sirve con la pestaña sin foco
8. **Tailwind 4 no tiene namespace `--duration-*`** - `duration-control` no
   generaba ninguna regla y el elemento caía en silencio a 150ms
9. **Un `<svg>` con viewBox y sin alto declarado ignora `bottom`** - es un
   elemento reemplazado y usa su alto intrínseco
10. **Un `rootMargin` negativo define una franja, no una línea** -
    `isIntersecting` vuelve a `false` al salir por arriba
11. **La caja de una recta vertical tiene ancho cero** - un degradado en
    `objectBoundingBox` sobre ella no se pinta, y no avisa
12. **El LCP descarta `opacity: 0` pero no hace test de oclusión** - el loader
    retrasa el LCP por la opacidad de las animaciones, no por tapar
13. **Una imagen a viewport completo no es candidata a LCP** - Chrome la trata
    como fondo; el póster del hero no es el elemento LCP
14. **Axe no audita contraste no textual** (WCAG 1.4.11) - un borde puede
    fallar sin que Lighthouse lo diga
15. **Un marquee separado con `gap` no cierra el bucle** - 2N tarjetas dejan
    2N−1 huecos y el `-50%` se queda medio hueco corto. Va con `margin-bottom`
16. **`getComputedStyle().transform` no refleja la propiedad `translate`** -
    son propiedades distintas; medir `translate` da `none` en `transform`
17. **`min-width: auto` en un ítem de grid o flex** - se niega a achicarse por
    debajo de su contenido, y un `overflow: hidden` adentro no lo evita
18. **El "…" de `line-clamp` lo dibuja `text-overflow`** - con `clip` recorta
    sin puntos suspensivos
19. **`"\d"` en un string de comillas dobles es `"d"`** - JavaScript descarta
    el escape desconocido, así que un `pattern` escrito así valida la letra d.
    Va `String.raw`
20. **Un `pattern` que no compila se IGNORA ENTERO** - Chrome lo compila con la
    bandera `v`, donde `( ) - [ ] { }` son sintaxis reservada dentro de la
    clase de caracteres. El campo pasa a aceptar cualquier cosa, sin avisar
21. **`tooShort` es la única entrada CONDICIONAL de `ValidityState`** - solo se
    activa si el valor fue editado por el usuario, así que un valor puesto por
    asignación nunca la dispara y la regla queda imposible de verificar
22. **React mapea `onBlur` a `focusout`, no a `blur`** - un
    `new FocusEvent("blur")` sintético no dispara nada y la prueba mide un
    fantasma
23. **`required` se satisface con espacios** - un `<textarea>` con tres
    espacios pasa la validación nativa; hay que recortar antes de mirar
24. **En desarrollo, la primera aparición de una clase de Tailwind llega tarde**
    - el JIT la genera recién cuando el DOM la usa, así que un
    `getComputedStyle` inmediato devuelve el valor viejo y parece un bug
25. **Un z-index negativo pierde el hit-test contra el `<body>`** - se pinta
    antes que la caja del body, que no tapa nada a la vista pero gana el
    click. El footer se veía bien y sus enlaces eran inertes. Para tapar algo,
    SUBIR al de arriba, no hundir al de abajo

## Para la memoria descriptiva

Material que ya existe y sirve de insumo:

- **Trazabilidad del sistema de diseño** - `/sistema-de-diseno` renderiza cada
  token con su origen y su ratio de contraste medido
- **Extracción de la geometría del logotipo** - los paths salen del stream del
  PDF oficial descomprimido con zlib, sin modificar, verificables con un diff
- **Fronteras de arquitectura como test** - ESLint falla si se cruzan, así que
  la escalabilidad es verificable y no una promesa
- **Mejora progresiva** - el HTML se sirve visible; el estado oculto vive
  detrás de una clase que agrega un script. Ya absorbió un bug real
- **Accesibilidad medida, no estimada** - los ratios del hero salen de muestrear
  el píxel más brillante detrás de cada bloque de texto sobre frames reales
