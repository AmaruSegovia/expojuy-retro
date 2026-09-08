<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ExpoJuy 2026 - prototipo

Sitio institucional para la Primera Edición del Programa Provincial de Desafíos
Tecnológicos. Equipo Retro. Producción: https://expojuy-prototipo.vercel.app

**El código, los comentarios y los mensajes de commit van en español.**

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | `next typegen && tsc --noEmit` |
| `pnpm lint` | ESLint, incluidas las fronteras de arquitectura |
| `pnpm format` | Prettier |
| `pnpm verify` | Las tres anteriores - lo mismo que corre el CI |

`pnpm`, nunca npm ni yarn. La versión sale de `packageManager` en `package.json`.

## Flujo de trabajo

Se avanza **fase por fase**. Dentro de cada fase:

1. Implementar
2. Validar en el navegador (no solo que compile)
3. **Mostrar el resultado y esperar la validación de Leandro**
4. Aplicar sus mejoras
5. Recién ahí commitear

No commitear sin que haya aprobado. Husky corre lint-staged en cada commit y
`typecheck` antes de cada push.

## Arquitectura

Vertical Slice sobre tres capas, dependencias **unidireccionales**:

```
src/
├── app/        Rutas. Capa de composición: ensambla features. Puede importar todo.
├── features/   Slices verticales autocontenidos. NO se conocen entre sí.
│   └── <feature>/{components,hooks,types,constants,data}
└── shared/     Capa base transversal. No conoce a nadie por encima suyo.
```

Las fronteras **no son una convención, son un test**: `eslint.config.mjs` las
hace cumplir con `no-restricted-imports` por capa y el CI se pone en rojo si se
rompen.

- Dentro de un feature, importar con rutas **relativas** (`../components/X`).
  El alias `@/features/*` está prohibido dentro de `features/` justamente para
  que no se cuele una dependencia cruzada por descuido.
- Lo que dos features necesiten, sube a `shared/`.

## Sistema de diseño

**Regla dura: no se inventan valores de diseño.** Todo token es (a) un color
medido del logotipo oficial, (b) derivado de esos colores por una regla escrita,
o (c) resuelto contra un objetivo de contraste WCAG. La trazabilidad está
comentada en `src/app/globals.css` y renderizada en `/sistema-de-diseno`.

- **Colores de marca**: medidos por muestreo de píxeles del logotipo oficial y
  confirmados después contra los operadores `scn` del PDF. No tocar.
- **Neutros**: generados en OKLCH al hue 297.8° (media de los tres violetas de
  marca) con croma mínimo. No son grises: están teñidos, extendiendo el criterio
  que la marca ya aplica en su gris institucional.
- **Texto y bordes**: cada escalón se resolvió por búsqueda binaria en OKLCH
  hasta su ratio WCAG objetivo, medido contra `--color-surface-overlay`
  (#231F2B) - la superficie **más clara** del sistema, no la base. Satisfacer
  la más clara satisface a las otras tres por construcción. El ratio anotado
  al lado de cada token es el del **peor caso**.
- **Radios**: solo `0` o píldora. El isologotipo se construye con esquinas vivas
  y una semicircunferencia; la ausencia del rango intermedio es deliberada.
- **Movimiento**: cuatro duraciones (`--duration-micro/control/enter/scene`),
  una por tipo de intención. Nada se anima "porque queda lindo".

Si hace falta un color nuevo, **derivarlo y documentar la regla**, no elegirlo a
ojo. Hay scripts de OKLCH y contraste usados para esto; rehacerlos si se
necesitan otra vez.

### Accesibilidad del color

Sobre fondo oscuro el violeta es color de **relleno**. Los únicos acentos
válidos para **texto** son lavanda (7.83:1) y cian (9.02:1).
`--color-brand-violet-deep` (2.74:1) y `--color-brand-graphite` (2.27:1) están
**prohibidos para texto**.

Otras reglas que salieron de medir, no de suponer:

- El hover del botón primario **se oscurece**. Aclararlo bajaba el texto blanco
  de 5.05:1 a 3.98:1 y rompía AA.
- Blanco sobre cian **falla** (2.19:1). Usar `--color-on-accent`.
- El anillo de foco va en **dos capas** (outline + offset): un anillo de un solo
  color da 2.00:1 contra el botón violeta y es invisible.

## Marca

`src/shared/components/brand/brand-mark-paths.ts` es la **fuente única** de la
geometría del isologotipo. Los `d` se extrajeron del stream del PDF oficial
(inflado con zlib) y están **sin modificar**, para que sean verificables con un
diff. De ahí salen el logotipo visible, la máscara del page loader y el favicon.

No duplicar los paths en ningún lado: cualquier ajuste desalinearía la ventana
del loader respecto del logotipo.

## Animación

**CSS nativo. No hay GSAP ni Motion, y no se agregan sin discutirlo.** La única
dependencia de movimiento es Lenis (scroll suave), que no es una librería de
animación.

**Lo que se mueve solo lleva control de pausa.** No es opcional: WCAG 2.2.2 lo
exige para todo movimiento que arranque solo, dure más de cinco segundos y
conviva con otro contenido -un bucle infinito cumple las tres-. El bento de
Expositores es el precedente: botón de pausa con `aria-pressed`, pausa también
al puntero y al foco, y con `prefers-reduced-motion` no arranca. Un slider
nuevo que se mueva solo hereda el requisito completo.

Animar solo `opacity`, `scale`, `translate` y `clip-path`: son las que el
compositor resuelve sin recalcular layout. Nunca `width`, `height`, `top`.

**La única excepción es el acordeón de Preguntas**, y no se puede evitar: para
que el contenido de abajo suba al plegarse, el panel tiene que dejar de ocupar
lugar, y con `clip-path` se recortaría pero seguiría ocupando su alto. Se anima
`grid-template-rows` de `0fr` a `1fr` -no `height` de 0 a `auto`- para no tener
que medir el contenido con JavaScript. El recálculo pasa UNA VEZ POR CLIC, no
una vez por frame de scroll, que es lo que la regla existe para evitar. Si
aparece otro caso así, la vara es esa: ¿lo dispara el usuario o el scroll?

### Mejora progresiva

Las animaciones de aparición se aplican **solo detrás de la clase `.js`**, que
un script inline agrega al `<html>` antes del primer pintado. El HTML se sirve
**visible**: si el JS falla, el contenido se ve.

Nunca servir `opacity: 0` desde el servidor. Ya salvó un bug real en el que el
script moría al parsearse y el sitio igual se veía perfecto.

`prefers-reduced-motion` se respeta en CSS y en JS. **Quitar la animación nunca
debe quitar el contenido** - de ahí los `opacity: 1 !important` en el media
query.

## Rendimiento

No hacer `setState` por frame de scroll. Para valores continuos (barra de
progreso) escribir una custom property por `ref`; para booleanos (header
compacto) actualizar solo cuando el valor cambia de verdad.

## Trampas ya pisadas

Cosas que costaron tiempo. No repetirlas:

- **RSC**: nunca importar un valor de runtime desde un módulo `"use client"`
  hacia un Server Component. Se recibe un *proxy de referencia*, no el valor.
  Rompió el script inline del layout. Las constantes compartidas van en módulos
  **neutrales** (ej. `shared/constants/storage.ts`).
- **Capas en cascada**: le ganan a la especificidad. Una regla en
  `@layer components` no puede anular una utilidad de Tailwind (`@layer
  utilities`, posterior) por más específico que sea el selector. Si hay que
  anular, definir ambas en la misma capa.
- **`transform-box`**: en elementos SVG hay que poner `fill-box` para que
  `transform-origin` y los porcentajes se calculen contra la caja del propio
  path y no contra el viewBox.
- **El `<g>` del isologotipo lleva `scale(1, -1)`** (resuelve el eje Y del PDF).
  Ese flip **invierte el signo de los `translate` de sus hijos**: un valor
  positivo desplaza hacia arriba en pantalla.
- **`tsc` solo no alcanza**: `LayoutProps` y compañía los genera Next en
  `.next/types/`, que está en `.gitignore`. Por eso `typecheck` corre
  `next typegen` primero. Sin eso, pasa en local y falla en un checkout limpio.
- **`getComputedStyle` dentro de `<defs>`** devuelve valores poco fiables.
  Verificar visualmente, no por estilo computado.
- **Medir FPS con `requestAnimationFrame` desde la página no sirve** cuando la
  pestaña no tiene foco: Chrome lo throttlea y parece que el renderer se
  congeló. Usar el trace de performance de DevTools.
- **Un `<svg>` con `viewBox` y sin alto declarado es un elemento reemplazado**:
  con `height: auto` el navegador usa su alto intrínseco e **ignora `bottom`**.
  `top-6 bottom-0` no estira nada. Va alto explícito.
- **Un `rootMargin` negativo no define una línea, define una franja.**
  `isIntersecting` responde "¿está dentro?" y vuelve a `false` cuando el
  elemento sale por arriba, así que no sirve para "¿ya lo pasó?". Para eso, la
  geometría: `entrada.boundingClientRect.top` contra `rootBounds.bottom`. El
  `rootMargin` queda solo para que el navegador avise en el cruce.
- **La caja de una recta vertical tiene ancho CERO**, y un elemento con caja
  degenerada que referencia un degradado en `objectBoundingBox` -el valor por
  defecto de `gradientUnits`- **no se pinta**. No sale tenue: no sale. Usar
  `userSpaceOnUse`.
- **`vector-effect="non-scaling-stroke"` pasa los dashes a espacio de
  pantalla**, así que rompe la normalización de `pathLength`. Si el trazo se
  dibuja con `stroke-dashoffset`, no se puede usar.
- **El LCP descarta `opacity: 0`, pero no hace test de oclusión.** Un elemento
  tapado por un overlay opaco sigue contando; uno transparente, no. Por eso el
  page loader **sí** retrasa el LCP, aunque el HTML se sirva completo debajo:
  no lo bloquea el overlay, lo bloquea que las animaciones de aparición
  arranquen en `opacity: 0`. Medido: el H1 del hero queda en `opacity: 0`
  durante los 3,1 s del loader y el LCP real cae en 3,5 s.
- **Una imagen a viewport completo no es candidata a LCP.** Chrome las trata
  como fondo. El póster del hero está optimizado pero *no* es el elemento LCP,
  así que optimizarlo más no mueve la métrica.
- **Un token de color no se valida contra una sola superficie.** `text-subtle`
  daba 4,69:1 sobre la base -4% de margen- y caía a 3,82:1 sobre el footer.
  Y `border-strong` fallaba igual sin que Lighthouse lo dijera: **axe no
  audita contraste no textual** (WCAG 1.4.11). Si un token nuevo va a tocar
  cards, medirlo contra `surface-overlay`.
- **El área táctil no es el elemento visible.** Los puntos del slider medían
  8×8 y WCAG 2.5.8 pide 24×24. El punto va en un `<span>` adentro del botón;
  el botón aporta el tamaño. Vale para todo slider nuevo.
- **Un marquee separado con `gap` no cierra el bucle.** Con la lista duplicada,
  2N tarjetas dejan 2N−1 huecos, así que `translate: -50%` se queda MEDIO HUECO
  corto y el bucle pega un tirón en cada vuelta. Las tarjetas se separan con
  `margin-bottom`: así cada una mide siempre tarjeta+hueco y la media vuelta
  cae en un múltiplo entero. Se verifica midiendo -`(altoRiel/2) / paso` tiene
  que dar un entero exacto-, no mirando.
- **`getComputedStyle(el).transform` NO refleja la propiedad `translate`.** Son
  propiedades independientes. Al animar `translate` -que es lo que corresponde,
  para no pisar transformaciones de las utilidades-, leer `transform` devuelve
  `none` y parece que la animación está muerta. Hay que leer `translate`.
- **Para arrastrar algo que ya anima, se mueve el reloj de la animación, no el
  elemento.** `el.getAnimations()[0]` devuelve el objeto que el navegador ya
  reproduce: arrastrar es escribir su `currentTime` y soltar es `play()`. El
  camino alternativo -apagar con `animation: none`, escribir `translate` a mano
  y reenganchar con un `animation-delay` negativo- reconstruye a mano un estado
  que el navegador ya tiene, y cualquier discrepancia se ve como un SALTO.
- **`setPointerCapture` lanza `NotFoundError`** si el `pointerId` no
  corresponde a un puntero activo. Va al final del handler y dentro de un
  `try`: si está antes, la excepción aborta el resto y el arrastre queda a
  medias. Ojo al depurar con eventos sintéticos: solo `pointerId: 1` -el del
  mouse real de Chrome- no falla, así que una prueba con ese id puede dar
  "todo bien" mientras el resto está roto.
- **`touch-action: none` no impide seleccionar texto.** Frena el scroll, que es
  otro mecanismo. Al arrastrar con mouse el texto se subraya SIEMPRE; con el
  dedo se ve menos porque en táctil la selección pide pulsación larga, pero una
  pulsación larga con arrastre igual la dispara. Va `user-select: none` en la
  zona arrastrable, con el prefijo `-webkit-` que Safari todavía pide.
- **El `:hover` táctil es PEGAJOSO y le gana a tu JavaScript.** Una pausa por
  `:hover` sobre algo que también se arrastra rompe el arrastre: al apoyar el
  dedo el elemento entra en `:hover`, el CSS pausa, y al soltar sigue pausado
  porque el hover no se va hasta tocar otra cosa. Toda pausa por puntero va
  dentro de `@media (hover: hover) and (pointer: fine)`.
- **`Animation.pause()` le quita a CSS la autoridad sobre esa animación PARA
  SIEMPRE.** Después de una llamada así, `animation-play-state` deja de
  gobernarla: se puede ver la propiedad computada en `running` y el objeto
  obstinadamente en `paused`. Si el control de pausa funciona por CSS -como el
  del bento-, cualquier `pause()` por API se lo rompe en silencio.
  **La regla: un solo dueño del estado de reproducción, y es el CSS.** La Web
  Animations API se usa únicamente para lo que CSS no sabe hacer -mover el
  `currentTime`-; pausar y reanudar van siempre por atributo. El arrastre marca
  `data-arrastrando`, el botón marca `data-pausado`, y la hoja de estilos
  resuelve. Así una pausa pedida por el usuario sobrevive al arrastre sin
  ninguna lógica que la recuerde.
- **`playState` no expresa la intención del usuario.** Mezcla lo que el usuario
  pidió con lo que el CSS impuso: con una pausa por `:hover` activa dice
  "paused" sin que nadie haya apretado nada. No sirve como fuente de verdad.
- **Ojo con validar interacción usando eventos sintéticos.** No disparan
  `:hover`, así que un arrastre puede pasar todas las pruebas y fallar con un
  dedo real. Y `resize_page` solo cambia el viewport: el navegador sigue
  reportando `hover: hover` y `pointer: fine`. Para probar táctil de verdad,
  `emulate` con `<w>x<h>x<dpr>,mobile,touch`.
- **`min-width: auto` es el ancho por defecto de un ítem de grid o flex**, y
  significa que SE NIEGA a achicarse por debajo de su contenido. Un
  `overflow: hidden` adentro no lo evita: recorta lo que se ve, pero la medida
  igual viaja hacia arriba y estira la celda. Un riel de 27 tarjetas dentro de
  un contenedor de 390px lo estiraba a 470 y desalineaba TODA la fila. Va
  `min-w-0` en la cadena. El síntoma aparece lejos de la causa: se ve como un
  problema de centrado, no de ancho.
- **El presupuesto de un texto lo fija el PEOR caso, no el típico.** Los
  copetes de Noticias se escribieron mirando el escritorio y en un teléfono de
  390px recortaban las 18 tarjetas: ahí la tarjeta deja 232px de contenido y
  entran ~29 caracteres por renglón, no ~60. Antes de escribir contenido para
  una tarjeta, medir el ancho MÍNIMO y anotar la cuenta al lado de los textos.
- **El "…" de `line-clamp` lo dibuja `text-overflow`.** Con `text-overflow:
  clip` el recorte sigue funcionando pero corta sin puntos suspensivos. Un "…"
  es un cartel de "acá falta texto": en una tarjeta con contenido escrito a
  medida delata un problema que no existe. El recorte es una red de seguridad;
  si se activa, el texto ya está mal escrito.
- **Para ver si una animación corre, leer el objeto `Animation`, no el estilo
  computado.** `getComputedStyle` sobre un elemento animado devuelve los
  valores de los keyframes extremos y parece congelado. `el.getAnimations()[0]`
  da `playState` y un `currentTime` que se puede muestrear dos veces y restar.
- **Un `sticky` cuyo bloque contenedor mide lo mismo que él NO SE PEGA NUNCA.**
  Un elemento pegajoso está confinado a su bloque contenedor; si ambos miden
  igual, no le queda ni un píxel para quedarse quieto y se comporta como si
  estuviera en flujo normal. No hay error ni advertencia: el efecto
  simplemente no ocurre. Es lo que tenía roto el footer superpuesto.
- **Y anclarlo por abajo exige que ENTRE EN LA PANTALLA.** Con
  `sticky; bottom: 0`, un elemento más alto que el viewport queda con su tope
  arriba del borde superior y no hay forma de llegar: no se despega, porque su
  lugar natural ya es el final del documento. Medido: 1061px de footer contra
  870 de viewport dejaban sus primeros 191px inalcanzables para siempre.
- **El peor caso de una medida responsive no está siempre en el extremo.** El
  footer medía 761px a 373px de ancho y 861px a 768px: entre `sm` y `lg` el
  relleno ya había crecido pero el contenido seguía apilado. Hay que medir la
  franja del medio, no solo las puntas.
- **Un z-index negativo se pinta por encima del fondo del canvas pero por
  debajo del fondo de los bloques en flujo.** Por eso alcanza con darle fondo
  opaco a `<main>` para esconder algo detrás de él, sin posicionarlo ni tocar
  el apilamiento de nadie más. Y por eso el fondo del `<body>` NO sirve: es el
  canvas, y queda abajo de todo.
- **…pero un z-index negativo TAMBIÉN PIERDE EL HIT-TEST contra el `<body>`, y
  eso no se ve.** El elemento se pinta en el paso 3 del algoritmo de apilado y
  la caja del body en el paso 4, así que el body gana el click aunque no tape
  nada -su fondo se propagó al canvas y no pinta-. Síntoma exacto: el footer se
  veía perfecto y sus trece enlaces eran inertes;
  `document.elementFromPoint` sobre el centro de un enlace devolvía `BODY`.
  **La solución no es hundir, es subir**: el que TAPA va con `relative` y un
  z-index bajo -`main` quedó en 1, contra 80 del header y 85 del volver
  arriba- y el TAPADO se queda en `auto`. Ojo con dónde aparece el síntoma: en
  móvil el efecto está apagado por umbral de altura, así que ahí funcionaba y
  parecía un problema exclusivo de escritorio.
- **Un `pattern` de formulario tiene DOS formas de morir en silencio, y las
  dos se ven igual: "la validación no anda".** Primero, `"\d"` dentro de un
  string de comillas dobles NO es `\d`: JavaScript descarta el escape que no
  conoce y deja `"d"`, así que el patrón termina validando la letra d. Va
  `String.raw` y el problema desaparece de raíz. Segundo, Chrome compila el
  atributo con la bandera `v`, donde `( ) [ ] { } / - | \` son sintaxis
  reservada DENTRO de la clase de caracteres y hay que escaparlas; y cuando la
  expresión no compila, la especificación manda IGNORAR el atributo entero, así
  que el campo pasa a aceptar cualquier cosa. Ninguna de las dos avisa por
  consola. Se comprueba con `new RegExp("^(?:" + patron + ")$", "v")`.
- **`tooShort` es la única entrada CONDICIONAL de `ValidityState`.** Solo se
  activa si el valor fue editado por el usuario -la "bandera de valor sucio"-,
  una regla que existe para que un valor corto precargado por el servidor no
  aparezca en rojo antes de que nadie lo toque. Consecuencia práctica: un valor
  puesto por asignación, o por `execCommand("insertText")`, da `tooShort: false`
  con 4 caracteres y un mínimo de 20. La regla no se puede verificar desde una
  automatización, así que el largo mínimo se comprueba a mano y el atributo
  `minlength` se deja solo para el camino sin JavaScript.
- **`required` se satisface con espacios.** Un `<textarea>` con tres espacios
  pasa la validación nativa: el navegador mira que el valor no esté vacío, no
  que diga algo. Hay que recortar antes de decidir. (Un `type="email"` sí
  recorta solo, por eso el síntoma aparece en el mensaje y no en el correo.)
- **React mapea `onBlur` al evento `focusout`, no a `blur`.** Un
  `dispatchEvent(new FocusEvent("blur"))` sintético no dispara el handler y la
  prueba mide un fantasma: todo "funciona" porque nada corrió. Para que el
  navegador emita `focusout` de verdad hay que llamar `el.blur()`.
- **En desarrollo, la PRIMERA aparición de una clase de Tailwind llega tarde.**
  El JIT la genera recién cuando el DOM la usa, así que un `getComputedStyle`
  inmediatamente después de que React la agregue devuelve el valor anterior.
  Costó un diagnóstico entero de un borde de error que en realidad funcionaba.
- **Congelar una animación no es degradarla.** Con `prefers-reduced-motion`, el
  riel del bento quedaba quieto en la posición 0 mostrando 3 de 12 expositores:
  los otros 9 eran inalcanzables. La degradación correcta es DESPLEGAR -soltar
  el alto y el recorte de la ventana y esconder la copia del bucle-, no
  detener. Quitar el movimiento nunca debe quitar el contenido.

## Contenido

Todo el contenido textual, fechas y precios son **provisorios** y están
centralizados en `src/shared/constants/site.ts`, marcados con `PROVISORIO`. El
kit entregado por la organización solo incluye logotipos y tipografías. No
inventar datos institucionales sin marcarlos.
