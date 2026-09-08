import { BRAND_MASK_URL } from "./brand-mark-paths";

/**
 * Fondo morado del loader, con la "J" recortada como VENTANA.
 *
 * El efecto es el de la intro de Los Simpsons: la J no se desvanece, es un
 * agujero en el morado a través del cual se ve el hero. Al crecer el agujero,
 * el morado queda empujado fuera del viewport.
 *
 * POR QUÉ MÁSCARA DE CSS Y NO <mask> DE SVG
 * Con un <mask> SVG habría que animar el contenido de la máscara, lo que
 * obliga al navegador a rerasterizarla a pantalla completa en cada frame. Con
 * `mask-image` el agujero está horneado en la capa y crece por
 * `transform: scale()`, que el compositor resuelve sin repintar.
 *
 * La composición `exclude` (`xor` en el prefijo de WebKit) resta la J del
 * rectángulo: donde la máscara de la J es opaca, el morado se recorta.
 */
export function LoaderBackdrop() {
  return (
    <div
      className="page-loader__backdrop"
      aria-hidden="true"
      style={{ "--l-mascara": BRAND_MASK_URL } as React.CSSProperties}
    />
  );
}
