import { ImageResponse } from "next/og";
import { BRAND_BADGE_DATA_URI } from "@/shared/components/brand/brand-mark-paths";

/** Se genera una vez en el build: la geometría no cambia entre pedidos. */
export const dynamic = "force-static";

const LADO = 96;

/**
 * Insignia de las notificaciones push: la J en un solo color sobre
 * transparente. Ver `construirInsignia` en brand-mark-paths.ts por qué Android
 * la necesita así.
 */
export function GET() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- ImageResponse rasteriza JSX con Satori; next/image no existe en ese contexto.
    <img src={BRAND_BADGE_DATA_URI} width={LADO} height={LADO} alt="" />,
    { width: LADO, height: LADO },
  );
}
