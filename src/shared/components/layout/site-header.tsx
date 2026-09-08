"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { NAV_SECTIONS, SITE } from "@/shared/constants/site";
import { useActiveSection } from "@/shared/hooks/use-active-section";
import { cn } from "@/shared/lib/cn";

/**
 * Navegación principal. A sangre completa, como pide el plan — el tope de
 * 1024px aplica al contenido, no al chrome del sitio.
 *
 * La lista de secciones sale de NAV_SECTIONS, el mismo array que ordena las
 * secciones de la página. Un solo origen para el menú y para el documento:
 * no pueden desincronizarse.
 */
export function SiteHeader() {
  const [compacto, setCompacto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenu = useRef<HTMLButtonElement>(null);

  const ids = useMemo(() => NAV_SECTIONS.map((s) => s.id), []);
  const [activo, setActivo] = useActiveSection(ids);

  // El header se compacta apenas se sale del hero. Igual que en la barra de
  // progreso, esto no puede correr un setState por frame: solo actualizamos
  // cuando el booleano realmente cambia de valor.
  useLenis((lenis) => {
    const deberia = lenis.scroll > 80;
    setCompacto((actual) => (actual === deberia ? actual : deberia));
  });

  // Escape cierra el menú y devuelve el foco al botón que lo abrió.
  // Sin ese retorno de foco, el teclado queda huérfano al final del documento.
  useEffect(() => {
    if (!menuAbierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuAbierto(false);
      botonMenu.current?.focus();
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [menuAbierto]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-[background-color,backdrop-filter,border-color]",
        "border-b duration-control ease-standard",
        compacto
          ? "border-border bg-surface/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[var(--alto-nav)] max-w-[var(--container-wide)] items-center justify-between gap-4 px-5 sm:px-10">
        <a
          href="#inicio"
          onClick={() => setActivo("inicio")}
          className="flex shrink-0 items-center gap-3"
          aria-label={`${SITE.name} — ir al inicio`}
        >
          <BrandMark className="h-8 w-auto sm:h-9" />
          <span className="sr-only">{SITE.name}</span>
        </a>

        {/* Navegación de escritorio */}
        <nav aria-label="Navegación principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_SECTIONS.map((s) => {
              const esActivo = activo === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    // Marca el ítem al instante: el scroll suave tarda ~1s en
                    // llegar y el observer no dispararía hasta entonces.
                    onClick={() => setActivo(s.id)}
                    // `location` es el valor de aria-current para "dónde estoy
                    // dentro de este documento". Los lectores que no lo
                    // conozcan lo tratan como "true", que también es correcto.
                    aria-current={esActivo ? "location" : undefined}
                    className={cn(
                      "relative px-3 py-2 text-sm transition-colors duration-micro ease-standard",
                      esActivo ? "text-text" : "text-text-muted hover:text-text",
                    )}
                  >
                    {s.label}
                    {esActivo && (
                      <span
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-link"
                        aria-hidden
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#entradas"
            onClick={() => setActivo("entradas")}
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors duration-micro ease-standard hover:bg-primary-hover active:bg-primary-active sm:inline-flex"
          >
            Comprar entradas
          </a>

          <button
            ref={botonMenu}
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            className="grid size-11 place-items-center rounded-full border border-border-strong text-text transition-colors duration-micro hover:bg-surface-raised lg:hidden"
          >
            {/* El icono es decorativo: el nombre accesible lo da el texto de abajo. */}
            {menuAbierto ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            <span className="sr-only">{menuAbierto ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>
      </div>

      {/* Panel móvil. Se mantiene en el DOM con `hidden` en vez de desmontarse
          para que aria-controls apunte siempre a un elemento existente. */}
      <div
        id="menu-movil"
        hidden={!menuAbierto}
        className="border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
      >
        <nav aria-label="Navegación principal móvil" className="px-5 py-4 sm:px-10">
          <ul className="flex flex-col">
            {NAV_SECTIONS.map((s) => {
              const esActivo = activo === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => {
                      setActivo(s.id);
                      setMenuAbierto(false);
                    }}
                    aria-current={esActivo ? "location" : undefined}
                    className={cn(
                      "flex items-center gap-3 border-b border-border py-3 text-base transition-colors last:border-b-0",
                      esActivo ? "text-text" : "text-text-muted hover:text-text",
                    )}
                  >
                    {/* En móvil el subrayado no se lee bien en una lista
                        vertical: el activo se marca con un punto al costado. */}
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        esActivo ? "bg-link" : "bg-transparent",
                      )}
                      aria-hidden
                    />
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <a
            href="#entradas"
            onClick={() => {
              setActivo("entradas");
              setMenuAbierto(false);
            }}
            className="mt-4 block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover sm:hidden"
          >
            Comprar entradas
          </a>
        </nav>
      </div>
    </header>
  );
}
