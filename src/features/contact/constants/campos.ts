/**
 * Definición de los cinco campos del formulario de contacto.
 *
 * PORTADO DEL PROTOTIPO DE MARU (`src/components/Contacto.astro`): mismos
 * campos, mismo orden y mismas cuatro opciones de motivo. Lo que se agrega es
 * el texto de cada error, que allá no existía porque el formulario delegaba
 * todo en las burbujas del navegador.
 *
 * Cada campo declara sus RESTRICCIONES NATIVAS (`required`, `type`,
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

export type CampoId = "nombre" | "empresa" | "email" | "motivo" | "mensaje";

/**
 * Las claves de `ValidityState` que este formulario puede llegar a disparar,
 * EN ORDEN DE PRIORIDAD. Un campo puede violar varias a la vez -un mensaje de
 * dos letras está corto y además no cumple el mínimo- y sólo se muestra una:
 * la primera que aplique. El orden va de la falla más gruesa a la más fina,
 * así el mensaje habla del problema más grande y no de un detalle.
 */
export const CLAVES_VALIDEZ = [
  "valueMissing",
  "typeMismatch",
  "tooShort",
] as const satisfies readonly (keyof ValidityState)[];

export type ClaveValidez = (typeof CLAVES_VALIDEZ)[number];

type Campo = {
  etiqueta: string;
  /** Texto de apoyo permanente bajo la etiqueta. Va en el `aria-describedby`. */
  ayuda?: string;
  /**
   * Largo mínimo, ya recortado de espacios. Duplica al atributo `minlength`
   * a propósito - ver MINIMO_MENSAJE.
   */
  minimo?: number;
  errores: Partial<Record<ClaveValidez, string>>;
};

/**
 * Mínimo de caracteres del mensaje. Esta constante alimenta TRES lugares -el
 * atributo `minlength`, la comprobación propia y el texto del error-, así que
 * no pueden discrepar entre sí.
 *
 * ATENCION: POR QUÉ NO ALCANZA CON `minlength`. `tooShort` es la única entrada de
 * `ValidityState` que es CONDICIONAL: la especificación sólo la activa si el
 * valor fue editado por el usuario (la "bandera de valor sucio"). Existe para
 * que un valor corto precargado por el servidor no aparezca en rojo antes de
 * que nadie lo toque. Acá el campo arranca vacío, así que la condición sobra,
 * pero su efecto no: un valor puesto por asignación tiene `tooShort: false`
 * con 4 caracteres y un mínimo de 20, y eso vuelve la regla imposible de
 * verificar desde una automatización. Medido en el navegador.
 *
 * Así que el atributo se queda -es el que hace cumplir la regla en el camino
 * SIN JavaScript- y con JavaScript la comprobación la hacemos nosotros. De
 * paso queda más estricta: `minlength` cuenta caracteres crudos, así que
 * veinte espacios lo satisfacen; nuestra comprobación recorta primero.
 */
export const MINIMO_MENSAJE = 20;

/** Los campos que tienen algo que validar, EN ORDEN VISUAL. "El primer campo
 *  con error" tiene que ser el primero que se ve, no el primero que se
 *  declaró. `empresa` es opcional y `motivo` es un select con valor siempre
 *  válido: no entran. */
export const ORDEN_VALIDACION: readonly CampoId[] = ["nombre", "email", "mensaje"];

export const CAMPOS: Record<CampoId, Campo> = {
  nombre: {
    etiqueta: "Nombre y apellido",
    errores: {
      valueMissing: "Escribí tu nombre: es con lo que vamos a dirigirnos a vos.",
    },
  },
  empresa: {
    etiqueta: "Empresa u organismo",
    ayuda: "Opcional.",
    errores: {},
  },
  email: {
    etiqueta: "Correo electrónico",
    ayuda: "Te respondemos a esta dirección.",
    errores: {
      valueMissing: "Escribí tu correo: es la vía por la que vamos a responderte.",
      typeMismatch: "Ese correo está incompleto. Tiene que ser del tipo nombre@dominio.com.",
    },
  },
  motivo: {
    etiqueta: "Motivo",
    errores: {},
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

/** Las cuatro opciones de motivo del prototipo de origen, sin cambios. */
export const MOTIVOS = [
  "Quiero exponer",
  "Quiero patrocinar",
  "Prensa",
  "Consulta general",
] as const;

/** Asunto del correo que se abre al enviar. */
export const ASUNTO_CORREO = "Consulta desde el sitio de ExpoJuy 2026";
