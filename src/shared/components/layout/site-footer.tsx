import { BrandMark } from "@/shared/components/brand/brand-mark";
import { NAV_SECTIONS, SITE, SOCIAL_LINKS } from "@/shared/constants/site";

/**
 * Pie de página a sangre completa, revelado por debajo del contenido.
 *
 * CÓMO FUNCIONA. El footer queda `sticky` contra el BORDE INFERIOR del
 * viewport durante toda la página. Ahí no se ve, porque `<main>` lleva fondo
 * opaco y va en `relative z-[1]`, así que le pasa por encima. Al llegar al
 * final del documento el borde inferior de `main` sube y lo va destapando: la
 * última sección se corre como una carta que se levanta y abajo estaba el
 * footer.
 *
 * El footer sigue ocupando su lugar en el flujo, así que no hace falta
 * reservarle altura ni conocerla: el recorrido del efecto es exactamente su
 * propio alto, a cualquier viewport. Cero JavaScript y cero números mágicos.
 *
 * ⚠️ TRES ACOPLAMIENTOS QUE NO SE PUEDEN ROMPER:
 *
 * 1. `<main>` DEBE tener fondo opaco Y `relative z-[1]`. El fondo es lo único
 *    que tapa al footer, y el z-index es lo que pone a main por encima. Si
 *    `main` queda transparente, el footer se ve asomando todo el tiempo; si
 *    pierde el z-index, deja de taparlo.
 *
 *    ⚠️ HUNDIR EL FOOTER NO ES EQUIVALENTE A SUBIR MAIN. La primera versión
 *    usaba `z-index: -10` en el footer y se veía idéntica, pero SUS ENLACES NO
 *    RECIBÍAN CLICKS: un elemento con z-index negativo se pinta antes que la
 *    caja del `<body>`, que no tapa nada a la vista —su fondo se propaga al
 *    canvas— pero igual gana el hit-test. Medido: `elementFromPoint` sobre el
 *    centro de un enlace devolvía BODY. En móvil no se notaba porque ahí la
 *    posición está apagada y el footer vuelve al flujo normal.
 * 2. Ningún ancestro puede llevar `overflow` distinto de `visible`. Un
 *    `overflow: hidden` en `html` o `body` desactiva `position: sticky` sin
 *    decir nada.
 * 3. EL FOOTER TIENE QUE ENTRAR EN UNA PANTALLA. `bottom: 0` lo ancla por
 *    abajo; si es más alto que el viewport, su tope queda arriba del borde
 *    superior y no hay forma de llegar, porque su lugar natural ya es el final
 *    del documento y nunca se despega. De ahí que el contenido vaya en dos
 *    columnas desde el teléfono y que el relleno se suelte recién en `lg`. La
 *    red de seguridad son los dos umbrales de `.footer-revelado` en
 *    globals.css: si el viewport no da, el footer queda estático y se pierde
 *    el efecto, nunca el contenido. Si algún día el footer crece, hay que
 *    volver a medirlo y mover esos umbrales.
 *
 * POR QUÉ NO AL REVÉS. Antes esto se intentaba con la última sección fijada y
 * el footer subiendo a taparla, y no funcionaba: el envoltorio medía
 * exactamente lo mismo que su hijo `sticky`, así que el rango de
 * desplazamiento era CERO y el hijo nunca se despegaba del flujo. Pero
 * arreglarlo no alcanzaba. Medido a 1440×900 con el envoltorio ya corregido:
 * la sección se fija con su tope en 0 y mide 1177px contra 900 de viewport, o
 * sea que se fija ANTES de que se la pueda recorrer y sus últimos 277px no se
 * alcanzan nunca; encima el footer entra por abajo y tapa justo esa zona. Esa
 * dirección solo es sana si la última sección entra en una pantalla, y un
 * formulario no entra. Esta la invierte y no depende del alto de nada.
 */
export function SiteFooter() {
  const año = new Date().getFullYear();

  return (
    <footer className="footer-revelado border-t border-border bg-surface-overlay">
      {/* El relleno se suelta recién en `lg`, que es donde la fila se arma en
          horizontal y el footer se achica solo. Atarlo a `sm` era peor que no
          tocarlo: entre 640 y 1023px el relleno ya había crecido pero el
          contenido seguía apilado, y ahí el footer trepaba a 861px —más alto
          que en un teléfono—. El peor caso de esta medida no está en el
          extremo angosto sino en el medio. */}
      <div className="mx-auto max-w-[var(--container-wide)] px-5 py-10 sm:px-10 lg:py-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
          <div className="max-w-sm">
            <BrandMark className="h-12 w-auto" title={`Isologotipo de ${SITE.name}`} />
            <p className="mt-6 text-lg font-semibold text-balance text-text">{SITE.claim}</p>
            <p className="mt-2 text-sm text-text-muted">
              {SITE.dates.label} · {SITE.venue}
            </p>
            <p className="mt-4 text-sm text-text-subtle">Organiza {SITE.organizer}</p>
          </div>

          {/* Dos columnas SIEMPRE, también en el teléfono. Apiladas, las nueve
              secciones más las cuatro redes son trece renglones y el footer se
              iba a 1061px contra 870 de viewport: anclado abajo, su tope
              quedaba fuera de alcance para siempre. Que el footer entre en una
              pantalla no es una preferencia estética, es la condición del
              efecto. Ver el comentario de arriba. */}
          <div className="grid grid-cols-2 gap-8 sm:gap-10">
            <nav aria-labelledby="footer-secciones">
              <h2
                id="footer-secciones"
                className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase"
              >
                Secciones
              </h2>
              <ul className="mt-4 space-y-2">
                {NAV_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm text-text-muted transition-colors duration-micro hover:text-link"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-redes">
              <h2
                id="footer-redes"
                className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase"
              >
                Redes
              </h2>
              <ul className="mt-4 space-y-2">
                {SOCIAL_LINKS.map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      // `noopener` evita que la pestaña destino pueda tocar
                      // window.opener; `noreferrer` no filtra de dónde vino.
                      rel="noopener noreferrer"
                      target="_blank"
                      className="text-sm text-text-muted transition-colors duration-micro hover:text-link"
                    >
                      {r.label}
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-text-subtle lg:mt-16 lg:pt-8">
          <p>
            © {año} {SITE.organizer}. Prototipo desarrollado para la Primera Edición del Programa
            Provincial de Desafíos Tecnológicos.
          </p>
        </div>
      </div>
    </footer>
  );
}
