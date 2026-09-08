# System design de la web integrada

Documento de referencia de las decisiones transversales del sitio. Existe para
que las trece secciones, que vienen de tres bases de código distintas, se lean
como un solo producto y no como un collage.

## 1. El problema que resuelve este documento

El equipo desarrolló tres prototipos completos e independientes, cada uno en un
stack distinto:

| Autor | Repositorio | Stack | Rasgo dominante |
| :-- | :-- | :-- | :-- |
| Maru | mockup-expojuy | Astro estático, CSS nativo | 3,2 KB de JavaScript total, plano isométrico 3D |
| Nacho | expojuy-2026 | Vite, React 19, CSS Modules | tema por sección, capa de movimiento con override |
| Leo | expojuy-prototipo | Next 16, Tailwind 4 | mejora progresiva sistemática, sistema de diseño medido |

Los tres resolvieron bien, pero no lo mismo. La propuesta final no elige un
prototipo: adopta, sección por sección, la implementación que mejor resolvía el
problema. Eso genera un riesgo concreto y previsible: que el sitio quede
uniforme por fuera y contradictorio por dentro, con tres paletas, tres formas de
animar y tres criterios de accesibilidad conviviendo.

Las reglas de abajo son lo que evita eso. No son preferencias de estilo: cada
una elimina una clase de contradicción.

## 2. Base y procedencia

La base del repositorio es el prototipo de Leo. No es una decisión de autoría
sino de costo: ya corre exactamente el stack elegido, ya aporta cuatro secciones
sin portado, y su tooling de CI, husky y fronteras de arquitectura es el que se
adoptó. Empezar desde ahí ahorró varias horas contra un proyecto en blanco.

Sobre esa base se injertaron las piezas de los otros dos. La tabla de
procedencia por sección está en `CLAUDE.md`.

## 3. Una sola fuente de verdad por cosa

El defecto más caro al fusionar tres proyectos es terminar con dos fuentes de la
misma información que se desincronizan en silencio. El sitio tiene una sola de
cada una:

| Información | Fuente única | Quién la consume |
| :-- | :-- | :-- |
| Color, tipografía, espaciado | bloque `@theme` de `src/app/globals.css` | todo el CSS |
| Secciones, orden y anclas | `NAV_SECTIONS` en `src/shared/constants/site.ts` | menú, header, página, pie |
| Datos institucionales | `SITE` y `CONTACTO` en el mismo archivo | secciones, metadata, datos estructurados |
| Geometría del isologotipo | `src/shared/components/brand/brand-mark-paths.ts` | marca visible, máscara del loader, favicon, manifiesto |
| Geometría del predio | `src/features/venue-map/constants/plano.ts` | dibujo, leyenda, recorridos |

La regla operativa: si un dato aparece escrito en dos lugares, uno de los dos
está mal y todavía no lo sabemos.

`NAV_SECTIONS` merece una nota. El orden de ese array es a la vez el orden del
documento y el del menú. Cuando estaban separados, el menú quedó ordenado de una
forma y la página de otra, y nadie se enteró hasta verlo. Ahora no pueden
divergir porque son la misma lista.

## 4. Color

Ningún valor cromático se eligió a ojo, y esa propiedad se conserva al portar.

1. Los cinco colores de marca se muestrearon por píxel del logotipo oficial. Son
   la única entrada del sistema.
2. Los neutros se generaron en OKLCH al hue 297,8 grados, que es la media de los
   tres violetas oficiales, con croma mínimo. No son grises neutros: están
   teñidos hacia el violeta, que es lo que ya hace la propia marca en su gris
   institucional.
3. Cada escalón de texto y de borde se resolvió por búsqueda binaria en OKLCH,
   conservando hue y croma, hasta alcanzar su objetivo WCAG.

La regla de contraste que ordena todo lo demás: **cada escalón se resuelve
contra la superficie más clara donde puede aparecer**, no contra la base.
Satisfacer la más clara satisface a todas las otras por construcción. Esto salió
de una medición, no de una intuición: un token que daba 4,69:1 sobre la
superficie base caía a 3,82:1 sobre el pie superpuesto, y Lighthouse lo marcó en
cuatro nodos.

Consecuencia que hay que respetar al portar cualquier sección: **sobre fondo
oscuro el violeta es color de relleno, nunca de texto**. Los únicos acentos
válidos para texto son la lavanda y el cian.

Al portar CSS de otro prototipo, sus colores se traducen a estos tokens. No se
arrastra la paleta de origen ni se agregan valores literales.

## 5. Movimiento

El sitio tiene una sola capa de movimiento, no tres.

- El scroll suave lo maneja Lenis, y es la única dependencia de movimiento.
- Nada anima si el usuario pidió movimiento reducido. Sin excepciones y sin
  animaciones "suaves igual".
- Las animaciones de aparición se aplican detrás de la clase `js` que un script
  en línea pone en el `<html>` antes del primer pintado. Si el JavaScript falla,
  el contenido queda visible en vez de invisible.

Nacho tenía la implementación más madura de esto, con un override explícito del
usuario por encima de la preferencia del sistema, y ese criterio es el que rige.

## 6. Mejora progresiva

Es estructural, no un extra. **El HTML se sirve siempre en su estado final y
legible**, y el estado oculto o plegado vive detrás de la clase `js`.

Sin JavaScript: la agenda se ve dibujada, las respuestas del FAQ abiertas, los
precios visibles, el plano completo y el formulario enviable.

El criterio de aceptación al portar una sección es directo: si el estado por
defecto del markup es "invisible hasta que un efecto lo revele", está mal.

## 7. Arquitectura

Vertical Slice sobre tres capas con dependencias unidireccionales:

```
app/       composición. Solo rutas, ensambla features. Importa todo.
features/  slices verticales autocontenidos. No se conocen entre sí.
shared/    capa base transversal. No conoce a nadie por encima suyo.
```

`eslint.config.mjs` convierte esa decisión en un invariante verificable con
`no-restricted-imports`. Si un feature importa a otro, el lint falla y el CI se
pone rojo. Es la diferencia entre una convención escrita en un documento, que se
erosiona, y una que no se puede violar sin que alguien se entere.

Consecuencia práctica en la fusión: cuando dos secciones portadas necesitaban lo
mismo, la pieza subió a `shared/` en vez de duplicarse o de importarse de
costado.

### CSS por slice

Cada feature declara su CSS en su propio `styles.css`, dentro de
`@layer components`, y `globals.css` los importa. Dos razones:

1. Permitió portar seis secciones en paralelo sin que nadie tocara el mismo
   archivo, que era la única colisión real del plan.
2. El CSS de una sección se borra borrando su carpeta.

Detalle de CSS que cuesta caro descubrir a mano: un `@import` que aparece
después de cualquier otra regla se ignora en silencio. Por eso los imports de
los slices van arriba de todo. El orden entre ellos no importa porque cada hoja
está acotada a las clases de su propio feature, y las custom properties se
resuelven en el momento de uso y no en el de parseo.

## 8. Renderizado

Server Components por defecto. `"use client"` solo donde hay estado, efectos o
eventos, y lo más abajo posible del árbol.

No es purismo: cada componente cliente de más agrega JavaScript que el visitante
descarga y ejecuta antes de poder usar el sitio, y eso se paga en Lighthouse y
en el celular de alguien parado en el predio. El sitio es contenido
institucional, así que la mayor parte tiene que ser HTML servido.

## 9. Accesibilidad

Se verifica, no se supone. Mínimos exigidos a toda sección portada:

- Respeto de `prefers-reduced-motion`.
- Foco visible siempre. Nunca `outline: none` sin reemplazo.
- Todo lo interactivo alcanzable y operable por teclado.
- ARIA correcto en lo plegable, en diálogos y en contadores que cambian.
- Área táctil mínima de 36 píxeles sin engordar el dibujo. El patrón que usa el
  plano del predio, con botones de HTML sobre un SVG decorativo, resuelve esto
  sin sacrificar el dibujo.
- El color nunca es el único indicador de estado.
- Zoom no bloqueado.

Hay un caso que merece mención porque es la parte del sitio donde es más fácil
fallar: el plano del predio. Un mapa isométrico interactivo no es utilizable con
lector de pantalla por más ARIA que se le ponga, así que la información de
sectores tiene que seguir siendo legible como texto aunque el plano no se pueda
usar. La alternativa textual no es un agregado, es parte de la sección.

## 10. Estrategia responsive

El sitio se diseña desde el ancho chico hacia arriba, con escala tipográfica
fluida por `clamp` en vez de saltos por breakpoint. La escala crece de razón
1,200 a 360 píxeles hasta 1,333 a 1440: la jerarquía se dramatiza cuando hay
lugar y se comprime cuando no.

Donde el layout depende del contenedor y no de la ventana se usan container
queries, que es lo correcto para componentes que aparecen en anchos distintos
según la sección que los aloje.

El plano isométrico deriva su unidad de dibujo de `cqi`, de modo que escala con
su contenedor sin recalcular nada en JavaScript.

## 11. Datos provisorios

El kit entregado por la organización solo incluye logotipos. No hay fechas
confirmadas, sede, precios, textos oficiales ni fotografías institucionales.

Todo dato de maqueta vive en `src/shared/constants/site.ts` y está marcado como
provisorio, para que reemplazarlo sea editar un archivo y no una cacería por el
código. Los datos estructurados de schema.org se alimentan de ahí, así que
también quedan correctos de una sola vez.

Esto se declara en la memoria descriptiva en vez de disimularse. Un sitio que
muestra fechas inventadas sin aclararlo es un problema; uno que centraliza lo
provisorio y lo documenta demuestra criterio.

## 12. Verificación

Automática, en cada commit y en CI:

```
pnpm run typecheck     next typegen mas tsc --noEmit
pnpm run lint          incluye las fronteras de arquitectura
pnpm run format:check
pnpm run build
pnpm run audit         Lighthouse sobre el build de producción
```

El hook de pre-commit corre lint-staged y el de pre-push corre el typecheck. El
workflow de CI corre las cuatro verificaciones aunque una falle, para ver todos
los errores en una corrida en vez de descubrirlos de a uno.

Manual, por sección: revisión en navegador y aprobación explícita antes de
commitear.

Nota sobre las auditorías: Chrome headless no hereda `prefers-reduced-motion`
del sistema, así que la auditoría siempre mide el peor caso, con todas las
animaciones activas. Es la lectura que queremos.
