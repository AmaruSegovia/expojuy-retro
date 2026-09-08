import localFont from "next/font/local";

/**
 * Ambit — tipografía oficial provista por la organización.
 *
 * Cuatro pesos estáticos en woff2 (~24 KB cada uno, ~98 KB en total). Se
 * declaran como UNA familia con cuatro `src` en vez de cuatro familias
 * separadas: así `font-weight: 700` resuelve a Ambit-Bold por sí solo y el
 * navegador nunca sintetiza un falso negrita deformando las letras.
 * (Por eso además `font-synthesis-weight: none` en globals.css.)
 *
 * `display: "swap"` prioriza que el texto sea legible desde el primer frame
 * aunque implique un cambio de fuente; `adjustFontFallback` genera un
 * @font-face intermedio con las métricas de Ambit aplicadas sobre Arial,
 * de modo que ese cambio no mueva el layout (CLS ≈ 0).
 */
export const ambit = localFont({
  src: [
    { path: "./Ambit-Light.woff2", weight: "300", style: "normal" },
    { path: "./Ambit-Regular.woff2", weight: "400", style: "normal" },
    { path: "./Ambit-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./Ambit-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-brand-sans",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
