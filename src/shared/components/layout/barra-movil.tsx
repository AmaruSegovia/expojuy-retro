"use client";

import { useState, type CSSProperties } from "react";
import { CalendarDays, Map as Plano, Ticket, type LucideIcon } from "lucide-react";
import { NAV_SECTIONS, type NavSectionId } from "@/shared/constants/site";
import { useActiveSection } from "@/shared/hooks/use-active-section";
import { useClickAncla } from "@/shared/hooks/use-click-ancla";

type Acceso = {
  id: NavSectionId;
  Icono: LucideIcon;
  /** Va al centro, elevado sobre el borde de la isla. Uno solo, y del medio. */
  destacado?: true;
};

/**
 * Tres accesos: qué pasa, cómo entro, dónde queda. Ninguno más.
 *
 * EL ORDEN NO ES EL DEL DOCUMENTO, Y ES A PROPÓSITO. En NAV_SECTIONS Mapa va
 * antes que Entradas; acá va después, porque el que manda en una barra de
 * pulgar es el CENTRO y ese lugar es de Entradas. Los otros dos flanquean.
 *
 * SOLO LOS IDS Y EL ÍCONO. La etiqueta se busca en NAV_SECTIONS, que es la
 * fuente única: si alguien renombra una sección, esta barra la sigue sola. El
 * tipo `NavSectionId` hace que un id inventado no compile.
 *
 * CRITERIO DE REMATE DE LOS ÍCONOS. Los tres sets de origen convivían con tres
 * criterios distintos: `round` con ancho 2, `butt` más `miter` con ancho 2, y
 * `square` con ancho 1,6. Acá se unifica en UNO: el de lucide-react, que es
 * `round` en punta y unión con ancho 2 sobre un lienzo de 24. Se eligió ese y
 * no otro porque es el de la biblioteca que ya usa el sitio, así que es el
 * único que no hay que configurar en cada ícono ni recordar al agregar el
 * siguiente.
 */
const ACCESOS: readonly Acceso[] = [
  { id: "agenda", Icono: CalendarDays },
  { id: "entradas", Icono: Ticket, destacado: true },
  { id: "mapa", Icono: Plano },
];

/**
 * Se observan LAS NUEVE SECCIONES, no las tres de la barra, y eso no es un
 * descuido.
 *
 * Observando solo las tres, `useActiveSection` nunca se entera de que saliste:
 * se queda con la última que cruzaste y la píldora sigue marcando Entradas
 * mientras estás leyendo Expositores. Peor todavía, `aria-current="location"`
 * pasa a mentirle a un lector de pantalla sobre dónde está parado.
 *
 * Con las nueve, la sección activa siempre es la de verdad, y la barra decide
 * aparte si esa sección es una de las suyas. El costo es un IntersectionObserver
 * con nueve objetivos y una franja de alto cero, sin escuchar el scroll.
 *
 * Módulo y no `useMemo`: es constante.
 */
const IDS = NAV_SECTIONS.map((seccion) => seccion.id);

const etiquetaDe = (id: NavSectionId) => NAV_SECTIONS.find((s) => s.id === id)?.label ?? id;

/**
 * Isla flotante de accesos rápidos, solo por debajo de 64rem. De ahí para
 * arriba la navegación completa ya está en el encabezado y esta barra sería
 * ruido.
 *
 * POR QUÉ AHORA ES COMPONENTE CLIENTE, DESPUÉS DE HABER SIDO SERVIDOR
 *
 * La versión anterior era marcado estático con cero JavaScript, y esa era su
 * mejor propiedad. La perdió por una razón concreta y no por comodidad: el
 * indicador que se desliza necesita saber QUÉ SECCIÓN SE ESTÁ MIRANDO, y eso
 * solo lo sabe un IntersectionObserver. Lo que se gana a cambio es que la
 * barra deja de ser solo un acceso y pasa a decir dónde estás.
 *
 * El costo real es chico: `useActiveSection` no escucha el scroll, observa con
 * una franja de alto cero en el medio del viewport. Y `useClickAncla` y Lenis
 * ya estaban en el bundle por el encabezado, así que lo único nuevo es este
 * componente.
 *
 * OBSERVA POR SU CUENTA EN VEZ DE COMPARTIR EL ESTADO DEL ENCABEZADO. Sí, eso
 * duplica el observador: el encabezado ya mira las mismas nueve secciones.
 * Compartirlo obligaría a hacer cliente a `SiteHeader`, que hoy es composición
 * pura, solo para bajar una prop, y acoplaría dos piezas que a propósito no se
 * conocen. Un IntersectionObserver con `threshold: 0` lo resuelve el navegador
 * de forma nativa y no justifica ese acoplamiento.
 *
 * MEJORA PROGRESIVA. Sin JavaScript el HTML igual se sirve completo: las tres
 * anclas funcionan con el salto nativo, que respeta `scroll-margin-top`, y el
 * indicador simplemente no aparece porque nunca hay sección activa. Lo que se
 * pierde es la marca de posición, no el acceso.
 *
 * EL TEXTO VA SIEMPRE ESCRITO DEBAJO DEL ÍCONO. Un ícono solo no alcanza para
 * nombrar un destino. Las etiquetas salen tal cual de NAV_SECTIONS, en caja de
 * oración, que es la misma que usa el encabezado para las mismas etiquetas.
 */
export function BarraMovil() {
  const [activo, setActivo] = useActiveSection(IDS);

  // Adelanta la marca al click: el scroll suave tarda ~0,8s en llegar y sin
  // esto el indicador saldría recién al final del viaje.
  const alClickAncla = useClickAncla(setActivo);

  const indice = ACCESOS.findIndex((acceso) => acceso.id === activo);
  const enLaBarra = indice >= 0;

  // LA PÍLDORA CONSERVA SU CASILLA MIENTRAS ESTÁ OCULTA. Sin esto, al salir de
  // las tres secciones el índice caería a cero y la píldora se iría deslizando
  // hacia Agenda mientras se desvanece, que se lee como "volviste al
  // principio". Guardando la última casilla válida, se desvanece en el lugar y
  // vuelve a aparecer donde corresponde.
  //
  // SE AJUSTA DURANTE EL RENDER, NO EN UN EFECTO. React vuelve a ejecutar el
  // componente en el acto y descarta la salida anterior sin haberla pintado,
  // así que no hay cuadro intermedio ni el segundo render en cascada que
  // provoca un `setState` dentro de un efecto. El lint del repositorio rechaza
  // esa segunda forma, y hace bien.
  const [casilla, setCasilla] = useState(0);
  if (enLaBarra && casilla !== indice) setCasilla(indice);

  return (
    <nav className="barra-movil" aria-label="Accesos rápidos">
      <div
        className="barra-movil__isla"
        // El indicador se posiciona por índice de casilla, no por píxeles
        // medidos: la casilla mide un tercio de la isla a cualquier ancho, así
        // que `translate: calc(var(--indice) * 100%)` cae siempre justo y no
        // hace falta leer el DOM ni recalcular al rotar el teléfono.
        style={{ "--indice": casilla } as CSSProperties}
        data-activo={enLaBarra ? "" : undefined}
      >
        {/* Decorativo: el estado ya lo dice `aria-current` en el ancla. */}
        <span className="barra-movil__indicador" aria-hidden="true" />

        <ul>
          {ACCESOS.map(({ id, Icono, destacado }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={alClickAncla}
                className={destacado ? "barra-movil__destacado" : undefined}
                // `location` es el valor de aria-current para "dónde estoy
                // dentro de este documento".
                aria-current={activo === id ? "location" : undefined}
              >
                {destacado ? (
                  <span className="barra-movil__disco">
                    <Icono size={24} aria-hidden="true" />
                  </span>
                ) : (
                  <Icono size={20} aria-hidden="true" />
                )}
                <span className="barra-movil__rotulo">{etiquetaDe(id)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
