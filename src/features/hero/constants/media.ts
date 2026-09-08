/**
 * Fuentes del video de fondo del hero.
 *
 * ATENCION: PROVISORIO - el clip actual es una aérea nocturna de una ciudad de EE.UU.
 * (licencia libre, sin marca de agua). Sirve para maquetar, pero antes de la
 * entrega debe reemplazarse por material de la Ciudad Cultural de Jujuy:
 * "identidad institucional" es criterio de evaluación explícito.
 * Reemplazar los archivos en public/media/ manteniendo los nombres.
 *
 * Encodeados desde un master 4K de 25 Mbps con:
 *   ffmpeg -i master.mp4 -vf "scale=1920:1080:flags=lanczos" \
 *          -c:v libvpx-vp9 -b:v 0 -crf 48 -row-mt 1 -tile-columns 3 \
 *          -cpu-used 2 -pix_fmt yuv420p -an salida.webm
 *
 * `-b:v 0` es lo que hace que -crf funcione como calidad constante. Sin eso
 * libvpx lo trata como un tope dentro de un objetivo de bitrate y el archivo
 * sale más pesado que el original.
 */

/**
 * Pares que rotan bajo el título del hero, con la forma "Valor, qué vas a ver".
 *
 * El primero es la sede: es el único dato real de la lista, por eso encabeza y
 * es el que se expone a los lectores de pantalla.
 *
 * Las palabras de la IZQUIERDA no son inventadas: son los valores que la
 * organización declara en las consignas técnicas del desafío. Lo de la
 * DERECHA sí es ATENCION: PROVISORIO - baja cada valor abstracto a algo concreto que
 * el visitante pueda imaginar, pero hay que reemplazarlo por lo que la expo
 * realmente vaya a tener.
 *
 * Sin comas dentro de cada mitad: la coma es el separador visual de las dos
 * ranuras y una segunda coma rompería la lectura.
 */
export const HERO_PARES = [
  { izquierda: "Ciudad Cultural", derecha: "San Salvador de Jujuy" },
  { izquierda: "Innovación", derecha: "economía del conocimiento" },
  { izquierda: "Tecnología", derecha: "demos en vivo y prototipos" },
  { izquierda: "Producción", derecha: "minería, agro y litio" },
  { izquierda: "Vinculación empresarial", derecha: "rueda internacional de negocios" },
  { izquierda: "Desarrollo", derecha: "rondas de negocios" },
] as const;

/** Cuánto permanece visible cada par. */
export const HERO_ROTACION_MS = 3000;

export const HERO_MEDIA = {
  /** Se elige en el cliente según el viewport. Ver hero-video.tsx. */
  video: {
    movil: { src: "/media/hero-720.webm", type: "video/webm" },
    escritorio: { src: "/media/hero-1080.webm", type: "video/webm" },
    /** Fallback para navegadores sin VP9 (Safari viejo). */
    respaldo: { src: "/media/hero-1080.mp4", type: "video/mp4" },
  },
  poster: {
    src: "/media/hero-poster.jpg",
    ancho: 1920,
    alto: 1080,
  },
  /** Ancho a partir del cual conviene la variante de escritorio. */
  puntoDeCorte: "(min-width: 768px)",
} as const;
