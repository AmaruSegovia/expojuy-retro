"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONTACTO } from "@/shared/constants/site";
import {
  ASUNTO_CORREO,
  CAMPOS,
  CLAVES_VALIDEZ,
  ORDEN_VALIDACION,
  type CampoId,
} from "../constants/campos";

type Control = HTMLInputElement | HTMLTextAreaElement;
type Errores = Partial<Record<CampoId, string>>;

/**
 * Traduce el `ValidityState` de un control al mensaje que le corresponde.
 * Devuelve `null` si el campo está bien.
 */
function mensajeDeError(id: CampoId, control: Control): string | null {
  const { minimo, errores } = CAMPOS[id];

  // El largo mínimo se comprueba acá y no se delega en `tooShort`: esa entrada
  // de ValidityState sólo se activa si el valor fue editado por el usuario, y
  // esa condición la hace invisible para cualquier automatización. Ver
  // MINIMO_MENSAJE. Va ANTES del corte por `valid` justamente porque el
  // navegador considera válido un valor que para nosotros es corto.
  const valor = control.value.trim();

  // Un `<textarea>` con tres espacios satisface `required`: el navegador mira
  // que el valor no esté vacío, no que diga algo. Para quien lo escribió está
  // igual de vacío, así que lo tratamos como faltante.
  if (control.required && valor.length === 0) {
    return errores.valueMissing ?? null;
  }

  if (minimo && valor.length < minimo) {
    return errores.tooShort ?? null;
  }

  if (control.validity.valid) return null;
  for (const clave of CLAVES_VALIDEZ) {
    if (control.validity[clave] && errores[clave]) return errores[clave];
  }
  // Red de seguridad: si el navegador inventa un motivo que no previmos, el
  // campo igual queda marcado. Un error sin texto sería peor que uno genérico.
  return "Revisá este campo.";
}

/**
 * ESTADO Y VALIDACIÓN DEL FORMULARIO DE CONTACTO.
 *
 * DOS CAPAS DE VALIDACIÓN, Y NINGUNA DEPENDE DE LA OTRA
 *
 * 1. CSS `:user-invalid`, que es lo que trae el prototipo de origen: engrosa
 *    el borde del campo apenas la persona lo tocó y lo dejó mal. No necesita
 *    JavaScript, así que es lo que queda si el script no corre.
 * 2. Este hook, que agrega lo que el CSS no puede: `aria-invalid` y un mensaje
 *    en texto con ícono. El color nunca es el único indicador (WCAG 1.4.1), y
 *    un borde grueso sin texto no dice QUÉ está mal.
 *
 * MEJORA PROGRESIVA: LA VALIDACIÓN NATIVA SE APAGA DESDE JAVASCRIPT
 *
 * `noValidate` NO se escribe como prop en el JSX. Si estuviera ahí, viajaría
 * en el HTML servido y un fallo del script dejaría un formulario sin ninguna
 * validación: el navegador ya no valida porque se lo pedimos, y nosotros
 * tampoco porque no llegamos a correr. Escribirlo en un efecto lo ata a que
 * el JavaScript esté vivo: si no corre, el atributo nunca aparece y el
 * navegador valida solo, con sus burbujas feas pero funcionando.
 *
 * Apagar la validación nativa NO apaga `:user-invalid`: `novalidate` sólo
 * evita que el navegador bloquee el envío y muestre la burbuja, pero el
 * control sigue siendo candidato a validación y su pseudoclase sigue
 * aplicando. Las dos capas conviven.
 *
 * CUÁNDO SE MUESTRA UN ERROR
 *
 * Nunca mientras se escribe por primera vez. Un campo empieza limpio, se
 * valida al ENVIAR o al salir de él si ya venía marcado, y se limpia en cuanto
 * queda válido. Validar en cada tecla acusa al usuario de equivocarse antes de
 * que haya terminado de tipear: "juan@" está mal, pero está mal porque todavía
 * lo está escribiendo.
 */
export function useFormularioContacto() {
  const refFormulario = useRef<HTMLFormElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const formulario = refFormulario.current;
    if (formulario) formulario.noValidate = true;
  }, []);

  const control = (id: CampoId) => refFormulario.current?.elements.namedItem(id) as Control | null;

  /**
   * Revalida UN campo. Sólo actúa si ya estaba marcado: la primera vez que se
   * sale de un campo vacío no se lo señala, porque todavía no se intentó nada.
   */
  const revalidar = useCallback((id: CampoId) => {
    setErrores((actuales) => {
      if (!actuales[id]) return actuales;
      const el = control(id);
      if (!el) return actuales;
      const mensaje = mensajeDeError(id, el);
      if (mensaje === actuales[id]) return actuales;
      const siguientes = { ...actuales };
      if (mensaje) siguientes[id] = mensaje;
      else delete siguientes[id];
      return siguientes;
    });
  }, []);

  const enviar = useCallback((evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;

    const encontrados: Errores = {};
    let primerInvalido: Control | null = null;

    for (const id of ORDEN_VALIDACION) {
      const el = formulario.elements.namedItem(id) as Control | null;
      if (!el) continue;
      const mensaje = mensajeDeError(id, el);
      if (mensaje) {
        encontrados[id] = mensaje;
        primerInvalido ??= el;
      }
    }

    setErrores(encontrados);

    if (primerInvalido) {
      // Mover el foco es lo que hace que un lector de pantalla ANUNCIE el
      // error: al enfocar el campo lee su etiqueta y su aria-describedby, que
      // es donde vive el mensaje. Un cartel arriba de todo, sin foco, se
      // escribe en una parte de la página que nadie está mirando.
      primerInvalido.focus();
      return;
    }

    const datos = new FormData(formulario);
    const texto = (id: CampoId) => String(datos.get(id) ?? "").trim();
    const empresa = texto("empresa");

    // El cuerpo se arma acá y no coincide con el que produciría un envío
    // nativo con `enctype="text/plain"`, que serializaría "campo=valor". Es la
    // única asimetría entre los dos caminos y es a favor: el nativo es la red
    // de seguridad, este es el que va a ver el 99% de la gente.
    const cuerpo = [
      `Nombre: ${texto("nombre")}`,
      empresa ? `Empresa u organismo: ${empresa}` : null,
      `Correo: ${texto("email")}`,
      `Motivo: ${texto("motivo")}`,
      "",
      texto("mensaje"),
    ]
      .filter((linea) => linea !== null)
      .join("\n");

    window.location.href =
      `mailto:${CONTACTO.email}` +
      `?subject=${encodeURIComponent(ASUNTO_CORREO)}` +
      `&body=${encodeURIComponent(cuerpo)}`;

    setEnviado(true);
  }, []);

  return { refFormulario, errores, enviado, revalidar, enviar };
}
