import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { HeroVideo } from "./hero-video";
import { HERO_MEDIA } from "../constants/media";
import { HeroRotador } from "./hero-rotador";
import { Reveal } from "@/shared/components/motion/reveal";
import { SITE } from "@/shared/constants/site";

/**
 * Inicio institucional. A sangre completa y a alto de viewport, como pide el
 * plan: el tope de 1024px aplica al contenido, no al hero.
 *
 * ORDEN DE CAPAS (de atrás hacia adelante)
 *   1. Poster - imagen optimizada por Next, marcada `priority`. Es el LCP.
 *   2. Video  - se carga después de la hidratación y aparece con un fundido.
 *   3. Velo   - degradados que garantizan el contraste del texto.
 *   4. Texto  - dentro del contenedor de 1024px.
 *
 * El velo no es decorativo: sin él, el texto cae sobre una ciudad nocturna
 * llena de luces y el contraste deja de estar garantizado en las zonas claras.
 * Con el velo el peor caso queda acotado por el color del velo, no por el
 * frame que toque.
 *
 * Los valores salen de MEDIR el peor píxel detrás de cada bloque de texto
 * sobre frames reales del video, no de estimar. Con el velo al 55% la sede
 * daba 3.60:1: alcanza en escritorio (24px cuenta como texto grande, umbral
 * 3:1) pero NO en móvil, donde la escala fluida la baja a 19.2px y el umbral
 * sube a 4.5:1. Por eso el velo subió a 64% y la sede dejó de usar el color
 * apagado: sobre una foto, el gris atenuado es el error - la jerarquía la dan
 * el tamaño y el peso, no bajar el contraste.
 */
export function HeroSection() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-titulo"
      className="relative isolate grid min-h-dvh place-items-center overflow-hidden"
    >
      {/* 1 · Poster */}
      <Image
        src={HERO_MEDIA.poster.src}
        alt=""
        width={HERO_MEDIA.poster.ancho}
        height={HERO_MEDIA.poster.alto}
        priority
        // Ocupa el ancho completo del viewport: así el optimizador no sirve
        // una variante pensada para el contenedor de 1024px.
        sizes="100vw"
        className="absolute inset-0 -z-20 size-full object-cover"
      />

      {/* 2 · Video */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <HeroVideo />
      </div>

      {/* 3 · Velo. Dos capas con roles distintos:
             - un oscurecido parejo que acota el peor caso de contraste,
             - un degradado vertical que ancla el texto y funde con la sección
               siguiente sin un corte duro.

             Hubo una tercera capa con un tinte violeta (mix-blend-color) para
             integrar el clip con la paleta. Se quitó: teñía toda la imagen y
             mataba los ámbares de las calles y los azules de los edificios,
             que son justamente lo que hace creíble una toma nocturna. La
             unidad cromática la aportan el oscurecido y el degradado, sin
             falsear los colores del material. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-surface-sunken/64" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-surface-sunken/70 via-surface-sunken/30 to-surface-sunken"
      />

      {/* 4 · Contenido */}
      <div className="container-content py-28 text-center">
        <Reveal as="p" className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
          {SITE.dates.label}
        </Reveal>

        <Reveal
          as="h1"
          delay={80}
          id="hero-titulo"
          className="mt-6 text-5xl font-bold text-balance text-text"
        >
          {SITE.name}
        </Reveal>

        <Reveal as="div" delay={160} className="mt-6">
          <HeroRotador className="mx-auto max-w-2xl text-lg text-text" />
        </Reveal>

        <Reveal delay={240} className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#sobre"
            className="rounded-full border border-border-strong bg-surface/60 px-7 py-3.5 text-sm font-semibold text-text backdrop-blur-sm transition-colors duration-micro ease-standard hover:border-link hover:text-link"
          >
            Explorar la expo
          </a>
          <a
            href="#entradas"
            className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-on-primary transition-colors duration-micro ease-standard hover:bg-primary-hover active:bg-primary-active"
          >
            Comprar entradas
          </a>
        </Reveal>
      </div>

      {/* Indicador de scroll. Decorativo: el enlace real para avanzar es el
          botón "Explorar la expo", que sí es alcanzable con el teclado. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-8 flex justify-center text-text-subtle"
      >
        <ArrowDown size={20} className="animate-bounce" />
      </div>
    </section>
  );
}
