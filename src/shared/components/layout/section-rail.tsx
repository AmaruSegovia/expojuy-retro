"use client";

import { useEffect, useRef } from "react";
import { NAV_SECTIONS } from "@/shared/constants/site";
import { useClickAncla } from "@/shared/hooks/use-click-ancla";
import { useActiveSection } from "@/shared/hooks/use-active-section";

const IDS = NAV_SECTIONS.map((s) => s.id);

/**
 * Umbral de luminancia relativa que separa las dos familias de superficie.
 *
 * No es un número redondo elegido a ojo: es el punto medio entre las dos
 * familias reales del sistema, con muchísimo margen a los dos lados.
 *
 *   papel   #fdfcff  L 0.985     papel gris  #f3f2f6  L 0.900
 *   tinta   #0b0911  L 0.005     hundida     #040307  L 0.002
 *
 * La superficie clara más apagada está en 0.900 y la oscura más clara en
 * 0.005. Cualquier corte entre las dos sirve; 0.18 deja las dos familias a más
 * de cuatro veces de distancia del umbral y aguanta que se agregue una quinta
 * superficie sin volver a tocarlo.
 */
const UMBRAL_OSCURA = 0.18;

/** Luminancia relativa de un color ya resuelto por el navegador (WCAG 2.x). */
function luminancia(color: string): number {
  const canales = color.match(/[\d.]+/g);
  if (!canales || canales.length < 3) return 0;
  const [r, g, b] = canales.slice(0, 3).map((v) => {
    const x = Number(v) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * El fondo REAL de un elemento, subiendo por sus ancestros.
 *
 * Se pregunta por el color y no por la clase a propósito. El sitio tiene cinco
 * superficies entre las dos familias y va a poder tener otra; leer el color
 * computado significa que agregar una sección con un fondo nuevo no obliga a
 * venir a tocar esta lista. Un fondo transparente no cuenta: se sigue subiendo
 * hasta encontrar uno opaco, que es lo que el ojo ve detrás del riel.
 */
function fondoDe(el: Element): string {
  let n: Element | null = el;
  while (n && n !== document.documentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const p = c.match(/[\d.]+/g);
    if (p && (p.length < 4 || Number(p[3]) > 0.5)) return c;
    n = n.parentElement;
  }
  return "rgb(4, 3, 7)";
}

/**
 * ÍNDICE LATERAL DE SECCIONES.
 *
 * Nueve números al costado izquierdo que dicen en qué sección estás y dejan
 * saltar a cualquier otra. Es la misma lista que el menú del encabezado, así
 * que no agrega ninguna información nueva: agrega ORIENTACIÓN, que es saber
 * cuánto va y cuánto falta sin tener que abrir nada.
 *
 * EL RIEL NO TIENE FONDO PROPIO, Y ESO ES TODO EL PROBLEMA.
 *
 * Se apoya sobre la sección que le toque detrás, y el sitio alterna papel y
 * tinta al bajar. Un color fijo funcionaría en la mitad de la página y sería
 * invisible en la otra mitad. Así que cada número pregunta sobre qué está
 * parado y se pinta con la familia que corresponde.
 *
 * SE MIDE LA CAJA DEL NÚMERO, NO LA DE LA FILA. La fila mide 36 px y el número
 * 12: justo en el límite entre dos secciones, midiendo la fila quedaría medio
 * número de cada lado y el color sería el de ninguno de los dos. Midiendo el
 * número, la franja ambigua es tres veces más angosta.
 *
 * DOS DATOS DISTINTOS SALEN DE LA MISMA MEDICIÓN. La FAMILIA -clara u oscura-
 * decide el color del texto, que tiene un juego de tokens verificado para cada
 * una. El COLOR EXACTO se lo queda la etiqueta del nombre, que lo usa de fondo:
 * con un color fijo, sobre la sección gris la etiqueta se leería como una
 * calcomanía pegada encima en vez de como parte de la misma superficie.
 *
 * LAS BANDAS SE MIDEN UNA SOLA VEZ. Sus posiciones en el documento no cambian
 * al desplazarse, solo al redimensionar. Por cuadro de scroll quedan nueve
 * lecturas de caja y ninguna consulta de estilo computado.
 *
 * SIN JAVASCRIPT NO SE DIBUJA. Es la misma decisión que la maqueta del predio y
 * por el mismo motivo: sin script no hay forma de saber qué hay detrás de cada
 * número, y la mitad de ellos quedaría invisible sobre su propia superficie.
 * No se pierde nada, porque los nueve enlaces ya están en el menú del
 * encabezado, que se sirve desde el servidor y no depende de esto.
 */
export function SectionRail() {
  const [activo, setActivo] = useActiveSection(IDS);
  // El mismo manejador que el menú del encabezado y la barra móvil: salto
  // suave por Lenis, con el offset del encabezado ya resuelto, y `setActivo`
  // adelanta la marca porque el viaje dura 0,8s y si no el número recién se
  // encendería al llegar.
  const alClickAncla = useClickAncla(setActivo);
  const nav = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const cont = nav.current;
    if (!cont) return;

    const marcas = Array.from(cont.querySelectorAll<HTMLElement>("[data-riel-item]"));
    if (marcas.length === 0) return;

    type Banda = { arriba: number; abajo: number; color: string; oscura: boolean };
    let bandas: Banda[] = [];

    const medirBandas = () => {
      const principal = document.querySelector("main");
      const hijos = principal ? Array.from(principal.children) : [];
      bandas = hijos.map((el) => {
        const caja = el.getBoundingClientRect();
        const color = fondoDe(el);
        return {
          arriba: caja.top + window.scrollY,
          abajo: caja.bottom + window.scrollY,
          color,
          oscura: luminancia(color) < UMBRAL_OSCURA,
        };
      });
    };

    const bandaEn = (y: number) => bandas.find((b) => y >= b.arriba && y < b.abajo) ?? null;

    let pendiente = false;

    const pintar = () => {
      pendiente = false;
      for (const marca of marcas) {
        const numero = marca.querySelector(".riel__n") ?? marca;
        const caja = numero.getBoundingClientRect();
        if (caja.height === 0) continue;
        const banda = bandaEn(caja.top + caja.height / 2 + window.scrollY);
        if (!banda) continue;
        marca.dataset.sobre = banda.oscura ? "tinta" : "papel";
        marca.style.setProperty("--superficie", banda.color);
      }
    };

    const programar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    };

    medirBandas();
    pintar();

    addEventListener("scroll", programar, { passive: true });
    const alRedimensionar = () => {
      medirBandas();
      programar();
    };
    addEventListener("resize", alRedimensionar);

    // Las secciones cambian de alto cuando cargan las fuentes propias y cuando
    // se abre un acordeón o una pestaña. Sin esto, las bandas medidas al montar
    // dejan de corresponderse con el documento y los números se pintan con el
    // color de la sección de al lado.
    const observador = new ResizeObserver(alRedimensionar);
    const principal = document.querySelector("main");
    if (principal) observador.observe(principal);

    return () => {
      removeEventListener("scroll", programar);
      removeEventListener("resize", alRedimensionar);
      observador.disconnect();
    };
  }, []);

  const posicionActiva = IDS.findIndex((id) => id === activo);

  return (
    <nav ref={nav} className="riel" aria-label="Índice de secciones">
      <ol>
        {NAV_SECTIONS.map((seccion, i) => {
          const esActiva = seccion.id === activo;
          return (
            <li key={seccion.id} style={{ "--i": i } as React.CSSProperties}>
              <a
                href={`#${seccion.id}`}
                onClick={alClickAncla}
                data-riel-item=""
                data-activo={esActiva ? "" : undefined}
                data-visto={posicionActiva >= 0 && i <= posicionActiva ? "" : undefined}
                aria-current={esActiva ? "true" : undefined}
                // EL NOMBRE ACCESIBLE VA EN `aria-label` Y NO EN EL TEXTO.
                // La etiqueta visible se oculta con `visibility: hidden`, que
                // además de esconderla la saca del árbol de accesibilidad: si
                // el nombre viviera solo ahí, el enlace se anunciaría como
                // "01" y quien navega con lector no tendría a dónde saltar.
                aria-label={seccion.label}
              >
                <span className="riel__tramo" aria-hidden="true" />
                <span className="riel__n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="riel__nombre" aria-hidden="true">
                  {seccion.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
