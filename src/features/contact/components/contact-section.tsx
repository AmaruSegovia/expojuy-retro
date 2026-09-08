"use client";

import { AlertCircle, Mail, MapPin, Phone } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Reveal } from "@/shared/components/motion/reveal";
import { PlaceholderVisual } from "@/shared/components/ui/placeholder-visual";
import { CONTACTO } from "@/shared/constants/site";
import {
  ASUNTO_CORREO,
  CAMPOS,
  MINIMO_MENSAJE,
  PATRON_TELEFONO,
  type CampoId,
} from "../constants/campos";
import { useFormularioContacto } from "../hooks/use-formulario-contacto";

/**
 * CONTACTO — formulario a tres cuartos y una franja visual a un cuarto.
 *
 * Misma grilla que Preguntas, con dos diferencias: la proporción es 3fr_1fr en
 * vez de 4fr_1fr, y la franja se estira a todo el alto de la fila
 * (`items-stretch`) sin ningún alto fijo. En pantallas chicas desaparece: es
 * decorativa, y media pantalla de patrón entre el título y el primer campo
 * solo aleja al usuario de lo único que esta sección le pide.
 *
 * EL BOTÓN HACE LO QUE DICE
 *
 * No hay backend, así que "enviar" no puede significar "lo guardamos". Se
 * podría simular un envío exitoso, pero eso es mentirle a quien escribió el
 * mensaje. Acá el formulario COMPONE UN CORREO y abre el cliente de la
 * persona con todo listo: el mensaje se manda de verdad, lo manda ella. El
 * `action="mailto:"` del propio formulario hace lo mismo sin JavaScript, así
 * que los dos caminos terminan en el mismo lugar.
 *
 * Al lado del botón está el correo escrito como texto, para quien no tenga un
 * cliente configurado y prefiera copiarlo.
 */
export function ContactSection() {
  const { refFormulario, errores, enviado, revalidar, enviar } = useFormularioContacto();

  /** Ids del texto de apoyo y del error, para el `aria-describedby` del control.
   *  Van los dos cuando existen los dos: la ayuda no deja de ser útil porque el
   *  campo esté mal, y un lector de pantalla lee la lista entera. */
  const descritoPor = (id: CampoId) =>
    [CAMPOS[id].ayuda && `${id}-ayuda`, errores[id] && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;

  const propsControl = (id: CampoId) => ({
    id,
    name: id,
    "aria-invalid": errores[id] ? (true as const) : undefined,
    "aria-describedby": descritoPor(id),
    onBlur: () => revalidar(id),
    className: cn(
      "w-full rounded-hairline border border-border-strong bg-surface-raised px-4 py-3",
      "text-base text-text placeholder:text-text-subtle",
      "transition-colors duration-micro ease-standard hover:border-text-subtle",
      // `cn` resuelve por tailwind-merge, así que este border-* pisa de verdad
      // al de arriba. Con clases sueltas ganaría el que el CSS generado pusiera
      // último, que no es necesariamente el que uno escribe último.
      errores[id] && "border-danger",
    ),
  });

  return (
    <section
      id="contacto"
      aria-labelledby="contacto-titulo"
      className="border-t border-border bg-surface py-24 md:py-32"
    >
      <div className="container-content">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
            Sección 09
          </p>
          <h2 id="contacto-titulo" className="mt-3 text-3xl font-bold text-text md:text-4xl">
            Contacto
          </h2>
          <p className="mt-4 max-w-prose text-lg text-text-muted">
            Escribinos por participación, prensa, acreditaciones o cualquier consulta sobre la
            edición 2026.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-10 lg:grid-cols-[3fr_1fr]">
          <div className="min-w-0">
            {/* EL FORMULARIO NO LLEVA `action`, Y ESO SE DECIDIÓ MIDIENDO.
                Antes llevaba `action="mailto:"` con `enctype="text/plain"`,
                que sin JavaScript componía el correo con los campos ya
                escritos. Funcionaba, pero Chrome trata cualquier `action` con
                esquema distinto de https como CONTENIDO MIXTO —aunque un
                `mailto:` no mande nada por la red— y Lighthouse lo cobraba
                caro: `is-on-https` (peso 5) e `inspector-issues` (peso 1)
                dejaban Buenas prácticas en 77 contra un objetivo de 90.

                El camino sin JavaScript no se perdió, cambió de forma: es el
                enlace que está abajo del botón. Lo que se resigna es que los
                campos ya escritos viajen en el cuerpo; el asunto y el destino
                siguen puestos. Lighthouse no marca los `mailto:` de un
                enlace, solo los de un `action`.

                `noValidate` sigue sin ir acá — ver el hook. */}
            <form ref={refFormulario} onSubmit={enviar} className="grid gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo id="email" error={errores.email}>
                  <input
                    {...propsControl("email")}
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nombre@dominio.com"
                  />
                </Campo>

                <Campo id="telefono" error={errores.telefono}>
                  <input
                    {...propsControl("telefono")}
                    type="tel"
                    required
                    autoComplete="tel"
                    pattern={PATRON_TELEFONO}
                    placeholder="+54 388 400-0000"
                  />
                </Campo>
              </div>

              <Campo id="mensaje" error={errores.mensaje}>
                <textarea
                  {...propsControl("mensaje")}
                  required
                  minLength={MINIMO_MENSAJE}
                  rows={5}
                  className={cn(propsControl("mensaje").className, "resize-y")}
                />
              </Campo>

              {/* SIN JAVASCRIPT ESTE BOTÓN NO PUEDE HACER NADA, así que sin
                  JavaScript no se muestra: el CSS lo esconde cuando falta la
                  clase `.js` y muestra el enlace de abajo en su lugar. Ojo —
                  no puede llevar una utilidad de display de Tailwind, o le
                  ganaría por capa a esa regla. Ver `.contacto-enviar`. */}
              <button
                type="submit"
                className={cn(
                  "contacto-enviar w-full rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-on-primary",
                  "transition-colors duration-micro ease-standard",
                  "hover:bg-primary-hover active:bg-primary-active",
                )}
              >
                Enviar mensaje
              </button>

              {/* EL CAMINO SIN JAVASCRIPT. Se sirve VISIBLE y lo esconde la
                  clase `.js`, como todo lo demás del proyecto: si el script no
                  corre, esto es lo que queda, y funciona. */}
              <p className="contacto-sin-js text-sm text-text-muted">
                <a
                  href={`mailto:${CONTACTO.email}?subject=${encodeURIComponent(ASUNTO_CORREO)}`}
                  className="font-semibold text-link underline underline-offset-4"
                >
                  Escribinos por correo
                </a>{" "}
                — se abre tu cliente con el destinatario y el asunto puestos.
              </p>

              {/* Región viva: el aviso aparece después de que el usuario apretó
                  el botón, así que hay que anunciarlo. `polite` y no `assertive`
                  porque no interrumpe nada — el foco sigue en el botón.
                  El párrafo existe SIEMPRE, vacío: una región viva que se monta
                  junto con su contenido no se anuncia, porque el lector no
                  llegó a observarla antes de que cambiara. */}
              <p role="status" className="text-sm text-text-muted">
                {enviado
                  ? `Listo: tu mensaje quedó cargado en tu cliente de correo, dirigido a ${CONTACTO.email}. Si no se abrió ninguna ventana, escribinos directamente a esa dirección.`
                  : ""}
              </p>
            </form>

            {/* Los canales directos NO son decoración: son la salida para quien
                no puede o no quiere usar el formulario. Van después, porque el
                formulario es la acción principal de la sección. */}
            <div className="mt-10 border-t border-border pt-8">
              <h3 className="text-xs font-semibold tracking-[0.18em] text-text-subtle uppercase">
                O directamente
              </h3>
              {/* Fila que envuelve, NO una grilla de tres columnas. Con tres
                  columnas iguales el correo recibe un ancho fijo que no le
                  alcanza y se parte a mitad de palabra
                  ("contacto@expojuy2026.c / om.ar"), que es exactamente lo que
                  un dato de contacto no puede hacer: se copia mal y se lee
                  peor. Dejándolos fluir, cada uno ocupa lo que mide y el que
                  no entra baja entero. */}
              <ul role="list" className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
                <Canal icono={Mail} etiqueta="Correo" href={`mailto:${CONTACTO.email}`}>
                  {CONTACTO.email}
                </Canal>
                <Canal icono={Phone} etiqueta="Teléfono" href={`tel:${CONTACTO.telefonoHref}`}>
                  {CONTACTO.telefono}
                </Canal>
                <Canal icono={MapPin} etiqueta="Sede">
                  {CONTACTO.direccion}
                </Canal>
              </ul>
            </div>
          </div>

          {/* PROVISORIO — sin fotografías institucionales todavía. Estirada a
              todo el alto de la fila por `items-stretch`: el alto lo fija la
              columna del formulario, no un número escrito acá. */}
          <div className="relative hidden overflow-hidden border border-border lg:block">
            <PlaceholderVisual paleta={0} className="absolute inset-0 size-full" />
          </div>
        </div>
      </div>
    </section>
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
  error,
  children,
}: {
  id: CampoId;
  error?: string;
  children: React.ReactNode;
}) {
  const { etiqueta, ayuda } = CAMPOS[id];

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {etiqueta}{" "}
        {/* El asterisco es SOLO visual: va `aria-hidden` porque un lector de
            pantalla ya anuncia "obligatorio" leyendo el atributo `required`
            del control, y sin esto diría "Teléfono asterisco, obligatorio".
            Que sea redundante es justamente lo que permite sacarlo del árbol
            de accesibilidad sin perder nada: la obligatoriedad viaja por el
            atributo, no por el signo. */}
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      </label>
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-text-subtle">
          {ayuda}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        // El ícono acompaña al color: WCAG 1.4.1 prohíbe que el color sea el
        // único indicador, y alguien con daltonismo rojo-verde ve este mensaje
        // del mismo tono que el texto de al lado.
        <p id={`${id}-error`} className="mt-2 flex items-start gap-2 text-xs text-danger">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Un canal de contacto directo. Sin `href` queda como dato y no como enlace:
 *  una dirección no se "abre" en ningún lado. */
function Canal({
  icono: Icono,
  etiqueta,
  href,
  children,
}: {
  icono: typeof Mail;
  etiqueta: string;
  href?: string;
  children: React.ReactNode;
}) {
  const contenido = (
    <>
      <Icono aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-link" />
      <span className="min-w-0">
        <span className="block text-xs text-text-subtle">{etiqueta}</span>
        <span className="block text-sm text-text">{children}</span>
      </span>
    </>
  );

  return (
    <li className="min-w-0">
      {href ? (
        <a
          href={href}
          className="flex gap-3 transition-colors duration-micro ease-standard hover:text-link"
        >
          {contenido}
        </a>
      ) : (
        <span className="flex gap-3">{contenido}</span>
      )}
    </li>
  );
}
