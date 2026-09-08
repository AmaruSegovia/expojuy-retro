import { BrandMark } from "@/shared/components/brand/brand-mark";
import { CONTACTO, NAV_SECTIONS, SITE, SOCIAL_LINKS } from "@/shared/constants/site";

/**
 * Objetivo táctil de cada enlace del pie. `py-1` lo lleva a 24px de alto: en
 * una lista de enlaces no aplica la excepción de texto en línea de WCAG 2.5.8.
 * El subrayado que aparece al pasar por encima es el indicador no cromático.
 */
const ENLACE =
  "inline-block border-b border-transparent py-1 text-sm text-text-muted transition-colors duration-micro hover:border-accent hover:text-text";

/**
 * Pie de página a sangre completa, revelado por debajo del contenido.
 *
 * CÓMO FUNCIONA EL REVELADO (efecto heredado, cero JavaScript)
 *
 * El pie queda `sticky` contra el BORDE INFERIOR del viewport durante toda la
 * página. Ahí no se ve, porque `<main>` lleva fondo opaco y va en `relative
 * z-[1]`, así que le pasa por encima. Al llegar al final del documento el borde
 * inferior de `main` sube y lo va destapando: la última sección se corre como
 * una carta que se levanta y abajo estaba el pie.
 *
 * El pie sigue ocupando su lugar en el flujo, así que no hace falta reservarle
 * altura ni conocerla: el recorrido del efecto es exactamente su propio alto, a
 * cualquier viewport. Cero números mágicos.
 *
 * ATENCION: TRES ACOPLAMIENTOS QUE NO SE PUEDEN ROMPER:
 *
 * 1. `<main>` DEBE tener fondo opaco Y `relative z-[1]`. El fondo es lo único
 *    que tapa al pie, y el z-index es lo que pone a main por encima.
 *
 *    ATENCION: HUNDIR EL PIE NO ES EQUIVALENTE A SUBIR MAIN. La primera versión
 *    usaba `z-index: -10` en el pie y se veía idéntica, pero SUS ENLACES NO
 *    RECIBÍAN CLICKS: un elemento con z-index negativo se pinta antes que la
 *    caja del `<body>`, que no tapa nada a la vista -su fondo se propaga al
 *    canvas- pero igual gana el hit-test. Medido: `elementFromPoint` sobre el
 *    centro de un enlace devolvía BODY. Para tapar hay que SUBIR el de arriba,
 *    nunca hundir el de abajo.
 * 2. Ningún ancestro puede llevar `overflow` distinto de `visible`. Un
 *    `overflow: hidden` en `html` o `body` desactiva `position: sticky` sin
 *    decir nada.
 * 3. EL PIE TIENE QUE ENTRAR EN UNA PANTALLA. `bottom: 0` lo ancla por abajo;
 *    si es más alto que el viewport, su tope queda arriba del borde superior y
 *    no hay forma de llegar. Por eso el contenido va en dos columnas desde el
 *    teléfono y el relleno se suelta recién en `lg`. La red de seguridad son
 *    los dos umbrales de `.footer-revelado` en globals.css, medidos: peor caso
 *    762px apilado y 604px en fila. Si el pie crece, hay que volver a medir y
 *    mover esos umbrales. A ese presupuesto entra también el colchón para la
 *    barra móvil que agrega `.pie-sitio` en layout.css.
 *
 * DE DÓNDE SALE LA COMPOSICIÓN
 *
 * Del pie de Maru: franja turquesa arriba, columna de marca más ancha, grupos
 * de enlaces con rótulo, un `<address>` con los datos del evento y una línea
 * legal partida en dos. Los colores están traducidos a los tokens del sistema:
 * su turquesa es `accent`, su tinta es `surface-overlay`.
 *
 * POR QUÉ EL ISOLOGOTIPO Y NO EL LOGOTIPO COMPLETO
 *
 * El wordmark oficial es gris grafito (#4b4b4d): sobre esta superficie da
 * 1,3:1 y es ilegible. Por eso acá va el isologotipo -la "J", cuyos cuatro
 * bloques son colores vivos- y el nombre compuesto en tipografía. El kit
 * entregado no incluye una versión en negativo del logotipo completo.
 */
export function SiteFooter() {
  const año = new Date().getFullYear();

  return (
    <footer className="pie-sitio footer-revelado border-t-2 border-accent bg-surface-overlay">
      {/* El relleno se suelta recién en `lg`, que es donde la fila se arma en
          horizontal y el pie se achica solo. Atarlo a `sm` era peor que no
          tocarlo: entre 640 y 1023px el relleno ya había crecido pero el
          contenido seguía apilado, y ahí el pie trepaba a 861px, más alto que
          en un teléfono. El peor caso de una medida responsive no está en el
          extremo angosto sino en la franja del medio. */}
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-10 sm:px-10 lg:py-16">
        {/* DOS COLUMNAS SIEMPRE, también en el teléfono. Apiladas, las nueve
            secciones más los datos del evento y las redes se iban a más de
            1000px contra 870 de viewport: anclado abajo, el tope del pie
            quedaba fuera de alcance para siempre. Que el pie entre en una
            pantalla no es una preferencia estética, es la condición del
            efecto. La marca ocupa las dos columnas arriba y a partir de `lg`
            pasa a ser la primera de tres, más ancha que las otras. */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[1.4fr_1fr_1.2fr] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <BrandMark className="h-12 w-auto" title={`Isologotipo de ${SITE.name}`} />
            <p className="mt-4 text-sm font-bold tracking-[0.14em] text-text uppercase">
              {SITE.name}
            </p>
            <p className="mt-1 max-w-[24ch] text-sm text-balance text-text-muted">{SITE.claim}</p>
          </div>

          <nav aria-labelledby="pie-secciones">
            <h2
              id="pie-secciones"
              className="text-xs font-semibold tracking-[0.18em] text-accent uppercase"
            >
              Secciones
            </h2>
            <ul className="mt-3">
              {NAV_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={ENLACE}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              Dónde y cuándo
            </h2>
            {/* `not-italic` porque el navegador pone <address> en cursiva por
                omisión y acá es un bloque de datos, no una cita. */}
            <address className="mt-3 grid gap-1 text-sm text-text-muted not-italic">
              <span>{SITE.venue}</span>
              <span className="font-semibold text-accent">{SITE.dates.label}</span>
              <span>
                <a href={`mailto:${CONTACTO.email}`} className={ENLACE}>
                  {CONTACTO.email}
                </a>
              </span>
              <span>
                {/* `tel:` no admite los separadores que el número necesita
                    para leerse, por eso el href sale de otro campo. */}
                <a href={`tel:${CONTACTO.telefonoHref}`} className={ENLACE}>
                  {CONTACTO.telefono}
                </a>
              </span>
            </address>

            <h2
              id="pie-redes"
              className="mt-6 text-xs font-semibold tracking-[0.18em] text-accent uppercase"
            >
              Redes
            </h2>
            <ul aria-labelledby="pie-redes" className="mt-2 flex flex-wrap gap-x-5">
              {SOCIAL_LINKS.map((r) => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    // `noopener` evita que la pestaña destino pueda tocar
                    // window.opener; `noreferrer` no filtra de dónde vino.
                    rel="noopener noreferrer"
                    target="_blank"
                    className={ENLACE}
                  >
                    {r.label}
                    <span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-border pt-6 text-xs text-text-subtle lg:mt-12 lg:pt-8">
          <p className="max-w-[60ch]">
            Organiza {SITE.organizer}. Prototipo desarrollado para la Primera Edición del Programa
            Provincial de Desafíos Tecnológicos.
          </p>
          <p>
            © {año} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
