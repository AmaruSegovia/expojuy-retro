# ExpoJuy 2026 - Sitio integrado

Propuesta para la **Primera Edición del Programa Provincial de Desafíos Tecnológicos**,
convocado por la Cámara de Comercio Exterior de Jujuy.
Sitio institucional de ExpoJuy 2026 - _Conectando países, creando oportunidades_.

> **Estado:** propuesta. El contenido textual, las fechas, la sede y los precios son
> provisorios, porque el kit entregado por la organización solo incluye logotipos.
> Están centralizados en [`src/shared/constants/site.ts`](src/shared/constants/site.ts)
> para poder reemplazarlos en un solo lugar, y declarados como tales en la memoria
> descriptiva.

## Cómo verlo

| | |
| --- | --- |
| **Sitio** | **https://expojuy-retro.vercel.app** |
| **Sistema de diseño** | [/sistema-de-diseno](https://expojuy-retro.vercel.app/sistema-de-diseno), anexo técnico con la trazabilidad de cada token y su ratio de contraste |
| **Memoria descriptiva** | [`docs/propuesta/ExpoJuy2026-MemoriaDescriptiva.pdf`](docs/propuesta/ExpoJuy2026-MemoriaDescriptiva.pdf) |
| **Declaración de uso de IA** | [`docs/propuesta/ExpoJuy2026-DeclaracionIA.pdf`](docs/propuesta/ExpoJuy2026-DeclaracionIA.pdf) |

La URL es pública: no hace falta instalación ni credenciales.

## Qué es este repositorio

No es un prototipo más. El equipo desarrolló **tres prototipos completos e
independientes**, cada uno en un stack distinto y por un integrante distinto, se
hizo un análisis comparado en profundidad de los tres, y este repositorio es la
integración: para cada sección se adoptó la implementación que mejor resolvía el
problema.

| Prototipo | Autor | Stack | Rasgo dominante |
| --- | --- | --- | --- |
| [mockup-expojuy](https://github.com/AmaruSegovia/expojuy-2026) | Maru | Astro estático, CSS nativo | 3,2 KB de JavaScript total, plano isométrico del predio |
| [expojuy-2026](https://github.com/IgnacioG04/expojuy-2026) | Nacho | Vite, React 19, CSS Modules | tema por sección, capa de movimiento con override del usuario |
| [expojuy-prototipo](https://github.com/ch0ripain/expojuy-prototipo) | Leo | Next 16, Tailwind 4 | mejora progresiva sistemática, sistema de diseño medido |

La procedencia sección por sección está en [`CLAUDE.md`](CLAUDE.md), y los tres
informes de análisis completos en [`docs/integracion/`](docs/integracion/).

## Cómo correrlo

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Script | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm typecheck` | `next typegen` más `tsc --noEmit` |
| `pnpm lint` | ESLint, incluidas las fronteras de arquitectura |
| `pnpm format:check` | Prettier en modo verificación |
| `pnpm verify` | Encadena typecheck, lint y formato |
| `pnpm audit` | Lighthouse sobre el build de producción |

## Calidad medida

Lighthouse sobre el build de producción, Chrome headless:

| Perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| --- | --- | --- | --- | --- |
| Móvil | 92 | 100 | 100 | 100 |
| Escritorio | 100 | 100 | 100 | 100 |

Chrome headless no hereda `prefers-reduced-motion` del sistema, así que la
auditoría mide siempre el peor caso, con todas las animaciones activas.

## Arquitectura

Vertical Slice sobre tres capas con dependencias unidireccionales:

```
app/       composición. Solo rutas, ensambla features. Importa todo.
features/  slices verticales autocontenidos. No se conocen entre sí.
shared/    capa base transversal. No conoce a nadie por encima suyo.
```

`eslint.config.mjs` convierte esa decisión en un invariante verificable: si un
feature importa a otro, o si `shared/` mira hacia arriba, el lint falla y el CI se
pone rojo. No es documentación, es un test.

El detalle completo del diseño transversal está en
[`docs/system-design.md`](docs/system-design.md).

## Documentación

| Documento | Para qué sirve |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Guía operativa: convenciones, procedencia por sección, reglas de código |
| [`docs/system-design.md`](docs/system-design.md) | Decisiones transversales: color, movimiento, accesibilidad, responsive |
| [`docs/integracion/`](docs/integracion/) | Los tres informes de análisis de los prototipos de origen |
| [`AGENTS.md`](AGENTS.md) | Trampas medidas del prototipo base, heredadas |

## Licencias

Solo se usan recursos con licencia verificada, porque usar material sin licencia es
causal de descalificación según las bases. Los pictogramas provienen de bibliotecas
permisivas (Tabler, MIT; Lucide, ISC). El logotipo y la tipografía Ambit son
propiedad de la organización y llegaron en el kit oficial: están para compilar este
sitio, no para redistribuirse. No se usan fotografías de banco ni imágenes generadas
por inteligencia artificial.

El video del inicio es material de maqueta y está señalado como tal en la memoria:
corresponde reemplazarlo por una toma de la sede real.
