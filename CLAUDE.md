# CLAUDE.md

Guia operativa del repositorio. Leer completo antes de tocar codigo.

## Que es este proyecto

Sitio web integrado de ExpoJuy 2026 para el concurso de la Camara de Comercio
Exterior de Jujuy. Fusiona los tres prototipos que desarrollo el equipo,
tomando de cada uno la implementacion elegida seccion por seccion.

Entrega de la propuesta: 8 de septiembre de 2026, 23:59 hora argentina.
Entregables: mockup navegable publicado mas memoria descriptiva en PDF.

## Procedencia de cada seccion

La base del repositorio es el prototipo de Leo, porque ya corre el stack
elegido y aporta cuatro secciones sin costo de portado. Sobre esa base se
injertan las piezas de los otros dos.

| Seccion | Implementacion elegida | Estado |
| :-- | :-- | :-- |
| Pagina de carga | Leo | heredada |
| Home o Inicio | Leo | heredada |
| Sobre ExpoJuy | Maru | portar de Astro |
| Agenda | Leo | heredada |
| Expositores | Nacho | portar de Vite |
| Mapa | Leo con profundidad 3D de Maru | hibrido |
| Entradas | Leo | heredada |
| Noticias | Maru con slider de Leo | hibrido |
| Preguntas | Nacho | portar de Vite |
| Contacto | Maru | portar de Astro |
| Sponsors | Maru con animacion de Leo | hibrido |
| Navbar escritorio y movil | Nacho con iconos y menu movil de Maru | hibrido |
| Footer | Maru con efecto de Leo | hibrido |

Los informes de analisis completos de los tres repositorios estan en
`docs/integracion/`. Consultarlos antes de portar: contienen el mecanismo
exacto, las trampas medidas y el checklist de trasplante de cada pieza.

Repositorios de origen, disponibles en disco:

- `F:/GitHub/expojuy-prototipo` (Leo, Next + Tailwind)
- `F:/GitHub/expojuy-2026` (Nacho, Vite + React + CSS Modules)
- `F:/GitHub/mockup-expojuy` (Maru, Astro + CSS nativo)

## Stack

Next 16.3.4 App Router, React 19.2.8 con React Compiler activado, TypeScript
5.x en modo strict, Tailwind 4.3.3 configurado por `@theme` en CSS sin archivo
de configuracion, Lenis para scroll suave, lucide-react para iconografia.
Gestor de paquetes pnpm 10.17.1, fijado en `packageManager`.

## Arquitectura

Vertical Slice sobre tres capas con dependencias unidireccionales:

```
app/       capa de composicion. Solo rutas, ensambla features. Importa todo.
features/  slices verticales autocontenidos. NO se conocen entre si.
shared/    capa base transversal. No conoce a nadie por encima suyo.
```

`eslint.config.mjs` convierte esa decision en un invariante verificable: si un
feature importa a otro, o si `shared/` mira hacia arriba, el lint falla. No es
documentacion, es un test. No desactivar esas reglas: si algo hace falta en dos
features, sube a `shared/`.

Estructura interna de un feature:

```
src/features/<nombre>/
  components/   componentes React del slice
  constants/    datos estaticos y configuracion
  hooks/        hooks propios del slice
  types/        tipos propios del slice
  styles.css    CSS del slice, si necesita mas que utilidades
```

Dentro del propio slice se importa con rutas relativas (`../constants/x`).
Hacia `shared/` se importa con el alias `@/shared/...`.

## Sistema de diseno

`src/app/globals.css` es la fuente unica de verdad cromatica y tipografica.
Ningun valor de ese archivo fue elegido a ojo: cada token es un color medido
del logotipo oficial, un derivado por regla escrita, o un valor resuelto por
busqueda binaria contra un objetivo de contraste WCAG. Cada token lleva
anotado su ratio en el peor caso.

Reglas no negociables:

1. **Nunca escribir un color literal en un componente.** Usar los tokens
   (`bg-surface-raised`, `text-text-muted`, `border-border`, `text-accent`).
   Si hace falta un color que no existe, no se inventa: se plantea.
2. **Sobre fondo oscuro el violeta es color de relleno, no de texto.** Los
   unicos acentos validos para texto son lavanda y cian. `brand-violet-deep`
   esta prohibido para texto porque da 2.74:1.
3. Cada escalon de texto y borde se resuelve contra `--color-surface-overlay`,
   la superficie mas clara del sistema. Satisfacer la mas clara satisface a
   todas las demas por construccion.
4. El sitio no tiene tema claro. `colorScheme: "dark"` esta declarado en el
   viewport.

El CSS complejo que no se expresa con utilidades va en `@layer components`,
dentro del `styles.css` del feature. Nunca en un `<style>` suelto ni en estilos
en linea. Cuidado con el orden: varias reglas heredadas dependen de vivir en
`@layer components` con las utilidades de Tailwind despues, asi que una
utilidad de `display` puede romperlas en silencio.

Al portar CSS de otro prototipo, traducir sus colores a estos tokens. No
arrastrar la paleta de origen.

## Mejora progresiva

Es un principio estructural del sitio, no un extra.

Un script inline en `layout.tsx` agrega la clase `js` al `<html>` antes del
primer pintado. **El HTML se sirve siempre en su estado final y legible**, y el
estado oculto o plegado vive detras de esa clase. Sin JavaScript la agenda se
ve dibujada, las respuestas del FAQ abiertas y los precios visibles.

Al portar cualquier seccion hay que preservar esa propiedad: si el estado por
defecto del markup es "invisible hasta que un efecto lo revele", esta mal.

## Accesibilidad

Se valida, no se supone. Requisitos por seccion:

- Respetar `prefers-reduced-motion`. Sin excepciones.
- Foco visible con `focus-visible:outline-focus-ring`. Nunca `outline: none`
  sin reemplazo.
- Todo componente interactivo alcanzable y operable por teclado.
- ARIA correcto: `aria-expanded` y `aria-controls` en lo plegable, `role` y
  `aria-modal` en dialogos, `role="status"` en contadores que cambian.
- Area tactil minima de 36 pixeles, sin engordar el dibujo.
- El color nunca es el unico indicador de estado.
- No bloquear el zoom.

## Convenciones de codigo

- Archivos en kebab-case: `hero-section.tsx`, `use-carrusel-circular.ts`.
- Componentes en PascalCase, hooks con prefijo `use`.
- Vocabulario del dominio en espanol (`entradas`, `expositores`, `plano`), API
  de React en ingles. Es la convencion heredada, se mantiene.
- Server Components por defecto. `"use client"` solo donde hay estado, efectos
  o eventos, y lo mas abajo posible en el arbol. Cada `"use client"` de mas
  cuesta puntaje de Lighthouse.
- Los comentarios explican **por que**, con el numero medido cuando existe.
  No narrar lo que el codigo ya dice.
- TypeScript strict. Nada de `any` ni de `@ts-expect-error` sin justificacion
  escrita al lado.

## Redaccion

Aplica al codigo, a los comentarios, a la documentacion y a los mensajes de
commit, sin excepcion:

- **Prohibido usar emojis.**
- **Prohibido usar em-dashes.** Usar guiones normales, comas o dos puntos.
- Espanol rioplatense, tono sobrio e institucional.

## Verificacion

Antes de dar por terminada cualquier seccion:

```
pnpm run typecheck     # next typegen && tsc --noEmit
pnpm run lint          # incluye las fronteras de arquitectura
pnpm run format:check
pnpm run build
```

`pnpm run verify` encadena los tres primeros.

Cuando se trabaja en paralelo sobre el repositorio, no correr `pnpm build` ni
`pnpm dev` desde mas de un proceso a la vez: comparten el directorio `.next`.
En ese caso usar `pnpm exec tsc --noEmit --incremental false`, que es seguro
en concurrencia.

Ademas de lo automatico, cada seccion se valida en navegador y requiere
aprobacion explicita del usuario antes de commitear.

## Commits

Formato Conventional Commits, en espanol, con cuerpo en bullets de una linea:

```
feat(mapa): profundidad isometrica sobre el plano del predio

- cinco caras por bloque con luz fija arriba a la izquierda
- orden de dibujo por x mas y, sin z-index
- giro por arrastre limitado a 35 grados con vuelta por transicion
```

Incluir siempre el co-autor:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

Un commit por seccion terminada y aprobada. No mezclar secciones.

## Datos provisorios

`src/shared/constants/site.ts` centraliza los datos institucionales. El kit
entregado por la organizacion solo incluye logotipos: fechas, sede, precios y
contacto son de maqueta y estan marcados como provisorios. Todo dato inventado
vive ahi y en ningun otro lado, para que reemplazarlo sea un solo archivo.

## Licencias

Solo se usan recursos con licencia verificada. Usar material sin licencia es
causal de descalificacion segun las bases del concurso. Los iconos de Tabler
son MIT y su aviso esta transcrito en `docs/licencias.md`. El logotipo y la
tipografia Ambit son propiedad de la organizacion: estan para compilar el
sitio, no para redistribuir. No se usan fotografias de banco de imagenes ni
imagenes generadas por IA.
