# Analisis en profundidad: repositorio `F:/GitHub/mockup-expojuy`

Autor: Maru (Amaru Segovia). Prototipo 1 de 3 para la web final de ExpoJuy 2026.
Stack: Astro 7.3.1 estatico, CSS nativo, sin librerias de UI ni de animacion.
Fecha del analisis: sobre el arbol de trabajo tal cual esta en disco, sin modificar nada.
Ultimo commit: `5e10e71 3D predio` (historial de 3 commits).

---

## 0. Mapa general del repositorio

```
mockup-expojuy/
  .github/workflows/pages.yml      publicacion en GitHub Pages
  .gitattributes                   normalizacion LF + binarios
  AGENTS.md                        reglas del proyecto y registro de decisiones
  README.md                        que es, como se corre, como se publica
  PENDIENTES.md                    todo lo que es dato de demostracion (clave)
  REFERENCIAS.md                   auditoria de era-residence.com y veredictos
  LICENCIAS.md                     Tabler Icons MIT + que es propio
  BASES_Y_CONDICIONES.md           bases del concurso
  CONSIGNAS_TECNICAS_DEL_DESAFIO.md consignas tecnicas
  memoria-descriptiva.html         fuente del entregable PDF
  MEMORIA_DESCRIPTIVA.pdf          entregable (desactualizado)
  Material para compartir/         kit oficial recibido (logos, fuentes, logos sponsors)
  astro.config.mjs  package.json  tsconfig.json
  scripts/normalizar-logos.mjs     normalizador de isologotipos de sponsors
  public/  favicon.png + fonts/Ambit-*.woff2 (4)
  src/
    assets/           4 marcas + sponsors/*.png (9)
    components/       29 componentes .astro
    content/          8 colecciones (yaml + md)
    content.config.ts esquemas Zod
    data/             predio.ts, enlacePlano.ts
    layouts/Base.astro
    pages/            13 archivos de ruta -> 26 paginas HTML
    styles/           tokens.css, base.css, menu-movil.css
    utils/ruta.ts
  dist/  (compilado, 26 HTML, 1,8 MB, cero archivos .js externos)
```

Volumen de codigo fuente relevante (lineas):

| Archivo | Lineas |
|---|---|
| `src/components/PlanoIsometrico.astro` | 1252 |
| `src/layouts/Base.astro` | 413 |
| `src/styles/base.css` | 597 |
| `src/components/PanelJornada.astro` | 533 |
| `src/components/Estratos.astro` | 475 |
| `src/components/Expositores.astro` | 449 |
| `src/components/Agenda.astro` | 397 |
| `src/components/Hero.astro` | 367 |
| `src/styles/tokens.css` | 324 |
| `src/components/Pestanas.astro` | 288 |
| `src/components/Contacto.astro` | 282 |
| `src/pages/plano.astro` / `src/pages/entradas.astro` | 269 cada uno |
| `src/components/Sponsors.astro` | 239 |
| `src/components/Riel.astro` | 236 |
| `src/components/Footer.astro` | 222 |
| `src/components/Noticias.astro` | 178 |
| `src/components/Header.astro` | 172 |
| `src/content.config.ts` | 171 |
| `src/styles/menu-movil.css` | 168 |
| `src/components/TramaModular.astro` | 161 |
| `src/components/IconoEje.astro` | 151 |
| `src/components/Sobre.astro` | 132 |
| `src/data/predio.ts` | 132 |
| `src/components/Faq.astro` | 114 |
| `src/components/BarraMovil.astro` | 106 |
| `src/components/MenuMovil.astro` | 99 |
| `src/components/PanelSector.astro` | 99 |
| `src/components/CabeceraSeccion.astro` | 98 |
| `src/components/LeyendaPlano.astro` | 90 |
| `src/components/IconoActividad.astro` | 88 |
| `src/components/Cifras.astro` | 78 |
| `src/data/enlacePlano.ts` | 56 |
| `src/components/DivisorPanza.astro` | 56 |
| `src/components/Sectores.astro` | 53 |

Total fuente analizado: ~9.900 lineas.

Rasgo transversal: **todos los archivos estan comentados en espanol y en tono argumentativo**. Los comentarios explican por que se tomo cada decision, que se probo y se descarto, y con que numero medido. Ese cuerpo de comentarios es en si mismo un activo del repo: en una fusion conviene conservarlos porque documentan restricciones reales (contraste, LCP, geometria) que de otro modo se pierden.

---

## 1. Infraestructura

### 1.1 `package.json`

```json
{
  "name": "expojuy-2026", "type": "module", "version": "0.1.0", "private": true,
  "scripts": { "dev": "astro dev", "build": "astro build", "preview": "astro preview", "check": "astro check" },
  "dependencies": { "astro": "^7.3.1" },
  "devDependencies": { "wawoff2": "^2.0.1" }
}
```

- **Una sola dependencia de produccion: `astro`.** Ni React, ni Tailwind, ni GSAP, ni three.js.
- `wawoff2` es devDependency y se uso para convertir los `.otf` de Ambit a `.woff2`. No aparece importado en el codigo: fue una utilidad de una sola vez.
- Nota: `scripts/normalizar-logos.mjs` importa `sharp`, que **no esta declarado en `package.json`**. Se corrio con `sharp` instalado a mano o via npx. Es una inconsistencia a corregir si el script se conserva en la fusion.

### 1.2 `tsconfig.json`

```json
{ "extends": "astro/tsconfigs/strict", "include": [".astro/types.d.ts", "**/*.astro", "**/*.ts"], "exclude": ["dist", "node_modules"] }
```

TypeScript en modo `strict` de Astro. Los componentes declaran `interface Props` y usan tipos de `astro:content` (`CollectionEntry<'sectores'>`, etc).

### 1.3 `astro.config.mjs`

```js
const SITIO = process.env.SITIO_PUBLICO ?? 'https://expojuy.camcomexjujuy.com.ar';
const BASE = process.env.BASE_PUBLICA || undefined;

export default defineConfig({
  site: SITIO,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  vite: { build: { cssMinify: 'lightningcss' } },
});
```

Puntos clave:

- **Cero integraciones.** No hay `@astrojs/react`, ni `@astrojs/sitemap`, ni `@astrojs/mdx`. **No hay sitemap generado** pese a que el pedido lo menciona: se verifico por grep, no existe ninguna referencia a sitemap ni a robots.txt en todo el repo.
- `output: 'static'` sin adaptador SSR. Justificacion escrita en el propio archivo: el hosting que provee la Camara puede no tener Node.
- **El base path no esta escrito en el codigo.** Se inyecta por variables de entorno desde el workflow. Asi el repo se puede renombrar o mover de cuenta sin tocar codigo, y publicado en el dominio propio de la Camara basta con no definir las variables.
- `inlineStylesheets: 'auto'`: hojas chicas quedan incrustadas en el HTML.
- `cssMinify: 'lightningcss'` via Vite.

### 1.4 `src/utils/ruta.ts` (pieza critica de portabilidad)

```ts
const raiz = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const ruta = (destino = '/') => raiz + destino.replace(/^\/+/, '');
```

Existe porque Astro antepone el `base` solo a lo que genera el (hojas de estilo, scripts, imagenes procesadas) y no a lo escrito a mano en el marcado. Toda ruta interna del sitio pasa por `ruta()`. Sin eso, bajo subdirectorio los enlaces caen fuera del sitio y la tipografia Ambit da 404, con lo cual todo el sitio se dibuja con la fuente de reserva.

**Nota de portabilidad**: en Next este archivo se reemplaza por `basePath` en `next.config.js` mas el componente `<Link>`, que ya lo aplica solo. Es codigo que se tira, no que se porta.

### 1.5 `.github/workflows/pages.yml`

Dos jobs: `construir` y `publicar`.

- Trigger: push a `main` mas `workflow_dispatch`.
- Permisos minimos: `contents: read`, `pages: write`, `id-token: write`.
- `concurrency: group: pages, cancel-in-progress: true`.
- Node 22 con cache npm, `npm ci`, `npm run build`.
- Las variables `SITIO_PUBLICO` y `BASE_PUBLICA` salen de `steps.pages.outputs.origin` y `steps.pages.outputs.base_path` de `actions/configure-pages@v5`.
- Empaqueta `dist` con `actions/upload-pages-artifact@v3` y despliega con `actions/deploy-pages@v4`.

### 1.6 `.gitattributes`

`* text=auto eol=lf` mas marcado `binary` explicito para png, jpg, jpeg, webp, gif, ico, pdf, woff2, otf, ttf, eps, cdr. Razon escrita: el proyecto se edita en Windows y compila en Linux.

### 1.7 `scripts/normalizar-logos.mjs`

Script de una sola pasada, se corre a mano cuando llegan archivos nuevos: `node scripts/normalizar-logos.mjs`. Usa `sharp`.

Algoritmo, paso por paso:

1. **Quita el fondo plano**: mide la distancia euclidea de cada pixel al color de la esquina superior izquierda; si la esquina es opaca (alpha > 200) y la distancia es menor a `TOLERANCIA = 42`, pone alpha 0.
2. **Traduce luminancia a opacidad** (no a gris): `luminancia = 0.2126*r + 0.7152*g + 0.0722*b` normalizada; `densidad = negativo ? l : 1 - l`; alpha final `= 255 * alfa * min(1, densidad * ganancia)` con `ganancia` por defecto 1,25. Esto arranca el fondo y conserva el detalle interno de la marca.
3. **Negativos** (`negativo: true` en la lista): invierten el mapeo. Aplica a `ministerio-produccion` y `banco-jujuy`.
4. **Recorte a la caja real de tinta** y escalado para que todos tengan la **misma cantidad de tinta**: `TINTA_OBJETIVO = 14000` pixeles opacos, `k = sqrt(TINTA_OBJETIVO / area)` acotado por `ANCHO_MAX = 300` y `ALTO_MAX = 170`.
5. **Lienzo comun calculado**, no elegido: ancho = max(anchos finales) + 2*`MARGEN`(8), alto = max(altos finales) + 2*8.
6. Tinta unica `TINTA = [35, 35, 38]` que es `--text-titulo` (#232326).
7. Excepcion: `cauchari` lleva `ganancia: 2.1` porque su mapa de fondo es gris muy claro.

Mapeo de archivo original a id de sponsor:

| id | archivo de origen | flags |
|---|---|---|
| gobierno-jujuy | Logo-Gob-de-Jujuy-Azul.png | |
| ministerio-produccion | ministeriodesarolloeconomicao.jpg | negativo |
| camcomex | EXPOJUY_Logo2026/logo_camcomext.png | |
| jemse | jemseicono.png | |
| cauchari | powerchina-proyectos-cauchari.png | ganancia 2.1 |
| ledesma | ledesmaicono.jpg | |
| banco-jujuy | banconacion.jpg | negativo |
| uni-jujuy | logotipoUNJu.png | |
| cfi | ConsejoFederalDeInversiones.png | |

**Resultado medido en disco**: los nueve PNG de `src/assets/sponsors/` miden exactamente **316 x 186 px**. Ojo: el comentario de `Sponsors.astro` dice "todos vienen en 400 x 160", lo cual **esta desactualizado**. El lienzo real es 316 x 186.

---

## 2. Sistema de diseno

### 2.1 `src/styles/tokens.css` (324 lineas): enumeracion completa

El archivo abre declarando su regla dura: "Ningun componente debe declarar un HEX suelto", y su origen: los seis colores institucionales se extrajeron **por muestreo de pixeles del arte oficial** porque el kit no trae manual de identidad.

El dato que ordena todo el sistema, escrito en la cabecera del archivo:

```
Sobre blanco:  #820cd0 7,21:1 · #774ff0 5,05:1 · #4b4b4d 8,70:1
               #25c0d4 2,19:1 (NO APTO texto) · #bb8cff 2,53:1 (NO APTO texto)
Sobre tinta:   #25c0d4 8,12:1 · #bb8cff 7,05:1 · blanco 17,83:1
```

Es decir: **los dos colores mas vivos de la marca solo son legibles sobre superficie oscura**. De ahi que el sitio alterne papel y tinta. Esa es la decision fundacional del sistema visual entero.

#### 1. Marca (valores oficiales)

| Token | Valor | Rol |
|---|---|---|
| `--brand-violeta` | `#820cd0` | violeta fuerte, accion principal |
| `--brand-azul` | `#774ff0` | azul violeta, vinculo, trazo |
| `--brand-lavanda` | `#bb8cff` | lavanda, solo sobre tinta |
| `--brand-turquesa` | `#25c0d4` | turquesa, solo sobre tinta |
| `--brand-grafito` | `#4b4b4d` | gris del wordmark |
| `--brand-linea` | `#bdbfc1` | gris de la linea del tagline |
| `--camara-negro` | `#1f1d21` | institucional secundario |
| `--camara-rojo` | `#c1001f` | institucional secundario |

#### 2. Superficies

| Token | Valor |
|---|---|
| `--surface-papel` | `#ffffff` |
| `--surface-papel-2` | `#f4f4f7` |
| `--surface-papel-3` | `#eceaf1` |
| `--surface-tinta` | `#191621` |
| `--surface-tinta-2` | `#221d2d` |

#### 3. Texto (cada token declara su contraste verificado)

Sobre papel:

| Token | Valor | Contraste |
|---|---|---|
| `--text-titulo` | `#232326` | 15,67:1 AAA |
| `--text-cuerpo` | `#4b4b4d` | 8,70:1 AAA |
| `--text-suave` | `#5f5f66` | 6,33:1 AA |
| `--text-accion` | `#820cd0` | 7,21:1 AAA |
| `--text-dato` | `#0d5f69` | 7,35:1 AAA (turquesa profundizado) |
| `--text-numeral` | `#8c8a95` | 3,40:1 (texto grande, 120px) |
| `--text-numeral-inv` | `#6f697e` | 3,39:1 sobre tinta, texto grande |
| `--text-marcador` | `#6b6b73` | 5,28:1 AA (placeholder de campos) |

Sobre tinta:

| Token | Valor | Contraste |
|---|---|---|
| `--text-titulo-inv` | `#ffffff` | 17,83:1 AAA |
| `--text-cuerpo-inv` | `#e0dde8` | 13,31:1 AAA |
| `--text-suave-inv` | `#a8a3b8` | 7,30:1 AAA |
| `--text-dato-inv` | `#25c0d4` | 8,12:1 AAA |
| `--text-acento-inv` | `#bb8cff` | 7,05:1 AAA |

#### 4. Botones (pares verificados)

| Token | Valor | Nota |
|---|---|---|
| `--btn-primario-bg` | `#820cd0` | |
| `--btn-primario-bg-hover` | `#6c0aad` | |
| `--btn-primario-text` | `#ffffff` | 7,21:1 |
| `--btn-primario-bg-inv` | `#bb8cff` | 7,05:1 sobre tinta |
| `--btn-primario-bg-inv-hover` | `#ad7bff` | 5,99:1 sobre tinta |
| `--btn-primario-text-inv` | `#191621` | 7,05:1 sobre lavanda |
| `--btn-turquesa-bg` | `#25c0d4` | |
| `--btn-turquesa-bg-hover` | `#1ea9bb` | |
| `--btn-turquesa-text` | `#191621` | 8,12:1 |

Regla dura escrita en el archivo: **sobre turquesa nunca va texto blanco** (2,19:1).

#### 4b. Estados

`--blanco: #ffffff`, `--estado-error: #b3001b` (7,16:1 sobre papel), `--estado-error-inv: #ff8f8f` (8,13:1 sobre tinta). El rojo institucional de la Camara (`#c1001f`) queda reservado a esa marca y no se usa como error.

#### 4c. Estratos (sistema secundario, ejes productivos)

Seis colores derivados de la gama del Cerro de los Siete Colores en Purmamarca, leidos como secuencia sedimentaria abstracta. Version pensada para leerse **como texto sobre papel** (5,45 a 5,48:1); distancia perceptual minima entre ejes: dE2000 16,6.

| Token | Valor | Nombre |
|---|---|---|
| `--eje-mineria-litio` | `#ba3f31` | terracota |
| `--eje-energia` | `#8c6119` | ocre |
| `--eje-agroindustria` | `#587224` | oliva |
| `--eje-conocimiento` | `#2c765b` | cardenillo |
| `--eje-logistica` | `#3b6d99` | pizarra |
| `--eje-industria` | `#9e4e80` | malva arcilla |

Restriccion documentada: son tierras de croma bajo, subordinadas a la marca. **Un estrato nunca se usa para un boton ni para un enlace**: solo identifica a que eje pertenece algo. Sobre un bloque de estrato el texto va siempre en tinta (el blanco daria 2,74:1).

#### 4d. Estratos, variante de superficie

Mismo matiz, mas claridad y croma (claridad OKLab +0,109 a +0,174; croma +0,014 a +0,039). Se usa en las dos piezas de color a sangre: bandas del hero y columna de capas de ejes. Tinta sobre estos tonos: 5,09:1 a 6,53:1.

| Token | Valor |
|---|---|
| `--eje-mineria-litio-superficie` | `#e65c4b` |
| `--eje-energia-superficie` | `#d0901d` |
| `--eje-agroindustria-superficie` | `#85a44f` |
| `--eje-conocimiento-superficie` | `#42a782` |
| `--eje-logistica-superficie` | `#5593ca` |
| `--eje-industria-superficie` | `#cc6ca8` |

Y una tercera variante, la de tinta, declarada dentro de `.en-tinta` en `base.css`:

`#d18a82`, `#c79338`, `#84a83e`, `#47ae88`, `#75a1c7`, `#c38baf`.

Es decir: **cada eje tiene tres valores segun donde se lo pinte** (texto sobre papel, superficie plana, texto sobre tinta), y el componente no necesita saber sobre que fondo esta.

#### 4f. Escenografia del plano del predio

| Token | Valor | Rol |
|---|---|---|
| `--lugar-comun` | `#6f6f71` | grafito al 80% sobre blanco, espacios comunes |
| `--plano-cesped` | `#e3e8dd` | margen de la platea |
| `--plano-arbol` | `#93a692` | cubos de arboleda, verde de croma bajo |
| `--plano-asfalto` | `#d6d4dc` | avenida y estacionamiento |
| `--plano-espesor` | `#d2cfda` | canto claro de la platea |
| `--plano-espesor-2` | `#b9b5c4` | canto en sombra de la platea |

Justificacion: ninguno es un eje. El verde de arboles tiene un tercio del croma de agroindustria y conocimiento, con dE2000 > 20 contra ambos.

#### 4e. Grano

```css
--grano: url("data:image/svg+xml,...feTurbulence type='fractalNoise' baseFrequency='0.9'
         numOctaves='3' stitchTiles='stitch' ... feColorMatrix ... 0.42 ...");
--grano-tam: 160px;
```

Un `feTurbulence` en linea, sin archivo ni peticion de red. La `feColorMatrix` lleva el ruido a negro con alfa variable (0,42), de modo que se apoya sobre cualquier color sin tenirlo. Va solo sobre superficies de color (tinta y estratos), nunca sobre papel donde vive el texto largo, y siempre como `background-image` por debajo del contenido. Pesa 380 bytes.

#### 5. Bordes y foco

`--borde: #d9d7e0`, `--borde-fuerte: #b4b0c0`, `--borde-inv: #3a3348`, `--foco: #774ff0`, `--foco-inv: #25c0d4`, `--foco-ancho: 3px`, `--foco-offset: 2px`.

#### 6. Tipografia

```css
--font-marca: 'Ambit', 'Segoe UI', system-ui, -apple-system, sans-serif;
--peso-light: 300; --peso-regular: 400; --peso-semi: 600; --peso-bold: 700;

--t-display:  clamp(2.75rem, 1.4rem + 6.2vw, 6.5rem);
--t-titulo:   clamp(2rem, 1.2rem + 3.4vw, 3.5rem);
--t-seccion:  clamp(1.5rem, 1.1rem + 1.7vw, 2.25rem);
--t-sub:      clamp(1.125rem, 1rem + 0.6vw, 1.375rem);
--t-cuerpo:   1.0625rem;  /* 17px */
--t-chico:    0.9375rem;  /* 15px */
--t-label:    0.75rem;    /* 12px */

--lh-display: 0.92;  --lh-titulo: 1.04;  --lh-cuerpo: 1.6;
--tr-display: -0.022em;  --tr-titulo: -0.014em;  --tr-label: 0.12em;
--medida: 62ch;
```

Criterio escrito: jerarquia por tamano, caja y tracking; el peso casi no se usa porque una geometrica como Ambit se ensucia al mezclar pesos. Ratio display/label aproximado 8,7x, contra el 17,5x de la referencia auditada, que se considero ilegible en pantallas chicas.

#### 7. Espacio (escala de 4px)

`--e-1: 0.25rem`, `--e-2: 0.5rem`, `--e-3: 0.75rem`, `--e-4: 1rem`, `--e-6: 1.5rem`, `--e-8: 2rem`, `--e-12: 3rem`, `--e-16: 4rem`, `--e-24: 6rem`, `--e-32: 8rem`.

`--seccion-y: clamp(3.5rem, 2rem + 6vw, 7rem)` con objetivo declarado: home de unos 10 viewports, no 32.

Ojo: **`--e-5` no existe** pero `Sponsors.astro` lo usa como `var(--e-5, 1.25rem)`, con fallback. Es un token fantasma con red de seguridad.

#### 8. Geometria

```css
--r-nulo: 0;  --r-panza: 999px;  --trazo: 1px;  --trazo-fuerte: 2px;
--riel-w: 3.5rem;  --contenido-max: 84rem;
--h-cabecera: 4.75rem;   /* respaldo; el script lo reescribe al pixel */
--asomo: 12rem;          /* cuanto de la banda de cifras asoma al pie del hero */
```

Criterio: el isologotipo se construye con rectangulos de canto vivo y una sola panza semicircular (la J). El sitio respeta eso: **radio 0 en todo**, salvo el gesto de panza usado con cuentagotas (`DivisorPanza`, iris de la miniatura del plano).

#### 9. Movimiento y capas

```css
--dur-rapida: 140ms;  --dur-media: 260ms;  --dur-lenta: 480ms;
--ease: cubic-bezier(0.22, 0.61, 0.36, 1);
--sombra-bloque: 0 1px 0 var(--surface-papel-3);
--z-mini: 30;  --z-riel: 40;  --z-header: 50;  --z-barra-movil: 60;  --z-menu: 70;
```

Y el mecanismo central de accesibilidad de movimiento:

```css
@media (prefers-reduced-motion: reduce) {
  :root { --dur-rapida: 1ms; --dur-media: 1ms; --dur-lenta: 1ms; }
}
```

**Todas las duraciones pasan por tokens para poder anularlas de una sola vez.** Los componentes no repiten la media query: leen los tokens. Es un patron muy portable y vale la pena adoptarlo tal cual.

### 2.2 `src/styles/base.css` (597 lineas)

Contenido, en orden:

1. **Nota sobre `@font-face`**: las cuatro declaraciones **no viven aca**, las genera `Base.astro` porque una hoja de estilos no puede consultar el `base` de Astro y `inlineStylesheets: 'auto'` rompe las rutas relativas.
2. **Reset acotado**: `box-sizing: border-box` universal; `html` con `-webkit-text-size-adjust: 100%`, `scroll-behavior: smooth` y `scroll-padding-top: 4.75rem` (respaldo, el JS lo ajusta al pixel); `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } }`; `body` con `overflow-x: hidden`; titulos con `text-wrap: balance`; parrafos con `text-wrap: pretty`; listas sin marcador; imagenes en `display: block`.
3. **Foco visible obligatorio, nunca se anula**:
   ```css
   :focus-visible { outline: var(--foco-ancho) solid var(--foco); outline-offset: var(--foco-offset); border-radius: 2px; }
   .en-tinta :focus-visible { outline-color: var(--foco-inv); }
   ```
4. **`.saltar`**: skip link posicionado fuera de pantalla con `translateY(-150%)`, entra con `:focus`.
5. **`.vo`**: clase de solo lector de pantalla (`clip-path: inset(50%)`).
6. **Utilidades tipograficas**: `.t-display`, `.t-titulo`, `.t-seccion`, `.t-sub`, `.t-label`, `.t-chico`, `.medida`, `.cifra` (con `font-variant-numeric: tabular-nums`), `.numeral-seccion`.
7. **Layout**: `.envoltura` (max-width `--contenido-max`, `padding-inline: clamp(1.25rem, 4vw, 3rem)`), `.seccion` (`padding-block: var(--seccion-y)`).
8. **`.en-tinta`**: la pieza mas reutilizable del sistema. Reasigna tokens de texto, bordes, superficies y los seis ejes, de modo que **los componentes internos no necesitan saber sobre que fondo estan**:
   ```css
   .en-tinta {
     background-color: var(--surface-tinta);
     background-image: var(--grano);
     background-size: var(--grano-tam) var(--grano-tam);
     color: var(--text-cuerpo-inv);
     --text-titulo: var(--text-titulo-inv);
     --text-cuerpo: var(--text-cuerpo-inv);
     --text-suave: var(--text-suave-inv);
     --text-accion: var(--text-acento-inv);
     --text-dato: var(--text-dato-inv);
     --borde: var(--borde-inv);
     --borde-fuerte: #4a4259;
     --text-numeral: var(--text-numeral-inv);
     --surface-papel-2: var(--surface-tinta-2);
     --surface-papel-3: #2c2638;
     /* mas los seis --eje-* invertidos */
   }
   ```
   Color y grano van por separado a proposito: el atajo `background` borraria la imagen.
9. **Canal del riel**: a partir de 75rem, todas las bandas de primer nivel se extienden por debajo del riel hasta el borde de la ventana sin mover su contenido, con margen negativo mas relleno del mismo tamano:
   ```css
   @media (min-width: 75rem) {
     body.tiene-riel > header, body.tiene-riel > main > *, body.tiene-riel > footer {
       margin-inline-start: calc(-1 * var(--riel-w));
       padding-inline-start: var(--riel-w);
     }
   }
   ```
10. **Bandas de estrato por atributo**: seis reglas `[data-eje='...'] { --eje: ...; --eje-superficie: ... }`. Todo lo que lleve una banda lee `--eje` y no necesita conocer el catalogo. Este patron aparece en pestanas, fichas, leyenda, plano, agenda y hero.
11. **`.con-banda`**: la unica interaccion distintiva del sitio. Banda de 3px en reposo que crece a 10px con hover o `focus-within`, via `::before` y `transition: height`.
12. **`.meta`**: linea de metadatos separada por filetes de 1px en vez de puntos medios. Usa **container queries**: los contenedores (`.ficha`, `.nota`, `.agenda__detalle`, `.hero__texto`) declaran `container-type: inline-size`, y `@container (max-width: 24rem)` convierte la linea en grilla apilada, quitando el filete izquierdo para que no quede un trazo colgando.
13. **Botones**: `.boton` (min-height 3rem, `border-radius: var(--r-nulo)`, uppercase, tracking abierto), `.boton--primario`, `.boton--turquesa`, `.boton--linea`, mas las variantes bajo `.en-tinta`. Nota escrita: **un solo color de accion en todo el sitio, el violeta, con un valor por superficie**. El turquesa queda reservado al dato.
14. **`.enlace-ir`**: enlace de continuacion sin flecha. El subrayado se prolonga mas alla de la ultima letra via `::after { width: 1.25rem }` que crece a `2.25rem` en hover o focus. `min-height: 1.875rem` para cumplir el minimo de 24x24 de WCAG 2.5.8.
15. **Revelado al scroll**:
    ```css
    html[data-anim='si'] [data-revelar] { opacity: 0; transform: translateY(1.25rem); transition: ... }
    html[data-anim='si'] [data-revelar].es-visible { opacity: 1; transform: none; }
    html[data-anim='si'] [data-revelar-grupo] > * { ... transition-delay: calc(var(--i, 0) * 60ms); }
    ```
    **Regla no negociable**: el contenido es visible por defecto; el estado oculto lo agrega el JS y solo si el usuario no pidio movimiento reducido.
16. **Tres `@property` registradas** (viven aca porque `@property` es global y no admite ambito de componente):
    ```css
    @property --crece  { syntax: '<number>'; inherits: true; initial-value: 1; }
    @property --giro-z { syntax: '<angle>';  inherits: true; initial-value: -45deg; }
    @property --giro-x { syntax: '<angle>';  inherits: true; initial-value: 58deg; }
    ```
    Sin registrar, una variable no se anima: salta de un valor al otro a mitad de camino. `inherits: true` para que las cinco caras de un bloque la lean del bloque. Donde el navegador no las conoce, `--crece` vale 1 y el plano se pinta construido.
17. **`.bloque-gris`**: tercera superficie del sistema (`--surface-papel-2` con borde superior). Se declara aca y no en cada componente porque el riel lateral mide el fondo real de cada banda.

### 2.3 Como se hace el CSS nativo sin librerias

Inventario verificado por grep:

| Tecnica | Uso |
|---|---|
| **Custom properties** | Base de todo. Tokens globales mas variables locales por componente (`--eco`, `--cartel`, `--crece`, `--tono`, `--u`, `--i`, `--x/--y/--w/--h/--alto`). |
| **`@property`** | 3 registradas en `base.css` para poder interpolar numeros y angulos. |
| **`color-mix(in oklab, ...)`** | 10 usos. Caras del plano, techos que se aclaran, bordes de la agenda que se encienden, apagado por jornada. |
| **`:has()`** | Corazon del enlace plano-agenda. Todas las reglas se generan desde `enlacePlano.ts`. |
| **Container queries** | `container-type: inline-size` en `.mapa-marco`, `.ficha`, `.nota`, `.hero__texto`; `container: acto / size` en los bloques de la grilla de tiempo, con `@container acto (max-height: ...)`. |
| **`animation-timeline: scroll()`** | Descenso del corte geologico del hero, detras de `@supports`. |
| **CSS 3D (`preserve-3d`, `rotateX/Y/Z`, `translateZ`)** | Maqueta isometrica completa. Sin `perspective`, que es lo que la define como ortografica. |
| **`clip-path`** | Sonda del hero, iris de la miniatura, `.vo`. |
| **`mask-image`** | Desvanecido del borde izquierdo del corte. |
| **Estilos con ambito de componente** | Astro los aisla por defecto; `:global()` se usa deliberadamente y siempre esta comentado por que. |
| **`@layer`** | **No se usa.** Verificado por grep: cero ocurrencias. |
| **Nesting CSS (`&`)** | **No se usa.** Verificado por grep: cero ocurrencias. Todo el CSS esta escrito plano. |
| **Media queries de ancho** | 40rem, 48rem, 60rem, 63.999rem, 64rem, 68rem, 75rem, mas `(min-width: 60rem) and (min-height: 61rem)`. **No hay tokens de breakpoint**: los valores estan escritos a mano en cada componente. |

**Nota importante para la fusion**: la ausencia de `@layer` y de nesting significa que el CSS depende del orden de aparicion y de la especificidad natural. Al fusionar con otro repo hay que cuidar el orden de importacion de hojas y el aislamiento de los estilos de componente.

---

## 3. Astro content collections

### 3.1 `src/content.config.ts` (171 lineas)

Ocho colecciones. Todas usan loaders de `astro/loaders`: `file()` para YAML, `glob()` para Markdown.

```ts
import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { IDS_VALIDOS, letraDeEje } from './data/predio';
```

**Detalle notable**: el archivo de configuracion de contenido importa del modulo de geometria del predio. Esto ata el esquema a la planta y hace que el build falle si un dato apunta a un lugar que no existe.

#### `evento` (una sola entrada, `principal`)

```ts
loader: file('src/content/evento.yaml'),
schema: z.object({
  nombre: z.string(), lema: z.string(), bajada: z.string(),
  fecha_inicio: z.string(), fecha_fin: z.string(), fechas_texto: z.string(),
  sede: z.string(), ciudad: z.string(), provincia: z.string(), direccion: z.string(),
  email: z.string().email(), telefono: z.string(),
  redes: z.array(z.object({ nombre: z.string(), url: z.string().url() })),
})
```

Contenido real de `evento.yaml`:

| Campo | Valor |
|---|---|
| nombre | ExpoJuy 2026 |
| lema | Conectando paises, creando oportunidades |
| bajada | La feria productiva e industrial del Norte Argentino. Cuatro jornadas donde la mineria, la energia, el agro, la industria y la economia del conocimiento de Jujuy se encuentran con compradores de toda la region. |
| fecha_inicio | 2026-10-22 |
| fecha_fin | 2026-10-25 |
| fechas_texto | 22 al 25 de octubre de 2026 |
| sede | Predio Ferial de Jujuy |
| ciudad | San Salvador de Jujuy |
| provincia | Jujuy, Argentina |
| direccion | Av. Bolivia s/n, San Salvador de Jujuy |
| email | info@expojuy.com.ar |
| telefono | +54 388 400 0000 |
| redes | Instagram, LinkedIn, YouTube (URLs genericas) |

El propio archivo declara en su cabecera: "DEMOSTRACION: fechas, sede y direccion no figuran en el kit oficial. Confirmar con la organizacion antes de publicar."

#### `sectores`

```ts
schema: z.object({
  nombre: z.string(),
  corto: z.string().max(14).optional(),   // para el techo del pabellon en el plano
  resumen: z.string(),
  detalle: z.string(),
  indicadores: z.array(z.object({ valor: z.string(), etiqueta: z.string() })).max(3),
  orden: z.number().int(),
})
```

Los seis ejes (los sectores son reales, los indicadores son de demostracion):

| id | orden | nombre | corto | indicadores |
|---|---|---|---|---|
| mineria-litio | 1 | Mineria y litio | Mineria | 3 salares en produccion; 40% de las exportaciones provinciales |
| energia | 2 | Energias renovables | Energia | 300 MW capacidad solar; 4.000 m altitud de los parques |
| agroindustria | 3 | Agroindustria | Agro | 6 cadenas de valor; 12.000 empleos directos |
| conocimiento | 4 | Economia del conocimiento | Conocimiento | 90+ empresas registradas; 1.800 profesionales activos |
| logistica | 5 | Logistica y comercio exterior | Logistica | 2 pasos internacionales; 380 km al puerto de Antofagasta |
| industria | 6 | Industria y manufactura | Industria | 250 pymes proveedoras; 4 parques industriales |

Advertencia en el YAML: los valores van siempre entre comillas, porque sin comillas YAML interpreta `12.000` como el numero 12.

#### `agenda`

```ts
schema: z.object({
  dia: z.string(),                                  // "j1".."j4"
  fecha: z.string(),                                // ISO
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fin: z.string().regex(/^\d{2}:\d{2}$/),
  titulo: z.string(),
  tipo: z.enum(['conferencia','panel','ronda','taller','institucional']),
  lugar: z.enum(IDS_VALIDOS as [string, ...string[]]),  // validado contra predio.ts
  espacio: z.string(),
  oradores: z.array(z.string()).default([]),
  destacada: z.boolean().default(false),
})
```

La separacion `lugar` / `espacio` es deliberada: `lugar` es el bloque del plano y esta validado; `espacio` es el nombre que se muestra y puede ser mas fino ("Aula 2" esta dentro del Auditorio Central).

13 actividades reparidas en 4 jornadas (22 a 25 de octubre de 2026). Incluye dos actividades con `lugar: predio` (jornadas de acceso publico, 10:00 a 20:00) que el panel de jornada trata como marco del dia y no como bloque de la grilla.

#### `expositores`

```ts
schema: z.object({
  nombre: z.string(),
  eje: reference('sectores'),                    // referencia validada
  pais: z.string(),
  stand: z.string().regex(/^[A-F]-\d{2}$/),
  resumen: z.string(),
  destacado: z.boolean().default(false),
}).superRefine((dato, ctx) => {
  const esperada = letraDeEje(dato.eje.id);
  if (!esperada) return;
  if (dato.stand[0] !== esperada) { ctx.addIssue({ ... }); }
})
```

**El `superRefine` es la pieza mas interesante del esquema**: verifica que la letra del stand coincida con el pabellon del eje. La justificacion escrita dice que sin esta comprobacion diez de doce expositores de demostracion mandaban al pabellon equivocado y nadie lo notaba.

12 expositores de demostracion, 2 por eje, paises: Argentina, Bolivia, Chile. Seis marcados `destacado: true` (uno por eje) para la seleccion del home.

#### `noticias`

```ts
loader: glob({ pattern: '**/*.md', base: 'src/content/noticias' }),
schema: z.object({
  titulo: z.string(),
  fecha: z.coerce.date(),
  resumen: z.string(),
  categoria: z.enum(['institucional','expositores','agenda','prensa']),
})
```

Tres notas en Markdown, con cuerpo redactado y un blockquote final que declara "Contenido de demostracion":

| archivo | fecha | categoria |
|---|---|---|
| `acreditaciones-abiertas.md` | 2026-09-01 | institucional |
| `rueda-internacional.md` | 2026-08-20 | expositores |
| `programa-conferencias.md` | 2026-08-05 | agenda |

Sin campo de imagen: la figura de cada nota es la trama modular generada por codigo. Cuando lleguen fotos, se agrega al esquema.

#### `sponsors`

```ts
schema: z.object({
  nombre: z.string(),
  nivel: z.enum(['principal','oro','plata','institucional']),
  sitio: z.string().url().optional(),
})
```

12 patrocinadores. Ninguno declara `sitio` en el YAML actual, asi que ninguno es enlace.

| id | nombre | nivel | tiene logo |
|---|---|---|---|
| gobierno-jujuy | Gobierno de la Provincia de Jujuy | institucional | si |
| ministerio-produccion | Ministerio de Desarrollo Economico y Produccion | institucional | si |
| camcomex | Camara de Comercio Exterior de Jujuy | institucional | si |
| clustear | ClusteAR, Camara de Empresas TICs | institucional | **no** |
| sbc | Direccion Provincial de Servicios Basados en el Conocimiento | principal | **no** |
| jemse | JEMSE | oro | si |
| cauchari | Cauchari Solar | oro | si |
| ledesma | Ledesma | oro | si |
| banco-jujuy | Banco de la Nacion Argentina | plata | si |
| uni-jujuy | Universidad Nacional de Jujuy | plata | si |
| inti | INTI Jujuy | plata | **no** |
| cfi | Consejo Federal de Inversiones | plata | si |

Nueve tienen archivo, tres no (clustear, sbc, inti) y muestran el nombre compuesto con el rotulo "Isologotipo pendiente".

#### `faq`

`{ pregunta, respuesta, orden }`. Seis preguntas: entradas, costo, expositor, llegar, accesibilidad, rondas.

#### `cifras`

`{ valor: string, etiqueta: string, detalle: string, orden: int }`. Cuatro entradas: 180 expositores, 12 paises, 600 reuniones de negocios, 4 jornadas. Todas de demostracion.

---

## 4. Layout y paginas

### 4.1 `src/layouts/Base.astro` (413 lineas)

Props: `{ titulo: string; descripcion: string; indice?: { id: string; nombre: string }[] }`.

#### SEO y metadata

```astro
// En el archivo real la raya del primer caso es un guion largo literal.
const tituloCompleto = titulo === e.nombre ? nombre + ' [raya] ' + lema : titulo + ' · ' + nombre;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
```

En `<head>`:

- `<html lang="es-AR">`, charset utf-8, viewport estandar.
- `<title>` compuesto, `<meta name="description">`, `<link rel="canonical">`.
- `<link rel="icon" href={ruta('/favicon.png')} type="image/png">`.
- `<meta name="theme-color" content="#191621">` (la tinta).
- Open Graph: `og:type=website`, `og:title`, `og:description`, `og:locale=es_AR`, `og:site_name`.
- `<meta name="twitter:card" content="summary_large_image">`.
- **No hay `og:image`.** Es un faltante concreto: la tarjeta de Twitter declara `summary_large_image` pero no hay imagen que servir.
- Preload de dos fuentes: `Ambit-Regular.woff2` y `Ambit-Bold.woff2`, con `crossorigin`.

#### Tipografia generada en el marcado

```astro
const pesos = [
  { archivo: 'Ambit-Light', peso: 300 }, { archivo: 'Ambit-Regular', peso: 400 },
  { archivo: 'Ambit-SemiBold', peso: 600 }, { archivo: 'Ambit-Bold', peso: 700 },
];
const tipografia = pesos.map(({ archivo, peso }) =>
  `@font-face{font-family:'Ambit';src:url('${ruta(`/fonts/${archivo}.woff2`)}') format('woff2');
   font-weight:${peso};font-style:normal;font-display:swap}`).join('');
```

Se inyecta con `<style is:inline set:html={tipografia}></style>`. Motivo escrito: una hoja de estilos no puede consultar el `base` de Astro, y con `inlineStylesheets: 'auto'` una ruta relativa se resolveria contra otra ubicacion.

#### JSON-LD

Un `<script type="application/ld+json">` con `schema.org/Event`:

```js
{ '@context': 'https://schema.org', '@type': 'Event',
  name, description, startDate, endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'Place', name: sede,
    address: { '@type': 'PostalAddress', streetAddress, addressLocality, addressRegion: 'Jujuy', addressCountry: 'AR' } },
  organizer: { '@type': 'Organization', name: 'Camara de Comercio Exterior de Jujuy' } }
```

Se alimenta enteramente de `evento.yaml`. Al corregir las fechas, se corrige solo. No hay JSON-LD de `FAQPage` ni de `BreadcrumbList`, que serian las dos ampliaciones obvias.

#### Script inline pre-pintado

```html
<script is:inline>
  document.documentElement.dataset.js = 'si';
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.anim = 'si';
  }
</script>
```

Dos banderas que gobiernan todo el sistema de mejora progresiva:
- `data-js="si"`: hay JavaScript. Lo consultan las pestanas (para plegarse sin parpadeo) y el menu movil.
- `data-anim="si"`: ademas el usuario no pidio movimiento reducido. Lo consultan todas las animaciones.

**Este es el patron mas replicable del repo.** Con dos atributos en el `<html>` puestos antes del primer pintado, todo el CSS de animacion y de plegado cuelga de un selector, y el estado por defecto (sin JS, o con movimiento reducido) es siempre el estado final legible.

#### Estructura del `<body>`

```astro
<body class={indice.length > 0 ? 'tiene-riel' : undefined}>
  <a class="saltar" href="#contenido">Saltar al contenido</a>
  <Header />
  {indice.length > 0 && <Riel indice={indice} />}
  <main id="contenido"><slot /></main>
  <Footer />
  <BarraMovil />
```

#### View transitions

**No hay.** Verificado por grep: cero ocurrencias de `ClientRouter`, `ViewTransitions`, `transition:name` o `transition:animate` en todo `src/`. `REFERENCIAS.md` §6.12 propone la View Transitions API como reemplazo nativo de Barba.js, pero **no llego a implementarse**. Es un pendiente identificable.

#### Script del layout (unos 250 lineas de logica)

Cuatro responsabilidades:

**1. Medicion de la cabecera pegajosa.**

```js
const cabecera = document.querySelector('.cabecera');
const ajustarAncla = () => {
  const alto = Math.round(cabecera.getBoundingClientRect().height);
  document.documentElement.style.scrollPaddingTop = alto + 'px';
  document.documentElement.style.setProperty('--h-cabecera', alto + 'px');
};
ajustarAncla();
addEventListener('resize', ajustarAncla);
document.fonts?.ready.then(ajustarAncla);
```

Motivo documentado: la cabecera mide 73px en movil, 76 en escritorio y 139 a 1024px donde la navegacion se parte en dos renglones. Si `scroll-padding-top` sobra, por el hueco asoma el final de la seccion anterior.

**2. Revelado al scroll.** Un `IntersectionObserver` con `rootMargin: '0px 0px -12% 0px'` y `threshold: 0.06` que agrega `es-visible` y deja de observar. Escalona los hijos de `[data-revelar-grupo]` asignando `--i` a cada uno.

**3. Cifras que cuentan.**

```js
const contar = (el) => {
  const partes = (el.textContent ?? '').match(/^([^\d]*)(\d[\d.]*)(.*)$/s);
  const [, antes, numero, despues] = partes;
  const objetivo = Number(numero.replace(/\./g, ''));
  const agrupa = numero.includes('.');
  const duracion = 900 + Math.min(600, objetivo);
  // easing cubico: suave = 1 - (1-p)^3
  // reescribe con toLocaleString('es-AR') si el valor original agrupaba
};
```

Observador aparte con `threshold: 0.5`. Conserva lo que rodea al numero: "40%", "300 MW", "90+" y "12.000" cuentan solo su parte numerica. Las pestanas cerradas estan en `display: none` y no intersecan, asi que cada indicador cuenta la primera vez que se lo ve.

**4. Riel lateral: seccion activa y color de fondo.**

Esta es la parte mas sofisticada. Dos calculos:

```js
const fondoDe = (el) => {  // sube por ancestros hasta encontrar un fondo opaco
  let n = el;
  while (n && n !== document.documentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const p = c.match(/[\d.]+/g);
    if (p && (p.length < 4 || Number(p[3]) > 0.5)) return c;
    n = n.parentElement;
  }
  return 'rgb(255, 255, 255)';
};

const esOscura = (color) => {  // luminancia relativa WCAG
  const [r,g,b] = color.match(/[\d.]+/g).slice(0,3).map(Number).map(v => {
    const x = v/255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b < 0.18;
};
```

El riel no tiene fondo propio: se apoya en la seccion que tenga detras. Se mide la caja **del numero** (12px de alto) y no la de la fila (36px), para que la franja ambigua en el limite entre dos secciones sea tres veces mas angosta. Cada enlace recibe `data-sobre="tinta"|"papel"` y `--superficie` con el color exacto.

La seccion activa se recalcula desde posiciones reales contra una linea de lectura al 40% del viewport, con caso especial al llegar al final de la pagina. Motivo escrito: con secciones de alturas muy distintas, confiar en el ultimo cruce de un `IntersectionObserver` deja la marca pegada en una seccion que ya salio de pantalla.

Todo con `requestAnimationFrame` y bandera `pendiente` para no recalcular por cuadro.

### 4.2 Inventario de paginas (13 archivos de ruta, 26 HTML)

| Ruta | Archivo | Composicion |
|---|---|---|
| `/` | `pages/index.astro` | Hero, Cifras, DivisorPanza, Sobre, Sectores, Agenda, Expositores, Noticias, Sponsors, Faq, Contacto, mas indice de 9 items para el riel |
| `/sobre` | `pages/sobre.astro` | `<Sobre pagina />`, `<Cifras />`, `<Sectores sinNumero />` |
| `/agenda` | `pages/agenda.astro` | `<Agenda pagina />` |
| `/plano` | `pages/plano.astro` | Maqueta grande, leyenda, quien esta en cada pabellon, espacios comunes |
| `/expositores` | `pages/expositores/index.astro` | `<Expositores pagina />` |
| `/expositores/[id]` | 12 paginas | Ficha con maqueta y pabellon ya senalado |
| `/noticias` | `pages/noticias/index.astro` | `<Noticias pagina />` |
| `/noticias/[id]` | 3 paginas | Nota con cuerpo Markdown |
| `/sponsors` | `pages/sponsors.astro` | `<Sponsors pagina />` |
| `/faq` | `pages/faq.astro` | `<Faq pagina />` |
| `/contacto` | `pages/contacto.astro` | `<Contacto pagina />` |
| `/entradas` | `pages/entradas.astro` | Modalidades y formulario de acreditacion |
| `/accesibilidad` | `pages/accesibilidad.astro` | Declaracion de accesibilidad |

**Patron de reuso**: cada seccion del home acepta una prop `pagina?: boolean`. Con `pagina`, el titulo pasa de `<h2>` a `<h1>`, desaparece el numeral de seccion y desaparece el enlace a si misma. `CabeceraSeccion` acepta `numero?: number` y `nivel?: 1 | 2`. Es el mecanismo que permite tener 26 paginas con 11 componentes de seccion.

Indice del riel del home (`pages/index.astro`):

```
01 inicio      Inicio
02 sobre       Sobre ExpoJuy
03 sectores    Ejes productivos
04 agenda      Que pasa y donde
05 expositores Expositores
06 noticias    Noticias
07 sponsors    Sponsors
08 faq         Preguntas frecuentes
09 contacto    Contacto
```

Descripcion del home (meta description):

> "Feria productiva e industrial del Norte Argentino. Del 22 al 25 de octubre de 2026 en el Predio Ferial de Jujuy: expositores, agenda de actividades, rueda internacional de negocios y acreditacion gratuita."

---

# PARTE II. Piezas que se adoptan

Para cada pieza: archivos exactos, mecanismo tecnico, dependencias, shape de datos y nota de portabilidad a Next mas React.

---

## 5. Seccion "Sobre ExpoJuy"

### 5.1 Archivos

| Ruta | Rol |
|---|---|
| `src/components/Sobre.astro` | 132 lineas. La seccion. |
| `src/pages/sobre.astro` | 17 lineas. La pagina, que compone Sobre + Cifras + Sectores. |
| `src/components/CabeceraSeccion.astro` | 98 lineas. Encabezado con numeral. Dependencia. |
| `src/components/Cifras.astro` | 78 lineas. Banda de datos duros. |
| `src/components/Estratos.astro` | 475 lineas. Corte geologico. **No lo usa Sobre**, lo usa el Hero. |
| `src/components/IconoEje.astro` | 151 lineas. Pictogramas. **No lo usa Sobre**, lo usan Sectores, plano, leyenda y expositores. |

**Precision importante**: el pedido asocia `Cifras.astro`, `Estratos.astro` e `IconoEje.astro` a la seccion Sobre. En el codigo real:

- `Sobre.astro` **no importa ninguno de los tres**. Solo importa `CabeceraSeccion` y `ruta`.
- `pages/sobre.astro` si monta `<Cifras />` despues de `<Sobre pagina />`, y `<Sectores sinNumero />` al final.
- `Estratos.astro` lo importa unicamente `Hero.astro`.
- `IconoEje.astro` lo importan `Pestanas`, `PlanoIsometrico`, `LeyendaPlano`, `Expositores`, `plano.astro` y `expositores/[id].astro`.

### 5.2 `Sobre.astro`: mecanismo

Props: `{ pagina?: boolean }`. Contenido **hardcodeado en el componente**, no en una coleccion: tres parrafos de presentacion mas un arreglo de cuatro valores.

```js
const valores = [
  { titulo: 'Produccion',   texto: 'Lo que Jujuy fabrica, extrae y cultiva, mostrado por quienes lo hacen.' },
  { titulo: 'Vinculacion',  texto: 'Compradores, proveedores y organismos en el mismo predio y durante cuatro dias.' },
  { titulo: 'Conocimiento', texto: 'Tecnologia y servicios profesionales aplicados a las cadenas productivas locales.' },
  { titulo: 'Desarrollo',   texto: 'Ruedas de negocios, capacitacion y acceso a mercados para pymes de la provincia.' },
];
```

**Esto contradice la regla de `AGENTS.md`** ("Contenido nuevo va como content collection con esquema Zod, nunca hardcodeado en el componente"). Es una excepcion no declarada. Al fusionar conviene moverlo a una coleccion.

Los tres parrafos nombran a los organizadores reales: Ministerio de Desarrollo Economico y Produccion via la Direccion Provincial de Servicios Basados en el Conocimiento, mas la Camara de Comercio Exterior de Jujuy, con acompanamiento de ClusteAR. Es exactamente lo que dicen las bases del concurso.

Estructura HTML:

```
<section class="sobre seccion" id="sobre" aria-labelledby="sobre-titulo">
  <div class="envoltura">
    <CabeceraSeccion numero={pagina ? undefined : 2} nivel={pagina ? 1 : 2}
                     id="sobre-titulo"
                     titulo="Cuatro dias donde la provincia muestra lo que produce" />
    <div class="sobre__cuerpo">
      <div class="sobre__texto" data-revelar>        3 parrafos + enlace-ir (solo en el home)
      <ul class="sobre__valores" data-revelar-grupo> 4 <li> con h3 + p
```

CSS: grilla de dos columnas a partir de 60rem, proporcion `minmax(0, 1.4fr) minmax(0, 1fr)`, `gap: clamp(2rem, 5vw, 5rem)`. La columna de valores es una lista con filetes de 1px, sin gap. Los titulos de valor van en caja normal y no en versalitas, con esta justificacion escrita: "cuatro rotulos en mayusculas seguidos leen como un formulario, no como una lista de ideas".

Animacion: `data-revelar` en la columna de texto y `data-revelar-grupo` en la lista de valores; ambas cuelgan del observador de `Base.astro`.

### 5.3 `CabeceraSeccion.astro`

Props: `{ numero?: number; titulo: string; id: string; nivel?: 1 | 2 }`.

```astro
const tieneBajada = Astro.slots.has('default');
const Titulo = nivel === 1 ? 'h1' : 'h2';
```

Renderiza el numeral con `String(numero).padStart(2, '0')` y `aria-hidden="true"`, el titulo, y una bajada opcional que llega por slot. Grilla de dos columnas a partir de 60rem: `minmax(4rem, auto) minmax(0, 1fr)` con `gap: clamp(1.5rem, 3vw, 3rem)`.

Justificacion escrita: el numeral no es adorno, es el mismo numero con el que el riel lateral y el menu movil identifican esa seccion, de modo que quien viene del indice encuentra la misma marca al llegar. Reemplaza a la etiqueta en mayusculas sobre cada titulo, considerada recurso de molde y redundante con el `<h2>`.

Dependencias de Astro: `Astro.slots.has()` y el patron de tag dinamico por variable. Los dos tienen equivalente directo en React.

### 5.4 `Cifras.astro`

```astro
const cifras = (await getCollection('cifras')).sort((a, b) => a.data.orden - b.data.orden);
```

Shape: `{ id, data: { valor: string, etiqueta: string, detalle: string, orden: number } }`.

Seccion `en-tinta`. Justificacion escrita en el propio componente: es el lugar donde el turquesa institucional puede ser protagonista, porque sobre tinta da 8,12:1 mientras que sobre blanco daria 2,19:1 y seria inutilizable para texto. "La alternancia papel/tinta del sitio nace de esa restriccion, no de una moda."

Grilla: 2 columnas hasta 60rem, 4 columnas arriba. Cada item lleva `border-top: var(--trazo-fuerte) solid var(--brand-turquesa)`.

Dos calibraciones no obvias:

```css
.cifras { padding-block: 2.5rem clamp(2.5rem, 1.5rem + 3vw, 4rem); }
```

El aire de arriba es fijo y no un clamp porque entra en la cuenta de `--asomo`, que es lo que la banda deja ver al pie del hero; con un clamp esa cuenta cambiaria con el ancho de la ventana.

```css
.cifras__etiqueta { color: var(--text-dato-inv); margin-block: var(--e-2) var(--e-16); }
```

El hueco de 4rem separa el dato (numero mas etiqueta, lo que asoma al pie del hero) de la glosa, que queda debajo del corte. Sin el, la linea de detalle seria lo primero que la pantalla cortaria por la mitad.

`data-contar` en el valor: lo lee el contador de `Base.astro`. El valor final ya esta escrito por el servidor, asi que sin JavaScript no hay nada que contar.

### 5.5 `Estratos.astro` (corte geologico del hero)

Lo usa el Hero, no Sobre, pero conviene documentarlo: es la pieza grafica mas ambiciosa del repo despues del plano.

**Que es**: un corte geologico de seis formaciones con buzamiento y pliegue, laminadas en bancos, dibujadas como una pared de terreno que sale por tres bordes de la pantalla. Al desplazarse por la primera pantalla se baja por el corte, se atraviesa la superficie (la economia del conocimiento) y se llega al subsuelo, que es donde esta el litio.

**Geometria**, toda calculada en el frontmatter:

```js
const ANCHO = 600, ALTO = 1500, BUZAMIENTO = 104, X0 = -60, X1 = ANCHO + 60;
const ARRANQUE = -120, UTIL = ALTO + 260 - ARRANQUE;   // 1880
const capas = [
  { eje: 'conocimiento',  peso: 2 },
  { eje: 'logistica',     peso: 3 },
  { eje: 'industria',     peso: 2 },
  { eje: 'energia',       peso: 4 },
  { eje: 'agroindustria', peso: 3 },
  { eje: 'mineria-litio', peso: 5 },
];
```

Espesores desparejos a proposito: capas de igual grosor leen como escalera, no como estratos. El orden es narrativo: conocimiento en la superficie, litio en el fondo.

**Azar reproducible**: generador congruencial lineal con semilla fija `20261022` (la fecha de apertura), para que el dibujo sea exactamente el mismo en cada compilacion y se pueda revisar contra una captura anterior.

```js
let semilla = 20261022;
const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
```

**Curvas**: cada limite entre formaciones es una cubica de Bezier con buzamiento constante hacia la derecha mas un pliegue propio de amplitud `(azar() - 0.5) * 80`. La funcion `curva(y, pliegue)` devuelve el borde izquierdo (`y - BUZAMIENTO/2`), el derecho (`y + BUZAMIENTO/2`) y los dos comandos `C` de ida y de vuelta; `franja(a, b)` cierra el poligono entre dos curvas con `M ... C ... L ... C ... Z`.

**Bancos**: cada formacion se subdivide en `peso * 3` bancos de espesor desparejo (`0.5 + azar()` normalizado sobre la suma). Total: (2+3+2+4+3+5) por 3 = **57 trazados**. Opacidad de cada banco:

```js
opacidad: Math.max(0.16, 0.34 + (j % 4) * 0.2 + azar() * 0.12 - i * 0.035)
```

Alterna claros y oscuros dentro de la formacion, con una deriva que la va apagando hacia abajo.

Decision documentada: se probo rellenar con un `<pattern>` inclinado (cuatro rectangulos por formacion en vez de sesenta trazados) y se descarto por el dibujo, no por el costo: una trama repite el mismo banco con el mismo espesor, y lo que hace que esto se lea como roca es que ningun banco mida igual que el de al lado.

**Dos planos** para el parallax:

```js
const planos = [
  { detalle: false, opacidad: 0.3, parallax: 7 },   // las seis formaciones sin laminar
  { detalle: true,  opacidad: 1,   parallax: 19 },  // los 57 bancos
];
```

El plano de fondo ademas va corrido (`translate: -6% 2%; scale: 1.08`) porque sin desfase el parallax se veria como un temblor y no como dos planos a distinta distancia.

**El descenso**, sin JavaScript:

```css
@supports (animation-timeline: scroll()) {
  @media (min-width: 60rem) and (prefers-reduced-motion: no-preference) {
    .corte__plano {
      animation: descender linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 100vh;
    }
  }
}
@keyframes descender { to { transform: translateY(calc(var(--parallax, 12) * -1%)); } }
```

**La entrada (el sondeo)**: una sonda en turquesa baja perforando el corte y el terreno laminado queda a la vista solo por donde ya paso. Dos piezas en sincronia exacta, mismo recorrido, misma duracion y misma curva:

```css
.corte--secuencia { --perforar-dur: 1150ms; --perforar-ease: cubic-bezier(0.32, 0, 0.18, 1); --perforar-delay: 140ms; }
@keyframes perforar-y { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes sondear-y  { from { transform: translateY(-100%); opacity: 1; } 88% { opacity: 1; }
                        to { transform: translateY(0); opacity: 0; } }
```

En pantalla chica (menos de 60rem) la sonda recorre de izquierda a derecha y se muestra un solo plano (las seis formaciones sin laminar), porque en una franja de 60px los 57 bancos se leian como ruido.

Detalle tecnico registrado: la animacion de entrada va en las **capas** y no en los planos, porque los planos ya llevan el descenso por scroll y un atajo `animation` ahi pisaba el nombre del descenso y reseteaba `animation-timeline` a `auto`. Medido con `getAnimations()`, que devolvia vacio.

**Degradacion, toda declarativa**: sin `animation-timeline` el corte queda quieto y sigue siendo un dibujo; con `prefers-reduced-motion` inmovil; bajo 60rem un solo plano como franja al pie; sin JavaScript indistinto.

**Decision documentada de no usar 3D**: se probo con `perspective` mas `preserve-3d` y planos separados en Z. Se descarto por un problema conocido de iOS Safari con `preserve-3d` y porque con las capas casi de canto (`rotateX(74deg)`) los planos cruzaban el plano de la camara y la proyeccion se iba al infinito. Medido: una capa llego a 458.000 px de ancho.

### 5.6 `IconoEje.astro`

Exporta un `Record` con los seis pictogramas, para que otros componentes puedan reutilizar la geometria:

```ts
export const PICTOGRAMAS: Record<string, { d: string[]; idea: string }> = {
  'mineria-litio': { idea: 'Piqueta', d: [ ... ] },              // tabler/pick
  energia:         { idea: 'Rayo', d: ['M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11'] },   // tabler/bolt
  agroindustria:   { idea: 'Hoja', d: [ ... ] },                 // tabler/leaf
  conocimiento:    { idea: 'Cerebro', d: [ ... ] },              // tabler/brain (6 arcos)
  logistica:       { idea: 'Camion', d: [ ... ] },               // tabler/truck-delivery
  industria:       { idea: 'Fabrica con chimenea', d: [ ... ] }, // tabler/building-factory-2
};
```

Props: `{ eje: string; tamano?: number = 24; class?: string }`. Lanza `Error` si el eje no existe, o sea el build falla en vez de renderizar un hueco.

SVG: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `aria-hidden="true"`, `focusable="false"`. Toma el color de quien lo contiene.

Origen: **Tabler Icons 3.46.0, licencia MIT**, de Pawel Kuna. El texto completo esta en `LICENCIAS.md`. No exige atribucion en pantalla.

El comentario documenta que antes estaban dibujados a mano y se cambiaron porque dos de los seis no se leian a 18px (la piqueta se leia como un 7, el cerebro quedaba en un circulo con una raya), y anota la contra: un set conocido se reconoce como set conocido, y eso resta en originalidad, que es criterio explicito del jurado.

`IconoActividad.astro` (los cinco tipos de actividad de la agenda: conferencia, panel, ronda, taller, institucional) **si sigue dibujado a mano**, con `stroke-linecap="butt"` y `stroke-linejoin="miter"`. Conviven dos sets con criterios de remate distintos. Es una inconsistencia declarada en `PENDIENTES.md` §4.5.

### 5.7 Portabilidad a Next mas React

| Pieza | Atadura a Astro | Que hace falta |
|---|---|---|
| `Sobre.astro` | Baja. Solo `ruta()` y `Astro.props`. | Traduccion casi literal a un componente de servidor. Los estilos con ambito hay que llevarlos a CSS Modules o a un global con prefijo de clase. |
| `CabeceraSeccion.astro` | Media. `Astro.slots.has('default')` y el tag dinamico. | `children != null` y `const Tag = nivel === 1 ? 'h1' : 'h2'`. Trivial. |
| `Cifras.astro` | Media. `getCollection('cifras')`. | Reemplazar por lectura de YAML en build (por ejemplo con `js-yaml` en un `lib/contenido.ts`) o por un CMS. El `data-contar` necesita el observador, que hay que mover a un componente cliente o a un hook. |
| `Estratos.astro` | **Baja en lo esencial.** Todo el calculo geometrico es JS puro de servidor que emite strings de path. | Portar el frontmatter a una funcion pura que devuelva `{ bancos, formaciones }` y renderizar el SVG en JSX. El CSS de scroll-driven animation es CSS estandar. Es la pieza mas facil de portar de todo el repo. |
| `IconoEje.astro` | **Nula.** Es un objeto de trazados mas un SVG. | Copiar el `Record` y hacer un componente React de diez lineas. |

---

## 6. Seccion Noticias

### 6.1 Archivos

| Ruta | Rol |
|---|---|
| `src/components/Noticias.astro` | 178 lineas. La seccion, en modo home (3 notas) o pagina (todas). |
| `src/pages/noticias/index.astro` | 11 lineas. `<Noticias pagina />`. |
| `src/pages/noticias/[id].astro` | 118 lineas. Una nota, con `getStaticPaths`. |
| `src/content/noticias/*.md` | 3 archivos Markdown con frontmatter. |
| `src/components/TramaModular.astro` | 161 lineas. La figura de cada nota. Dependencia. |

### 6.2 Mecanismo

```astro
const ordenadas = (await getCollection('noticias'))
  .sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
const noticias = pagina ? ordenadas : ordenadas.slice(0, 3);
const variantes = ['a', 'b', 'c'] as const;
const formato = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const nombreCategoria: Record<string, string> = {
  institucional: 'Institucional', expositores: 'Expositores', agenda: 'Agenda', prensa: 'Prensa',
};
```

Cada nota es un `<li class="nota">` con cuatro piezas:

1. `.nota__figura` con `aspect-ratio: 5 / 3`, fondo `--surface-papel-2`, borde de 1px y una `<TramaModular variante={variantes[i % 3]} />` centrada. **Es el hueco exacto donde ira la fotografia cuando la haya**: se reemplaza el contenido de `.nota__figura` y nada mas.
2. `<h3 class="nota__titulo">` con un `<a>` cuyo `::after` cubre toda la tarjeta (`position: absolute; inset: 0`), de modo que toda la tarjeta es clicable pero solo el titulo es el enlace accesible.
3. `.nota__resumen`.
4. `<ul class="meta t-chico nota__meta">` con `<time datetime={ISO}>` y la categoria traducida.

CSS de la grilla: una columna hasta 48rem, tres arriba con `gap: var(--e-6)`. Cada nota lleva `border-top: var(--trazo-fuerte) solid var(--borde-fuerte)` que pasa a `--text-accion` en hover.

Microinteraccion: al senalar la nota, la trama sube 3px (`transform: translateY(-3px)`), con `@media (prefers-reduced-motion: reduce)` que anula la transicion. Se declara que la figura va a color y no en un solo tono al reposo porque en gris "se leia como imagen faltante, tres grillas grises, que es justamente lo que no hay que decir".

### 6.3 `noticias/[id].astro`

```astro
export async function getStaticPaths() {
  const notas = await getCollection('noticias');
  return notas.map((nota) => ({ params: { id: nota.id }, props: { nota } }));
}
const { Content } = await render(nota);
```

`render()` de `astro:content` compila el Markdown. El cuerpo va en `.nota-pagina__cuerpo` con un estilo `:global(blockquote)` que le pone filete turquesa de 3px y fondo `--surface-papel-2`, que es justamente donde caen los avisos "Contenido de demostracion".

La variante de trama se elige de forma deterministica: `variantes[Math.abs(nota.id.length) % 3]`.

Figura de la pagina de nota: `aspect-ratio: 5 / 2` (mas apaisada que la de la tarjeta, que es 5/3), `max-width: 60rem`.

Cabecera de la nota: linea `meta` con fecha y categoria, `<h1 class="t-titulo">`, resumen en `t-sub` con `medida`.

### 6.4 `TramaModular.astro` (lenguaje grafico propio)

Es el sustituto de la fotografia que no vino en el kit. Derivado de la construccion del isologotipo: rectangulos de canto vivo sobre grilla, mas una panza semicircular (la J). Cumple dos funciones declaradas: dar material visual sin fotografias y reforzar la idea de modulos que se conectan, que es literalmente el lema.

```ts
/** [columna, fila, ancho, alto, color, panza] sobre una grilla de 6 x 8. */
type Bloque = [number, number, number, number, string, ('t' | 'b')?];
const U = 16;   // unidad de grilla
const GAP = 2;  // aire entre modulos
```

Tres composiciones (`a`, `b`, `c`) de 6 o 7 modulos cada una, con **una sola panza por composicion**. Colores: `turquesa`, `violeta`, `azul`, `lavanda`, los cuatro de marca. Regla escrita: cada modulo se apoya en el canto del vecino, como en el isologotipo, no hay bloques flotando sueltos.

La funcion `contorno(x, y, w, h, panza)` devuelve un rectangulo simple cuando no hay panza, y cuando la hay cierra un lado con un arco de radio igual a la mitad del ancho (`a r r 0 0 1 ...`), que es la construccion exacta de la J del logo. Admite panza abajo (`'b'`) o arriba (`'t'`).

El `viewBox` se calcula del contenido real (`filas` y `columnas` derivadas de los maximos), asi que no deja aire de mas.

**Entrada sedimentaria** (solo con la prop `secuencia`): los modulos se depositan de abajo hacia arriba, como capas de un estrato. El orden se calcula ordenando por borde inferior descendente y agrupando en el mismo paso a los que comparten altura:

```js
const porFondo = [...definicion]
  .map((bloque, indice) => ({ bloque, indice, fondo: bloque[1] + bloque[3] }))
  .sort((a, b) => b.fondo - a.fondo);
```

Presupuesto declarado: 5 pasos por 80ms de desfase mas 380ms de duracion, o sea 780ms, por debajo del segundo.

Nota: `Noticias.astro` **no pasa** `secuencia`, asi que en las tarjetas la trama se pinta quieta.

### 6.5 Sobre el slider que se va a adaptar de otro repo

Estado actual: **no hay slider ni carrusel de ningun tipo**. Es una grilla estatica de 3 columnas en el home y de todas las notas en la pagina.

Puntos de anclaje para meter un slider sin romper nada:

- El contenedor es `<ul class="noticias__lista" data-revelar-grupo>`. Si se lo convierte en pista de carrusel hay que respetar que `data-revelar-grupo` asigna `--i` a cada hijo directo desde `Base.astro` y que ese escalonado usa `transition-delay`. Un carrusel que reordene o clone hijos rompe ese conteo.
- La tarjeta `.nota` es autocontenida: figura, titulo con enlace de area completa, resumen y meta. Es directamente transplantable a un item de carrusel.
- **Restriccion documentada en el propio repo**: `REFERENCIAS.md` §6.8 descarta el desplazamiento horizontal dirigido por scroll y admite una unica excepcion acotada, "un carrusel honesto", con drag real, `scroll-snap`, flechas visibles y sin secuestrar el scroll vertical. Cualquier slider que se adopte deberia cumplir eso, o la propuesta se contradice con su propia memoria.
- Cuidado tecnico: `.nota__figura` tiene `overflow: hidden` y el titulo tiene un `::after` de area completa posicionado contra `.nota` (que es `position: relative`). Si el slider agrega su propio `position` o `transform` intermedio, ese `::after` se recorta contra el contenedor equivocado y la tarjeta deja de ser clicable entera.

### 6.6 Shape de datos que consume

```ts
type Noticia = {
  id: string;                       // nombre del archivo sin extension, es el slug
  data: {
    titulo: string;
    fecha: Date;                    // z.coerce.date()
    resumen: string;
    categoria: 'institucional' | 'expositores' | 'agenda' | 'prensa';
  };
};
// en [id].astro ademas: const { Content } = await render(nota)
```

No hay campo de imagen, ni de autor, ni de etiquetas. Si el slider del otro repo espera imagenes, hay que ampliar el esquema.

### 6.7 Portabilidad a Next mas React

| Aspecto | Nota |
|---|---|
| Colecciones | `getCollection('noticias')` y `render()` se reemplazan por Contentlayer, `next-mdx-remote`, o lectura directa con `gray-matter` mas `remark`. Es el punto de mayor trabajo. |
| Rutas | `getStaticPaths` se traduce a `generateStaticParams` en App Router. Traduccion mecanica. |
| `Intl.DateTimeFormat` | Identico en ambos. Cuidado con la hidratacion si se formatea en cliente: hay que formatear en servidor. |
| `TramaModular` | Portable tal cual. Es una funcion pura que devuelve trazados SVG. |
| Estilos | El `::after` de area completa y el `aspect-ratio` son CSS estandar. |
| Dificultad | **Baja.** Es la seccion mas facil de las siete. |

---

## 7. Seccion Contacto

### 7.1 Archivos

| Ruta | Rol |
|---|---|
| `src/components/Contacto.astro` | 282 lineas. |
| `src/pages/contacto.astro` | 11 lineas. `<Contacto pagina />`. |
| `src/components/TramaModular.astro` | Dependencia: variante `b` como pieza decorativa a partir de 75rem. |

### 7.2 Mecanismo

Seccion `en-tinta` con `id="contacto"`. Grilla de dos columnas a partir de 60rem, `1fr / 1fr`, `gap: clamp(2rem, 5vw, 5rem)`.

**Columna izquierda**: numeral `09` (solo en el home; usa un estilo propio y no la clase `numeral-seccion`, porque el titulo comparte columna con los datos de contacto y no con una bajada), titulo "Hablemos", bajada, un `<dl>` con tres datos y un `<ul>` de redes.

Los tres datos son Correo (enlace `mailto:`), Telefono (enlace `tel:` con los espacios limpiados por `e.telefono.replace(/\s/g, '')`) y Donde (direccion, ciudad y provincia). Las redes abren en pestana nueva con `rel="noopener noreferrer"` y llevan un aviso solo para lectores de pantalla: `<span class="vo"> (se abre en una pestana nueva)</span>`.

Los enlaces de datos y de redes llevan `display: inline-block; padding-block: var(--e-1)` para alcanzar el objetivo tactil de 24px de WCAG 2.5.8, con la justificacion escrita al lado.

A partir de 75rem aparece una `TramaModular variante="b"` de 9rem de ancho al pie de la columna, como pieza grafica.

**Columna derecha**: el formulario.

```astro
<form class="formulario" method="post" action={'https://formsubmit.co/' + e.email}>
```

**Sin backend propio.** El sitio es estatico y el formulario apunta a un servicio externo de recepcion que la Camara configura con su cuenta. Esta declarado en el propio componente, en `AGENTS.md` y en `PENDIENTES.md` §5.3. No hay endpoint propio que mantener ni base de datos que asegurar.

Campos:

| id | name | tipo | required | autocomplete |
|---|---|---|---|---|
| c-nombre | nombre | text | si | name |
| c-empresa | empresa | text | no | organization |
| c-email | email | email | si | email, con `aria-describedby="c-email-ayuda"` |
| c-motivo | motivo | select | no | 4 opciones |
| c-mensaje | mensaje | textarea rows=5 | si | |

Opciones de motivo, hardcodeadas en el componente: "Quiero exponer", "Quiero patrocinar", "Prensa", "Consulta general".

Boton de envio: `class="boton boton--turquesa"`.

**Validacion accesible**:

```css
.campo input:user-invalid, .campo textarea:user-invalid {
  border-color: var(--estado-error-inv);
  border-width: 3px;
}
```

`:user-invalid` y no `:invalid`: solo se marca despues de que la persona toco el campo, nunca al cargar la pagina. Y el error no depende solo del color: suma un borde grueso.

Campos: `min-height: 3rem`, fondo `--surface-tinta`, borde `--borde-inv` de 2px, `border-radius: var(--r-nulo)`, foco con `border-color: var(--foco-inv)`. El `textarea` con `resize: vertical` y `min-height: 7rem`.

### 7.3 Shape de datos

Consume solo `evento.principal`:

```ts
{ email: string; telefono: string; direccion: string; ciudad: string; provincia: string;
  redes: { nombre: string; url: string }[] }
```

### 7.4 Portabilidad a Next mas React

| Aspecto | Nota |
|---|---|
| Formulario | Es HTML nativo con POST a un tercero. En Next se puede dejar identico, o cambiarlo por una Server Action o un Route Handler, que es la ventaja obvia de tener Node en el hosting. |
| `:user-invalid` | CSS estandar, sin cambios. |
| Datos del evento | Un objeto de configuracion. Trivial. |
| Dificultad | **Muy baja.** Es la pieza mas portable de las siete. |

**Recomendacion para la fusion**: si la web final corre sobre Next, este formulario deberia pasar a Server Action con validacion en servidor mas honeypot o rate limit. Hoy no tiene ninguna proteccion antispam ni confirmacion en pantalla: depende enteramente de la pagina de gracias del servicio externo.

---

## 8. Seccion Sponsors

### 8.1 Archivos

| Ruta | Rol |
|---|---|
| `src/components/Sponsors.astro` | 239 lineas. |
| `src/pages/sponsors.astro` | 11 lineas. |
| `src/content/sponsors.yaml` | 12 entradas. |
| `src/assets/sponsors/*.png` | 9 archivos, **todos 316 x 186 px**. |
| `scripts/normalizar-logos.mjs` | El normalizador (detallado en §1.7). |

### 8.2 Mecanismo

**Emparejamiento por convencion de nombre**, con `import.meta.glob` eager:

```ts
const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/sponsors/*.png', { eager: true });
const logoDe = (id: string) => archivos['../assets/sponsors/' + id + '.png']?.default;
```

Consecuencia practica declarada: **para sumar un patrocinador alcanza con dejar el archivo `<id>.png` y agregar la entrada al YAML.** No hay que tocar el componente.

**Niveles y escalas**:

```ts
const niveles = [
  { clave: 'institucional', titulo: 'Organizan y acompanan',  escala: 'grande' },
  { clave: 'principal',     titulo: 'Patrocinador principal', escala: 'grande' },
  { clave: 'oro',           titulo: 'Patrocinadores oro',     escala: 'medio' },
  { clave: 'plata',         titulo: 'Patrocinadores plata',   escala: 'chico' },
] as const;
```

Cada nivel se dibuja solo si tiene items. Cada uno es un `<section aria-labelledby>` con un `<h3 class="t-label">` en color `--text-dato`.

**Optimizacion de imagen** con `astro:assets`:

```astro
<Image class="marca__logo" src={logo} alt={sponsor.data.nombre}
       widths={[200, 400]} sizes="(min-width: 60rem) 200px, 45vw" loading="lazy" />
```

Astro genera dos webp por logo con hash en el nombre y arma el `srcset`. Verificado en `dist/_astro/`: por ejemplo `banco-jujuy.DcTzXxwV_PncVw.webp` de 3,3 KB y `banco-jujuy.DcTzXxwV_ZmQ4Ek.webp` de 4,9 KB.

**Fallback tipografico** cuando falta el archivo:

```astro
<span class="marca__nombre">
  {sponsor.data.nombre}
  <span class="marca__pendiente t-label">Isologotipo pendiente</span>
</span>
```

Criterio escrito: "lo que no llego se declara en vez de disimularse". Aplica hoy a `clustear`, `sbc` e `inti`.

**Enlace opcional**: si el sponsor declara `sitio`, el contenido se envuelve en `<a target="_blank" rel="noopener noreferrer">` mas el aviso `vo`. Hoy ninguno lo declara, asi que ninguna tarjeta es enlace.

**CSS**: las columnas se dimensionan por el nombre mas largo que tiene que entrar y no por una medida elegida de antemano. Con 13rem, "Ministerio de Desarrollo Economico y Produccion" se partia en cuatro renglones de tres palabras.

```css
.nivel__lista        { grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: var(--e-4); }
.nivel__lista--grande{ grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); }
.nivel__lista--chico { grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); }

.marca__logo                      { width: 100%; max-width: 11rem; height: auto; }
.nivel__lista--medio .marca__logo { max-width: 9rem; }
.nivel__lista--chico .marca__logo { max-width: 7.5rem; }

.nivel__lista--grande .marca { min-height: 6.5rem; font-size: var(--t-cuerpo); }
.nivel__lista--chico  .marca { min-height: 4rem;   font-size: var(--t-chico); }
```

Criterio escrito: el lienzo del archivo ya trae resuelta la proporcion entre un logo y otro, porque todos vienen con el dibujo centrado y escalado por cantidad de tinta; el CSS solo elige cuanto mide ese lienzo segun el nivel. **Es como se ordena un muro de patrocinadores: el tamano distingue las categorias y dentro de cada una todos miden igual.**

Fondo de la seccion: `--surface-papel-2` (la tercera superficie), con borde superior. Cada tarjeta `.marca` es papel blanco con borde de 1px, centrada en los dos ejes y con `text-wrap: balance` en su contenido.

CTA al pie: enlace a `/contacto` para pedir las opciones de patrocinio.

**Inconsistencia detectada**: el comentario del componente dice que los archivos vienen "en 400 x 160". Los archivos reales en disco miden **316 x 186**. El comentario quedo desactualizado respecto del script, que calcula el lienzo a partir de la tanda.

**Token fantasma**: `.marca--texto { padding-block: var(--e-5, 1.25rem); }`. `--e-5` no existe en `tokens.css`; funciona por el valor de respaldo.

### 8.3 Sobre la animacion que se va a adaptar de otro repo

Estado actual: **cero animacion**. La seccion es una grilla estatica. Lo unico dinamico es `.marca a:hover { color: var(--text-accion) }` y el `loading="lazy"` de las imagenes.

Puntos de anclaje y riesgos concretos:

- Todos los logos son **una sola tinta** (`#232326`) sobre transparente. Una animacion de color, duotono o revelado cromatico no tiene material con que trabajar. `PENDIENTES.md` §4.3 dice que lo ideal seria pedir SVG o PNG de 1.000px con fondo transparente y en positivo, y que hoy van en un solo color porque es el unico tratamiento en el que los nueve conviven sin parches.
- Si la animacion es una marquesina o cinta infinita, choca con el agrupamiento por nivel, que es informacion y no decoracion: una cinta que mezcla niveles pierde la jerarquia institucional, principal, oro y plata, que es justamente lo que la seccion comunica.
- Si la animacion es un revelado escalonado al entrar en pantalla, el enganche es directo: agregar `data-revelar-grupo` a cada `.nivel__lista` y el observador de `Base.astro` ya escalona con `--i` sin una linea nueva.
- La grilla usa `auto-fill` con `minmax`, o sea el numero de columnas depende del ancho. Cualquier animacion que dependa del indice de columna hay que calcularla en cliente.

### 8.4 Shape de datos

```ts
type Sponsor = {
  id: string;   // tambien es el nombre del PNG en src/assets/sponsors/
  data: { nombre: string; nivel: 'principal'|'oro'|'plata'|'institucional'; sitio?: string };
};
```

### 8.5 Portabilidad a Next mas React

| Aspecto | Nota |
|---|---|
| `import.meta.glob` | Especifico de Vite. En Next se reemplaza por `fs.readdirSync` en build, por imports estaticos por logo, o por un mapa explicito. Es el unico punto real de friccion. |
| `astro:assets` `<Image>` | Se reemplaza por `next/image`. Equivalencia casi uno a uno; `widths` pasa a `sizes` mas `width`/`height` explicitos. |
| Resto | HTML y CSS estandar. |
| Dificultad | **Baja**, con la salvedad del glob. |

---

## 9. Footer

### 9.1 Archivo

`src/components/Footer.astro`, 222 lineas. Lo monta `Base.astro` en las 26 paginas.

### 9.2 Mecanismo

`<footer class="pie en-tinta">` con `border-top: var(--trazo-fuerte) solid var(--brand-turquesa)`, `padding-block: var(--e-16) var(--e-12)`.

**Estructura de columnas** definida en el frontmatter:

```ts
const columnas = [
  { titulo: 'El evento',  enlaces: [
      { href: '/sobre',       texto: 'Sobre ExpoJuy 2026' },
      { href: '/agenda',      texto: 'Agenda de actividades' },
      { href: '/plano',       texto: 'Plano del predio' },
      { href: '/noticias',    texto: 'Noticias' } ] },
  { titulo: 'Participar', enlaces: [
      { href: '/expositores', texto: 'Expositores' },
      { href: '/entradas',    texto: 'Entradas y acreditacion' },
      { href: '/sponsors',    texto: 'Sponsors' },
      { href: '/contacto',    texto: 'Quiero exponer' } ] },
  { titulo: 'Ayuda',      enlaces: [
      { href: '/faq',           texto: 'Preguntas frecuentes' },
      { href: '/contacto',      texto: 'Contacto' },
      { href: '/accesibilidad', texto: 'Accesibilidad' } ] },
];
```

Cada columna es un `<nav aria-label={columna.titulo}>` con un `<h2 class="t-label">`. Son **tres landmarks de navegacion nombrados en el pie**, semanticamente correcto pero conviene revisarlo al fusionar.

**Columna de marca**: usa el isologotipo y no el logotipo completo, con una justificacion escrita que vale la pena conservar:

> El wordmark oficial es gris grafito (#4b4b4d): sobre esta superficie daria 1,3:1 y seria ilegible. Por eso aca va el isologotipo, cuyos cuatro bloques son colores vivos, y el nombre compuesto en Ambit. El kit no incluye una version en negativo del logotipo completo.

```astro
<Image src={isologotipo} alt="" widths={[56, 112]} sizes="56px" loading="lazy" />
```

`alt=""` porque el nombre va escrito al lado en texto. Debajo: nombre del evento en `t-sub` bold uppercase y el lema en `t-chico` con `max-width: 24ch`.

**Cuarta columna, "Donde y cuando"**: un `<address>` con `font-style: normal` que lleva sede, direccion, ciudad y provincia, las fechas destacadas en turquesa (`--text-dato-inv`, semibold) y el correo, mas la lista de redes.

**Pie legal**: dos parrafos separados por `border-top`, en `justify-content: space-between`. Uno nombra a los organizadores y el otro es el copyright.

**Grilla**: una columna hasta 40rem, dos hasta 68rem, y arriba `1.4fr repeat(4, minmax(0, 1fr))`, o sea cinco columnas con la de marca mas ancha.

**Objetivos tactiles**: todos los enlaces del pie llevan `display: inline-block; padding-block: var(--e-1)` para llegar a 24px de alto, con la nota escrita de que en una lista de enlaces no aplica la excepcion de texto en linea de WCAG 2.5.8. Hover: `border-bottom-color: var(--brand-turquesa)`.

### 9.3 Shape de datos

`evento.principal` completo: `nombre`, `lema`, `sede`, `direccion`, `ciudad`, `provincia`, `fechas_texto`, `email`, `redes[]`.

### 9.4 Portabilidad

Trivial. Es HTML, CSS y un import de imagen. Solo hay que traducir `<Image>` a `next/image` y `ruta()` a `<Link>`. **Dificultad: muy baja.**

---

## 10. Iconos del navbar y menu movil

### 10.1 Archivos

| Ruta | Rol |
|---|---|
| `src/components/Header.astro` | 172 lineas. Cabecera pegajosa. |
| `src/components/MenuMovil.astro` | 99 lineas. Disparador mas `<dialog>`. |
| `src/components/BarraMovil.astro` | 106 lineas. Barra fija inferior con tres accesos. |
| `src/styles/menu-movil.css` | 168 lineas. Hoja global, importada desde `Header.astro`. |

### 10.2 `Header.astro`

Dos listas de navegacion en el frontmatter:

```ts
const navegacion = [
  { href: '/sobre',       texto: 'Sobre ExpoJuy' },
  { href: '/expositores', texto: 'Expositores' },
  { href: '/agenda',      texto: 'Agenda' },
  { href: '/plano',       texto: 'Plano del predio' },
  { href: '/noticias',    texto: 'Noticias' },
];
const navegacionSecundaria = [
  { href: '/sponsors', texto: 'Sponsors' },
  { href: '/faq',      texto: 'Preguntas frecuentes' },
  { href: '/contacto', texto: 'Contacto' },
];
const rutaActual = Astro.url.pathname.replace(/\/$/, '') || '/';
```

La navegacion principal tiene 5 items; el menu movil recibe los 8 (`[...navegacion, ...navegacionSecundaria]`). Criterio escrito: las secciones restantes viven en el pie, que es donde la gente las busca.

Marca de pagina actual: `aria-current={rutaActual === ruta(item.href) ? 'page' : undefined}`, con estilo `border-bottom-color: var(--text-accion)`.

Logo: `expojuy-horizontal.png` (1934 x 542 px de origen) servido a 158px de ancho en movil y 210px a partir de 48rem, con `loading="eager"` porque esta en el primer pintado. El `alt` es el nombre del evento mas el lema.

**Mejora progresiva de la navegacion**, que es el punto fino:

```css
.cabecera__nav { order: 3; flex-basis: 100%; }        /* sin JS: segunda fila visible */
:global(html[data-js='si']) .cabecera__nav { display: none; }
@media (min-width: 64rem) {
  .cabecera__nav, :global(html[data-js='si']) .cabecera__nav {
    display: block; order: 0; flex-basis: auto; margin-inline-start: auto;
  }
}
```

Sin JavaScript la navegacion queda a la vista, envuelta en una segunda fila. Con JavaScript se oculta por debajo de 64rem y manda el menu. **Nunca queda un boton que no puede abrir nada.**

CTA "Entradas": `display: none` por defecto, `inline-flex` a partir de 64rem con `min-height: 2.75rem`.

Cabecera: `position: sticky; top: 0; z-index: var(--z-header)` (50), fondo papel, borde inferior de 1px, `min-height: 4.5rem`, `flex-wrap: wrap`. El alto real lo mide el script de `Base.astro` y lo escribe en `--h-cabecera`.

### 10.3 `MenuMovil.astro`: el icono y el dialogo

**El icono es CSS puro, no un SVG.** Tres `<span>` vacios:

```html
<button type="button" class="mm-disparador" aria-expanded="false" data-mm-abrir>
  <span class="mm-icono" aria-hidden="true"><span></span><span></span><span></span></span>
  Menu
</button>
```

```css
.mm-icono { display: grid; gap: 4px; width: 18px; }
.mm-icono span { display: block; height: 2px; background: currentColor;
                 transition: transform var(--dur-rapida) var(--ease),
                             opacity var(--dur-rapida) var(--ease); }
.mm-disparador[aria-expanded='true'] .mm-icono span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.mm-disparador[aria-expanded='true'] .mm-icono span:nth-child(2) { opacity: 0; }
.mm-disparador[aria-expanded='true'] .mm-icono span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
```

Tres barras de 2px con 4px de aire que se cruzan al abrir. **La animacion la dispara `aria-expanded`**, o sea el estado accesible y el estado visual son el mismo dato: no hay una clase paralela que pueda desincronizarse. Ademas el boton lleva la palabra "Menu" escrita al lado; no es solo un icono.

El disparador esta oculto por defecto y solo aparece con `html[data-js='si']`, y se oculta de nuevo a partir de 64rem.

**El panel es un `<dialog>` nativo abierto con `showModal()`**:

```js
const abrir = () => {
  scrollPrevio = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  panel.showModal();               // aporta foco atrapado y cierre con Escape
  disparador.setAttribute('aria-expanded', 'true');
};
disparador.addEventListener('click', abrir);
cerrar.addEventListener('click', () => panel.close());
panel.addEventListener('close', () => {
  document.body.style.overflow = scrollPrevio;
  disparador.setAttribute('aria-expanded', 'false');
  disparador.focus();
});
panel.addEventListener('click', (evento) => { if (evento.target === panel) panel.close(); });
```

El foco atrapado y el cierre con Escape **no estan reimplementados a mano**: los aporta la plataforma. El script solo maneja `aria-expanded`, el bloqueo de scroll y la devolucion del foco. El click sobre el `::backdrop` llega con `event.target === panel`, que es como se detecta el cierre por fondo. El listener de `close` cubre las tres formas de cerrar.

**Historia medida** (registrada en `AGENTS.md` y en `PENDIENTES.md` §5.1): antes era una isla de React con `client:load` y costaba 194 KB, de los cuales 184 KB eran el runtime de React. El 98 % del JavaScript del sitio existia para abrir un menu. Tras la reescritura: **3,2 KB totales y cero archivos JS externos**.

Contenido del panel: barra superior con titulo "ExpoJuy 2026" y boton "Cerrar"; lista de 8 enlaces, cada uno con su numero `01` a `08` en `aria-hidden`; pie con boton turquesa "Conseguir entradas".

```css
.mm-panel { margin: 0; padding: 0; border: 0; max-width: none; max-height: none;
            width: 100%; height: 100%; background: var(--surface-tinta);
            color: var(--text-cuerpo-inv); overscroll-behavior: contain; }
.mm-panel[open] { display: flex; flex-direction: column; }
.mm-panel::backdrop { background: rgb(0 0 0 / 0.6); }
.mm-lista a { font-size: clamp(1.5rem, 6vw, 2rem); font-weight: var(--peso-bold); text-transform: uppercase; }
.mm-lista a[aria-current='page'] { color: var(--text-dato-inv); }
.mm-pie { padding: var(--e-6) clamp(1.25rem, 4vw, 3rem) calc(var(--e-8) + env(safe-area-inset-bottom)); }
```

`env(safe-area-inset-bottom)` para el notch. `overscroll-behavior: contain` para que el scroll del panel no arrastre la pagina. El `<dialog>` trae margenes y borde propios del navegador que hay que anular explicitamente.

**Por que la hoja vive aparte**: la consumen dos superficies, el componente y el `<dialog>`, que el navegador saca del flujo normal. Es una hoja global, no con ambito de componente.

### 10.4 `BarraMovil.astro`: los tres iconos SVG

```ts
const acciones = [
  { href: '/agenda',      texto: 'Agenda',      ruta: 'M3 4h14M3 10h14M3 16h9' },
  { href: '/expositores', texto: 'Expositores', ruta: 'M9 3a6 6 0 1 0 0 12A6 6 0 0 0 9 3Zm4.5 10.5L17 17' },
  { href: '/entradas',    texto: 'Entradas',    ruta: 'M3 7h14v2.5a1.5 1.5 0 0 0 0 3V15H3v-2.5a1.5 1.5 0 0 0 0-3V7Zm7 0v8' },
];
```

Tres trazados dibujados a mano en `viewBox="0 0 20 20"`, 20 x 20 px, `stroke-width="1.6"`, `stroke-linecap="square"`, `aria-hidden="true"`. Son: tres lineas de longitud decreciente (lista, para Agenda), lupa (Expositores) y ticket con muescas laterales y linea de corte (Entradas). El texto va escrito debajo del icono, siempre.

**Nota de coherencia**: estos tres usan `stroke-linecap="square"` con ancho 1,6; `IconoEje` usa `round` con ancho 2; `IconoActividad` usa `butt` mas `miter` con ancho 2. Hay **tres criterios de remate distintos conviviendo**. Es un punto concreto a unificar en la fusion.

```css
.barra-movil {
  position: fixed; inset-inline: 0; inset-block-end: 0;
  z-index: var(--z-barra-movil);           /* 60 */
  background: var(--surface-tinta);
  border-top: var(--trazo) solid var(--borde-inv);
  padding-block-end: env(safe-area-inset-bottom);
}
@media (min-width: 64rem) { .barra-movil { display: none; } }
.barra-movil ul { display: grid; grid-template-columns: repeat(3, 1fr); }
.barra-movil li + li { border-inline-start: var(--trazo) solid var(--borde-inv); }
.barra-movil a { min-height: 3.5rem; }     /* supera los 44px de WCAG */
.barra-movil :focus-visible { outline-color: var(--foco-inv); outline-offset: -4px; }
```

Justificacion escrita: responde a la pregunta que ordena el proyecto segun `REFERENCIAS.md`, que alguien parado en el predio con una mano libre necesita tres cosas y ninguna mas, en la zona del pulgar.

`Base.astro` compensa con `body { padding-block-end: 3.5rem }` hasta 64rem, para que la barra no tape el final de la pagina.

### 10.5 Portabilidad a Next mas React

| Aspecto | Atadura | Que hace falta |
|---|---|---|
| Iconos SVG | Nula. Son strings de path. | Copiar y pegar. |
| Icono hamburguesa CSS | Nula. Es CSS puro gobernado por `aria-expanded`. | Copiar y pegar. |
| `<dialog>` con `showModal()` | Nula como plataforma, pero React necesita `useRef` y `useEffect` para llamar a `showModal()` y `close()`. | Un componente cliente de unas 40 lineas. Cuidado: React no re-renderiza al llamar `showModal()`; hay que manejar el estado con `useState` y sincronizarlo con el evento `close` para que `aria-expanded` no se desfase. |
| `html[data-js='si']` | Especifico del enfoque. En Next el JS siempre corre, asi que la mejora progresiva del "sin JS" desaparece salvo que se replique el script inline en el layout. | Decision de producto: replicar el script, o aceptar que la navegacion de respaldo no exista. |
| `aria-current` por ruta | `Astro.url.pathname` pasa a `usePathname()`. | Requiere componente cliente en el header, o pasar la ruta como prop desde el layout de servidor. |
| Dificultad | | **Baja a media.** El unico punto delicado es el ciclo de vida del `<dialog>` en React. |

---

# 11. EL MAPA DEL PREDIO CON PROFUNDIDAD (pieza clave)

Es la pieza mas compleja del repo: 1252 lineas en un solo componente, mas 132 de geometria, mas 56 de reglas generadas. Y es la que hay que trasplantar a la maqueta del otro prototipo. Lo documento con el maximo nivel de detalle.

## 11.1 Archivos e interdependencias

| Ruta | Lineas | Rol |
|---|---|---|
| `src/data/predio.ts` | 132 | **Fuente unica de la geometria.** Retícula, bloques, orden de dibujo, helpers. |
| `src/data/enlacePlano.ts` | 56 | Generador de las reglas CSS de encendido (`:has()`). |
| `src/components/PlanoIsometrico.astro` | 1252 | La maqueta: marcado, script de giro y todo el CSS 3D. |
| `src/components/LeyendaPlano.astro` | 90 | La misma informacion en texto, con `data-lugar`. |
| `src/components/PanelSector.astro` | 99 | Panel de un eje; enlaza a `/plano?lugar=...`. |
| `src/components/Sectores.astro` | 53 | Seccion de ejes que monta `Pestanas` con `PanelSector`. |
| `src/pages/plano.astro` | 269 | La pagina del plano. |
| `src/components/Agenda.astro` | 397 | Consumidor principal: plano mas grilla de tiempo enlazados. |
| `src/pages/expositores/[id].astro` | 173 | Consumidor: maqueta con el pabellon del expositor ya senalado. |
| `src/content/sectores.yaml` | 92 | Nombres, cortos y datos de los seis ejes. |

Grafo de dependencias:

```
predio.ts  ──► content.config.ts   (valida agenda.lugar y expositores.stand)
           ──► enlacePlano.ts      (genera una regla por bloque)
           ──► PlanoIsometrico     (dibuja)
           ──► LeyendaPlano        (lista)
           ──► PanelSector, Expositores, plano.astro, expositores/[id].astro
sectores.yaml ──► nombre y corto de cada pabellon
```

**Este es el rasgo arquitectonico mas valioso de la pieza**: la planta esta en un solo archivo de datos y todo lo demas se deriva. Si cambia la planta, cambian solos el dibujo, la leyenda, los recorridos, las reglas de encendido y las validaciones de esquema.

## 11.2 La retícula y los datos (`src/data/predio.ts`)

```ts
export const COLUMNAS = 9;
export const FILAS = 7.6;

export interface Bloque {
  id: string;
  x: number; y: number;    // esquina superior izquierda, en unidades de retícula
  w: number; h: number;    // tamano en unidades
  alto: number;            // volumen en la vista isometrica, en unidades
}
```

Nueve columnas por siete filas y media. Origen en la esquina superior izquierda. `alto` es el volumen en las mismas unidades que el plano.

**Los seis pabellones** (3 x 3 cada uno, dos hileras de tres):

```ts
export const PABELLONES: (Bloque & { letra: string; eje: string })[] = [
  { id: 'pab-a', letra: 'A', eje: 'mineria-litio', x: 0, y: 0, w: 3, h: 3, alto: 1.1 },
  { id: 'pab-b', letra: 'B', eje: 'energia',       x: 3, y: 0, w: 3, h: 3, alto: 1.1 },
  { id: 'pab-c', letra: 'C', eje: 'agroindustria', x: 6, y: 0, w: 3, h: 3, alto: 1.1 },
  { id: 'pab-d', letra: 'D', eje: 'conocimiento',  x: 0, y: 3, w: 3, h: 3, alto: 1.1 },
  { id: 'pab-e', letra: 'E', eje: 'logistica',     x: 3, y: 3, w: 3, h: 3, alto: 1.1 },
  { id: 'pab-f', letra: 'F', eje: 'industria',     x: 6, y: 3, w: 3, h: 3, alto: 1.1 },
];
```

Los pabellones **no llevan nombre aca**: lo toman de `sectores.yaml`. Aca solo va donde queda cada uno.

**Los tres espacios comunes** (franja al pie, mas bajos a proposito):

```ts
export const COMUNES: (Bloque & { nombre: string; corto: string })[] = [
  { id: 'acceso',    nombre: 'Acceso principal y acreditacion',      corto: 'Acceso',    x: 0, y: 6, w: 3, h: 1.6, alto: 0.5  },
  { id: 'auditorio', nombre: 'Auditorio Central',                    corto: 'Auditorio', x: 3, y: 6, w: 3, h: 1.6, alto: 0.75 },
  { id: 'patio',     nombre: 'Patio gastronomico y escenario abierto',corto: 'Patio',    x: 6, y: 6, w: 3, h: 1.6, alto: 0.35 },
];
```

Criterio escrito: la diferencia de altura es lo que separa las naves de expositores de los servicios, sin necesidad de rotularlo. Y `corto` no es una abreviatura por gusto: la planta de un bloque, girada 45 grados y aplastada, deja muy poco ancho util en el centro, y un nombre de dos renglones se salia del rombo.

**Derivados y constantes**:

```ts
export const BLOQUES: Bloque[] = [...PABELLONES, ...COMUNES];   // 9 bloques dibujables
export const LUGAR_TODO = 'predio';                              // no es un bloque
export const IDS_VALIDOS = [...BLOQUES.map((b) => b.id), LUGAR_TODO];   // 10 ids
```

`predio` es la etiqueta de las actividades que ocupan todo (la apertura al publico). Resaltarla enciende el predio entero.

**Helpers**:

```ts
export const nombreCortoDe = (id) => { /* "Pabellon A" | "Todo el predio" | nombre del comun */ };
export const letraDeEje  = (eje)   => PABELLONES.find((p) => p.eje === eje)?.letra;
export const lugarDeEje  = (eje)   => PABELLONES.find((p) => p.eje === eje)?.id;
export const ejeDeLugar  = (lugar) => PABELLONES.find((p) => p.id === lugar)?.eje;
```

**El orden de dibujo, que es la clave del z-order**:

```ts
export const ordenDeDibujo = <T extends Bloque>(bloques: T[]) =>
  [...bloques].sort((a, b) => a.x + a.y - (b.x + b.y));
```

Con el comentario explicativo:

> Con `transform-style: preserve-3d` y todos los techos a la misma altura, el navegador no tiene con que ordenarlos y cae en el orden del documento. Hay que entregarlos del fondo hacia adelante o los bloques de atras se pintan encima de los de adelante. Con la escena girada -45 grados en Z, "al fondo" es la esquina de x e y chicos, asi que el orden es por (x + y) creciente.

**Esto es el nucleo del z-order y hay que replicarlo si se cambia de motor.** No hay `z-index` en juego: el orden lo resuelve el orden del documento, ordenado por suma de coordenadas.

Orden resultante de los nueve bloques (valor de x+y entre parentesis):

```
pab-a (0) · pab-b (3) · pab-d (3) · pab-c (6) · pab-e (6) · acceso (6) · pab-f (9) · auditorio (9) · patio (12)
```

Como `Array.prototype.sort` es estable en JS moderno, los empates conservan el orden de entrada, o sea el de `[...PABELLONES, ...COMUNES]`.

## 11.3 La geometria isometrica: como se construye la profundidad

### Las dos rotaciones

```css
.mapa {
  --giro-x: 58deg;
  --giro-z: -45deg;
}
.mapa__escena {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  width: calc(var(--cols) * var(--u));
  height: calc(var(--filas) * var(--u));
  translate: -50% -50%;
  transform: rotateX(var(--giro-x)) rotateZ(var(--giro-z));
  transform-style: preserve-3d;
}
```

**No hay `perspective`.** Es ortografica, y eso es exactamente lo que la define como isometrica: las paralelas no convergen, todo lo que mide igual se dibuja igual. La justificacion escrita: en perspectiva dos pabellones del mismo tamano se dibujan distintos segun donde esten, y eso rompe la lectura de planta.

El orden de las transformaciones importa: primero se inclina la escena hacia atras 58 grados sobre X, despues se la gira -45 grados sobre Z. En CSS `transform: rotateX(a) rotateZ(b)` aplica primero la de la derecha respecto del sistema local, o sea el efecto es "el plano XY del predio, girado 45 grados en su propio plano, y despues volcado 58 grados hacia el espectador".

Nota: 58 grados no es la isometrica canonica (que seria `rotateX(60deg) rotateZ(-45deg)` para una dimétrica de 2:1, o `arctan(sqrt(2)) = 54,7` grados para la isometrica verdadera). 58 es una eleccion de dibujo: aplasta un poco menos que 60 y deja mas superficie de techo visible para los rotulos.

### La unidad `--u` y el tamano del marco

```css
.mapa-marco { container-type: inline-size; }

.mapa {
  /* (9 + 7,6 + 2 x 0,9) x cos 45 = 13 unidades por ancho del marco. */
  --u: 7.7cqi;
  --calle:   calc(0.3 * var(--u));
  --espesor: calc(0.3 * var(--u));
  position: relative;
  width: 100%;
  height: calc(9.2 * var(--u));
}
```

**El calculo**: al girar la planta 45 grados, su diagonal pasa a ser el ancho. El ancho ocupado es `(columnas + filas + 2 x margen) x cos 45`, o sea `(9 + 7,6 + 1,8) x 0,7071 = 13,01` unidades. Entonces una unidad vale `100 / 13,01 = 7,69` por ciento del ancho del contenedor, redondeado a `7.7cqi`.

El alto es `13,01 x cos 58 = 6,9` unidades de proyeccion, mas el volumen del bloque mas alto y el aire del cartel: se fija en `9.2 * var(--u)`.

**Por que existe `.mapa-marco`** (comentario textual del archivo):

> El marco existe solo para ser el contenedor de consulta. Un elemento no puede consultarse a si mismo: las unidades `cq` escritas en la regla de un contenedor se resuelven contra su ancestro contenedor, no contra el. Sin este envoltorio, `cqi` caia en el viewport y el plano media 1213 px de alto dentro de una columna de 432.

Es un detalle de implementacion que se pierde facil al portar. Si el otro repo usa `cqi`, necesita el mismo envoltorio.

### Ubicacion de cualquier rectangulo sobre la retícula

```css
.nave, .arbol, .avenida, .estacionamiento {
  position: absolute;
  inset-inline-start: calc(var(--x) * var(--u));
  inset-block-start:  calc(var(--y) * var(--u));
  width:  calc(var(--w) * var(--u));
  height: calc(var(--h) * var(--u));
}
```

Las coordenadas viajan del servidor al CSS como custom properties en el atributo `style`:

```astro
style={`--x:${b.x};--y:${b.y};--w:${b.w};--h:${b.h};--alto:${b.alto};--i:${i}`}
```

**Las calles**: las naves se retiran media calle de cada lado, y lo que queda entre dos es el piso del predio asomando, o sea el sendero.

```css
.nave {
  inset-inline-start: calc(var(--x) * var(--u) + var(--calle) / 2);
  inset-block-start:  calc(var(--y) * var(--u) + var(--calle) / 2);
  width:  calc(var(--w) * var(--u) - var(--calle));
  height: calc(var(--h) * var(--u) - var(--calle));
}
```

Con `--calle: 0.3u`, cada nave se achica 0,15u por lado.

### El volumen: cinco caras por bloque

Cada bloque emite, en este orden exacto:

```astro
<span class="cara cara--sombra" />
{paredes.map((p) => <span class:list={['cara', `cara--${p}`]} />)}   // norte, sur, este, oeste
<span class="cara cara--techo"> ... rotulo ... </span>
```

Con `const paredes = ['norte', 'sur', 'este', 'oeste'] as const;`. Se dibujan las cuatro porque al girar la maqueta cambian de lado; las que quedan de espaldas las tapan el techo y las de adelante.

**El techo** es la planta levantada a la altura del bloque:

```css
.cara--techo {
  inset: 0;
  background-color: color-mix(in oklab, var(--tono), #fff calc(var(--eco, 0) * 16%));
  transform: translateZ(calc(var(--alto) * var(--u) * var(--crece, 1)));
  display: grid;
  place-content: center;
  color: var(--surface-tinta);
}
```

**Las cuatro paredes** salen del suelo hacia arriba, cada una girada sobre el canto que la une a la planta, y escalada sobre su propio canto de apoyo con `--crece`:

```css
.cara--sur, .cara--norte { inset-inline: 0; height: calc(var(--alto) * var(--u)); }

.cara--sur {
  inset-block-start: 100%;
  transform-origin: 0 0;
  transform: rotateX(90deg) scaleY(var(--crece, 1));
  background-color: color-mix(in oklab, var(--tono) 56%, #000);
}
.cara--norte {
  inset-block-end: 100%;
  transform-origin: 0 100%;
  transform: rotateX(-90deg) scaleY(var(--crece, 1));
  background-color: color-mix(in oklab, var(--tono) 76%, #000);
}

.cara--este, .cara--oeste { inset-block: 0; width: calc(var(--alto) * var(--u)); }

.cara--este {
  inset-inline-start: 100%;
  transform-origin: 0 0;
  transform: rotateY(-90deg) scaleX(var(--crece, 1));
  background-color: color-mix(in oklab, var(--tono) 56%, #000);
}
.cara--oeste {
  inset-inline-end: 100%;
  transform-origin: 100% 0;
  transform: rotateY(90deg) scaleX(var(--crece, 1));
  background-color: color-mix(in oklab, var(--tono) 76%, #000);
}
```

**La luz**: una sola fuente, arriba y a la izquierda, que es la convencion de toda ilustracion isometrica. El techo es la cara mas clara (el tono puro), las caras que miran a la izquierda y hacia atras (oeste, norte) van a media luz (`tono 76% + negro`), y las que miran al frente y a la derecha (sur, este) en sombra (`tono 56% + negro`). No hay luces calculadas: son tres tonos del mismo color, mezclados en espacio OKLab.

`--tono` se resuelve por tipo de bloque:

```css
.nave--pabellon { --tono: var(--eje-superficie, var(--brand-violeta)); }
.nave--comun    { --tono: var(--lugar-comun); }
.arbol          { --tono: var(--plano-arbol); pointer-events: none; }
```

Y `--eje-superficie` viene de `[data-eje='...']` en `base.css`, que es la variante clara del estrato.

**Techo de nave industrial** (lo que distingue un pabellon de feria de un cubo):

```css
.nave--pabellon .cara--techo {
  background-image: repeating-linear-gradient(90deg, transparent 0 31%, rgb(25 22 33 / 0.08) 31% 33.33%);
}
```

Tres crujias a lo largo, marcadas por una franja al 8 % de tinta, que no toca la legibilidad del rotulo.

### La sombra proyectada

```css
.cara--sombra {
  inset: 0;
  background: rgb(25 22 33 / 0.26);
  filter: blur(calc(0.07 * var(--u)));
  transform: translate(calc(0.06 * var(--u) * var(--alto)), calc(0.3 * var(--u) * var(--alto)))
             translateZ(calc(0.9px - var(--eco, 0) * 0.55 * var(--u)));
  opacity: calc(var(--crece, 1) * (1 - 0.55 * var(--eco, 0)));
  transition: transform var(--dur-media) var(--ease), opacity var(--dur-media) var(--ease);
}
```

Cuatro cosas a la vez:

1. **Direccion y magnitud**: la luz viene de arriba y de la izquierda, asi que la sombra cae hacia abajo y a la derecha, y **mide en proporcion al alto del bloque**: `0.06u * alto` en X y `0.3u * alto` en Y.
2. **Vive dentro del bloque** para heredar su planta, pero **se queda en el piso cuando el bloque se levanta**: el `translateZ` contrarresta exactamente el `translate` de `--eco` del contenedor (`-eco * 0.55u`), mas 0,9px para quedar apenas por encima del piso.
3. **Se aclara** cuando el objeto se separa del suelo: `1 - 0.55 * eco`.
4. **No existe hasta que el bloque se construye**: multiplicada por `--crece`.

### Capas de piso y su orden en Z

Todo lo que va en el piso se separa por micro-desplazamientos en Z para que no se peleen por el mismo plano:

| Elemento | `translateZ` |
|---|---|
| `.platea` | 0 (base) |
| `.predio` (pavimento con retícula) | `0.4px` |
| `.avenida`, `.estacionamiento` | `0.6px` |
| `.ruta` (recorridos) | `0.8px` |
| `.cara--sombra` | `0.9px` (menos el contrarresto de `--eco`) |

## 11.4 La platea con espesor

```css
.platea {
  position: absolute;
  inset: calc(-1 * var(--margen) * var(--u));    /* --margen: 0.9 */
  background: var(--plano-cesped);
  transform-style: preserve-3d;
}
.platea__canto--sur   { inset-block-start: 100%; transform-origin: 0 0;    transform: rotateX(-90deg); background: var(--plano-espesor-2); }
.platea__canto--norte { inset-block-end: 100%;   transform-origin: 0 100%; transform: rotateX(90deg);  }
.platea__canto--este  { inset-inline-start: 100%;transform-origin: 0 0;    transform: rotateY(90deg);  background: var(--plano-espesor-2); }
.platea__canto--oeste { inset-inline-end: 100%;  transform-origin: 100% 0; transform: rotateY(-90deg); }
```

Los cantos cuelgan hacia abajo con `--espesor: 0.3u`. Los dos que quedan en sombra usan `--plano-espesor-2`. Es lo que convierte el dibujo en una maqueta apoyada sobre una mesa, y no en un rombo flotando.

**El pavimento con retícula de replanteo**:

```css
.predio {
  position: absolute;
  inset: calc(-0.18 * var(--u));
  background-color: var(--surface-papel);
  background-image:
    linear-gradient(var(--reticula) 1px, transparent 1px),
    linear-gradient(90deg, var(--reticula) 1px, transparent 1px);
  background-size: var(--u) var(--u);
  background-position: calc(0.18 * var(--u)) calc(0.18 * var(--u));
  --reticula: color-mix(in oklab, var(--borde) 55%, var(--surface-papel));
  transform: translateZ(0.4px);
}
```

La retícula va corrida 0,18u para coincidir con los cantos de los bloques.

## 11.5 La escenografia

Todo en unidades de la misma retícula. Se omite en la miniatura.

```ts
const MARGEN = 0.9;
const ACCESO = COMUNES.find((c) => c.id === 'acceso') ?? COMUNES[0];

const avenida = { x: ACCESO.x + 0.45, y: FILAS, w: ACCESO.w - 0.9, h: MARGEN };
// => { x: 0.45, y: 7.6, w: 2.1, h: 0.9 }

const estacionamiento = { x: 3.4, y: FILAS + 0.2, w: 5.35, h: 0.62 };
// => { x: 3.4, y: 7.8, w: 5.35, h: 0.62 }
```

`avenida` con linea central discontinua hecha con `repeating-linear-gradient` de 2px de ancho centrado; `estacionamiento` con darsenas, una raya cada media unidad.

**Arboleda**: cubos bajos, "que es lo que es un arbol en el lenguaje de rectangulos del isologotipo".

```ts
const LADO_ARBOL = 0.4;
const arboles = [
  // hilera trasera: 8 arboles
  ...[0.3, 1.5, 2.7, 3.9, 5.1, 6.3, 7.5, 8.5].map((x, i) => ({ x, y: -0.78, alto: 0.42 + (i % 3) * 0.1 })),
  // columna este: 4
  ...[0.4, 1.7, 3.0, 4.3].map((y, i) => ({ x: 9.42, y, alto: 0.4 + (i % 2) * 0.12 })),
  // primer plano oeste: 2
  ...[4.0, 5.3].map((y, i) => ({ x: -0.78, y, alto: 0.46 + i * 0.08 })),
];
```

14 arboles. Alturas desparejas a proposito: una hilera de cubos iguales lee como cerco, no como arboleda.

**Reparto por profundidad** (mismo criterio de orden que los bloques):

```ts
const arbolesFondo  = arboles.filter((a) => a.x + a.y < 3).map((a, i) => ({ ...a, i: bloques.length + i }));
const arbolesFrente = arboles.filter((a) => a.x + a.y >= 3).map((a, i) => ({ ...a, i: bloques.length + arbolesFondo.length + i }));
```

Los del fondo se emiten **antes** de los bloques y los del frente **despues**. Cada uno lleva su `--i` continuando la numeracion de los bloques, para entrar despues del ultimo en la animacion de construccion.

**El hito de entrada**: un mastil con bandera en turquesa, el unico punto del plano con color de dato.

```css
.mapa__hito {
  position: absolute;
  inset-inline-start: calc(var(--hx) * var(--u));
  inset-block-start:  calc((var(--hy) + 0.3) * var(--u));
  width: 2px;
  height: calc(1.15 * var(--u));
  background: var(--brand-turquesa);
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%) rotateZ(calc(-1 * var(--giro-z))) rotateX(-90deg);
  transform-style: preserve-3d;
  opacity: var(--crece, 1);
}
```

Posicionado en `--hx: ACCESO.x + ACCESO.w / 2` (1,5) y `--hy: ACCESO.y + ACCESO.h` (7,6). Los dos giros: el primero deshace el giro de la escena para que quede de frente, el segundo lo levanta del piso. `::before` es la bandera (0,55u x 0,34u) y `::after` es la base, un cuadrado de 0,22u puesto de nuevo en el piso con `rotateX(90deg)`.

## 11.6 Los recorridos: la pregunta "como llego"

Es la parte mas interesante de la logica de servidor. Responde "por donde voy", no solo "donde queda".

```ts
const GROSOR_RUTA = 0.14;
const LADO_META = 0.3;
const salida = { x: ACCESO.x + ACCESO.w / 2, y: ACCESO.y };   // { x: 1.5, y: 6 }

type Punto = { x: number; y: number };

const recorridoHasta = (b): Punto[] => {
  if (b.id === ACCESO.id) return [];
  const centroX = b.x + b.w / 2;
  const centroY = b.y + b.h / 2;

  // 1. Espacio comun: esta sobre la calle del frente.
  if (b.y >= salida.y) return [salida, { x: centroX, y: salida.y }, { x: centroX, y: b.y }];

  // 2. Pabellon justo enfrente del acceso: se cruza la calle y ya esta.
  if (b.x <= salida.x && salida.x <= b.x + b.w && b.y + b.h === salida.y) {
    return [salida, { x: salida.x, y: salida.y - 0.32 }];
  }

  // 3. Resto: por la calle del frente hasta la calle vertical que bordea el pabellon,
  //    y se sube por ella hasta la mitad del pabellon.
  const calleX = b.x > 0 ? b.x : b.x + b.w;
  return [salida, { x: calleX, y: salida.y }, { x: calleX, y: centroY }];
};
```

Reglas en palabras: se sale del acceso por su lado norte a la calle del frente; se camina por esa calle hasta la calle vertical que bordea al pabellon (la de su lado oeste, o la del este si el pabellon esta contra el margen izquierdo); y se sube por ella hasta la mitad del pabellon. Los espacios comunes estan sobre la misma calle del frente: se camina hasta su centro y se entra por el norte.

**De puntos a rectangulos**:

```ts
type Tramo = { x: number; y: number; w: number; h: number; eje: 'x' | 'y'; sentido: 1 | -1 };

const tramosDe = (puntos: Punto[]): Tramo[] => {
  const tramos: Tramo[] = [];
  for (let i = 1; i < puntos.length; i++) {
    const p = puntos[i - 1], q = puntos[i];
    if (p.y === q.y) {
      tramos.push({ x: Math.min(p.x, q.x), y: p.y - GROSOR_RUTA / 2,
                    w: Math.abs(q.x - p.x), h: GROSOR_RUTA, eje: 'x', sentido: q.x >= p.x ? 1 : -1 });
    } else {
      tramos.push({ x: p.x - GROSOR_RUTA / 2, y: Math.min(p.y, q.y),
                    w: GROSOR_RUTA, h: Math.abs(q.y - p.y), eje: 'y', sentido: q.y >= p.y ? 1 : -1 });
    }
  }
  return tramos;
};
```

Cada tramo lleva su eje y su sentido para que las rayas marchen hacia el destino. Y cada ruta emite ademas un cuadrado de meta de 0,3u centrado en el ultimo punto.

**Pintado de las rutas**:

```css
.ruta {
  position: absolute;
  inset-inline-start: calc(var(--x) * var(--u));
  inset-block-start:  calc(var(--y) * var(--u));
  width: calc(var(--w) * var(--u));
  height: calc(var(--h) * var(--u));
  transform: translateZ(0.8px);
  opacity: var(--cartel, 0);
  transition: opacity var(--dur-media) var(--ease);
  pointer-events: none;
  animation-play-state: paused;
}
.ruta--x { background: repeating-linear-gradient(90deg,
             var(--brand-turquesa) 0 calc(0.16 * var(--u)),
             transparent calc(0.16 * var(--u)) calc(0.3 * var(--u))); }
.ruta--y { background: repeating-linear-gradient(180deg, /* idem */ ); }
.ruta--meta { background: var(--brand-turquesa); box-shadow: 0 0 0 calc(0.06 * var(--u)) var(--surface-papel); }

:global(html[data-anim='si']) .ruta--x { animation: marchar-x 700ms linear infinite; }
:global(html[data-anim='si']) .ruta--y { animation: marchar-y 700ms linear infinite; }

@keyframes marchar-x { to { background-position: calc(var(--sentido, 1) * 0.3 * var(--u)) 0; } }
@keyframes marchar-y { to { background-position: 0 calc(var(--sentido, 1) * 0.3 * var(--u)); } }
```

**Detalle de rendimiento**: la animacion existe siempre pero arranca en `animation-play-state: paused`. La regla generada la pone en `running` solo cuando el recorrido esta a la vista. En reposo no cuesta nada.

## 11.7 La interaccion: dos interruptores y cero JavaScript de eventos

Todo el encendido se resuelve con dos custom properties numericas y con `:has()`:

| Variable | Significado | Efecto |
|---|---|---|
| `--eco` | "esta senalado" | El bloque se levanta, su techo se aclara, su sombra se abre y se aclara; en la leyenda desplaza el filete; en la agenda engrosa la banda y tine el borde. |
| `--cartel` | "mostra el nombre y el camino" | Aparece el cartel de pie y el recorrido desde el acceso. |

Por ser numeros, sirven para interpolar sin escribir dos estados:

```css
.nave, .arbol {
  transform-style: preserve-3d;
  translate: 0 0 calc(var(--eco, 0) * 0.55 * var(--u));
  transition: translate var(--dur-media) var(--ease);
}
```

### El generador de reglas (`src/data/enlacePlano.ts`)

```ts
export const reglasEnlacePlano = (clavesDia: string[] = []) => {
  const ids = BLOQUES.map((b) => b.id);
  const todoDe = (id) => `:is([data-lugar="${id}"],[data-ruta="${id}"])`;
  const encendido = '{--eco:1;--cartel:1;animation-play-state:running}';

  return [
    // 1) Una regla por bloque: senalar cualquier cosa con ese data-lugar enciende todo lo que lo tenga.
    ...ids.map((id) =>
      `.donde-cuando:has([data-lugar="${id}"]:is(:hover,:focus-visible)) ${todoDe(id)}${encendido}`),

    // 2) Una actividad en todo el predio enciende los nueve bloques, suave y sin carteles.
    `.donde-cuando:has([data-lugar="predio"]:is(:hover,:focus-visible)) .nave{--eco:0.4}`,

    // 3) Foco por scroll, para pantallas sin puntero.
    ...ids.map((id) => `.donde-cuando[data-foco="${id}"] [data-lugar="${id}"]{--eco:1}`),
    `.donde-cuando[data-foco="predio"] .nave{--eco:0.4}`,

    // 4) Enlace directo: ?lugar=... en la URL.
    ...ids.map((id) => `.donde-cuando[data-destino="${id}"] ${todoDe(id)}${encendido}`),

    // 5) Jornada elegida: lo que no se usa ese dia se apaga sin perder el matiz.
    ...clavesDia.flatMap((dia) => [
      `.donde-cuando:has(#agenda-panel-${dia}[data-activo]) .nave--pabellon:not([data-dias~="${dia}"])
        {--tono:color-mix(in oklab,var(--eje-superficie) 34%,var(--surface-papel-2))}`,
      `.donde-cuando:has(#agenda-panel-${dia}[data-activo]) .nave--comun:not([data-dias~="${dia}"])
        {--tono:var(--surface-papel-3)}`,
      `.donde-cuando:has(#agenda-panel-${dia}[data-activo]) .nave:not([data-dias~="${dia}"]) .cara--techo
        {color:var(--text-cuerpo)}`,
    ]),
  ].join('\n');
};
```

Se inyecta con `<style set:html={reglas} is:inline></style>`, sin ambito de componente a proposito, porque tiene que alcanzar al plano, a la leyenda y a la grilla, que los dibujan tres componentes distintos.

Con 9 bloques y 4 jornadas eso son 9 + 1 + 9 + 1 + 9 + 12 = **41 reglas generadas**. El archivo compilado `dist/_astro/enlacePlano.D-s2vFdO.css` pesa 12,1 KB.

**El contenedor comun es `.donde-cuando`.** Es lo que hace que el plano, la leyenda, las fichas y la grilla de tiempo se enciendan entre si sin un solo listener.

**Notas criticas de esta tecnica**:

- Depende de `:has()`. Sin soporte, no hay encendido cruzado, pero nada se rompe: el plano queda quieto y legible.
- Depende de que el CSS sea global, no con ambito de componente.
- La regla de apagado por jornada usa el id `#agenda-panel-{dia}` que genera `Pestanas.astro`. Es un acoplamiento por convencion de nombre entre el generador de reglas y el componente de pestanas. Al fusionar hay que preservarlo o reescribirlo.
- El selector de atributo `[data-dias~="j1"]` compara contra una lista separada por espacios (`data-dias="j1 j2"`), que es como se emite `dias.join(' ')`.

### El apagado por jornada

En vez de bajar opacidad, **cambia el tono** del bloque:

```
pabellon sin actividad ese dia  ->  --tono: color-mix(in oklab, var(--eje-superficie) 34%, var(--surface-papel-2))
comun sin actividad ese dia     ->  --tono: var(--surface-papel-3)
letra del techo                 ->  color: var(--text-cuerpo)
```

Justificacion escrita: con opacidad el volumen se desvanecia y la letra del pabellon quedaba ilegible, y la letra es informacion, no adorno.

### El cartel de pie

```css
.nave__cartel {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  width: 0; height: 0;
  transform: translateZ(calc(var(--alto) * var(--u) + var(--cartel, 0) * 0.1 * var(--u)))
             rotateZ(calc(-1 * var(--giro-z)))
             rotateX(-90deg);
  transform-style: preserve-3d;
  pointer-events: none;
  opacity: var(--cartel, 0);
  transition: opacity var(--dur-media) var(--ease), transform var(--dur-media) var(--ease);
}
```

Se ancla en el centro del techo, se sube a la altura del bloque, se deshace el giro de la escena y se pone de pie con `rotateX(-90deg)`. El `::before` es el poste (2px x 0,5u). El `.cartel` va en tinta con el filete del tono del lugar en el canto izquierdo, `max-width: 4.6u`, sombra `0 8px 22px rgb(25 22 33 / 0.28)`.

Contenido del cartel:

```astro
<span class="cartel__rotulo t-label">{b.rotulo}</span>   {/* "Pabellon A" o "Espacio comun" */}
<span class="cartel__nombre">{b.nombre}</span>            {/* nombre completo del eje o del espacio */}
<span class="cartel__dato">{b.dato}</span>                {/* "5 expositores confirmados" o "4 actividades en el programa" */}
```

El dato sale de las colecciones, calculado en el servidor:

```ts
const expositoresPorEje = new Map<string, number>();
for (const e of expositores) expositoresPorEje.set(e.data.eje.id, (expositoresPorEje.get(e.data.eje.id) ?? 0) + 1);

const actividadesPorLugar = new Map<string, number>();
for (const a of agenda) actividadesPorLugar.set(a.data.lugar, (actividadesPorLugar.get(a.data.lugar) ?? 0) + 1);

const contar = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
```

Va con `aria-hidden="true"`: es visual, y el nombre accesible ya esta en el enlace.

### Los rotulos sobre el techo

```css
.nave__rotulo {
  display: grid;
  justify-items: center;
  gap: calc(0.05 * var(--u));
  rotate: z calc(-1 * var(--giro-z));
}
.nave__letra { font-size: calc(0.6 * var(--u)); font-weight: var(--peso-bold); line-height: 1; }
.nave__corto, .nave__nombre { font-size: calc(0.22 * var(--u)); font-weight: var(--peso-semi);
                              letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
.nave__nombre { font-size: calc(0.24 * var(--u)); }
```

Van acostados en el plano del techo, no de frente, para que se lean como marcas pintadas en el piso del pabellon.

**Un solo envoltorio se endereza entero.** Es una leccion registrada: si cada pieza se enderezara por separado, al girar la maqueta dejarian de apilarse y se pisarian, porque la pila sigue el eje del techo y no el de la pantalla.

Contenido de un pabellon: pictograma de 22px, la letra (A a F) y el nombre corto del eje. Contenido de un comun: solo el `corto`.

Contraste: tinta sobre el tono vivo del eje da entre 5,1:1 y 6,5:1; sobre el gris de espacio comun el blanco da 4,6:1 y la tinta 3,9:1, asi que los comunes llevan `color: var(--text-titulo-inv)` en el techo. **El color va en el techo y no en el rotulo**, para que la regla de la jornada pueda pisarlo.

## 11.8 El giro por arrastre (el unico JavaScript del componente)

```js
const BASE_Z = -45;
const BASE_X = 58;
const LIMITE_Z = 35;
const MIN_X = 50;
const MAX_X = 66;
const acotar = (v, min, max) => Math.min(max, Math.max(min, v));
```

Rango: hasta 35 grados a cada lado en Z, y entre 50 y 66 grados de inclinacion. Justificacion escrita: pasados los 35 grados una de las dos caras visibles queda de canto y la maqueta se aplana en un plano con rayas; el giro sirve para mirar alrededor, no para dar la vuelta.

**Manipulacion directa**:

```js
mapa.addEventListener('pointermove', (e) => {
  if (!origen) return;
  const dx = e.clientX - origen.x;
  const dy = e.clientY - origen.y;
  if (!movio) {
    if (Math.hypot(dx, dy) < 4) return;   // umbral de 4px: distingue clic de arrastre
    movio = true;
    mapa.dataset.arrastre = '';
    usado();
  }
  giroZ = acotar(BASE_Z - dx * 0.25, BASE_Z - LIMITE_Z, BASE_Z + LIMITE_Z);
  giroX = acotar(BASE_X - dy * 0.15, MIN_X, MAX_X);
  aplicar();
});
```

Factores: 0,25 grados por pixel horizontal y 0,15 por pixel vertical. Arrastrar a la izquierda mueve la esquina cercana a la izquierda; arrastrar hacia arriba levanta el frente.

**La vuelta es una transicion, no una animacion escrita**:

```js
const volver = () => {
  giroZ = BASE_Z; giroX = BASE_X;
  mapa.style.removeProperty('--giro-z');
  mapa.style.removeProperty('--giro-x');
};
```

```css
.mapa {
  transition: --giro-z var(--dur-lenta) var(--ease), --giro-x var(--dur-lenta) var(--ease);
}
.mapa[data-arrastre] { cursor: grabbing; transition: none; }
```

**Esto es posible solo porque `--giro-z` y `--giro-x` estan registradas con `@property` en `base.css`.** Al quitar el valor en linea, la variable vuelve al de la hoja de estilos y el navegador interpola. Escena, rotulos enderezados y carteles de pie leen la misma variable y vuelven todos a la vez, sin coordinar nada.

**Otros detalles del script**:

- `setPointerCapture` dentro de un `try/catch`: el arrastre sigue aunque el puntero salga del plano; si no hay puntero activo con ese id (eventos sinteticos) funciona igual, sin captura.
- `soltar()` engancha `pointerup`, `pointercancel` y `lostpointercapture`.
- **Teclado**: flechas de 5 grados en Z y 3 en X; `Home` o `Escape` devuelven. El giro queda mientras el foco este en la maqueta o en uno de sus pabellones, y `focusout` lo devuelve al salir.
- **Un arrastre no es un clic**: hay un listener de `click` en fase de captura que hace `preventDefault()` y `stopPropagation()` si `movio`, para que el enlace del pabellon no navegue al soltar.
- `dragstart` prevenido: los pabellones son enlaces y el navegador querria arrastrarlos como tales.
- `touch-action: pan-y` en `.mapa[data-mapa]`: en pantalla tactil el scroll vertical pasa y solo el arrastre horizontal gira.
- **Enlace directo**: `?lugar=pab-b` en la URL deja ese lugar senalado al cargar. Se lee con `URLSearchParams` y se escribe en `seccion.dataset.destino`. Se apaga al primer `pointerover` sobre la maqueta (listener `{ once: true }`): a partir de ahi manda la mano.
- Peso declarado: **alrededor de 1 KB**.

Mandos visibles: una pista "Arrastrá para girar la maqueta" que solo existe con `html[data-js='si']` y se oculta al primer gesto, y un boton "Vista inicial" que aparece solo cuando la maqueta esta girada.

## 11.9 La animacion de construccion

```css
:global(html[data-anim='si'] .construye:not(.es-visible)) :is(.nave, .arbol, .mapa__hito) { --crece: 0; }

:global(html[data-anim='si'] .construye.es-visible) :is(.nave, .arbol) {
  animation: levantar 720ms cubic-bezier(0.2, 0.9, 0.3, 1) both;
  animation-delay: calc(140ms + var(--i, 0) * 55ms);
}
:global(html[data-anim='si'] .construye.es-visible) .mapa__hito {
  animation: levantar 480ms var(--ease) both;
  animation-delay: 1100ms;
}
@keyframes levantar { from { --crece: 0; } to { --crece: 1; } }
```

**Una sola variable animada por volumen** mueve techo, cuatro paredes y sombra. `--crece` va de 0 a 1: el techo sube (`translateZ(alto * u * crece)`), las paredes crecen desde su canto de apoyo (`scaleY`/`scaleX` de `crece`), la sombra aparece (`opacity: crece * ...`) y el hito se hace visible (`opacity: crece`).

El disparo lo hace el marco `.construye` marcado con `data-revelar`, que el observador de `Base.astro` marca con `es-visible` al entrar en pantalla.

Duracion total con 9 bloques y 14 arboles: `140ms + 22 * 55ms + 720ms` = alrededor de 2,07 segundos, mas el hito a los 1100ms.

**Sin JavaScript o con movimiento reducido no existe `data-anim` y `--crece` vale 1 desde el primer cuadro: el plano se pinta construido.** Y donde el navegador no conoce `@property`, el `initial-value: 1` da el mismo resultado.

La miniatura del celular nunca se construye: aparece cuando ya se paso el plano grande.

## 11.10 El modo decorativo (la miniatura)

Prop `decorativo?: boolean`. Cuando esta activa:

- El contenedor lleva `aria-hidden="true"` y sale del arbol de accesibilidad.
- Los pabellones dejan de ser `<a>` y pasan a ser `<div>`: no duplica los seis destinos de teclado.
- No se dibuja escenografia (avenida, estacionamiento, arboles, rutas, hito) ni carteles.
- No hay `data-mapa`, `tabindex` ni `role="group"`: no se puede girar.
- **Conserva los `data-lugar`**, que es lo unico que hace falta para que se encienda con las mismas reglas que el plano grande, sin una linea de CSS nueva.

```css
.mapa-marco--mini .nave__corto, .mapa-marco--mini .nave__nombre { display: none; }
.mapa-marco--mini .mapa { --u: 8.52cqi; height: calc(8.9 * var(--u)); }
.mapa-marco--mini .platea { inset: calc(-0.5 * var(--u)); }
```

A ese tamano solo entran las letras. La unidad es mayor porque el margen de platea es menor (0,5 en vez de 0,9).

La usa `Agenda.astro` en pantallas menores a 64rem, como panel flotante fijo, con un script que decide cuando mostrarla (cuando la grilla esta a la vista y el plano grande no) y que sigue a la actividad mas cercana al centro de la pantalla, escribiendo `data-foco` en la seccion.

## 11.11 Accesibilidad del plano

- **La misma informacion va debajo como lista de texto** (`LeyendaPlano.astro` mas el listado de pabellones de `plano.astro`). Nadie depende del grafico ni del color para saber que hay en el predio.
- Los pabellones son **enlaces** a `/expositores?eje=...`, asi que se recorren con teclado, y el cartel aparece con `:focus-visible` igual que con el puntero (la regla generada usa `:is(:hover,:focus-visible)`).
- Cada pabellon lleva un nombre accesible en texto: `<span class="vo">Pabellon A: Mineria y litio</span>`.
- El grupo `.mapa` es enfocable (`tabindex={0}`, `role="group"`) con `aria-label`: "Maqueta del predio. Se gira arrastrandola o con las flechas del teclado; Inicio la devuelve a su posicion."
- Motivo de foco: no se dibuja un recuadro alrededor de toda la caja, sino un `outline` de 3px turquesa sobre el techo del bloque enfocado, y sobre el borde de la platea cuando el foco esta en el grupo.
- `@media (prefers-reduced-motion: reduce)` anula las transiciones de `.nave`, `.arbol`, `.cara` y `.nave__cartel`.

## 11.12 Shape de datos que consume el plano

```ts
interface Props {
  sectores: CollectionEntry<'sectores'>[];   // para nombre y corto de cada pabellon
  usos: Record<string, string[]>;            // por cada lugar, las jornadas con actividad
  decorativo?: boolean;
}
```

`usos` se calcula igual en los tres consumidores (`Agenda.astro`, `plano.astro`, `expositores/[id].astro`):

```ts
const usos: Record<string, string[]> = {};
for (const actividad of agenda) {
  const { lugar, dia } = actividad.data;
  const destinos = lugar === LUGAR_TODO ? BLOQUES.map((b) => b.id) : [lugar];
  for (const destino of destinos) {
    usos[destino] = [...new Set([...(usos[destino] ?? []), dia])];
  }
}
```

Es codigo duplicado tres veces. En una fusion conviene subirlo a `predio.ts` o a un helper.

Ademas el componente lee por su cuenta `getCollection('expositores')` y `getCollection('agenda')` para calcular los datos del cartel. O sea **no es un componente puro de presentacion**: hace acceso a datos por dentro. Es un punto a corregir al portar.

Objeto que arma para cada bloque dibujable:

```ts
{
  id, x, y, w, h, alto,
  clase: 'pabellon' | 'comun',
  rotulo: 'Pabellon A' | 'Espacio comun',
  nombre: 'Mineria y litio' | 'Auditorio Central',
  corto: 'Mineria' | 'Auditorio',
  dato: '5 expositores confirmados' | '4 actividades en el programa',
  letra?: 'A'..'F',
  eje?: 'mineria-litio'...
}
```

## 11.13 Adaptar la profundidad de este plano al mapa del otro repo: checklist

Si el mapa final es el del otro prototipo pero con la profundidad de este, lo que hay que trasplantar es, en orden de importancia:

1. **El modelo de datos**: `{ id, x, y, w, h, alto }` en unidades de retícula, con origen arriba a la izquierda, mas una lista de bloques y helpers derivados. Sin esto no hay nada que portar.
2. **El orden de dibujo por `x + y` creciente.** Es el z-order entero. No usar `z-index`.
3. **Las dos rotaciones sin `perspective`**: `rotateX(58deg) rotateZ(-45deg)` sobre un contenedor con `transform-style: preserve-3d`.
4. **La unidad `--u` derivada del contenedor**, con el envoltorio extra para que `cqi` se resuelva contra el ancestro y no contra el propio elemento.
5. **Las cinco caras por bloque** con sus cuatro transformaciones de pared y los tres tonos de luz por `color-mix(in oklab, tono X%, #000)`: techo 100 %, oeste y norte 76 %, sur y este 56 %.
6. **La sombra proyectada proporcional al alto**, con el contrarresto del levantamiento.
7. **`@property --crece`** y la animacion de construccion con `--i` como retardo.
8. **`@property --giro-z` y `--giro-x`** mas la tecnica de quitar el valor en linea para que la vuelta sea una transicion.
9. **Los dos interruptores `--eco` y `--cartel`** como numeros interpolables, y las reglas generadas con `:has()` desde un contenedor comun.
10. **El enderezado de rotulos y carteles** con `rotate: z calc(-1 * var(--giro-z))`, siempre en un solo envoltorio por pila.
11. **Las capas de piso separadas por fracciones de pixel en Z** (0,4 / 0,6 / 0,8 / 0,9 px).

Riesgos a vigilar:

- `preserve-3d` en iOS Safari: el propio repo lo cita como problema conocido, y por eso el corte del hero evita 3D. La maqueta si lo usa, asi que conviene probarla en iOS.
- Cantidad de nodos: 9 bloques por 5 caras, mas 14 arboles por 5 caras, mas rutas, mas platea. En el home hay **dos instancias del plano** (la grande y la miniatura). Si el mapa del otro repo tiene mas bloques, el conteo de nodos crece linealmente.
- `:has()` con muchas reglas: 41 reglas hoy. Con mas bloques y mas jornadas crece como `bloques x 3 + jornadas x 3`.

## 11.14 Portabilidad del plano a Next mas React

| Aspecto | Atadura | Trabajo |
|---|---|---|
| `predio.ts` | **Nula.** Es TypeScript puro sin imports. | Copiar tal cual. |
| `enlacePlano.ts` | **Nula.** Devuelve un string. | Copiar. En React se inyecta con `<style dangerouslySetInnerHTML={{ __html: reglas }} />`. |
| El marcado y el CSS 3D | Baja. Es HTML y CSS estandar. | Traducir `class:list` a `clsx` o template literal, y los estilos con ambito a CSS Modules o `styled-jsx`. Ojo: los estilos con ambito de Astro son un archivo aparte; los `:global()` deliberados hay que mantenerlos globales. |
| El script de giro | Media. Es DOM plano con `addEventListener`. | Componente cliente con `useRef` y `useEffect`. Cuidado con el `click` en fase de captura y con `setPointerCapture`. |
| Lectura de colecciones dentro del componente | **Alta.** Hace `await getCollection(...)` en el frontmatter. | Hay que extraerlo: calcular `expositoresPorEje` y `actividadesPorLugar` fuera y pasarlos como props. Es refactor obligatorio para React. |
| `IconoEje` dentro del techo | Nula. | Copiar. |
| `ruta()` | Baja. | `<Link>` de Next. |
| `@property` | Nula. Es CSS estandar. | Copiar a un CSS global. |
| **Dificultad global** | | **Media alta.** Es la pieza mas trabajosa, pero la parte dificil (la geometria y el CSS) es agnostica de framework. Lo unico que hay que reescribir de verdad es el acceso a datos y el ciclo de vida del script de arrastre. |

---

# PARTE III. Relevamiento general

## 12. Componentes restantes

### 12.1 `Hero.astro` (367 lineas)

Hero de una sola pantalla, en `en-tinta`. Decision tomada en `REFERENCIAS.md` §6.7: la referencia auditada usa seis viewports para decir su nombre; aca el hero responde en una sola pantalla que es, cuando, donde y que se puede hacer.

Contenido: ficha de fecha y sede en `meta` con filete superior, `<h1>` con "ExpoJuy 2026" en dos lineas, lema, bajada, dos botones (Acreditarme gratis, Ver la agenda) y la cuenta regresiva.

**El calculo del alto**, que es la parte fina:

```css
@media (min-width: 60rem) {
  .hero { display: flex; align-items: center; padding-block: clamp(2rem, 4vh, 5rem);
          min-height: calc(100dvh - var(--h-cabecera)); }
}
@media (min-width: 60rem) and (min-height: 61rem) {
  .hero { min-height: calc(100dvh - var(--h-cabecera) - var(--asomo)); }
}
```

Justificacion medida y escrita: antes el hero media `min(82vh, 46rem)` y donde caia el corte lo decidia el monitor. A 1920 de ancho, con 900 de alto asomaba una franja negra vacia, con 1000 el numero quedaba cortado al 62 % y sin etiqueta, y recien arriba de 1080 el numero alcanzaba a tener su rotulo. 340 px de diferencia entre una notebook y un monitor grande. Ahora el hero se mide contra la pantalla libre y le deja abajo una cantidad fija (`--asomo: 12rem`), y por debajo de 61rem de alto pide la pantalla exacta para que el corte sea limpio.

**Cuenta regresiva**: mejora progresiva pura. El servidor entrega "Faltan pocas semanas para la apertura" y el script lo reemplaza por los dias que faltan, con cuatro casos (mas de un dia, un dia, hoy, ya paso). Con animacion el numero cuenta desde cero con easing cubico; el ancho se reserva con `min-width` en `ch` para que la oracion no baile.

**Entrada coreografiada** en 820ms:

```
0 ms    el filete de la ficha se traza de izquierda a derecha (clip-path)
60 ms   la fecha y la sede
120 ms  el titular sube desde abajo
260 ms  el lema
340 ms  la bajada
420 ms  los botones
520 ms  la cuenta regresiva
```

**Regla de LCP registrada**: el titular se anima solo con `transform`, ni opacidad ni recorte.

> Medido: con el titular recortado de arranque (`clip-path: inset(0 0 100% 0)`) Chrome deja de registrar LCP por completo, porque el elemento mas grande no cuenta como pintado hasta que se descubre. Desplazandolo, el h1 esta pintado y entero desde el primer cuadro y el LCP no se mueve.

El titular usa una escala propia por fuera del sistema: `font-size: clamp(3.25rem, 1.2rem + 9vw, 9rem)`, `line-height: 0.84`, `letter-spacing: -0.045em`.

### 12.2 `Agenda.astro` (397 lineas)

Seccion "Que pasa y donde": agenda y plano en una sola seccion. Antes eran dos secciones que contestaban media pregunta cada una, y ademas no coincidian.

Estructura: `CabeceraSeccion` (numero 4), `.dc__cuerpo` con dos columnas a partir de 64rem (`minmax(0, 32rem) minmax(0, 1fr)`), la del plano pegajosa. A la izquierda: plano, nota de propuesta y leyenda. A la derecha: `Pestanas` con `PanelJornada`.

Todo dentro de `.donde-cuando`, que es el contenedor que activa las reglas de `:has()`.

**Script de la miniatura** (solo en pantalla chica): dos `IntersectionObserver` (uno sobre `.dc__plano` con `threshold: 0.3`, otro sobre `.dc__tiempo` con `rootMargin: '-20% 0px -25% 0px'`). La miniatura se muestra cuando la grilla esta a la vista y el plano grande no. Y un listener de scroll que busca el `[data-lugar]` mas cercano al centro de la pantalla dentro del panel activo, y escribe `seccion.dataset.foco`.

Apertura de la miniatura: `clip-path: circle(0% at 84% 82%)` a `circle(150% at 84% 82%)`, el unico gesto curvo del sistema junto con la panza. Anulado bajo `prefers-reduced-motion`.

### 12.3 `PanelJornada.astro` (533 lineas)

Una jornada como **grilla de tiempo** con carriles, no como lista.

Decisiones clave documentadas:

- **El horario del predio no es una actividad**: lo que ocurre en `lugar: predio` sale de la grilla y se anuncia arriba como marco del dia. Sin eso ocupaba la columna entera de punta a punta.
- **Eje de horas ajustado**: arranca y termina en la hora en punto mas cercana a las actividades con horario propio. `PASO = 30` minutos por fila.
- **Reparto voraz en carriles**: cada actividad al primer carril libre a su hora de inicio, ordenando por `desde` ascendente y `hasta` descendente.
- **Ensanchamiento**: despues cada bloque se ensancha hasta el ultimo carril libre durante todo su intervalo. Sin esto, un dia con una sola superposicion a las cuatro de la tarde dibuja media grilla vacia toda la manana.
- **Sin `row-gap`**: la columna de horas y la pista comparten `grid-template-rows`, y cualquier `gap` entre filas acumula desfase. Medido: con 8px de separacion y dieciseis filas, un bloque de las 15:00 se dibujaba 128 px mas abajo que su hora. La separacion entre bloques la da el borde.
- **Container queries por alto**: cada bloque declara `container: acto / size` y decide por su alto real que muestra.
  - `@container acto (max-height: 6.2rem)`: el espacio se muda al renglon de la hora y el nombre del tipo se oculta visualmente (el pictograma ya lo dice).
  - `@container acto (max-height: 9.5rem)`: se ocultan los oradores.
  - Lo que no se dibuja sigue en el documento y lo lee un lector de pantalla.
- **En pantalla chica no hay grilla**: las actividades se apilan en orden de hora con todo su contenido visible.
- **El color del lugar**: cada actividad lleva la banda izquierda y un cuadrito junto al nombre del espacio con el color de su pabellon, o el gris de espacio comun. Es el mismo color con el que ese lugar esta pintado en el plano.
- Resumen del dia en una linea: "Abierto de 10:00 a 20:00 · 3 actividades · hasta 2 en simultaneo".

### 12.4 `Pestanas.astro` (288 lineas)

Patron ARIA de tabs con mejora progresiva.

- **Sin JavaScript**: `.pestanas__nav { display: none }` y todos los paneles visibles con su encabezado `<h3>`. Nunca hay pantalla vacia, que es exactamente el defecto que se descarto de la referencia.
- **Con JavaScript** (`html[data-js='si']`): aparece la lista de tabs y los paneles inactivos pasan a `display: none`; el `<h3>` de cada panel se oculta visualmente pero se mantiene para `aria-labelledby`.
- Teclado: flechas segun orientacion, `Home` y `End`. `roving tabindex` (solo el activo tiene `tabindex: 0`).
- Dos orientaciones: horizontal (subrayado grueso en la activa) y vertical (banda de estrato a la izquierda que se engrosa de 3 a 10px, mas cambio de fondo y de color de texto, de modo que el estado nunca depende solo del color).
- API: recibe `items: ItemPestana[]` y un `Panel: AstroComponentFactory`. **No usa slots con nombre dinamico** porque el compilador de Astro los saca fuera del `.map()` y la variable del bucle queda sin definir. Es una limitacion concreta de Astro que en React no existe.
- Genera los ids `${id}-tab-${item.id}` y `${id}-panel-${item.id}`. **Ese segundo id es el que consume la regla de apagado por jornada de `enlacePlano.ts`.**

### 12.5 `Expositores.astro` (449 lineas)

Buscador y padron.

- **Formulario GET real**: `action={ruta('/expositores')} method="get" role="search"`. Sin JavaScript lleva a la pagina con el termino en la URL, que ademas queda enlazable y compartible.
- **Filtro por eje como enlaces**, no como `<select>`: cada eje muestra su pictograma, su color y su recuento, y cada filtro queda como URL propia.
- **Filtrado en cliente** solo en la pagina (`pagina`): lee `?q=` y `?eje=` y esconde lo que no coincide con `ficha.hidden = !coincide`. Es filtrado, no busqueda remota: el padron entero ya esta en la pagina.
- Normalizacion para buscar sin tildes: `.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')`, aplicada tanto al `data-texto` del servidor como al termino del cliente.
- Resultado con `aria-live="polite"` y enlace "Quitar filtros".
- Cada ficha usa `.con-banda` (la banda de estrato que se engrosa) y enlaza a `/plano?lugar=...` desde el dato del stand, para contestar tambien "donde queda" y "como llego".

### 12.6 `Faq.astro` (114 lineas)

`<details>` y `<summary>` nativos, con `name="faq"` (acordeon exclusivo nativo, sin JavaScript). El signo es un mas de 16px que rota 45 grados con `[open]`. Se quita el marcador por defecto de WebKit. Permite que Ctrl+F encuentre el texto plegado en navegadores que implementan la busqueda dentro de `details`.

### 12.7 `Riel.astro` (236 lineas)

Indice de secciones persistente, en forma de **testigo de perforacion**. Solo a partir de 75rem; debajo su lugar lo toma la barra movil.

- `position: fixed`, `pointer-events: none` en el contenedor y `auto` en la lista, para que no bloquee el contenido.
- Cada enlace aporta un tramo del cilindro: `width: 0.5rem`, `height: 2.25rem`, `background: currentColor`, `opacity: 0.22`. Los tramos se tocan por el canto, sin aire: es lo que hace que la columna se lea como material cortado y no como una barra de progreso segmentada.
- Estados: `es-visto` (tramo recorrido, opacidad 0,85) y `es-activo` (ancho 1,1rem, opacidad 1, mas cambio de color del numero). **El estado nunca depende solo del color.**
- El nombre de la seccion aparece solo en el item apuntado, como etiqueta posicionada fuera del flujo, con el color de fondo exacto de la seccion que hay detras (`--superficie`, que le escribe el script del layout).
- Entrada: los tramos se perforan de arriba hacia abajo, `320ms` con `delay: calc(520ms + var(--i, 0) * 70ms)`, en la misma cadencia que la sonda del hero.
- El color del tramo recorrido es el lavanda y no un estrato, con la justificacion escrita de que en este sitio un color de estrato significa un rubro y la seccion 7 no es un rubro.

### 12.8 `DivisorPanza.astro` (56 lineas)

Unico gesto curvo del sitio, una sola vez en el home, entre la banda de cifras y el papel. Es la panza de la J del isologotipo usada como bisagra.

```css
.divisor { height: 3.5rem; background: var(--surface-papel); overflow: hidden; }
.divisor::before { /* prolongacion de la banda oscura, 1rem */ }
.divisor::after  { inset-block-start: -1.5rem; width: 5rem; height: 5rem;
                   border-radius: var(--r-panza); background: var(--surface-tinta); }
```

Un circulo de 5rem cuyo ecuador coincide con el borde inferior de la banda, de modo que asoma su mitad justa. **Se resuelve con geometria CSS y no con un SVG estirado**, porque un `viewBox` escalado a lo ancho de la pantalla convertiria el semicirculo en una elipse chata. De la referencia se adopta la idea de cortina con forma pero no su costo: alla cada transicion se comia un viewport, aca ocupa 56 px y no consume scroll.

### 12.9 `IconoActividad.astro` (88 lineas)

Cinco pictogramas dibujados a mano para este proyecto: conferencia (microfono), panel (globo de dialogo con dos renglones), ronda (dos flechas que se cruzan en sentidos opuestos), taller (llave), institucional (frontis con columnas).

Caja 24 x 24, encuadre dentro de 2 a 22, trazo de 2, `stroke-linecap="butt"`, `stroke-linejoin="miter"`. Los comentarios documentan tres versiones descartadas del pictograma de panel y por que se descarto `building-factory` (se lee como torre de refrigeracion de central nuclear).

### 12.10 `CabeceraSeccion`, `TramaModular`, `Sectores`, `PanelSector`, `LeyendaPlano`

Ya cubiertos: `CabeceraSeccion` en §5.3, `TramaModular` en §6.4, `LeyendaPlano` y `PanelSector` en §11.1.

`Sectores.astro` es un envoltorio corto: seccion `en-tinta` con `id="sectores"`, `CabeceraSeccion` numero 3, y `Pestanas` en orientacion vertical con `PanelSector` como panel. Mapea cada sector a `{ id, texto: nombre, apoyo: resumen, eje: id, dato: sector }`.

`LeyendaPlano.astro` merece una nota: usa el mismo interruptor `--eco` que el plano, pero alli desplaza el filete en vez de levantar el volumen.

```css
.leyenda__item {
  border-inline-start: 3px solid transparent;
  padding-inline-start: calc(var(--e-2) + var(--eco, 0) * 0.375rem);
  transition: padding-inline-start var(--dur-rapida) var(--ease);
}
.leyenda__item[data-eje] { border-inline-start-color: var(--eje); }
```

Un solo interruptor para los dos lados de la seccion.

---

## 13. Assets de marca y contenido de `public/`

### 13.1 `src/assets/` (pasan por `astro:assets`)

| Archivo | Dimensiones | Peso | Uso |
|---|---|---|---|
| `expojuy-horizontal.png` | 1934 x 542 | 85,8 KB | Logo de la cabecera (servido a 158 y 210 px) |
| `expojuy-isologotipo.png` | 688 x 959 | 27,1 KB | Marca del pie (servido a 56 px) |
| `expojuy-vertical.png` | 1478 x 956 | 89,5 KB | **No se usa en ningun componente** |
| `camcomex.png` | 1077 x 1008 | 387,1 KB | **No se usa en ningun componente** (declarado en PENDIENTES como "disponible") |

Los cuatro provienen del kit oficial (`Material para compartir/EXPOJUY_Logo2026/RGB/`).

**Nota**: dos de los cuatro archivos estan sin usar y suman 476 KB de repositorio. `camcomex.png` es el mas pesado del repo.

### 13.2 `src/assets/sponsors/` (9 archivos, todos 316 x 186)

| Archivo | Peso |
|---|---|
| `banco-jujuy.png` | 7,8 KB |
| `camcomex.png` | 25,9 KB |
| `cauchari.png` | 21,4 KB |
| `cfi.png` | 12,2 KB |
| `gobierno-jujuy.png` | 13,2 KB |
| `jemse.png` | 5,4 KB |
| `ledesma.png` | 16,1 KB |
| `ministerio-produccion.png` | 21,5 KB |
| `uni-jujuy.png` | 31,0 KB |

Todos monocromos en `#232326` sobre transparente, con la misma cantidad de tinta y el mismo lienzo. Generados por `scripts/normalizar-logos.mjs` a partir de `Material para compartir/`. Astro los convierte a dos webp cada uno en el build.

### 13.3 `public/` (sin procesar)

| Archivo | Dimensiones / peso |
|---|---|
| `favicon.png` | 1510 x 1509, 27,7 KB |
| `fonts/Ambit-Light.woff2` | 34,4 KB |
| `fonts/Ambit-Regular.woff2` | 33,1 KB |
| `fonts/Ambit-SemiBold.woff2` | 34,9 KB |
| `fonts/Ambit-Bold.woff2` | 35,2 KB |

Las cuatro fuentes suman 137,6 KB. Se precargan solo dos (Regular y Bold). Convertidas desde los `.otf` del kit con `wawoff2`.

**Observacion**: el favicon es un PNG de 1510 x 1509 px sin redimensionar, 27,7 KB, servido como unico icono. Falta el juego habitual (32x32, 180x180 apple-touch-icon, manifest). Es un pendiente facil.

### 13.4 `Material para compartir/` (kit oficial recibido)

```
EXPOJUY_Logo2026/
  CMYK/   expojuy26 · expojuy26_horizontal · expojuy26_isologotipo  (cdr, eps, jpg, pdf)
  RGB/    los mismos tres, mas .png
  logo_camcomext.pdf / .png
Fuentes_Oficiales/  Ambit-Bold.otf · Ambit-Light.otf · Ambit-Regular.otf · Ambit-SemiBold.otf
banconacion.jpg · ConsejoFederalDeInversiones.png · jemseicono.png · ledesmaicono.jpg
Logo-Gob-de-Jujuy-Azul.png · logotipoUNJu.png · ministeriodesarolloeconomicao.jpg
powerchina-proyectos-cauchari.png
```

**Lo que vino**: logotipo en tres construcciones (completo, horizontal, isologotipo), en CMYK y RGB, en cinco formatos; el logo de la Camara; la tipografia Ambit en cuatro pesos; y nueve isologotipos de instituciones.

**Lo que NO vino**, y esta declarado en `PENDIENTES.md`:

- **Ninguna fotografia.** Es el faltante mas importante.
- **Manual de identidad ni especificacion de color.** Los seis HEX se extrajeron por muestreo de pixeles del arte vectorial.
- **Version en negativo o monocroma del logotipo completo.** Por eso el pie usa el isologotipo.
- Plano o planta real del predio.

---

## 14. Documentacion del repositorio

### 14.1 `AGENTS.md` (contexto y reglas)

Define que es (sitio oficial que se entrega a la Camara, que lo mantiene sin el equipo), el stack (Astro estatico, sin frameworks de UI, sin backend porque el hosting puede no tener Node) y la estructura a respetar.

**Reglas** (transcritas):

- Contenido nuevo va como content collection con esquema Zod, nunca hardcodeado en el componente.
- Nada de frameworks de UI. Si un componente necesita JavaScript, se escribe como `.astro` con un `<script>` propio.
- Antes de escribir comportamiento a mano, revisar si lo da la plataforma: `<dialog>`, `<details>`, formularios GET.
- Colores solo desde `tokens.css`. No hex sueltos en componentes.
- Toda animacion respeta `prefers-reduced-motion`, y el contenido es legible en su estado final por defecto: nada depende de que un script corra para poder leerse.
- No agregar adaptadores SSR ni endpoints de API.

**Registro de decisiones**: 2026-09-07, se elimina React del proyecto. Tabla comparativa: runtime de React 184 KB, `react.*.js` 7,5 KB, codigo propio 2,3 KB, total antes **194 KB**, total despues **3,2 KB**.

### 14.2 `README.md`

Datos declarados:

| Metrica | Valor |
|---|---|
| Framework | Astro 7, `output: 'static'` |
| Paginas | 26 |
| JavaScript al cliente | ~8 KB en el home, ~5 KB en el resto, **0 archivos externos** |
| CSS | ~10 KB comprimido |
| HTML del home | ~30 KB comprimido |
| LCP medido | ~110 ms |
| Contraste | 0 fallos sobre ~590 elementos de texto auditados |

Sitio publicado: `https://amarusegovia.github.io/expojuy-2026/`.

Verificado contra `dist/`: 26 archivos HTML, cero archivos `.js`, `dist/index.html` de 191.780 bytes sin comprimir, cuatro archivos CSS (`Base` 22,7 KB, `enlacePlano` 12,1 KB, `Agenda` 6,7 KB, `index`).

### 14.3 `LICENCIAS.md` (resumen)

**Que se puede usar legalmente:**

| Pieza | Origen | Condicion |
|---|---|---|
| Pictogramas de los seis ejes | **Tabler Icons 3.46.0** (`pick`, `bolt`, `leaf`, `brain`, `truck-delivery`, `building-factory-2`) de Pawel Kuna | **Licencia MIT.** Permite uso comercial, modificacion y redistribucion. **No exige atribucion en pantalla**, solo conservar el aviso de copyright, que esta transcrito completo en `LICENCIAS.md`. |
| Pictogramas de las cinco actividades | Dibujados para este proyecto | Propios |
| Corte geologico del hero (`Estratos.astro`) | Generado por codigo en este proyecto | Propio |
| Plano del predio | Dibujado para este proyecto | Propio, y es una propuesta, no la planta real |
| Trama modular | Derivada de la geometria del isologotipo | Propia |
| **Isologotipo, logotipo y tipografia Ambit** | **Kit oficial de ExpoJuy 2026** | **Propiedad de la organizacion.** Estan en el repo para que la propuesta compile, **no para redistribucion**. |
| Isologotipos de patrocinadores | De cada institucion | Normalizados con el script; propiedad de cada institucion |

**Declaracion explicita**: no se usaron fotografias de banco ni imagenes generadas.

Esto es relevante porque las bases (Art. 24) listan como causal de descalificacion "utilizar software, imagenes o recursos sin la licencia correspondiente", y (Art. 21) exigen que los participantes garanticen que poseen los derechos sobre todos los recursos.

### 14.4 `REFERENCIAS.md` (resumen)

Auditoria del sitio de referencia `era-residence.com`, medida sobre el sitio en vivo (Chrome, 1910 x 935) el 7 de septiembre de 2026, con datos del DOM, de `ScrollTrigger.getAll()` y de estilos computados.

**Stack detectado en la referencia**: Webflow, GSAP 3.15 (ScrollTrigger, SplitText, CustomEase), Lenis 1.3.21, Barba.js, Lottie, jQuery, Adobe Typekit. 194 instancias de ScrollTrigger en el home.

**Datos duros**: el home mide 29.844 px, unos 32 viewports. No hay `<nav>`, ni anclas internas, ni indice. El 60 % del scroll lo consumen cinco secciones. Ratio scroll a contenido de 4:1.

**Tabla de veredictos** (lo que define la propuesta):

| # | Patron | Veredicto |
|---|---|---|
| 6.1 | Sistema de temas por seccion mas rampa de opacidad | **ADOPTAR** |
| 6.2 | Escala tipografica de contraste brutal | **ADOPTAR recalibrado** |
| 6.3 | Video recortado como textura, no como fondo | **ADOPTAR** |
| 6.4 | Cortina en arco entre secciones | **ADOPTAR dosificado** |
| 6.5 | Lista con item activo mas panel que responde | **ADAPTAR** |
| 6.6 | Stepper con flechas mas scroll | **ADAPTAR** |
| 6.7 | Hero sticky de 6 viewports | **DESCARTAR** |
| 6.8 | Scroll horizontal dirigido por scroll vertical | **DESCARTAR** |
| 6.9 | Reveals `toggleActions: play` sin revert | **DESCARTAR** |
| 6.10 | Lenis y smooth scroll custom | **DESCARTAR** |
| 6.11 | Ausencia de navegacion | **DESCARTAR** |
| 6.12 | Barba.js para transiciones de pagina | **DESCARTAR** |
| 6.13 | DOM duplicado desktop y movil | **DESCARTAR** |
| 6.14 | Render 3D como material dominante | **NO APLICA, conviene invertirlo** |

Razones documentadas de los descartes mas relevantes:

- **§6.8 scroll horizontal**: rompe Ctrl+F, rompe el enlace profundo, rompe el teclado, rompe la relacion scroll-avance, no escala (con 120 expositores el track mediria 40.000 px) y en movil pelea con el gesto de volver. Excepcion admitida: un carrusel honesto con drag real, `scroll-snap`, flechas visibles y sin secuestrar el scroll vertical.
- **§6.9 reveals**: la referencia tiene **0 bloques `@media (prefers-reduced-motion)`** en todo su CSS. Y `toggleActions: "play"` sin revert produce pantallas en blanco al llegar por salto de scroll, reproducido dos veces en `y = 6.300`.
- **§6.14 fotografia**: precision juridica util. Las consignas §9 dicen que el kit "podra incluir, entre otros" fotografias, que es una enumeracion potestativa. Lo exigible es respetar la identidad visual de los recursos que si vinieron. Como no hay fotografia en el material entregado, se construyo un sistema grafico propio derivado del isologotipo.

**Hallazgos de accesibilidad de la referencia** que el proyecto se propone no repetir: 5 `<h1>` en una pagina, saltos constantes de encabezados, 35 de 41 imagenes sin `alt`, 0 de 41 con `loading="lazy"`, solo `<main>` como landmark, sin skip link, 0 reglas de `prefers-reduced-motion`.

**Regla de decision final** del documento:

> Este patron le sirve a alguien parado en el predio, con una mano libre, buscando en que stand esta una empresa? Si la respuesta es no, no entra en el mockup.

Es la frase que ordena todo el proyecto y aparece citada en `BarraMovil.astro`.

### 14.5 `PENDIENTES.md` (el documento mas util para la fusion)

Regla declarada: **ningun dato inventado se presenta como oficial.**

Secciones:

1. **Lo que si vino en el kit y se uso**: isologotipo, logotipo vertical y horizontal, logo de la Camara, tipografia Ambit. Paleta extraida por muestreo de pixeles, con la advertencia de cotejar contra un manual de marca si existe.
2. **Datos del evento, todos a confirmar**: fechas, sede, direccion, correo, telefono y redes son inventados. Lo unico que se sabe es que el evento es posterior al 30/09/2026, que es cuando se publica el sitio.
3. **Contenido de demostracion**: cifras, indicadores de los ejes, agenda, expositores, noticias, sponsors y FAQ. Los sectores si son reales (matriz productiva de Jujuy); los indicadores no.
4. **Recursos graficos que faltan**: fotografia institucional (4.1, el mas importante), version en negativo del logotipo (4.2), tres logos de sponsors (4.3, parcialmente resuelto), planta real del predio (4.4), y el cambio de criterio de pictogramas (4.5).
5. **Decisiones tecnicas**, con varias marcadas como resueltas: React eliminado (5.1), entrada del hero (5.2), formulario sin backend (5.3), las 26 rutas (5.4), el plano que se construye (5.5), cifras que cuentan y trama en Novedades (5.6), el plano que contesta "como llego" (5.7).
6. **Datos que se corrigieron al cruzarlos**: tres inconsistencias reales que estaban publicadas y que nadie podia ver porque cada dato vivia en un archivo distinto:
   - la agenda mandaba a "Aula 2", "Sala Conocimiento", "Pabellon C" y "Escenario Abierto", ninguno dibujado en el plano;
   - diez de doce expositores tenian el stand en el pabellon equivocado;
   - la seccion de ejes enlazaba a `?rubro=` y el buscador espera `?eje=`.
   Las tres estan corregidas y **verificadas por esquema**: si vuelven a aparecer, el build falla.
7. **La memoria descriptiva quedo atrasada**: lista de once cosas que le faltan.

### 14.6 El entregable: `memoria-descriptiva.html` y `MEMORIA_DESCRIPTIVA.pdf`

**Como se genera el PDF**: no hay script commiteado. Los metadatos del PDF lo dicen con precision:

```
/Creator (Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)
          HeadlessChrome/152.0.0.0 Safari/537.36)
/Producer (Skia/PDF m152)
/CreationDate (D:20260907083239+00'00')
```

Es decir: **se imprimio `memoria-descriptiva.html` a PDF con Chrome headless**. No hay `puppeteer`, ni `wkhtmltopdf`, ni una tarea de npm. Es un paso manual. **Al fusionar conviene automatizarlo** con un script de `puppeteer` o `playwright` para que el PDF no vuelva a quedar desactualizado.

`memoria-descriptiva.html` es un documento autonomo de 36 KB, con:

- `@page { size: A4; margin: 17mm 15mm 15mm; }`
- `@font-face` apuntando a `public/fonts/*.woff2` con rutas relativas
- `print-color-adjust: exact` y `-webkit-print-color-adjust: exact`
- Sus propias variables de color (un subconjunto de los tokens del sitio: violeta, turquesa, tinta, titulo, cuerpo, suave, dato, borde, papel2)
- Cuerpo de 9,6 pt, portada con filete violeta de 3 pt

**Estructura, que mapea exactamente los ocho puntos que pide la consigna §4.2:**

1. Concepto general del proyecto
2. Objetivos perseguidos
3. Organizacion del contenido (navegacion en tres capas, contenido editable sin tocar codigo)
4. Criterios de diseno (4.1 la paleta institucional impone la arquitectura cromatica; 4.2 estratos como sistema secundario; 4.3 una sola interaccion distintiva; 4.4 tipografia; 4.5 decisiones para evitar patrones de molde; 4.6 ritmo, forma y material grafico)
5. Tecnologias previstas para el desarrollo
6. Estrategia de accesibilidad (principios aplicados)
7. Estrategia responsive
8. Uso previsto de Inteligencia Artificial (en que se uso, que decidio el equipo, IA prevista en el sitio)

Mas una "Nota preliminar sobre los datos y los recursos" al comienzo.

**Estado**: desactualizada. `PENDIENTES.md` §7 lista once cambios posteriores que no estan reflejados, entre ellos el corte geologico, la fusion de agenda y plano, el plano isometrico, la grilla de tiempo, el cambio de pictogramas y las 26 paginas.

---

## 15. Requisitos del concurso

### 15.1 `BASES_Y_CONDICIONES.md`, resumen detallado

**Datos clave**

| Dato | Valor |
|---|---|
| Nombre | Desafio Digital ExpoJuy 2026 |
| Objeto | Seleccionar la mejor propuesta para el diseno y posterior desarrollo del sitio web oficial |
| Etapa actual | **Propuesta conceptual. NO se desarrolla el sitio completo** |
| Equipos | Minimo 2, maximo 4 integrantes |
| Cierre de inscripcion y entrega | **8 de septiembre de 2026, 23:59 hora Argentina** |
| Preseleccion | 11 de septiembre de 2026 |
| Demo Day y resultados | 14 de septiembre de 2026 |
| Desarrollo del sitio (ganador) | 15 al 30 de septiembre de 2026 |
| Entrega final | **30 de septiembre de 2026** |
| Premio | $750.000 ARS, mas certificado, difusion, mentoria y reconocimiento publico |
| Restricciones tecnologicas | **Ninguna** |
| Uso de IA | Permitido y valorado, **con declaracion obligatoria** |

**Organizan**: Ministerio de Desarrollo Economico y Produccion de la Provincia de Jujuy, a traves de la Direccion Provincial de Servicios Basados en el Conocimiento, y la Camara de Comercio Exterior de Jujuy. Acompana ClusteAR (Camara de Empresas TICs).

**Participantes (Art. 4)**: mayores de 18 anos residentes en Jujuy, que sean egresados o estudiantes de programas de la Direccion Provincial de SBC, estudiantes o egresados de instituciones aliadas, desarrolladores web, disenadores UX/UI, o equipos multidisciplinarios.

**Equipos (Art. 5)**: entre 2 y 4 personas, con un representante designado. Nadie puede integrar mas de un equipo.

**Entregables obligatorios de la primera etapa (Art. 8)**:

- Mockup navegable o prototipo
- Memoria descriptiva
- Explicacion conceptual de la propuesta
- Tecnologias previstas para el desarrollo
- Descripcion del uso de herramientas de IA, cuando corresponda

**Documentacion a presentar (Anexo III, primera etapa)**: formulario de inscripcion, integrantes del equipo, link al mockup (Figma o equivalente), memoria descriptiva, tecnologias propuestas, declaracion de uso de IA.

**Segunda etapa (equipo ganador)**: codigo fuente completo, repositorio del proyecto, manual de instalacion, documentacion tecnica, recursos graficos, manual de despliegue.

**Tecnologias (Art. 10)**: sin restricciones. Se valora especialmente **escalabilidad, seguridad, accesibilidad, buenas practicas, rendimiento y mantenimiento**.

**IA (Art. 11)**: permitida como apoyo. El jurado valora el uso innovador y responsable, entendiendo que es complemento y no reemplazo. **Cada equipo debe informar que herramientas uso y con que finalidad.**

**Criterios de evaluacion (Art. 13)**: innovacion, diseno visual, experiencia de usuario, identidad institucional, factibilidad tecnica, accesibilidad, escalabilidad, calidad general de la presentacion, uso responsable de IA. El fallo es definitivo e inapelable. La organizacion puede publicar una rubrica con puntajes.

**Hosting y dominio (Art. 18)**: los provee la Camara. Los participantes no asumen costos de infraestructura. **Esto es lo que justifica la decision de sitio estatico sin Node en este repo.**

**Propiedad intelectual (Art. 21 y 22)**: los participantes garantizan originalidad y derechos sobre todos los recursos. La propuesta ganadora **cede a la Camara los derechos de uso, adaptacion, mantenimiento y publicacion**, conservando los autores el reconocimiento de autoria. El ganador debe entregar codigo fuente, archivos de diseno y documentacion **sin restricciones tecnicas o legales** que impidan su uso, modificacion o futura actualizacion.

**Descalificacion (Art. 24)**: documentacion falsa, incumplir las bases, plagio total o parcial, **usar software, imagenes o recursos sin licencia**, o afectar la transparencia del concurso.

**Concurso desierto (Art. 20)**: la organizacion puede declararlo desierto si ninguna propuesta reune los estandares minimos.

**Alcance funcional minimo (Anexo II)**: inicio institucional, informacion general de ExpoJuy, agenda de actividades, expositores, noticias, **mapa interactivo**, compra de entradas, formularios de contacto, diseno responsive, accesibilidad e integracion con redes sociales. Funcionalidades adicionales se consideran valor agregado.

### 15.2 `CONSIGNAS_TECNICAS_DEL_DESAFIO.md`, resumen detallado

**Brief resumido**

| Item | Definicion |
|---|---|
| Producto | Sitio web oficial de ExpoJuy 2026 |
| Entrega de esta etapa | Solo propuesta conceptual y visual. **NO se desarrolla el sitio** |
| Formato del mockup | Mockup, prototipo o maqueta navegable (Figma, Adobe XD, Penpot, Sketch o similar). **Opcionalmente**, desarrollo funcional en GitHub, **sin ventaja en la evaluacion** |
| Funcionalidades implementadas | **No obligatorias** en el prototipo |
| Secciones minimas | Inicio, Sobre ExpoJuy 2026, Expositores, Agenda, Noticias, Plano o mapa del predio, Sponsors, Contacto, FAQ, Redes sociales |
| Valores a transmitir | Innovacion, Tecnologia, Produccion, Desarrollo, Vinculacion empresarial, Economia del Conocimiento |
| Atributos de la experiencia | Moderna, intuitiva, accesible, responsive |
| Identidad visual | **Obligatorio respetar el Kit de Diseno oficial** (logos, manual de identidad, paleta HEX/RGB, tipografias, fotografias) |
| Restricciones tecnicas | Ninguna. **La tecnologia elegida no puntua por si misma** |
| Uso de IA | Permitido y valorado como apoyo; debe declararse |
| Originalidad | **Prohibido reproducir total o parcialmente** disenos, contenidos o estructuras de los sitios de referencia |
| Documento acompanante | **Memoria descriptiva en PDF** |

**Alcance de la propuesta (§3)**: identidad visual del sitio, arquitectura de navegacion, UX, UI, organizacion de contenidos, propuesta funcional y **justificacion de las decisiones de diseno**.

**Memoria descriptiva (§4.2), contenido obligatorio en PDF**:

1. Concepto general del proyecto
2. Objetivos perseguidos
3. Organizacion del contenido
4. Criterios de diseno
5. Tecnologias previstas para el desarrollo
6. Estrategia de accesibilidad
7. Estrategia responsive
8. Uso previsto de Inteligencia Artificial, si corresponde

**Funcionalidades sugeridas (§6)**: buscador de expositores, agenda interactiva, mapa del predio, filtro por rubros, formulario de contacto, compra o gestion de entradas, panel de novedades, integracion con redes, espacios para patrocinadores, panel para futuras actualizaciones.

**Tecnologias (§7)**: sin restricciones. Se mencionan React, Angular, Vue, Next.js, Astro, Svelte, HTML/CSS/JS, .NET, Laravel, Django "o cualquier otra tecnologia equivalente". Nota expresa: la tecnologia elegida no sera criterio de evaluacion por si misma.

**IA (§8)**: se permite y valora para generacion de ideas, investigacion, prototipado, optimizacion de codigo, redaccion de contenidos, produccion de recursos graficos y automatizacion. Ademas, **se pueden proponer funcionalidades del sitio que incorporen IA**.

**Kit de Diseno (§9)**: la organizacion pone a disposicion un kit descargable que "podra incluir, entre otros": logotipo oficial, logotipo de la Camara, manual de identidad visual, paleta cromatica (HEX y RGB), tipografias oficiales, recursos graficos, fotografias e imagenes institucionales. **Los participantes deberan respetar la identidad visual establecida en dichos recursos.**

**Sitios de referencia (§10)**, orientativos y **que no se pueden reproducir**:

- ExpoJuy 2024: https://expojuy.camcomexjujuy.com.ar/
- Argentina Mining: https://argentinaminingonline.com/
- Expo Industrias: https://expoindustrias.com.ar/
- Expo Logisti-k: https://www.expologisti-k.com.ar/

**Criterios tecnicos de evaluacion (§11)**: calidad del diseno visual, claridad de la arquitectura de informacion, experiencia de usuario, accesibilidad, adaptabilidad a moviles, escalabilidad, factibilidad tecnica, innovacion, uso responsable de IA, originalidad.

### 15.3 Cobertura del repo contra los requisitos

| Requisito | Estado en este repo |
|---|---|
| Inicio | Si, `/` |
| Sobre ExpoJuy 2026 | Si, `/sobre` y seccion 02 |
| Expositores | Si, `/expositores` con buscador y filtro, mas 12 fichas |
| Agenda | Si, `/agenda` con grilla de tiempo y carriles |
| Noticias | Si, `/noticias` mas 3 notas |
| Plano o mapa del predio | Si, `/plano`, maqueta isometrica interactiva |
| Sponsors | Si, `/sponsors`, por niveles |
| Contacto | Si, `/contacto` con formulario |
| FAQ | Si, `/faq` con `<details>` |
| Redes sociales | Si, en pie y en contacto (URLs genericas pendientes) |
| Compra o gestion de entradas | Si, `/entradas` con formulario de acreditacion (demostracion) |
| Diseno responsive | Si |
| Accesibilidad | Si, mas pagina `/accesibilidad` propia |
| Memoria descriptiva en PDF | Si, pero **desactualizada** |
| Declaracion de uso de IA | Si, seccion 8 de la memoria |
| Respetar el kit de diseno | Si: Ambit, isologotipo, seis colores muestreados |
| Originalidad frente a los sitios de referencia | Documentada en `REFERENCIAS.md`, con veredictos explicitos |
| **Faltantes identificados** | sitemap.xml, `og:image`, favicon multiescala, view transitions |

---

## 16. Accesibilidad

### 16.1 `src/pages/accesibilidad.astro`

Pagina propia de declaracion, con seis medidas enumeradas:

1. **Contraste verificado**: cada color de texto declara su contraste sobre la superficie en la que se usa. El cuerpo supera AAA; nada por debajo de AA. Los dos colores mas vivos de la marca solo van sobre fondo oscuro.
2. **Todo se usa con teclado**: pestanas con flechas, acordeones nativos, foco siempre visible, skip link, y una maqueta del predio que tambien se gira con las flechas.
3. **El color nunca es el unico indicador**: cada eje tiene color, pictograma y nombre. Cada actividad dice en palabras donde ocurre ademas de llevar el color de su lugar.
4. **Movimiento reducido**: con la preferencia del sistema activada no hay ninguna animacion; el sitio se pinta en su estado final. Sin JavaScript, tambien.
5. **La misma informacion en texto**: el plano es una figura; la leyenda y el listado de pabellones dicen lo mismo en texto. Los graficos decorativos estan ocultos a los lectores de pantalla.
6. **Objetivos tactiles y estructura**: botones y enlaces de al menos 44 x 24 px, un solo encabezado principal por pagina, jerarquia sin saltos y regiones de navegacion nombradas.

Cierra con una via de contacto para reportar barreras y una nota sobre la accesibilidad fisica del predio. Declara conformidad objetivo: **WCAG 2.2 nivel AA, con el cuerpo de texto en AAA**.

### 16.2 Mecanismos verificados en el codigo

**`prefers-reduced-motion`**, en cuatro capas:

1. `tokens.css`: las tres duraciones bajan a 1ms de una sola vez.
2. `base.css`: `html { scroll-behavior: auto }`.
3. El script inline de `Base.astro` no pone `data-anim="si"`, con lo cual **ninguna** regla de animacion se activa (todas cuelgan de ese atributo).
4. Reglas puntuales en `PlanoIsometrico`, `Agenda`, `Noticias` y `Estratos` que anulan transiciones y `clip-path`.

Es una cobertura mas completa que la habitual: la mayoria de los sitios solo hacen el punto 4.

**Contraste**: cada token de texto lleva su ratio anotado en el comentario. La regla dura mas citada: sobre turquesa nunca va texto blanco (2,19:1). Los estratos tienen tres valores segun superficie, todos medidos.

**Foco**: `:focus-visible` global con `outline` de 3px y offset 2px, que **nunca se anula**. Variante turquesa dentro de `.en-tinta`. En el plano, el foco se marca en el techo del bloque y en el borde de la platea, no con un recuadro alrededor de toda la caja.

**Navegacion por teclado**:

- Skip link `.saltar` como primer elemento del `<body>`.
- Pestanas con patron ARIA completo (flechas, Home, End, roving tabindex).
- `<dialog>` con `showModal()`: foco atrapado y Escape los da la plataforma.
- `<details>` nativos.
- El plano es un `role="group"` enfocable con flechas para girar y Home/Escape para volver, mas seis pabellones que son enlaces.
- Formularios GET reales, que funcionan sin JavaScript.

**Objetivos tactiles**: `.boton` con `min-height: 3rem`; `.enlace-ir` con `min-height: 1.875rem` (30px) y la justificacion de WCAG 2.5.8 escrita; barra movil con `min-height: 3.5rem`; enlaces de pie y de contacto con `padding-block` para llegar a 24px.

**Semantica**: un solo `<h1>` por pagina (garantizado por el par `nivel` mas `pagina`); todas las secciones con `aria-labelledby`; landmarks `<header>`, `<nav>` (con `aria-label`), `<main id="contenido">`, `<footer>`; `<time datetime>` en todas las fechas; `aria-live="polite"` en el resultado del buscador; `aria-current="page"` en la navegacion y `aria-current="true"` en el riel.

**Texto alternativo**: `alt` descriptivo en el logo de cabecera y en los logos de sponsors (el nombre de la institucion); `alt=""` explicito en el isologotipo del pie, porque el nombre esta al lado; `aria-hidden="true"` en todos los pictogramas, en la trama modular, en el corte geologico, en los numerales de seccion y en los carteles del plano.

**Contenido duplicado evitado**: la miniatura del plano en movil entra en modo `decorativo`, sale del arbol de accesibilidad y sus pabellones dejan de ser enlaces, para no duplicar seis destinos de teclado.

### 16.3 Puntos debiles detectados

- **`og:image` ausente** pese a declarar `twitter:card = summary_large_image`.
- **Sin `sitemap.xml` ni `robots.txt`.**
- Favicon unico de 1510 px, sin `apple-touch-icon` ni manifest.
- El formulario de contacto no tiene mensaje de exito ni de error en pagina: depende de la pagina de gracias del servicio externo.
- `Sobre.astro` tiene contenido hardcodeado, contra la regla de `AGENTS.md`.
- Tres criterios de remate distintos entre los tres sets de iconos.
- El calculo de `usos` esta duplicado en tres archivos.
- `sharp` no esta declarado en `package.json` pese a que `scripts/normalizar-logos.mjs` lo importa.
- `--e-5` se usa con fallback pero no existe como token.
- El comentario de `Sponsors.astro` sobre el lienzo (400 x 160) no coincide con los archivos reales (316 x 186).
- Dos assets sin usar en `src/assets/` que suman 476 KB.

---

## 17. Notas para la fusion de los tres prototipos

### 17.1 Que conviene tomar de este repo mas alla de las siete piezas pedidas

1. **El sistema de dos banderas en el `<html>`** (`data-js` y `data-anim`) puestas antes del primer pintado. Es el mecanismo que hace que todo el sitio sea legible sin JavaScript y sin animacion, con una sola linea de selector por regla.
2. **Las duraciones como tokens anulables de una vez** bajo `prefers-reduced-motion`.
3. **`.en-tinta` como sistema de tema por seccion**: reasigna tokens en vez de duplicar componentes.
4. **El patron `pagina?: boolean`** en cada seccion, que da 26 paginas con 11 componentes.
5. **Los esquemas Zod con validacion cruzada** (`superRefine` del stand contra el pabellon, `z.enum(IDS_VALIDOS)` para el lugar de la agenda). Es la garantia de que el contenido real no reintroduzca las inconsistencias.
6. **`predio.ts` como fuente unica de geometria**, del que se derivan dibujo, leyenda, recorridos, reglas y validaciones.
7. **El cuerpo de comentarios**: cada decision viene con su medicion. Es documentacion viva.

### 17.2 Que hay que resolver al fusionar

- **Orden de hojas de estilo**: no hay `@layer`, asi que el CSS depende del orden y de la especificidad natural. Con dos o tres sistemas de diseno mezclados esto se vuelve fragil rapido. Recomendacion: introducir `@layer` al fusionar.
- **Los estilos globales inyectados** (`enlacePlano`, la tipografia) tienen que seguir siendo globales.
- **Los ids generados por `Pestanas`** (`#agenda-panel-j1`) son un acoplamiento con `enlacePlano.ts`. Si se cambia el componente de pestanas, hay que actualizar el generador.
- **El componente del plano hace acceso a datos por dentro**. Antes de portarlo conviene extraer `expositoresPorEje` y `actividadesPorLugar` a props.
- **Breakpoints sin tokens**: 40, 48, 60, 64, 68 y 75rem escritos a mano. Conviene tokenizarlos antes de mezclar con otro repo que use otra escala.
- **Contenido de demostracion**: todo esta declarado en `PENDIENTES.md`, archivo por archivo. Antes de publicar hay que reemplazar fechas, sede, telefono, programa, expositores, cifras, sponsors y FAQ.
- **Regenerar la memoria descriptiva** y automatizar el paso a PDF.

### 17.3 Compatibilidad de las piezas adoptadas con un slider y una animacion de otro repo

- **Noticias mas slider**: la tarjeta es transplantable; hay que cuidar `data-revelar-grupo` (que asigna `--i` a los hijos directos), el `::after` de area completa del titulo y el `overflow: hidden` de la figura. Y respetar la condicion de "carrusel honesto" que el propio repo se impuso.
- **Sponsors mas animacion**: los logos son monocromos, agrupados por nivel y en grilla `auto-fill`. Una cinta infinita rompe la jerarquia de niveles; un revelado escalonado se engancha con una sola clase.
- **Mapa del otro repo con la profundidad de este**: el checklist esta en §11.13. Lo esencial es el modelo de datos, el orden por `x + y`, las dos rotaciones sin `perspective`, las cinco caras con tres tonos de luz, la sombra proporcional al alto, y las cuatro propiedades registradas con `@property` que hacen posibles la construccion y la vuelta del giro.
