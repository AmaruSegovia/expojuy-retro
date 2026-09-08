/**
 * Claves de almacenamiento del navegador.
 *
 * Este módulo es deliberadamente NEUTRAL: no lleva "use client" ni "use server".
 * Es importado tanto por el layout (Server Component) como por el page loader
 * (Client Component), y ese es justamente el motivo de que exista.
 *
 * Si estas constantes vivieran en el módulo del loader -que sí es cliente-, el
 * layout recibiría un *proxy de referencia de cliente* en vez del string, y al
 * interpolarlo en el script inline emitiría código roto. Ya pasó: el script
 * quedaba con `sessionStorage.getItem("function() { throw new Err...` y moría
 * al parsearse, dejando sin efecto tanto la clase `js` como el loader.
 */
export const STORAGE_KEYS = {
  /** Marca que la pantalla de carga ya se mostró en esta pestaña. */
  loaderVisto: "expojuy:loader-visto",
} as const;
