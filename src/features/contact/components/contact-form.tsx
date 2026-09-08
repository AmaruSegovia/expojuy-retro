"use client";

import { AlertCircle } from "lucide-react";
import { CONTACTO } from "@/shared/constants/site";
import { cn } from "@/shared/lib/cn";
import { ASUNTO_CORREO, CAMPOS, MINIMO_MENSAJE, MOTIVOS, type CampoId } from "../constants/campos";
import { useFormularioContacto } from "../hooks/use-formulario-contacto";

/**
 * EL FORMULARIO. Es lo único de la sección que baja al cliente: el resto
 * -título, datos de contacto, redes y la trama- es marcado de servidor.
 *
 * QUÉ CAMBIÓ RESPECTO DEL PROTOTIPO DE ORIGEN
 *
 * Maru envía con `method="post"` a `formsubmit.co/<correo>`. Acá no: ese
 * servicio exige que la Cámara confirme la dirección desde su propia cuenta, y
 * el correo del sitio todavía es provisorio, así que un POST ahí manda datos
 * de una persona a un tercero que no los va a entregar. Peor que no enviarlos.
 *
 * En su lugar se conserva la solución que ya tenía este sitio: el botón COMPONE
 * UN CORREO y abre el cliente de la persona con todo escrito. El mensaje se
 * manda de verdad, lo manda ella, y no hay endpoint que asegurar ni antispam
 * que agregar, porque no hay nada del otro lado que se pueda inundar. Un
 * honeypot acá no protegería nada.
 *
 * EL FORMULARIO NO LLEVA `action`, Y ESO SE MIDIÓ. Chrome trata cualquier
 * `action` con esquema distinto de https como contenido mixto -aunque un
 * `mailto:` no mande nada por la red- y Lighthouse lo cobraba en dos
 * auditorías. Los `mailto:` de un ENLACE no los marca, así que el camino sin
 * JavaScript es el enlace que está debajo del botón.
 *
 * MEJORA PROGRESIVA. Sin la clase `.js` el botón no aparece y el enlace sí:
 * las dos reglas ya viven en `globals.css`. El HTML se sirve con el enlace
 * VISIBLE, así que si el script falla el camino que queda es el que funciona.
 */
export function ContactForm() {
  const { refFormulario, errores, enviado, revalidar, enviar } = useFormularioContacto();

  /** El `id` del DOM lleva prefijo y el `name` no: el `name` es lo que el hook
   *  y el `FormData` usan para encontrar el campo, y "nombre" o "email" a secas
   *  son ids demasiado genéricos para una página de nueve secciones. */
  const idDe = (id: CampoId) => `contacto-${id}`;

  /** Ids del texto de apoyo y del error, para el `aria-describedby` del control.
   *  Van los dos cuando existen los dos: la ayuda no deja de ser útil porque el
   *  campo esté mal, y un lector de pantalla lee la lista entera. */
  const descritoPor = (id: CampoId) =>
    [CAMPOS[id].ayuda && `${idDe(id)}-ayuda`, errores[id] && `${idDe(id)}-error`]
      .filter(Boolean)
      .join(" ") || undefined;

  /** Lo común a todo control. La apariencia entera vive en `.contacto-campo`,
   *  dentro de `styles.css`: el borde, el fondo y el estado `:user-invalid` son
   *  una sola pieza y no se pueden partir en utilidades sin que el borde
   *  grueso del error termine perdiendo contra una utilidad de `border`. */
  const propsControl = (id: CampoId) => ({
    id: idDe(id),
    name: id,
    className: "contacto-campo",
    "aria-invalid": errores[id] ? (true as const) : undefined,
    "aria-describedby": descritoPor(id),
    onBlur: () => revalidar(id),
  });

  return (
    <form
      ref={refFormulario}
      onSubmit={enviar}
      className="grid gap-4 border border-border bg-surface-raised p-6 sm:p-8"
    >
      <Campo id="nombre" idDom={idDe("nombre")} error={errores.nombre} obligatorio>
        <input {...propsControl("nombre")} type="text" required autoComplete="name" />
      </Campo>

      <Campo id="empresa" idDom={idDe("empresa")} error={errores.empresa}>
        <input {...propsControl("empresa")} type="text" autoComplete="organization" />
      </Campo>

      <Campo id="email" idDom={idDe("email")} error={errores.email} obligatorio>
        <input
          {...propsControl("email")}
          type="email"
          required
          autoComplete="email"
          placeholder="nombre@dominio.com"
        />
      </Campo>

      <Campo id="motivo" idDom={idDe("motivo")} error={errores.motivo}>
        {/* El select no lleva `required`: siempre tiene un valor válido, y por
            eso tampoco entra en la validación. */}
        <select {...propsControl("motivo")}>
          {MOTIVOS.map((motivo) => (
            <option key={motivo} value={motivo}>
              {motivo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="mensaje" idDom={idDe("mensaje")} error={errores.mensaje} obligatorio>
        <textarea
          {...propsControl("mensaje")}
          required
          minLength={MINIMO_MENSAJE}
          rows={5}
          className={cn(propsControl("mensaje").className, "contacto-campo--area")}
        />
      </Campo>

      {/* SIN JAVASCRIPT ESTE BOTÓN NO PUEDE HACER NADA, así que sin JavaScript
          no se muestra. Ojo: no puede llevar una utilidad de `display` de
          Tailwind, o le ganaría por capa a la regla de `.contacto-enviar`. */}
      <button
        type="submit"
        className={cn(
          "contacto-enviar mt-2 justify-self-start rounded-full bg-primary px-7 py-3.5",
          "text-sm font-semibold text-on-primary",
          "transition-colors duration-micro ease-standard",
          "hover:bg-primary-hover active:bg-primary-active",
        )}
      >
        Enviar consulta
      </button>

      {/* EL CAMINO SIN JAVASCRIPT. Se sirve VISIBLE y lo esconde la clase
          `.js`: si el script no corre, esto es lo que queda, y funciona. */}
      <p className="contacto-sin-js text-sm text-text-muted">
        <a
          href={`mailto:${CONTACTO.email}?subject=${encodeURIComponent(ASUNTO_CORREO)}`}
          className="font-semibold text-link underline underline-offset-4"
        >
          Escribinos por correo
        </a>{" "}
        - se abre tu cliente con el destinatario y el asunto puestos.
      </p>

      {/* Región viva: el aviso aparece después de que el usuario apretó el
          botón, así que hay que anunciarlo. `polite` y no `assertive` porque no
          interrumpe nada; el foco sigue en el botón. El párrafo existe SIEMPRE,
          vacío: una región viva que se monta junto con su contenido no se
          anuncia, porque el lector no llegó a observarla antes de que
          cambiara. */}
      <p role="status" className="text-sm text-text-muted">
        {enviado
          ? `Listo: tu consulta quedó cargada en tu cliente de correo, dirigida a ${CONTACTO.email}. Si no se abrió ninguna ventana, escribinos directamente a esa dirección.`
          : ""}
      </p>

      <p className="text-xs text-text-subtle">
        Los campos marcados con asterisco son necesarios para poder responderte.
      </p>
    </form>
  );
}

/**
 * Etiqueta, control y mensaje de error de un campo.
 *
 * La etiqueta es un `<label>` de verdad, no un placeholder: un placeholder
 * desaparece apenas se empieza a escribir, así que quien se distrae a mitad
 * del formulario pierde el nombre del campo que está completando.
 */
function Campo({
  id,
  idDom,
  error,
  obligatorio = false,
  children,
}: {
  id: CampoId;
  idDom: string;
  error?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  const { etiqueta, ayuda } = CAMPOS[id];

  return (
    <div className="min-w-0">
      <label
        htmlFor={idDom}
        className="block text-xs font-semibold tracking-[0.12em] text-text uppercase"
      >
        {etiqueta}{" "}
        {/* El asterisco es SÓLO visual: va `aria-hidden` porque un lector de
            pantalla ya anuncia "obligatorio" leyendo el atributo `required`
            del control, y sin esto diría "Nombre asterisco, obligatorio". */}
        {obligatorio && (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        )}
      </label>
      {ayuda && (
        <p id={`${idDom}-ayuda`} className="mt-1 text-xs text-text-subtle">
          {ayuda}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        // El ícono acompaña al color: WCAG 1.4.1 prohíbe que el color sea el
        // único indicador, y alguien con daltonismo rojo-verde ve este mensaje
        // del mismo tono que el texto de al lado. El borde grueso del propio
        // campo es el tercer indicador, y ese no necesita JavaScript.
        <p id={`${idDom}-error`} className="mt-2 flex items-start gap-2 text-xs text-danger">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
