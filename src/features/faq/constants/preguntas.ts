/**
 * Preguntas frecuentes.
 *
 * ATENCION: PROVISORIO - las respuestas son de maqueta. Varias dependen de
 * datos que la organización todavía no confirmó (horarios, política de
 * menores, estacionamiento, plazos de respuesta), así que reemplazarlas es
 * obligatorio antes de publicar.
 *
 * Las fechas y la sede que se nombran acá son las mismas de
 * `shared/constants/site.ts`, que también son provisorias. Están escritas y no
 * interpoladas a propósito: la respuesta es una frase redactada, no una ficha
 * de datos, y armarla por concatenación produce castellano de formulario.
 * Cuando la organización confirme el calendario hay que tocar los dos lugares.
 *
 * Los `id` son slugs con sentido y no números: sirven como ancla estable si
 * mañana se quiere enlazar a una pregunta puntual.
 *
 * El texto NO tiene presupuesto de caracteres: el panel crece con lo que haya.
 * Conviene igual que entre en dos o tres renglones para que el acordeón siga
 * leyéndose como una lista y no como una página.
 */

export type Pregunta = {
  id: string;
  pregunta: string;
  respuesta: string;
};

export const PREGUNTAS: readonly Pregunta[] = [
  {
    id: "horarios",
    pregunta: "¿Qué días y en qué horario abre la expo?",
    respuesta:
      "Del 24 al 27 de septiembre de 2026, de 10 a 24 h, en la Ciudad Cultural de San Salvador de Jujuy. Los pabellones cierran a las 22 h; el patio gastronómico y el escenario siguen hasta la medianoche.",
  },
  {
    id: "entradas",
    pregunta: "¿Dónde compro la entrada y cómo ingreso?",
    respuesta:
      "La venta anticipada es en línea y recibís un código QR por correo. Lo mostrás desde el celular en cualquiera de los accesos: no hace falta imprimirlo.",
  },
  {
    id: "menores",
    pregunta: "¿Los chicos pagan entrada?",
    respuesta:
      "Los menores de 12 años ingresan sin cargo acompañados por una persona adulta con entrada.",
  },
  {
    id: "estacionamiento",
    pregunta: "¿Cómo llego y dónde estaciono?",
    respuesta:
      "Hay estacionamiento en el acceso sur, con lugares reservados para personas con discapacidad, y combis gratuitas desde el centro cada 15 minutos durante los cuatro días.",
  },
  {
    id: "expositor",
    pregunta: "¿Cómo participo como expositor?",
    respuesta:
      "Escribinos por el formulario de contacto de este sitio. El equipo comercial responde en 48 h con planos, precios y disponibilidad de stands según el eje temático.",
  },
  {
    id: "accesibilidad",
    pregunta: "¿El predio es accesible?",
    respuesta:
      "El recorrido entre pabellones es a nivel y sin escalones. Hay rampas, sanitarios adaptados y espacios reservados frente al escenario. Se admiten perros guía.",
  },
];
