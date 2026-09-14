/**
 * Ejecuta `callback` cuando la pantalla de carga se retiró, o en el acto si
 * no se mostró. Devuelve la función que cancela la espera.
 *
 * Lee el atributo `data-loader` del <html>, que es el contrato que ya comparten
 * el script de arranque, el CSS y el loader. No hace falta un evento propio:
 * el atributo desaparece exactamente cuando el loader terminó.
 *
 * Existe para que el trabajo pesado que no se ve detrás del overlay no compita
 * con él. Medido con la CPU 6x más lenta: el video del hero arrancaba justo
 * cuando empezaba la salida del loader, y los pintados por tramo de 250ms
 * pasaban de ~30 a ~90.
 */
export function alTerminarLoader(callback: () => void): () => void {
  const raiz = document.documentElement;
  if (!raiz.hasAttribute("data-loader")) {
    callback();
    return () => {};
  }

  const observador = new MutationObserver(() => {
    if (raiz.hasAttribute("data-loader")) return;
    observador.disconnect();
    callback();
  });
  observador.observe(raiz, { attributes: true, attributeFilter: ["data-loader"] });
  return () => observador.disconnect();
}
