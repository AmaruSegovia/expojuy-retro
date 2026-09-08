import { CalendarDays, Store, Ticket, type LucideIcon } from "lucide-react";
import { NAV_SECTIONS, type NavSectionId } from "@/shared/constants/site";

/**
 * Los tres accesos que alguien parado en el predio, con una mano libre,
 * necesita: qué pasa ahora, quién está, cómo entro. Ninguno más.
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
 * siguiente. Los tres trazados dibujados a mano del origen no hicieron falta:
 * calendario, tienda y ticket existen en Lucide con la misma lectura.
 */
const ACCESOS = [
  { id: "agenda", Icono: CalendarDays },
  { id: "expositores", Icono: Store },
  { id: "entradas", Icono: Ticket },
] as const satisfies readonly { id: NavSectionId; Icono: LucideIcon }[];

const etiquetaDe = (id: NavSectionId) => NAV_SECTIONS.find((s) => s.id === id)?.label ?? id;

/**
 * Barra fija de accesos rápidos, solo por debajo de 64rem. De ahí para arriba
 * la navegación completa ya está en el encabezado y esta barra sería ruido.
 *
 * Es marcado estático: sin estado, sin efectos y sin eventos, así que queda
 * como Server Component y no suma nada al bundle del cliente. Tampoco marca
 * la sección actual a propósito: es un acceso, no un indicador de posición
 * -para eso está el encabezado- y saberlo obligaría a hacerla cliente.
 *
 * Sus enlaces son anclas nativas: el salto es instantáneo en vez de suave, que
 * es el precio de que esta barra no cargue nada de JavaScript. El destino es
 * el mismo que el del resto, porque `scroll-margin-top` lo respeta también el
 * navegador.
 *
 * El texto va SIEMPRE escrito debajo del ícono. Un ícono solo no alcanza para
 * nombrar un destino.
 */
export function BarraMovil() {
  return (
    <nav className="barra-movil" aria-label="Accesos rápidos">
      <ul>
        {ACCESOS.map(({ id, Icono }) => (
          <li key={id}>
            <a href={`#${id}`}>
              <Icono size={20} aria-hidden="true" />
              {/* Interletrado corto a propósito: con el de los rótulos del
                  sistema, "Expositores" en mayúsculas no entra en una celda de
                  106px, que es lo que queda en un teléfono de 320px. */}
              <span className="text-center text-xs leading-none font-semibold tracking-[0.06em] uppercase">
                {etiquetaDe(id)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
