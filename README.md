# ExpoJuy 2026 — Prototipo navegable

Propuesta para la **Primera Edición del Programa Provincial de Desafíos Tecnológicos**.
Sitio institucional de ExpoJuy 2026 — _Conectando países, creando oportunidades_.

> **Estado:** prototipo en desarrollo. El contenido textual, fechas y precios son
> provisorios y están centralizados en [`src/shared/constants/site.ts`](src/shared/constants/site.ts)
> para poder reemplazarlos en un solo lugar.

## Cómo verlo

| | |
|---|---|
| **Sitio** | **https://expojuy-prototipo.vercel.app** |
| **Sistema de diseño** | [/sistema-de-diseno](https://expojuy-prototipo.vercel.app/sistema-de-diseno) — anexo técnico con la trazabilidad de cada token |

Cada push a `main` despliega a producción automáticamente. No hace falta ningún
paso manual ni credenciales para verlo: la URL es pública.

## Cómo correrlo

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm typecheck` | Genera los tipos de rutas de Next y corre `tsc --noEmit` |
| `pnpm lint` | ESLint, incluidas las reglas de frontera de arquitectura |
| `pnpm format` | Prettier sobre todo el proyecto |
| `pnpm verify` | Las tres anteriores — lo mismo que corre el CI |

## Stack

| Herramienta | Por qué |
|---|---|
| **Next.js 16** (App Router, Turbopack) | Renderizado en servidor, rutas tipadas y optimización de imágenes sin configuración |
| **React 19** + React Compiler | Memoización automática: sin `useMemo`/`useCallback` a mano |
| **Tailwind CSS 4** | Los tokens de diseño viven en CSS (`@theme`), no en un archivo de config JS |
| **Lenis** | Scroll suave, degradado automáticamente con `prefers-reduced-motion` |
| **Ambit** | Tipografía oficial provista por la organización, servida con `next/font/local` |

## Arquitectura

Vertical Slice sobre tres capas con dependencias **unidireccionales**:

```
src/
├── app/        Rutas. Capa de composición: ensambla features. Puede importar todo.
├── features/   Slices verticales autocontenidos. NO se conocen entre sí.
│   └── <feature>/{components,hooks,types,constants,data}
└── shared/     Capa base transversal. No conoce a nadie por encima suyo.
    └── {components,hooks,lib,fonts,constants,types}
```

Esas fronteras **no son una convención documentada, son un test**: `eslint.config.mjs`
las hace cumplir con `no-restricted-imports` por capa. Si un feature importa a otro,
o si `shared/` importa un feature, el lint falla y el CI se pone en rojo.

Dentro de un mismo feature se usan rutas relativas (`../components/X`); el alias
`@/features/*` está prohibido dentro de `features/` justamente para que no se pueda
colar una dependencia cruzada por descuido.

## Sistema de diseño

Ningún valor de diseño fue elegido a ojo. La trazabilidad completa está comentada en
[`src/app/globals.css`](src/app/globals.css) y se puede ver renderizada en `/sistema-de-diseno`.

- **Colores de marca**: medidos por muestreo de píxeles sobre el logotipo oficial.
- **Neutros**: generados en OKLCH al hue 297.8° — la media de los tres violetas de
  marca — con croma mínimo. No son grises: están teñidos, extendiendo el criterio que
  la propia marca ya aplica en su gris institucional (`#4B4B4D` cae en H=286.3°).
- **Texto y bordes**: cada escalón se resolvió por búsqueda binaria hasta alcanzar su
  ratio de contraste WCAG objetivo, no se eligió.
- **Escala tipográfica**: modular fluida, razón 1.200 → 1.333, generada por script.
- **Radios**: solo `0` y píldora. El isologotipo se construye con esquinas vivas y una
  semicircunferencia; la ausencia del rango intermedio es deliberada.

## Accesibilidad

Objetivo: Lighthouse ≥ 90 en todas las categorías, apuntando a 100.

- Contraste verificado numéricamente en el sistema de diseño, no estimado.
- Sobre fondo oscuro el violeta es color de relleno; los únicos acentos válidos para
  texto son lavanda (7.83:1) y cian (9.02:1).
- Anillo de foco en dos capas: un anillo de un solo color es invisible sobre el botón
  primario (2.00:1).
- `prefers-reduced-motion` respetado en CSS y en JS.
- Las animaciones de aparición son **mejora progresiva**: el HTML se sirve visible y
  el estado oculto vive detrás de una clase `.js`. Sin JavaScript, el contenido se ve.

## Calidad

Cada push corre en GitHub Actions: `typecheck` → `lint` → `format:check` → `build`.
En local, Husky corre lint-staged en cada commit y `typecheck` antes de cada push.
