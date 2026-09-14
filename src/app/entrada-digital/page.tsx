import type { Metadata } from "next";
import { EntradaDigital } from "@/features/entrada-digital/components/entrada-digital";

/**
 * Vista de una entrada, a la que lleva la notificación de compra.
 *
 * `noindex` y fuera del sitemap: es la pantalla de una entrada, no una página
 * para encontrar en un buscador.
 */
export const metadata: Metadata = {
  title: "Entrada digital",
  description: "Tu entrada con el código QR de acceso a ExpoJuy 2026.",
  robots: { index: false, follow: false },
};

export default function EntradaDigitalPage() {
  return <EntradaDigital />;
}
