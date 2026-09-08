# Analisis en profundidad: repositorio `expojuy-prototipo` (autor: Leo / Leandro)

Ruta analizada: `F:/GitHub/expojuy-prototipo`
Fecha del analisis: 8 de septiembre de 2026
Estado del repo: rama `main`, 33 commits, HEAD en `e59c869 feat(propuesta): memoria descriptiva y declaracion de IA imprimibles`
Produccion: https://expojuy-prototipo.vercel.app
Repositorio remoto: https://github.com/ch0ripain/expojuy-prototipo

> Nota: no se modifico ningun archivo del repositorio. Todo lo que sigue sale de leer archivos reales.

---

## 0. Resumen ejecutivo

Este prototipo es, con diferencia, el mas "industrial" de los tres: no es una maqueta con animaciones lindas sino un proyecto con invariantes verificables por CI, un sistema de diseno cuyos valores estan derivados o medidos (no elegidos), y una politica de mejora progresiva aplicada de forma consistente en todas las secciones interactivas.

Puntos que definen su caracter:

1. **Tailwind CSS 4.3.3 con `@theme` en CSS**, sin `tailwind.config.js`. Todos los tokens viven en `src/app/globals.css` (1550 lineas, la mitad comentarios de trazabilidad).
2. **Arquitectura Vertical Slice de tres capas** (`app/` -> `features/` -> `shared/`) cuyas fronteras las hace cumplir ESLint con `no-restricted-imports`. Si un feature importa a otro, el CI se pone rojo.
3. **Mejora progresiva sistematica**: el HTML se sirve en estado visible/abierto/desplegado, y el estado oculto vive detras de una clase `.js` que agrega un script inline en el `<body>` antes del primer pintado. Sin JavaScript el sitio se lee entero.
4. **Cero librerias de animacion**. No hay GSAP ni Motion. Todo es CSS nativo mas IntersectionObserver mas Web Animations API puntual. La unica dependencia de movimiento es Lenis (scroll suave).
5. **Accesibilidad medida, no estimada**: contrastes calculados por busqueda binaria en OKLCH contra la superficie mas clara del sistema, WCAG 2.2.2 (pausa), 2.5.8 (area tactil 24px), 2.4.1 (skip link), patron de pestanas WAI-ARIA completo. Lighthouse movil 93/100/100/100, escritorio 99/100/100/100.
6. **Nada de datos institucionales inventados sin marcar**: todo el contenido provisorio esta etiquetado `PROVISORIO` y centralizado.

Deudas visibles: el video del hero es material de terceros de una ciudad de EE.UU. (bloqueante), no hay fotografias institucionales, y "Sobre ExpoJuy" mantiene una copia duplicada del carrusel.

---

## 1. Ficha tecnica

### 1.1 Stack y versiones exactas (de `pnpm-lock.yaml`, `lockfileVersion: 9.0`)

| Paquete | Rango en `package.json` | Version resuelta |
| --- | --- | --- |
| `next` | `16.3.4` (pin exacto) | 16.3.4 |
| `react` | `19.2.8` (pin exacto) | 19.2.8 |
| `react-dom` | `19.2.8` (pin exacto) | 19.2.8 |
| `tailwindcss` | `^4` | **4.3.3** |
| `@tailwindcss/postcss` | `^4` | 4.3.3 |
| `lenis` | `^1.3.26` | 1.3.26 (con peer `react@19.2.8`) |
| `lucide-react` | `^1.41.0` | 1.41.0 |
| `clsx` | `^2.1.1` | 2.1.1 |
| `tailwind-merge` | `^3.6.0` | 3.6.0 |
| `class-variance-authority` | `^0.7.1` | 0.7.1 (declarada, **no usada** en el codigo) |
| `tw-animate-css` | `^1.4.0` | 1.4.0 (importada en `globals.css`) |
| `babel-plugin-react-compiler` | `1.0.0` (pin) | 1.0.0 |
| `typescript` | `^5` | 5.9.3 |
| `eslint` | `^9` | 9.39.5 |
| `eslint-config-next` | `16.3.4` (pin) | 16.3.4 |
| `prettier` | `^3.9.6` | 3.9.6 |
| `prettier-plugin-tailwindcss` | `^0.8.1` | 0.8.1 |
| `husky` | `^9.1.7` | 9.1.7 |
| `lint-staged` | `^17.5.0` | 17.5.0 |
| Gestor | `packageManager: "pnpm@10.33.0"` | pnpm 10.33.0 |

Total de codigo fuente propio: **6331 lineas de TS/TSX + 1550 lineas de CSS**. `public/` pesa 9,6 MB (solo el video del hero).

### 1.2 `package.json` scripts

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"lint:fix": "eslint --fix",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "next typegen && tsc --noEmit",
"verify": "pnpm run typecheck && pnpm run lint && pnpm run format:check",
"prepare": "husky"
```

`typecheck` corre `next typegen` **antes** de `tsc --noEmit`. El motivo esta documentado: los tipos `LayoutProps<"/">` y `PageProps` los genera Next en `.next/types/`, que esta en `.gitignore`. Sin el typegen previo, el typecheck pasa en local y falla en un checkout limpio.

`verify` es exactamente lo mismo que corre el CI (menos el build).

### 1.3 `next.config.ts`

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactCompiler: true,
};
export default nextConfig;
```

Minimo. Lo unico activado es el **React Compiler** (memoizacion automatica, sin `useMemo`/`useCallback` a mano). Consecuencia para la fusion: si el repo final no habilita React Compiler, hay componentes que dependen implicitamente de esa memoizacion; no rompen, pero pierden rendimiento.

### 1.4 `tsconfig.json`

Estandar de `create-next-app` con dos detalles relevantes:

- `"paths": { "@/*": ["./src/*"] }` -> el alias `@/` apunta a `src/`.
- `"include"` incluye `.next/types/**/*.ts` y `.next/dev/types/**/*.ts` (tipos generados) y `**/*.mts`.
- `target: ES2017`, `strict: true`, `moduleResolution: bundler`, `jsx: react-jsx`.

### 1.5 `postcss.config.mjs`

```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

Tailwind 4 puro por PostCSS. **No hay `tailwind.config.js`/`.ts` en el repo.**

---

## 2. Arquitectura por features

### 2.1 El modelo

```
src/
|- app/        Rutas. Capa de composicion: ensambla features. Puede importar todo.
|- features/   Slices verticales autocontenidos. NO se conocen entre si.
|   \- <feature>/{components,hooks,types,constants,data}
\- shared/     Capa base transversal. No conoce a nadie por encima suyo.
    \- {components,hooks,lib,fonts,constants,types,styles}
```

Dentro de un mismo feature se importa con rutas **relativas** (`../components/X`); el alias `@/features/*` esta prohibido dentro de `features/` justamente para que no se cuele una dependencia cruzada por descuido.

### 2.2 Las fronteras son un test, no una convencion

`F:/GitHub/expojuy-prototipo/eslint.config.mjs` define `LAYER_BOUNDARIES`:

```js
{
  files: ["src/shared/**/*.{ts,tsx}"],
  rules: { "no-restricted-imports": ["error", { patterns: [
    { group: ["@/features/*", "@/features/**"], message: "shared/ es la capa base y no puede depender de features/. ..." },
    { group: ["@/app/*", "@/app/**"], message: "shared/ no puede depender de app/. ..." },
  ]}]}
},
{
  files: ["src/features/**/*.{ts,tsx}"],
  rules: { "no-restricted-imports": ["error", { patterns: [
    { group: ["@/features/*", "@/features/**"], message: "Un feature no importa a otro feature. ..." },
    { group: ["@/app/*", "@/app/**"], message: "features/ no puede depender de app/. ..." },
  ]}]}
}
```

Composicion final: `defineConfig([...nextVitals, ...nextTs, ...LAYER_BOUNDARIES, globalIgnores([".next/**","out/**","build/**","next-env.d.ts"])])`, con imports `eslint-config-next/core-web-vitals` y `eslint-config-next/typescript` (formato flat de Next 16).

**Esta regla explica muchas decisiones del codigo.** Todo lo que dos features necesitan tuvo que subir a `shared/`: `PlaceholderVisual`, `BotonPausa`, `useCarruselCircular`. Es una fuerza de diseno real, no decorativa.

### 2.3 Consistencia de la convencion

La estructura `{components,constants,data,hooks,types}` esta **andamiada con `.gitkeep` en todos los features**, pero solo se llena lo que se usa:

| Feature | Archivos reales | Carpetas usadas |
| --- | --- | --- |
| `about` | 2 | components, constants |
| `agenda` | 5 | components (3), constants, hooks |
| `contact` | 3 | components, constants, hooks |
| `exhibitors` | 3 | components, constants, hooks |
| `faq` | 2 | components, constants |
| `hero` | 4 | components (3), constants |
| `news` | 2 | components, constants |
| `social` | **0** | ninguna (feature vacio, andamiaje solo) |
| `sponsors` | 3 | components, constants, hooks |
| `tickets` | 2 | components, constants |
| `venue-map` | 2 | components, constants |

Observaciones para la fusion:

- **`data/` y `types/` nunca se usan.** Cero archivos en las once features. Los tipos viven junto a las constantes (`export type Actividad` dentro de `actividades.ts`). Es coherente, pero significa que la convencion documentada es mas amplia que la real.
- **`src/features/social/` esta completamente vacio**: solo `.gitkeep`. Era la seccion de redes sociales planificada y nunca construida (queda como pendiente en `01-plan.md`).
- **No hay barrels (`index.ts`) por feature.** Cada consumidor importa el archivo exacto. Explicito y facil de tree-shakear.
- `src/shared/styles/` y `src/shared/types/` tambien estan vacios.

---

## 3. Sistema de diseno

Todo vive en un unico archivo: `F:/GitHub/expojuy-prototipo/src/app/globals.css` (1550 lineas). Empieza con:

```css
@import "tailwindcss";
@import "tw-animate-css";
```

Y luego un bloque `@theme { ... }` con ocho secciones numeradas. **Es Tailwind v4 con `@theme`, sin archivo de configuracion JS.**

### 3.1 Regla de oro del sistema

Del encabezado del archivo y de `AGENTS.md`:

> Ningun valor de este archivo fue elegido a ojo. Cada token es (a) un color medido del logotipo oficial, (b) derivado de esos colores por una regla escrita, o (c) resuelto contra un objetivo de contraste WCAG.

### 3.2 Paleta

**1. Colores de marca** (medidos por muestreo de pixeles sobre `RecursosExpoJuy/RGB/expojuy26.png`, canal alfa > 200, y confirmados despues contra los operadores `scn` del PDF oficial):

| Token | Hex | Rol | Contraste vs `surface` |
| --- | --- | --- | --- |
| `--color-brand-violet-deep` | `#820cd0` | bloque "E" / contraforma J | 2.74:1 (prohibido para texto) |
| `--color-brand-violet` | `#774ff0` | asta vertical de la J, primario | 3.92:1 |
| `--color-brand-lavender` | `#bb8cff` | base curva de la J | 7.83:1 |
| `--color-brand-cyan` | `#25c0d4` | acento superior | 9.02:1 |
| `--color-brand-graphite` | `#4b4b4d` | wordmark EXPOJUY | 2.27:1 (prohibido para texto) |

**2. Neutros** generados en OKLCH al hue **297.8 grados** (media de los tres violetas de marca) con croma minimo. No son grises neutros: estan tenidos hacia el violeta, extendiendo el criterio que la propia marca aplica en su gris institucional (`#4B4B4D` cae en H=286.3 grados).

| Token | Hex | Rol |
| --- | --- | --- |
| `--color-surface-sunken` | `#040307` | fondo de pagina, letterbox de video |
| `--color-surface` | `#0b0911` | superficie base, referencia de contraste |
| `--color-surface-raised` | `#16131d` | card, panel |
| `--color-surface-overlay` | `#231f2b` | popover, dropdown, footer superpuesto |

**3. Texto y bordes**, resueltos por busqueda binaria en OKLCH conservando hue y croma hasta alcanzar su ratio WCAG objetivo. **La regla clave**: cada escalon se resuelve contra la superficie **mas clara** donde puede aparecer (`--color-surface-overlay`, `#231f2b`), no contra la base. El ratio anotado es el del peor caso.

| Token | Hex | Ratio (peor caso) |
| --- | --- | --- |
| `--color-text` | `#e8e6eb` | 13.01:1 (AAA holgado) |
| `--color-text-muted` | `#a19ea7` | 6.12:1 (AA holgado) |
| `--color-text-subtle` | `#888691` | 4.50:1 (AA exacto, L+0.040 en OKLCH) |
| `--color-border-strong` | `#6c6975` | 3.01:1 (AA no textual, L+0.040) |
| `--color-border` | `#36323e` | 1.29:1 (solo separacion decorativa) |

Este ajuste salio de una medicion real con Lighthouse: `text-subtle` daba 4.69:1 sobre la base y caia a 3.82:1 sobre el footer, marcado en cuatro nodos. `border-strong` tenia el mismo defecto (2.54:1) y **no** lo marco, porque axe no audita contraste no textual (WCAG 1.4.11).

**4. Roles semanticos** (la indireccion que permite recolorear sin tocar componentes):

```css
--color-primary: var(--color-brand-violet);
--color-primary-hover: #6e43e4;   /* OKLCH L-0.035, se OSCURECE */
--color-primary-active: #6334d6;  /* OKLCH L-0.075 */
--color-on-primary: #ffffff;      /* 5.05:1 sobre primary */
--color-accent: var(--color-brand-cyan);
--color-on-accent: var(--color-surface);  /* 9.02:1; blanco sobre cian FALLA (2.19:1) */
--color-link: var(--color-brand-lavender);
--color-focus-ring: var(--color-brand-lavender);
--color-danger: #ff392e;          /* 4.51:1, OKLCH L 0.6522 C 0.234 H 28.67 */
--color-loader-backdrop: #230048; /* hue 303.9, L 18% */
```

Dos derivaciones que vale la pena conservar en la fusion:

- **`--color-danger`**: ni el sistema ni la marca tienen rojo. La regla escrita es el **complementario del cian** en OKLCH: cian en H=208.67 grados, su opuesto en H=28.67 grados. Croma 0.234 (el maximo del gamut sRGB para esa L y hue, dentro del rango que la marca ya usa: 0.122 a 0.251). Lightness resuelta por busqueda binaria hasta 4.5:1 contra `surface-overlay`. Un solo token sirve para texto de error y borde del campo, porque satisfacer 4.5:1 satisface el 3:1 no textual por construccion.
- **`--color-loader-backdrop`**: no se puede usar `brand-violet-deep` porque es exactamente el color de una barra del isologotipo (esa barra desapareceria contra el fondo). Conserva hue 303.9 y croma pero baja L a 18%, el punto mas alto donde los cuatro colores del logo siguen distinguibles (cian 8.21:1, lavanda 7.13:1, violeta 3.57:1, purpura 2.50:1).

### 3.3 Tipografia: escala modular fluida

Razon **1.200 en 360px de ancho, 1.333 en 1440px**, interpolada con `clamp()`. Los pasos negativos usan razon unica 1.125 con piso duro de 12px, porque la razon ascendente aplicada hacia abajo invertia la escala y caia a 10px.

```css
--font-sans: var(--font-brand-sans, ui-sans-serif, system-ui, sans-serif);
--font-display: var(--font-sans);

--text-xs:   clamp(0.79rem,  0.757rem + 0.146vw, 0.889rem);  /* 12.6 -> 14.2px */  lh 1.5
--text-sm:   clamp(0.889rem, 0.852rem + 0.165vw, 1rem);      /* 14.2 -> 16.0px */  lh 1.5
--text-base: clamp(1rem,     0.958rem + 0.185vw, 1.125rem);  /* 16.0 -> 18.0px */  lh 1.65
--text-lg:   clamp(1.2rem,   1.1rem   + 0.444vw, 1.5rem);    /* 19.2 -> 24.0px */  lh 1.55
--text-xl:   clamp(1.44rem,  1.253rem + 0.829vw, 2rem);      /* 23.0 -> 32.0px */  lh 1.35
--text-2xl:  clamp(1.728rem, 1.415rem + 1.39vw,  2.666rem);  /* 27.6 -> 42.7px */  lh 1.2
--text-3xl:  clamp(2.074rem, 1.58rem  + 2.195vw, 3.555rem);  /* 33.2 -> 56.9px */  lh 1.1
--text-4xl:  clamp(2.488rem, 1.738rem + 3.336vw, 4.74rem);   /* 39.8 -> 75.8px */  lh 1.05
--text-5xl:  clamp(2.986rem, 1.875rem + 4.939vw, 6.32rem);   /* 47.8 -> 101.1px */ lh 0.95
```

Cada escalon lleva su `--text-*--line-height` en el mismo `@theme`, que es como Tailwind 4 asocia line-height a un tamano.

### 3.4 Radios

```css
--radius-none: 0px;
--radius-hairline: 2px;  /* unica concesion: inputs, para no cortar el caret */
--radius-full: 9999px;
```

La regla: **o esquina viva, o pildora**. Sale de la geometria del isologotipo, que se construye con rectangulos de esquina viva y una semicircunferencia completa. La ausencia del rango intermedio es deliberada.

### 3.5 Movimiento

```css
--duration-micro:   150ms;  /* hover, focus */
--duration-control: 250ms;  /* acordeon, tab, filtro */
--duration-enter:   600ms;  /* entrada de elemento en viewport */
--duration-scene:   900ms;  /* transicion de escena, page loader */

--ease-out-expo:      cubic-bezier(0.16, 1, 0.3, 1);
--ease-standard:      cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out-quint:  cubic-bezier(0.83, 0, 0.17, 1);
```

**GOTCHA IMPORTANTE PARA LA FUSION**: Tailwind 4 genera utilidades de easing desde el namespace `--ease-*` (por eso `ease-standard` funciona solo), pero **no tiene namespace equivalente para duraciones**: `duration-*` solo acepta valores numericos. Sin declararlas a mano, escribir `duration-control` **no genera ninguna regla** y el elemento cae en silencio a los 150ms por defecto de Tailwind. La solucion del repo:

```css
@utility duration-micro   { transition-duration: var(--duration-micro); }
@utility duration-control { transition-duration: var(--duration-control); }
@utility duration-enter   { transition-duration: var(--duration-enter); }
@utility duration-scene   { transition-duration: var(--duration-scene); }
```

Se detecto midiendo el DOM: el header declaraba `duration-control` (250ms) y aplicaba 150ms, y el riel del slider quedaba en 0s.

### 3.6 Layout y breakpoints

```css
--container-content: 64rem;  /* 1024px, tope de contenido */
--container-wide:    90rem;  /* 1440px, chrome del sitio */
--alto-nav: 4rem;            /* 5rem a partir de 40rem */
```

`--alto-nav` vive en el tema y no suelto en el header porque lo necesitan dos lugares que deben coincidir: la propia nav y el alto minimo de cada seccion.

Utilidades propias:

```css
@utility min-h-seccion { min-height: calc(100dvh - var(--alto-nav)); }

@utility recorte-* {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: --value(integer);
  overflow: hidden;
  text-overflow: clip;  /* recorta SIN puntos suspensivos */
}

@layer utilities {
  .container-content {
    width: 100%;
    max-width: var(--container-content);
    margin-inline: auto;
    padding-inline: clamp(1.25rem, 5vw, 2.5rem);
  }
  .sr-only-focusable:not(:focus):not(:focus-within) { /* clip-path: inset(50%) ... */ }
}
```

`recorte-*` existe porque el `...` de `line-clamp` lo dibuja `text-overflow`; con `clip` recorta igual pero sin puntos suspensivos. El razonamiento: un "..." es un cartel de "aca falta texto", y en una tarjeta con contenido escrito a medida delata un problema que no existe.

Breakpoints usados en el codigo: los de Tailwind por defecto (`sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem), mas media queries a mano en CSS con sintaxis moderna `@media (width >= 48rem)`.

### 3.7 Capa base

```css
@layer base {
  html {
    scroll-behavior: auto;      /* Lenis maneja el suave por JS */
    scroll-padding-top: 6rem;   /* la nav sticky no tapa el destino de un ancla */
    -webkit-text-size-adjust: 100%;
  }
  body {
    background-color: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-synthesis-weight: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
    border-radius: var(--radius-hairline);
  }
  :focus:not(:focus-visible) { outline: none; }
  ::selection { background-color: var(--color-brand-violet); color: #ffffff; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

El anillo de foco va en **dos capas** (outline + offset en color de superficie) porque un anillo de un solo color da 2.00:1 contra el boton violeta y es invisible.

### 3.8 La pagina `/sistema-de-diseno`

`F:/GitHub/expojuy-prototipo/src/app/sistema-de-diseno/page.tsx` (244 lineas) es un **Server Component puro** (sin `"use client"`) que renderiza la trazabilidad: muestras de color con hex y ratio, la escala tipografica renderizada en vivo, estados interactivos (hover del primario, foco) y los radios. Lleva `robots: { index: false, follow: false }` en su metadata.

Estructura de datos: tres arrays de `Muestra = { token, hex, nota, ratio? }` (MARCA, NEUTROS, SEMANTICOS) mas un array `ESCALA` de `{ token, clase, px }`. **Los hex estan duplicados a mano** respecto de `globals.css`: es el unico punto de desincronizacion posible del sistema de diseno.

Vale la pena portarla al repo final tal cual: es un anexo tecnico que sirve como argumento de calidad ante el jurado.

---

## 4. Fuentes: Ambit

`F:/GitHub/expojuy-prototipo/src/shared/fonts/`

| Archivo | Peso |
| --- | --- |
| `Ambit-Light.woff2` | 24916 bytes, weight 300 |
| `Ambit-Regular.woff2` | 24104 bytes, weight 400 |
| `Ambit-SemiBold.woff2` | 24700 bytes, weight 600 |
| `Ambit-Bold.woff2` | 24816 bytes, weight 700 |

Total ~98 KB. Carga en `src/shared/fonts/index.ts`:

```ts
export const ambit = localFont({
  src: [
    { path: "./Ambit-Light.woff2",    weight: "300", style: "normal" },
    { path: "./Ambit-Regular.woff2",  weight: "400", style: "normal" },
    { path: "./Ambit-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./Ambit-Bold.woff2",     weight: "700", style: "normal" },
  ],
  variable: "--font-brand-sans",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
```

Decisiones documentadas:

- Las cuatro se declaran como **una familia con cuatro `src`**, no como cuatro familias separadas. Asi `font-weight: 700` resuelve a Ambit-Bold por si solo y el navegador nunca sintetiza un falso negrita. De ahi tambien `font-synthesis-weight: none` en `globals.css`.
- `display: "swap"` prioriza texto legible desde el primer frame.
- `adjustFontFallback: "Arial"` genera un `@font-face` intermedio con las metricas de Ambit sobre Arial, para que el cambio de fuente no mueva el layout (CLS cercano a 0).
- Se aplica como `className={ambit.variable}` sobre el `<html>`, y `globals.css` la consume con fallback: `--font-sans: var(--font-brand-sans, ui-sans-serif, system-ui, sans-serif)`.

**Licencia**: no hay archivo de licencia en el repo. `README.md` y `docs/02-estado.md` la describen como "tipografia oficial provista por la organizacion". Ambit es una tipografia comercial (foundry: Kostic Type Foundry / distribuida por MyFonts y otros), asi que la base legal para usarla es que la organizacion la entrego en su kit. **Punto a documentar explicitamente en la web final**: conviene guardar la constancia de que el kit la incluye, porque redistribuir woff2 desde un dominio publico sin licencia web seria un problema. Nada en el repo cubre esto hoy.

---

## 5. App shell

### 5.1 `src/app/layout.tsx`

Server Component. Contiene todo el SEO, el script de arranque y el skip link.

**Metadata** (`export const metadata: Metadata`):

```ts
metadataBase: new URL(SITE.url),
title: {
  default: `${SITE.name} - ${SITE.claim}`,
  template: `%s - ${SITE.name}`,   // las paginas internas solo declaran su nombre
},
description: SITE.description,
applicationName: SITE.name,
authors: [{ name: SITE.organizer }],
keywords: ["ExpoJuy", "ExpoJuy 2026", "Jujuy", "comercio exterior", "exposicion",
           "economia del conocimiento", "vinculacion empresarial"],
openGraph: { type: "website", locale: SITE.locale, url: SITE.url, siteName: SITE.name,
             title, description },
twitter: { card: "summary_large_image", title, description },
icons: { icon: [{ url: BRAND_ICON_DATA_URI, type: "image/svg+xml" }] },
robots: { index: true, follow: true },
```

**Viewport**:

```ts
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0911",
  width: "device-width",
  initialScale: 1,
  // Sin maximumScale ni userScalable: false - bloquear el zoom viola WCAG 1.4.4
};
```

**No hay JSON-LD ni datos estructurados schema.org.** Verificado por grep: cero coincidencias de `application/ld+json`, `jsonLd` o `schema.org` en todo `src/`. **Tampoco hay `sitemap.ts`, `robots.ts` ni `manifest.ts`** en `src/app/`. Es un hueco real para la web final: un evento tiene un tipo schema.org (`Event`) que aporta bastante en resultados de busqueda.

**El favicon no es un archivo**: es un data URI SVG generado desde la misma geometria del isologotipo (ver seccion 6.1).

**Script de arranque** (lo mas importante del layout):

```html
<html lang="es-AR" className={ambit.variable} suppressHydrationWarning>
  <body className="bg-surface-sunken font-sans text-text antialiased">
    <script dangerouslySetInnerHTML={{ __html:
      `(function(){var d=document.documentElement;d.classList.add("js");try{if(!sessionStorage.getItem("${STORAGE_KEYS.loaderVisto}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.setAttribute("data-loader","")}catch(e){}})()`
    }} />
```

Hace dos cosas, ambas imposibles desde React:

1. Marca `js` en el `<html>`. Todas las animaciones de aparicion se aplican **solo detras de esa clase**, asi que si el JS falla el contenido queda visible.
2. Decide si corresponde la pantalla de carga y marca `data-loader`. Si dependiera de un efecto de React, el navegador pintaria el hero primero y el morado lo taparia despues.

`suppressHydrationWarning` es obligatorio, no cosmetico: el script cambia el `className` del `<html>` antes de que React hidrate.

**Skip link** como primer elemento enfocable (WCAG 2.4.1):

```html
<a href="#contenido-principal" className="sr-only-focusable fixed top-4 left-4 z-[100] bg-primary px-4 py-2 text-sm font-semibold text-on-primary focus-visible:outline-focus-ring">
  Saltar al contenido principal
</a>
```

Y por ultimo `<SmoothScroll>{children}</SmoothScroll>`.

### 5.2 `src/app/page.tsx`

Capa de composicion pura. Orden de secciones:

```
PageLoader
ScrollProgress
SiteHeader
<main id="contenido-principal" className="relative z-[1] bg-surface-sunken">
    HeroSection        (#inicio)      Seccion 01
    AboutSection       (#sobre)       Seccion 02
    AgendaSection      (#agenda)      Seccion 03
    ExhibitorsSection  (#expositores) Seccion 04
    VenueMapSection    (#mapa)        Seccion 05
    TicketsSection     (#entradas)    Seccion 06
    NewsSection        (#noticias)    Seccion 07
    FaqSection         (#faq)         Seccion 08
    ContactSection     (#contacto)    Seccion 09
    SponsorsSection    (#sponsors)    SIN numero, franja de cierre
</main>
SiteFooter
BackToTop
```

**Invariante escrita**: el orden de este archivo tiene que coincidir con `NAV_SECTIONS`. `useActiveSection` recorre esa lista para marcar el item del menu y los enlaces apuntan a estos `id`. Sponsors no esta en `NAV_SECTIONS` a proposito: es credito institucional, no un destino de navegacion, asi que va sin numero y como franja de cierre.

**El `relative z-[1] bg-surface-sunken` de `<main>` es estructural**, no estetico: sostiene el footer revelado (ver seccion 6.8).

Escalera de z-index del sitio:

| Capa | z-index |
| --- | --- |
| `<main>` | 1 |
| `SiteHeader` | 80 |
| `BackToTop` | 85 |
| `ScrollProgress` | 90 |
| Skip link | 100 |
| `PageLoader` | 200 |
| `SiteFooter` | `auto` (positivo por ser `sticky`) |

### 5.3 Constantes globales

`src/shared/constants/site.ts` es la fuente unica de verdad institucional:

```ts
export const SITE = {
  name: "ExpoJuy 2026",
  claim: "Conectando paises, creando oportunidades",
  organizer: "Camara de Comercio Exterior de Jujuy",
  venue: "Ciudad Cultural, San Salvador de Jujuy",           // PROVISORIO
  dates: { startISO: "2026-09-24", endISO: "2026-09-27",
           label: "24 al 27 de septiembre de 2026" },        // PROVISORIO
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://expojuy2026.vercel.app",
  locale: "es_AR",
  description: "...",
} as const;

export const CONTACTO = { email, telefono, telefonoHref, direccion } as const;  // PROVISORIO
export const SOCIAL_LINKS = [ { label, href }, ... ] as const;                  // PROVISORIO

export const NAV_SECTIONS = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre", label: "Sobre ExpoJuy" },
  { id: "agenda", label: "Agenda" },
  { id: "expositores", label: "Expositores" },
  { id: "mapa", label: "Mapa" },
  { id: "entradas", label: "Entradas" },
  { id: "noticias", label: "Noticias" },
  { id: "faq", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
] as const;
export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];
```

El orden sigue un embudo declarado: todo lo anterior a Entradas responde "vale la pena ir?", Entradas responde "si, como entro?", y Noticias/Preguntas/Contacto son cola informativa.

`src/shared/constants/storage.ts` es un modulo **deliberadamente neutral** (sin `"use client"` ni `"use server"`), y esa es toda su razon de ser:

```ts
export const STORAGE_KEYS = {
  loaderVisto: "expojuy:loader-visto",
} as const;
```

Si estas constantes vivieran en el modulo del loader (que si es cliente), el layout recibiria un **proxy de referencia de cliente** en vez del string, y al interpolarlo en el script inline emitiria codigo roto. Ya paso: el script quedaba con `sessionStorage.getItem("function() { throw new Err...` y moria al parsearse, dejando sin efecto tanto la clase `js` como el loader.

`src/shared/lib/cn.ts`:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Registrado en `.prettierrc` como `tailwindFunctions: ["cn", "cva"]` para que el plugin de Prettier ordene las clases dentro de esas llamadas.

---

## 6. Piezas adoptadas: analisis detallado

### 6.1 Pantalla de carga / preloader

**Archivos exactos**

| Archivo | Lineas | Tipo |
| --- | --- | --- |
| `src/shared/components/brand/page-loader.tsx` | 89 | Client Component |
| `src/shared/components/brand/loader-backdrop.tsx` | 27 | Server Component (sin `"use client"`) |
| `src/shared/components/brand/brand-mark.tsx` | 58 | Server Component |
| `src/shared/components/brand/brand-mark-paths.ts` | 161 | modulo neutral de datos |
| `src/app/globals.css`, bloque "PANTALLA DE CARGA" | lineas ~520 a ~760 | CSS |
| `src/app/layout.tsx`, script inline | - | decision de mostrar |

**Mecanismo tecnico exacto**

*Quien decide mostrarlo*: el script inline del layout. Si `sessionStorage` no tiene `expojuy:loader-visto` **y** no hay `prefers-reduced-motion: reduce`, escribe el atributo `data-loader` en el `<html>`. El CSS lo consume:

```css
html:not([data-loader]) .page-loader { display: none; }
```

React no controla la visibilidad. Solo maneja los temporizadores. Con `prefers-reduced-motion` el loader **no se muestra en absoluto** (no "mas rapido": no se muestra).

*Geometria*: `brand-mark-paths.ts` es la fuente unica. Los `d` se extrajeron del stream de contenido de `RecursosExpoJuy/RGB/expojuy26_isologotipo.pdf` descomprimido con zlib, **sin modificar**, para que sean verificables con un diff. Los colores tambien salen del PDF: sus operadores `scn` declaran `0.4667/0.3098/0.9412` -> `#774FF0`.

```ts
export const BRAND_VIEW_BOX = "0 0 164.6901 229.8555";
export const BRAND_FLIP_Y = "translate(-338.5848, 412.3633) scale(1, -1)";
export const BRAND_ZOOM_ORIGIN = { x: "49.7%", y: "91.3%" } as const;
```

Cuatro paths, con clases para poder animarlos individualmente: `brand-mark__stem` (violeta), `brand-mark__hook` (lavanda, `fillRule: "evenodd"`), `brand-mark__bar-low` (purpura), `brand-mark__bar-high` (cian).

El modulo genera **dos artefactos derivados** en tiempo de modulo:

- `BRAND_MASK_URL = construirMascara()`: la misma "J" en negro solido como data URI, lista para `mask-image`.
- `BRAND_ICON_DATA_URI = construirIcono()`: favicon SVG de 64x64, logo escalado a 52 de alto y centrado, con los colores en **hex literal** (un favicon se renderiza en un documento aparte que no hereda el `:root` del sitio, asi que un `var()` saldria sin color).

*Animacion de entrada* (4 piezas, una por una):

| Orden | Pieza | Animacion | Duracion / delay |
| --- | --- | --- | --- |
| 2 | gancho lavanda | `clip-path: circle(0% at 0% 50%)` -> `circle(135% at 0% 50%)` | 620ms (`--l-barrido`) |
| 4 | barra purpura | pop `scale 0.1 -> 1` + opacity | 520ms, delay 260ms |
| 3 | asta violeta | pop identico | 520ms, delay 400ms |
| 1 | barra cian | caida con rebote, 6 keyframes | 780ms, delay 620ms |

El barrido radial (`circle`) y no un `inset()`: un frente recto vertical contra una curva se lee como una persiana; el circulo acompana la forma del gancho y parece que se dibuja la sonrisa.

La caida usa `animation-timing-function` **por keyframe** (acelera al caer con `cubic-bezier(0.5,0,0.9,0.35)`, frena al subir con `cubic-bezier(0.15,0.85,0.4,1)`), con la global en `linear` para que no aplaste los tramos. Y hay una trampa documentada:

> OJO CON EL SIGNO: el `<g>` del isologotipo lleva `scale(1, -1)` para resolver que el PDF tiene el eje Y hacia arriba. Ese flip invierte el sentido de los `translate` de sus hijos, asi que aca un valor POSITIVO desplaza la pieza hacia ARRIBA en pantalla.

Cada pieza lleva `transform-box: fill-box` + `transform-origin: center`, sin lo cual el origen se calcula contra el viewBox del SVG y el "pop desde el centro" se ve como un desplazamiento.

*Animacion de salida* (efecto intro de Los Simpsons): la "J" **no se desvanece, es un agujero en el morado**.

```css
.page-loader[data-saliendo] .page-loader__backdrop {
  mask-image: var(--l-mascara), linear-gradient(#000, #000);
  mask-size: var(--l-marca) calc(var(--l-marca) * 1.39557), cover;
  mask-composite: exclude;
  /* + prefijos -webkit-, con mask-composite: xor */
}
```

Es decir: rectangulo morado a pantalla completa, con la "J" restada por composicion `exclude`. Donde la mascara es opaca, el morado se recorta y se ve el hero.

**La mascara solo existe durante la salida.** Durante la entrada el morado tiene que ser telon opaco: si el agujero estuviera abierto desde el principio, cada pieza que todavia no aparecio dejaria ver el hero recortado con su propia silueta.

El zoom crece alrededor del **punto de entrada** y no del centro del viewport, porque el centro geometrico de la caja del logo cae en el hueco entre la barra purpura y el asta (creciendo desde ahi se agrandaria el vacio):

```css
.page-loader__backdrop {
  transform-origin: calc(50% - 0.495px * var(--l-k)) calc(50% + 94.93px * var(--l-k));
}
.page-loader__mark {
  transform-box: fill-box;
  transform-origin: 49.7% 91.3%;
  overflow: visible;  /* la pieza 1 cae DESDE AFUERA del viewBox */
}
```

Con `--l-k = --l-marca-num / 164.6901`, el factor que lleva unidades de PDF a pixeles. Es el mismo punto fisico que el 49.7%/91.3%, asi que la marca pintada y el agujero escalan superpuestos.

El factor de zoom es **calculado, no tanteado**:

> el punto de entrada esta a 20 unidades de logo del borde inferior del gancho, asi que para que su vecindad rellena cubra media pantalla hace falta 20 x 0.777 x S > 363 -> S > 23. Se usa 34 con margen.

*Tiempos* (declarados en CSS y duplicados en el TSX):

```css
--l-barrido: 620ms;  --l-pieza: 520ms;  --l-caida: 780ms;  --l-salida-dur: 1400ms;
/* entrada 1400 + pausa 300 + salida 1400 = 3100ms */
```

```ts
const DURACION_MS = 3100;  // debe coincidir con la suma de los tiempos del CSS
const SALIDA_MS   = 1400;  // debe coincidir con --l-salida-dur
```

*Ciclo de vida en React*:

```ts
useEffect(() => {
  const raiz = document.documentElement;
  if (!raiz.hasAttribute("data-loader")) return;   // no corresponde
  document.body.style.overflow = "hidden";
  const aSalir = setTimeout(() => setSaliendo(true), DURACION_MS - SALIDA_MS);
  const aTerminar = setTimeout(() => {
    raiz.removeAttribute("data-loader");
    document.body.style.overflow = "";
    try { sessionStorage.setItem(STORAGE_KEYS.loaderVisto, "1"); } catch {}
  }, DURACION_MS);
  return () => { clearTimeout(aSalir); clearTimeout(aTerminar); document.body.style.overflow = ""; };
}, []);
```

Notar: los `setState` viven dentro de callbacks asincronos, no en el cuerpo del efecto, para no provocar el render extra que penaliza `set-state-in-effect`.

*Marcado*: `<div className="page-loader fixed inset-0 z-[200]" data-saliendo={...} aria-hidden="true">` con `LoaderBackdrop` + `BrandMark`. Va `aria-hidden` y sin foco: para un lector de pantalla no existe. **No bloquea el contenido**: el HTML se sirve completo debajo, asi que los buscadores no ven una pagina vacia.

**Decision de layout que hay que respetar al portarlo**: `display: grid; place-items: center` esta en `.page-loader` en `globals.css` y **no** como utilidades de Tailwind. Motivo escrito:

> Las capas en cascada le ganan a la especificidad: si el `display: grid` viniera de la clase `grid` (capa `utilities`, posterior), ningun `display: none` escrito en `components` podria anularlo. El sintoma seria grave: en la segunda visita el overlay taparia el sitio para siempre.

**Dependencias externas**: ninguna. Solo React (dos `setTimeout` y un `useState`) y CSS. Ni siquiera lucide-react.

**Shape de datos**: `BRAND_PATHS: readonly BrandPath[]` con `{ className, fill, hex, d, fillRule? }`. Nada mas.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Muy baja** | Solo `"use client"` y el script inline del layout. En Astro el script inline es `<script is:inline>` en el `<head>` del layout, que es incluso mas natural. |
| Tailwind | **Nula para el loader** | Todo el CSS del loader es CSS plano en `@layer components`. Las unicas clases Tailwind son `fixed inset-0 z-[200]`, triviales de reemplazar. |
| React | **Baja** | Los timers se reescriben en vanilla JS en 15 lineas. En Astro se puede hacer sin framework: un `<script>` que setea `data-saliendo` a los 1700ms y limpia a los 3100ms. |
| Navegador | `mask-composite: exclude` / `-webkit-mask-composite: xor`, `clip-path: circle()`, `transform-box: fill-box`. Todo soportado en navegadores actuales; el prefijo webkit ya esta puesto. |

**Veredicto**: es la pieza mas portable del repo. Se puede llevar casi literal a cualquier stack. Lo unico critico es mantener los cuatro `d` sin modificar y no duplicar la geometria.

**Costo medido**: durante los 3,1 s del loader el viewport es un campo casi negro y las animaciones de aparicion dejan el H1 del hero en `opacity: 0`, asi que el LCP movil se corre a 2,7 s y el Speed Index a 4,9 s. En escritorio no se paga (LCP 0,7 s). Esta documentado como **costo asumido, no defecto**.

---

### 6.2 Home / Hero

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/features/hero/components/hero-section.tsx` | 119 |
| `src/features/hero/components/hero-video.tsx` | 81 |
| `src/features/hero/components/hero-rotador.tsx` | 79 |
| `src/features/hero/constants/media.ts` | 61 |
| `src/app/globals.css`, bloque "ROTADOR DEL HERO" | lineas ~400 a ~510 |
| `public/media/hero-1080.mp4`, `hero-1080.webm`, `hero-720.webm`, `hero-poster.jpg` | 9,6 MB |

**Estructura de capas** (de atras hacia adelante):

1. **Poster**: `<Image>` de Next con `priority` y `sizes="100vw"`, en `-z-20`. Es lo que optimiza el LCP.
2. **Video**: `<HeroVideo>` en `-z-10`, se carga despues de la hidratacion y aparece con fundido.
3. **Velo**: dos capas en `-z-10`, `bg-surface-sunken/64` (oscurecido parejo) + `bg-gradient-to-b from-surface-sunken/70 via-surface-sunken/30 to-surface-sunken`.
4. **Contenido**: dentro de `container-content`, centrado.

El velo **no es decorativo**: los valores salen de medir el peor pixel detras de cada bloque de texto sobre frames reales. Con velo al 55% la sede daba 3.60:1 (alcanza en escritorio donde 24px cuenta como texto grande, umbral 3:1, pero no en movil donde la escala fluida la baja a 19.2px y el umbral sube a 4.5:1). Por eso el velo subio a 64% y la sede dejo de usar el color apagado.

Se probo una tercera capa con tinte violeta (`mix-blend-color`) y se quito: tenia toda la imagen y mataba los ambares de las calles y los azules de los edificios.

**Video: eleccion de fuente en JS, no con `<source media>`**

```ts
const cargar = () => {
  const escritorio = window.matchMedia(HERO_MEDIA.puntoDeCorte).matches;  // "(min-width: 768px)"
  const fuente = escritorio ? HERO_MEDIA.video.escritorio : HERO_MEDIA.video.movil;
  const puedeWebm = el.canPlayType("video/webm; codecs=vp9") !== "";
  el.src = puedeWebm ? fuente.src : HERO_MEDIA.video.respaldo.src;
  el.load();
  el.play().catch(() => {});   // sin el catch, error sin manejar por politica de autoplay
};

if ("requestIdleCallback" in window) {
  const id = requestIdleCallback(cargar, { timeout: 2000 });
  return () => cancelIdleCallback(id);
}
const id = setTimeout(cargar, 400);
```

Motivo: el atributo `media` de `<source>` existe en la especificacion pero los navegadores solo lo evaluan al cargar y el soporte es dispar. Con `matchMedia` es determinista: en un celular nunca se descargan los 3,2 MB de la variante de escritorio.

Con `prefers-reduced-motion` el video **no se descarga en absoluto**.

El video va con `aria-hidden`, `muted loop playsInline preload="none" disablePictureInPicture`, y aparece con `transition-opacity duration-scene` cuando dispara `onCanPlay`.

El poster va como `<Image>` aparte y **no** como atributo `poster` para que pase por el optimizador de Next (AVIF/WebP) y pueda llevar `priority`. Nota medida: **una imagen a viewport completo no es candidata a LCP** (Chrome la trata como fondo), asi que el poster no es el elemento LCP.

**Rotador 3D**

Cinco pares con forma "Valor, que vas a ver", rotando cada 3000ms:

```ts
export const HERO_PARES = [
  { izquierda: "Ciudad Cultural", derecha: "San Salvador de Jujuy" },
  { izquierda: "Innovacion",      derecha: "robots con IA y charlas dev" },
  { izquierda: "Tecnologia",      derecha: "demos en vivo y prototipos" },
  { izquierda: "Produccion",      derecha: "stands de mineria y agro" },
  { izquierda: "Desarrollo",      derecha: "rondas de negocios" },
] as const;
export const HERO_ROTACION_MS = 3000;
```

Mecanismo: **todos los pares se apilan en la misma celda de una grilla**, con `grid-template-areas: "linea"` y `justify-items: center`. Cada linea lleva `perspective: 260px` y sus dos mitades giran en sentidos opuestos con `rotateX`.

```css
.rotador { display: grid; grid-template-areas: "linea"; justify-items: center; align-items: start; }
.rotador__linea { grid-area: linea; perspective: 260px; text-align: center; }
.rotador__mitad { display: inline-block; backface-visibility: hidden; }
```

Estados por `data-estado`: `entra`, `sale`, `oculto`. Cuatro keyframes (`rotador-entra-desde-abajo`, `rotador-sale-hacia-arriba`, `rotador-entra-desde-arriba`, `rotador-sale-hacia-abajo`) que combinan `translateY(+-70%)` con `rotateX(+-90deg)` y opacity.

La coma acompana a la mitad izquierda (es parte de esa unidad).

React solo mantiene dos indices (`indice`, `anterior`) y usa una **key compuesta** para forzar el remontaje:

```tsx
<span key={`${i}-${indice}`} data-estado={estadoDe(i)} className="rotador__linea">
```

> La clave incluye el indice activo para que React remonte las lineas en cada rotacion y las animaciones vuelvan a dispararse.

Historia relevante: la primera version daba a cada mitad su propia ranura de ancho fijo con la coma anclada entre ambas, y se veia descentrado porque las ranuras tenian anchos distintos (171px y 293px). La unidad ahora es el **par completo**.

**Accesibilidad**: la rotacion va `aria-hidden` y al lado hay un `<span className="sr-only">` con el primer par (la sede, el unico dato real). Con `prefers-reduced-motion` no rota: se queda fija.

**Shape de datos**

```ts
HERO_PARES: readonly { izquierda: string; derecha: string }[]
HERO_MEDIA: {
  video: { movil: {src,type}, escritorio: {src,type}, respaldo: {src,type} },
  poster: { src: string; ancho: number; alto: number },
  puntoDeCorte: string,   // media query
}
```

**Dependencias externas**: `next/image`, `lucide-react` (solo `ArrowDown` del indicador de scroll), `Reveal` de shared, `usePrefersReducedMotion` de shared.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Media** | `next/image` con `priority`/`sizes`. En Astro se reemplaza por `astro:assets` (`<Image>` de Astro) o `<picture>` con srcset a mano. Es un cambio de una linea conceptual pero real. |
| Tailwind | **Baja** | El rotador entero es CSS plano. El resto son utilidades comunes (`absolute inset-0`, gradientes). Los gradientes usan tokens (`from-surface-sunken/70`) que hay que portar. |
| React | **Media** | El rotador depende del truco de `key` para remontar. En vanilla/Astro se resuelve alternando clases con un `setInterval` y `element.getAnimations()` o quitando/reagregando la clase. |

El `hero-video.tsx` es casi vanilla: `useRef` + `useEffect` + `matchMedia`. Se porta a un script de Astro en 20 lineas.

**Bloqueante de contenido**: el clip es una aerea nocturna de una ciudad de EE.UU. (se leen carteles de KeyBank y Wells Fargo). Licencia libre y sin marca de agua, pero **no es Jujuy** y "identidad institucional" es criterio de evaluacion explicito. El comando de encoding esta documentado:

```bash
ffmpeg -i master.mp4 -vf "scale=1920:1080:flags=lanczos" \
       -c:v libvpx-vp9 -b:v 0 -crf 48 -row-mt 1 -tile-columns 3 \
       -cpu-used 2 -pix_fmt yuv420p -an hero-1080.webm
```

`-b:v 0` es lo que hace que `-crf` funcione como calidad constante. Sin eso libvpx lo trata como tope dentro de un objetivo de bitrate y el archivo sale mas pesado que el original (paso: 46,7 MB desde un MP4 de 20,4 MB).

---

### 6.3 Agenda completa

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/features/agenda/components/agenda-section.tsx` | 70 |
| `src/features/agenda/components/linea-tiempo.tsx` | 90 |
| `src/features/agenda/components/actividad-fila.tsx` | 129 |
| `src/features/agenda/hooks/use-linea-tiempo.ts` | 136 |
| `src/features/agenda/constants/actividades.ts` | 112 |
| `src/app/globals.css`, bloque "AGENDA - LINEA DE TIEMPO" | ~40 lineas |

**Concepto**: linea de tiempo vertical con un trazo SVG que se dibuja conforme se scrollea, tarjeta a un lado y datos del otro, alternando.

**Mecanismo 1: la variable `--eje`**

```tsx
<ol ref={lista} role="list"
    className="agenda-tiempo relative flex flex-col gap-20 [--eje:0.75rem] lg:gap-28 lg:[--eje:50%]">
```

`--eje` guarda la posicion horizontal de la linea y la heredan **los dos** que deben coincidir: el SVG y los nodos de cada fila. Un solo valor, dos consumidores, imposible que se desalineen. En movil vale `0.75rem` (la linea se va al margen) y en escritorio `50%` (la grilla es de dos columnas iguales, asi que el 50% cae en la canaleta).

El `role="list"` explicito esta puesto porque sin vinetas Safari deja de anunciar la lista como lista.

**Mecanismo 2: el trazo con `pathLength="1"`**

`linea-tiempo.tsx` dibuja un SVG con `viewBox="0 0 24 1000"` y `preserveAspectRatio="none"`. Dos paths superpuestos: un riel apagado (`stroke-border`) y el trazo que avanza.

```tsx
<path className="agenda-tiempo__trazo" d={TRAZO} pathLength={1}
      fill="none" strokeWidth="2" strokeLinecap="butt"
      stroke={`url(#${ID_DEGRADE})`} />
```

```css
.agenda-tiempo__trazo {
  stroke-dasharray: 1;
  stroke-dashoffset: calc(1 - var(--avance));
}
```

`pathLength="1"` normaliza la longitud de la curva a 1, asi que `stroke-dashoffset: calc(1 - var(--avance))` se lee literal como "deja sin dibujar lo que falta". **Sin esa normalizacion habria que medir el path con `getTotalLength()` en cada resize**, porque el alto real depende del contenido.

Tres trampas documentadas en este archivo:

1. **El degradado va en `userSpaceOnUse`, y no es una preferencia.** `gradientUnits` vale `objectBoundingBox` por defecto: la caja de una recta **vertical** tiene ancho CERO, y la especificacion dice que un elemento con caja degenerada que referencia un degradado en `objectBoundingBox` **no se pinta**. No sale tenue: no sale.
2. **No hay `vector-effect="non-scaling-stroke"`.** Pasaria los dashes a espacio de pantalla y rompe la normalizacion de `pathLength`.
3. **Los colores van en `style` y no en atributos.** `stop-color="var(--...)"` como atributo de presentacion no resuelve de forma confiable en todos los motores; como propiedad CSS si.

El degradado usa los mismos tres colores y el mismo orden que la barra de progreso de lectura: cian -> violeta -> lavanda.

**Mecanismo 3: `useAvanceLinea` (el hook de scroll)**

Constante compartida: `const LINEA_LECTURA = 0.55` (la altura del viewport, en tanto por uno, a la que consideramos que algo "ya se leyo"). Es **un solo numero para los dos hooks del archivo**, y ese es el motivo de que convivan ahi: el frente de la linea dibujada y el encendido de los nodos tienen que cruzar exactamente la misma altura.

```ts
const escribir = useCallback((scroll: number) => {
  const el = ref.current; if (!el) return;
  const { top, alto } = metricas.current;
  const avance = (scroll + window.innerHeight * LINEA_LECTURA - top) / alto;
  el.style.setProperty("--avance", String(acotar01(avance)));
}, []);

useLenis(({ scroll }) => { if (reducido) return; escribir(scroll); });
```

Dos decisiones de rendimiento explicitas:

1. **No hay `setState` por frame.** El valor se escribe directo sobre una custom property del nodo via ref. React no se entera y el navegador solo recalcula el `stroke-dashoffset`, que es pintura, no layout.
2. **No hay `getBoundingClientRect` por frame.** La posicion y el alto se miden una vez y se recalculan solo cuando algo cambia de tamano, con un `ResizeObserver` **sobre `document.body`** (no sobre la lista: el alto de la lista puede no cambiar y aun asi moverse su `top` porque crecio algo de mas arriba).

```ts
const medir = () => {
  const r = el.getBoundingClientRect();
  metricas.current = { top: r.top + window.scrollY, alto: Math.max(1, r.height) };
  escribir(window.scrollY);   // recalcular en el acto: si se entra por un ancla a #agenda,
                              // no va a haber ningun evento de scroll que dispare el primer calculo
};
medir();
const observador = new ResizeObserver(medir);
observador.observe(document.body);
```

**Mecanismo 4: mejora progresiva del trazo**

```css
.agenda-tiempo { --avance: 1; }        /* valor de reposo: DIBUJADA */
.js .agenda-tiempo { --avance: 0; }    /* la clase js la borra para que el scroll la dibuje */

@media (prefers-reduced-motion: reduce) {
  .js .agenda-tiempo { --avance: 1; }
}
```

Y ademas el hook escribe `1` inline con movimiento reducido, "porque el estilo inline le gana a este media query y hay que cubrirlo de los dos lados".

Notar el detalle de herencia documentado: `--avance` se escribe **sobre la lista, no sobre el SVG**. Una custom property declarada en el propio elemento le gana a la que hereda del padre, asi que si el valor de reposo viviera en el SVG el valor que escribe el JS en la lista nunca lo alcanzaria.

**Mecanismo 5: `useCruzoLectura` (encendido de nodos)**

Este hook es una leccion aparte. **No usa `isIntersecting`, y ese es el punto**:

```ts
const observador = new IntersectionObserver(([entrada]) => {
  const linea = entrada.rootBounds?.bottom ?? window.innerHeight * LINEA_LECTURA;
  const ahora = entrada.boundingClientRect.top <= linea;
  setCruzo((actual) => (actual === ahora ? actual : ahora));
}, { rootMargin: `0px 0px -${(1 - LINEA_LECTURA) * 100}% 0px`, threshold: 0 });
```

> El `rootMargin` recorta el borde inferior del viewport hasta LINEA_LECTURA, pero eso no define una linea: define una FRANJA. `isIntersecting` responde "esta dentro de la franja?", y vuelve a `false` cuando el elemento sale por arriba. Con eso, los nodos que ya quedaron atras se apagaban al alejarse. Se detecto midiendo: un nodo en `top: -463px` reportaba `false`.

La pregunta correcta es "ya lo paso?", y eso sale de la geometria. El `rootMargin` sigue haciendo falta, pero **para que el navegador avise en ese cruce**, en los dos sentidos. Es un booleano: el `setState` corre una vez por cruce, no por frame.

**Mecanismo 6: la alternancia**

```tsx
const tarjetaIzquierda = indice % 2 === 0;
```

> EL ORDEN DEL DOM NO ALTERNA. Los datos van SIEMPRE primero en el marcado y la tarjeta despues; el zigzag lo produce `col-start`, que es puramente visual. Asi el lector de pantalla y el tabulador recorren siempre "cuando -> que".

Las clases: `lg:row-start-1` en ambos, y `lg:col-start-2` / `lg:col-start-1 lg:text-right` segun la paridad.

**Otros detalles**

- Un solo `<time dateTime={actividad.inicioISO}>` envuelve dia y hora: para la maquina es un unico instante aunque en pantalla esten en dos renglones.
- El nodo sobre la linea: `size-3 rounded-full border-2 border-border-strong bg-surface-sunken`, con `data-[activo]:scale-125 data-[activo]:border-accent data-[activo]:bg-accent` y `transition-[background-color,border-color,scale] duration-control`.
- La tarjeta lleva `aspect-[4/5]` con `flex flex-col justify-end`: la imagen va **detras** de todo el bloque y el texto se apoya al pie. El alto sale de la proporcion, no de un valor fijo.
- Velo de la tarjeta: `bg-gradient-to-b from-surface-sunken/0 from-25% via-surface-sunken/90 via-65% to-surface-sunken/98`. Los cortes estan puestos para que el texto nunca caiga bajo el 83% de opacidad (sobre lavanda, lo peor que puede tocarle, deja el fondo compuesto en ~#231931 y el texto en 13:1).
- El alto del SVG va **explicito** (`h-[calc(100%-1.5rem)]`), no con `bottom-0`. Trampa documentada: un `<svg>` con viewBox y sin alto declarado es un elemento reemplazado con proporcion intrinseca, y con `height: auto` el navegador usa su alto intrinseco e **ignora `bottom`**. Medido: la linea media 1000px (el alto del viewBox) contra los 3611px de la lista.

**Shape de datos**

```ts
export type Actividad = {
  id: string;
  inicioISO: string;      // fecha y hora en ISO local, alimenta dateTime
  diaLabel: string;       // "Jueves 24", escrito a mano para no depender de Intl en el servidor
  horaLabel: string;      // "10:00", 24 horas (convencion argentina)
  expositor: string;      // PROVISORIO
  eje: string;            // eje declarado por la organizacion, NO provisorio
  titulo: string;         // presupuesto ~31 caracteres
  descripcion: string;    // presupuesto ~78 caracteres
  paleta: 0 | 1 | 2 | 3;  // indice de paleta del PlaceholderVisual
};
export const ACTIVIDADES: readonly Actividad[] = [ ... 6 items ... ];
```

**Dependencias externas**: `lenis/react` (el hook `useLenis`), `Reveal`, `PlaceholderVisual`, `cn`.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | Ningun API de Next. Solo `"use client"`. |
| Tailwind | **Media-alta** | El layout de la fila depende de utilidades de grid (`lg:grid-cols-2`, `lg:col-start-1/2`, `lg:row-start-1`) y de valores arbitrarios (`[--eje:0.75rem]`, `left-[var(--eje)]`). Portable pero hay que reescribirlo. |
| Lenis | **Alta** | `useAvanceLinea` esta escrito contra `useLenis(({scroll}) => ...)`. Sin Lenis se cambia por un listener de `scroll` con `requestAnimationFrame`, pero el efecto pierde suavidad porque el trazo dejaria de interpolarse. **Este es el acoplamiento mas fuerte de la seccion.** |
| React | **Media** | Los dos hooks son 100% DOM API; se convierten a vanilla facilmente. La estructura de fila alternada es marcado puro. |

Portar a Astro: el SVG y el CSS van tal cual. Los dos hooks se reescriben como un script de isla o como un `<script>` global que hace `querySelectorAll(".agenda-tiempo")`. Si se abandona Lenis, `useAvanceLinea` pasa a `document.addEventListener("scroll", ..., { passive: true })` con `window.scrollY`. El resto es identico.

---

### 6.4 Mapa del predio

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/features/venue-map/components/venue-map-section.tsx` | 485 |
| `src/features/venue-map/constants/plano.ts` | 397 |
| `src/app/globals.css`, bloques "RECORRIDO DEL MAPA", "RIEL DEL MAPA", "PULSO DEL PUNTO DE ACCESO" | ~90 lineas |
| `src/shared/hooks/use-carrusel-circular.ts` | 108 (compartido) |

**Concepto**: plano esquematico vertical del predio de la Ciudad Cultural, con nueve lugares senalizados y un recorrido SVG que se dibuja desde el acceso al elegir uno. Un cuarto para el plano, tres cuartos para un riel de tarjetas.

**Sistema de coordenadas: `sobreEje`**

Nada se ubica con coordenadas sueltas. Todo pasa por una funcion:

```ts
export const VIEW_BOX = { x: 0, y: 0, ancho: 340, alto: 720 } as const;
const ORIGEN: [number, number] = [170, 437];     // la rotonda de acceso
export const ANGULO_EJE = -90;                    // el plano va DERECHO, no inclinado
const EJE  = { x: 0, y: -1 } as const;            // hacia arriba
const PERP = { x: 1, y: 0 } as const;             // hacia la derecha

export function sobreEje(avance: number, desvio: number): [number, number] {
  return [
    Math.round(ORIGEN[0] + avance * EJE.x + desvio * PERP.x),
    Math.round(ORIGEN[1] + avance * EJE.y + desvio * PERP.y),
  ];
}
```

Con eso, "el pabellon esta 60 mas adelante y 30 a la derecha" se escribe tal cual, las separaciones se verifican con una resta, y mover una pieza no obliga a recalcular las vecinas. Todo el plano (parcela, calles, verdes, edificios, rotonda, arena, puntos) se genera desde ahi.

Los stands se generan, no se escriben a mano:

```ts
const STANDS: Edificio[] = Array.from({ length: 4 }, (_, fila) =>
  Array.from({ length: 6 }, (_, col): Edificio => ({
    id: `stand-${fila}-${col}`,
    centro: sobreEje(95 + col * 23, 16 + fila * 22),
    ancho: 17, alto: 16, tipo: "stand",
  })),
).flat();
```

**Procedencia y licencia** (importante para la fusion): el trazado es **esquematico derivado de datos de OpenStreetMap (ODbL)**, no un calco de fotografia satelital. El comentario del archivo explica por que:

> La geometria de un lugar es un hecho y no es de nadie, pero la imagen satelital tiene dueno y sus terminos prohiben las obras derivadas. Por eso la referencia fue OSM y nunca una foto satelital.
>
> La atribucion ODbL NO va renderizada en la seccion, y el motivo es que a esta altura el plano ya no contiene datos de OSM: se enderezo sobre su propio eje, se ensancho y se redibujo como esquema, asi que ninguna coordenada de aca sale de su base.
>
> Si alguna vez esto se reemplaza por un trazado fiel, la atribucion vuelve a ser obligatoria.

Los **nombres de las calles** si son datos de OSM ("Av. de los Estudiantes Jujenos", "Corrilla de San Martin", "Av. de las Carrozas", 'Santiago "Pila" Sola').

**Mecanismo: el recorrido con Dijkstra**

El camino de A a B **no es una recta**: seria un trazo que atraviesa naves y canteros. Hay un grafo de circulacion:

```ts
export const NODOS: Record<string, [number, number]> = {
  ...Object.fromEntries(PUNTOS.map((p) => [p.id, p.posicion])),
  "via-1": sobreEje(60, 0),  "via-2": sobreEje(125, 0),  "via-3": sobreEje(195, 0),
  "via-4": sobreEje(265, 0), "via-5": sobreEje(330, 0),
  cruce: sobreEje(150, 64),
};
export const ARISTAS: [string, string][] = [ ["acceso","via-1"], ["via-1","via-2"], ... ];
```

`calcularRuta(desde, hasta)` implementa Dijkstra sobre una docena de nodos, con `Math.hypot` como distancia:

> Dijkstra sobre una docena de nodos: de sobra para este tamano y, a diferencia de una busqueda en anchura, respeta que los ramales miden distinto. Se calcula una vez por seleccion, nunca por frame.

`rutaAPath(camino)` convierte el resultado en el atributo `d` con `M` para el primer punto y `L` para el resto.

**Mecanismo: el dibujado del trazo**

```css
.mapa-ruta {
  stroke-dasharray: 1;
  animation: mapa-ruta-dibuja var(--duration-scene) var(--ease-out-expo) both;
}
@keyframes mapa-ruta-dibuja { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .mapa-ruta { animation: none; stroke-dashoffset: 0; }   /* aparece DIBUJADO, no ausente */
}
```

Mismo truco de `pathLength="1"` que la agenda. Y el reinicio de la animacion se logra con la `key`:

```tsx
{ruta && <path key={destino} className="mapa-ruta" d={rutaAPath(ruta)} pathLength="1" ... />}
```

> `key` con el destino a proposito: al cambiar de lugar el elemento se reemplaza y la animacion de dibujado vuelve a empezar. Sin eso, el trazo nuevo apareceria ya dibujado.

**Mecanismo: los puntos son botones de HTML, no formas del SVG**

Esta es la decision de accesibilidad mas importante de la seccion. El `<svg>` entero va `aria-hidden="true"`. Encima se posicionan `<button>` reales, ubicados en **porcentajes del viewBox**:

```tsx
<button type="button" aria-pressed={esActivo} onClick={() => irA(i)}
  className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
  style={{
    left: `${((p.posicion[0] - VIEW_BOX.x) / VIEW_BOX.ancho) * 100}%`,
    top:  `${((p.posicion[1] - VIEW_BOX.y) / VIEW_BOX.alto)  * 100}%`,
  }}>
  <span className="sr-only-focusable">{p.nombre}</span>
</button>
```

Asi se gana foco, rol, nombre accesible y recorrido de teclado sin reconstruir nada, y se puede dar area tactil de 36px (`size-9`) sin engordar el punto visible (12px). WCAG 2.5.8 pide 24px.

**Cota de ancho documentada**: los marcadores estan a 60 unidades de viewBox como minimo, asi que por debajo de ~227px de ancho dos areas tactiles se tocan. De ahi el `minmax(252px, 1fr)` de la grilla y el `max-w-72 sm:max-w-80` del plano. "La proporcion cede antes que la accesibilidad."

**Pintura del plano**

Todo se dibuja con lineas finas de lavanda a distintas opacidades. La jerarquia la da la opacidad del trazo, no el peso:

```ts
const PINTURA = {
  nave:     { fill: "color-mix(in oklab, var(--color-brand-violet-deep) 32%, var(--color-surface))",
              stroke: "var(--color-brand-lavender)", strokeOpacity: 0.5,  strokeWidth: 1.2 },
  stand:    { fill: "color-mix(in oklab, var(--color-brand-violet) 18%, var(--color-surface))",
              stroke: "var(--color-brand-lavender)", strokeOpacity: 0.4,  strokeWidth: 0.9 },
  servicio: { fill: "var(--color-surface)",
              stroke: "var(--color-brand-lavender)", strokeOpacity: 0.28, strokeWidth: 1 },
} as const;
```

**Los rellenos son opacos, y ese es el punto**: con rellenos translucidos las bandas de las calles se veian a traves de las naves y parecian pasar por encima. El color se premezcla con `color-mix` contra la superficie de la parcela.

Los espacios abiertos van en cian muy tenue **sin trazo**: lo construido tiene borde, lo abierto no. Se distinguen por hue y por presencia de linea, no por claridad.

Las calles son bandas al 7% de opacidad: "no se miran, pero se ven". Van primero para que todo lo construido se apoye encima. Todo dentro de un `<clipPath id="recorte-parcela">` para que las masas verdes no se derramen fuera del contorno.

El SVG lleva `shapeRendering="geometricPrecision"` (sin eso el navegador ajusta cada linea a la grilla de pixeles y unas salen mas gruesas que otras).

Y el degradado del recorrido va, otra vez, en `userSpaceOnUse`, por la misma razon de la caja degenerada.

**Pulso del acceso**

```css
.mapa-pulso { animation: mapa-pulso 2s var(--ease-out-expo) infinite; }
@keyframes mapa-pulso {
  from { scale: 1;   opacity: 0.6; }
  to   { scale: 3.4; opacity: 0; }
}
```

Se monta solo cuando el lugar activo **es** el acceso, y montarse es lo que dispara la animacion otra vez. No hace falta temporizador.

**Nota WCAG 2.2.2 declarada**: late en bucle sin control de pausa. Es una decision tomada y anotada en `03-pendientes.md`: el criterio exceptua el movimiento esencial para la actividad, y este lo es (marca de donde nace el recorrido). Va `aria-hidden`, no compite con texto, y con `prefers-reduced-motion` no late. Salida barata si un jurado lo objeta: limitarlo a dos ciclos (4s, por debajo del umbral de 5s).

**El riel**

Usa `useCarruselCircular(PUNTOS)` (ver 6.6). Detalles propios:

- `<div className="mapa-riel h-full min-w-0">` con `mask-image: linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)`.
- `min-w-0` en la cadena: un item de grid trae `min-width: auto` y se niega a achicarse por debajo de su contenido; el `<ul>` lleva 27 tarjetas en fila y estiraba la celda.
- Solo la tarjeta activa participa del foco: `inert={!activa}` mas `aria-hidden`. Sin eso Tab se meteria en las copias fuera de vista.
- Anuncio por `aria-live="polite"` en un parrafo `sr-only-focusable`.
- Las flechas van **encima** del asomo (`absolute top-1/2`), con fondo propio y `backdrop-blur-sm`, porque se apoyan sobre la imagen.

**Un solo estado para dos controles**: el plano y el riel no se sincronizan entre si, los dos leen la misma posicion. No hay un "seleccionado" aparte que pueda quedar desfasado.

**Shape de datos**

```ts
export type Punto = {
  id: string;
  nombre: string;      // PROVISORIO, presupuesto ~22 caracteres
  detalle: string;     // PROVISORIO, presupuesto ~50 caracteres
  categoria: "acceso" | "expositores" | "gastronomia" | "servicios" | "escenario";
  posicion: [number, number];
  paleta: 0 | 1 | 2 | 3;
};
type Edificio = { id: string; centro: [number,number]; ancho: number; alto: number;
                  tipo: "nave" | "stand" | "servicio" };

export const VIEW_BOX  = { x, y, ancho, alto };
export const PARCELA: [number,number][];
export const CALLES: { id, nombre, a, b }[];
export const CALLES_TRAZADO: [number,number][][];
export const VERDES: [number,number][][];
export const ROTONDA = { centro, r };
export const ARENA = { centro, rx, ry };
export const EDIFICIOS: Edificio[];
export const PUNTOS: Punto[];        // 9 items
export const NODOS: Record<string, [number,number]>;
export const ARISTAS: [string,string][];
```

**Dependencias externas**: `lucide-react` (`ArrowLeft`, `ArrowRight`), `useCarruselCircular`, `Reveal`, `PlaceholderVisual`, `cn`. **Cero dependencias de mapas** (no hay Leaflet, ni Mapbox, ni nada).

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | Ningun API de Next. |
| Tailwind | **Media** | Grilla `lg:grid-cols-[minmax(252px,1fr)_minmax(0,3fr)]` y varias utilidades. Portable pero hay que reescribirlo. |
| Lenis | **Nula** | El mapa no usa Lenis. |
| React | **Media-alta** | El estado del riel (`useCarruselCircular`) es React. En Astro habria que hacerlo isla, o reescribir el ciclo en vanilla. El plano en si es SVG estatico y se puede pre-renderizar. |

**Nota clave**: `plano.ts` es **100% puro** (funciones y datos, cero React, cero DOM). Se puede llevar tal cual a cualquier stack, incluso a un script de generacion que emita el SVG en build. Es la parte mas valiosa y mas reutilizable.

**Advertencia para la fusion**: los nueve puntos, sus nombres y descripciones son provisorios, pero **la disposicion no**: sale de la traza de OSM. Si el otro repo tiene un mapa con datos reales, hay que decidir cual geometria manda.

---

### 6.5 Entradas

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/features/tickets/components/tickets-section.tsx` | 435 |
| `src/features/tickets/constants/entradas.ts` | 105 |
| `src/app/globals.css`, bloques "ENTRADAS" y "FORMULARIO DE PAGO" | ~140 lineas |
| `src/shared/components/ui/boton-pausa.tsx` | 87 (compartido) |

**Composicion**: mitad pildoras de tipo de entrada, mitad collage de tres visuales inclinados; abajo, el riel infinito de medios de pago; y un `<dialog>` nativo de pago ilustrativo.

**Mecanismo 1: las pildoras son pestanas WAI-ARIA de verdad**

```tsx
<div role="tablist" aria-label="Tipo de entrada" aria-orientation="horizontal"
     onKeyDown={alTeclear} className="flex flex-wrap gap-2">
  <button role="tab" id={idPildora(t.id)} aria-selected={esActivo}
          aria-controls={idPanel(t.id)}
          tabIndex={esActivo ? 0 : -1}     // TABINDEX ROTANTE
          onClick={() => setActivo(t.id)}>
```

Navegacion por teclado completa:

```ts
const destino =
  e.key === "ArrowRight" ? (i + 1) % total
  : e.key === "ArrowLeft" ? (i - 1 + total) % total
  : e.key === "Home" ? 0
  : e.key === "End" ? total - 1
  : -1;
if (destino === -1) return;
e.preventDefault();
setActivo(siguiente.id);
refsPildoras.current[siguiente.id]?.focus();   // el foco viaja con la seleccion
```

El tabindex rotante hace que **la lista entera sea una sola parada del tabulador**, no tres.

**Mecanismo 2: mejora progresiva de los paneles**

Los tres paneles se sirven **visibles**. El estado oculto vive en CSS detras de `.js`:

```css
.js .entradas-panel:not([data-activo]) { display: none; }
.js .entradas-panel__nombre { display: none; }
```

Sin JavaScript la seccion es una lista de tres tarjetas de precio, una abajo de la otra, y se lee perfecto. Con el atributo `hidden` un fallo del script dejaria dos de los tres precios inalcanzables.

El `entradas-panel__nombre` es el mismo mecanismo usado **al reves**: no para ocultar contenido sino para sacar una redundancia (sin JS hace falta saber de cual tarjeta habla; con JS la pildora activa ya lo dice).

**ADVERTENCIA CRITICA PARA PORTAR**: el panel no puede llevar una utilidad de display.

> Esta regla vive en @layer components y las utilidades de Tailwind en @layer utilities, que va despues: un `grid` o un `block` sobre `.entradas-panel` le ganaria por capa, no por especificidad, y el panel no se ocultaria nunca. El layout va en el hijo.

Verificado en produccion: los altos pasan de `[397, 0, 0]` a `[440, 440, 440]` al sacar la clase `.js`.

**Mecanismo 3: el riel de medios de pago**

```css
.medios {
  --medios-hueco: 0.75rem;
  --medios-dur: 40s;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
}
.medios__riel {
  display: flex;
  width: max-content;     /* sin esto el riel se achica y el -50% deja de significar media lista */
  animation: medios-corre var(--medios-dur) linear infinite;
  will-change: translate;
}
.medios__item { margin-right: var(--medios-hueco); flex: none; }   /* SIN gap a proposito */
@keyframes medios-corre { from { translate: 0 0; } to { translate: -50% 0; } }
```

**Por que `margin-right` y no `gap`** (la trampa mas repetida del repo): con la lista duplicada, 2N items dejan 2N-1 huecos, asi que `translate: -50%` se queda **medio hueco corto** y el bucle pega un tiron en cada vuelta. Con el margen, cada item mide siempre item mas hueco y la media vuelta cae en un multiplo entero. Verificado: error de 0px aunque los once items tengan once anchos distintos.

La copia del bucle va `aria-hidden`: los medios de pago son once, no veintidos.

**Pausa (WCAG 2.2.2)**:

```css
.medios[data-pausado] .medios__riel,
.medios:focus-within .medios__riel { animation-play-state: paused; }

@media (hover: hover) and (pointer: fine) {
  .medios:hover .medios__riel { animation-play-state: paused; }
}
```

La guarda de `hover: hover` no es opcional: **el hover tactil es pegajoso**, se queda activo despues de soltar y deja el riel clavado.

Y la regla estructural: **el CSS es el unico dueno del estado de reproduccion**. Nadie llama a `pause()` por API, porque `Animation.pause()` le quita a CSS la autoridad sobre esa animacion de forma permanente.

**Degradacion por movimiento reducido**: el riel se **despliega**, no se congela.

```css
@media (prefers-reduced-motion: reduce) {
  .medios { overflow: visible; mask-image: none; }
  .medios__riel { width: auto; flex-wrap: wrap; animation: none; }
  .medios__item[aria-hidden="true"] { display: none; }
}
```

Medido: pasa de 56 a 112px de alto y los once medios quedan a la vista. La regla general del proyecto: "quitar el movimiento nunca debe quitar el contenido".

**Mecanismo 4: el modal de pago**

Es un `<dialog>` **nativo** abierto con `showModal()`. El navegador resuelve foco al abrir, devolucion del foco al cerrar, inertizacion del resto de la pagina, Escape y `::backdrop`.

Lo unico que hay que hacer a mano es **frenar a Lenis**:

```ts
const lenis = useLenis();
useEffect(() => {
  const dialogo = ref.current; if (!dialogo) return;
  if (tipo && !dialogo.open) { dialogo.showModal(); lenis?.stop(); }
  else if (!tipo && dialogo.open) { dialogo.close(); }
}, [tipo, lenis]);

useEffect(() => {
  const alCerrar = () => { lenis?.start(); onCerrar(); };
  dialogo.addEventListener("close", alCerrar);
  return () => dialogo.removeEventListener("close", alCerrar);
}, [lenis, onCerrar]);
```

> El scroll suave escucha `wheel` sobre `window`, y la capa superior del dialogo no le impide recibir el evento: sin `lenis.stop()` la pagina de atras se desplaza debajo del modal.

El evento `close` cubre los tres caminos (boton, Escape, click en el fondo), asi que reanudar se escribe una sola vez. El click en el fondo se detecta comparando `e.target === ref.current` (al hacer click en el fondo el objetivo es el propio `<dialog>`; el contenido esta en el hijo).

CSS del dialogo, con reset del agente de usuario y transicion de entrada/salida moderna:

```css
.dialogo-pago {
  margin: auto;
  max-width: min(32rem, calc(100vw - 2.5rem));
  padding: 0;
  border: 1px solid var(--color-border-strong);
  background-color: var(--color-surface-raised);
  opacity: 0; scale: 0.98;
  transition:
    opacity var(--duration-control) var(--ease-standard),
    scale var(--duration-control) var(--ease-standard),
    overlay var(--duration-control) allow-discrete,
    display var(--duration-control) allow-discrete;
}
.dialogo-pago[open] { opacity: 1; scale: 1; }
@starting-style { .dialogo-pago[open] { opacity: 0; scale: 0.98; } }
.dialogo-pago::backdrop { background-color: rgb(4 3 7 / 0.8); }
```

`overlay` y `display` con `allow-discrete` son lo que permite animar un elemento que pasa de `display: none` a visible. **El valor de reposo es visible**: si el navegador no soporta `@starting-style`, el dialogo abre igual sin animacion.

**No simula un checkout**: muestra tres metodos genericos sin marcas, un estado vacio con la "J" en monocromia sobre borde punteado, y el texto "Ejemplo ilustrativo: el prototipo no tiene pasarela de pago conectada". El boton "Cerrar" lleva `autoFocus`.

**Mecanismo 5: el collage**

Tres visuales absolutos inclinados con `-rotate-6`, `rotate-3`, `-rotate-2` y proporciones distintas (`3/4`, `4/5`, `4/3`). La rotacion es estatica. Se esconde en pantallas chicas (`hidden lg:block`) porque es decorativo y media pantalla de patron entre las pildoras y el precio solo aleja del unico dato que la seccion tiene para dar. La proporcion va como `style={{ aspectRatio: ratio }}` y no como clase "para no depender de que Tailwind genere una utilidad arbitraria por cada valor".

**Shape de datos**

```ts
export type TipoEntrada = {
  id: string;
  nombre: string;      // corto: las tres tienen que entrar en una fila
  precio: string;      // PROVISORIO, string ya formateado ("$ 4.000")
  para: string;        // una linea
  incluye: string[];   // tres lineas, ~44 caracteres cada una
};
export const TIPOS_ENTRADA: TipoEntrada[];   // 3 items, ordenados por precio creciente
export const MEDIOS_PAGO: string[];          // 11 strings, PROVISORIO
export const METODOS_EJEMPLO: string[];      // 3 strings genericos, sin marcas
```

Nota de diseno documentada: **son tres tipos y no otro numero**. Con tres, las pildoras entran en una sola fila hasta en un telefono de 390px (339px de pildoras contra 350 de contenido), asi que la fila se lee como un selector y no como una grilla de opciones.

Aviso visible en la interfaz, no solo en comentarios: "Precio de referencia, sujeto a confirmacion de la organizacion". El razonamiento: un precio de maqueta sin advertencia es el unico dato del sitio que alguien podria anotar y presupuestar.

**Dependencias externas**: `lenis/react` (para `lenis.stop()`/`start()`), `lucide-react` (`Check`), `BrandMark`, `BotonPausa`, `PlaceholderVisual`, `Reveal`, `cn`.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | Ningun API de Next. |
| Tailwind | **Media** | El riel y el dialogo son CSS plano. Las pildoras y el panel son utilidades comunes. La advertencia de capas hay que trasladarla al orden de capas del nuevo proyecto. |
| Lenis | **Media** | Solo el `stop()`/`start()` del modal. Sin Lenis se reemplaza por bloquear el scroll del body, o se elimina. |
| React | **Media** | Las pestanas son 40 lineas de estado. En Astro: isla o vanilla con `data-*`. |

El riel de medios de pago es CSS puro salvo el atributo `data-pausado`, que en vanilla es un `addEventListener("click")` de tres lineas. Muy portable.

---

### 6.6 Slider / carrusel circular (Noticias)

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/shared/hooks/use-carrusel-circular.ts` | 108 |
| `src/features/news/components/news-section.tsx` | 209 |
| `src/features/news/constants/noticias.ts` | 89 |
| `src/app/globals.css`, bloque "RIEL DE NOTICIAS" | ~10 lineas |

**El hook**

```ts
type Opciones = {
  anchoTarjeta?: number;   // % del ancho visible que ocupa una tarjeta. Default 80
  separacionRem?: number;  // separacion entre tarjetas en rem. Default 1
  repeticiones?: number;   // cuantas veces se monta la lista. Default 3 (minimo que cicla)
};

export function useCarruselCircular<T>(items: T[], opciones: Opciones = {})
```

**Como se logra el ciclo sin saltos**: el riel monta la lista **tres veces** y trabaja siempre sobre la copia del medio. La posicion es un contador que puede salirse del rango: desde la ultima, "siguiente" lleva a la posicion N, que en el riel cae sobre la primera tarjeta de la tercera copia. El desplazamiento sigue siendo hacia adelante y se ve natural. Cuando esa transicion termina, la posicion se normaliza y el riel se recoloca sobre la copia del medio. **Ese reacomodo es invisible porque muestra exactamente la misma tarjeta en el mismo lugar de la pantalla.**

**El reacomodo no usa temporizadores** (y esto es lo mas fino del hook):

```ts
const [posicion, setPosicion] = useState(0);
const [reacomodando, setReacomodando] = useState(false);

const activo = ((posicion % total) + total) % total;

const mover = (destino: number) => {
  setReacomodando(false);   // reactivar la transicion Y mover, en la MISMA actualizacion:
  setPosicion(destino);     // React las agrupa en un solo render, asi que sale animado
};

const alTerminarTransicion = (e: TransitionEvent) => {
  if (e.target !== e.currentTarget || e.propertyName !== "translate") return;
  if (posicion >= 0 && posicion < total) return;
  setReacomodando(true);
  setPosicion(activo);
};
```

Mientras el reacomodo esta pendiente la transicion queda desactivada; se reactiva recien en el siguiente movimiento que pida el usuario, dentro de la misma actualizacion de estado. Asi no hace falta ningun `requestAnimationFrame` ni `setTimeout` para "esperar un frame", que es donde este patron suele volverse fragil.

El filtro `e.propertyName !== "translate"` es necesario porque las opacidades de las tarjetas tambien burbujean hasta el riel.

**Salto por el lado mas corto del anillo**:

```ts
const irA = (indice: number) => {
  const adelante = (indice - activo + total) % total;
  mover(posicion + (adelante <= total / 2 ? adelante : adelante - total));
};
```

De la novena tarjeta a la primera se avanza uno hacia adelante, no ocho hacia atras.

**Red de seguridad**:

```ts
const posibleEnRiel = posicion + total;
const enRiel = posibleEnRiel >= 0 && posibleEnRiel < total * repeticiones
  ? posibleEnRiel
  : activo + total;
```

> La normalizacion depende de que llegue `transitionend`, y hay casos en los que no llega: clics muy rapidos que interrumpen la transicion anterior, o una pestana en segundo plano, donde el navegador directamente no ejecuta transiciones. Ante la duda se cae a la copia del medio, que siempre existe.

**El desplazamiento**:

```ts
const desplazamiento = `calc(10% - ${enRiel * anchoTarjeta}% - ${enRiel * separacionRem}rem)`;
const repetidos = Array.from({ length: repeticiones }, () => items).flat();
```

El `10%` inicial es el asomo (la tarjeta ocupa 80%, quedan 20% repartidos en dos costados). **Si el ancho de la tarjeta cambia en el marcado (`w-4/5`) y no aca, todo el riel se descentra.** Esta advertido en un comentario.

**Retorno del hook**: `{ activo, enRiel, repetidos, reacomodando, desplazamiento, posicion, total, mover, irA, alTerminarTransicion }`.

**Consumo en Noticias**

```tsx
<div className="noticias-riel mx-auto max-w-5xl min-w-0 px-5 sm:px-10">
  <ul role="list"
      className={cn("flex gap-4",
        reacomodando ? "transition-none" : "transition-[translate] duration-scene ease-in-out-quint")}
      style={{ translate: desplazamiento }}
      onTransitionEnd={alTerminarTransicion}>
    {repetidos.map((n, i) => (
      <li key={`${n.id}-${i}`} className="flex w-4/5 shrink-0">
        <Tarjeta noticia={n} activa={i === enRiel} sinTransicion={reacomodando} />
      </li>
    ))}
  </ul>
</div>
```

```css
.noticias-riel {
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%);
}
```

Se anima `translate` (propiedad independiente) y **no** `transform`, para no pisar transformaciones de las utilidades. Gotcha documentado: `getComputedStyle(el).transform` NO refleja la propiedad `translate`, asi que al depurar hay que leer `translate`.

**La tarjeta de Noticias** (lo que se va a reemplazar por el diseno del otro repo):

- Proporcion variable segun ancho: `aspect-[4/5] sm:aspect-[4/3] lg:aspect-[16/9]`. Motivo: la tarjeta ocupa siempre el 80% del riel, que en escritorio son ~755px, y con 3/4 se iba a mas de 1000px de alto.
- `PlaceholderVisual` a sangre mas velo `bg-gradient-to-b from-surface-sunken/0 from-25% via-surface-sunken/90 via-65% to-surface-sunken/98`.
- Contenido en `mt-auto p-6`: tema (uppercase, tracking, cian), titulo (`recorte-2`), copete (`recorte-2`), fecha en `<time dateTime>`.
- Las que asoman quedan atenuadas: `activa ? "opacity-100" : "opacity-30"`.
- `inert={!activa}` mas `aria-hidden` en las inactivas.

**Controles**:

- Puntos: el punto visible mide 8px pero el **boton** mide 24x24 (`h-6 px-2`), que es el minimo de WCAG 2.5.8. El activo se estira a `w-8` con `transition-all duration-control`.
- Flechas circulares `size-11` con `aria-label`.
- Anuncio `aria-live="polite"`: "Noticia N de M: titulo".

**Shape de datos**

```ts
export type Noticia = {
  id: string;
  titulo: string;         // PROVISORIO, presupuesto ~46 caracteres (2 lineas de ~29 en movil)
  copete: string;         // PROVISORIO, presupuesto ~62 caracteres
  fecha: string;          // ISO "2026-08-04"
  tema: string;           // seccion del sitio a la que pertenece
  paleta: 0 | 1 | 2 | 3;
};
export const NOTICIAS: Noticia[];   // 6 items

export function fechaLarga(iso: string) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`));
}
```

`timeZone: "UTC"` explicito: sin eso, una fecha ISO sin hora se interpreta en la zona local y en Argentina (UTC-3) mostraria el dia anterior.

**Dependencias externas**: `lucide-react` (dos flechas), `Reveal`, `PlaceholderVisual`, `cn`. El hook en si **no tiene ninguna dependencia externa**: solo `useState` y el tipo `TransitionEvent`.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | - |
| Tailwind | **Baja** | El riel es una mascara CSS mas `flex gap-4`. Lo unico Tailwind-dependiente es `w-4/5`, que tiene que valer 80% para coincidir con `anchoTarjeta`. |
| Lenis | **Nula** | - |
| React | **Alta** | El hook depende del batching de `setState` para que `mover()` salga animado. Reescribirlo en vanilla es posible pero hay que replicar a mano el "reactivar transicion y mover en el mismo frame": en vanilla eso es quitar la clase `transition-none`, forzar un reflow (`void el.offsetWidth`) y despues escribir el `translate`. Es exactamente el `requestAnimationFrame` que el hook evita. |

**Recomendacion para la fusion**: el hook es la pieza reutilizable; la tarjeta se descarta y se reemplaza por el diseno del otro repo. Solo hay que respetar tres contratos:

1. El ancho del `<li>` tiene que coincidir con `anchoTarjeta` (80% por defecto).
2. El `gap` tiene que coincidir con `separacionRem` (1rem por defecto).
3. El contenedor del riel tiene que llevar `min-w-0` para que un item de grid/flex no se estire.

**Ojo con la deuda**: `src/features/about/components/about-section.tsx` (324 lineas) **tiene su propia copia del mismo ciclo** y no se migro al hook. Al fusionar hay que migrarla o descartarla.

---

### 6.7 Animacion de Sponsors

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/features/sponsors/components/sponsors-section.tsx` | 118 |
| `src/features/sponsors/hooks/use-ficha-en-vista.ts` | 72 |
| `src/features/sponsors/constants/sponsors.ts` | 56 |
| `src/app/globals.css`, bloque "GRILLA DE SPONSORS" | ~110 lineas |
| `src/shared/components/brand/brand-mark.tsx` | 58 (prop `monocromo`) |

**Concepto**: dieciseis fichas en grilla 4x4 y un marcador de cuatro esquinas en "L" que **viaja** de una ficha a otra.

**Mecanismo central: el marcador no se mide, se calcula**

Es **un solo elemento** fuera de flujo, del tamano exacto de una celda, que se mueve con `translate`. Como las dieciseis celdas son identicas, nunca tiene que cambiar de tamano.

Su posicion sale de **dos numeros**: `--sponsors-i` (el indice activo, que escribe el componente) y `--sponsors-cols` (que declara el CSS en cada breakpoint). La columna es el resto y la fila el cociente entero, los dos resueltos **por CSS**:

```css
.sponsors__marcador {
  position: absolute; top: 0; left: 0;
  width: calc((100% - (var(--sponsors-cols) - 1) * var(--sponsors-hueco)) / var(--sponsors-cols));
  aspect-ratio: var(--sponsors-ratio);
  translate:
    calc(mod(var(--sponsors-i), var(--sponsors-cols)) * (100% + var(--sponsors-hueco)))
    calc(round(down, var(--sponsors-i) / var(--sponsors-cols), 1) * (100% + var(--sponsors-hueco)));
  transition: translate var(--duration-control) var(--ease-standard);
  pointer-events: none;
}
```

**La consecuencia de fondo: no hay una sola medicion en JavaScript.** Ni `getBoundingClientRect`, ni `ResizeObserver`, ni listener de resize. El marcador queda alineado en cualquier viewport por construccion, y cuando el breakpoint cambia la cantidad de columnas, la posicion se reacomoda sola.

**Por que los porcentajes funcionan**: en `translate`, un porcentaje se resuelve contra la caja del **propio** elemento (el primero contra su ancho y el segundo contra su alto). Y el marcador mide exactamente una celda. Entonces `100% + hueco` es el paso de la grilla en los dos ejes a la vez, sin que ninguno de los dos valores tenga que escribirse en ningun lado.

Verificado en produccion: cero desalineados en las 16 fichas a 402, 767, 768, 1440 y 1920px.

Usa dos funciones CSS modernas: `mod()` y `round(down, x, 1)`. **Requieren navegadores relativamente recientes** (Chrome 125+, Firefox 118+, Safari 15.4+). Es el unico punto del repo con requisito de baseline alto.

**Las cuatro "L"**:

```css
.sponsors__marcador > span {
  position: absolute; width: 1rem; height: 1rem;
  border: 2px solid var(--color-primary);
}
.sponsors__marcador > span:nth-child(1) { top: -3px; left: -3px;  border-right-width: 0; border-bottom-width: 0; }
.sponsors__marcador > span:nth-child(2) { top: -3px; right: -3px; border-bottom-width: 0; border-left-width: 0; }
.sponsors__marcador > span:nth-child(3) { bottom: -3px; left: -3px;  border-top-width: 0; border-right-width: 0; }
.sponsors__marcador > span:nth-child(4) { bottom: -3px; right: -3px; border-top-width: 0; border-left-width: 0; }
```

Esquinas vivas (radio 0) y desbordan tres pixeles hacia afuera para que se lean como un corchete que encierra la ficha y no como un borde pegado.

**Breakpoints de la grilla**:

```css
.sponsors {
  --sponsors-cols: 2;          /* MOVIL: 2 columnas, 8 filas */
  --sponsors-hueco: 0.75rem;
  --sponsors-ratio: 2 / 1;     /* rectangulo acostado, mas chato que en escritorio */
  position: relative; display: grid;
  grid-template-columns: repeat(var(--sponsors-cols), minmax(0, 1fr));
  gap: var(--sponsors-hueco);
}
@media (width >= 48rem) {
  .sponsors { --sponsors-cols: 4; --sponsors-hueco: 1rem; --sponsors-ratio: 16 / 9; }
}
```

Una sola columna se probo y se descarto **por una razon medible**: con una columna el ancho de la ficha es el de la grilla entera y su alto sale del ratio, asi que la seccion se estira (2420px a 402px de ancho, 4848px a 767px, casi seis pantallas de puros logos).

**Mecanismo: quien elige la ficha activa**

```tsx
const [conPuntero, setConPuntero] = useState<number | null>(null);
const { indice: enVista, registrar } = useFichaEnVista(SPONSORS.length);
const activo = conPuntero ?? enVista;
```

Reglas declaradas:

- El marcador senala la **ultima ficha activa** y se queda ahi.
- El puntero es quien la activa; mientras nadie la haya activado con el puntero, la activa el scroll. En un telefono eso es siempre el scroll.
- **Sacar el mouse no desactiva nada**, y por eso no hay `onPointerLeave`. "Apuntar una ficha es una accion, dejar de apuntarla no es otra."
- El puntero se filtra por tipo:

```tsx
onPointerEnter={(e) => { if (e.pointerType === "mouse") setConPuntero(i); }}
```

> Un dedo tambien dispara `pointerenter`, y el proyecto ya se quemo con el hover tactil: es pegajoso, se queda activo despues de soltar. Filtrando por tipo de puntero, el tactil ni entra en ese camino en vez de tener que salir de el.

**`useFichaEnVista`**

```ts
const observador = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    const i = Number((entrada.target as HTMLElement).dataset.indice);
    if (entrada.isIntersecting) visibles.add(i); else visibles.delete(i);
  }
  if (visibles.size === 0) return;
  const menor = Math.min(...visibles);
  setIndice((actual) => (actual === menor ? actual : menor));
}, { rootMargin: "-45% 0px -55% 0px", threshold: 0 });
```

Tres decisiones explicadas:

1. **Aca si sirve `isIntersecting`.** En la agenda la pregunta era "ya lo pase?" (y `isIntersecting` no sirve). Aca la pregunta es "esta dentro de la franja?", que es exactamente lo que contesta bien. Mismo `rootMargin` que `useActiveSection`.
2. **Se guarda un conjunto, no el ultimo que entro.** El observer solo informa los elementos que **cambiaron**, no todos los que estan intersectando. La franja la cruza una fila entera a la vez, asi que quedarse con la ultima entrada elegiria una columna al azar segun el orden en que el navegador reporte. Con el conjunto de visibles y su minimo, la regla es determinista: manda la primera ficha en orden del documento.
3. **Si la grilla sale de la franja el indice se queda donde estaba.** El marcador no vuelve al principio porque la seccion salio de pantalla.

Ref callback:

```ts
const registrar = (i: number) => (el: HTMLElement | null) => { fichas.current[i] = el; };
```

> El bloque no devuelve nada a proposito: en React 19 lo que devuelve un ref callback se interpreta como su limpieza.

**Marcado**

```tsx
<ul role="list" className="sponsors mt-12" style={{ "--sponsors-i": String(activo) } as CSSProperties}>
  <li className="sponsors__marcador" aria-hidden="true"><span/><span/><span/><span/></li>
  {SPONSORS.map((s, i) => (
    <li key={s.id} ref={registrar(i)} data-indice={i}
        data-activa={i === activo ? "" : undefined}
        className="sponsors__ficha"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setConPuntero(i); }}>
      <BrandMark title={s.nombre} monocromo className="h-1/2 w-auto" />
    </li>
  ))}
</ul>
```

El marcador es un `<li>` porque un `<ul>` solo admite `<li>`. No rompe la lista: esta fuera de flujo (`position: absolute`, ni siquiera es item de la grilla) y `aria-hidden` lo saca del arbol de accesibilidad.

**Nada esta escondido detras del hover.** Las fichas no son interactivas (no hay URLs de auspiciantes) y el marcador es puro enfasis. Por eso tampoco entran en el recorrido del teclado: "un elemento enfocable que no hace nada es peor que uno que no lo es".

**La ficha**:

```css
.sponsors__ficha {
  display: grid; place-items: center;
  aspect-ratio: var(--sponsors-ratio);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-raised);
  color: var(--color-border-strong);   /* la "J" hereda por currentColor */
  transition: color var(--duration-control) var(--ease-standard),
              background-color var(--duration-control) var(--ease-standard);
}
.sponsors__ficha[data-activa] {
  color: var(--color-link);
  background-color: var(--color-surface-overlay);
}
```

Contraste medido: esquinas violeta 3,20:1 sobre la ficha activa (pasa WCAG 1.4.11) y la "J" activa 6,38:1.

**La prop `monocromo` de `BrandMark`** existe justamente para esto:

```tsx
fill={monocromo ? "currentColor" : p.fill}
```

> En policromia, las dieciseis fichas serian dieciseis logotipos de ExpoJuy y la seccion diria que ExpoJuy se auspicia a si misma.

**Movimiento reducido**: el marcador **salta** en vez de viajar (`transition: none`). Sigue marcando.

**Shape de datos**

```ts
export type Sponsor = { id: string; nombre: string };   // PROVISORIO, nombres de fantasia
export const SPONSORS: Sponsor[];   // exactamente 16
```

Reglas de contenido documentadas: son 16 y no otro numero (la grilla es 4x4 y una celda vacia en una grilla completa se lee como error de carga). Ningun nombre se repite con los doce expositores. No figura la Camara de Comercio Exterior porque es la organizadora, no auspiciante. **Un auspiciante inventado afirma un vinculo comercial que nadie confirmo**, por eso los nombres son composiciones de un toponimo jujeno y un rubro.

**Dependencias externas**: ninguna fuera del repo. `BrandMark` y `Reveal` de shared.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | - |
| Tailwind | **Nula** | Toda la grilla y el marcador son CSS plano en `@layer components`. La unica clase Tailwind es `mt-12`. |
| Lenis | **Nula** | Usa IntersectionObserver, no scroll. |
| React | **Baja** | El estado es un numero. En vanilla: `el.style.setProperty("--sponsors-i", i)` mas dos listeners. Se porta en 30 lineas. |
| Navegador | **Media** | Depende de `mod()` y `round(down, ...)` de CSS. Fallback posible: calcular fila y columna en JS y escribir dos variables mas. |

**Veredicto**: junto con el loader, la pieza mas portable. Es practicamente CSS puro.

---

### 6.8 Efecto del Footer

**Archivos exactos**

| Archivo | Lineas |
| --- | --- |
| `src/shared/components/layout/site-footer.tsx` | 143 |
| `src/app/globals.css`, bloque "FOOTER REVELADO" | ~80 lineas (mayoria comentario) |
| `src/app/page.tsx` | el `<main className="relative z-[1] bg-surface-sunken">` |

**Como funciona**

El footer queda `sticky` contra el **borde inferior** del viewport durante toda la pagina. Ahi no se ve, porque `<main>` lleva fondo opaco y va en `relative z-[1]`, asi que le pasa por encima. Al llegar al final del documento el borde inferior de `main` sube y lo va destapando: la ultima seccion se corre como una carta que se levanta y abajo estaba el footer.

El footer sigue ocupando su lugar en el flujo, asi que **no hace falta reservarle altura ni conocerla**: el recorrido del efecto es exactamente su propio alto, a cualquier viewport. Cero JavaScript y cero numeros magicos.

```css
@layer components {
  .footer-revelado { position: static; }

  /* Apilado (menos de lg): peor caso medido 762px. */
  @media (min-height: 50rem) {
    .footer-revelado { position: sticky; bottom: 0; }
  }

  /* En fila (lg o mas): peor caso medido 604px. */
  @media (min-width: 64rem) and (min-height: 42rem) {
    .footer-revelado { position: sticky; bottom: 0; }
  }
}
```

**Tres acoplamientos que no se pueden romper** (documentados en el componente):

1. **`<main>` DEBE tener fondo opaco Y `relative z-[1]`.** El fondo es lo unico que tapa al footer; el z-index es lo que pone a main por encima.
2. **Ningun ancestro puede llevar `overflow` distinto de `visible`.** Un `overflow: hidden` en `html` o `body` desactiva `position: sticky` sin decir nada.
3. **El footer tiene que entrar en una pantalla.** `bottom: 0` lo ancla por abajo; si es mas alto que el viewport, su tope queda arriba del borde superior y no hay forma de llegar.

**El bug que define el diseno actual** (y que hay que no repetir al portarlo):

> La primera version usaba `z-index: -10` en el footer y se veia identica, pero SUS ENLACES NO RECIBIAN CLICKS: un elemento con z-index negativo se pinta en el paso 3 del algoritmo de apilado y la caja del `<body>` en el paso 4, o sea DESPUES. El body no tapa nada visualmente porque su fondo se propaga al canvas, pero su caja sigue existiendo para el hit-test y le gana. Medido: `elementFromPoint` sobre el centro de un enlace del footer devolvia BODY. En movil no pasaba, porque ahi la posicion esta apagada.

**La solucion invierte quien se mueve: para tapar algo, SUBIR al de arriba, no hundir al de abajo.**

**Por que las reglas viven en CSS y no como utilidades**:

> Porque la posicion tiene que poder APAGARSE, y con `sticky bottom-0` puestas como clases de Tailwind no se puede: viven en @layer utilities, que va DESPUES de @layer components, asi que le ganan a cualquier regla nuestra por mas especifica que sea. La capa manda, no la especificidad.

**De donde salen los dos umbrales**: del alto real del footer medido en el navegador, que **no crece de forma monotona** con el ancho:

| Ancho | Alto del footer |
| --- | --- |
| 373px | 761px |
| 402px | 762px |
| 768px | 761px (861px en una version previa del relleno) |
| 1024px | 604px |
| 1440px | 597px |

Por debajo de `lg` el contenido va apilado y ronda los 760px; de `lg` para arriba la fila se arma en horizontal y baja a ~600. De ahi los dos umbrales, cada uno con margen sobre su peor caso. **Si el footer crece, hay que volver a medir y mover esos umbrales.** Si el viewport no da, el footer queda estatico: se pierde el efecto, no el contenido.

Leccion generalizable anotada: **el peor caso de una medida responsive no esta siempre en el extremo**, esta en la franja del medio (entre `sm` y `lg` el relleno ya crecio pero el contenido sigue apilado).

Verificado a 1440x900, 820x1180, 402x870 (efecto activo) y 390x722 (efecto apagado, tope del footer alcanzable), mas un barrido de 25 posiciones confirmando que no asoma antes de tiempo.

**Contenido del footer**

```
<footer className="footer-revelado border-t border-border bg-surface-overlay">
  <div className="mx-auto max-w-[var(--container-wide)] px-5 py-10 sm:px-10 lg:py-20">
    <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
      [ BrandMark h-12 con title, claim, fechas + sede, "Organiza {organizer}" ]
      <div className="grid grid-cols-2 gap-8 sm:gap-10">
        [ nav "Secciones" -> NAV_SECTIONS ]
        [ nav "Redes" -> SOCIAL_LINKS, target=_blank rel="noopener noreferrer" ]
      </div>
    </div>
    [ copyright con new Date().getFullYear() ]
  </div>
</footer>
```

Detalles de accesibilidad:

- Cada `<nav>` lleva `aria-labelledby` apuntando a un `<h2>` propio.
- Los enlaces externos llevan un `<span className="sr-only">` con "(se abre en una pestana nueva)".
- `rel="noopener noreferrer"` explicado en comentario.
- **Dos columnas SIEMPRE**, tambien en el telefono: apiladas, las nueve secciones mas las cuatro redes son trece renglones y el footer se iba a 1061px contra 870 de viewport.
- El relleno se suelta recien en `lg`, no en `sm`, porque entre 640 y 1023px el relleno ya habia crecido pero el contenido seguia apilado.

**Dependencias externas**: ninguna. `BrandMark` y las constantes.

**Portabilidad**

| Atadura | Grado | Que haria falta |
| --- | --- | --- |
| Next.js | **Nula** | Es un Server Component sin ningun API de Next. |
| Tailwind | **Baja** | El efecto es CSS plano; solo el layout interno usa utilidades. |
| React | **Nula** | Es marcado estatico. Se porta a Astro, Vue o HTML plano tal cual. |
| Navegador | **Nula** | `position: sticky` con `bottom: 0`. Universal. |

**Es la pieza mas portable de todas: cero JavaScript.** Lo unico que hay que llevar junto con el footer es el `relative z-[1] bg-...` del `<main>` y los dos umbrales de altura, y hay que **volver a medir los umbrales** si el footer de la web final tiene mas contenido (por ejemplo, si suma una columna o un newsletter).

---

## 7. Hooks y utilidades compartidas

### 7.1 `src/shared/hooks/use-prefers-reduced-motion.ts` (27 lineas)

```ts
const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Usa `useSyncExternalStore`, no `useState` mas `useEffect`. En el servidor devuelve `false` para que el HTML emitido coincida con el primer render del cliente; si el usuario si tiene la preferencia, `useSyncExternalStore` corrige en el mismo commit (sin flash).

Consumidores: `SmoothScroll`, `HeroVideo`, `HeroRotador`, `BackToTop`, `useAvanceLinea`.

### 7.2 `src/shared/hooks/use-media-query.ts` (39 lineas)

La misma mecanica generalizada. Documenta **cuando usarlo y cuando no**:

> Solo cuando el breakpoint cambia la ESTRUCTURA del marcado, no cuando cambia como se ve. Si alcanza con CSS, va en CSS: esto obliga a un render extra en el cliente y a que el servidor emita una de las dos variantes.

Unico consumidor: `ExhibitorsSection`, donde el bento pasa de tres columnas (cuatro expositores cada una) a **una sola columna con los doce**, que no es lo mismo que tres columnas apiladas (se verian las costuras de tres bucles independientes).

Nota de implementacion: `getSnapshot` va memoizado con `useMemo` sobre `query`; devuelve un booleano, comparado por valor, asi que no hace falta cachear el resultado.

### 7.3 `src/shared/hooks/use-active-section.ts` (47 lineas)

```ts
export function useActiveSection(ids: readonly string[]) {
  const [activo, setActivo] = useState<string | null>(null);
  const clave = ids.join(",");   // dependencia por CONTENIDO, no por identidad
  useEffect(() => {
    const secciones = clave.split(",").map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (secciones.length === 0) return;
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) if (entrada.isIntersecting) setActivo(entrada.target.id);
    }, { rootMargin: "-45% 0px -55% 0px", threshold: 0 });
    secciones.forEach((s) => observador.observe(s));
    return () => observador.disconnect();
  }, [clave]);
  return [activo, setActivo] as const;
}
```

`rootMargin: "-45% 0px -55% 0px"` recorta el area de observacion a una tira horizontal de 0% de alto ubicada al 45% de la pantalla. Una seccion solo intersecta mientras cruza esa linea, asi que en todo momento hay una sola activa.

El `setActivo` se devuelve al llamador **a proposito**: el scroll suave tarda cerca de un segundo en llegar, asi que sin el, al hacer click en el menu el item quedaria sin marcar hasta que la animacion termine.

El truco de `ids.join(",")` como dependencia resuelve que `ids` suele venir de un `.map()` en linea (array nuevo cada render).

### 7.4 `src/shared/lib/cn.ts` (11 lineas)

`twMerge(clsx(inputs))`. Registrado en `.prettierrc` para el ordenado automatico de clases.

### 7.5 Componentes de movimiento

**`src/shared/components/motion/reveal.tsx` (75 lineas)**

```tsx
type RevealProps = {
  children: ReactNode;
  as?: ElementType;                              // por defecto "div"
  delay?: number;                                // ms, se aplica como variable CSS
  from?: "bottom" | "left" | "right" | "none";
  className?: string;
  id?: string;                                   // para aria-labelledby
};
```

Marcado emitido:

```tsx
<Comp ref={ref} id={id}
  data-reveal={shown ? "shown" : "hidden"}
  data-reveal-from={from}
  style={delay ? { "--reveal-delay": `${delay}ms` } : undefined}
  className={cn(className)}>
```

Observer:

```ts
const observer = new IntersectionObserver(([entry]) => {
  if (!entry.isIntersecting) return;
  setShown(true);
  observer.disconnect();   // una sola vez: reaparecer se siente como glitch
}, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
```

El CSS asociado, todo detras de `.js`:

```css
.js [data-reveal="hidden"] {
  opacity: 0;
  transition:
    opacity var(--duration-enter) var(--ease-out-expo) var(--reveal-delay, 0ms),
    translate var(--duration-enter) var(--ease-out-expo) var(--reveal-delay, 0ms);
}
.js [data-reveal="hidden"][data-reveal-from="bottom"] { translate: 0 2rem; }
.js [data-reveal="hidden"][data-reveal-from="left"]   { translate: -2rem 0; }
.js [data-reveal="hidden"][data-reveal-from="right"]  { translate: 2rem 0; }
.js [data-reveal="shown"] { opacity: 1; translate: 0 0; transition: ...; }

@media (prefers-reduced-motion: reduce) {
  .js [data-reveal] { opacity: 1 !important; translate: none !important; }
}
```

**Puntos clave**: el retardo se aplica como **variable CSS**, no como `setTimeout` de JS. Solo se animan `opacity` y `translate`, las dos unicas propiedades que el compositor anima sin recalcular layout ni repintar. Y el estado oculto nunca se sirve desde el servidor.

**`src/shared/components/motion/smooth-scroll.tsx` (37 lineas)**

```tsx
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  return (
    <ReactLenis root options={{
      lerp: reduced ? 1 : 0.1,
      smoothWheel: !reduced,
      syncTouch: false,
      wheelMultiplier: 1,
    }}>
      {children}
    </ReactLenis>
  );
}
```

Tres decisiones documentadas:

- Con `root`, `ReactLenis` **no inserta ningun wrapper en el DOM**: renderiza los children tal cual dentro de un context provider y crea la instancia recien en un efecto. Por eso se puede montar siempre sin riesgo de hidratacion.
- Con `prefers-reduced-motion` **no se desmonta el componente** (eso remontaria todo el arbol): se degradan las opciones. Con `smoothWheel: false` y `lerp: 1` el scroll pasa a ser efectivamente el nativo, pero la instancia sigue viva para que `scrollTo` de la navegacion siga funcionando.
- `syncTouch: false`: en tactil el scroll nativo ya es excelente y sincronizarlo introduce una latencia que se percibe como pesada en gama baja.

**Alcance de la dependencia de Lenis en el repo** (importante para decidir si se conserva):

| Consumidor | Uso |
| --- | --- |
| `smooth-scroll.tsx` | provider |
| `scroll-progress.tsx` | `useLenis((lenis) => lenis.progress)` |
| `back-to-top.tsx` | `useLenis((i) => i.scroll > innerHeight*2)` mas `lenis.scrollTo(0, {...})` |
| `site-header.tsx` | `useLenis((lenis) => lenis.scroll > 80)` |
| `agenda/hooks/use-linea-tiempo.ts` | `useLenis(({scroll}) => escribir(scroll))` |
| `tickets/components/tickets-section.tsx` | `lenis.stop()` / `lenis.start()` para el modal |

Seis consumidores. **Ninguno usa nada que no sea `scroll`, `progress`, `scrollTo`, `stop` y `start`.** Si se descarta Lenis, los cinco primeros se reescriben con `window.scrollY` y un listener pasivo; el sexto con bloqueo de scroll del body.

### 7.6 Componentes de layout

**`src/shared/components/layout/scroll-progress.tsx` (42 lineas)**

```tsx
const barra = useRef<HTMLDivElement>(null);
useLenis((lenis) => {
  const nodo = barra.current; if (!nodo) return;
  const p = Number.isFinite(lenis.progress) ? lenis.progress : 0;
  nodo.style.setProperty("--progreso", String(Math.min(1, Math.max(0, p))));
});
```

```tsx
<div className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px]" aria-hidden="true">
  <div ref={barra}
       className="h-full origin-left bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-lavender"
       style={{ transform: "scaleX(var(--progreso, 0))" }} />
</div>
```

Decision de rendimiento explicita: **el progreso no vive en el estado de React**. Un `setState` por frame haria re-renderizar ~60 veces por segundo. Se escribe una custom property por ref, y el navegador solo recompone el `scaleX`.

`Number.isFinite` protege del caso en que la pagina todavia no tiene alto scrolleable y el calculo da NaN.

**`src/shared/components/layout/back-to-top.tsx` (53 lineas)**

Aparece pasadas dos alturas de viewport (umbral expresado en alturas, no en pixeles fijos: "dos pantallas" significa lo mismo en cualquier dispositivo).

```tsx
const lenis = useLenis((instancia) => {
  const deberia = instancia.scroll > window.innerHeight * 2;
  setVisible((actual) => (actual === deberia ? actual : deberia));   // solo si CAMBIO
});
...
onClick={() => lenis?.scrollTo(0, { immediate: reducirMovimiento, duration: 1.1 })}
inert={!visible}
aria-hidden={!visible}
```

`inert` ademas de las clases: sin eso el boton invisible seguiria siendo alcanzable con Tab, dejando una parada fantasma.

**`src/shared/components/layout/site-header.tsx` (182 lineas)**

Nav a sangre completa, `fixed inset-x-0 top-0 z-[80]`, que se compacta apenas se sale del hero:

```tsx
useLenis((lenis) => {
  const deberia = lenis.scroll > 80;
  setCompacto((actual) => (actual === deberia ? actual : deberia));
});
```

```tsx
className={cn(
  "fixed inset-x-0 top-0 z-[80] transition-[background-color,backdrop-filter,border-color]",
  "border-b duration-control ease-standard",
  compacto ? "border-border bg-surface/80 backdrop-blur-md" : "border-transparent bg-transparent",
)}
```

Composicion: logo (`BrandMark h-8 sm:h-9` mas `<span className="sr-only">`), nav de escritorio (`hidden lg:block`, los nueve items de `NAV_SECTIONS`), CTA "Comprar entradas" (`hidden sm:inline-flex`), boton hamburguesa (`size-11`, `lg:hidden`) y panel movil.

Accesibilidad:

- `aria-current={esActivo ? "location" : undefined}`. El valor `location` es el correcto para "donde estoy dentro de este documento"; los lectores que no lo conozcan lo tratan como "true".
- Cada enlace llama a `setActivo(s.id)` en el `onClick` para marcar al instante (el scroll suave tarda ~1s).
- El item activo lleva un subrayado (`absolute inset-x-3 -bottom-0.5 h-0.5 bg-link`) en escritorio y un **punto al costado** en movil, "porque en una lista vertical el subrayado no se lee bien".
- Escape cierra el menu **y devuelve el foco al boton** que lo abrio (`botonMenu.current?.focus()`). Sin ese retorno el teclado queda huerfano al final del documento.
- El panel movil se mantiene en el DOM con el atributo `hidden` en vez de desmontarse, "para que `aria-controls` apunte siempre a un elemento existente".
- El icono va `aria-hidden` y el nombre accesible lo da un `<span className="sr-only">`.

Restriccion de layout documentada: la barra de escritorio deja 80px de holgura a 1024px con nueve items mas el CTA, y un decimo item mide 91px. **No entra un decimo item.**

**`src/shared/components/ui/boton-pausa.tsx` (87 lineas)**

Control de pausa compartido por el bento de Expositores y el riel de medios de pago.

```tsx
<button type="button" aria-pressed={pausado}
  aria-label={pausado ? "Reanudar el movimiento" : "Pausar el movimiento"}
  onClick={onCambiar}
  className={cn("grid size-12 place-items-center rounded-full border border-border-strong", ...)}>
  {pausado ? <IconoReanudar /> : <IconoPausar />}
</button>
```

`size-12` son 48x48: por encima de los 24 de WCAG 2.5.8 y tambien de los 44 recomendados.

**Quien manda sobre la animacion**: este boton **no llama a `pause()`**, solo avisa su estado hacia arriba para que el contenedor marque un atributo y el CSS resuelva.

> `Animation.pause()` le quita a CSS la autoridad sobre esa animacion de forma permanente, y a partir de ahi `animation-play-state` deja de gobernarla. Un solo dueno del estado de reproduccion, y es la hoja de estilos.

Los dos iconos estan dibujados a mano (dos `<rect>` y un `<path>`), no traidos de lucide: "son dos formas triviales y una dependencia de iconos entera para esto no se justifica". El triangulo de reanudar esta **opticamente centrado** (`M8.5 5 19 12 8.5 19 Z`), porque un triangulo centrado por su caja se ve corrido hacia la izquierda.

**`src/shared/components/ui/placeholder-visual.tsx` (64 lineas)**

Sustituto de las fotografias institucionales que no existen. **No es un rectangulo gris a proposito**: la reticula sale del propio isologotipo, cuyas cuatro piezas estan construidas sobre un modulo cuadrado de **48,3 unidades de PDF** (el asta mide 48,3 de ancho, las barras 48,3 de alto).

```tsx
const PARES = [
  ["var(--color-brand-violet-deep)", "var(--color-brand-violet)"],
  ["var(--color-brand-violet)",      "var(--color-brand-lavender)"],
  ["var(--color-brand-cyan)",        "var(--color-brand-violet)"],
  ["var(--color-brand-lavender)",    "var(--color-brand-cyan)"],
] as const;
```

Un degradado a 135 grados mas un `<pattern>` SVG de 48.3x48.3 con un borde al 18% y un cuadrado de 16x16 al 12%. Un `id` por instancia (`reticula-${paleta}`) para que dos patrones no se pisen. Va `aria-hidden`.

Consumidores: Agenda, Sobre, Mapa, Noticias, Entradas, Preguntas, Contacto. **Reemplazar por `<Image>` cuando existan fotos**: todos los consumidores ya reservan la relacion de aspecto, asi que el cambio no mueve el layout.

---

## 8. Accesibilidad (transversal)

Objetivo declarado en el README: Lighthouse mayor o igual a 90 en todas las categorias, apuntando a 100. Resultado medido contra produccion el 8/9:

| Perfil | Rendimiento | A11y | Buenas practicas | SEO | FCP | LCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Escritorio | 99 | 100 | 100 | 100 | 0,3 s | 0,7 s | 1,0 s |
| Movil | 93 | 100 | 100 | 100 | 1,0 s | 2,7 s | 4,9 s |

### 8.1 Inventario de mecanismos

| Mecanismo | Donde |
| --- | --- |
| Skip link (WCAG 2.4.1) | `layout.tsx`, primer elemento enfocable, `.sr-only-focusable` |
| Anillo de foco en dos capas | `globals.css`, `:focus-visible` con `outline` mas `outline-offset` |
| `prefers-reduced-motion` en CSS | `@layer base`, mas bloques dedicados en cada componente animado |
| `prefers-reduced-motion` en JS | `usePrefersReducedMotion` en 5 componentes |
| Control de pausa (WCAG 2.2.2) | `BotonPausa` en bento y riel de medios; pausa tambien al puntero y al foco |
| Area tactil 24px o mas (WCAG 2.5.8) | Puntos del slider (24x24), puntos del mapa (36x36), boton de pausa (48x48) |
| Sin bloqueo de zoom (WCAG 1.4.4) | `viewport` sin `maximumScale` ni `userScalable` |
| El color nunca es el unico indicador (WCAG 1.4.1) | Errores de formulario con texto, icono y `aria-invalid` |
| Contraste no textual (WCAG 1.4.11) | `border-strong` a 3.01:1, marcador de sponsors a 3.20:1 |
| Patron de pestanas WAI-ARIA | Entradas: `tablist`/`tab`/`tabpanel`, tabindex rotante, flechas, Home, End |
| `<dialog>` nativo | Modal de pago: foco, inertizacion, Escape y `::backdrop` los da el navegador |
| `inert` en contenido fuera de vista | Tarjetas inactivas de Noticias y Mapa, boton de volver arriba oculto |
| `aria-live="polite"` | Anuncio del slider de Noticias y del riel del Mapa |
| `role="list"` explicito | Listas sin vinetas (Safari deja de anunciarlas como listas) |
| `aria-current="location"` | Item activo de la nav |
| Retorno de foco | Escape en el menu movil devuelve el foco al boton |
| Orden del DOM independiente del visual | Agenda: los datos van siempre primero, el zigzag lo hace `col-start` |
| Copias del bucle ocultas | `aria-hidden` en la segunda vuelta del bento y del riel de medios |

### 8.2 La regla de degradacion

Repetida literal en cinco lugares del CSS: **quitar la animacion nunca debe quitar el contenido**.

Casos concretos:

- Bento con movimiento reducido: la columna **se despliega** (suelta alto, recorte y mascara), no se congela. Congelarla dejaba visibles 3 de 12 expositores en movil.
- Riel de medios de pago: la fila envuelve (`flex-wrap: wrap`) y la copia del bucle se esconde.
- Linea de la agenda: aparece completa.
- Recorrido del mapa: aparece dibujado.
- Marcador de sponsors: salta en vez de viajar, pero sigue marcando.
- Acordeon de preguntas: abre y cierra de golpe, pero sigue abriendo.

### 8.3 Comportamiento sin JavaScript

Este es el eje que mas distingue al repo. **El HTML se sirve en el estado degradado** y el estado interactivo lo agrega el CSS detras de `.js`.

| Seccion | Sin JavaScript | Mecanismo |
| --- | --- | --- |
| Todo el sitio | El contenido se ve (nada en `opacity: 0`) | `.js [data-reveal="hidden"]` |
| Agenda | La linea de tiempo se ve **dibujada entera** | `.agenda-tiempo { --avance: 1 }`, `.js` lo baja a 0 |
| Preguntas | Las cinco respuestas **visibles** | `.js .faq-panel:not([data-abierta]) { grid-template-rows: 0fr }` |
| Entradas | Los tres precios **visibles**, uno debajo del otro, con su nombre | `.js .entradas-panel:not([data-activo]) { display: none }` |
| Contacto | Un enlace `mailto:` con destinatario y asunto; el boton no se muestra | `html:not(.js) .contacto-enviar { display: none }` mas `.js .contacto-sin-js { display: none }` |
| Contacto | La validacion nativa del navegador funciona | `noValidate` se escribe **desde un efecto**, no en el JSX |
| Loader | No aparece | El `data-loader` lo pone el script |
| Sliders | Se ve la primera tarjeta | El riel es CSS, no colapsa |

Verificado con `curl`: el HTML servido no trae `action`, no trae `novalidate`, y si trae `required`, `pattern` y `minlength`.

**Historia relevante de Contacto**: el camino sin JS era `action="mailto:"` con `enctype="text/plain"` (que funcionaba mejor, porque serializaba los campos en el cuerpo), pero **Chrome trata cualquier `action` con esquema distinto de https como contenido mixto**, aunque un `mailto:` no mande nada por la red. Lighthouse lo cobraba en `is-on-https` (peso 5) e `inspector-issues` (peso 1) y dejaba Buenas practicas en 77. Los `mailto:` de un **enlace** no los marca; los de un `action`, si.

Otras lecciones de validacion nativa que quedaron documentadas (aplicables a cualquier formulario de la web final):

- `"\d"` en un string de comillas dobles es `"d"`. Va `String.raw`.
- Un `pattern` que no compila se **ignora entero** y el campo pasa a aceptar cualquier cosa, sin avisar. Chrome lo compila con la bandera `v`, donde `( ) - [ ] { }` son sintaxis reservada dentro de la clase de caracteres.
- `tooShort` es la unica entrada **condicional** de `ValidityState`: solo se activa si el valor fue editado por el usuario.
- `required` se satisface con espacios. Hay que recortar antes de decidir.
- React mapea `onBlur` a `focusout`, no a `blur`.

---

## 9. CI/CD y tooling

### 9.1 `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:        { branches: [main] }
  pull_request: { branches: [main] }

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Typecheck · Lint · Format · Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4          # SIN `version:` a proposito
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - name: Instalar dependencias
        id: install
        run: pnpm install --frozen-lockfile
      - name: Typecheck
        if: "!cancelled() && steps.install.outcome == 'success'"
        run: pnpm run typecheck
      - name: Lint (incluye fronteras de arquitectura)
        if: "!cancelled() && steps.install.outcome == 'success'"
        run: pnpm run lint
      - name: Formato
        if: "!cancelled() && steps.install.outcome == 'success'"
        run: pnpm run format:check
      - name: Build de produccion
        if: "!cancelled() && steps.install.outcome == 'success'"
        run: pnpm run build
```

Dos decisiones documentadas en comentarios del propio YAML:

1. **`pnpm/action-setup@v4` sin `version:`**. El campo `packageManager` de `package.json` ya fija la version, y declararla tambien en la action hace que aborte por versiones multiples. Una sola fuente de verdad.
2. **Las cuatro verificaciones corren aunque una falle** (`!cancelled()`), para ver todos los errores en una sola corrida. Pero todas dependen de que la instalacion haya funcionado (`steps.install.outcome == 'success'`): sin `node_modules` fallarian por una razon que no tiene nada que ver con el codigo.

`concurrency` con `cancel-in-progress: true` cancela corridas viejas de la misma rama.

### 9.2 Husky

```
.husky/pre-commit  ->  pnpm exec lint-staged
.husky/pre-push    ->  pnpm run typecheck
```

`lint-staged` en `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

Reparto sensato: en el commit lo rapido (solo lo staged), antes del push lo caro (typecheck completo).

### 9.3 Prettier

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css",
  "tailwindFunctions": ["cn", "cva"]
}
```

`tailwindStylesheet` es la forma **Tailwind 4** de decirle al plugin donde vive la configuracion (antes era `tailwindConfig`). Sin eso el plugin no conoce los tokens propios y ordena mal.

`.prettierignore`:

```
.next
node_modules
out
build
pnpm-lock.yaml
public
*.md

# Documentos de entrega generados: HTML imprimible con fuentes y capturas
# embebidas en base64. No son fuente que formatear.
docs/propuesta
```

Notar que **los `.md` estan excluidos** de Prettier. Es una decision, no un olvido: la documentacion se escribe a mano con formato deliberado.

### 9.4 `.gitattributes`

```
* text=auto eol=lf

*.woff2 binary
*.png   binary
*.jpg   binary
*.pdf   binary
*.eps   binary
*.cdr   binary
*.mp4   binary
*.webm  binary
```

Con un comentario que anticipa exactamente el escenario de la fusion:

> Sin esto, al juntar los tres prototipos del equipo cada archivo tocado en Windows apareceria como "todas las lineas cambiadas" en el diff.

**Este archivo es una adopcion obligatoria y de prioridad maxima para el repo final.** Si los tres prototipos se fusionan sin normalizar finales de linea, el primer merge va a ser ilegible.

Falta una regla para `.html`, asi que los dos documentos de `docs/propuesta/` caen bajo `* text=auto eol=lf` y git los versiona como texto: cambiar una captura produce un diff de 50.000 caracteres en una linea.

### 9.5 `vercel.json` y `pnpm-workspace.yaml`

```json
{ "$schema": "https://openapi.vercel.sh/vercel.json", "framework": "nextjs" }
```

Minimo. El commit `1a5b12b fix(vercel): declarar el preset de framework en vercel.json` indica que sin esta declaracion el deploy no detectaba el framework.

```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

pnpm 10 pide aprobacion explicita para correr scripts de instalacion. Estas dos se ignoran a proposito. **Ojo**: `sharp` es lo que Next usa para optimizar imagenes en produccion; en Vercel eso lo resuelve la plataforma, pero en un self-host habria que revisarlo.

### 9.6 `.gitignore`

Estandar de `create-next-app` mas `.vercel` y `next-env.d.ts`. Nada notable.

---

## 10. Documentacion

### 10.1 `AGENTS.md` (360 lineas, 21 KB) y `CLAUDE.md`

`CLAUDE.md` tiene **una sola linea**: `@AGENTS.md`. Es un puntero, para no duplicar.

`AGENTS.md` arranca con un bloque `<!-- BEGIN:nextjs-agent-rules -->` que **lo escribe y lo reagrega `next dev`** (verificable en `node_modules/next/dist/server/lib/generate-agent-files.js`). Advertencia util: quitarlo de un diff solo recrea el cambio sin commitear.

Estructura del resto:

1. Comandos (tabla)
2. Flujo de trabajo (5 pasos; "no commitear sin que Leandro haya aprobado")
3. Arquitectura (las tres capas y la regla de imports relativos)
4. Sistema de diseno (la regla dura de no inventar valores) mas "Accesibilidad del color"
5. Marca (fuente unica de geometria)
6. Animacion (CSS nativo, control de pausa obligatorio, propiedades animables, la excepcion del acordeon) mas "Mejora progresiva"
7. Rendimiento (nada de `setState` por frame)
8. **"Trampas ya pisadas"**: la joya del documento. Cerca de 39 lecciones medidas, cada una con sintoma, causa y solucion.
9. Contenido (todo provisorio, centralizado)

**Este documento es lo mas valioso del repo para la fusion**, mas alla del codigo. Cada trampa costo tiempo real y esta escrita con el sintoma exacto por el que se detecta.

Muestrario de las mas transferibles a cualquier stack:

- **Capas en cascada le ganan a la especificidad.** Una regla en `@layer components` no puede anular una utilidad de Tailwind.
- **`transform-box: fill-box`** es obligatorio en SVG para que `transform-origin` y los porcentajes se calculen contra la caja del path.
- **Un `rootMargin` negativo define una franja, no una linea.**
- **La caja de una recta vertical tiene ancho cero**, y un degradado en `objectBoundingBox` sobre ella no se pinta.
- **`vector-effect="non-scaling-stroke"` rompe `pathLength`.**
- **El LCP descarta `opacity: 0` pero no hace test de oclusion.**
- **Una imagen a viewport completo no es candidata a LCP.**
- **Axe no audita contraste no textual.**
- **El area tactil no es el elemento visible.**
- **Un marquee separado con `gap` no cierra el bucle.**
- **`getComputedStyle(el).transform` no refleja la propiedad `translate`.**
- **`min-width: auto` en un item de grid o flex** se niega a achicarse por debajo de su contenido.
- **El "..." de `line-clamp` lo dibuja `text-overflow`.**
- **`Animation.pause()` le quita a CSS la autoridad para siempre.**
- **El `:hover` tactil es pegajoso y le gana a tu JavaScript.**
- **Un `sticky` cuyo bloque contenedor mide lo mismo que el no se pega nunca.**
- **Un z-index negativo pierde el hit-test contra el `<body>`.**
- **En desarrollo, la primera aparicion de una clase de Tailwind llega tarde** (el JIT la genera recien cuando el DOM la usa).
- **Congelar una animacion no es degradarla.**
- **El presupuesto de un texto lo fija el peor caso, no el tipico.**
- **El peor caso de una medida responsive no esta siempre en el extremo.**
- **`setPointerCapture` lanza `NotFoundError`** si el `pointerId` no corresponde a un puntero activo: va al final del handler y dentro de un `try`.
- **`touch-action: none` no impide seleccionar texto.** Hace falta `user-select: none` con prefijo webkit.
- **Para arrastrar algo que ya anima, se mueve el reloj de la animacion, no el elemento** (`el.getAnimations()[0].currentTime`).

### 10.2 `README.md` (4,5 KB)

Bien estructurado para un evaluador: como verlo (URL de produccion mas el anexo `/sistema-de-diseno`), como correrlo, tabla de scripts, tabla de stack con el "por que" de cada herramienta, arquitectura con el diagrama de tres capas y la explicacion de que las fronteras son un test, sistema de diseno (seis vinetas con la trazabilidad), accesibilidad (seis vinetas) y calidad (CI mas Husky).

### 10.3 `docs/01-plan.md` (129 lineas)

- Tabla de entregables con su estado.
- Fecha de cierre: martes 8 de septiembre de 2026, 23:59.
- Seis fases, todas cerradas.
- Checklist de secciones con la especificacion **detallada** de cada una (util como referencia de que hace cada seccion).
- Funcionalidades transversales (dos sin hacer: seccion propia de redes sociales, y reutilizar la animacion de la "J" como estado de carga y vacio).
- **"Descartado a proposito"**: agenda interactiva, filtro por rubros, filtros y buscador de expositores, panel de novedades, panel de futuras actualizaciones, "la mejor foto del evento". Cada uno con su razon. **Muy util para la fusion**: son decisiones ya argumentadas.
- Criterios de evaluacion del jurado: innovacion, diseno visual, experiencia de usuario, identidad institucional, factibilidad tecnica, accesibilidad, escalabilidad, calidad de la presentacion, uso responsable de IA, originalidad.

### 10.4 `docs/02-estado.md` (337 lineas)

Bitacora de lo que funciona, seccion por seccion, con los numeros medidos. Es la mejor fuente para entender **por que** cada seccion quedo como quedo. Incluye datos duros que no estan en ningun otro lado:

- Bento: escritorio 48s por columna a 40 px/s, movil 72s a 58,7 px/s. Paso de 480px en escritorio y 352px en movil. `SEGUNDOS_POR_TARJETA` vale 12 en escritorio y 6 en movil.
- Riel de medios: 216,7ms de avance corriendo, 0 pausado, 222,3 al reanudar. Bucle con error de 0px.
- Preguntas: los altos pasan de `[83, 0, 83, 0, 0]` a `[83, 83, 83, 83, 83]` al sacar `.js`.
- Entradas: los altos pasan de `[397, 0, 0]` a `[440, 440, 440]`.
- Modal: con el modal abierto una rueda de 600px deja el scroll en 8441; al cerrar con Escape el foco vuelve a "Comprar" y la misma rueda lo mueve a 8927.
- Contacto: contraste 5,54:1 del texto de error sobre la seccion, 5,13:1 el borde sobre el campo.
- Sponsors: cero desalineados a 402, 767, 768, 1440 y 1920px.

Ademas una seccion "Entorno" con notas de herramientas (Chrome, MCP de chrome-devtools, `resize_page` versus `emulate`, ffmpeg via winget, Vercel CLI con `pnpm dlx`, el proyecto vive dentro de OneDrive).

### 10.5 `docs/03-pendientes.md` (352 lineas)

El documento mas importante para decidir que se adopta. Ver seccion 12 de este informe.

### 10.6 Entregables imprimibles: `docs/propuesta/`

| Archivo | Bytes | Lineas |
| --- | --- | --- |
| `memoria-descriptiva-purple.html` | 198.305 | 433 |
| `declaracion-ia-purple.html` | 79.754 | 320 |

#### Como se generan los PDF

**No hay script de generacion. Ninguno.** Verificado: `package.json` no tiene scripts de docs/pdf/print; los unicos `.mjs` del repo son `eslint.config.mjs` y `postcss.config.mjs`; no hay `.sh` ni `.ps1`; y la busqueda de `puppeteer|playwright|weasyprint|prince|pagedjs|wkhtmlto` solo da hits transitivos en `pnpm-lock.yaml`, sin uso real.

Los dos HTML entraron de una sola vez en el commit `e59c869` (8 sep 2026, 02:42). `git log --all -- docs/propuesta/` devuelve un unico commit.

**El metodo es Ctrl+P del navegador**, documentado en cuatro lugares. Dentro del propio HTML hay un aviso que se autoelimina al imprimir:

```html
<p class="aviso-export">EXPORTAR A PDF · Ctrl+P → «Guardar como PDF» → activar «Gráficos de fondo». Este aviso no se imprime.</p>
```

```css
@media print { .aviso-export { display: none; } }
```

Y ademas en `docs/01-plan.md` (lineas 15 y 18), `docs/02-estado.md` (lineas 286-298) y el mensaje del commit.

#### Reglas de pagina (identicas en los dos archivos, lineas 205-229)

```css
.salto { break-after: page; }

@page {
  size: A4;
  margin: 12mm 12mm 16mm;
  @bottom-right {
    content: counter(page) " / " counter(pages);
    font-family: "Courier New", monospace;
    font-size: 8pt;
    color: #57515f;
  }
}

@media print {
  body { font-size: 10.5pt; }
  .hoja { max-width: none; padding: 0; }
  .aviso-export { display: none; }
  a { color: inherit; }
}
```

- **A4, margenes 12mm laterales y superior, 16mm inferior.** Ancho util 210 menos 24 igual a 186mm, exactamente el `max-width: 186mm` de `.hoja` en pantalla: la vista de pantalla es una simulacion 1:1 de la hoja impresa.
- **El folio `@bottom-right` no llega al PDF en la practica.** Ni Chrome, ni Edge ni Firefox implementan las margin at-rules de CSS Paged Media. La numeracion real es la del dialogo de impresion.
- **Color de fondo forzado**: `html { print-color-adjust: exact; -webkit-print-color-adjust: exact; }`. De ahi la instruccion de activar "Graficos de fondo": sin ella Chrome ignora el papel crema, el rayado de la portada, los chips de paleta y el cebrado de las tablas.
- **El tipo baja de 11,5pt (pantalla) a 10,5pt (impresion).**

Control de saltos:

| Regla | Elementos |
| --- | --- |
| `break-after: page` (`.salto`) | Solo la portada de la memoria |
| `break-after: avoid` | `h2` y `h3` (nunca un titulo huerfano al pie) |
| `break-inside: avoid` | `table`, `.paleta`, `figure.captura`, `.fila-figuras`, `.panel` |
| `break-inside: auto` | `section`, explicito |

`.portada` tiene `min-height: 240mm` que con su `padding: 14mm 12mm` da 268mm, practicamente la caja util de una A4 (297 menos 12 menos 16 igual a 269mm). La portada llena la pagina exacta.

#### Estructura de la memoria descriptiva

Titulo: "ExpoJuy 2026 · Memoria descriptiva · Equipo Retro".

**Portada**: sello rotado "Fase 1 · Propuesta", kicker "Primera Edicion · Programa Provincial de Desafios Tecnologicos", SVG del isologotipo inline, H1 "ExpoJuy 2026", subtitulo, claim centrado, y una ficha `<dl>` con seis pares (Equipo, Fecha, Prototipo, Anexo, Repositorio, Acceso).

**Indice**: `<nav class="indice">` con `<ol>` a dos columnas CSS, ocho items numerados 01 a 08 con el numero en violeta profundo. Es visual: no hay anclas ni enlaces internos.

| Numero | Titulo | Contenido |
| --- | --- | --- |
| 01 | Concepto general | Una sola pagina oscura, negro y violeta, cada color medido del isologotipo y la geometria extraida del PDF institucional. Define "moderno" como rigor, no acumulacion de efectos. Captura del Inicio. |
| 02 | Objetivos | Seis vinetas: identidad verificable, experiencia sin manual, accesibilidad medida, rendimiento en telefono real, escalabilidad demostrable, honestidad de prototipo. |
| 03 | Organizacion del contenido | El orden como embudo de decision. Tabla de 10 filas con la arquitectura de navegacion. Captura del Mapa. |
| 04 | Criterios de diseno | Regla dura de no inventar valores. Tira de 5 swatches de paleta y cinco vinetas: neutros OKLCH, radios, movimiento con intencion, marca de fuente unica, tipografia Ambit. |
| 05 | Tecnologias | Dos columnas: tabla de stack y explicacion de Vertical Slice en 3 capas con ESLint como guardian. Cierra con seguridad y mantenimiento. |
| 06 | Estrategia de accesibilidad | "Medir, no suponer". Busqueda binaria en OKLCH. Seis vinetas: ratios de acento, WCAG 2.2.2, reduced-motion que despliega, WCAG 2.5.8, mejora progresiva, semantica y teclado. |
| 07 | Estrategia responsive | Validacion midiendo el DOM a 390/640/768/1024/1440px con emulacion tactil. "El diseno reorganiza, no encoge". Tabla de Lighthouse fechada mas captura movil. |
| 08 | Uso de inteligencia artificial | Parrafo unico que remite al documento adjunto. |
| sin numero | Estado y continuidad | Cierre: CI publicando en cada push; lo provisorio senalizado y centralizado, reemplazable sin rediseno. |

**Pie**: "ExpoJuy 2026 · Memoria descriptiva" a la izquierda, "Equipo Retro · 08/09/2026" a la derecha.

#### Estructura de la declaracion de IA

Titulo: "ExpoJuy 2026 · Declaracion de uso de IA · Equipo Retro".

Portada compacta (`portada--compacta`, `min-height: 110mm`, H1 a 24pt, logo a 18mm), sello "Anexo · IA", ficha de solo tres pares. Sin claim, sin indice y sin salto de pagina.

| Numero | Titulo | Contenido |
| --- | --- | --- |
| 01 | Marco de uso | La IA como herramienta de apoyo bajo direccion humana. Destaca en `panel--nota` el ciclo: especificar, implementar, validar en el navegador midiendo el DOM, aprobar, commit. La aprobacion de cada cambio es siempre de una persona. |
| 02 | Herramientas | Tabla "Inventario declarado" con 6 filas: Claude Code (Anthropic), MCP chrome-devtools, plugin claude-in-chrome, Lighthouse CLI, plugin de Vercel, memoria persistente. |
| 03 | Documentacion IA-first: el uso es auditable | El conocimiento vive versionado, no en la conversacion. Tres vinetas: AGENTS.md (39 lecciones medidas), docs/ (plan, estado, pendientes), historial (32 commits en espanol, autoria del equipo). |
| 04 | Que hizo la IA y que hizo el equipo | Dos tablas enfrentadas. IA: implementacion bajo especificacion, medicion en navegador, diagnostico, redaccion tecnica. Equipo: especificacion, direccion de diseno, aprobacion previa al commit, decisiones de contenido y descartes. |
| 05 | Limites y uso responsable | Cinco vinetas: sin datos institucionales inventados sin marcar, sin imagenes generadas por IA, marca sin modificaciones, material de terceros con licencia, honestidad funcional. |

#### Sistema de estilos del entregable

**El CSS es byte a byte identico en los dos archivos** (verificado con diff sobre los bloques `<style>` despojados de blobs: cero diferencias, mismas lineas 7 a 229). Es un stylesheet duplicado, no compartido: cualquier cambio hay que hacerlo dos veces.

Concepto: **"expediente retro"**, nombre del propio commit. Es una **inversion** del sitio: el prototipo web es oscuro, el entregable impreso es papel crema con tinta violeta.

```css
:root {
  --papel: #f5f2ea;
  --papel-panel: #edeadf;
  --tinta: #221e2b;
  --tinta-media: #57515f;
  --regla: rgba(34, 30, 43, 0.28);
  --regla-suave: rgba(34, 30, 43, 0.14);
  --violeta: #774ff0;
  --violeta-profundo: #820cd0;
  --lavanda: #bb8cff;
  --cian: #25c0d4;
  --mono: "Courier New", ui-monospace, "Cascadia Mono", monospace;
  --sans: "Ambit", ui-sans-serif, system-ui, sans-serif;
}
```

Los cuatro acentos son **exactamente los mismos hex** que `globals.css`. `--tinta-media: #57515f` no es un gris neutro: es un violeta desaturado, coherente con el criterio OKLCH del sitio.

**Tipografias**: Ambit (embebida en dos pesos) para titulos y prosa; **Courier New del sistema, no embebida**, para todo lo tecnico (kicker, sello, ficha, indice, tablas, captions, tags, epigrafes, pie). El contraste Ambit/Courier es el motor del concepto: la voz editorial es la marca, los datos son mecanografiados.

**Unidades mixtas y consistentes**: milimetros para la geometria de pagina (`padding: 14mm 12mm`, `grid-template-columns: 34mm 1fr`), puntos para el tipo (11,5pt cuerpo, 34pt H1, 15pt H2, 9,5pt mono, 8,5pt captions). Unica excepcion: `.aviso-export` usa px, coherente porque solo existe en pantalla.

Componentes visuales destacados:

```css
.portada {
  border: 2px solid var(--tinta);
  outline: 1px solid var(--tinta);
  outline-offset: 3px;
  padding: 14mm 12mm;
  min-height: 240mm;
  background:
    linear-gradient(var(--regla-suave) 1px, transparent 1px) 0 0 / 100% 9mm,
    var(--papel);
}
```

El `border` mas `outline` con `outline-offset: 3px` simula el doble filete de una caratula de expediente sin un segundo elemento. El `linear-gradient` repetido cada 9mm es el renglonado de cuaderno.

```css
.sello {
  position: absolute; top: 32mm; right: 12mm;
  background: var(--papel);
  transform: rotate(3deg);
  font-family: var(--mono);
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--violeta-profundo);
  border: 2px solid var(--violeta-profundo);
  padding: 2mm 4mm;
}
```

```css
.ficha { margin-top: auto; font-family: var(--mono); border-top: 1px solid var(--tinta);
         display: grid; grid-template-columns: 34mm 1fr; row-gap: 2.2mm; }
.ficha dd a { color: var(--tinta); text-decoration: none; border-bottom: 1px solid var(--violeta); }

ul.lista li::before { content: "▸"; position: absolute; left: 1mm; color: var(--violeta); }

em { font-style: normal; border-bottom: 1px solid var(--lavanda); }   /* resaltador, no cursiva */

table { width: 100%; border-collapse: collapse; font-size: 9.5pt; font-family: var(--mono);
        break-inside: avoid; }
tbody tr:nth-child(odd) td { background: rgba(34, 30, 43, 0.03); }
td:first-child { white-space: nowrap; }
```

Inventario de componentes (uso en memoria / declaracion): `.hoja` 1/1, `.aviso-export` 1/1, `.portada` 1/1, `.portada--compacta` 0/1, `.sello` 1/1, `.kicker` 1/1, `.claim` 1/0, `.ficha` 1/1, `.indice` 1/0, `.lista` 3/2, `table` 4/3, `.tag` 2/0, `.paleta` mas `.sw` mas `.chip` 1/0, `figure.captura` 3/0, `.fila-figuras` 1/0, `.panel`/`.panel--nota` 0/1, `.dos-columnas` 1/0, `.pie-doc` 1/1, `.salto` 1/0.

No hay cajas de codigo (`<pre>`/`<code>`); lo mas parecido es `.tag`, usado para `app/`, `features/`, `shared/`.

#### Assets embebidos

| Archivo | woff2 | webp | SVG inline | Base64 total | Porcentaje del archivo |
| --- | --- | --- | --- | --- | --- |
| memoria | 2 | 3 | 1 | 175.272 chars | ~88,4% |
| declaracion | 2 | 0 | 1 | 65.228 chars | ~81,8% |

**Fuentes** (identicas en ambos): `Ambit-Bold.woff2` (24.816 B, weight 700) y `Ambit-Regular.woff2` (24.104 B, weight 400), con coincidencia exacta contra los archivos de `src/shared/fonts/`. Los pesos Light y SemiBold **no se embeben**: el documento impreso solo necesita regular y bold. Ahorro de ~50 KB por archivo.

**Imagenes** (solo en la memoria, las tres WebP con perdida):

| Numero | Bytes | Dimensiones | Ubicacion | Epigrafe |
| --- | --- | --- | --- | --- |
| 1 | 38.864 | 1100x688 | Seccion 01 | "Inicio institucional: video cenital nocturno, rotador de conceptos y doble llamada a la accion." |
| 2 | 24.784 | 1100x688 | Seccion 03 | "Mapa del predio: el recorrido se calcula sobre un grafo de circulacion y se dibuja desde el acceso." |
| 3 | 18.882 | 480x1039 | Seccion 07 | "Entradas a 390 px." |

Todas llevan `alt` descriptivo real y `figcaption` en Courier. El marco `figure.captura` pinta `background: #0b0911` (el negro del sitio) para dar cama a la captura oscura.

**SVG del isologotipo inline** en ambos documentos, una vez por portada:

```html
<svg class="logo" viewBox="0 0 164.6901 229.8555" role="img" aria-label="Isologotipo de ExpoJuy 2026">
  <g transform="translate(-338.5848, 412.3633) scale(1, -1)">
    <path fill="#774ff0" d="..."/>
    <path fill="#bb8cff" fill-rule="evenodd" d="..."/>
    <path fill="#820cd0" d="..."/>
    <path fill="#25c0d4" d="..."/>
  </g>
</svg>
```

Contrastado contra `brand-mark-paths.ts`: el `viewBox` es exactamente `BRAND_VIEW_BOX`, el `transform` es exactamente `BRAND_FLIP_Y`, y los cuatro `d` coinciden literal. Cuesta ~1,3 KB, escala perfecto a cualquier DPI y es el unico asset verificable con un diff contra el original institucional.

**Cero peticiones externas**: ni un `<script>`, `<link>`, `@import`, ni referencia a Google Fonts. Los archivos abren y renderizan identicos sin conexion, desde `file://`.

#### Datos duros de la memoria (reutilizables)

- **Lighthouse** (caption "Lighthouse · produccion · 08/09/2026"): movil 93/100/100/100, escritorio 99/100/100/100.
- **Contrastes**: lavanda 7,83:1, cian 9,02:1, violeta profundo 2,74:1 (prohibido para texto por regla escrita).
- **Criterios WCAG citados por numero**: 2.2.2, 2.5.8, 1.4.11.
- **Movimiento**: cuatro duraciones (150 / 250 / 600 / 900 ms), cero librerias de animacion.
- **Color**: neutros generados en OKLCH al matiz 297,8 grados.
- **Responsive**: validado a 390, 640, 768, 1024 y 1440px con emulacion tactil real.
- **Tabla completa de arquitectura de navegacion** (10 filas, seccion mas propuesta funcional), lista para reutilizar en una pagina de "como esta hecho".

#### Portabilidad de los entregables

- **En runtime: cero dependencia del proyecto Next.** No comparten hoja de estilos con el sitio, no importan tokens, no usan Tailwind. Se copian a cualquier lado y funcionan.
- **En origen: si.** Las woff2 salen de `src/shared/fonts/`, la geometria del logo de `brand-mark-paths.ts`, y las capturas del sitio en produccion. **Los valores de la paleta estan duplicados a mano**: coinciden hoy, pero nada los mantiene sincronizados.
- **Excluidos del tooling a proposito**: sin la excepcion de `.prettierignore`, `pnpm verify` y el CI quedaban en rojo (Prettier intentando reformatear lineas base64 de 50.000 caracteres).

**Friccion para regenerarlos**:

1. Duplicacion del stylesheet: todo cambio visual hay que aplicarlo dos veces, a mano, sin nada que detecte la divergencia.
2. Sin generador: si cambia una cifra de Lighthouse, se edita HTML a mano dentro de un archivo de 198 KB del que 88% es ruido base64.
3. Sin captura automatizada: las tres WebP se produjeron manualmente.
4. El paso a PDF es manual y no reproducible bit a bit: depende del navegador, de su version y de que el operador tilde "Graficos de fondo".

**Recomendacion si se retoma**: un unico `docs/propuesta/_estilo.css` mas un script `.mjs` que inline el CSS, embeba las woff2 y las capturas, e importe el SVG desde `brand-mark-paths.ts`. Y para PDF reproducible con folios reales, `page.pdf()` de Playwright con `printBackground: true` y `preferCSSPageSize: true`, o Paged.js para que el `@bottom-right` funcione de verdad.

---

## 11. Contenido de `public/`

**Solo hay cuatro archivos, todos del hero:**

| Archivo | Peso |
| --- | --- |
| `public/media/hero-1080.mp4` | 4.592.361 B (4,4 MB) |
| `public/media/hero-1080.webm` | 3.368.432 B (3,2 MB) |
| `public/media/hero-720.webm` | 1.854.679 B (1,8 MB) |
| `public/media/hero-poster.jpg` | 168.292 B (164 KB) |

Total: 9,6 MB.

**No hay favicon.ico, ni og-image, ni manifest, ni robots.txt, ni sitemap.xml, ni ninguna imagen, icono o fuente en `public/`.** Las fuentes viven en `src/shared/fonts/` (para que las procese `next/font/local`), los iconos vienen de `lucide-react`, y el favicon es un data URI generado.

**El peso de `public/` fue evaluado y descartado como problema**: en movil solo se descarga `hero-720.webm` (1,8 MB), porque la eleccion de variante por viewport funciona. Lighthouse no lo marca.

**Falta un `og:image`.** Los metadatos de Open Graph declaran `twitter: { card: "summary_large_image" }` pero no hay imagen que servir. Para la web final conviene generarla (Next tiene `opengraph-image.tsx` con `ImageResponse`, que ademas podria dibujarse desde `BRAND_PATHS`).

---

## 12. Deuda tecnica, hacks y gotchas documentados

### 12.1 Bloqueantes declarados

| Item | Detalle |
| --- | --- |
| **Video del hero** | Aerea nocturna de una ciudad de EE.UU. (se leen carteles de KeyBank y Wells Fargo). Licencia libre, sin marca de agua, pero **no es Jujuy** y "identidad institucional" es criterio de evaluacion. Reemplazar manteniendo los nombres de archivo. |
| **Sin fotografias institucionales** | El kit solo trae logotipos y tipografias. `PlaceholderVisual` ocupa el lugar en 7 secciones. |
| **Sin logotipos de auspiciantes** | Ni uno. La "J" en monocromia ocupa el lugar. |
| **Contenido provisorio** | 10 archivos de constantes con datos de maqueta, todos marcados `PROVISORIO`. |

Tabla completa de lo provisorio:

| Archivo | Que |
| --- | --- |
| `shared/constants/site.ts` | Fechas, sede, redes sociales y **canales de contacto** |
| `features/about/constants/slides.ts` | Descripciones y cifras de las 4 laminas |
| `features/hero/constants/media.ts` | Mitad derecha de los pares del rotador |
| `features/agenda/constants/actividades.ts` | Las 6 actividades |
| `features/exhibitors/constants/expositores.ts` | Los 12 expositores |
| `features/venue-map/constants/plano.ts` | Nombres y descripciones de los 9 lugares |
| `features/news/constants/noticias.ts` | Las 6 noticias |
| `features/faq/constants/preguntas.ts` | Las 5 respuestas (varias dependen de precios sin confirmar) |
| `features/sponsors/constants/sponsors.ts` | Los 16 auspiciantes |
| `features/tickets/constants/entradas.ts` | **Los 3 precios**, que incluye cada entrada y los 11 medios de pago |

**Lo que NO es provisorio**: los titulos y ejes de las laminas, las palabras de la izquierda del rotador, y los ejes de cada actividad. Son los valores que la organizacion declara en las consignas tecnicas (innovacion, tecnologia, produccion, desarrollo, vinculacion empresarial, economia del conocimiento).

Tres advertencias graduadas:

1. **Los precios** son el dato provisorio mas consultable: alguien puede anotarlos y presupuestar. Por eso la seccion lo **dice en la interfaz** y no solo en un comentario.
2. **Los medios de pago**: nombrar una marca afirma que ExpoJuy la acepta, y eso no esta confirmado.
3. **Los auspiciantes** merecen advertencia propia y por el motivo contrario al resto: una noticia inventada se lee como maqueta, pero **un auspiciante inventado AFIRMA un vinculo comercial que nadie confirmo**.

Y una que rompe una funcion: **el correo de `CONTACTO`**. El formulario apunta a esa direccion, asi que un valor de maqueta ahi no es texto de relleno, es un envio que no llega a ningun lado.

Regla de contenido no automatizable: **los nombres de `sponsors.ts` no pueden repetirse con los de `expositores.ts`**. La frontera de arquitectura impide que un slice mire el otro, asi que la regla se sostiene a mano.

### 12.2 Deuda tecnica abierta

| Item | Estado |
| --- | --- |
| **Speed Index 4,9 s en movil (score ~60)** | Decision pendiente, **no bug**. Durante los 3,1 s del loader el viewport es un campo casi negro y las animaciones dejan el H1 en `opacity: 0`. "El loader se ve como fue disenado: esto es un costo asumido." Si se quiere recuperar el punto hay que discutir el loader. |
| **"Sobre ExpoJuy" tiene su propia copia del carrusel** | No se migro a `useCarruselCircular` "para no refactorizar algo validado a esta altura del plazo". Son dos implementaciones del mismo ciclo y pueden divergir. |
| **`prefers-reduced-motion` validado indirectamente** | El `emulate` del MCP de chrome-devtools no expone esa preferencia. Se verifico extrayendo del CSSOM el bloque autorado y aplicandolo sin el envoltorio del media query. Fiel a las declaraciones, pero no es lo mismo que un usuario con la preferencia activada. |
| **El pulso del acceso late en bucle sin control de pausa** | Decision tomada, no descuido. Excepcion de WCAG 2.2.2 por movimiento esencial. Salida barata: limitarlo a dos ciclos. |
| **Arrastre del bento sin probar en telefono real** | `touch-action: none` significa que un dedo que empieza dentro del bento ya no scrollea. Mitigado (la ventana mide 528px contra ~820 de viewport), pero es el clasico "scroll atrapado" y el emulador no lo dice. |
| **JS menor** | 51 KB sin usar y 14 KB de transpilacion innecesaria (~450 ms estimados), casi todo del framework. Baja prioridad. |
| **Responsive validado a medias** | Validados a 390/412/640/768/1440: bento, laminas, Mapa, Noticias, Preguntas, Entradas y Sponsors. **Sin validar: hero, agenda, nav y footer.** |
| **FPS sin medir** | No se puede con `requestAnimationFrame` desde la pagina (la pestana oculta lo throttlea a cero). Usar el trace de performance de DevTools. |
| **Sin atribucion ODbL en el mapa** | Se saco de la interfaz a pedido; defendible porque el plano ya no contiene datos de OSM. **Si alguna vez se reemplaza por trazado fiel, vuelve a ser obligatoria.** |

### 12.3 Deuda que este analisis detecta y no esta anotada

| Item | Impacto |
| --- | --- |
| **`class-variance-authority` esta declarada pero no se usa** | Cero imports en `src/`. Dependencia muerta. |
| **`tw-animate-css` esta importada en `globals.css` pero no se usa ninguna de sus clases** | La unica clase `animate-*` del repo es `animate-bounce`, que es de Tailwind base. Candidata a sacar. |
| **`src/features/social/` esta vacio** (solo `.gitkeep`) | Feature planificado y nunca construido. |
| **`data/` y `types/` nunca se usan** en ninguna feature | La convencion documentada es mas amplia que la real. |
| **Los hex de `/sistema-de-diseno` estan duplicados a mano** respecto de `globals.css` | Unico punto de desincronizacion silenciosa del sistema de diseno. |
| **No hay JSON-LD ni schema.org** | Un evento tiene tipo `Event`, que aporta bastante en resultados de busqueda. |
| **No hay `sitemap.ts`, `robots.ts` ni `manifest.ts`** | Faltantes de SEO basico para un sitio publico. |
| **No hay `og:image`** | Se declara `summary_large_image` sin imagen. |
| **No hay licencia de Ambit en el repo** | Solo la afirmacion de que la organizacion la entrego. Redistribuir woff2 desde un dominio publico sin constancia es un riesgo. |
| **No hay tests automatizados** | Cero. Ni unitarios, ni de integracion, ni de accesibilidad en CI. La validacion es manual midiendo el DOM. |
| **`sharp` esta en `ignoredBuiltDependencies`** | En Vercel lo resuelve la plataforma; en self-host habria que revisarlo. |
| **El CSS de los entregables esta duplicado byte a byte** | Cualquier cambio hay que hacerlo dos veces. |

---

## 13. Matriz de portabilidad (resumen)

Escala: N = nula, B = baja, M = media, A = alta.

| Pieza | Next.js | Tailwind | Lenis | React | Notas |
| --- | --- | --- | --- | --- | --- |
| Preloader | B | N | N | B | La mas portable. CSS puro mas dos timers. |
| Footer revelado | N | B | N | N | Cero JavaScript. Portable tal cual. |
| Sponsors | N | N | N | B | CSS puro con `mod()`/`round()`. |
| `plano.ts` (datos del mapa) | N | N | N | N | Modulo puro. Funciona en cualquier runtime JS. |
| Mapa (componente) | N | M | N | M | El SVG se puede pre-renderizar. |
| Entradas | N | M | M | M | Lenis solo para el modal. |
| Carrusel (`useCarruselCircular`) | N | B | N | **A** | Depende del batching de React. |
| Noticias (marcado) | N | M | N | M | Se descarta y se reemplaza. |
| Hero | **M** | B | N | M | `next/image` con `priority` y `sizes`. |
| Agenda | N | M | **A** | M | `useAvanceLinea` esta escrito contra `useLenis`. |
| Reveal | N | B | N | B | El CSS es agnostico; el observer es DOM puro. |
| Sistema de diseno (`@theme`) | N | **A** | N | N | Es Tailwind 4 puro. Sin Tailwind hay que convertir `@theme` a `:root` y regenerar las utilidades. |

### 13.1 Que haria falta para portarlo a Astro

**Lo que se lleva sin tocar**:

- Todo `globals.css` (Astro soporta Tailwind 4 con `@tailwindcss/vite`).
- `brand-mark-paths.ts`, `plano.ts`, todos los archivos de constantes.
- El footer (a `.astro` directo).
- El bloque CSS de Sponsors, el loader, el bento, los rieles.
- Los dos documentos de `docs/propuesta/`.
- Todo el tooling: ESLint (adaptando el config a Astro), Prettier, Husky, CI, `.gitattributes`, `vercel.json`.

**Lo que hay que reescribir**:

| Pieza | Reemplazo en Astro |
| --- | --- |
| `next/font/local` | `@font-face` a mano en CSS mas `<link rel="preload">`. Se pierde `adjustFontFallback` (habria que calcular las metricas con `fontaine` o similar). |
| `next/image` del hero | `<Image>` de `astro:assets` o `<picture>` con srcset. |
| `metadata` / `viewport` | Etiquetas `<meta>` en el layout `.astro`. |
| Script inline del layout | `<script is:inline>` en el `<head>`. Mas natural que en Next. |
| `LayoutProps<"/">` | Nada, Astro no lo necesita. |
| Componentes cliente | Islas con `client:visible` / `client:idle`, o scripts vanilla. |

**Decision estrategica**: casi todo lo interactivo del repo son 30 a 60 lineas de logica de DOM. Con Astro conviene:

- **Vanilla** para: loader, sponsors, reveal, scroll-progress, back-to-top, header, riel de medios, acordeon, pestanas de entradas.
- **Isla React** solo para: el carrusel circular (`useCarruselCircular`) y quizas el mapa, que es el unico con estado compartido entre dos controles.

**El acoplamiento a resolver primero es Lenis**: seis consumidores, pero solo cinco APIs. Si se conserva, Lenis funciona igual en Astro (es agnostico del framework, `lenis/react` es solo un wrapper). Si se descarta, `useAvanceLinea` de la agenda es el unico que pierde suavidad real.

### 13.2 Que haria falta para portarlo a otro setup con React (Vite, Remix, TanStack Start)

Practicamente nada. Solo `next/image`, `next/font/local` y el objeto `metadata`. Todo lo demas es React 19 estandar mas CSS.

---

## 14. Recomendaciones concretas para la fusion

### 14.1 Adoptar sin discusion (prioridad alta)

1. **`.gitattributes` completo**, antes de cualquier merge. Sin esto el primer diff entre los tres prototipos es ilegible.
2. **`AGENTS.md`, seccion "Trampas ya pisadas"**. Es conocimiento medido que ninguno de los tres repos va a volver a producir. Vale mas que cualquier componente.
3. **El sistema de diseno completo** (`globals.css` mas `/sistema-de-diseno`). Es el unico de los tres con trazabilidad de cada valor, y esa trazabilidad es argumento directo ante el jurado.
4. **`eslint.config.mjs` con las fronteras de capa.** Convierte una decision de arquitectura en un test.
5. **El CI de GitHub Actions tal cual**, incluidos los dos comentarios que explican el `pnpm/action-setup` sin version y el `!cancelled()`.
6. **La politica de mejora progresiva** (clase `.js` desde script inline, HTML servido en estado degradado). Es transversal: si se adopta una seccion sin ella, se rompe la coherencia.
7. **`brand-mark-paths.ts`** como fuente unica de la geometria del isologotipo, con sus dos derivados (mascara y favicon).

### 14.2 Adoptar con ajustes

| Pieza | Ajuste necesario |
| --- | --- |
| **Preloader** | Verificar que el `data-loader` y la clase `.js` no colisionen con el script de arranque del repo final. Revisar si los 3,1 s se mantienen (es el techo de Speed Index en movil). |
| **Hero** | Reemplazar el video por material de Jujuy. Regenerar las tres variantes con el comando de ffmpeg documentado. Volver a medir el velo contra el nuevo clip: los porcentajes salen del peor pixel del material actual. |
| **Agenda** | Decidir si se conserva Lenis. Si no, reescribir `useAvanceLinea`. Reajustar los presupuestos de texto si el cronograma real trae titulos largos. |
| **Mapa** | `plano.ts` va tal cual. Si el otro repo tiene geometria real, decidir cual manda. Si se pasa a trazado fiel de OSM, **reponer la atribucion ODbL en la interfaz**. |
| **Entradas** | Reemplazar precios. Verificar que la advertencia visible sobreviva. Cuidado con el orden de capas al portar `.entradas-panel`. |
| **Carrusel de Noticias** | Llevar solo `useCarruselCircular`. Respetar los tres contratos (ancho 80%, gap 1rem, `min-w-0`). Migrar tambien la copia duplicada de `about-section.tsx` o descartarla. |
| **Sponsors** | Va casi tal cual. Verificar soporte de `mod()`/`round()` en el baseline objetivo; si no, calcular fila y columna en JS. Si la lista real no trae 16 marcas, **hay que redecidir la grilla**. |
| **Footer** | Va tal cual, pero **volver a medir los dos umbrales de altura** si el footer final tiene mas contenido. |

### 14.3 Completar lo que falta

1. **JSON-LD tipo `Event`** en el layout.
2. **`sitemap.ts`, `robots.ts`, `manifest.ts`**.
3. **`og:image`**, preferiblemente generada desde `BRAND_PATHS` con `ImageResponse`.
4. **Constancia de licencia de Ambit** en el repo.
5. **Reemplazar `PlaceholderVisual` por fotografias reales** en las 7 secciones que lo usan.
6. **Sacar `class-variance-authority`** (dependencia muerta) y evaluar sacar `tw-animate-css`.
7. **Decidir el destino de `src/features/social/`** (feature vacio).
8. **Validar responsive de hero, agenda, nav y footer**, que quedaron sin validar.
9. **Probar el arrastre del bento en un telefono real.**
10. Si se conservan los entregables imprimibles: **extraer el CSS a un archivo compartido** y escribir un generador.

### 14.4 Riesgos a vigilar

| Riesgo | Mitigacion |
| --- | --- |
| Adoptar una seccion sin su bloque de `globals.css` | Cada seccion tiene CSS propio en `@layer components`. Migrar el componente sin el CSS deja la seccion rota o silenciosamente degradada. |
| Adoptar CSS sin respetar el orden de capas | Varias reglas del repo **dependen** de estar en `@layer components` y de que las utilidades vayan despues. Un `display` en utilidades rompe Entradas, Contacto y el loader. |
| Adoptar las utilidades `duration-*` a medias | Sin las cuatro declaraciones `@utility`, cada `duration-control` del codigo cae en silencio a 150ms. |
| Mezclar dos politicas de mejora progresiva | Si el repo final no agrega la clase `.js` antes del primer pintado, todas las secciones que dependen de ella quedan en el estado incorrecto. |
| Perder el `relative z-[1] bg-*` de `<main>` | El footer revelado deja de funcionar y sus enlaces pueden volverse inertes. |
| Copiar los presupuestos de texto sin medir | Los limites de caracteres estan calculados para el peor caso de **este** layout. Con otras tarjetas hay que rehacer la cuenta. |
| Duplicar contenido entre expositores y sponsors | Regla no automatizable: al tocar una lista, revisar la otra. |

---

## 15. Inventario rapido de archivos (referencia)

```
F:/GitHub/expojuy-prototipo/
|- .github/workflows/ci.yml
|- .husky/pre-commit, pre-push
|- .gitattributes, .gitignore, .prettierrc, .prettierignore
|- AGENTS.md (360 lineas), CLAUDE.md (1 linea: @AGENTS.md), README.md
|- eslint.config.mjs, next.config.ts, postcss.config.mjs, tsconfig.json
|- package.json, pnpm-lock.yaml, pnpm-workspace.yaml, vercel.json
|- docs/
|   |- 01-plan.md (129), 02-estado.md (337), 03-pendientes.md (352)
|   \- propuesta/
|       |- memoria-descriptiva-purple.html (198 KB, 433)
|       \- declaracion-ia-purple.html (80 KB, 320)
|- public/media/ (hero-1080.mp4, hero-1080.webm, hero-720.webm, hero-poster.jpg)
\- src/
    |- app/
    |   |- globals.css (1550)
    |   |- layout.tsx (103)
    |   |- page.tsx (89)
    |   \- sistema-de-diseno/page.tsx (244)
    |- features/
    |   |- about/       about-section.tsx (324), slides.ts (64)
    |   |- agenda/      agenda-section.tsx (70), linea-tiempo.tsx (90),
    |   |               actividad-fila.tsx (129), use-linea-tiempo.ts (136), actividades.ts (112)
    |   |- contact/     contact-section.tsx (307), campos.ts (121), use-formulario-contacto.ts (157)
    |   |- exhibitors/  exhibitors-section.tsx (217), expositores.ts (159), use-arrastre-riel.ts (128)
    |   |- faq/         faq-section.tsx (144), preguntas.ts (51)
    |   |- hero/        hero-section.tsx (119), hero-video.tsx (81), hero-rotador.tsx (79), media.ts (61)
    |   |- news/        news-section.tsx (209), noticias.ts (89)
    |   |- social/      (VACIO)
    |   |- sponsors/    sponsors-section.tsx (118), sponsors.ts (56), use-ficha-en-vista.ts (72)
    |   |- tickets/     tickets-section.tsx (435), entradas.ts (105)
    |   \- venue-map/   venue-map-section.tsx (485), plano.ts (397)
    \- shared/
        |- components/
        |   |- brand/   page-loader.tsx (89), loader-backdrop.tsx (27),
        |   |           brand-mark.tsx (58), brand-mark-paths.ts (161)
        |   |- layout/  site-header.tsx (182), site-footer.tsx (143),
        |   |           scroll-progress.tsx (42), back-to-top.tsx (53)
        |   |- motion/  reveal.tsx (75), smooth-scroll.tsx (37)
        |   \- ui/      boton-pausa.tsx (87), placeholder-visual.tsx (64)
        |- constants/   site.ts (85), storage.ts (17)
        |- fonts/       Ambit-{Light,Regular,SemiBold,Bold}.woff2, index.ts (28)
        |- hooks/       use-carrusel-circular.ts (108), use-active-section.ts (47),
        |               use-media-query.ts (39), use-prefers-reduced-motion.ts (27)
        \- lib/         cn.ts (11)
```

Total: 6331 lineas de TS/TSX, 1550 de CSS, 818 de documentacion markdown, 753 de HTML imprimible.
