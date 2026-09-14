"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { BellRing } from "lucide-react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { cn } from "@/shared/lib/cn";

/**
 *   pedir       el aviso previo, con "Ahora no" y "Activar"
 *   bloqueadas  el permiso está denegado y el sitio ya no puede preguntar
 *   fallo       el permiso está, pero el servicio push del navegador no dejó
 *               suscribir (pasa, por ejemplo, en Brave)
 */
export type VarianteAviso = "pedir" | "bloqueadas" | "fallo";

const TEXTOS: Record<VarianteAviso, { titulo: string; descripcion: string }> = {
  pedir: {
    titulo: "Activá las notificaciones",
    descripcion: "No te pierdas las novedades y eventos más importantes.",
  },
  bloqueadas: {
    titulo: "Las notificaciones están bloqueadas",
    descripcion: "Habilitalas desde la configuración del sitio en tu navegador y volvé a intentar.",
  },
  fallo: {
    titulo: "No se pudieron activar las notificaciones",
    descripcion:
      "El servicio de notificaciones de este navegador no respondió. Probá más tarde o desde otro navegador.",
  },
};

type AvisoNotificacionesProps = {
  /** Qué aviso mostrar, o null si está cerrado. */
  variante: VarianteAviso | null;
  onActivar: () => void;
  onCerrar: () => void;
};

/**
 * AVISO PREVIO al pedido de permiso del navegador.
 *
 * NO ES UN PASO DE MÁS. Si el navegador muestra su propio pedido y la persona
 * lo rechaza, el sitio no puede volver a preguntar nunca: el permiso queda
 * denegado hasta que alguien lo cambie a mano en los ajustes. Este aviso se
 * puede descartar sin quemar nada, y el pedido real sale recién cuando la
 * persona ya dijo que sí.
 *
 * `<dialog>` NATIVO, por lo mismo que el diálogo de pago: `showModal()` resuelve
 * el foco al entrar y su vuelta al botón que lo abrió, la inertización del
 * resto, Escape y el fondo. Lo único a mano es frenar a Lenis, que escucha la
 * rueda sobre `window` y desplazaría la página por debajo.
 *
 * El foco entra en "Ahora no", que es el primer botón: en un pedido de
 * permiso, un Enter apurado no puede activar nada.
 */
export function AvisoNotificaciones({ variante, onActivar, onCerrar }: AvisoNotificacionesProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lenis = useLenis();
  // Conserva la última variante mientras el diálogo se cierra, así no cambia de
  // contenido durante la transición de salida. Se ajusta durante el render,
  // como la casilla de la isla móvil: sin efecto y sin render en cascada.
  const [ultima, setUltima] = useState<VarianteAviso>("pedir");
  if (variante && variante !== ultima) setUltima(variante);
  const actual = variante ?? ultima;
  const textos = TEXTOS[actual];

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (variante && !dialogo.open) {
      dialogo.showModal();
      lenis?.stop();
    } else if (!variante && dialogo.open) {
      dialogo.close();
    }
  }, [variante, lenis]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    // `close` cubre los tres caminos: los botones, Escape y el click afuera.
    const alCerrar = () => {
      lenis?.start();
      onCerrar();
    };
    dialogo.addEventListener("close", alCerrar);
    return () => dialogo.removeEventListener("close", alCerrar);
  }, [lenis, onCerrar]);

  const esPedido = actual === "pedir";

  return (
    <dialog
      ref={ref}
      aria-labelledby="aviso-notificaciones-titulo"
      aria-describedby="aviso-notificaciones-desc"
      // El objetivo del click es el propio <dialog> solo cuando se toca el
      // fondo: el contenido vive en el hijo.
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="aviso-notificaciones"
    >
      <div className="flex gap-4 p-5 sm:p-6">
        <BrandMark className="h-12 w-auto shrink-0" />
        <div className="min-w-0">
          <h2 id="aviso-notificaciones-titulo" className="text-base font-bold text-text">
            {textos.titulo}
          </h2>
          <p id="aviso-notificaciones-desc" className="mt-1 text-sm text-pretty text-text-muted">
            {textos.descripcion}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className={cn(
            "min-h-11 rounded-full px-5 text-sm font-semibold",
            "transition-colors duration-micro ease-standard",
            esPedido
              ? "text-text-muted hover:text-text"
              : "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
          )}
        >
          {esPedido ? "Ahora no" : "Entendido"}
        </button>
        {esPedido && (
          <button
            type="button"
            onClick={onActivar}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary",
              "transition-colors duration-micro ease-standard",
              "hover:bg-primary-hover active:bg-primary-active",
            )}
          >
            <BellRing size={16} aria-hidden="true" />
            Activar
          </button>
        )}
      </div>
    </dialog>
  );
}
