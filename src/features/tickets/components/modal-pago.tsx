"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { Check, LoaderCircle } from "lucide-react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { useNotificaciones } from "@/shared/hooks/use-notificaciones";
import { enviarNotificacionCompra } from "@/shared/lib/push/enviar-notificacion";
import { desactivar, suscripcionActual } from "@/shared/lib/push/estado-push";
import { cn } from "@/shared/lib/cn";
import { METODOS_EJEMPLO, type TipoEntrada } from "../constants/entradas";

/** Cuánto dura el "Comprando…" simulado. */
const COMPRANDO_MS = 1500;
/** Cuánto se muestra el check en el botón antes de la confirmación. */
const COMPRADO_MS = 600;
/**
 * Espera antes de enviar la notificación. Sin ella la push puede llegar antes
 * de que la persona haya leído la confirmación que la anuncia.
 */
const ESPERA_NOTIFICACION_MS = 2000;

type Fase = "eligiendo" | "comprando" | "comprado" | "confirmado";

/**
 * Programa el envío FUERA del ciclo de vida del modal, a propósito: si la
 * persona cierra el modal apenas ve la confirmación, la compra ya ocurrió y la
 * notificación tiene que llegar igual. Un temporizador del componente se
 * cancelaría al desmontarse.
 */
function programarNotificacion() {
  setTimeout(async () => {
    const suscripcion = await suscripcionActual();
    if (!suscripcion) return;
    const resultado = await enviarNotificacionCompra(suscripcion);
    // El servicio push ya no la reconoce: se da de baja y el botón flotante se
    // reconcilia solo, en vez de seguir mostrando "encendido".
    if (resultado.estado === "vencida") await desactivar();
  }, ESPERA_NOTIFICACION_MS);
}

/**
 * MODAL DE PAGO - compra de demostración.
 *
 * NO PIDE NINGÚN DATO DE PAGO. Se elige un método, no se carga una tarjeta: un
 * formulario falso que acepte un número y responda "listo" es la clase de
 * maqueta que se confunde con la realidad, y entrenaría a alguien a tipear una
 * tarjeta en un sitio que no la procesa. El recuadro de abajo lo sigue diciendo.
 *
 * LA COMPRA ES UNA SECUENCIA DE FASES: eligiendo → comprando → comprado →
 * confirmado. Al confirmar, si las notificaciones del dispositivo están
 * activas, a los dos segundos llega la push con el acceso a la entrada digital.
 *
 * POR QUÉ `<dialog>` NATIVO Y NO UN DIV CON POSITION FIXED
 *
 * `showModal()` trae resuelto, del navegador, todo lo que un modal a mano
 * suele hacer mal: el foco entra al abrir y VUELVE SOLO al botón que lo abrió
 * al cerrar, el resto de la página queda inerte, Escape cierra, y el fondo se
 * pinta con `::backdrop` sin agregar un elemento.
 *
 * LO ÚNICO QUE HAY QUE HACER A MANO ES FRENAR A LENIS. El scroll suave escucha
 * `wheel` sobre `window`, y la capa superior del diálogo no le impide recibir
 * el evento: sin `lenis.stop()` la página de atrás se desplaza debajo del
 * modal. Se reanuda en el evento `close`, que dispara tanto si cierra el botón
 * como si cierra Escape, así que no hay dos caminos que mantener.
 *
 * El componente se monta con `key` por tipo de entrada: cada apertura arranca
 * de cero, sin un efecto que tenga que resetear el estado.
 */
export function ModalPago({ tipo, onCerrar }: { tipo: TipoEntrada | null; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lenis = useLenis();
  const notificaciones = useNotificaciones();

  const [metodo, setMetodo] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("eligiendo");

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    if (tipo && !dialogo.open) {
      dialogo.showModal();
      lenis?.stop();
    } else if (!tipo && dialogo.open) {
      dialogo.close();
    }
  }, [tipo, lenis]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    // `close` cubre los tres caminos -botón, Escape y click en el fondo-, así
    // que reanudar el scroll y avisar hacia arriba se escribe una sola vez.
    const alCerrar = () => {
      lenis?.start();
      onCerrar();
    };
    dialogo.addEventListener("close", alCerrar);
    return () => dialogo.removeEventListener("close", alCerrar);
  }, [lenis, onCerrar]);

  // Si el modal se cierra a mitad de la compra, la compra no ocurrió: se
  // cancelan las fases pendientes. La notificación ya programada no depende de
  // esto, ver `programarNotificacion`.
  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  // Al confirmar desaparece el botón "Comprar", que tenía el foco. Sin mover
  // el foco, quedaría en el <body> del diálogo; "Cerrar" es lo único que queda
  // por hacer.
  useEffect(() => {
    if (fase === "confirmado") cerrar.current?.focus();
  }, [fase]);

  const comprar = () => {
    if (!metodo || fase !== "eligiendo") return;
    setFase("comprando");
    temporizadores.current.push(
      setTimeout(() => {
        setFase("comprado");
        temporizadores.current.push(
          setTimeout(() => {
            setFase("confirmado");
            programarNotificacion();
          }, COMPRADO_MS),
        );
      }, COMPRANDO_MS),
    );
  };

  const procesando = fase === "comprando" || fase === "comprado";

  return (
    <dialog
      ref={ref}
      aria-labelledby="pago-titulo"
      aria-describedby="pago-desc"
      // Al hacer click en el fondo, el objetivo del evento es el propio
      // <dialog>: el contenido está en el hijo, así que si el objetivo es este
      // elemento, el click fue afuera.
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="dialogo-pago"
    >
      <div className="p-8">
        <h2 id="pago-titulo" className="text-xl font-bold text-text">
          Formulario de pago
        </h2>
        <p id="pago-desc" className="mt-3 text-sm text-pretty text-text-muted">
          {tipo ? `Entrada ${tipo.nombre}, ${tipo.precio}.` : ""}
          {fase !== "confirmado" && " Elegí cómo querés pagar."}
        </p>

        {fase === "confirmado" ? (
          // `role="status"`: el lector de pantalla anuncia la confirmación al
          // aparecer, sin robarle el foco a "Cerrar".
          <div role="status" className="mt-8 grid place-items-center gap-4 py-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-primary text-on-primary">
              <Check size={32} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <p className="text-xl font-bold text-text">¡Compra confirmada!</p>
            <p className="max-w-[34ch] text-sm text-pretty text-text-muted">
              {notificaciones === "encendido"
                ? "En unos segundos te llega una notificación con tu entrada y el QR de acceso."
                : "Activá las notificaciones para recibir tu entrada y el QR de acceso en este dispositivo."}
            </p>
          </div>
        ) : (
          <>
            {/* Radios de verdad: se recorren con las flechas y el lector de
                pantalla dice "1 de 3". Mientras se procesa, el `fieldset`
                deshabilitado impide cambiar de método a mitad de la compra. */}
            <fieldset className="mt-6" disabled={procesando}>
              <legend className="sr-only">Método de pago</legend>
              <div className="grid gap-2">
                {METODOS_EJEMPLO.map((m) => (
                  <label
                    key={m}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 border border-border bg-surface px-4 py-3 text-sm text-text-muted",
                      "transition-colors duration-micro ease-standard",
                      // El borde acompaña, pero el estado lo dice el propio
                      // radio marcado: no depende solo del color.
                      "has-[:checked]:border-primary has-[:checked]:text-text",
                    )}
                  >
                    <input
                      type="radio"
                      name="metodo-pago"
                      value={m}
                      checked={metodo === m}
                      onChange={() => setMetodo(m)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* ESTADO VACÍO. La "J" en monocromía y atenuada ocupa el lugar de
                la pasarela que no existe, y el texto lo dice. */}
            <div className="mt-8 grid place-items-center gap-4 border border-dashed border-border py-10">
              <BrandMark className="h-14 w-auto text-border-strong" monocromo />
              <p className="max-w-[26ch] text-center text-xs text-text-subtle">
                Ejemplo ilustrativo: el prototipo no tiene pasarela de pago conectada.
              </p>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap justify-end gap-2">
          <button
            ref={cerrar}
            type="button"
            onClick={() => ref.current?.close()}
            className={cn(
              "min-h-11 rounded-full px-6 text-sm font-semibold",
              "transition-colors duration-micro ease-standard",
              fase === "confirmado"
                ? "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active"
                : "text-text-muted hover:text-text",
            )}
          >
            Cerrar
          </button>

          {fase !== "confirmado" && (
            <button
              type="button"
              onClick={comprar}
              // Sin método elegido, `disabled` de verdad. Mientras se procesa,
              // `aria-disabled` y no `disabled`: el botón tiene el foco, y
              // deshabilitarlo lo mandaría al <body>.
              disabled={!metodo}
              aria-disabled={procesando || undefined}
              aria-busy={fase === "comprando" || undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-on-primary",
                "transition-colors duration-micro ease-standard",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !procesando && "enabled:hover:bg-primary-hover enabled:active:bg-primary-active",
                procesando && "cursor-progress",
              )}
            >
              {fase === "comprando" && (
                <>
                  <LoaderCircle
                    size={16}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Comprando…
                </>
              )}
              {fase === "comprado" && (
                <>
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  Comprado
                </>
              )}
              {fase === "eligiendo" && "Comprar"}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
