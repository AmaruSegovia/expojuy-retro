import { BarraMovil } from "./barra-movil";
import { HeaderBarra } from "./header-barra";

/**
 * Navegación principal del sitio, a sangre completa: el tope de 1024px aplica
 * al contenido, no al chrome.
 *
 * Son dos piezas y una sola idea. `HeaderBarra` es la barra fija con su menú a
 * pantalla completa y necesita estado, así que es cliente. `BarraMovil` es
 * marcado estático y se queda del lado del servidor: separarlas mantiene el
 * `"use client"` lo más abajo posible del árbol, que es lo que pide la guía
 * del repositorio.
 *
 * La lista de secciones sale siempre de NAV_SECTIONS, el mismo array que ordena
 * el documento. Un solo origen para el menú, para el encabezado, para la barra
 * móvil y para el pie: no pueden desincronizarse.
 */
export function SiteHeader() {
  return (
    <>
      <HeaderBarra />
      <BarraMovil />
    </>
  );
}
