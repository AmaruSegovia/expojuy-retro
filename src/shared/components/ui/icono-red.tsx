import type { RedSocialId } from "@/shared/constants/site";

/**
 * Glifos de las redes sociales.
 *
 * POR QUÉ ESTÁN TRANSCRITOS Y NO IMPORTADOS
 *
 * lucide-react, que es la biblioteca de íconos del sitio, RETIRÓ los íconos de
 * marca en su versión 1: tiene 4132 glifos y ninguno de Instagram, Facebook,
 * LinkedIn ni YouTube. Se verificó sobre la versión instalada, no se supuso.
 *
 * Las alternativas eran sumar un paquete entero de íconos para usar cuatro, o
 * transcribirlos. Se transcriben, que además es lo que este repositorio ya hace
 * con la geometría del isologotipo (ver brand-mark-paths.ts): cero dependencias
 * nuevas y el trazado queda a la vista para poder auditarlo.
 *
 * PROCEDENCIA Y LICENCIA
 *
 * Los `d` son los de Tabler Icons (Paweł Kuna), licencia MIT, en su variante de
 * contorno sobre lienzo de 24. Tabler ya figura como fuente de pictogramas en
 * la sección de licencias del README, así que no incorpora un tercero nuevo.
 *
 * Los NOMBRES y las FORMAS de las plataformas son marcas registradas de sus
 * dueños. Acá se usan como lo que son, el enlace al perfil de la organización
 * en cada una, que es el uso nominativo que las propias guías de marca
 * contemplan. No se alteran ni se integran al isologotipo de ExpoJuy.
 *
 * EL REMATE COINCIDE CON EL DEL RESTO DEL SITIO Y NO POR CASUALIDAD: Tabler
 * dibuja en lienzo de 24 con `stroke-width: 2` y remate `round` en punta y
 * unión, que es exactamente el criterio de lucide que la barra móvil ya fijó
 * para todo el sitio. Los cuatro conviven con los de lucide sin retocarlos.
 */
const TRAZOS: Record<RedSocialId, readonly string[]> = {
  instagram: [
    "M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z",
    "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    "M16.5 7.5l0 .01",
  ],
  facebook: ["M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3"],
  linkedin: [
    "M8 11l0 5",
    "M8 8l0 .01",
    "M12 16l0 -5",
    "M16 16v-3a2 2 0 0 0 -4 0",
    "M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z",
  ],
  youtube: [
    "M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z",
    "M10 9l5 3l-5 3z",
  ],
};

type IconoRedProps = {
  red: RedSocialId;
  /** Lado en píxeles. 18 acompaña a `text-sm` sin pasarle por encima. */
  size?: number;
  className?: string;
};

/**
 * Es Server Component: no tiene estado ni eventos, así que el SVG viaja ya
 * resuelto en el HTML y no suma nada al bundle del cliente.
 *
 * `aria-hidden` SIEMPRE, y no es una omisión: el ícono nunca va solo. Lo
 * acompaña el usuario en texto, y el nombre de la red está en el nombre
 * accesible del enlace que lo contiene. Anunciarlo acá lo diría dos veces.
 *
 * `currentColor` en el trazo es lo que lo hace funcionar en las dos familias
 * de superficie del sitio: hereda el color del enlace, así que en papel y en
 * tinta acierta sin saber sobre cuál está.
 */
export function IconoRed({ red, size = 18, className }: IconoRedProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {TRAZOS[red].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
