/**
 * TRAMA MODULAR - portada de `TramaModular.astro`, variante `b`.
 *
 * Lenguaje gráfico propio del prototipo de Maru, derivado de la construcción
 * del isologotipo oficial: rectángulos de canto vivo apoyados sobre una grilla,
 * más una panza semicircular, la de la J. No reproduce el logo, usa su
 * gramática. Cumple dos funciones a la vez: da material visual sin depender de
 * fotografías, que el kit no incluye, y refuerza la idea de "módulos que se
 * conectan", que es literalmente el lema del evento.
 *
 * SE TRAJO UNA SOLA VARIANTE Y YA RESUELTA. El componente de origen genera los
 * contornos con una función sobre una grilla de 6 x 8 y admite tres
 * composiciones; acá se usa una sola, así que el generador sería un motor para
 * un único resultado fijo. Los seis contornos son los que esa función devuelve
 * para la variante `b` con unidad de grilla 16 y aire de 2: seis columnas por
 * siete filas, de ahí el `viewBox`.
 *
 * TAMPOCO SE TRAJO LA ENTRADA SEDIMENTARIA. El propio origen la reserva para
 * tramas visibles al cargar, y esta vive al pie de la columna de contacto,
 * bien debajo del pliegue: terminaría de animarse antes de que nadie la vea.
 *
 * Es decorativa: va con `aria-hidden` y no aporta información.
 */
export function TramaModular({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 112"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Los cuatro colores son los de la marca, tomados por su token: la trama
          es una pieza de identidad, no un elemento de interfaz, así que usa los
          tokens de marca y no los de rol (accion, enlace, dato). */}
      <path d="M0 0h46v30h-46z" className="fill-brand-violet-deep" />
      <path d="M48 0h46v46h-46z" className="fill-brand-cyan" />
      <path d="M0 32h46v46h-46z" className="fill-brand-violet" />
      <path d="M48 48h46v30h-46z" className="fill-brand-lavender" />
      {/* La panza: el lado inferior se cierra en semicírculo exacto, con radio
          igual a la mitad del ancho del módulo. Una sola por composición. */}
      <path d="M0 80h46v7a23 23 0 0 1 -46 0z" className="fill-brand-lavender" />
      <path d="M48 80h46v30h-46z" className="fill-brand-cyan" />
    </svg>
  );
}
