/**
 * Preguntas frecuentes.
 *
 * ⚠️ PROVISORIO — las respuestas son de maqueta. Varias dependen de datos que
 * la organización todavía no confirmó (precios, horarios, política de
 * reintegros), así que reemplazarlas es obligatorio antes de publicar.
 *
 * A diferencia de las tarjetas del sitio, acá el texto NO tiene presupuesto de
 * caracteres: el panel crece con lo que haya. Puede ser más largo sin romper
 * nada, pero conviene que entre en dos o tres renglones para que el acordeón
 * siga leyéndose como una lista y no como una página.
 */

export type Pregunta = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export const PREGUNTAS: Pregunta[] = [
  {
    id: "cuando-donde",
    pregunta: "¿Cuándo y dónde es ExpoJuy 2026?",
    respuesta:
      "Del 24 al 27 de septiembre de 2026 en la Ciudad Cultural de San Salvador de Jujuy, con entrada por la rotonda de Juntos en Jujuy.",
  },
  {
    id: "entradas",
    pregunta: "¿Cómo consigo mi entrada?",
    respuesta:
      "La venta anticipada es en línea y el cupo por jornada es limitado. También habrá boletería en el acceso mientras queden lugares.",
  },
  {
    id: "expositor",
    pregunta: "¿Puedo exponer con mi empresa?",
    respuesta:
      "Sí. La convocatoria a expositores está abierta y se reserva stand por orden de inscripción, según el eje temático de cada actividad.",
  },
  {
    id: "accesibilidad",
    pregunta: "¿El predio es accesible?",
    respuesta:
      "El recorrido entre pabellones es a nivel y sin escalones. Hay sanitarios adaptados y estacionamiento reservado junto al acceso principal.",
  },
  {
    id: "como-llegar",
    pregunta: "¿Cómo llego y dónde estaciono?",
    respuesta:
      "Habrá combis gratuitas desde el centro durante los cuatro días. Las cocheras están sobre Av. de los Estudiantes, a una cuadra de la rotonda.",
  },
];
