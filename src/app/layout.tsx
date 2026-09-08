import type { Metadata, Viewport } from "next";
import { ambit } from "@/shared/fonts";
import { SITE } from "@/shared/constants/site";
import { SmoothScroll } from "@/shared/components/motion/smooth-scroll";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import { BRAND_ICON_DATA_URI } from "@/shared/components/brand/brand-mark-paths";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.claim}`,
    // Las páginas internas solo declaran su nombre; el sufijo lo pone el layout.
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.organizer }],
  keywords: [
    "ExpoJuy",
    "ExpoJuy 2026",
    "Jujuy",
    "comercio exterior",
    "exposición",
    "economía del conocimiento",
    "vinculación empresarial",
  ],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.claim}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.claim}`,
    description: SITE.description,
  },
  // El ícono se genera desde la misma geometría del isologotipo (ver
  // brand-mark-paths.ts), no es un archivo aparte que pueda desincronizarse.
  icons: { icon: [{ url: BRAND_ICON_DATA_URI, type: "image/svg+xml" }] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // El sitio no tiene tema claro: se declara para que el navegador pinte la
  // barra de UI y el overscroll en el color correcto desde el primer frame.
  colorScheme: "dark",
  themeColor: "#0b0911",
  width: "device-width",
  initialScale: 1,
  // Sin maximumScale ni userScalable:false — bloquear el zoom viola WCAG 1.4.4.
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `suppressHydrationWarning` es obligatorio acá, no cosmético: el script
    // de abajo agrega la clase `js` al <html> ANTES de que React hidrate, así
    // que el cliente encuentra un className que no coincide con el que emitió
    // el servidor. Sin esto, React reporta un mismatch de hidratación en cada
    // carga. Solo afecta a los atributos de este elemento, no a sus hijos.
    <html lang="es-AR" className={ambit.variable} suppressHydrationWarning>
      <body className="bg-surface-sunken font-sans text-text antialiased">
        {/* Script de arranque. Corre antes de que se parsee contenido animado
            y hace dos cosas, las dos imposibles de resolver desde React:

            1. Marca `js` en el <html>. Las animaciones de aparición se aplican
               SOLO detrás de esa clase, así que si el JS falla el contenido
               queda visible en vez de invisible.

            2. Decide si corresponde la pantalla de carga y marca `data-loader`.
               Tiene que pasar acá y no en un efecto: si dependiera de React, el
               navegador pintaría el hero primero y el morado lo taparía
               después. El loader llegaría tarde a su propia función.

            Lo único interpolado es STORAGE_KEYS.loaderVisto, una constante
            nuestra en un módulo NEUTRAL (sin "use client"). Ese detalle no es
            menor: si viniera del módulo del loader, que sí es cliente, el
            servidor recibiría un proxy de referencia en vez del string y
            emitiría un script sintácticamente roto. Nada acá proviene de
            entrada de usuario, así que no hay superficie de XSS. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.classList.add("js");try{if(!sessionStorage.getItem("${STORAGE_KEYS.loaderVisto}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)d.setAttribute("data-loader","")}catch(e){}})()`,
          }}
        />

        {/* Primer elemento enfocable del documento: permite saltar la
            navegación con el teclado. WCAG 2.4.1. */}
        <a
          href="#contenido-principal"
          className="sr-only-focusable fixed top-4 left-4 z-[100] bg-primary px-4 py-2 text-sm font-semibold text-on-primary focus-visible:outline-focus-ring"
        >
          Saltar al contenido principal
        </a>

        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
