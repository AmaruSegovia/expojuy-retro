import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  description:
    "Trazabilidad de los tokens de diseño de ExpoJuy 2026: origen de cada color, ratios de contraste medidos y escala tipográfica.",
  robots: { index: false, follow: false },
};

type Muestra = { token: string; hex: string; nota: string; ratio?: string };

const MARCA: Muestra[] = [
  {
    token: "brand-violet-deep",
    hex: "#820CD0",
    nota: 'Bloque "E" / contraforma J',
    ratio: "2.74:1",
  },
  { token: "brand-violet", hex: "#774FF0", nota: "Asta de la J — primario", ratio: "3.92:1" },
  { token: "brand-lavender", hex: "#BB8CFF", nota: "Base curva de la J", ratio: "7.83:1" },
  { token: "brand-cyan", hex: "#25C0D4", nota: "Acento superior", ratio: "9.02:1" },
  { token: "brand-graphite", hex: "#4B4B4D", nota: "Wordmark EXPOJUY", ratio: "2.27:1" },
];

const NEUTROS: Muestra[] = [
  { token: "surface-sunken", hex: "#040307", nota: "Fondo de página" },
  { token: "surface", hex: "#0B0911", nota: "Superficie base" },
  { token: "surface-raised", hex: "#16131D", nota: "Card / panel" },
  { token: "surface-overlay", hex: "#231F2B", nota: "Popover / footer" },
  { token: "border", hex: "#36323E", nota: "Separación decorativa", ratio: "1.29:1" },
  { token: "border-strong", hex: "#6C6975", nota: "Borde de control", ratio: "3.01:1" },
  { token: "text-subtle", hex: "#888691", nota: "Terciario / placeholder", ratio: "4.50:1" },
  { token: "text-muted", hex: "#A19EA7", nota: "Texto secundario", ratio: "6.12:1" },
  { token: "text", hex: "#E8E6EB", nota: "Texto principal", ratio: "13.01:1" },
];

const SEMANTICOS: Muestra[] = [
  { token: "danger", hex: "#FF392E", nota: "Error de formulario", ratio: "4.51:1" },
];

const ESCALA = [
  { token: "text-5xl", clase: "text-5xl", px: "47.8 → 101.1px" },
  { token: "text-4xl", clase: "text-4xl", px: "39.8 → 75.8px" },
  { token: "text-3xl", clase: "text-3xl", px: "33.2 → 56.9px" },
  { token: "text-2xl", clase: "text-2xl", px: "27.6 → 42.7px" },
  { token: "text-xl", clase: "text-xl", px: "23.0 → 32.0px" },
  { token: "text-lg", clase: "text-lg", px: "19.2 → 24.0px" },
  { token: "text-base", clase: "text-base", px: "16.0 → 18.0px" },
  { token: "text-sm", clase: "text-sm", px: "14.2 → 16.0px" },
  { token: "text-xs", clase: "text-xs", px: "12.6 → 14.2px" },
];

function Swatch({ token, hex, nota, ratio }: Muestra) {
  return (
    <li className="flex items-center gap-4 border-b border-border py-3">
      <span
        className="size-12 shrink-0 border border-border-strong"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <code className="block text-sm font-semibold text-text">{token}</code>
        <span className="block text-xs text-text-subtle">{nota}</span>
      </span>
      <span className="text-right">
        <code className="block text-xs text-text-muted tabular-nums">{hex}</code>
        {ratio && <code className="block text-xs text-text-subtle tabular-nums">{ratio}</code>}
      </span>
    </li>
  );
}

export default function SistemaDeDisenoPage() {
  return (
    <main id="contenido-principal" className="min-h-dvh bg-surface py-20">
      <div className="container-content">
        <header className="mb-16 border-b border-border pb-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
            Anexo técnico
          </p>
          <h1 className="mt-3 text-4xl font-bold text-balance text-text">Sistema de diseño</h1>
          <p className="mt-5 max-w-prose text-lg text-text-muted">
            Ningún valor de esta página fue elegido a ojo. Los colores de marca están{" "}
            <strong className="text-text">medidos</strong> sobre el logotipo oficial; los neutros
            están <strong className="text-text">generados</strong> en OKLCH al hue promedio de los
            violetas de marca; y cada escalón de texto y borde se{" "}
            <strong className="text-text">resolvió por búsqueda binaria</strong> hasta alcanzar su
            ratio de contraste WCAG objetivo.
          </p>
        </header>

        <section className="mb-16" aria-labelledby="h-marca">
          <h2 id="h-marca" className="text-2xl font-bold text-text">
            Colores de marca
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Muestreo de píxeles sobre <code>RGB/expojuy26.png</code>. El ratio es contra{" "}
            <code>surface</code> (#0B0911).
          </p>
          <ul className="mt-6">
            {MARCA.map((m) => (
              <Swatch key={m.token} {...m} />
            ))}
          </ul>
          <p className="mt-6 border-l-2 border-primary py-1 pl-4 text-sm text-text-muted">
            <strong className="text-text">Regla derivada:</strong> sobre fondo oscuro el violeta es
            color de <em>relleno</em>. Los únicos acentos válidos para texto son lavanda y cian.{" "}
            <code>brand-violet-deep</code> (2.74:1) y <code>brand-graphite</code> (2.27:1) quedan
            prohibidos para texto.
          </p>
        </section>

        <section className="mb-16" aria-labelledby="h-neutros">
          <h2 id="h-neutros" className="text-2xl font-bold text-text">
            Neutros teñidos
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Generados al hue 297.8° con croma mínimo. No son grises: extienden el criterio que la
            marca ya aplica en su gris institucional (#4B4B4D cae en H=286.3°).
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Cada escalón de texto y borde se resuelve contra <code>surface-overlay</code> (#231F2B),
            la superficie <strong className="text-text">más clara</strong> del sistema. El ratio que
            figura es el del peor caso: satisfacer la superficie más clara satisface a las otras
            tres por construcción. Resolver contra la superficie base dejaba a{" "}
            <code>text-subtle</code> en 3.82:1 sobre el footer.
          </p>
          <ul className="mt-6">
            {NEUTROS.map((m) => (
              <Swatch key={m.token} {...m} />
            ))}
          </ul>
        </section>

        <section className="mb-16" aria-labelledby="h-danger">
          <h2 id="h-danger" className="text-2xl font-bold text-text">
            Error, derivado del cian
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Ni el sistema ni la marca tienen un rojo, así que no había de dónde medirlo. La regla
            escrita es el <strong className="text-text">complementario del cian</strong>: el cian
            oficial cae en H=208.67° en OKLCH y su opuesto en la rueda, en 28.67°. Es el único rojo
            justificable a partir de un color de marca, y por construcción queda lo más lejos
            posible del acento con el que un error jamás debe confundirse.
          </p>
          <p className="mt-2 text-sm text-text-muted">
            El croma es el máximo que el gamut sRGB admite para esa L y ese hue (0.234) y no hizo
            falta acotarlo: cae dentro del rango que la marca ya usa (0.122 – 0.251). La lightness
            se resolvió por búsqueda binaria hasta 4.5:1 contra <code>surface-overlay</code>, igual
            que los neutros. Un solo token sirve para el texto del error y para el borde del campo:
            satisfacer 4.5:1 satisface el 3:1 no textual por construcción.
          </p>
          <ul className="mt-6">
            {SEMANTICOS.map((m) => (
              <Swatch key={m.token} {...m} />
            ))}
          </ul>
          <p className="mt-6 border-l-2 border-primary py-1 pl-4 text-sm text-text-muted">
            <strong className="text-text">Regla derivada:</strong> el color nunca es el único
            indicador de error (WCAG 1.4.1). Siempre va con texto, un ícono y{" "}
            <code>aria-invalid</code>.
          </p>
        </section>

        <section className="mb-16" aria-labelledby="h-tipo">
          <h2 id="h-tipo" className="text-2xl font-bold text-text">
            Escala tipográfica fluida
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Razón 1.200 en 360px de ancho, 1.333 en 1440px, interpolada con <code>clamp()</code>.
            Redimensioná la ventana: no hay saltos entre breakpoints.
          </p>
          <ul className="mt-6 space-y-4">
            {ESCALA.map((e) => (
              <li key={e.token} className="border-b border-border pb-4">
                <span className="flex items-baseline justify-between text-xs text-text-subtle">
                  <code>{e.token}</code>
                  <code className="tabular-nums">{e.px}</code>
                </span>
                <p className={`mt-1 truncate text-text ${e.clase}`}>Conectando países</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-16" aria-labelledby="h-estados">
          <h2 id="h-estados" className="text-2xl font-bold text-text">
            Estados interactivos
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            El hover del botón primario <strong className="text-text">se oscurece</strong>.
            Aclararlo —lo intuitivo en un tema oscuro— bajaba el texto blanco de 5.05:1 a 3.98:1 y
            rompía AA. Probá el foco con <kbd className="border border-border-strong px-1">Tab</kbd>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors duration-micro ease-standard hover:bg-primary-hover active:bg-primary-active"
            >
              Comprar entradas
            </button>
            <button
              type="button"
              className="rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-text transition-colors duration-micro ease-standard hover:border-link hover:text-link"
            >
              Explorar la expo
            </button>
            <button
              type="button"
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition-opacity duration-micro ease-standard hover:opacity-90"
            >
              Acento cian
            </button>
          </div>
        </section>

        <section aria-labelledby="h-radios">
          <h2 id="h-radios" className="text-2xl font-bold text-text">
            Radios y movimiento
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            El isologotipo se construye con esquinas vivas y una semicircunferencia completa. El
            sistema copia esa gramática: o 0, o píldora. El rango intermedio no existe a propósito.
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div className="text-center">
              <div className="size-20 bg-brand-violet" />
              <code className="mt-2 block text-xs text-text-subtle">radius-none</code>
            </div>
            <div className="text-center">
              <div className="size-20 rounded-full bg-brand-lavender" />
              <code className="mt-2 block text-xs text-text-subtle">radius-full</code>
            </div>
            <div className="text-center">
              <div className="h-20 w-32 rounded-full bg-brand-cyan" />
              <code className="mt-2 block text-xs text-text-subtle">píldora</code>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
