"use client";

import { useCallback, useState } from "react";
import { useLenis } from "lenis/react";
import { ArrowUp, BellOff, BellRing } from "lucide-react";
import {
  AvisoNotificaciones,
  type VarianteAviso,
} from "@/shared/components/ui/aviso-notificaciones";
import { NAV_SECTIONS } from "@/shared/constants/site";
import { useActiveSection } from "@/shared/hooks/use-active-section";
import { useNotificaciones } from "@/shared/hooks/use-notificaciones";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { activar, desactivar } from "@/shared/lib/push/estado-push";
import { cn } from "@/shared/lib/cn";

const IDS = NAV_SECTIONS.map((seccion) => seccion.id);

/** Desde qué sección aparece cada botón, por posición en NAV_SECTIONS. */
const DESDE_NOTIFICACIONES = IDS.indexOf("sobre");
const DESDE_VOLVER_ARRIBA = IDS.indexOf("agenda");

/** El dibujo común de los botones flotantes. */
const BOTON =
  "grid size-12 place-items-center rounded-full border transition-all duration-control ease-standard";

/**
 * Pila de botones flotantes, abajo a la derecha: volver arriba ENCIMA y
 * notificaciones DEBAJO.
 *
 * POR QUÉ UN SOLO COMPONENTE Y NO DOS
 *
 * Los dos comparten esquina, separación y la misma fuente de visibilidad. Como
 * piezas separadas, cada una tendría que conocer la altura de la otra para no
 * pisarse, y eso es exactamente el tipo de número duplicado que se
 * desincroniza.
 *
 * CUÁNDO APARECE CADA UNO
 *
 * Por sección activa, con el mismo `useActiveSection` que usan el encabezado y
 * la isla móvil:
 *
 *   Inicio            ninguno: el hero ya tiene video, rotador, dos llamadas a
 *                     la acción y la isla; un botón más lo recarga
 *   Sobre ExpoJuy     notificaciones
 *   Agenda en más     los dos
 *
 * EL LUGAR DE VOLVER ARRIBA SE RESERVA AUNQUE ESTÉ OCULTO. Así, cuando aparece,
 * no empuja al de notificaciones: nada cambia de lugar mientras se lee. Si el
 * navegador no tiene notificaciones, su botón no se renderiza y volver arriba
 * baja a la esquina.
 */
export function AccionesFlotantes() {
  const [activo] = useActiveSection(IDS);
  const indice = activo ? IDS.indexOf(activo as (typeof IDS)[number]) : -1;
  const estado = useNotificaciones();

  const lenis = useLenis();
  const reducirMovimiento = usePrefersReducedMotion();

  const verNotificaciones = indice >= DESDE_NOTIFICACIONES;
  const verVolverArriba = indice >= DESDE_VOLVER_ARRIBA;

  return (
    <div
      className={cn(
        // Se apoya arriba de la isla móvil. El alto de la isla no está escrito
        // acá: sale de `--espacio-barra-movil`, que ya incluye su margen y el
        // área segura, y que vale cero desde `lg`, donde la isla no existe.
        "fixed right-5 bottom-[calc(var(--espacio-barra-movil)_+_0.75rem)] z-[85] sm:right-8 lg:bottom-8",
        "flex flex-col items-center gap-3",
        // La pila en sí no captura toques: solo los botones visibles.
        "pointer-events-none",
      )}
    >
      <BotonFlotante visible={verVolverArriba}>
        <button
          type="button"
          onClick={() =>
            // `immediate` respeta la preferencia del sistema: con movimiento
            // reducido el salto es instantáneo en vez de un viaje animado.
            lenis?.scrollTo(0, { immediate: reducirMovimiento, duration: 1.1 })
          }
          className={cn(
            BOTON,
            "border-border-strong bg-surface-overlay/90 text-text backdrop-blur-md",
            "hover:border-primary hover:bg-primary hover:text-on-primary",
          )}
        >
          <ArrowUp size={20} aria-hidden="true" />
          <span className="sr-only">Volver al inicio de la página</span>
        </button>
      </BotonFlotante>

      {/* Mientras carga, o si el navegador no tiene push, no hay botón: no
          hay nada que ofrecer, y un control deshabilitado sin explicación
          confunde más de lo que informa. */}
      {(estado === "apagado" || estado === "encendido" || estado === "bloqueado") && (
        <InterruptorNotificaciones estado={estado} visible={verNotificaciones} />
      )}
    </div>
  );
}

/**
 * Envoltorio que muestra u oculta un botón de la pila.
 *
 * `inert` además de la opacidad: sin eso, el botón invisible seguiría siendo
 * alcanzable con el tabulador y dejaría una parada fantasma.
 */
function BotonFlotante({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={cn(
        "transition-all duration-control ease-standard",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

type Anuncio = "" | "Notificaciones activadas" | "Notificaciones desactivadas";

/**
 * El interruptor de notificaciones.
 *
 * `role="switch"` con `aria-checked`: es un estado que se prende y se apaga,
 * no una acción suelta. EL ESTADO NO DEPENDE DEL COLOR: apagado es la campana
 * tachada, encendido la campana con ondas sobre relleno violeta.
 */
function InterruptorNotificaciones({
  estado,
  visible,
}: {
  estado: "apagado" | "encendido" | "bloqueado";
  visible: boolean;
}) {
  const [aviso, setAviso] = useState<VarianteAviso | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [anuncio, setAnuncio] = useState<Anuncio>("");
  const encendido = estado === "encendido";

  const encender = async () => {
    setOcupado(true);
    try {
      const resultado = await activar();
      // El permiso se concedió pero el servicio push del navegador no dejó
      // suscribir: sin este aviso el botón quedaría apagado sin explicación.
      if (resultado.fallo) setAviso("fallo");
      else if (resultado.estado === "encendido") setAnuncio("Notificaciones activadas");
    } finally {
      setOcupado(false);
    }
  };

  const apagar = async () => {
    setOcupado(true);
    try {
      if ((await desactivar()) === "apagado") setAnuncio("Notificaciones desactivadas");
    } finally {
      setOcupado(false);
    }
  };

  const alTocar = () => {
    if (ocupado) return;
    if (estado === "bloqueado") return setAviso("bloqueadas");
    if (encendido) return void apagar();
    // Con el permiso ya concedido no hay nada que preguntar: dijo que sí antes.
    if (Notification.permission === "granted") return void encender();
    setAviso("pedir");
  };

  const alActivarDesdeAviso = () => {
    setAviso(null);
    void encender();
  };

  const alCerrarAviso = useCallback(() => setAviso(null), []);

  return (
    <>
      <BotonFlotante visible={visible}>
        <button
          type="button"
          role="switch"
          aria-checked={encendido}
          aria-busy={ocupado || undefined}
          onClick={alTocar}
          className={cn(
            BOTON,
            encendido
              ? "border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover"
              : "border-border-strong bg-surface-overlay/90 text-text backdrop-blur-md hover:border-link hover:text-link",
            ocupado && "cursor-progress",
          )}
        >
          {encendido ? (
            <BellRing size={20} aria-hidden="true" />
          ) : (
            <BellOff size={20} aria-hidden="true" />
          )}
          <span className="sr-only">
            Notificaciones{estado === "bloqueado" ? ", bloqueadas en el navegador" : ""}
          </span>
        </button>
      </BotonFlotante>

      {/* FUERA del envoltorio que se oculta, a propósito: con `inert` en un
          ancestro, el anuncio no se leería y el diálogo quedaría inerte.

          Anuncia el resultado de la acción, no el estado de cada render: un
          lector de pantalla no tiene por qué oír "desactivadas" al cargar. */}
      <p role="status" className="sr-only">
        {anuncio}
      </p>

      <AvisoNotificaciones
        variante={aviso}
        onActivar={alActivarDesdeAviso}
        onCerrar={alCerrarAviso}
      />
    </>
  );
}
