# Analisis en profundidad: repositorio `expojuy-2026` (autor: Nacho)

Ruta analizada: `F:/GitHub/expojuy-2026`
Rama: `main`. Working tree limpio. Historial: 6 commits.

```
c0cb843 docs(memoria): redactar la memoria descriptiva de la propuesta
240fbc1 fix(header): sostener el velo del header hasta el final de la pagina
e365270 chore(auditoria): sumar Lighthouse por CLI sobre el build de produccion
76c0b89 feat(tema): modo claro/oscuro elegible por el visitante con preferencia recordada
cd313ae Control de animaciones con override del usuario
93bb9f1 primer commit
```

Sin `node_modules` instalado al momento del analisis. Todas las versiones citadas salen de `package.json` y de `package-lock.json`.

Naturaleza del proyecto: mockup navegable one-page (11 secciones) para el "Desafio Digital ExpoJuy 2026", etapa 1. No hay router: todo es scroll con anclas. Los datos son fixtures tipados en `src/data/*`, pensados para ser reemplazados por una API en etapa 2.

---

## 0. Indice

1. Tooling e infraestructura
2. Sistema de diseno: tokens y globals
3. Tema claro/oscuro
4. Sistema de movimiento (motion) y `prefers-reduced-motion`
5. Arquitectura general: entrypoints, providers, capas
6. Hooks, uno por uno
7. `src/lib/*`
8. Tipos y enums
9. Shape de todos los datos (`src/data/*`)
10. PIEZA ADOPTADA 1: seccion Expositores
11. PIEZA ADOPTADA 2: seccion Preguntas / FAQ + Accordion
12. PIEZA ADOPTADA 3: Navbar desktop, Navbar mobile y ScrollRail
13. Componentes UI reutilizables (API de props)
14. Componente artistico `SieteColores`
15. Preloader y Footer (comparativa, no adoptados)
16. Resto de secciones (relevamiento rapido)
17. Accesibilidad transversal
18. `docs/memoria-descriptiva.md`
19. `README.md`, `index.html`, `public/`
20. Hallazgos, bugs y deuda tecnica detectada
21. Notas de portabilidad consolidadas (Astro, Next + Tailwind)

---

## 1. Tooling e infraestructura

### 1.1 `package.json`

```json
{
  "name": "expojuy-2026",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "audit": "npm run build && node scripts/audit.mjs mobile desktop",
    "audit:mobile": "npm run build && node scripts/audit.mjs mobile",
    "audit:desktop": "npm run build && node scripts/audit.mjs desktop"
  }
}
```

Dependencias de produccion (rango declarado / version resuelta en el lock):

| Paquete | Rango | Lock | Rol |
|---|---|---|---|
| `@fontsource-variable/bricolage-grotesque` | ^5.3.0 | 5.3.0 | Fuente variable self-hosted, se importa desde `globals.css` |
| `@gsap/react` | ^2.1.2 | 2.1.2 | Hook `useGSAP` (cleanup automatico de tweens) |
| `gsap` | ^3.15.0 | 3.15.0 | Motor de animacion. Licencia "Standard no charge", desde registry.npmjs.org |
| `lenis` | ^1.3.26 | 1.3.26 | Scroll suave |
| `react` | ^19.2.8 | 19.2.8 | |
| `react-dom` | ^19.2.8 | 19.2.8 | |

DevDependencies:

| Paquete | Rango | Lock |
|---|---|---|
| `@types/node` | ^24.13.3 | |
| `@types/react` | ^19.2.18 | |
| `@types/react-dom` | ^19.2.4 | |
| `@vitejs/plugin-react` | ^6.1.0 | 6.1.1 |
| `lighthouse` | ^13.4.1 | 13.4.1 |
| `oxlint` | ^1.79.0 | 1.81.0 |
| `typescript` | ~6.0.2 | 6.0.3 |
| `vite` | ^8.2.2 | 8.2.2 |

Punto importante para la fusion: **GSAP 3.15 desde el registry publico**. Desde 3.13 todos los plugins (incluido `SplitText`, que antes era exclusivo de Club GreenSock) vienen en el paquete publico bajo la licencia "standard no charge". No hace falta token privado de npm ni `@gsap/business`. `SplitText` se importa como `gsap/SplitText`.

No hay tests, no hay CI, no hay Prettier ni ESLint clasico (solo oxlint), no hay Husky.

### 1.2 `vite.config.ts`

```ts
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

Config minima. Un solo alias `@ -> ./src`, usado de forma consistente en todo el codigo (no hay imports relativos profundos salvo dentro de la misma carpeta). Sin `base`, sin `build.rollupOptions`, sin chunking manual, sin PWA, sin compresion.

### 1.3 Los tres `tsconfig`

`tsconfig.json` es solo un proyecto raiz con referencias (solution style):

```json
{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }
```

`tsconfig.app.json` (cubre `src`):
- `target: es2023`, `lib: [ES2023, DOM, DOM.Iterable]`, `module: esnext`, `moduleResolution: bundler`
- `types: ["vite/client"]`, `allowArbitraryExtensions: true` (necesario para los `*.module.css`), `allowImportingTsExtensions`, `verbatimModuleSyntax`, `moduleDetection: force`, `noEmit`, `jsx: react-jsx`
- `paths: { "@/*": ["./src/*"] }`
- Linting duro: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, **`noUncheckedIndexedAccess: true`**

`noUncheckedIndexedAccess` explica varios patrones defensivos del codigo: `FAQ[0]?.id`, `MAP_PINS.find(...) ?? MAP_PINS[0]` seguido de `activePin && (...)`, `focusable[0]?.focus()`, `hill.dataset.night ?? ''`.

`tsconfig.node.json` (cubre solo `vite.config.ts`): `module: nodenext`, `types: ["node"]`, y suma `erasableSyntaxOnly: true`.

Detalle relevante para la fusion: **`erasableSyntaxOnly` NO esta activado en `tsconfig.app.json`**, y por eso el proyecto puede usar `enum` de TypeScript en `src/types/enums.ts`. Si la web final activa `erasableSyntaxOnly` (o migra a un runtime que solo hace type-stripping), **todos los enums habria que convertirlos a objetos `as const` + union types**. Es la incompatibilidad estructural mas probable de la fusion.

### 1.4 `.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

Configuracion minima: dos reglas explicitas mas los defaults de los tres plugins.

### 1.5 `.gitignore`

Estandar de Vite (logs, `node_modules`, `dist`, `dist-ssr`, `*.local`, editores) mas una linea propia:

```
# Reportes de auditoría (Lighthouse)
reports/
```

### 1.6 `scripts/audit.mjs`: como corre Lighthouse por CLI

Archivo: `F:/GitHub/expojuy-2026/scripts/audit.mjs`. ESM puro, solo builtins de Node. Flujo:

1. Constantes: `PORT = 4173`, `ORIGIN = http://localhost:4173`, `SERVER_TIMEOUT_MS = 60000`, `CATEGORIES = ['performance','accessibility','best-practices','seo']`.
2. `PROFILES`: `mobile` (sin flags extra, o sea el preset por defecto de Lighthouse: moto G, CPU 4x, 4G lento) y `desktop` (`--preset=desktop`).
3. `binOf(pkg, relative)` resuelve el entrypoint JS del paquete via `require.resolve(pkg + '/package.json')` y lo invoca con `process.execPath`. Evita depender de los shims `.cmd` de npm, o sea funciona igual en Windows y en POSIX.
4. `stamp()` genera `YYYY-MM-DD-HHmm` para nombrar los reportes de forma ordenable alfabeticamente.
5. Verifica que exista `dist/index.html`; si no, aborta pidiendo `npm run build`.
6. Verifica que **no** haya nada escuchando ya en el puerto 4173; si lo hay, aborta (para no auditar otro servidor por error).
7. Levanta `vite preview --port 4173 --strictPort` como proceso hijo con `stdio: ['ignore','ignore','inherit']`.
8. `waitForServer` hace polling cada 300 ms con `fetch(url, { signal: AbortSignal.timeout(1500) })`, **y ademas chequea `server.exitCode !== null`** para detectar que el preview se cayo en vez de esperar 60 s en vano.
9. Por cada perfil corre el CLI de Lighthouse:

```
node <lighthouse>/cli/index.js http://localhost:4173 [--preset=desktop] \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output=json \
  --output-path=reports/lighthouse/<perfil>-<stamp> \
  --chrome-flags="--headless=new --disable-gpu --hide-scrollbars" \
  --quiet
```

10. Lee el `.report.json`, extrae `categories[id].score`, lo multiplica por 100 y lo imprime; al final imprime una tabla resumen de los dos perfiles.
11. `finally` mata el preview. Ademas engancha `process.on('exit')` y `SIGINT` (sale con codigo 130).

Salida: `reports/lighthouse/<perfil>-<fecha>.report.html` y `.report.json` (carpeta ignorada por git).

Advertencia documentada en el README y que conviene arrastrar a la web final: **Chrome headless no hereda `prefers-reduced-motion` del sistema operativo**, asi que Lighthouse siempre audita con las animaciones prendidas. Es el peor caso, que es justo lo que conviene medir.

Este script es totalmente agnostico del framework. Solo asume que existe `dist/index.html` y que `vite preview` sirve en 4173. Portarlo a Astro es cambiar el comando del server; a Next es cambiar `vite preview` por `next start`.

### 1.7 `index.html`

```html
<!doctype html>
<html lang="es-AR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#17122B" />
    <meta name="description" content="ExpoJuy 2026: la exposicion productiva, comercial y tecnologica mas grande del Norte argentino. Agenda, expositores, mapa del predio y entradas." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>ExpoJuy 2026 · La expo del Norte</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

SEO presente: `lang="es-AR"`, `description`, `theme-color`, favicon SVG, title con separador `·`.

SEO **ausente**: no hay Open Graph, no hay Twitter Card, no hay `canonical`, no hay JSON-LD (seria natural un `schema.org/Event` para un evento con fechas y predio), no hay `sitemap.xml` (aunque `robots.txt` lo referencia), no hay preload de fuentes.

La fuente no se declara aca: entra por `@import '@fontsource-variable/bricolage-grotesque/standard.css'` en la primera linea de `globals.css`. Eso significa que el CSS de la fuente se resuelve en build (Vite lo hashea y lo inlinea en el bundle CSS) pero queda encadenado detras del CSS principal, no como preload en el `<head>`. En la web final conviene subirlo a `<link rel="preload" as="font" crossorigin>` para el peso de display.

### 1.8 `public/`

Tres archivos:

- `public/favicon.svg`: isologo simplificado en SVG (rect redondeado `#17122B` de fondo, los tres bloques `#3A8FBF`, `#F2564F`, `#9B6FA8` y la "U" `#B1B83A`). viewBox 64x64. Coincide visualmente con el componente `Logo`.
- `public/robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap: https://expojuy.com.ar/sitemap.xml`. Ojo: el sitemap referenciado **no existe** en el repo.
- `public/llms.txt`: archivo para agentes/LLM con el resumen del sitio y la lista de anclas de las 9 secciones navegables. Detalle barato de mantener; vale la pena conservarlo en la web final y actualizar las anclas si cambian.

---

## 2. Sistema de diseno: `src/styles/tokens.css` y `src/styles/globals.css`

### 2.1 `tokens.css`: inventario completo

Archivo: `F:/GitHub/expojuy-2026/src/styles/tokens.css` (113 lineas). Todo cuelga de `:root` mas dos bloques `[data-theme='dark']` y `[data-theme='light']`.

**Bases (4)**

| Token | Valor | Nota |
|---|---|---|
| `--c-noche` | `#17122b` | indigo profundo, "noche en el predio" |
| `--c-noche-2` | `#221a3d` | elevacion en tema oscuro |
| `--c-sal` | `#f2f1eb` | "salar", base clara |
| `--c-sal-2` | `#e8e6dd` | |

**Acentos, derivados de los cuatro bloques del isologo (9)**

| Token | Valor |
|---|---|
| `--c-cielo` | `#3a8fbf` |
| `--c-cielo-deep` | `#1f6a95` |
| `--c-coral` | `#f2564f` |
| `--c-coral-deep` | `#c93a34` |
| `--c-lila` | `#9b6fa8` |
| `--c-lila-deep` | `#6e4a7c` |
| `--c-oliva` | `#b1b83a` |
| `--c-oliva-deep` | `#6f7420` |
| `--c-ocre` | `#d9a441` (comentado: "solo para el arte de los cerros") |

**Semanticos, se redefinen por tema (13)**

| Token | Valor en `:root` / light | Valor en `[data-theme='dark']` |
|---|---|---|
| `--bg` | `var(--c-sal)` | `var(--c-noche)` |
| `--bg-elev` | `#ffffff` | `var(--c-noche-2)` |
| `--fg` | `var(--c-noche)` | `var(--c-sal)` |
| `--fg-muted` | `#524c66` | `rgba(242,241,235,.66)` |
| `--line` | `rgba(23,18,43,.14)` | `rgba(242,241,235,.16)` |
| `--line-strong` | `rgba(23,18,43,.4)` | `rgba(242,241,235,.45)` |
| `--accent` | `var(--c-cielo-deep)` | `#7fc0e6` |
| `--accent-contrast` | `#ffffff` | `var(--c-noche)` |
| `--focus` | `var(--c-cielo)` | `#9fd3f2` |
| `--cta` | `var(--c-coral)` | no se redefine |
| `--cta-hover` | `#ff7169` | no se redefine |
| `--cta-fg` | `var(--c-noche)` | no se redefine |

Comentario textual del archivo sobre el CTA, que vale conservar como decision de contraste medida: "CTA: texto oscuro sobre coral (5.6:1); con blanco no llega a AA".

**Tipografia (12)**

| Token | Valor |
|---|---|
| `--font-sans` | `'Bricolage Grotesque Variable', 'Segoe UI', system-ui, sans-serif` |
| `--fs-xs` | `0.8125rem` (13 px) |
| `--fs-sm` | `0.9375rem` (15 px) |
| `--fs-md` | `1.125rem` (18 px) |
| `--fs-lg` | `1.375rem` (22 px) |
| `--fs-xl` | `1.75rem` (28 px) |
| `--fs-2xl` | `clamp(2rem, 1.4rem + 2vw, 3rem)` |
| `--fs-3xl` | `clamp(2.75rem, 1.8rem + 4vw, 5.5rem)` |
| `--fs-display` | `clamp(4rem, 1rem + 15vw, 13rem)` |
| `--lh-tight` | `0.92` |
| `--lh-snug` | `1.1` |
| `--lh-body` | `1.55` |

**Espaciado y layout (13)**

| Token | Valor |
|---|---|
| `--space-1` | `0.25rem` (4 px) |
| `--space-2` | `0.5rem` (8) |
| `--space-3` | `0.75rem` (12) |
| `--space-4` | `1rem` (16) |
| `--space-5` | `1.5rem` (24) |
| `--space-6` | `2rem` (32) |
| `--space-7` | `3rem` (48) |
| `--space-8` | `4rem` (64) |
| `--space-9` | `6rem` (96) |
| `--section-y` | `clamp(6rem, 12vw, 11rem)` |
| `--gutter` | `clamp(1.25rem, 4vw, 4rem)` |
| `--container` | `90rem` (1440 px) |
| `--header-h` | `5rem` (80 px) |

**Radios (3, jerarquia explicita)**

| Token | Valor | Uso previsto |
|---|---|---|
| `--r-pill` | `999px` | botones, chips, toggles |
| `--r-panel` | `1.5rem` | tarjetas, placeholders |
| `--r-input` | `0.5rem` | campos (declarado pero no usado, ver seccion 20) |

**Motion (5)**

| Token | Valor |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | `180ms` |
| `--dur-base` | `320ms` |
| `--dur-slow` | `700ms` |

**Capas / z-index (4)**

| Token | Valor |
|---|---|
| `--z-rail` | `30` |
| `--z-header` | `40` |
| `--z-menu` | `50` |
| `--z-preloader` | `60` |

El skip link usa `calc(var(--z-preloader) + 1)` = 61, o sea es la capa mas alta del sitio.

Total: **60 tokens declarados**. De esos, **7 estan declarados y nunca se usan**: `--accent-contrast`, `--c-coral-deep`, `--c-lila-deep`, `--c-oliva-deep`, `--c-ocre`, `--ease-in-out`, `--r-input` (verificado por diff entre declarados y `var(--x)` usados).

Custom properties locales (no del sistema global) que definen componentes puntuales:

- `--sky-top`, `--sky-bottom` en `SieteColores.module.css` (GSAP las anima para el paso de dia a noche)
- `--track-inset` en `Axes.module.css`
- `--tone` (Exhibitors, Placeholder), `--axis-color` (Axes, Agenda), `--pin-color` (VenueMap), `--ratio` (Placeholder), `--marquee-duration` (Marquee), `--hero-scroll` (Hero): todas inyectadas desde el TSX via `style` inline casteado a `CSSProperties`.

El patron de inyeccion es siempre el mismo y conviene documentarlo como convencion:

```tsx
const style = { '--tone': toneVar(SECTOR_TONE[exhibitor.sector]) } as CSSProperties
```

El cast a `CSSProperties` es necesario porque TypeScript no acepta custom properties en el tipo de `style`.

### 2.2 `globals.css`: contenido completo por bloques

Archivo: `F:/GitHub/expojuy-2026/src/styles/globals.css` (203 lineas).

1. **Imports** (lineas 1-2): la fuente variable y `./tokens.css`.
2. **Reset minimo** (5-71): `box-sizing: border-box` global; `html { -webkit-text-size-adjust: 100%; scroll-behavior: auto }` (comentado: "Lenis se encarga del scroll suave"); `body` con `background: var(--c-noche)` (fijo, no `--bg`, para que el fondo detras del preloader sea siempre noche), `color: var(--fg)`, `font-family: var(--font-sans)`, `font-size: var(--fs-md)`, `line-height: var(--lh-body)`, `font-variation-settings: 'wdth' 100, 'opsz' 14`, antialias, `text-rendering: optimizeLegibility`, `overflow-x: clip`. Reset de margenes en headings/p/listas/figure, listas sin bullets ni padding, `img/svg/video { display:block; max-width:100% }`, `button/input/select/textarea { font: inherit; color: inherit }`, `button` sin fondo ni borde y con `cursor:pointer`, `a { color: inherit; text-decoration: none }`.
3. **Foco y seleccion** (73-82): `:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 4px }` y `::selection { background: var(--c-cielo); color: #fff }`.
4. **Lenis** (84-97): las cuatro reglas que pide la libreria (`html.lenis`, `.lenis-smooth`, `[data-lenis-prevent]`, `.lenis-stopped { overflow: hidden }`). Estan copiadas a mano en vez de importar `lenis/dist/lenis.css`. Detalle a recordar si en la fusion se actualiza Lenis.
5. **Tipografia utilitaria** (99-137): clases **globales** `.t-display`, `.t-title`, `.t-lead`, `.t-body`, `.t-label`, `.t-muted`. Son el unico uso de clases globales fuera de CSS Modules y se combinan con `cn('t-title', styles.title)`. Cada una fija `font-variation-settings` distinto sobre la misma familia variable:
   - `.t-display`: weight 800, `'wdth' 75, 'opsz' 96`, `line-height: var(--lh-tight)`, `letter-spacing: -0.015em`, `text-wrap: balance`
   - `.t-title`: weight 700, `'wdth' 82, 'opsz' 60`, `line-height: var(--lh-snug)`, `letter-spacing: -0.01em`, `text-wrap: balance`
   - `.t-lead`: `font-size: var(--fs-lg)`, `line-height: 1.4`, `text-wrap: pretty`, `max-width: 34ch`
   - `.t-body`: `max-width: 62ch`, `text-wrap: pretty`
   - `.t-label`: `--fs-xs`, weight 600, `letter-spacing: 0.02em`
   - `.t-muted`: `color: var(--fg-muted)`
6. **Layout** (139-172): `.container { width: min(100% - 2 * var(--gutter), var(--container)); margin-inline: auto }`, `.visually-hidden` (patron clip clasico con `!important` en `position`) y `.skip-link` (fixed, z-index 61, `translateY(-200%)` hasta `:focus-visible`).
7. **Motion** (174-203), tres reglas clave:

```css
:root[data-motion='ok'] [data-reveal] { visibility: hidden; }

@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion='ok']) *,
  :root:not([data-motion='ok']) *::before,
  :root:not([data-motion='ok']) *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:root[data-motion='reduce'] *,
:root[data-motion='reduce'] *::before,
:root[data-motion='reduce'] *::after { /* mismo bloque */ }
```

La logica es fina y conviene entenderla antes de fusionar:

- `[data-reveal]` solo se oculta **si el JS ya escribio `data-motion="ok"`**. Sin JS, o con motion reducido, el contenido nunca queda invisible. Es la garantia de que un fallo de GSAP no deja texto en blanco.
- Regla 1 (media query): cubre "el sistema pidio menos movimiento y el usuario no lo sobreescribio", **incluye el caso sin JS** donde `data-motion` jamas se escribe.
- Regla 2 (atributo): cubre "el usuario apago el movimiento desde el control del sitio", gane lo que gane el sistema operativo.

Al fusionar hay riesgo bajo de colision con el prefijo `t-` (es propio) pero **`.container` es un nombre muy generico** y es el candidato numero uno a chocar si otro prototipo trae Bootstrap, Tailwind container o clases propias.

---

## 3. Tema claro/oscuro

Piezas: `src/constants/theme.ts`, `src/lib/theme.ts`, `src/hooks/useTheme.ts`, `src/components/ui/ThemeToggle.tsx` (+ `.module.css`), `src/types/enums.ts` (`Theme`, `ThemePreference`), `src/components/ui/Section.tsx`.

### 3.1 Modelo conceptual

Hay **dos conceptos distintos** y el codigo los separa bien:

- `Theme` (`'light' | 'dark'`): el tema con el que se **diseno** una seccion. Vive en `SECTIONS[].theme` (`src/constants/navigation.ts`).
- `ThemePreference` (`'auto' | 'light' | 'dark'`): lo que **eligio el visitante**. `auto` respeta el ritmo claro/oscuro por seccion; `light`/`dark` uniforman todo el sitio.

La resolucion es una funcion pura:

```ts
export const resolveTheme = (designed: Theme, pref: ThemePreference = preference): Theme => {
  if (pref === ThemePreference.Light) return Theme.Light
  if (pref === ThemePreference.Dark) return Theme.Dark
  return designed
}
export const invertTheme = (theme: Theme): Theme => (theme === Theme.Dark ? Theme.Light : Theme.Dark)
```

Y hay un escape: `themeLocked` en `SectionMeta` y en `Section`. El hero es de noche siempre, gane lo que gane la preferencia.

### 3.2 `src/lib/theme.ts`: el store

Store **externo a React**, con la misma forma que `lenis-store.ts` y `motion.ts`. Estado a nivel de modulo:

```ts
let preference: ThemePreference = ThemePreference.Auto
let initialised = false
const listeners = new Set<Listener>()
```

- `readStored()` / `writeStored()` envuelven `localStorage` en `try/catch` (modo privado o cookies bloqueadas no rompen nada). Clave: `expojuy:theme` (`THEME_STORAGE_KEY`). `Auto` **borra** la clave en vez de escribir `'auto'`.
- `apply(next)` hace tres cosas: guarda la preferencia, escribe `document.documentElement.dataset.themePreference = next`, y setea `root.style.colorScheme` a `'light dark'` (auto) o al valor elegido, para que los controles nativos (select, scrollbars) acompanen. Despues notifica a los listeners.
- `init()` es idempotente y lo llama `main.tsx` **antes** del primer render, asi no hay parpadeo.
- API publica: `themeStore = { init, subscribe, getPreference, setPreference }`.

Detalle: `data-theme-preference` se escribe en `<html>` pero **ningun CSS lo lee**. Es informativo. Los tokens los cambia el `data-theme` que cada componente escribe en su propio nodo.

### 3.3 `src/hooks/useTheme.ts`

```ts
export const useThemePreference = (): ThemePreference =>
  useSyncExternalStore(themeStore.subscribe, themeStore.getPreference, getServerPreference)

export const useTheme = (): ThemeState => ({ preference: useThemePreference(), setPreference: themeStore.setPreference })

export const useResolvedTheme = (designed: Theme): Theme => resolveTheme(designed, useThemePreference())
```

`useSyncExternalStore` es la eleccion correcta: React 19, concurrent-safe, con `getServerSnapshot` que devuelve `Auto`.

### 3.4 `src/constants/theme.ts`

```ts
export const THEME_STORAGE_KEY = 'expojuy:theme'
export const THEME_COLOR: Record<Theme, string> = {
  [Theme.Dark]: '#17122b',
  [Theme.Light]: '#f2f1eb',
}
```

**`THEME_COLOR` esta declarado y no se usa en ningun lado** (verificado por grep sobre todo `src/`). La intencion evidente era sincronizar `<meta name="theme-color">` con el tema activo. Es una mejora de pocas lineas que conviene terminar en la web final.

### 3.5 `ThemeToggle.tsx`: dos componentes en un archivo

`ThemeToggle` (usado en `MenuOverlay` y `Footer`): un `role="group"` con `aria-label="Tema"` y tres `<button>` con `aria-pressed`. Opciones: "Por seccion" (`Auto`), "Claro", "Oscuro". Decision documentada en el codigo: usa `aria-pressed` y no semantica de tabs porque es una preferencia, no una navegacion.

`ThemeQuickToggle` (usado en el `Header`): un solo boton circular de 2.75rem con icono sol/luna:

```ts
const active = useActiveTheme()   // tema de lo que hay DEBAJO del header
const isDark = preference === ThemePreference.Auto ? active === Theme.Dark : preference === ThemePreference.Dark
const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
onClick={() => setPreference(isDark ? ThemePreference.Light : ThemePreference.Dark)}
```

En `Auto` muestra el estado de la seccion actual, y al tocarlo **sale de `Auto` para siempre**: no hay forma de volver a `Auto` desde el header, solo desde el menu o el pie. Es una decision de UX consciente pero conviene tenerla presente al fusionar.

`SunIcon` y `MoonIcon` son SVG inline definidos en el mismo archivo, 18x18, `currentColor`, `stroke-width 1.8`.

### 3.6 Como llega a los pixeles

`Section.tsx` es el punto de aplicacion:

```tsx
const resolved = useResolvedTheme(theme)
<section data-theme={themeLocked ? theme : resolved} ...>
```

Y `tokens.css` tiene `[data-theme='dark'] { ... }` / `[data-theme='light'] { ... }` que redefinen los semanticos. Como son atributos, **anidan**: la tarjeta destacada de Entradas lleva `data-theme={invertTheme(sectionTheme)}` y todo lo de adentro se invierte sin una sola clase extra. Lo mismo hace el panel "De noche" de la agenda (`data-theme={TRACK_THEME[option.value]}`).

Elementos que tambien escriben `data-theme` por su cuenta: `Header` (con `useActiveTheme()`), `ScrollRail` (idem), `MenuOverlay` (`useResolvedTheme(Theme.Dark)`), `Footer` (idem), `TicketCard` (invertido), panel de `Agenda`.

**Valoracion:** probablemente el mejor sistema de tema de los tres prototipos si los otros no traen algo equivalente. Es CSS puro, sin runtime, sin clases `dark:`, anidable, y con override del usuario persistido. Portarlo a Tailwind requiere `darkMode: ['variant', '&:where([data-theme=dark], [data-theme=dark] *)']` mas mapear los semanticos a `theme.extend.colors`.

---

## 4. Sistema de movimiento (motion) y `prefers-reduced-motion`

Es, junto con el tema, la pieza mas madura del repo. Piezas: `src/constants/animation.ts`, `src/lib/motion.ts`, `src/hooks/useMotion.ts`, `src/components/ui/MotionToggle.tsx`, las tres reglas de `globals.css` ya citadas, y la guarda `if (!motionEnabled) return` que tiene casi cada hook y componente animado.

### 4.1 `src/lib/motion.ts`

Store externo, mismo patron que `theme.ts`. Estado:

```ts
let preference: MotionPreference = MotionPreference.System
let enabled = false
let initialised = false
```

- `MotionPreference` (enum): `System` | `Full` | `Reduced`.
- `systemAllowsMotion()` = `window.matchMedia('(prefers-reduced-motion: no-preference)').matches`.
- `resolve(value)` = si es `System`, mira la media query; si no, `value === Full`.
- `apply(next)` escribe **`document.documentElement.dataset.motion = enabled ? 'ok' : 'reduce'`** y notifica.
- `init()` lee `localStorage` (clave `expojuy:motion`), aplica, y **suscribe un listener a la media query** que re-aplica solo si la preferencia sigue en `System`. O sea el sitio reacciona en vivo si el usuario cambia el ajuste del SO.
- API: `motionStore = { init, subscribe, isEnabled, getPreference, setPreference }`.

Se inicializa en `main.tsx` antes de `createRoot`, o sea el atributo esta en el DOM antes del primer paint.

### 4.2 `src/hooks/useMotion.ts`

Dos hooks:

- `useMotion(): { enabled, preference, setPreference }`, para el control.
- `useMotionEnabled(): boolean`, el que consumen todos los hooks de animacion. Al cambiar, cada `useGSAP` que lo tenga en `dependencies` con `revertOnUpdate: true` **se rearma o se limpia solo**.

### 4.3 `src/constants/animation.ts`: inventario

| Constante | Valor | Uso |
|---|---|---|
| `MOTION_OK` | `'(prefers-reduced-motion: no-preference)'` | media query base |
| `MOTION_STORAGE_KEY` | `'expojuy:motion'` | |
| `DESKTOP_QUERY` | `'(min-width: 64rem)'` | leido con `useMediaQuery` en Hero y Axes |
| `EASE` | `{ out:'power3.out', inOut:'power2.inOut', expo:'expo.out', none:'none' }` | strings de GSAP |
| `DURATION` | `{ fast:0.35, base:0.7, slow:1.2 }` | segundos (unidad de GSAP) |
| `STAGGER` | `{ lines:0.09, items:0.06, words:0.02 }` | |
| `REVEAL_START` | `'top 85%'` | posicion de ScrollTrigger |
| `LENIS_OPTIONS` | `{ lerp:0.09, smoothWheel:true, wheelMultiplier:1 }` | |
| `SCROLL_OFFSET` | `-72` | offset de anclas para no quedar tapadas por el header |
| `HERO_SCROLL_LENGTH` | `1.6` | viewports extra que mide el hero |
| `PRELOADER` | `{ counter:1.6, exit:0.9 }` | |

Nota: `--dur-fast/base/slow` (CSS, ms) y `DURATION.fast/base/slow` (GSAP, segundos) **son escalas distintas** (180/320/700 ms contra 350/700/1200 ms). No estan sincronizadas. Inconsistencia menor pero real si se busca coherencia de sensacion en la web final.

### 4.4 `MotionToggle.tsx`

`<button role="switch" aria-checked={enabled}>` con track/thumb dibujados en CSS y tres spans: el track (aria-hidden), el label visible "Animaciones" y el estado "Activadas"/"Desactivadas" (aria-hidden, porque el estado ya lo comunica `aria-checked`). Al tocarlo:

```ts
setPreference(enabled ? MotionPreference.Reduced : MotionPreference.Full)
```

Nunca vuelve a `System` desde la UI. El toggle vive en `MenuOverlay` y en `Footer`.

Ademas, `Hero.tsx` agrega un boton **"Activar animaciones"** que solo aparece si `!motionEnabled`, con este razonamiento en el codigo: es el unico lugar donde el visitante no puede intuir que se esta perdiendo algo.

### 4.5 Como reacciona el arbol

`App.tsx`:

```tsx
const motionEnabled = useMotionEnabled()
useEffect(() => { ScrollTrigger.refresh() }, [motionEnabled])
```

Encender o apagar el movimiento cambia alturas reales (el runway del hero mide `calc(100svh * (1 + 1.6))` solo con `data-motion='ok'`; la seccion de ejes fija su `height` por JS). Este efecto corre despues de los efectos de layout de los hijos, o sea cuando ellos ya rearmaron sus triggers.

CSS que cuelga de `data-motion`:

- `globals.css`: `[data-reveal]` oculto y los dos bloques de kill-switch.
- `Hero.module.css`: `:root[data-motion='ok'] .hero { height: calc(100svh * (1 + var(--hero-scroll,1.6))) }`.
- `Axes.module.css`: dentro de `@media (min-width:64rem)`, tres reglas `:root[data-motion='ok'] .viewport/.track/.panel` que activan el sticky y el track horizontal.
- `Marquee.module.css`: cuatro reglas `:root:not([data-motion='ok'])` que convierten la cinta en una lista que envuelve y esconden la copia duplicada.

**Valoracion:** sistema de motion de nivel produccion. Lo replicable en cualquier stack: un atributo en `<html>` como fuente de verdad, con override del usuario persistido, leido tanto por CSS como por JS. La parte atada a React es solo `useSyncExternalStore`; el store es JS plano y se copia tal cual a Astro o Next, con un script inline en el head para el `init` pre-paint.

---

## 5. Arquitectura general

### 5.1 `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { motionStore } from '@/lib/motion'
import { themeStore } from '@/lib/theme'
import App from './App'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el nodo #root')

motionStore.init()
themeStore.init()

createRoot(container).render(<StrictMode><App /></StrictMode>)
```

Orden deliberado: CSS, luego los dos `init()` **antes** de `createRoot`. `StrictMode` esta activo, lo que fuerza doble montaje en dev; varios hooks tienen `revertOnUpdate: true` justamente por eso (comentado en `useSplitReveal`).

### 5.2 `src/App.tsx`

Composicion plana, sin router:

```tsx
<LenisProvider>
  <ScrollSpyProvider>
    <a href="#main" className="skip-link">Ir al contenido</a>
    <Preloader onComplete={onPreloaderComplete} />
    <Header ready={ready} menuOpen={menuOpen} onOpenMenu={openMenu} />
    <MenuOverlay open={menuOpen} onClose={closeMenu} />
    <ScrollRail ready={ready} />
    <main id="main">
      <Hero ready={ready} /> <About /> <Axes /> <Agenda /> <Exhibitors />
      <VenueMap /> <News /> <Tickets /> <Sponsors /> <Faq /> <Contact />
    </main>
    <Footer />
  </ScrollSpyProvider>
</LenisProvider>
```

Estado en `App`: `ready` (el preloader termino) y `menuOpen`. Nada mas. Los callbacks van con `useCallback`.

Dos `ScrollTrigger.refresh()` explicitos:

- en `useEffect` sobre `[motionEnabled]`
- en `onPreloaderComplete` (el preloader tapaba el layout)

**Nota de fusion importante:** el estado del menu vive en `App`, no en `Header` ni en `MenuOverlay`. `Header` recibe `menuOpen` solo para el `aria-expanded`; el que dispara es `onOpenMenu`. Si el otro repo aporta el menu mobile, ese contrato (`open` / `onClose` levantados al padre) es el que hay que respetar o rehacer explicitamente.

### 5.3 Providers

**`src/providers/lenis-store.ts`** (22 lineas): store minimo (`instance`, `listeners: Set`) con `get/set/subscribe`. Existe porque Lenis es un sistema externo, no estado de React.

**`src/providers/lenis-context.ts`**: define `ScrollTarget = string | number | HTMLElement` y `LenisContextValue { lenis: Lenis|null, scrollTo(target, immediate?), stop(), start() }`. Context inicializado en `null` para que `useLenis` pueda tirar error si falta el provider.

**`src/providers/LenisProvider.tsx`**: el corazon del scroll.

```tsx
const lenis = useSyncExternalStore(lenisStore.subscribe, lenisStore.get, getServerSnapshot)
const motionEnabled = useMotionEnabled()

useEffect(() => {
  if (!motionEnabled) return              // sin movimiento, Lenis NI SE INSTANCIA
  const instance = new Lenis({ ...LENIS_OPTIONS })
  const tick = (time: number) => instance.raf(time * 1000)
  instance.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  lenisStore.set(instance)
  return () => { gsap.ticker.remove(tick); instance.destroy(); lenisStore.set(null) }
}, [motionEnabled])
```

Y el fallback nativo, que es lo que hace que todo el sitio siga funcionando sin Lenis:

```ts
const nativeScrollTo = (target: ScrollTarget): void => {
  if (typeof target === 'number') { window.scrollTo({ top: target }); return }
  const element = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  element?.scrollIntoView({ block: 'start' })
}
```

`value` memoizado sobre `[lenis]`: `scrollTo` usa Lenis con `{ offset: SCROLL_OFFSET, immediate }` o cae al nativo; `stop`/`start` son no-ops si no hay instancia (`lenis?.stop()`).

Un solo reloj: `gsap.ticker` maneja el rAF y le pasa el tiempo a Lenis (`time * 1000` porque el ticker de GSAP da segundos y Lenis espera milisegundos). `lagSmoothing(0)` desactiva el suavizado de lag de GSAP, que si no pelea con Lenis.

Caveat del fallback: `nativeScrollTo` con un selector usa `scrollIntoView({ block: 'start' })`, o sea **pierde el offset de -72 px del header**. Con el movimiento apagado, las anclas quedan tapadas por el header fijo. Se arregla con `scroll-margin-top` en las secciones. Es un bug real y facil de corregir (ver seccion 20).

**`src/providers/scroll-spy-context.ts`**: `ScrollSpyValue { activeId: SectionId, theme: Theme, themeLocked: boolean }` con `INITIAL_SCROLL_SPY = { activeId: Hero, theme: Dark, themeLocked: true }`.

**`src/providers/ScrollSpyProvider.tsx`**: un `ScrollTrigger` por seccion.

```tsx
const SPY_LINE = '48px'
useGSAP(() => {
  SECTIONS.forEach((section) => {
    const element = document.getElementById(section.id)
    if (!element) return
    ScrollTrigger.create({
      trigger: element,
      start: `top ${SPY_LINE}`,
      end: `bottom ${SPY_LINE}`,
      onToggle: (self) => {
        if (self.isActive) setValue({ activeId: section.id, theme: section.theme, themeLocked: section.themeLocked ?? false })
      },
    })
  })
  gsap.delayedCall(0.1, () => ScrollTrigger.refresh())
})
```

Clave de performance documentada en el codigo: **solo hace `setState` cuando cambia la seccion activa**, no en cada frame. `onToggle` con `isActive` es el mecanismo. La linea de deteccion esta a 48 px del top del viewport. El `delayedCall(0.1)` recalcula una vez despues del montaje porque las secciones con sticky cambian de alto.

### 5.4 Separacion de capas

| Carpeta | Contenido | Dependencia de React |
|---|---|---|
| `src/types/` | 2 archivos: `enums.ts` (17 enums) y `index.ts` (14 interfaces) | **Ninguna**. Portable a cualquier stack. |
| `src/constants/` | 6 archivos: `animation`, `event`, `labels`, `navigation`, `routes`, `theme` | **Ninguna**. Solo importan tipos. |
| `src/data/` | 10 archivos de fixtures tipados | **Ninguna**. |
| `src/lib/` | 9 archivos de helpers | Solo `gsap.ts` importa `@gsap/react`; el resto es JS puro (algunos tocan `window`/`document`). |
| `src/hooks/` | 14 hooks | Total, por definicion. |
| `src/providers/` | 5 archivos (2 contexts, 2 providers, 1 store) | `lenis-store.ts` es JS puro; el resto es React. |
| `src/components/` | `layout/` (5), `ui/` (12), `art/` (1), `sections/` (11) | Total. |
| `src/styles/` | 2 archivos | Ninguna. |

Regla real, verificada por lectura: **`data/` nunca importa de `components/`, `lib/` nunca importa de `components/`, `constants/` solo importa de `types/`**. La unica excepcion a la pureza en `lib/` es `lib/exhibitors.ts`, que importa `SECTOR_LABEL` de `constants/labels` (razonable: la busqueda tiene que matchear tambien contra el texto visible del rubro).

---

## 6. Hooks, uno por uno

Todos viven en `F:/GitHub/expojuy-2026/src/hooks/`. Hay 14 archivos.

### 6.1 `useMotion.ts` (`useMotion`, `useMotionEnabled`)

- **Que hace:** expone el store de motion a React.
- **API:** `useMotion(): { enabled: boolean, preference: MotionPreference, setPreference(v) }` y `useMotionEnabled(): boolean`.
- **Mecanismo:** dos `useSyncExternalStore` sobre `motionStore`, con `getServerEnabled = () => false` y `getServerPreference = () => System`.
- **Dependencias:** `@/lib/motion`, `@/types`.
- **Reutilizable fuera de React DOM:** el store si (JS plano); el hook no.

### 6.2 `useTheme.ts` (`useThemePreference`, `useTheme`, `useResolvedTheme`)

- **Que hace:** lo mismo para el tema, mas la resolucion por seccion.
- **API:** `useThemePreference(): ThemePreference`; `useTheme(): { preference, setPreference }`; `useResolvedTheme(designed: Theme): Theme`.
- **Mecanismo:** `useSyncExternalStore` mas la funcion pura `resolveTheme`.
- **Nota de estilo:** `useResolvedTheme` llama a `useThemePreference()` dentro de la expresion de retorno (`resolveTheme(designed, useThemePreference())`), lo cual es legal pero poco convencional.

### 6.3 `useLenis.ts`

```ts
export const useLenis = (): LenisContextValue => {
  const context = useContext(LenisContext)
  if (!context) throw new Error('useLenis debe usarse dentro de <LenisProvider>')
  return context
}
```

- **API:** devuelve `{ lenis, scrollTo, stop, start }`.
- **Dependencias:** el `LenisProvider` tiene que estar arriba en el arbol. **Lo consumen `useBodyLock` y `useAnchorClick`**, o sea cualquier componente que use anclas o body lock arrastra el provider.
- **Portabilidad:** es el punto de acoplamiento mas duro de las tres piezas adoptadas. Ver secciones 12.6 y 21.

### 6.4 `useScrollSpy.ts` (`useScrollSpy`, `useActiveTheme`)

```ts
export const useScrollSpy = (): ScrollSpyValue => useContext(ScrollSpyContext)

export const useActiveTheme = (): Theme => {
  const { theme, themeLocked } = useScrollSpy()
  const preference = useThemePreference()
  return themeLocked ? theme : resolveTheme(theme, preference)
}
```

- **Que hace:** lee la seccion activa (y su tema) del context. `useActiveTheme` combina eso con la preferencia global, respetando `themeLocked`.
- **Consumidores:** `Header`, `ScrollRail`, `ThemeQuickToggle`.
- **Dependencias:** `ScrollSpyProvider`, que a su vez depende de GSAP ScrollTrigger.
- **Portabilidad:** el consumo es trivial; el productor es lo que hay que reemplazar. Con `IntersectionObserver` y `rootMargin: '-48px 0px -100% 0px'` se logra un equivalente sin GSAP.

### 6.5 `useFocusTrap.ts`

```ts
const FOCUS_DELAY_MS = 60

export const useFocusTrap = (ref: RefObject<HTMLElement|null>, active: boolean): void => {
  useEffect(() => {
    const container = ref.current
    if (!active || !container) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => getFocusable(container)[0]?.focus(), FOCUS_DELAY_MS)
    const onKeyDown = (event: KeyboardEvent) => trapTabKey(container, event)
    container.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      container.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [ref, active])
}
```

- **Que hace:** al activarse mueve el foco al primer focusable, lo mantiene adentro al tabular, y al desactivarse lo devuelve al elemento que lo tenia.
- **Mecanismo exacto:** `setTimeout(60 ms)` para dar tiempo a que la animacion de apertura revele el contenedor (un `focus()` sobre algo con `visibility:hidden` no funciona). El listener va **sobre el contenedor**, no sobre `document`, o sea solo captura Tab cuando el foco ya esta adentro. La logica de wrap esta en `lib/dom.ts` (`trapTabKey`).
- **APIs del navegador:** `document.activeElement`, `HTMLElement.focus()`, `KeyboardEvent.key`, `KeyboardEvent.shiftKey`, `preventDefault()`.
- **Limitaciones conocidas:** `getFocusable` hace un `querySelectorAll` estatico en cada Tab; no filtra elementos ocultos por CSS ni por `inert`, no maneja shadow DOM ni `contenteditable`, no cubre `iframe`. Para el uso real (un menu de anclas y botones) alcanza.
- **Reutilizable fuera de React:** la logica si (`trapTabKey` es funcion pura sobre el DOM). El hook no.

### 6.6 `useBodyLock.ts`

```ts
export const useBodyLock = (locked: boolean): void => {
  const { stop, start } = useLenis()
  useEffect(() => {
    if (!locked) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    stop()
    return () => {
      document.documentElement.style.overflow = previousOverflow
      start()
    }
  }, [locked, stop, start])
}
```

- **Que hace:** frena scroll nativo **y** Lenis.
- **Mecanismo exacto:** `overflow:hidden` sobre `<html>` (no sobre `<body>`), guardando el valor previo para restaurarlo. `stop()`/`start()` son los de Lenis (no-ops si Lenis no existe porque el movimiento esta apagado).
- **Lo que NO hace:** no compensa el ancho de la scrollbar (en Windows con scrollbar clasica se ve un salto lateral al abrir el menu), no usa `position:fixed` sobre body (o sea en iOS Safari el fondo puede seguir haciendo bounce), y no lleva contador de locks anidados: si el `Preloader` y el `MenuOverlay` estuvieran lockeados a la vez, el primero en desmontarse restauraria el overflow. En la practica no se superponen.
- **Dependencia dura:** `useLenis()`, o sea `LenisProvider`. Para portar el menu sin Lenis hay que reemplazar `stop`/`start` por no-ops.

### 6.7 `useEscapeKey.ts`

```ts
export const useEscapeKey = (onEscape: () => void, active = true): void => {
  useEffect(() => {
    if (!active) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onEscape, active])
}
```

Trivial y correcto. Listener en `window`, o sea funciona aunque el foco no este adentro del dialogo. Requiere que `onEscape` sea estable; en `App` lo es (`useCallback`).

### 6.8 `useAnchorClick.ts`

```ts
export const useAnchorClick = (onNavigate?: () => void) => {
  const { scrollTo } = useLenis()
  return useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href?.startsWith('#')) return
    event.preventDefault()
    onNavigate?.()
    scrollTo(href)
    window.history.pushState(null, '', href)
  }, [scrollTo, onNavigate])
}
```

- **Que hace:** intercepta clicks en `<a href="#...">`, hace scroll suave con offset de header y actualiza la URL sin salto.
- **Mecanismo:** `event.currentTarget.getAttribute('href')` (no `.href`, que devolveria la URL absoluta), `preventDefault`, `scrollTo(selector)` que internamente aplica `offset: -72`, y `history.pushState` para que la URL quede compartible.
- **Detalle util para el menu:** el parametro `onNavigate` es como el `MenuOverlay` se cierra al hacer click en un link (`useAnchorClick(onClose)`).
- **Faltantes:** no verifica que el ancla exista, no maneja Ctrl/Cmd + click ni click con boton del medio (con `preventDefault` incondicional, "abrir en pestana nueva" sobre un ancla queda roto, aunque para anclas internas el impacto practico es nulo).

### 6.9 `useMediaQuery.ts`

```ts
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

Implementacion canonica. Usado en `Hero` y `Axes` con `DESKTOP_QUERY`. Detalle: `getSnapshot` crea un `MediaQueryList` nuevo en cada llamada; funciona porque devuelve un booleano (primitivo, sin problema de identidad referencial), pero es levemente ineficiente.

### 6.10 `useSplitReveal.ts`

```ts
export const useSplitReveal = <T extends HTMLElement>({ start = REVEAL_START, delay = 0 } = {}) => {
  const ref = useRef<T>(null)
  const motionEnabled = useMotionEnabled()
  useGSAP(() => {
    const element = ref.current
    if (!element || !motionEnabled) return
    const split = SplitText.create(element, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => {
        gsap.set(element, { visibility: 'visible' })
        return gsap.fromTo(self.lines, { yPercent: 110 }, {
          yPercent: 0, duration: DURATION.base, ease: EASE.expo, stagger: STAGGER.lines, delay,
          scrollTrigger: { trigger: element, start, once: true, fastScrollEnd: true },
        })
      },
    })
    return () => split.revert()
  }, { scope: ref, dependencies: [start, delay, motionEnabled], revertOnUpdate: true })
  return ref
}
```

- **Que hace:** revela un bloque de texto linea por linea al entrar en viewport.
- **Mecanismo exacto:** `SplitText` de GSAP con `type:'lines'` y `mask:'lines'` (genera un wrapper con `overflow:hidden` por linea, de ahi que `yPercent: 110` funcione como cortina). `autoSplit: true` re-divide automaticamente cuando cambia el ancho o termina de cargar la fuente; `onSplit` devuelve el tween, que GSAP mata y recrea en cada re-split.
- **Contrato con el CSS:** el elemento **debe llevar `data-reveal`**, porque `globals.css` lo pone `visibility:hidden` cuando `data-motion='ok'`; el `gsap.set(element, { visibility: 'visible' })` dentro de `onSplit` es lo que lo destapa.
- **API:** devuelve un `ref` tipado para poner en el elemento. Opciones `{ start?, delay? }`.
- **Dependencias:** GSAP core + ScrollTrigger + SplitText.
- **Uso:** `SectionHeader`, `Faq`, `About`, `Axes`, `Contact`.
- **Portabilidad:** es el hook mas atado a GSAP. SplitText no tiene equivalente libre de calidad comparable (`splitting.js` divide por caracteres y palabras, no por lineas visuales con re-split automatico). Si la web final no lleva GSAP, la alternativa razonable es un fade + translate del bloque entero con IntersectionObserver, aceptando perder el efecto por linea.

### 6.11 `useStaggerReveal.ts`

```ts
const HIDDEN = { autoAlpha: 0, y: 28 }
const SHOWN = { autoAlpha: 1, y: 0 }

export const useStaggerReveal = <T extends HTMLElement>({ selector = '[data-stagger]', start = REVEAL_START } = {}) => {
  const ref = useRef<T>(null)
  const motionEnabled = useMotionEnabled()
  useGSAP(() => {
    const container = ref.current
    if (!container || !motionEnabled) return
    gsap.fromTo(container.querySelectorAll(selector), HIDDEN, {
      ...SHOWN, duration: DURATION.base, ease: EASE.out, stagger: STAGGER.items,
      scrollTrigger: { trigger: container, start, once: true, fastScrollEnd: true },
    })
  }, { scope: ref, dependencies: [selector, start, motionEnabled], revertOnUpdate: true })
  return ref
}
```

- **Que hace:** revela en cascada los hijos marcados con `data-stagger`.
- **Decision documentada, importante:** usa `fromTo` y no `from`. Un `from` lee su estado final del DOM de forma perezosa, y si `ScrollTrigger.refresh()` corre antes de que arranque, puede grabar el estado oculto como "final" y no revelar nunca. Este bug esta explicitamente evitado en todo el repo.
- **Contrato con el CSS:** a diferencia de `useSplitReveal`, aca **no** hace falta `data-reveal`: los elementos parten visibles y GSAP los baja a `autoAlpha:0` en el primer frame. Puede producir un flash minimo en la primera pintura.
- **Uso:** `About` (2 veces), `News`, `Tickets`.
- **Portabilidad:** facil. IntersectionObserver + una clase `.is-in` + `transition-delay` escalonado por `--i` reproduce el 90 % del efecto.

### 6.12 `useMagnetic.ts`

```ts
export const useMagnetic = <T extends HTMLElement>({ strength = 0.35, enabled = true } = {}) => {
  const ref = useRef<T>(null)
  const motionEnabled = useMotionEnabled()
  useEffect(() => {
    const element = ref.current
    if (!element || !enabled || !motionEnabled || isTouchDevice()) return
    const context = gsap.context(() => {
      const moveX = gsap.quickTo(element, 'x', { duration: 0.6, ease: EASE.out })
      const moveY = gsap.quickTo(element, 'y', { duration: 0.6, ease: EASE.out })
      const onPointerMove = (event: PointerEvent) => {
        const rect = element.getBoundingClientRect()
        moveX((event.clientX - (rect.left + rect.width/2)) * strength)
        moveY((event.clientY - (rect.top + rect.height/2)) * strength)
      }
      const onPointerLeave = () => { moveX(0); moveY(0) }
      element.addEventListener('pointermove', onPointerMove)
      element.addEventListener('pointerleave', onPointerLeave)
      return () => { /* remove listeners */ }
    }, element)
    return () => context.revert()
  }, [strength, enabled, motionEnabled])
  return ref
}
```

- **Que hace:** el elemento sigue levemente al puntero y vuelve a su lugar al salir.
- **Mecanismo:** `gsap.quickTo` (setter optimizado que no crea un tween nuevo por evento), calculo del delta contra el centro del bounding rect, multiplicado por `strength` (0.35 por defecto). `gsap.context(...).revert()` limpia transforms al desmontar.
- **Guardas:** se apaga en touch (`window.matchMedia('(pointer: coarse)')` via `isTouchDevice()`) y sin motion.
- **Uso:** lo consume `Button` cuando recibe `magnetic`. Aparece en Header (CTA Entradas), Hero (2 botones), MenuOverlay (CTA), Tickets, Footer, Contact.
- **Portabilidad:** reemplazable con `element.animate()` o con una transicion CSS sobre `translate` seteada desde `pointermove` (peor sensacion, pero sin GSAP).

### 6.13 `useCountdown.ts`

```ts
const MINUTE = 60_000, HOUR = 60*MINUTE, DAY = 24*HOUR
const compute = (targetMs: number): Countdown => {
  const diff = Math.max(0, targetMs - Date.now())
  return {
    days: Math.floor(diff/DAY),
    hours: Math.floor((diff%DAY)/HOUR),
    minutes: Math.floor((diff%HOUR)/MINUTE),
    isOver: diff === 0,
  }
}
export const useCountdown = (targetIso: string): Countdown => {
  const targetMs = new Date(targetIso).getTime()
  const [countdown, setCountdown] = useState(() => compute(targetMs))
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(compute(targetMs)), MINUTE)
    return () => window.clearInterval(timer)
  }, [targetMs])
  return countdown
}
```

- **API:** `useCountdown(iso): { days, hours, minutes, isOver }`.
- **Precision:** actualiza cada 60 s (no cada segundo, coherente con que solo muestra dias y horas).
- **Uso:** `Hero`, que renderiza "Faltan N dias y M horas" solo si `!isOver`.
- **Reutilizable fuera de React DOM:** `compute` es una funcion pura, si. El hook no. **Cero dependencia de GSAP/Lenis**: es el hook mas portable del repo junto con `useMediaQuery`.

### 6.14 `useCountUp.ts`

```ts
export const useCountUp = (target: number, duration = 1.8) => {
  const ref = useRef<HTMLSpanElement>(null)
  const motionEnabled = useMotionEnabled()
  useGSAP(() => {
    const element = ref.current
    if (!element || !motionEnabled) return
    const counter = { value: 0 }
    const finalText = element.textContent
    element.textContent = '0'
    gsap.to(counter, {
      value: target, duration, ease: EASE.expo,
      scrollTrigger: { trigger: element, start: REVEAL_START, once: true, fastScrollEnd: true },
      onUpdate: () => { element.textContent = formatNumber(Math.round(counter.value)) },
    })
    return () => { element.textContent = finalText }
  }, { scope: ref, dependencies: [target, duration, motionEnabled], revertOnUpdate: true })
  return ref
}
```

- **Que hace:** cuenta de 0 al valor final cuando el numero entra en pantalla.
- **Detalle fino y bien resuelto:** el JSX **ya renderiza el valor final** (`<span ref={valueRef}>{formatNumber(stat.value)}</span>`), asi que sin JS o sin motion se ve el numero correcto. El cleanup restaura `finalText` a mano porque **GSAP revierte estilos, no `textContent`**: si alguien apaga las animaciones a mitad de la cuenta, el numero quedaria congelado en un valor intermedio.
- **Formato:** usa `formatNumber` (Intl `es-AR`), o sea "120.000" con punto de miles.
- **Uso:** `About` -> `StatItem`.

---

## 7. `src/lib/*`

### 7.1 `lib/gsap.ts` (23 lineas): punto unico de registro

```ts
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

declare global { interface Window { __gsap?: { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger } } }
if (import.meta.env.DEV) { window.__gsap = { gsap, ScrollTrigger } }

export { gsap, ScrollTrigger, SplitText, useGSAP }
```

Tres plugins registrados: `useGSAP` (de `@gsap/react`), `ScrollTrigger`, `SplitText`. **Nadie importa de `'gsap'` directamente**: todo pasa por `@/lib/gsap`, lo que garantiza el registro previo. En dev expone `window.__gsap` para inspeccionar triggers desde la consola.

Plugins **no** usados: ScrollSmoother (esa funcion la cubre Lenis), Draggable, Flip, MorphSVG, DrawSVG, MotionPath. O sea el peso real de GSAP en el bundle es core + 2 plugins.

### 7.2 `lib/motion.ts` y `lib/theme.ts`

Cubiertos en detalle en las secciones 3 y 4. Ambos son stores en modulo, JS plano, con `try/catch` sobre `localStorage`, `init()` idempotente y `Set<Listener>`.

### 7.3 `lib/cn.ts` (4 lineas)

```ts
type ClassValue = string | false | null | undefined
export const cn = (...values: ClassValue[]): string => values.filter(Boolean).join(' ')
```

No es `clsx` ni `tailwind-merge`: no acepta objetos ni arrays. Alcanza para CSS Modules mas condicionales. Al fusionar con un repo que use Tailwind, esto se reemplaza por `clsx` + `tailwind-merge`.

### 7.4 `lib/dom.ts` (36 lineas)

```ts
const FOCUSABLE_SELECTOR = [
  'a[href]','button:not([disabled])','input:not([disabled])',
  'select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])',
].join(',')

export const isBrowser = (): boolean => typeof window !== 'undefined'
export const isTouchDevice = (): boolean => isBrowser() && window.matchMedia('(pointer: coarse)').matches
export const getFocusable = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))

export const trapTabKey = (container: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return
  const focusable = getFocusable(container)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
```

Funciones puras sobre el DOM, sin React. **Directamente reutilizables en cualquier stack** (Astro, vanilla, Vue). `isBrowser()` esta declarado pero solo lo usa `isTouchDevice`.

### 7.5 `lib/format.ts` (51 lineas)

Seis formateadores `Intl` creados a nivel de modulo (instanciados una vez, no por render, que es la practica correcta):

```ts
const LOCALE = 'es-AR'
const TIME_ZONE = 'America/Argentina/Jujuy'
```

| Funcion | Salida ejemplo | Notas |
|---|---|---|
| `formatDateRange(start, end)` | "9 al 18 de octubre" | Si cambia de mes: "30 de septiembre al 2 de octubre" |
| `formatLongDate(iso)` | "sabado 10 de octubre" | |
| `formatShortDate(iso)` | "31 ago 2026" | Hace `.replace('.', '')` para sacar el punto de la abreviatura |
| `formatNumber(n)` | "120.000" | |
| `formatPrice(n)` | "$ 18.000", o "Sin cargo" si es 0 | `maximumFractionDigits: 0`, currency ARS |
| `padTwo(n)` | "07" | |
| `capitalize(s)` | "Sabado ..." | Intl devuelve dias y meses en minuscula |

Detalle bien pensado:

```ts
const toDate = (iso: string): Date => (iso.length === 10 ? new Date(`${iso}T12:00:00-03:00`) : new Date(iso))
```

Las fechas "YYYY-MM-DD" se interpretan a mediodia con offset -03:00 para que no haya corrimiento de dia por zona horaria. Es el bug clasico de fechas y esta resuelto.

**Totalmente portable**, cero dependencias. Se copia tal cual.

### 7.6 `lib/math.ts` (25 lineas)

`clamp`, `lerp`, `mapRange` (con guarda `inMax === inMin`), y `createSeededRandom(seed)` que implementa mulberry32:

```ts
export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

Se usa solo en `SieteColores` para las estrellas: misma semilla (2026), misma constelacion en cada render y en cada visita. Es lo que evita que las estrellas salten entre re-renders. **Nota util si se pasa a Astro o Next con SSR: ese determinismo es justamente lo que hace que el componente sea hidratable sin mismatch.**

`clamp` y `lerp` solo se usan dentro de `mapRange`; ninguno de los tres se usa desde componentes.

### 7.7 `lib/text.ts` (19 lineas)

```ts
const DIACRITICS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g')
export const normalize = (t: string) => t.normalize('NFD').replace(DIACRITICS, '').toLowerCase().trim()
export const slugify = (t: string) => normalize(t).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
export const initials = (name: string, count = 2): string =>
  name.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, count)
      .map((w) => w.charAt(0).toUpperCase()).join('')
```

- `normalize` es la base de la busqueda de expositores: "Mineria" y "Minería" matchean igual.
- `initials` filtra palabras de hasta 2 letras salvo que empiecen en mayuscula ("Sol de Yala Software" da "SY", saltea "de"). Alimenta los monogramas de las tarjetas de expositor.
- `slugify` esta declarado pero **no se usa**: los slugs de noticias vienen escritos a mano en `data/news.ts`.

**Totalmente portable.**

### 7.8 `lib/exhibitors.ts` (20 lineas)

Ver seccion 10.2: es el nucleo de la pieza adoptada 1.

---

## 8. Tipos y enums

### 8.1 `src/types/enums.ts` (148 lineas, 17 enums)

Son **string enums** de TypeScript. Decision documentada en el archivo: "el valor es legible en el DOM (ids, data-attributes, query params) y sirve de ancla de navegacion sin mapeos extra".

| Enum | Valores |
|---|---|
| `SectionId` | `inicio`, `sobre-expojuy`, `ejes`, `agenda`, `expositores`, `mapa`, `noticias`, `entradas`, `sponsors`, `preguntas-frecuentes`, `contacto` |
| `Theme` | `light`, `dark` |
| `MotionPreference` | `system`, `full`, `reduced` |
| `Tone` | `cielo`, `coral`, `lila`, `oliva` |
| `Axis` | `tecnologia`, `produccion`, `cultura`, `territorio` |
| `AxisShape` | `wide`, `tall`, `arch` |
| `AgendaTrack` | `dia`, `noche` |
| `Stage` | `auditorio`, `ronda-de-negocios`, `escenario-principal`, `pabellon-tecnologia`, `patio-gastronomico`, `explanada` |
| `Sector` | `mineria`, `energia`, `agroindustria`, `tecnologia`, `turismo`, `alimentos`, `textil`, `servicios`, `educacion`, `construccion` |
| `TicketType` | `dia`, `pase-completo`, `ronda-de-negocios` |
| `SponsorTier` | `principal`, `oro`, `plata`, `institucional` |
| `SocialNetwork` | `instagram`, `facebook`, `youtube`, `tiktok`, `linkedin` |
| `MapZone` | `entrada`, `pabellon`, `escenario`, `gastronomia`, `servicios`, `estacionamiento` |
| `ContactTopic` | `visitante`, `expositor`, `sponsor`, `prensa` |
| `ButtonVariant` | `primary`, `secondary`, `ghost` |
| `ButtonSize` | `md`, `lg` |
| `ThemePreference` | `auto`, `light`, `dark` |

Nota clave: `SectionId` **es a la vez el `id` del `<section>` y el ancla `#...`**. `anchorOf(id) = '#' + id`.

`Tone` es el eje que une el diseno con los datos: cada valor tiene un token CSS `--c-<tone>` y `toneVar(tone)` devuelve `var(--c-cielo)` etc. Eso permite pasar color por dato sin acoplar el componente a un hex.

### 8.2 `src/types/index.ts` (129 lineas, 14 interfaces)

Hace `export * from './enums'`, o sea `@/types` es el unico import necesario.

```ts
interface SectionMeta { id: SectionId; label: string; theme: Theme; inNav?: boolean; themeLocked?: boolean }
interface SocialLink { network: SocialNetwork; label: string; href: string }
interface EventDates { start: string; end: string }        // ISO 8601 con offset de Argentina
interface Venue { name: string; address: string; city: string }
interface Stat { id: string; value: number; suffix?: string; label: string }
interface AxisInfo { id: Axis; name: string; summary: string; tone: Tone; shape: AxisShape; highlights: string[] }
interface AgendaItem { id: string; track: AgendaTrack; date: string; time: string; title: string; stage: Stage; axis: Axis; description: string }
interface Exhibitor { id: string; name: string; sector: Sector; stand: string; city: string }
interface NewsItem { id: string; slug: string; title: string; excerpt: string; date: string; category: string }
interface Ticket { type: TicketType; name: string; price: number; description: string; includes: string[]; featured?: boolean }
interface Sponsor { id: string; name: string; tier: SponsorTier }
interface FaqItem { id: string; question: string; answer: string }
interface MapPin { id: string; zone: MapZone; name: string; description: string; x: number; y: number; axis?: Axis }
interface ExhibitorFilters { query: string; sector: Sector | null }
```

Todo documentado con JSDoc en el archivo (formato de fecha, unidad de precio, sistema de coordenadas del mapa 0-1000 x 0-600).

---

## 9. Shape de todos los datos (`src/data/*`)

Diez archivos, todos exportando constantes `readonly T[]` tipadas.

| Archivo | Export | Shape | Volumen |
|---|---|---|---|
| `agenda.ts` | `AGENDA_FEATURED_DATE` (`'2026-10-10'`), `AGENDA` | `readonly AgendaItem[]` | 7 items (4 de dia, 3 de noche) |
| `axes.ts` | `AXES`, `AXIS_TONE` | `readonly AxisInfo[]`, `Record<Axis, Tone>` derivado | 4 ejes |
| `exhibitors.ts` | `EXHIBITORS`, `EXHIBITORS_TOTAL` (300) | `readonly Exhibitor[]` | 16 expositores |
| `faq.ts` | `FAQ` | `readonly FaqItem[]` | 6 preguntas |
| `hills.ts` | `HILL_LAYERS`, `SKY`, `interface HillLayer` | `{ id, path, day, night, depth }` | 6 capas |
| `map.ts` | `MAP_PINS` | `readonly MapPin[]` | 8 pines (viewBox 1000x600) |
| `news.ts` | `NEWS` | `readonly NewsItem[]` | 3 noticias |
| `sponsors.ts` | `SPONSORS` | `readonly Sponsor[]` | 12 sponsors en 4 niveles |
| `stats.ts` | `STATS` | `readonly Stat[]` | 4 cifras |
| `tickets.ts` | `TICKETS` | `readonly Ticket[]` | 3 entradas |

Marcas TODO explicitas en el codigo: `stats.ts` ("reemplazar por cifras oficiales de la edicion 2024"), `tickets.ts` ("precios y beneficios definitivos"), `exhibitors.ts` ("nombres ficticios"), `sponsors.ts` ("marcas ficticias"), `constants/event.ts` ("confirmar fechas, predio y contactos"), `Logo.tsx` y `Placeholder` ("kit de diseno").

`data/axes.ts` tiene un patron a copiar: deriva un lookup del propio array en vez de duplicarlo.

```ts
export const AXIS_TONE: Record<Axis, Tone> = Object.fromEntries(AXES.map((a) => [a.id, a.tone])) as Record<Axis, Tone>
```

Constantes institucionales en `src/constants/event.ts`:

```ts
export const EVENT = { name:'ExpoJuy 2026', shortName:'ExpoJuy', edition:17, claim:'La expo del Norte',
  organizer:'Cámara de Comercio Exterior de Jujuy', email:'info@expojuy.com.ar', phone:'+54 388 000 0000' } as const
export const EVENT_DATES: EventDates = { start:'2026-10-09T10:00:00-03:00', end:'2026-10-18T23:00:00-03:00' }
export const VENUE: Venue = { name:'Ciudad Cultural', address:'Alto Padilla', city:'San Salvador de Jujuy' }
```

Y `src/constants/routes.ts` prevé la etapa 2:

```ts
export const ROUTES = { home:'/', exhibitors:'/expositores', exhibitor:'/expositores/:slug', agenda:'/agenda',
  news:'/noticias', article:'/noticias/:slug', tickets:'/entradas', venue:'/predio', sponsors:'/sponsors',
  faq:'/preguntas-frecuentes', contact:'/contacto', press:'/prensa' } as const
export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
```

Los CTA ya apuntan ahi (`Button href={ROUTES.exhibitors}`), o sea la migracion a paginas reales no toca componentes. **Para la web final unificada esto es directamente el mapa de rutas de arranque.**

`src/constants/labels.ts` centraliza todos los textos visibles como `Record<Enum, string>`: `SECTOR_LABEL`, `SECTOR_TONE`, `STAGE_LABEL`, `AXIS_LABEL`, `TRACK_LABEL`, `TICKET_LABEL`, `SPONSOR_TIER_LABEL`, `MAP_ZONE_LABEL`, `CONTACT_TOPIC_LABEL`, mas el helper `toneVar(tone) => 'var(--c-<tone>)'`. Es el archivo que habria que tocar para traducir el sitio.

---

## 10. PIEZA ADOPTADA 1: seccion Expositores

### 10.1 Archivos exactos

| Ruta | Lineas | Rol |
|---|---|---|
| `F:/GitHub/expojuy-2026/src/components/sections/Exhibitors.tsx` | 119 | Componente de seccion + subcomponente `ExhibitorCard` |
| `F:/GitHub/expojuy-2026/src/components/sections/Exhibitors.module.css` | 128 | Estilos |
| `F:/GitHub/expojuy-2026/src/data/exhibitors.ts` | 25 | Fixture de 16 expositores + `EXHIBITORS_TOTAL` |
| `F:/GitHub/expojuy-2026/src/lib/exhibitors.ts` | 20 | Logica de filtrado (funciones puras) |

Dependencias internas que arrastra:

- `@/components/ui/Button` (que arrastra `useMagnetic`, que arrastra GSAP)
- `@/components/ui/Chip`
- `@/components/ui/Section` (que arrastra `useResolvedTheme` -> `themeStore`)
- `@/components/ui/SectionHeader` (que arrastra `useSplitReveal` -> **GSAP + SplitText + ScrollTrigger**)
- `@/constants/labels` (`SECTOR_LABEL`, `SECTOR_TONE`, `toneVar`)
- `@/constants/routes` (`ROUTES.exhibitors`)
- `@/lib/text` (`initials`)
- `@/types` (`Exhibitor`, `ExhibitorFilters`, `Sector`, `ButtonVariant`, `SectionId`, `Theme`)
- `./Exhibitors.module.css`

### 10.2 Mecanismo tecnico exacto

**Filtrado: `src/lib/exhibitors.ts` (funcion pura, sin React, sin DOM)**

```ts
import { SECTOR_LABEL } from '@/constants/labels'
import { normalize } from './text'

export const filterExhibitors = (list: readonly Exhibitor[], filters: ExhibitorFilters): Exhibitor[] => {
  const query = normalize(filters.query)
  return list.filter((exhibitor) => {
    if (filters.sector && exhibitor.sector !== filters.sector) return false
    if (!query) return true
    const haystack = normalize(`${exhibitor.name} ${exhibitor.city} ${SECTOR_LABEL[exhibitor.sector]}`)
    return haystack.includes(query)
  })
}

export const sectorsOf = (list: readonly Exhibitor[]): Sector[] =>
  [...new Set(list.map((exhibitor) => exhibitor.sector))]
```

Puntos exactos:

- La query se normaliza una sola vez fuera del `filter` (NFD, sin diacriticos, minusculas, trim).
- El filtro de rubro corre **primero** y corta temprano (`return false`), o sea es el barato.
- El "haystack" concatena nombre + ciudad + **la etiqueta visible del rubro** ("Alimentos y bebidas"), no el enum. Por eso buscar "bebidas" encuentra a Bodega Cerro Alto. Es la razon de que `lib/exhibitors.ts` importe de `constants/labels`.
- Match por `includes`, o sea substring simple: no hay fuzzy, no hay ranking, no hay tokenizacion por palabras. Buscar "yala sol" no encuentra "Sol de Yala Software".
- `sectorsOf` deriva los chips **de los datos presentes**, con `Set` para dedupe y preservando el orden de aparicion. No hardcodea la lista de rubros: si maniana los datos no traen textiles, el chip no aparece.

**Estado y render: `Exhibitors.tsx`**

```tsx
const INITIAL_FILTERS: ExhibitorFilters = { query: '', sector: null }
const SECTORS = sectorsOf(EXHIBITORS)     // se calcula UNA VEZ a nivel de modulo

export function Exhibitors() {
  const [filters, setFilters] = useState<ExhibitorFilters>(INITIAL_FILTERS)
  const searchId = useId()
  const results = useMemo(() => filterExhibitors(EXHIBITORS, filters), [filters])
  const isFiltering = filters.query !== '' || filters.sector !== null

  const setQuery = (query: string) => setFilters((c) => ({ ...c, query }))
  const setSector = (sector: Sector | null) => setFilters((c) => ({ ...c, sector }))
  const reset = () => setFilters(INITIAL_FILTERS)
  ...
}
```

- **Un solo objeto de estado** (`ExhibitorFilters`), no dos `useState` sueltos. Simplifica el `useMemo` (una sola dependencia) y el reset.
- `useMemo` sobre `[filters]`: como `setFilters` siempre crea objeto nuevo, se recalcula en cada cambio. Correcto.
- `useId()` de React 18+ para el `htmlFor` / `id` del input, o sea el componente se puede montar dos veces en la misma pagina sin colision de ids.
- **Sin debounce**: filtra en cada tecla. Con 16 items es irrelevante; con 300 expositores reales y `normalize()` corriendo por item, conviene memoizar los haystacks o agregar debounce (ver seccion 20).
- `isFiltering` decide si se muestra el boton "Limpiar filtros" del pie.

**Markup y accesibilidad**

```tsx
<Section id={SectionId.Exhibitors} theme={Theme.Dark} labelledBy="exhibitors-title">
  <SectionHeader id="exhibitors-title" title="Quiénes exponen"
    lead={`Más de ${EXHIBITORS_TOTAL} empresas y productores...`} />

  <div className={styles.toolbar}>
    <div className={styles.search}>
      <label htmlFor={searchId} className="visually-hidden">Buscar expositor</label>
      <input id={searchId} type="search" className={styles.input}
             placeholder="Nombre, ciudad o rubro" value={filters.query}
             onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
    </div>
    <div className={styles.chips} role="group" aria-label="Filtrar por rubro">
      <Chip pressed={filters.sector === null} onClick={() => setSector(null)}>Todos</Chip>
      {SECTORS.map((sector) => (
        <Chip key={sector} pressed={filters.sector === sector} onClick={() => setSector(sector)}>
          {SECTOR_LABEL[sector]}
        </Chip>
      ))}
    </div>
  </div>

  <p className={styles.count} role="status">
    {results.length === EXHIBITORS.length
      ? `Mostrando ${results.length} expositores destacados`
      : `${results.length} de ${EXHIBITORS.length} expositores`}
  </p>
  ...
</Section>
```

Decisiones de a11y a conservar:

- `<label class="visually-hidden">` real, no `aria-label`, sobre un `<input type="search">` nativo.
- Los chips van dentro de un `role="group"` con `aria-label="Filtrar por rubro"`, y cada chip es un `<button aria-pressed>`. **No** es un radiogroup ni tabs: es un toggle group, semantica correcta para un filtro.
- `role="status"` sobre el contador: cada cambio de filtro se anuncia en voz alta de forma no intrusiva. Es el detalle que hace que el buscador sea usable con lector de pantalla.
- El estado vacio no es solo texto: incluye un `Button` que resetea.
- `autoComplete="off"` para que el navegador no tape los chips con su dropdown.

**Tarjeta: `ExhibitorCard`**

```tsx
function ExhibitorCard({ exhibitor }: { exhibitor: Exhibitor }) {
  const style = { '--tone': toneVar(SECTOR_TONE[exhibitor.sector]) } as CSSProperties
  return (
    <li className={styles.card} style={style}>
      <span className={styles.monogram} aria-hidden="true">{initials(exhibitor.name)}</span>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{exhibitor.name}</h3>
        <p className={styles.cardMeta}>
          <span>{SECTOR_LABEL[exhibitor.sector]}</span>
          <span>{exhibitor.city}</span>
        </p>
      </div>
      <p className={styles.stand}>Stand {exhibitor.stand}</p>
    </li>
  )
}
```

El color del monograma sale del dato (`SECTOR_TONE[sector]` -> `Tone` -> `var(--c-cielo)`), inyectado como custom property `--tone`. El monograma es `aria-hidden` porque es decorativo (el nombre completo esta al lado).

**CSS: `Exhibitors.module.css`**

- `.toolbar`: `display:grid; gap: var(--space-5)`; en `@media (min-width:64rem)` pasa a `grid-template-columns: 5fr 7fr; align-items: end` (buscador chico a la izquierda, chips anchos a la derecha).
- `.input`: sin caja, solo `border-bottom: 1.5px solid var(--line-strong)`, `background: transparent`, `font-size: var(--fs-lg)`. En `:focus` quita el outline nativo y cambia `border-color` a `var(--accent)`. **Ojo:** al hacer `outline:none` en `:focus` (no `:focus-visible`) pierde el anillo global de `globals.css`; el borde inferior de acento es el reemplazo, y como cambia de color y grosor visible cumple, pero es mas debil que el anillo de 3 px del resto del sitio.
- `.input::-webkit-search-cancel-button { filter: invert(1) }`: hack para que la X de limpiar se vea sobre fondo oscuro. **Es un bug latente**: la seccion es `Theme.Dark` por diseno pero el usuario puede forzar `light`, y ahi la X queda blanca sobre fondo claro. Ver seccion 20.
- `.grid`: `display:grid; border-top: 1px solid var(--line)`. En desktop pasa a `repeat(2, 1fr)` con `column-gap: var(--space-8)`. Es una **lista de dos columnas separada por lineas**, no tarjetas con caja. Muy editorial, muy barato de renderizar.
- `.card`: `grid-template-columns: auto 1fr auto` (monograma, cuerpo, stand), `align-items:center`, `padding-block: var(--space-4)`, `border-bottom: 1px solid var(--line)`.
- `.monogram`: 3.25rem cuadrado, `border-radius: 0.75rem`, `background: var(--tone)`, `color: var(--c-noche)` fijo (los cuatro acentos son claros, asi que texto noche siempre contrasta), `font-variation-settings: 'wdth' 80, 'opsz' 24`.
- `.cardBody` lleva `min-width: 0`, que es lo que evita que un nombre largo rompa la grilla.
- `.stand`: `white-space: nowrap`.

### 10.3 Shape de datos que consume

```ts
interface Exhibitor {
  id: string        // slug estable, key de React
  name: string      // nombre comercial
  sector: Sector    // enum, alimenta filtro + color + label
  stand: string     // "B-12"
  city: string      // buscable
}

interface ExhibitorFilters { query: string; sector: Sector | null }
```

Mas dos constantes globales: `SECTOR_LABEL: Record<Sector, string>` y `SECTOR_TONE: Record<Sector, Tone>`, ambas en `src/constants/labels.ts`.

Lo que **no** trae el shape y probablemente haga falta en la web final: logo/imagen, descripcion, sitio web, rubros multiples, coordenadas del stand en el mapa, destacado/patrocinado, orden alfabetico o por prioridad.

### 10.4 Nota de portabilidad

| Aspecto | Nivel de acoplamiento | Que haria falta |
|---|---|---|
| Logica de filtrado (`lib/exhibitors.ts`, `lib/text.ts`) | **Cero**. TS puro. | Copiar los dos archivos y listo. Funciona en Astro, Next, Vue, Svelte o vanilla. |
| Datos (`data/exhibitors.ts`) | Cero. | Copiar; en Astro se puede convertir a content collection. |
| Estado del componente | React idiomatico basico (`useState`, `useMemo`, `useId`). | En Astro habria que hacerlo island (`client:visible`) o reescribirlo en vanilla con un `input` + `Array.filter` + re-render de la lista. En Next funciona tal cual con `'use client'`. |
| CSS Modules | Bajo. Todo el CSS usa tokens `var(--...)`, sin utilidades. | A Tailwind: mapear los tokens a `theme.extend` y traducir 128 lineas. Es el trabajo mas mecanico. A Astro con `<style>` scoped: casi copiar y pegar. |
| GSAP | **Indirecto pero real**: solo por `SectionHeader` -> `useSplitReveal`. La seccion en si no anima nada. | Reemplazar `SectionHeader` por un heading plano elimina toda la dependencia de GSAP de esta pieza. **Es la pieza mas facil de portar de las tres.** |
| Lenis | Cero directo. `Button href=ROUTES.exhibitors` es un link normal (no ancla, no usa `useAnchorClick`). | Nada. |
| Tema | Depende de `Section` -> `useResolvedTheme`. | Si se conserva el sistema de `data-theme` no hay nada que hacer. Si no, poner `data-theme="dark"` fijo en el markup. |

**Veredicto:** adoptable casi tal cual. Si se saca `SectionHeader` (o se le quita el `useSplitReveal`), la seccion Expositores queda **100 % libre de GSAP y de Lenis**, y su unica dependencia es React + CSS Modules + los tokens.

---

## 11. PIEZA ADOPTADA 2: seccion Preguntas / FAQ + Accordion

### 11.1 Archivos exactos

| Ruta | Lineas | Rol |
|---|---|---|
| `F:/GitHub/expojuy-2026/src/components/sections/Faq.tsx` | 32 | Layout de la seccion (intro sticky + acordeon) |
| `F:/GitHub/expojuy-2026/src/components/sections/Faq.module.css` | 31 | Layout 5fr/7fr y sticky |
| `F:/GitHub/expojuy-2026/src/components/ui/Accordion.tsx` | 52 | El acordeon reutilizable |
| `F:/GitHub/expojuy-2026/src/components/ui/Accordion.module.css` | 79 | Animacion de altura y el icono |
| `F:/GitHub/expojuy-2026/src/data/faq.ts` | 39 | 6 preguntas |

### 11.2 `Faq.tsx` completo

```tsx
const DEFAULT_OPEN = FAQ[0]?.id     // optional chaining por noUncheckedIndexedAccess

export function Faq() {
  const titleRef = useSplitReveal<HTMLHeadingElement>()
  return (
    <Section id={SectionId.Faq} theme={Theme.Light} labelledBy="faq-title">
      <div className={styles.layout}>
        <div className={styles.intro}>
          <h2 id="faq-title" ref={titleRef} className={cn('t-title', styles.title)} data-reveal>
            Preguntas frecuentes
          </h2>
          <p className={cn('t-lead', styles.lead)}>Lo que más nos consultan antes de venir. Si falta algo, escribinos.</p>
          <Button href={`mailto:${EVENT.email}`} variant={ButtonVariant.Ghost}>{EVENT.email}</Button>
        </div>
        <Accordion items={FAQ} defaultOpenId={DEFAULT_OPEN} />
      </div>
    </Section>
  )
}
```

Notar que **no usa `SectionHeader`**: arma su propio header porque necesita el layout de dos columnas con la intro pegajosa. Aplica `useSplitReveal` directamente al `h2` (con `data-reveal`).

CSS:

```css
.layout { display: grid; gap: var(--space-7); }
@media (min-width: 64rem) {
  .layout { grid-template-columns: 5fr 7fr; gap: var(--space-9); align-items: start; }
  .intro  { position: sticky; top: calc(var(--header-h) + var(--space-5)); }
}
```

El `top` de la intro sticky **se calcula con el token del header** (`--header-h` + 24 px). Es la unica dependencia visual entre esta seccion y el navbar: si el header cambia de alto, el token se actualiza y esto acompana solo.

### 11.3 `Accordion.tsx`: mecanismo exacto

```tsx
export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null)
  const baseId = useId()
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id))

  return (
    <ul className={cn(styles.list, className)}>
      {items.map((item) => {
        const isOpen = item.id === openId
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <li key={item.id} className={cn(styles.item, isOpen && styles.open)}>
            <h3 className={styles.heading}>
              <button type="button" id={buttonId} className={styles.trigger}
                      aria-expanded={isOpen} aria-controls={panelId}
                      onClick={() => toggle(item.id)}>
                <span>{item.question}</span>
                <span className={styles.icon} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId}
                 className={styles.panel} hidden={!isOpen}>
              <div className={styles.panelInner}>
                <p className={cn('t-body', styles.answer)}>{item.answer}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
```

Puntos exactos:

1. **Un solo panel abierto a la vez** (`openId: string | null`). Clickear el abierto lo cierra (acordeon "colapsable").
2. `useId()` como prefijo, o sea dos `Accordion` en la misma pagina no colisionan ids.
3. **Semantica ARIA completa y correcta:** `<h3>` que envuelve al `<button>` (patron recomendado por APG), `aria-expanded` en el trigger, `aria-controls` apuntando al panel, y el panel con `role="region"` + `aria-labelledby` apuntando al trigger. Es el patron canonico de disclosure.
4. **No usa `<details>/<summary>`**: eleccion deliberada, porque con `details` no se puede animar la altura de forma confiable en todos los navegadores.
5. El icono es puro CSS: un `<span>` de 1.5rem con `::before` (barra horizontal) y `::after` (barra rotada 90 grados). Abrir el item pone `rotate: 0deg` en el `::after`, o sea el signo mas se convierte en menos con una transicion de `rotate`.

**Animacion de altura sin JS, con `grid-template-rows`**

```css
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-base) var(--ease-out);
}
.panel[hidden] { display: grid; }   /* anula el display:none del UA */
.open .panel { grid-template-rows: 1fr; }
.panelInner { overflow: hidden; }
```

Es la tecnica moderna de "animar a altura automatica": un grid de una fila que va de `0fr` a `1fr`, con el hijo en `overflow:hidden`. Soportada en todos los navegadores actuales (Chrome 107+, Firefox 66+, Safari 16+). No necesita medir alturas ni JS, y funciona con contenido de altura variable.

**Caveat importante de accesibilidad, para tener en cuenta en la fusion:** la regla `.panel[hidden] { display: grid }` **anula el efecto del atributo `hidden`**. En el navegador, `hidden` se implementa como `display:none` en la hoja del UA; si el autor lo pisa, el elemento vuelve a renderizarse y **vuelve a estar en el arbol de accesibilidad**. O sea: el texto de las respuestas cerradas queda clipeado a 0 px de alto pero sigue siendo alcanzable por el cursor virtual de un lector de pantalla. Como el contenido es solo texto (no hay links ni botones adentro), no rompe el orden de tabulacion, pero un usuario de NVDA/VoiceOver podria escuchar respuestas que visualmente estan cerradas. Solucion limpia: agregar `visibility: hidden` al `.panelInner` cuando esta cerrado y `visibility: visible` con `transition-behavior: allow-discrete` al abrir, o usar `content-visibility: hidden`. Es un arreglo de 3 lineas.

### 11.4 Shape de datos

```ts
interface FaqItem { id: string; question: string; answer: string }
export const FAQ: readonly FaqItem[] = [ /* 6 items */ ]
```

Los ids son slugs semanticos: `horarios`, `entradas`, `menores`, `estacionamiento`, `expositor`, `accesibilidad`. Sirven como ancla estable si en el futuro se quiere linkear a una pregunta puntual (`#preguntas-frecuentes` + scroll a la pregunta, o `?faq=horarios`).

Las respuestas son **strings planos**, sin markdown ni HTML. Si la web final necesita links dentro de las respuestas (por ejemplo "comprá acá" apuntando a `/entradas`), hay que cambiar el tipo a `ReactNode` o agregar un parser. Es la limitacion mas probable a encontrar.

### 11.5 Nota de portabilidad

| Aspecto | Acoplamiento | Que haria falta |
|---|---|---|
| `Accordion` en si | **React minimo**: `useState` + `useId`. Nada mas. | En Astro: island con `client:visible`, o reescritura vanilla de ~15 lineas (toggle de una clase + `hidden` + `aria-expanded`). En Next: funciona tal cual con `'use client'`. |
| Animacion de altura | **Cero JS**. CSS puro. | Se copia tal cual a cualquier stack. Es la parte mas valiosa y mas portable. |
| ARIA | Cero acoplamiento. | Copiar los atributos. |
| CSS Modules | Bajo. 79 lineas, todas con tokens. | A Tailwind: `grid-rows-[0fr]` / `grid-rows-[1fr]` con arbitrary values, mas `transition-[grid-template-rows]`. Funciona pero se lee peor que el CSS. |
| GSAP | **Solo por `useSplitReveal` en el `h2` de `Faq.tsx`**, no en el `Accordion`. | Sacar el `useSplitReveal` deja la seccion 100 % libre de GSAP. |
| Lenis | Cero. | Nada. |

**Veredicto:** el `Accordion` es la pieza mas portable de las tres. Es esencialmente HTML + ARIA + una tecnica CSS. Se puede llevar a Astro sin React si se acepta escribir 15 lineas de JS vanilla, o directamente usar `<details>` si se resigna la animacion.

---

## 12. PIEZA ADOPTADA 3: Navbar desktop, Navbar mobile y ScrollRail

Esta es la pieza mas compleja y la que mas hay que documentar, porque se va a combinar con iconos y menu mobile de otro repo.

### 12.1 Archivos exactos y responsabilidades

| Ruta | Lineas | Rol |
|---|---|---|
| `src/components/layout/Header.tsx` | 84 | Barra fija superior. Desktop: logo + nav + acciones. Mobile: logo + acciones. |
| `src/components/layout/Header.module.css` | 119 | |
| `src/components/layout/MenuOverlay.tsx` | 158 | Menu a pantalla completa (es el "navbar mobile", pero tambien se usa en desktop) |
| `src/components/layout/MenuOverlay.module.css` | 108 | |
| `src/components/layout/ScrollRail.tsx` | 43 | Riel lateral izquierdo: progreso de lectura + nombre de seccion. Solo desktop. |
| `src/components/layout/ScrollRail.module.css` | 51 | |

Ademas, dependen de:

- `src/constants/navigation.ts`: `SECTIONS`, `NAV_SECTIONS`, `SOCIAL_LINKS`, `anchorOf`
- `src/providers/ScrollSpyProvider.tsx` + `scroll-spy-context.ts`
- `src/hooks/useScrollSpy.ts` (`useScrollSpy`, `useActiveTheme`)
- `src/hooks/useAnchorClick.ts` -> `useLenis` -> `LenisProvider`
- `src/hooks/useBodyLock.ts` -> `useLenis`
- `src/hooks/useEscapeKey.ts`, `src/hooks/useFocusTrap.ts` -> `src/lib/dom.ts`
- `src/components/ui/Button`, `Logo`, `ThemeToggle` (`ThemeQuickToggle`), `MotionToggle`, `SocialIcon`
- GSAP (`ScrollTrigger`, `useGSAP`, `gsap.timeline`)

**Importante: no hay un "navbar mobile" separado.** Hay un solo `Header` responsive y un `MenuOverlay` a pantalla completa que se abre en cualquier viewport. La diferencia mobile/desktop la hacen tres media queries en `Header.module.css`.

### 12.2 `Header.tsx`: estructura, estados y comportamiento de scroll

```tsx
const PRIMARY_NAV: readonly SectionId[] = [SectionId.Agenda, SectionId.Exhibitors, SectionId.VenueMap, SectionId.News]
const SCROLLED_AT = 40

export function Header({ ready, menuOpen, onOpenMenu }: HeaderProps) {
  const theme = useActiveTheme()
  const [scrolled, setScrolled] = useState(false)
  const onAnchorClick = useAnchorClick()
  const primaryLinks = NAV_SECTIONS.filter((section) => PRIMARY_NAV.includes(section.id))

  useGSAP(() => {
    ScrollTrigger.create({
      start: SCROLLED_AT,
      end: () => ScrollTrigger.maxScroll(window) + 1,
      onToggle: (self) => setScrolled(self.isActive),
    })
  })

  return (
    <header className={cn(styles.header, ready && styles.visible, scrolled && styles.scrolled)} data-theme={theme}>
      <div className={cn('container', styles.inner)}>
        <a href={anchorOf(SectionId.Hero)} className={styles.brand} onClick={onAnchorClick}>
          <Logo />
          <span className="visually-hidden">, ir al inicio</span>
        </a>

        <nav className={styles.nav} aria-label="Secciones principales">
          {primaryLinks.map((section) => (
            <a key={section.id} href={anchorOf(section.id)} className={styles.navLink} onClick={onAnchorClick}>
              {section.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeQuickToggle />
          <Button href={anchorOf(SectionId.Tickets)} onClick={onAnchorClick} magnetic className={styles.cta}>
            Entradas
          </Button>
          <Button variant={ButtonVariant.Secondary} onClick={onOpenMenu}
                  aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="menu-overlay"
                  className={styles.menuButton}>
            <span className={styles.burger} aria-hidden="true" />
            Menú
          </Button>
        </div>
      </div>
    </header>
  )
}
```

**Los tres estados del header, y como se combinan:**

| Estado | Fuente | Clase / atributo | Efecto |
|---|---|---|---|
| `ready` | prop desde `App` (el preloader termino) | `.visible` | `opacity: 0 -> 1`, `translate: 0 -0.5rem -> 0 0`, `pointer-events: none -> auto`. Transicion de `--dur-slow` (700 ms). |
| `scrolled` | ScrollTrigger local, `scroll > 40px` | `.scrolled` | Enciende el velo de fondo (`::before`, `opacity 0 -> 1`, `--dur-base`). |
| `theme` | `useActiveTheme()` (seccion bajo el header) | `data-theme` | Redefine `--fg`, `--bg`, `--line`, etc. La transicion de `color` es de `--dur-base`. |

Los tres son independientes y se aplican al mismo nodo. `cn()` los compone.

**El velo de fondo (`.header::before`)**

```css
.header::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
}
.scrolled::before { opacity: 1; }
```

Es un pseudo-elemento con `z-index: -1` (queda detras del contenido del header pero dentro de su stacking context). Usa `color-mix(in srgb, var(--bg) 92%, transparent)`, o sea **el velo toma el color de la seccion que hay debajo** porque `--bg` viene del `data-theme` del propio header. 92 % de opacidad, casi solido, con un comentario que explica el porque: el peor caso es el wordmark gigante del pie pasando por detras; con menos velo el texto pierde contraste.

**El fix del commit `240fbc1`, que vale la pena entender:**

```ts
end: () => ScrollTrigger.maxScroll(window) + 1,
```

Con `end: 'max'` a secas, `isActive` es `start <= scroll < end`, o sea el trigger deja de estar activo **exactamente en el ultimo pixel del scroll** y el velo se apagaba justo sobre el wordmark del pie. El `+ 1` mete el final de la pagina adentro del rango.

**Nav desktop:** solo 4 de las 10 secciones navegables (`PRIMARY_NAV`). El resto vive en el menu. El filtro es `NAV_SECTIONS.filter((s) => PRIMARY_NAV.includes(s.id))`, o sea **el orden lo manda `SECTIONS`, no `PRIMARY_NAV`**: `PRIMARY_NAV` es solo un set de pertenencia.

**Subrayado animado de los links** (sin pseudo-elementos, con background):

```css
.navLink {
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-size: 0% 1.5px;
  background-position: 0 100%;
  transition: background-size var(--dur-base) var(--ease-out);
}
.navLink:hover { background-size: 100% 1.5px; }
```

Tecnica barata (anima `background-size`, no layout) y hereda el color del tema por `currentColor`.

**Breakpoints del header:**

| Query | Cambio |
|---|---|
| base (mobile) | `.nav { display: none }`, `.cta { display: none }`. Se ve: logo, ThemeQuickToggle, boton "Menú". |
| `@media (min-width: 40rem)` | `.cta { display: inline-flex }`. Aparece el boton "Entradas". |
| `@media (min-width: 64rem)` | `.nav { display: flex }`. Aparece la nav de 4 links. |

**Boton de menu y el "burger":** el burger es un `<span aria-hidden>` de 1.1rem x 0.6rem con `::before` (arriba) y `::after` (abajo), dos lineas de 1.5 px en `currentColor`. **No se anima a X**: al abrir el menu, el boton de cierre es otro (dice "Cerrar", en el overlay). Es un burger de dos lineas, no tres, y va acompanado de la palabra "Menú".

**Contrato ARIA del boton de menu:**

```tsx
aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="menu-overlay"
```

Ese `menu-overlay` es el `id` literal del `<div>` del `MenuOverlay`. Si en la fusion cambia el id, hay que cambiar los dos lugares.

**Detalle a11y del brand:** el link del logo tiene `<Logo />` (con `aria-hidden` en el SVG y el wordmark como texto) mas `<span className="visually-hidden">, ir al inicio</span>`. O sea el nombre accesible del link queda "ExpoJuy 2026, ir al inicio". Solucion elegante: no repite el nombre, lo completa.

**El header NO se esconde al scrollear hacia abajo.** Es siempre fijo, siempre visible (una vez `ready`). Si el otro repo trae un header que se auto-oculta, es una decision a resolver explicitamente.

### 12.3 `MenuOverlay.tsx`: estructura, animacion, focus trap y body lock

**Props:** `{ open: boolean, onClose: () => void }`. El estado vive en `App`.

**Los cuatro hooks de comportamiento, en orden:**

```tsx
useBodyLock(open)          // overflow hidden en <html> + lenis.stop()
useEscapeKey(onClose, open)  // Escape cierra
useFocusTrap(rootRef, open)  // foco adentro, vuelve al cerrar
const onAnchorClick = useAnchorClick(onClose)  // click en link -> scroll + cierra
```

Mas `const theme = useResolvedTheme(Theme.Dark)`, o sea el menu es oscuro por diseno pero obedece la preferencia global.

**El elemento raiz:**

```tsx
<div id="menu-overlay" ref={rootRef} className={styles.overlay} data-theme={theme}
     role="dialog" aria-modal="true" aria-label="Menú" inert={!open}>
```

Cuatro cosas a conservar en la fusion:

1. `role="dialog"` + `aria-modal="true"` + `aria-label="Menú"`.
2. **`inert={!open}`**: React 19 soporta el atributo booleano `inert` nativo. Cuando el menu esta cerrado, todo su contenido queda fuera del orden de tabulacion **y fuera del arbol de accesibilidad**. Es la razon por la que el menu puede quedar montado siempre (nunca se desmonta) sin ensuciar la navegacion por teclado. Soporte: Chrome 102+, Firefox 112+, Safari 15.5+.
3. El overlay **siempre esta en el DOM**, solo cambia `visibility` (CSS) y `autoAlpha` (GSAP). Esto es lo que permite que la timeline de GSAP exista desde el montaje y se reproduzca hacia adelante o hacia atras.
4. `overflow-y: auto` en el overlay: si el contenido no entra, scrollea adentro. Como el body esta lockeado, no hay scroll chaining.

**CSS del overlay:**

```css
.overlay {
  position: fixed; inset: 0; z-index: var(--z-menu);
  display: grid; grid-template-rows: auto 1fr;
  padding: 0 var(--gutter) var(--space-6);
  background: var(--bg); color: var(--fg);
  visibility: hidden;         /* GSAP lo pasa a visible con autoAlpha */
  overflow-y: auto;
}
```

`visibility: hidden` es el estado inicial; el `.set(rootRef.current, { autoAlpha: 1 })` de la timeline lo revela. `autoAlpha` de GSAP es azucar para `opacity` + `visibility`.

**La timeline de apertura (GSAP):**

```tsx
useGSAP(() => {
  timelineRef.current = gsap.timeline({ paused: true })
    .set(rootRef.current, { autoAlpha: 1 })
    .fromTo(rootRef.current,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: DURATION.base, ease: EASE.inOut })
    .fromTo('[data-menu-item]',
      { yPercent: 40, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, stagger: STAGGER.items, duration: DURATION.base, ease: EASE.expo },
      '-=0.25')
    .fromTo('[data-menu-aside]',
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: DURATION.base, ease: EASE.out },
      '-=0.4')
}, { scope: rootRef })
```

Tres movimientos superpuestos:

1. El panel entero se revela con `clip-path: inset()` de abajo hacia arriba (una cortina que sube), 0.7 s con `power2.inOut`.
2. Los `<li data-menu-item>` (los links de seccion) suben desde `yPercent: 40` con opacidad 0, en cascada de 0.06 s, empezando 0.25 s antes de que termine la cortina.
3. El `<aside data-menu-aside>` (datos del evento, toggles, redes, CTA) aparece con un fade + 16 px, empezando 0.4 s antes del final del stagger.

Los selectores `'[data-menu-item]'` y `'[data-menu-aside]'` son strings porque el `useGSAP` tiene `{ scope: rootRef }`, o sea GSAP los resuelve **relativos al contenedor**. Este es el patron de scoping de `@gsap/react` y evita seleccionar nodos de otras partes del arbol.

**El control play/reverse, con un bug sutil ya resuelto:**

```tsx
useEffect(() => {
  const timeline = timelineRef.current
  if (!timeline) return

  if (!motionEnabled) {
    timeline.pause().progress(open ? 1 : 0)
    return
  }

  if (open) timeline.play()
  else if (timeline.progress() > 0) timeline.reverse()
}, [open, motionEnabled])
```

Dos comentarios del codigo que hay que respetar si se toca esto:

- El `pause()` **antes** de `progress()` es imprescindible: una timeline que viene de `reverse()` sigue viva con `timeScale: -1`, asi que apenas se le fija el progreso volveria a correr hacia atras y el menu se cerraria solo.
- El `timeline.progress() > 0` evita revertir algo que nunca se abrio: este efecto tambien corre cuando cambia la preferencia de movimiento, con el menu ya cerrado.

**Body lock: mecanismo exacto**

```ts
const previousOverflow = document.documentElement.style.overflow
document.documentElement.style.overflow = 'hidden'
stop()                    // lenis.stop()
// cleanup:
document.documentElement.style.overflow = previousOverflow
start()                   // lenis.start()
```

Dos capas: `overflow:hidden` en `<html>` frena el scroll nativo (y el teclado, y la rueda); `lenis.stop()` frena el motor de scroll suave, que si no seguiria interpolando en background. Sin Lenis (movimiento apagado), `stop()` es no-op y alcanza con el overflow.

**Focus trap: mecanismo exacto**

1. Al pasar `active` a `true`, guarda `document.activeElement` (el boton "Menú" del header).
2. `setTimeout(60 ms)` y despues `getFocusable(container)[0]?.focus()`. Los 60 ms son para que la cortina de `clip-path` ya haya empezado y el contenedor sea enfocable (con `visibility:hidden` el `focus()` no hace nada).
3. Mientras esta activo, un `keydown` **en el contenedor** llama a `trapTabKey`: si Tab en el ultimo focusable, salta al primero; si Shift+Tab en el primero, salta al ultimo.
4. Al cerrar, `clearTimeout` + `removeEventListener` + `previouslyFocused?.focus()`, o sea el foco vuelve al boton "Menú".

El primer focusable del overlay es el boton "Cerrar" (el `<Logo />` no es link adentro del menu). Buen orden.

**Contenido del menu:**

- `.top`: `Logo` + `Button` "Cerrar" (variante secondary), altura `var(--header-h)` para alinear con el header de abajo.
- `.body` (grid, `align-content: center`, en desktop `grid-template-columns: 7fr 5fr; align-items: end`):
  - `<nav aria-label="Todas las secciones">` con `<ul>` de los 10 `NAV_SECTIONS`. Cada `<li data-menu-item>`.
  - `<aside data-menu-aside>` con: bloque "Cuándo y dónde" (`formatDateRange` + venue), bloque "Escribinos" (mailto), bloque "Tema" (`ThemeToggle`), bloque "Movimiento" (`MotionToggle`), `<ul aria-label="Redes sociales">` con 5 `SocialIcon` en circulos de 2.75rem, y un `Button magnetic` "Conseguí tu entrada".

**Tipografia de los links del menu, detalle a copiar:**

```css
.link {
  font-size: clamp(1.75rem, 5.2vh, 3.75rem);   /* vh, no vw */
  font-weight: 800;
  font-variation-settings: 'wdth' 75, 'opsz' 96;
  line-height: 1.05;
  letter-spacing: -0.015em;
}
.link:hover { color: var(--accent); translate: 0.35rem 0; }
```

El `clamp` usa **`vh`, no `vw`**, con este comentario en el codigo: las diez secciones tienen que entrar en un viewport sin scroll. Es una decision fina y no obvia; si en la fusion se agregan secciones al menu, hay que bajar el `5.2vh` o el menu empieza a scrollear.

### 12.4 `ScrollRail.tsx`: riel lateral

```tsx
export function ScrollRail({ ready }: ScrollRailProps) {
  const fillRef = useRef<HTMLSpanElement>(null)
  const { activeId } = useScrollSpy()
  const theme = useActiveTheme()
  const activeSection = SECTIONS.find((section) => section.id === activeId)

  useGSAP(() => {
    if (!fillRef.current) return
    gsap.set(fillRef.current, { scaleY: 0 })
    ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => { gsap.set(fillRef.current, { scaleY: self.progress }) },
    })
  })

  return (
    <div className={cn(styles.rail, ready && styles.visible)} data-theme={theme} aria-hidden="true">
      <span className={styles.track}><span ref={fillRef} className={styles.fill} /></span>
      <span className={styles.label}>{activeSection?.label}</span>
    </div>
  )
}
```

- **El progreso se escribe directo en el DOM con `gsap.set`, sin estado de React.** Documentado en el codigo: es lo que evita re-renderizar todo el arbol en cada frame de scroll. El unico re-render viene del cambio de `activeId` (que ya es discreto, gracias al `ScrollSpyProvider`).
- `ScrollTrigger` global con `start: 0` y `end: () => maxScroll(window)`, `onUpdate` con `self.progress` (0 a 1).
- El fill es un `<span>` absoluto con `transform-origin: top` y `background: currentColor`; se anima por `scaleY`, o sea es composited y no dispara layout.
- La etiqueta usa `writing-mode: vertical-rl; rotate: 180deg` para leerse de abajo hacia arriba.
- **`aria-hidden="true"` en todo el riel**: es decoracion pura, la navegacion real esta en el header y el menu. Correcto.
- Solo desktop: `.rail { display: none }` y `@media (min-width: 64rem) { .rail { display: flex } }`.
- Posicion: `left: max(0.75rem, calc(var(--gutter) / 2 - 0.5rem))`, o sea vive en el margen, a la izquierda del contenido.

### 12.5 Fuente unica de la navegacion: `src/constants/navigation.ts`

```ts
export const SECTIONS: readonly SectionMeta[] = [
  { id: SectionId.Hero,       label: 'Inicio',              theme: Theme.Dark,  inNav: false, themeLocked: true },
  { id: SectionId.About,      label: 'Sobre ExpoJuy',       theme: Theme.Light },
  { id: SectionId.Axes,       label: 'Ejes',                theme: Theme.Light },
  { id: SectionId.Agenda,     label: 'Agenda',              theme: Theme.Light },
  { id: SectionId.Exhibitors, label: 'Expositores',         theme: Theme.Dark  },
  { id: SectionId.VenueMap,   label: 'Mapa del predio',     theme: Theme.Light },
  { id: SectionId.News,       label: 'Noticias',            theme: Theme.Light },
  { id: SectionId.Tickets,    label: 'Entradas',            theme: Theme.Dark  },
  { id: SectionId.Sponsors,   label: 'Sponsors',            theme: Theme.Light },
  { id: SectionId.Faq,        label: 'Preguntas frecuentes',theme: Theme.Light },
  { id: SectionId.Contact,    label: 'Contacto',            theme: Theme.Dark  },
]

export const NAV_SECTIONS = SECTIONS.filter((section) => section.inNav !== false)
export const anchorOf = (id: SectionId): string => `#${id}`

export const SOCIAL_LINKS: readonly SocialLink[] = [ /* instagram, facebook, youtube, tiktok, linkedin */ ]
```

**De este array salen cinco cosas:** el menu completo, los links del header (filtrados), el rail, el ritmo claro/oscuro del sitio (`ScrollSpyProvider` lee `theme` y `themeLocked`) y los links del pie. Agregar o reordenar una seccion es editar una linea.

**Este archivo es probablemente lo mas valioso de todo el repo para la fusion**, porque es el contrato que une navbar, menu, rail, tema y anclas. Si los tres prototipos se unifican, definir un `SECTIONS` unico deberia ser el primer paso.

### 12.6 Nota de portabilidad del navbar

| Aspecto | Acoplamiento | Que haria falta |
|---|---|---|
| Estructura del `Header` | React basico + `cn()`. | Trivial de portar. En Astro se puede hacer estatico salvo el `ThemeQuickToggle`. |
| `data-theme` dinamico del header | Depende de `ScrollSpyProvider` (GSAP) + `themeStore`. | **Reemplazable por IntersectionObserver**: un observer por seccion con `rootMargin: '-48px 0px -100% 0px'` y `threshold: 0` da exactamente el mismo comportamiento sin GSAP. Es ~25 lineas. |
| Estado `scrolled` (velo) | ScrollTrigger local, solo mira `scrollY > 40`. | **Trivialmente reemplazable**: un `IntersectionObserver` sobre un sentinel de 40 px al tope del documento, o un listener de `scroll` con `passive: true`. No necesita GSAP. |
| `useAnchorClick` | Depende de `useLenis` -> `LenisProvider`. | Si se saca Lenis: `scrollIntoView({ behavior: 'smooth', block: 'start' })` mas `scroll-margin-top: calc(var(--header-h) + 1rem)` en las secciones. Se pierde el control de easing y de duracion, se gana simplicidad. |
| `useBodyLock` | Depende de `useLenis` (por `stop`/`start`). | Sin Lenis, queda solo el `overflow:hidden`. Reemplazar `stop`/`start` por no-ops es 1 linea. Conviene ademas agregar compensacion de scrollbar. |
| `useFocusTrap` + `lib/dom.ts` | **Cero acoplamiento** con GSAP/Lenis. React solo por el `useEffect`. | Copiar tal cual. O reemplazar por `<dialog>` nativo con `showModal()`, que da focus trap, `Escape` y backdrop gratis (pero pelea con la animacion de `clip-path`). |
| `inert` | Nativo del navegador. | Copiar tal cual. En Astro sin React se setea con `el.inert = true`. |
| Timeline de apertura (GSAP) | **Alto**. `clipPath` + stagger + `reverse()`. | Sin GSAP: `clip-path` es animable por CSS con `transition`, y el stagger se hace con `transition-delay: calc(var(--i) * 60ms)` seteando `--i` por item. Se pierde el `reverse()` con timeScale, pero para un menu alcanza. Es ~20 lineas de CSS. |
| `ScrollRail` | Alto (ScrollTrigger). | Reemplazable con `animation-timeline: scroll()` de CSS Scroll-Driven Animations (Chrome 115+, Safari 26), con fallback a un listener. O con `scrollY / (scrollHeight - innerHeight)`. |
| CSS Modules | Bajo (todo con tokens). | 278 lineas totales entre los tres modulos. |

**Veredicto:** el navbar tiene tres dependencias de GSAP (`scrolled`, scroll spy, rail) y dos de Lenis (`useAnchorClick`, `useBodyLock`), **pero ninguna es estructural**. Todas tienen reemplazo directo con APIs nativas. La parte de accesibilidad (focus trap, inert, ARIA, escape, body lock) es la mas valiosa y la mas portable: se copia tal cual a cualquier stack.

**Al combinar con el menu mobile e iconos del otro repo, lo que hay que preservar de esta implementacion:**

1. El estado `open` levantado al padre, con `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls` en el disparador.
2. El overlay siempre montado con `inert={!open}` (mejor que desmontar: no rompe la animacion de salida ni pierde el foco).
3. Los cuatro hooks de comportamiento (`useBodyLock`, `useEscapeKey`, `useFocusTrap`, `useAnchorClick(onClose)`).
4. `role="dialog"` + `aria-modal` + `aria-label`.
5. `SECTIONS` como fuente unica.
6. El `clamp(..., 5.2vh, ...)` de los links (o su equivalente), para que el menu no scrollee.
7. El velo `color-mix(in srgb, var(--bg) 92%, transparent)` del header, que se adapta al tema de la seccion.

---

## 13. Componentes UI reutilizables (API de props)

Doce archivos en `src/components/ui/`.

### 13.1 `Button.tsx`

```ts
interface BaseProps {
  children: ReactNode
  variant?: ButtonVariant      // Primary (default) | Secondary | Ghost
  size?: ButtonSize            // Md (default) | Lg
  magnetic?: boolean           // default false
  className?: string
}
interface LinkProps extends BaseProps { href: string; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void; target?: string; rel?: string }
interface NativeProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'|'className'> { href?: undefined }
type ButtonProps = LinkProps | NativeProps
```

Union discriminada por `href`: **si recibe `href` renderiza `<a>`, si no renderiza `<button type="button">`**. Los dos envuelven el contenido en `<span className={styles.label}>` (necesario para el subrayado de la variante ghost).

Aplica `useMagnetic<HTMLElement>({ enabled: magnetic })` **siempre** (el hook decide internamente si hace algo), y castea el ref segun la rama.

En la rama nativa hace destructuring con rest para no pasar props propias al DOM:

```tsx
const { variant: _v, size: _s, magnetic: _m, className: _c, href: _h, children: _ch, ...native } = props
```

Estilos: `.button` es pill (`--r-pill`), `inline-flex`, `will-change: transform` (por el magnetic). Variantes: `.primary` (fondo `--cta` coral, texto `--cta-fg` noche, hover `--cta-hover`), `.secondary` (borde `--line-strong`, en hover se invierte a fondo `--fg` / texto `--bg`), `.ghost` (sin caja, subrayado que se **retrae** en hover, animando `background-size` de 100 % a 0 % con cambio de `background-position`, o sea el subrayado sale por la derecha).

### 13.2 `Chip.tsx`

```ts
interface ChipProps { children: ReactNode; pressed: boolean; onClick: () => void; className?: string }
```

`<button type="button" aria-pressed={pressed}>`. El estilo activo cuelga del selector de atributo `.chip[aria-pressed='true']` (fondo `--fg`, texto `--bg`), o sea **no hay clase de estado**: el ARIA es la fuente de verdad visual. Patron muy limpio, se repite en `ThemeToggle` y `SegmentedControl`.

### 13.3 `Section.tsx`

```ts
interface SectionProps {
  id: SectionId
  theme: Theme
  themeLocked?: boolean       // default false
  labelledBy?: string         // id del heading (aria-labelledby)
  bleed?: boolean             // default false: sin padding ni container
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLElement>      // React 19: ref como prop, sin forwardRef
  children: ReactNode
}
```

Renderiza `<section id data-theme aria-labelledby class>`; si `bleed` es false envuelve los hijos en `<div className="container">`. `.padded` aplica `padding-block: var(--section-y)`.

Nota React 19: **`ref` como prop normal**, sin `forwardRef`. Si la web final usa React 18 hay que reintroducir `forwardRef`.

### 13.4 `SectionHeader.tsx`

```ts
interface SectionHeaderProps { id: string; title: string; lead?: string; aside?: ReactNode; className?: string }
```

`<header>` con `<h2 id ref data-reveal class="t-title">` (revelado por `useSplitReveal`) y, si hay `lead` o `aside`, un `<div class={styles.side}>` con el lead y el slot. Grid `1fr` que en 64rem pasa a `7fr 5fr`. `margin-bottom: clamp(2.5rem, 6vw, 5rem)`.

**Es el unico punto donde la seccion Expositores toca GSAP.**

### 13.5 `SegmentedControl.tsx` (generico)

```ts
interface SegmentOption<T extends string> { value: T; label: string }
interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string        // aria-label del tablist
  idPrefix: string     // enlaza tab con tabpanel: `${idPrefix}-tab-${value}` / `-panel-`
  className?: string
}
```

Implementa el patron **tabs** completo del APG: `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls` + **roving tabindex** (`tabIndex={selected ? 0 : -1}`) + navegacion con flechas izquierda/derecha con wrap circular:

```ts
const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
if (!delta) return
event.preventDefault()
const next = options[(selectedIndex + delta + options.length) % options.length]
if (next) onChange(next.value)
```

Solo lo usa `Agenda` (Dia/Noche), pero es reutilizable y bien hecho. Comentario del CSS que vale la pena: el propio boton lleva el fondo activo, no un "pulgar" superpuesto, "asi el contraste es real".

### 13.6 `Marquee.tsx`

```ts
interface MarqueeProps { children: ReactNode; duration?: number /* seg, default 40 */; reverse?: boolean; className?: string }
```

Duplica el contenido en dos `.group` (el segundo `aria-hidden`) dentro de un `.track` de `width: max-content` animado con `@keyframes scroll { to { transform: translateX(-50%) } }`. La duracion entra por `--marquee-duration`. `mask-image` con gradiente para el fade de bordes. Pausa en hover (`animation-play-state: paused`).

Sin motion (4 reglas `:root:not([data-motion='ok'])`): saca la mascara, saca la animacion, pone `width:auto`, hace `flex-wrap: wrap` y **oculta la copia duplicada**. O sea se degrada a una lista que envuelve, no a una cinta congelada.

### 13.7 `CircleText.tsx`

```ts
interface CircleTextProps { text: string; size?: number /* px, default 120 */; className?: string }
```

SVG de viewBox 0 0 100 100 con un `<path>` circular (r=40) en `<defs>` y un `<textPath>` que usa `textLength={Math.round(2*Math.PI*40)}` con `lengthAdjust="spacing"`, o sea el texto se reparte exacto en la circunferencia sin huecos ni solapamiento. `useId()` para el id del path. `aria-hidden="true"`. La rotacion es CSS: `animation: spin 28s linear infinite`.

Solo lo usa el `Hero` ("Deslizá para entrar").

### 13.8 `Logo.tsx`

```ts
interface LogoProps { withWordmark?: boolean /* default true */; className?: string }
```

SVG inline de 36x44: tres `<rect>` (cielo, coral, lila) mas un `<path>` con la "U" oliva. Los fills usan `var(--c-cielo)` etc., o sea **el logo respeta los tokens**. El wordmark es texto real (`EVENT.shortName` + `2026` en un span mas chico y mas claro). Marcado `TODO(kit-de-diseño)`: reemplazar por el logotipo oficial.

### 13.9 `Placeholder.tsx`

```ts
interface PlaceholderProps {
  label: string          // "Foto: vista aérea del predio, edición 2024"
  ratio?: string         // CSS aspect-ratio, default '4 / 3'
  arch?: boolean         // base redondeada como la "U" del logo
  tone?: Tone            // default Cielo
  className?: string
}
```

`<figure role="img" aria-label={label}>` con `<figcaption>` visible como pastilla arriba a la izquierda. El fondo es `color-mix(in srgb, var(--tone) 18%, var(--bg-elev))` mas un `repeating-linear-gradient` diagonal. `.arch` usa un `border-radius` eliptico de 8 valores.

Es el mecanismo por el que el mockup declara **que foto va en cada lugar** sin usar imagenes. La memoria descriptiva se apoya en esto para afirmar que no hay ninguna imagen generada por IA.

### 13.10 `MotionToggle.tsx`

```ts
interface MotionToggleProps { className?: string }
```

Ver seccion 4.4. `role="switch"` + `aria-checked`.

### 13.11 `SocialIcon.tsx`

```ts
interface SocialIconProps { network: SocialNetwork; size?: number /* default 22 */ }
```

Un `Record<SocialNetwork, string>` con los 5 paths (Instagram, Facebook, YouTube, TikTok, LinkedIn) sobre viewBox 24x24, `fill="currentColor"`, `aria-hidden="true"`. El nombre accesible lo pone el `<a aria-label>` que lo envuelve.

**Muy portable**: son 5 strings de path. Si el otro repo trae iconos propios, este archivo es el punto exacto de reemplazo (ninguna otra pieza depende de el mas alla de `network` y `size`).

### 13.12 `ThemeToggle.tsx` (`ThemeToggle` + `ThemeQuickToggle`)

Ver seccion 3.5. Props: `{ className?: string }` en ambos.

### 13.13 `Accordion.tsx`

```ts
interface AccordionProps { items: readonly FaqItem[]; defaultOpenId?: string; className?: string }
```

Ver seccion 11.3.

---

## 14. Componente artistico `SieteColores`

Archivos: `src/components/art/SieteColores.tsx` (79 lineas), `SieteColores.module.css` (27 lineas), `src/data/hills.ts` (61 lineas).

Es una ilustracion vectorial de los cerros de la Quebrada de Humahuaca, **construida a mano en SVG**, sin imagenes rasterizadas.

```tsx
const STAR_COUNT = 70
const LIGHT_COUNT = 26

export function SieteColores() {
  const stars = useMemo(() => {
    const random = createSeededRandom(2026)
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i, cx: Math.round(random() * 1600), cy: Math.round(random() * 420), r: 0.8 + random() * 1.6,
    }))
  }, [])

  const lights = useMemo(() => Array.from({ length: LIGHT_COUNT }, (_, i) => ({
    id: i, cx: 90 + i * 58, cy: 848 + Math.sin(i * 0.9) * 6,
  })), [])
  ...
}
```

- **Estrellas:** 70 circulos con posiciones deterministas (mulberry32, semilla 2026). `cy` acotado a los primeros 420 px del viewBox de 900, o sea solo en el cielo.
- **Luces del pueblo:** 26 circulos en fila con una ondulacion senoidal de amplitud 6 px.
- **Capas de cerros:** 6 `<path>` de `HILL_LAYERS`, cada uno con `fill={layer.day}` y tres data attributes: `data-hill`, `data-depth={layer.depth}` (0.1 a 1), `data-night={layer.night}`.
- **Cielo:** un `<linearGradient id="sky">` vertical con dos stops que usan clases del modulo (`.skyTop { stop-color: var(--sky-top) }`), o sea el color del cielo se cambia por custom property.
- `viewBox="0 0 1600 900"` con `preserveAspectRatio="xMidYMax slice"` (recorta manteniendo el borde inferior), `aria-hidden="true"`, `data-scene`.

**El contrato con el Hero:** el componente expone hooks `data-*` documentados en su JSDoc y el `Hero` los selecciona con `gsap.utils.selector(stage)`:

| Hook | Que anima el Hero |
|---|---|
| `[data-scene]` | `--sky-top` / `--sky-bottom` de dia a noche |
| `[data-sun]` | `attr: { cy }` de 300 a 800 (el sol se pone), con `power1.in` |
| `[data-hill][data-depth][data-night]` | `attr: { fill }` al color nocturno **y** `y: -depth * 90` (parallax por capa) |
| `[data-stars]` | `opacity` 0 a 1 |
| `[data-lights]` | `opacity` 0 a 1 |

Separacion de responsabilidades muy limpia: **el arte no sabe animarse, solo expone puntos de anclaje**. El componente es totalmente reutilizable sin GSAP (se ve el estado de dia).

`data/hills.ts` tambien exporta `SKY = { day: { top:'#2f86b8', bottom:'#bfddeb' }, night: { top:'#0e0b1e', bottom:'#2a1e4a' } }`.

**Portabilidad:** total. Es un SVG + un array de paths. Se lleva a Astro como componente `.astro` sin ninguna perdida (el `useMemo` se convierte en un calculo en tiempo de build, que ademas es mejor). Lo unico que se pierde sin GSAP es la transicion dia-noche.

---

## 15. Preloader y Footer (comparativa, no adoptados)

### 15.1 `Preloader.tsx` (93 lineas)

```tsx
export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [active, setActive] = useState(() => motionStore.isEnabled())   // lee UNA VEZ, al montar
  const rootRef = useRef<HTMLDivElement>(null)
  useBodyLock(active)
  useEffect(() => { if (!active) onComplete() }, [active, onComplete])
  const { contextSafe } = useGSAP({ scope: rootRef })
  ...
  if (!active) return null
}
```

Puntos tecnicos:

1. **Lee la preferencia de movimiento una sola vez, en el inicializador lazy de `useState`.** Comentado en el codigo: encender las animaciones mas tarde no debe hacer reaparecer la cortina de carga. Es una decision correcta y no obvia.
2. Sin movimiento **no se muestra**: llama a `onComplete()` de inmediato y devuelve `null`.
3. Usa `useGSAP({ scope })` para obtener `contextSafe`, y despues **espera a `document.fonts.ready`** antes de reproducir:

```ts
document.fonts.ready.then(play)
```

Comentado: esperar las fuentes evita que el hero aparezca con la tipografia de respaldo. El `contextSafe` es lo que hace que el tween creado dentro del `.then()` (fuera del ciclo de `useGSAP`) igual quede registrado en el context de GSAP y se limpie al desmontar. Ademas hay un flag `cancelled` para el caso de que el componente se desmonte antes de que resuelva la promesa.

4. La timeline: los 4 bloques del logo escalan de 0 a 1 con `stagger: 0.1` y `expo.out`; en paralelo (posicion 0) un contador tweenea un objeto `{ value: 0 }` a 100 en 1.6 s escribiendo `padTwo(...)` en el DOM; al final, `clipPath: 'inset(0 0 100% 0)'` en 0.9 s sube la cortina y `onComplete` del timeline hace `setActive(false)`.
5. A11y: `role="status" aria-live="polite"` con `<span class="visually-hidden">Cargando ExpoJuy 2026</span>`. El resto es `aria-hidden`.

**Comparacion util para la fusion:** este preloader esta bien construido pero **es el patron con mas riesgo de LCP y de frustacion** (bloquea el contenido 2.5+ s). Que se descarte y se adopte el de otro repo (o ninguno) es razonable. Lo que si conviene rescatar: el patron de "leer la preferencia una sola vez", el `document.fonts.ready`, el `contextSafe`, y el `role="status"`.

### 15.2 `Footer.tsx` (99 lineas)

Estructura: wordmark gigante a sangre (`font-size: clamp(5rem, 24vw, 24rem)`, `line-height: 0.8`, `user-select: none`, `aria-hidden`), grilla de 4 columnas (Organizan, Secciones, Contacto, Seguinos), fila de preferencias (`ThemeToggle` + `MotionToggle`), y fila legal con copyright y boton "Volver arriba" (ghost + magnetic).

`data-theme={useResolvedTheme(Theme.Dark)}`, `overflow: hidden` (por el wordmark que se sale), grilla de `repeat(2, 1fr)` que en 64rem pasa a `1.4fr 1fr 1fr 1fr`.

Constante local `ORGANIZERS` (3 nombres, hardcodeada en el archivo, **no esta en `data/`** ni en `constants/`, es la unica inconsistencia de la separacion de capas).

**Lo rescatable aunque no se adopte:** el wordmark a sangre (es el gesto de identidad mas fuerte del sitio), la fila de preferencias (tema y movimiento en el pie, ademas del menu) y los links del pie derivados de `NAV_SECTIONS`.

---

## 16. Resto de secciones (relevamiento rapido)

Once secciones en `src/components/sections/`. Las 8 que no se adoptan:

**`Hero.tsx` (216 lineas)**. La pieza mas compleja. Una "ventana" con forma de U (la del logo) que deja ver los cerros de dia; al scrollear se abre a pantalla completa, atardece y aparece el titulo. **Sin `pin` de ScrollTrigger**: la seccion mide `calc(100svh * (1 + 1.6))`, el `.stage` es `position: sticky; top: 0; height: 100svh` y GSAP solo hace `scrub: 1` contra `start:'top top'` / `end:'bottom bottom'`. Sin espaciadores fantasma ni CLS.

Estados de la ventana como constantes con **unidades homogeneas** para que GSAP pueda interpolar:

```ts
const WINDOW = {
  desktop: { width: '42vw', height: '66vh', borderRadius: '0vw 0vw 21vw 21vw' },
  mobile:  { width: '82vw', height: '54vh', borderRadius: '0vw 0vw 41vw 41vw' },
  open:    { width: '100vw', height: '100vh', borderRadius: '0vw 0vw 0vw 0vw' },
}
```

Sin motion tiene un `applyOpenState()` que aplica el estado final con `gsap.set` (ventana abierta, de noche, copy visible). Dos `useGSAP` separados: el scrub y la entrada tras el preloader. `useMediaQuery(DESKTOP_QUERY)` en `dependencies` con `revertOnUpdate: true`.

**`About.tsx`**: statement grande con `useSplitReveal`, dos parrafos + `Placeholder` con `useStaggerReveal`, y `<ul>` de 4 `Stat` con `useCountUp` cada uno.

**`Axes.tsx`**: scroll horizontal en desktop. La seccion fija su `height` por JS (`viewport.clientHeight + (track.scrollWidth - viewport.clientWidth)`), se re-mide en `ScrollTrigger.addEventListener('refreshInit', ...)`, y `gsap.to(track, { x: () => -distance(), scrub: 1, invalidateOnRefresh: true })`. En mobile o sin motion los paneles se apilan (el CSS del track horizontal cuelga de `:root[data-motion='ok']` dentro de `@media (min-width:64rem)`).

**`Agenda.tsx`**: `SegmentedControl` Dia/Noche con dos `role="tabpanel"`, uno oculto con `hidden`. El panel de noche lleva `data-theme={Theme.Dark}`, o sea **se oscurece solo**. Al cambiar de tab, un `useGSAP` con `dependencies: [track, motionEnabled]` hace fade-in escalonado de `[data-agenda-item]` dentro del panel activo (selector por id: `#agenda-panel-${track} [data-agenda-item]`).

**`VenueMap.tsx`**: SVG esquematico de 1000x600 con formas de pabellones coloreadas por eje, y **los pines son `<button>` HTML posicionados en porcentaje sobre el SVG** (`left: (x/1000)*100%`), no handlers dentro del SVG. `aria-pressed`, `aria-label`, y un `<aside aria-live="polite">` con el detalle del pin activo mas una leyenda navegable.

**`News.tsx`**: 3 tarjetas con `Placeholder`, `useStaggerReveal`, y el patron correcto de "tarjeta con imagen y titulo linkeados": la imagen va en un `<a tabIndex={-1} aria-hidden="true">` para no duplicar el link en el orden de tabulacion.

**`Tickets.tsx`**: 3 tarjetas; la destacada lleva `data-theme={invertTheme(sectionTheme)}`, o sea siempre contrasta con la seccion, sea cual sea la preferencia del usuario.

**`Sponsors.tsx`**: 4 niveles. El principal en fila, oro y plata en `Marquee` (uno reverse), institucionales en lista.

**`Contact.tsx`**: formulario con `useId()` para los ids de campo, `<select>` con los 4 `ContactTopic`, y un estado `'idle' | 'sent'` que muestra una confirmacion con `role="status"`. No envia nada (mockup).

---

## 17. Accesibilidad transversal

Inventario de lo que efectivamente esta implementado, verificado leyendo el codigo:

**Estructura**

- Landmarks: `<header>`, `<main id="main">`, `<footer>`, `<nav aria-label>` (dos, con labels distintos: "Secciones principales" y "Todas las secciones"), `<aside>`.
- Cada `<section>` lleva `aria-labelledby` apuntando a su `h2` (via la prop `labelledBy` de `Section`).
- Un solo `h1` (en el Hero). Jerarquia `h2` (secciones) -> `h3` (items) -> `h4` (filas de agenda) sin saltos.
- Skip link `<a href="#main" class="skip-link">Ir al contenido</a>`, primer elemento del arbol, z-index 61, visible con `:focus-visible`.

**Teclado**

- Todo lo interactivo es un elemento nativo (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`). No hay `div` con `onClick`.
- Menu: `role="dialog"` + `aria-modal` + focus trap + Escape + `inert` cuando esta cerrado + retorno del foco.
- Tabs Dia/Noche: patron APG completo con roving tabindex y flechas.
- Pines del mapa: `<button>` HTML, no eventos dentro del SVG.
- `:focus-visible` global con anillo de 3 px en el token `--focus`, que cambia por tema.

**Estados comunicados**

| Patron | Donde |
|---|---|
| `aria-pressed` | `Chip` (filtros de rubro), `ThemeToggle`, pines del mapa, leyenda del mapa |
| `aria-expanded` + `aria-controls` | `Accordion`, boton "Menú" |
| `aria-haspopup="dialog"` | boton "Menú" |
| `aria-selected` + `aria-controls` + roving tabindex | `SegmentedControl` |
| `role="switch"` + `aria-checked` | `MotionToggle` |
| `role="status"` | contador de resultados de Expositores, confirmacion del formulario, Preloader |
| `aria-live="polite"` | detalle del mapa, Preloader |
| `role="region"` + `aria-labelledby` | paneles del `Accordion` |
| `aria-hidden="true"` | `ScrollRail` entero, iconos, monogramas, wordmark del pie, burger, imagen de las tarjetas de noticia |
| `visually-hidden` | labels de inputs, "Cargando", ", ir al inicio", "Eje X, " en las filas de agenda |

**Movimiento**

Cubierto en la seccion 4. Los tres niveles: media query por defecto, override del usuario persistido, y un boton de rescate en el hero. Lenis directamente no se instancia con motion apagado. `data-reveal` solo oculta si el JS confirmo que el motion esta activo.

**Contraste**

Declarado AA en ambos temas con dos casos borde documentados en el codigo: el CTA coral con texto noche (5.6:1, con blanco no llegaba) y el velo del header al 92 % (porque el wordmark del pie es el peor escenario).

**Lo que falta o es debil**

1. El `Accordion` cerrado sigue en el arbol de accesibilidad (ver seccion 11.3).
2. `.input:focus { outline: none }` en Expositores reemplaza el anillo global por un borde inferior de acento. Cumple pero es mas debil que el resto del sitio.
3. `useFocusTrap` no filtra elementos ocultos ni `inert` dentro del contenedor.
4. No hay `prefers-contrast` ni `forced-colors` (modo alto contraste de Windows).
5. `THEME_COLOR` sin conectar, o sea la barra del navegador en mobile queda siempre oscura aunque el usuario elija tema claro.
6. El `ThemeQuickToggle` no permite volver a `Auto`.

---

## 18. `docs/memoria-descriptiva.md`

Archivo: `F:/GitHub/expojuy-2026/docs/memoria-descriptiva.md`, 277 lineas, markdown limpio con separadores `---` entre secciones y numeracion `01` a `08`.

**Estructura completa:**

| Seccion | Contenido | Extension |
|---|---|---|
| Encabezado | Titulo, contexto (Desafio Digital, etapa 1) | 5 lineas |
| `01 Concepto general` | "El logo se desarma": los 4 bloques son ejes, la "U" es la forma recurrente. Un solo momento de motion narrativo (preloader + hero), el resto responde a acciones del usuario. | ~25 lineas |
| `02 Objetivos` | 4 del sitio (comunicar, resolver consultas, convertir, mostrar el territorio) y 2 tecnicos (que el mockup sea el sitio, que sea accesible y rapido medido con herramientas). | ~20 lineas |
| `03 Organizacion del contenido` | Tabla de las 11 secciones con "que resuelve" cada una. Explica la lista unica de secciones y la separacion enums/labels. | ~30 lineas |
| `04 Criterios de diseno` | Tipografia (una familia variable, dos personalidades), color (dos capas de tokens), ritmo claro/oscuro, movimiento con reglas (sin pin, `fromTo` en vez de `from`, una fuente de verdad), jerarquia de radios. | ~40 lineas |
| `05 Tecnologias` | Tabla capa / eleccion / por que, mas el arbol de `src/` comentado y las tres reglas de orden. | ~30 lineas |
| `06 Estrategia de accesibilidad` | Estructura, teclado, estados comunicados, contraste, foco visible, movimiento. Declara Lighthouse 100 en accesibilidad en ambos perfiles. | ~40 lineas |
| `07 Estrategia responsive` | Mobile-first, tabla de 3 breakpoints con justificacion, el dato de que 15 de 17 media queries estan en 64rem, y el argumento de "fluido antes que escalonado" con `clamp()`. Declara CLS 0. | ~30 lineas |
| `08 Uso de inteligencia artificial` | Declaracion completa: que se hizo con Claude Code, como se verifico (Chrome DevTools MCP, Lighthouse CLI, tsc/oxlint/vite build), que **no hay ninguna imagen generada por IA**, y que el criterio (concepto, estructura, paleta, motion) es del equipo. | ~40 lineas |

**Como se usaria de base para un PDF entregable:**

El documento ya esta escrito para eso. Es autocontenido, no depende del codigo para leerse, tiene jerarquia de titulos consistente (`#`, `##`, `**negrita**` para subsecciones), tablas markdown estandar y separadores horizontales que se convierten en saltos de pagina naturales.

Lo que habria que hacer para el PDF:

1. **Portada**: falta. Titulo, logo, equipo, fecha, version.
2. **Indice**: falta. Las 8 secciones ya estan numeradas, o sea es automatico con Pandoc (`--toc`).
3. **Capturas**: no tiene ninguna imagen. Un PDF entregable de una propuesta web necesita al menos 4 o 5 capturas (hero de dia, hero de noche, expositores, mapa, mobile). Es el trabajo principal.
4. **Puntajes de Lighthouse**: se declaran en prosa (100 en accesibilidad, CLS 0) pero no hay tabla de los cuatro puntajes ni captura del reporte. Convendria una tabla mobile/desktop con las 4 categorias.
5. **Conversion**: `pandoc docs/memoria-descriptiva.md -o memoria.pdf --toc --pdf-engine=xelatex -V mainfont="Bricolage Grotesque"` da un resultado presentable en un comando. Alternativa mas controlada: una plantilla HTML con los tokens del sitio, impresa desde Chrome.
6. **Cuidado con los caracteres**: el documento usa comillas tipograficas y guiones largos que pueden romper en LaTeX sin la configuracion correcta de fuente.

**Discrepancias detectadas entre la memoria y el codigo** (menores, pero conviene corregirlas antes de entregar):

- La memoria dice "17 media queries" y "15 en 64rem"; el conteo real es **18 en total** (17 de breakpoint mas 1 de `prefers-reduced-motion`), con **15 en 64rem**, 1 en 40rem, 1 en 48rem.
- La memoria menciona "5fr/7fr en Expositores, FAQ y Contacto"; verificado: Expositores usa `5fr 7fr` en `.toolbar`, FAQ usa `5fr 7fr` en `.layout`. Correcto.
- La memoria afirma "Lighthouse da 100 en Accesibilidad en mobile y en desktop". No hay reportes commiteados (la carpeta `reports/` esta en `.gitignore`), o sea el dato no es verificable desde el repo. Para el entregable conviene adjuntar los HTML o al menos las capturas.

---

## 19. `README.md`, `index.html`, `public/`

`README.md` (154 lineas) tiene: como correr el proyecto, como correr la auditoria (con la advertencia del motion en headless), el concepto, una tabla de stack, el arbol de `src/` comentado, las reglas que sostienen el orden, la explicacion del control de animaciones, la del tema claro/oscuro, el listado de accesibilidad, el resumen de responsive, la etapa 2 y los pendientes con la organizacion.

Es un README de calidad, orientado a que otra persona entienda **por que** estan las cosas, no solo como correrlas. Para la web final unificada sirve como plantilla de estructura.

`index.html` y `public/` cubiertos en las secciones 1.7 y 1.8.

---

## 20. Hallazgos, bugs y deuda tecnica detectada

Ordenados por relevancia para la fusion.

### 20.1 Bugs reales

**B1. El boton de limpiar del buscador de expositores se rompe en tema claro.**
`src/components/sections/Exhibitors.module.css:28-30`

```css
.input::-webkit-search-cancel-button { filter: invert(1); }
```

La regla es incondicional, pero la seccion es `Theme.Dark` **por diseno** y el usuario puede forzar `light` desde el toggle. En ese caso la X queda blanca sobre fondo claro, o sea invisible. Fix: colgar la regla de `[data-theme='dark']` o usar un icono propio.

**B2. Las anclas quedan tapadas por el header cuando el movimiento esta apagado.**
`src/providers/LenisProvider.tsx:16-23`

Sin Lenis, `nativeScrollTo` usa `element.scrollIntoView({ block: 'start' })`, que **no aplica el `SCROLL_OFFSET = -72`**. El primer texto de cada seccion queda debajo del header fijo de 80 px. Fix de una linea: agregar `scroll-margin-top: calc(var(--header-h) + 1rem)` a `.section` en `Section.module.css`. Eso ademas mejora el comportamiento de las anclas al cargar la pagina con hash.

**B3. El contenido cerrado del acordeon sigue en el arbol de accesibilidad.**
`src/components/ui/Accordion.module.css:65-67`

`.panel[hidden] { display: grid }` anula el `display:none` del user agent, o sea el atributo `hidden` deja de ocultar semanticamente. El texto clipeado sigue siendo alcanzable por lector de pantalla. Fix: agregar `visibility` con `transition-behavior: allow-discrete`, o `content-visibility: hidden` en el panel cerrado.

**B4. `useBodyLock` no compensa el ancho de la scrollbar.**
`src/hooks/useBodyLock.ts`

En Windows con scrollbar clasica, abrir el menu produce un salto lateral de ~15 px en todo el layout. Fix: medir `window.innerWidth - document.documentElement.clientWidth` y aplicarlo como `padding-right` mientras dura el lock.

**B5. `useAnchorClick` hace `preventDefault` incondicional.**
No respeta Ctrl/Cmd+click ni el boton del medio. Impacto practico bajo (son anclas internas), pero es un detalle de correccion.

### 20.2 Codigo muerto

- **7 tokens declarados y nunca usados**: `--accent-contrast`, `--c-coral-deep`, `--c-lila-deep`, `--c-oliva-deep`, `--c-ocre`, `--ease-in-out`, `--r-input`.
- **`THEME_COLOR`** (`src/constants/theme.ts:7`): declarado, nunca importado. La `<meta name="theme-color">` queda fija en `#17122B`.
- **`slugify`** (`src/lib/text.ts:7`): declarado, nunca usado.
- **`clamp`, `lerp`, `mapRange`** (`src/lib/math.ts`): solo se usan entre si, ningun componente los llama.
- **`isBrowser`** (`src/lib/dom.ts:10`): solo lo usa `isTouchDevice` en el mismo archivo.
- **`TICKET_LABEL`** (`src/constants/labels.ts:56`): declarado; los nombres de las entradas vienen del campo `name` de cada ticket.
- **`MOTION_ATTRIBUTE`**: exportado pero solo se usa en el propio `motion.ts`.

### 20.3 Escalabilidad

- **Busqueda de expositores sin debounce ni indice.** Con 16 items no importa; con 300 (el `EXHIBITORS_TOTAL` real) cada tecla ejecuta 300 `normalize()` con `String.normalize('NFD')` y regex. Fix: precalcular el haystack normalizado una vez por expositor (memo a nivel de modulo) y sumar debounce de ~150 ms.
- **Sin paginacion ni virtualizacion** en la lista de expositores.
- **Sin ordenamiento**: la lista sale en el orden del array.
- Las respuestas del FAQ son **strings planos**, sin soporte para links ni markdown.

### 20.4 Consistencia y deuda menor

- Las escalas de duracion CSS (180/320/700 ms) y GSAP (350/700/1200 ms) no coinciden.
- `ORGANIZERS` esta hardcodeada en `Footer.tsx` en vez de vivir en `data/` o `constants/`.
- `Contact.tsx:80` pasa `variant={undefined}` explicitamente a un `Button` (ruido, el default ya es Primary).
- `Section.module.css` define `.bleed { padding: 0 }` que es redundante con el default.
- El sitemap referenciado en `robots.txt` no existe.
- No hay Open Graph ni Twitter Card, o sea el sitio compartido en redes se ve sin preview.
- No hay tests ni CI.

---

## 21. Notas de portabilidad consolidadas

### 21.1 Grafo de dependencias externas por pieza

| Pieza adoptada | React | CSS Modules | GSAP | Lenis | Otros |
|---|---|---|---|---|---|
| **Expositores** | `useState`, `useMemo`, `useId` | 128 lineas | **solo via `SectionHeader`** | no | tokens, `Intl` no |
| **FAQ / Accordion** | `useState`, `useId` | 110 lineas (31 + 79) | **solo via `useSplitReveal` del h2** | no | tokens |
| **Header** | `useState` | 119 lineas | `ScrollTrigger` (velo + spy) | via `useAnchorClick` | tokens, `color-mix`, `backdrop-filter` |
| **MenuOverlay** | `useRef`, `useEffect` | 108 lineas | `gsap.timeline` (apertura) | via `useBodyLock`, `useAnchorClick` | `inert`, `clip-path`, `document.activeElement` |
| **ScrollRail** | `useRef` | 51 lineas | `ScrollTrigger` (progreso) | no | `writing-mode` |

### 21.2 Que se lleva tal cual a cualquier stack (cero cambios)

Estos archivos son TypeScript o CSS puro, sin React ni librerias:

```
src/types/enums.ts
src/types/index.ts
src/constants/animation.ts
src/constants/event.ts
src/constants/labels.ts
src/constants/navigation.ts
src/constants/routes.ts
src/constants/theme.ts
src/data/*.ts            (los 10)
src/lib/cn.ts
src/lib/dom.ts
src/lib/exhibitors.ts
src/lib/format.ts
src/lib/math.ts
src/lib/text.ts
src/lib/motion.ts        (JS plano; solo el hook que lo consume es React)
src/lib/theme.ts         (idem)
src/providers/lenis-store.ts
src/styles/tokens.css
src/styles/globals.css   (menos el bloque de Lenis si se saca Lenis)
scripts/audit.mjs        (cambiando el comando del server)
public/*
```

Es aproximadamente **el 40 % del codigo del repo**, y es el 40 % que define el sistema (tokens, tipos, datos, formato, filtros, tema, motion).

**Unica salvedad:** los `enum` de TypeScript. Si la web final usa un runtime con type-stripping o activa `erasableSyntaxOnly`, hay que convertirlos:

```ts
// antes
export enum Sector { Mining = 'mineria', /* ... */ }
// despues
export const Sector = { Mining: 'mineria', /* ... */ } as const
export type Sector = (typeof Sector)[keyof typeof Sector]
```

La conversion es mecanica y no cambia ningun sitio de uso (`Sector.Mining` sigue funcionando, `Record<Sector, string>` sigue funcionando).

### 21.3 Migracion a Astro

| Pieza | Estrategia |
|---|---|
| Tokens y globals | Copiar tal cual en `src/styles/`. Importar en el layout. |
| Tipos, constants, data, lib | Copiar tal cual. Los `data/*.ts` se pueden convertir a Content Collections con schema Zod si se quiere validacion. |
| `SieteColores` | Convertir a `.astro`. El `useMemo` con seed pasa a calculo en build: **mejor**, se serializa en el HTML. |
| **Expositores** | Island `client:visible`. O version sin JS: renderizar los 16 y filtrar con vanilla JS (~30 lineas) sobre `data-sector` y `data-search`. Recomendado: island de React reutilizando el componente tal cual. |
| **Accordion** | Vanilla JS de ~15 lineas, o `<details>` si se acepta perder la animacion, o island. El CSS se copia sin cambios. |
| **Header** | `.astro` estatico para el markup, mas un `<script>` de ~40 lineas: IntersectionObserver para el scroll spy (`rootMargin: '-48px 0px -100% 0px'`), sentinel de 40 px para el velo, `themeStore` copiado para el toggle. |
| **MenuOverlay** | `.astro` para el markup + `<script>` con `inert`, focus trap (`lib/dom.ts` se copia tal cual), Escape y body lock. La animacion pasa a CSS: `clip-path` con `transition` y stagger con `transition-delay: calc(var(--i) * 60ms)`. |
| **ScrollRail** | `animation-timeline: scroll()` de CSS puro, con fallback. |
| GSAP | Se puede sacar por completo si se resigna el SplitText por lineas y el scrub del hero. Si se conserva el hero, GSAP entra solo en esa island. |
| Lenis | Opcional. Reemplazable por `scroll-behavior: smooth` + `scroll-margin-top`. |

**Esfuerzo estimado:** Expositores y FAQ son medio dia cada uno. El navbar completo (header + menu + rail) sin GSAP ni Lenis es 1 a 2 dias, la mayor parte en reescribir la animacion de apertura y el scroll spy.

### 21.4 Migracion a Next + Tailwind

| Pieza | Estrategia |
|---|---|
| Tokens | Dos caminos: (a) mantener `tokens.css` como CSS variables y referenciarlas desde `tailwind.config` (`colors: { bg: 'var(--bg)', fg: 'var(--fg)' }`) o desde `@theme` en Tailwind 4. **Recomendado**: conserva el sistema de `data-theme` anidable intacto. (b) Traducir a `theme.extend` con valores literales, perdiendo el tema por seccion. |
| Tema | `darkMode: ['variant', '&:where([data-theme=dark], [data-theme=dark] *)']`. Con la opcion (a) de tokens, ni siquiera hace falta: los `var(--bg)` cambian solos. |
| CSS Modules | Next los soporta nativamente, o sea **se pueden dejar como estan** y convivir con Tailwind. Es el camino de menor riesgo para la fusion. |
| Componentes | Todos necesitan `'use client'` (usan hooks y APIs del navegador). Los `types/`, `constants/`, `data/` y `lib/` (menos `gsap.ts` y `dom.ts`) pueden quedar en el servidor. |
| SSR | `useSyncExternalStore` ya tiene `getServerSnapshot` en los 4 stores, o sea no hay error de hidratacion. **Pero** `motionStore.init()` y `themeStore.init()` corren en `main.tsx` antes del render: en Next hay que moverlos a un `<script>` inline en `<head>` (patron `next-themes`) para evitar el flash. |
| GSAP | Funciona igual, con `'use client'`. `useGSAP` de `@gsap/react` ya maneja el cleanup. |
| Lenis | Funciona igual. Hay `lenis/react` si se prefiere el wrapper oficial en vez del provider propio. |
| `ref` como prop | `Section` usa `ref` sin `forwardRef` (React 19). Si Next usa React 18, reintroducir `forwardRef`. |
| Rutas | `constants/routes.ts` ya define el mapa completo; se convierte casi 1 a 1 en el App Router. |
| Metadata | Reemplazar `index.html` por el objeto `metadata` de Next, agregando Open Graph y JSON-LD de `schema.org/Event`. |

**Riesgo principal en Tailwind:** las 6 clases tipograficas globales (`.t-display`, `.t-title`, etc.) usan `font-variation-settings` con valores distintos de `wdth` y `opsz`. En Tailwind eso son arbitrary properties (`[font-variation-settings:'wdth'_75,'opsz'_96]`), ilegibles. Recomendado: dejarlas como componentes CSS en `@layer components`.

### 21.5 Orden sugerido de adopcion (menor a mayor riesgo)

1. `tokens.css` + `globals.css` + `types/` + `constants/` + `lib/` puros. Cero riesgo, habilita todo lo demas.
2. `lib/motion.ts` + `lib/theme.ts` + sus hooks + `MotionToggle` + `ThemeToggle`. Riesgo bajo, valor alto.
3. `Accordion` + seccion FAQ. Riesgo bajo.
4. Seccion Expositores (con `SectionHeader` o sin el). Riesgo bajo.
5. `Section`, `Button`, `Chip` (los tres componentes que las secciones anteriores necesitan).
6. `constants/navigation.ts` como fuente unica de secciones. **Requiere acuerdo entre los tres prototipos.**
7. Header + MenuOverlay, decidiendo primero si se conserva GSAP y Lenis o se reemplazan por APIs nativas.
8. ScrollRail (opcional, es decoracion).
