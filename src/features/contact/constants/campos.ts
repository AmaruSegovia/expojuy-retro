/**
 * Definición de los tres campos del formulario de contacto.
 *
 * Cada campo declara sus RESTRICCIONES NATIVAS (`required`, `type`, `pattern`,
 * `minLength`) y el mensaje que le corresponde a cada forma de incumplirlas.
 * Las dos cosas viven juntas a propósito: la restricción y su explicación son
 * el mismo dato, y separarlas es la manera clásica de que un `minLength` se
 * cambie y el mensaje siga diciendo el número viejo.
 *
 * LOS MENSAJES SON NUESTROS, LA VALIDACIÓN ES DEL NAVEGADOR. No se reimplementa
 * ninguna regla en JavaScript: se lee `ValidityState` del propio control, que
 * es el que ya sabe si un correo es un correo. Nuestro aporte es el texto, que
 * es lo único que el navegador hace mal: "Please include an '@'" no está
 * traducido, no se puede estilar y desaparece solo.
 */

export type CampoId = "email" | "telefono" | "mensaje";

/**
 * Las claves de `ValidityState` que este formulario puede llegar a disparar,
 * EN ORDEN DE PRIORIDAD. Un campo puede violar varias a la vez —un mensaje de
 * dos letras está corto y además no cumple el mínimo— y solo se muestra una:
 * la primera que aplique. El orden va de la falla más gruesa a la más fina,
 * así el mensaje habla del problema más grande y no de un detalle.
 */
export const CLAVES_VALIDEZ = [
  "valueMissing",
  "typeMismatch",
  "patternMismatch",
  "tooShort",
] as const satisfies readonly (keyof ValidityState)[];

export type ClaveValidez = (typeof CLAVES_VALIDEZ)[number];

type Campo = {
  etiqueta: string;
  /** Texto de apoyo permanente bajo la etiqueta. Va en el `aria-describedby`. */
  ayuda?: string;
  /**
   * Largo mínimo, ya recortado de espacios. Duplica al atributo `minlength`
   * a propósito — ver MINIMO_MENSAJE.
   */
  minimo?: number;
  errores: Partial<Record<ClaveValidez, string>>;
};

/**
 * Mínimo de caracteres del mensaje. Esta constante alimenta TRES lugares —el
 * atributo `minlength`, la comprobación propia y el texto del error—, así que
 * no pueden discrepar entre sí.
 *
 * ⚠️ POR QUÉ NO ALCANZA CON `minlength`. `tooShort` es la única entrada de
 * `ValidityState` que es CONDICIONAL: la especificación solo la activa si el
 * valor fue editado por el usuario (la "bandera de valor sucio"). Existe para
 * que un valor corto precargado por el servidor no aparezca en rojo antes de
 * que nadie lo toque. Acá el campo arranca vacío, así que la condición sobra,
 * pero su efecto no: un valor puesto por asignación tiene `tooShort: false`
 * con 4 caracteres y un mínimo de 20, y eso vuelve la regla imposible de
 * verificar desde una automatización. Medido en el navegador.
 *
 * Así que el atributo se queda —es el que hace cumplir la regla en el camino
 * SIN JavaScript— y con JavaScript la comprobación la hacemos nosotros. De
 * paso queda más estricta: `minlength` cuenta caracteres crudos, así que
 * veinte espacios lo satisfacen; nuestra comprobación recorta primero.
 */
export const MINIMO_MENSAJE = 20;

/**
 * Un teléfono argentino se escribe de muchas formas y ninguna es la correcta:
 * con y sin +54, con el 0 y el 15, con guiones, espacios o paréntesis. El
 * patrón NO intenta validar que el número exista —eso no se puede desde el
 * cliente— sino descartar lo que seguro no es un teléfono: pide al menos seis
 * caracteres y no admite letras.
 *
 * ⚠️ DOS TRAMPAS, Y LAS DOS FALLAN EN SILENCIO:
 *
 * 1. VA `String.raw`, NO COMILLAS. En un string común `"\d"` no es un escape
 *    conocido de JavaScript, así que colapsa a `"d"`: el patrón llegaba al DOM
 *    como `[d+()-.s]` —la letra d, no un dígito— sin un solo error en consola.
 *
 * 2. TODO SIGNO VA ESCAPADO. Chrome compila el `pattern` con la bandera `v`,
 *    donde `( ) [ ] { } / - | \` son sintaxis reservada DENTRO de la clase de
 *    caracteres y deben escaparse. Y cuando la expresión no compila, la
 *    especificación dice que el atributo se IGNORA POR COMPLETO: el campo pasa
 *    a aceptar cualquier cosa. No hay excepción, no hay advertencia; el
 *    síntoma es "la validación no anda", que es lo más lejos posible de la
 *    causa.
 *
 * Verificado en el navegador: `new RegExp("^(?:" + PATRON + ")$", "v")` tiene
 * que compilar y rechazar "llamame".
 */
export const PATRON_TELEFONO = String.raw`[\d\s+\(\)\.\-]{6,}`;

export const CAMPOS: Record<CampoId, Campo> = {
  email: {
    etiqueta: "Correo electrónico",
    errores: {
      valueMissing: "Escribí tu correo: es la vía por la que vamos a responderte.",
      typeMismatch: "Ese correo está incompleto. Tiene que ser del tipo nombre@dominio.com.",
    },
  },
  telefono: {
    etiqueta: "Teléfono",
    errores: {
      valueMissing: "Falta el teléfono. Va con característica, sin el 0 ni el 15.",
      patternMismatch: "Solo números, espacios, guiones, puntos, paréntesis y el signo +.",
    },
  },
  mensaje: {
    etiqueta: "Mensaje",
    ayuda: "Contanos quién sos y en qué te podemos ayudar.",
    minimo: MINIMO_MENSAJE,
    errores: {
      valueMissing: "Sin mensaje no sabemos qué necesitás.",
      tooShort: `Contanos un poco más: al menos ${MINIMO_MENSAJE} caracteres.`,
    },
  },
};

/** Asunto del correo que se abre al enviar. */
export const ASUNTO_CORREO = "Consulta desde el sitio de ExpoJuy 2026";
