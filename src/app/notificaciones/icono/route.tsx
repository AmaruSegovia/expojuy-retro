import { ImageResponse } from "next/og";
import { BRAND_ICON_DATA_URI } from "@/shared/components/brand/brand-mark-paths";

/** Se genera una vez en el build: la geometría no cambia entre pedidos. */
export const dynamic = "force-static";

const LADO = 192;

/**
 * Ícono de las notificaciones push: la J a color sobre la superficie oscura.
 *
 * Es el MISMO dibujo que el favicon, rasterizado a 192px, y no un PNG copiado:
 * sale de `BRAND_ICON_DATA_URI`, que a su vez sale de la geometría oficial.
 * Hace falta un PNG porque Android no dibuja un SVG como ícono de
 * notificación.
 */
export function GET() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse rasteriza JSX con Satori; next/image no existe en ese contexto.
    <img src={BRAND_ICON_DATA_URI} width={LADO} height={LADO} alt="" />,
    { width: LADO, height: LADO },
  );
}
