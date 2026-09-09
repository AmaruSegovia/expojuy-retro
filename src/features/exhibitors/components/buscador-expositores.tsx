"use client";

import { useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Chip } from "./chip";
import {
  EXPOSITORES,
  EXPOSITORES_TOTAL,
  RUBRO_ETIQUETA,
  RUBRO_TONO,
  type Rubro,
} from "../constants/expositores";
import {
  filtrarExpositores,
  indexarExpositores,
  iniciales,
  rubrosDe,
  type ExpositorIndexado,
  type FiltrosExpositor,
} from "../lib/filtrar-expositores";

/**
 * BUSCADOR DE EXPOSITORES - campo de texto y chips de rubro sobre una lista.
 *
 * MEJORA PROGRESIVA: LA LISTA SE SIRVE COMPLETA
 *
 * El estado inicial no filtra nada, así que el HTML que sale del servidor trae
 * las dieciséis filas. Sin JavaScript esto sigue siendo el listado entero de
 * expositores: se pierde el filtro, que es la mejora, no el contenido.
 *
 * ES LA ÚNICA PARTE CLIENTE DE LA SECCIÓN. El encabezado y el marco viven en
 * un Server Component; acá abajo hay estado, así que acá abajo empieza el
 * `"use client"` y no antes.
 *
 * TODO EL FILTRADO ES UNA FUNCIÓN PURA, en `../lib/filtrar-expositores`. Este
 * componente solo guarda los filtros y dibuja el resultado.
 */

const FILTROS_INICIALES: FiltrosExpositor = { texto: "", rubro: null };

/**
 * Índice y chips se calculan UNA VEZ, a nivel de módulo: `EXPOSITORES` es una
 * constante, así que el resultado no puede cambiar entre renders y no tiene
 * sentido recalcularlo en cada uno.
 */
const INDICE = indexarExpositores(EXPOSITORES);
const RUBROS_PRESENTES = rubrosDe(EXPOSITORES);

/**
 * Los cuatro rellenos del monograma, con su par de texto ya resuelto.
 *
 * Están acá y no en los datos para que un rubro nuevo no pueda meter un color
 * inventado: el dato elige un índice, y los colores posibles son estos.
 * Contraste del texto sobre su relleno, medido:
 *   0 blanco sobre violeta 5.05:1 · 1 superficie sobre cian 9.02:1
 *   2 on-brand-light sobre lavanda 7.83:1 · 3 blanco sobre violeta profundo 7.21:1
 *
 * El violeta profundo aparece SOLO como relleno. Como texto da 2.74:1 y el
 * sistema lo prohíbe; debajo de blanco es un fondo válido.
 */
const TONOS = [
  "bg-primary text-on-primary",
  "bg-accent text-on-accent",
  "bg-brand-lavender text-on-brand-light",
  "bg-brand-violet-deep text-on-primary",
] as const;

/** Píldora secundaria. Mismo vocabulario que el resto del sitio. */
const BOTON_SECUNDARIO = cn(
  "inline-flex min-h-9 items-center rounded-full border border-border-strong px-5 py-2",
  "text-sm font-semibold text-text-muted transition-colors duration-micro ease-standard",
  "hover:border-link hover:text-link",
);

export function BuscadorExpositores() {
  const [filtros, setFiltros] = useState<FiltrosExpositor>(FILTROS_INICIALES);
  const idBusqueda = useId();

  // Un solo objeto de estado y no dos `useState`: el memo depende de una sola
  // referencia y el reset es una asignación.
  const resultados = useMemo(() => filtrarExpositores(INDICE, filtros), [filtros]);
  const filtrando = filtros.texto !== "" || filtros.rubro !== null;

  const setTexto = (texto: string) => setFiltros((actual) => ({ ...actual, texto }));
  const setRubro = (rubro: Rubro | null) => setFiltros((actual) => ({ ...actual, rubro }));
  const limpiar = () => setFiltros(FILTROS_INICIALES);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-end">
        <div className="relative">
          {/* LABEL DE VERDAD, no `aria-label`: un label asociado también
              agranda el área de click y sobrevive a la traducción automática,
              que se come los atributos. Oculto porque el placeholder ya dice
              lo mismo en pantalla. */}
          <label htmlFor={idBusqueda} className="sr-only">
            Buscar expositor por nombre, ciudad o rubro
          </label>
          <input
            id={idBusqueda}
            type="search"
            value={filtros.texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Nombre, ciudad o rubro"
            // Sin esto el desplegable de autocompletado del navegador tapa los
            // chips justo cuando se está por elegir uno.
            autoComplete="off"
            className={cn(
              "expositores__campo w-full border-b border-border-strong bg-transparent",
              "py-4 pe-10 text-lg text-text placeholder:text-text-subtle",
              "transition-colors duration-micro ease-standard focus:border-accent",
            )}
          />

          {/* LIMPIAR EL CAMPO, CON NOMBRE ACCESIBLE.
              Reemplaza a la cruz nativa de `type="search"`, que se apaga por
              CSS. La nativa no tiene nombre para un lector de pantalla, no se
              alcanza con el tabulador y su color lo decide el navegador; ver
              styles.css para el detalle del bug que traía el original. */}
          {filtros.texto !== "" && (
            <button
              type="button"
              onClick={limpiar}
              className={cn(
                "absolute end-0 bottom-2 grid size-9 place-items-center",
                "text-text-muted transition-colors duration-micro ease-standard hover:text-link",
              )}
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Limpiar la búsqueda</span>
            </button>
          )}
        </div>

        {/* Grupo de interruptores, no de pestañas: cada chip recorta la misma
            lista. El `role="group"` con nombre es lo que hace que el lector de
            pantalla anuncie para qué sirven los botones que siguen. */}
        <div role="group" aria-label="Filtrar por rubro" className="flex flex-wrap gap-2">
          <Chip presionado={filtros.rubro === null} onClick={() => setRubro(null)}>
            Todos
          </Chip>
          {RUBROS_PRESENTES.map((rubro) => (
            <Chip key={rubro} presionado={filtros.rubro === rubro} onClick={() => setRubro(rubro)}>
              {RUBRO_ETIQUETA[rubro]}
            </Chip>
          ))}
        </div>
      </div>

      {/* `role="status"` es lo que convierte el filtro en algo usable sin ver
          la pantalla: cada cambio anuncia cuántos resultados quedaron, sin
          interrumpir lo que se esté leyendo. */}
      <p role="status" className="mt-8 text-sm text-text-muted">
        {resultados.length === EXPOSITORES.length
          ? `Mostrando ${resultados.length} expositores destacados`
          : `${resultados.length} de ${EXPOSITORES.length} expositores`}
      </p>

      {resultados.length > 0 ? (
        <ul
          // `role="list"` explícito: sin viñetas, Safari deja de anunciar la
          // lista como lista.
          role="list"
          className="mt-4 grid border-t border-border lg:grid-cols-2 lg:gap-x-12"
        >
          {resultados.map((expositor) => (
            <FilaExpositor key={expositor.id} expositor={expositor} />
          ))}
        </ul>
      ) : (
        <div className="mt-4 grid justify-items-start gap-4 border-y border-border py-12">
          <p className="text-lg font-bold text-text">No hay expositores con esa búsqueda.</p>
          <p className="max-w-prose text-base text-pretty text-text-muted">
            Probá con otro nombre, otra ciudad o sacá el filtro de rubro.
          </p>
          <button type="button" onClick={limpiar} className={BOTON_SECUNDARIO}>
            Limpiar la búsqueda
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        {filtrando && (
          <button type="button" onClick={limpiar} className={BOTON_SECUNDARIO}>
            Limpiar filtros
          </button>
        )}
        {/* El aviso es VISIBLE y no un comentario en el código: la lista es una
            muestra de maqueta y el total es una estimación. */}
        <p className="max-w-prose text-xs text-text-subtle">
          Muestra de {EXPOSITORES.length} expositores sobre los {EXPOSITORES_TOTAL} previstos.
          Listado provisorio, sujeto a confirmación de la organización.
        </p>
      </div>
    </div>
  );
}

function FilaExpositor({ expositor }: { expositor: ExpositorIndexado }) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4">
      {/* Decorativo: el nombre completo está al lado, así que las iniciales no
          agregan información y repetirlas sería ruido para un lector. */}
      <span
        aria-hidden="true"
        className={cn(
          "grid size-13 shrink-0 place-items-center text-base font-bold tracking-wide",
          TONOS[RUBRO_TONO[expositor.rubro]],
        )}
      >
        {iniciales(expositor.nombre)}
      </span>

      {/* `min-w-0` es lo que evita que un nombre largo estire su columna y
          desarme la grilla: un ítem de grilla se niega a achicarse por debajo
          de su contenido hasta que se lo permite. */}
      <div className="grid min-w-0 gap-0.5">
        <h3 className="text-base font-semibold text-text">{expositor.nombre}</h3>
        <p className="flex flex-wrap gap-x-3 text-sm text-text-muted">
          <span>{RUBRO_ETIQUETA[expositor.rubro]}</span>
          <span>{expositor.ciudad}</span>
        </p>
      </div>

      <p className="text-xs font-semibold whitespace-nowrap text-text-muted">
        Stand {expositor.stand}
      </p>
    </li>
  );
}
