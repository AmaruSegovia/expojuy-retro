import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import { useGiroMaqueta } from "../hooks/use-giro-maqueta";
import {
  ALTO_MARCO_U,
  ANGULO_EJE,
  ARENA,
  BLOQUES,
  CALLES_TRAZADO,
  HITO,
  PARCELA,
  PARCELA_RETICULA,
  PUNTOS,
  PUNTOS_RETICULA,
  RETICULA,
  ROTONDA,
  UNIDAD_CQI,
  VERDES,
  VIEW_BOX,
  rutaAPath,
} from "../constants/plano";

const ACCESO = "acceso";

/** Las cuatro paredes. Se dibujan todas porque al girar la maqueta cambian de
 *  lado; las que quedan de espaldas las tapan el techo y las de adelante. */
const PAREDES = ["norte", "sur", "este", "oeste"] as const;

/** Los cuatro cantos de la platea. */
const CANTOS = ["sur", "oeste", "norte", "este"] as const;

/** Atajo para las variables de geometría que viajan en el atributo `style`.
 *  Son DATOS, no estilo: la posición sale de `constants/plano.ts` y el CSS solo
 *  las multiplica por la unidad. */
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/**
 * LA MAQUETA DEL PREDIO.
 *
 * El plano de siempre, con volumen. Los edificios son cajas de cinco caras
 * sobre una platea con espesor, y el dibujo de línea sigue existiendo: es el
 * PISO, un `<svg>` acostado sobre el plano del suelo con sus calles, sus masas
 * verdes, la rotonda, la pista del polideportivo y el recorrido.
 *
 * EL ORDEN DEL ARREGLO ES EL Z-ORDER. `BLOQUES` viene ordenado por `x + y`
 * creciente desde `constants/plano.ts`. No hay ningún `z-index`: dentro de un
 * contexto 3D no ordena nada, y con los techos a la misma altura el navegador
 * cae en el orden del documento.
 *
 * LOS MARCADORES SIGUEN SIENDO BOTONES DE HTML. El `<svg>` va `aria-hidden`:
 * es el dibujo. Lo que se opera son `<button>` de verdad, ahora ubicados dentro
 * de la escena para que acompañen el giro, y que deshacen las dos rotaciones
 * para quedar siempre de frente, redondos y de 36px.
 */
export function MaquetaPredio({
  activo,
  ruta,
  onElegir,
}: {
  /** Id del lugar elegido en el riel. */
  activo: string;
  ruta: [number, number][] | null;
  onElegir: (indice: number) => void;
}) {
  const { maqueta, girada, usada, volver } = useGiroMaqueta();

  return (
    <div>
      {/* Lo que no entra se desplaza en horizontal, que es cómo se mira un
          mapa. Ver el piso de ancho en styles.css: es una cota de accesibilidad,
          no una decisión de composición. */}
      <div className="plano-scroll">
        <div className="plano-marco">
          <div
            ref={maqueta}
            className="plano-maqueta"
            style={vars({
              "--u": `${UNIDAD_CQI}cqi`,
              "--cols": RETICULA.columnas,
              "--filas": RETICULA.filas,
              "--alto-marco": ALTO_MARCO_U,
            })}
            tabIndex={0}
            role="group"
            aria-label="Maqueta del predio. Se gira arrastrándola o con las flechas del teclado; Inicio la devuelve a su posición."
          >
            <div className="plano-escena">
              <div className="plano-platea">
                {CANTOS.map((c) => (
                  <span key={c} aria-hidden="true" className={`plano-canto plano-canto--${c}`} />
                ))}
              </div>

              <div
                aria-hidden="true"
                className="plano-pavimento"
                style={vars({
                  "--px": PARCELA_RETICULA.x,
                  "--py": PARCELA_RETICULA.y,
                  "--pw": PARCELA_RETICULA.w,
                  "--ph": PARCELA_RETICULA.h,
                })}
              />

              <PisoDibujado ruta={ruta} destino={activo} />

              {BLOQUES.map((b, i) => (
                <div
                  key={b.id}
                  aria-hidden="true"
                  className="plano-bloque"
                  data-tipo={b.tipo}
                  data-senalado={b.punto === activo ? "" : undefined}
                  style={vars({
                    "--x": b.x,
                    "--y": b.y,
                    "--w": b.w,
                    "--h": b.h,
                    "--volumen": b.volumen,
                    "--i": i,
                  })}
                >
                  {/* La sombra va primero para pintarse debajo de todo. */}
                  <span className="plano-cara plano-cara--sombra" />
                  {PAREDES.map((p) => (
                    <span key={p} className={`plano-cara plano-cara--${p}`} />
                  ))}
                  <span className="plano-cara plano-cara--techo" />
                </div>
              ))}

              <span
                aria-hidden="true"
                className="plano-hito"
                style={vars({ "--hx": HITO.x, "--hy": HITO.y })}
              />

              {PUNTOS.map((p, i) => {
                const esActivo = p.id === activo;
                const lugar = PUNTOS_RETICULA[i];
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={esActivo}
                    onClick={() => onElegir(i)}
                    data-senalado={esActivo ? "" : undefined}
                    className="plano-punto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    style={vars({ "--x": lugar.x, "--y": lugar.y, "--z": lugar.z })}
                  >
                    <span className="sr-only-focusable">{p.nombre}</span>
                    {/* El pulso solo cuando el lugar activo ES el acceso: marca
                        de dónde arranca el recorrido. Se monta al activarse, y
                        montarse es lo que dispara la animación otra vez. */}
                    {esActivo && p.id === ACCESO && (
                      <span
                        aria-hidden="true"
                        className="mapa-pulso absolute size-4 rounded-full bg-accent"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block rounded-full border-2 transition-all duration-control ease-standard",
                        esActivo
                          ? "size-4 border-on-accent bg-accent"
                          : "size-3 border-surface-sunken bg-link",
                        p.id === ACCESO && !esActivo && "size-4 bg-primary",
                      )}
                    />
                    <span aria-hidden="true" className="plano-cartel">
                      {p.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MANDOS. La pista dice que se puede girar, hasta que alguien lo hace.
          El botón de vuelta aparece solo cuando la maqueta está girada. */}
      <div className="mt-3 flex min-h-9 flex-wrap items-center justify-center gap-3">
        {!usada && (
          <p className="plano-pista items-center gap-2 text-xs text-text-subtle">
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            >
              <path d="M2 10h16M5 6l-3 4 3 4M15 6l3 4-3 4" />
            </svg>
            Arrastrá para girar la maqueta
          </p>
        )}
        {girada && (
          <button
            type="button"
            onClick={volver}
            className="min-h-9 border border-border-strong px-3 text-xs font-semibold tracking-[0.12em] text-text uppercase transition-colors duration-micro ease-standard hover:border-link hover:text-link"
          >
            Vista inicial
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * EL PISO DIBUJADO.
 *
 * Es el plano de línea de siempre, acostado sobre el suelo de la maqueta. Se
 * conserva entero salvo los edificios, que ahora son volúmenes: si se
 * dibujaran también acá quedarían dos veces.
 *
 * MANDA EL TRAZO. Todo se dibuja con líneas finas de lavanda a distintas
 * opacidades -una sola familia de color, así el conjunto se lee como un sistema
 * y no como piezas sueltas- y el relleno es apenas un velo donde hace falta
 * distinguir una masa. Los espacios abiertos van en cian muy tenue, sin trazo:
 * lo construido tiene borde, lo abierto no.
 *
 * El relleno de la parcela ya no lo pinta el SVG sino la capa de pavimento que
 * va debajo, que además trae la retícula de replanteo: si lo pintara el SVG,
 * taparía esa retícula.
 *
 * El recorrido conserva el degradado lavanda a cian a opacidad plena: es lo
 * único saturado del dibujo, así que siempre gana.
 */
function PisoDibujado({ ruta, destino }: { ruta: [number, number][] | null; destino: string }) {
  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.ancho} ${VIEW_BOX.alto}`}
      className="plano-piso"
      preserveAspectRatio="none"
      // Trazos finos parejos: sin esto el navegador ajusta cada línea a la
      // grilla de píxeles y unas salen más gruesas que otras.
      shapeRendering="geometricPrecision"
      // El dibujo entero es decorativo: lo operable y lo legible son los
      // botones de HTML que van encima y el riel de al lado.
      aria-hidden="true"
    >
      <defs>
        {/* Todo lo de adentro se recorta contra el contorno. Sin esto las masas
            verdes -que son polígonos aproximados- se derraman fuera de la
            parcela y el plano parece mal dibujado. */}
        <clipPath id="recorte-parcela">
          <polygon points={PARCELA.map((p) => p.join(",")).join(" ")} />
        </clipPath>

        {/* `userSpaceOnUse` y no el `objectBoundingBox` por defecto: la caja de
            un tramo recto del recorrido puede tener ancho o alto CERO, y un
            elemento con caja degenerada que referencia un degradado en
            objectBoundingBox NO SE PINTA. No sale tenue: no sale. */}
        <linearGradient
          id="ruta-degradado"
          gradientUnits="userSpaceOnUse"
          x1={VIEW_BOX.x}
          y1={VIEW_BOX.y + VIEW_BOX.alto}
          x2={VIEW_BOX.x + VIEW_BOX.ancho}
          y2={VIEW_BOX.y}
        >
          <stop offset="0" style={{ stopColor: "var(--color-brand-lavender)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-brand-cyan)" }} />
        </linearGradient>
      </defs>

      <polygon
        points={PARCELA.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--color-brand-lavender)"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />

      <g clipPath="url(#recorte-parcela)">
        {/* CALLES. Bandas anchas al 7%: no se miran, pero se ven. Van primero
            para que todo lo demás se apoye encima, como en un plano de verdad,
            y van dentro del recorte para que no se derramen fuera. */}
        <g
          fill="none"
          stroke="var(--color-brand-lavender)"
          strokeOpacity="0.07"
          strokeLinecap="square"
        >
          <polygon
            points={PARCELA.map((p) => p.join(",")).join(" ")}
            fill="none"
            strokeWidth="22"
          />
          {CALLES_TRAZADO.map((calle, i) => (
            <polyline key={i} points={calle.map((p) => p.join(",")).join(" ")} strokeWidth="16" />
          ))}
          <circle cx={ROTONDA.centro[0]} cy={ROTONDA.centro[1]} r={ROTONDA.r} strokeWidth="16" />
        </g>

        {/* Las masas verdes llevan EL MISMO tono que el terreno de la platea, y
            no es coincidencia: lo abierto de adentro y lo abierto de afuera son
            la misma cosa, así que el pasto se lee continuo por debajo de la
            parcela pavimentada. */}
        {VERDES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map((p) => p.join(",")).join(" ")}
            fill="color-mix(in oklab, var(--color-brand-cyan) 8%, var(--color-surface))"
          />
        ))}

        {/* Filete de la rotonda, apenas por encima de la banda: marca el giro
            sin convertirse en un elemento más del dibujo. */}
        <circle
          cx={ROTONDA.centro[0]}
          cy={ROTONDA.centro[1]}
          r={ROTONDA.r}
          fill="none"
          stroke="var(--color-brand-lavender)"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* El polideportivo es una elipse porque en la traza real es una pista
            ovalada: se queda en el piso, sin volumen, como corresponde a una
            pista. */}
        <ellipse
          cx={ARENA.centro[0]}
          cy={ARENA.centro[1]}
          rx={ARENA.rx}
          ry={ARENA.ry}
          transform={`rotate(${ANGULO_EJE} ${ARENA.centro[0]} ${ARENA.centro[1]})`}
          fill="color-mix(in oklab, var(--color-brand-cyan) 12%, var(--color-surface))"
          stroke="var(--color-brand-cyan)"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
      </g>

      {/* RECORRIDO. `key` con el destino a propósito: al cambiar de lugar el
          elemento se reemplaza y la animación de dibujado vuelve a empezar.
          Sin eso, el trazo nuevo aparecería ya dibujado. */}
      {ruta && (
        <path
          key={destino}
          className="mapa-ruta"
          d={rutaAPath(ruta)}
          fill="none"
          stroke="url(#ruta-degradado)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          // Normaliza el largo a 1 para dibujarlo con dashoffset sin que ningún
          // JavaScript tenga que medir el path.
          pathLength="1"
        />
      )}
    </svg>
  );
}
