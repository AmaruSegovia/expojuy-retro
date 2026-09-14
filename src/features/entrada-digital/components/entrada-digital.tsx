import Link from "next/link";
import { BrandMark } from "@/shared/components/brand/brand-mark";
import { SITE } from "@/shared/constants/site";
import { QrAcceso } from "./qr-acceso";

/**
 * ENTRADA DIGITAL - la vista a la que lleva la notificación de compra.
 *
 * Server Component entero: no tiene estado ni efectos, así que no suma
 * JavaScript al cliente.
 *
 * SIN ENCABEZADO NI ISLA DEL SITIO. Sus enlaces son anclas de la página de
 * inicio (`#agenda`, `#mapa`) y acá no llevarían a ningún lado. La vista tiene
 * la J enlazada al inicio y un enlace explícito para volver, nada más: es una
 * pantalla para mostrar en un acceso, no para navegar.
 *
 * EL FONDO ES EL MORADO DEL LOADER, `--color-loader-backdrop`, para que la
 * entrada se lea como una pieza de la marca y no como una página más del sitio.
 * Los textos siguen en los tokens de tinta y pasan con margen; medido contra
 * #230048: `text` 14,55:1, `text-muted` 6,84:1, `border-strong` 3,36:1 y el
 * anillo de foco lavanda 7,13:1.
 *
 * EL QR VA SOBRE PAPEL aunque la página sea oscura. Un lector de QR espera
 * módulos oscuros sobre fondo claro; `.en-papel` reasigna los tokens y el QR
 * los toma sin saber sobre qué superficie está.
 */
export function EntradaDigital() {
  return (
    <main
      id="contenido-principal"
      className="grid min-h-dvh place-items-center bg-loader-backdrop px-5 py-12"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <Link
          href="/"
          aria-label={`Volver al inicio de ${SITE.name}`}
          className="inline-block focus-visible:outline-focus-ring"
        >
          <BrandMark className="h-14 w-auto" />
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-balance text-text">
          Bienvenido a la {SITE.name}
        </h1>
        <p className="mt-3 text-base text-pretty text-text-muted">
          ¡Ya podés usar tu código QR de acceso en los puntos de entrada habilitados!
        </p>

        {/* Sin utilidad de fondo: `.en-papel` ya pinta el suyo, y como vive
            fuera de las capas le ganaría a cualquier `bg-*`. */}
        <div className="en-papel mt-8 w-full max-w-[18rem] border border-border p-3">
          <QrAcceso className="block w-full" />
        </div>

        <p className="mt-6 text-sm text-text-muted">
          {SITE.dates.label}
          <br />
          {SITE.venue}
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-full border border-border-strong px-6 text-sm font-semibold text-text transition-colors duration-micro ease-standard hover:border-link hover:text-link"
        >
          Volver al sitio
        </Link>
      </div>
    </main>
  );
}
