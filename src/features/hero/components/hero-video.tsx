"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_MEDIA } from "../constants/media";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/lib/cn";

/**
 * Capa de video del hero.
 *
 * POR QUÉ EL `src` SE DECIDE EN JS Y NO CON `<source media="...">`
 * El atributo `media` en `<source>` existe en la especificación, pero los
 * navegadores solo lo evalúan al cargar y el soporte es despareja. Elegir el
 * archivo con `matchMedia` antes de asignar el src es determinista: en un
 * celular nunca se descargan los 3,2 MB de la variante de escritorio.
 *
 * POR QUÉ EL POSTER ES UNA <Image> APARTE Y NO EL ATRIBUTO `poster`
 * Con `poster` el navegador sirve el JPEG tal cual. Como imagen de Next, en
 * cambio, pasa por el optimizador y llega en AVIF/WebP, bastante más liviana.
 * Además puede marcarse `priority`, así es ella —y no el video— la que define
 * el LCP.
 *
 * El video se monta con `src` vacío y solo empieza a cargar después de que la
 * página quedó interactiva: es decoración, no debe competir con el contenido.
 */
export function HeroVideo() {
  const reducirMovimiento = usePrefersReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Con movimiento reducido el video no se carga en absoluto. No se muestra
    // "más quieto": no se descarga, que además ahorra megabytes a quien
    // probablemente tenga esa preferencia por buenos motivos.
    if (reducirMovimiento) return;
    const el = video.current;
    if (!el) return;

    const cargar = () => {
      const escritorio = window.matchMedia(HERO_MEDIA.puntoDeCorte).matches;
      const fuente = escritorio ? HERO_MEDIA.video.escritorio : HERO_MEDIA.video.movil;
      // Se prueba VP9 primero; si el navegador no lo reproduce, cae al MP4.
      const puedeWebm = el.canPlayType("video/webm; codecs=vp9") !== "";
      el.src = puedeWebm ? fuente.src : HERO_MEDIA.video.respaldo.src;
      el.load();
      // `play()` devuelve una promesa que rechaza si la política de
      // autoplay lo bloquea. Sin el catch, queda un error sin manejar en
      // consola que ensucia el diagnóstico de problemas reales.
      el.play().catch(() => {});
    };

    // requestIdleCallback deja que primero terminen el hero y la hidratación.
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(cargar, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(cargar, 400);
    return () => clearTimeout(id);
  }, [reducirMovimiento]);

  return (
    <video
      ref={video}
      // Decorativo: no aporta información que un lector de pantalla necesite.
      aria-hidden="true"
      muted
      loop
      playsInline
      preload="none"
      // `disablePictureInPicture` y el menú contextual desactivado evitan que
      // un fondo decorativo se comporte como un reproductor.
      disablePictureInPicture
      onCanPlay={() => setListo(true)}
      className={cn(
        "absolute inset-0 size-full object-cover",
        "transition-opacity duration-scene ease-standard",
        listo ? "opacity-100" : "opacity-0",
      )}
    />
  );
}
