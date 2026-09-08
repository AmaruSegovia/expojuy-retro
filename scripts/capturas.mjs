/**
 * Capturas del sitio para los documentos imprimibles.
 *
 * POR QUÉ NO ALCANZA `chrome --screenshot`: ese modo fotografía la parte de
 * arriba del documento y nada más. Acá hacen falta tres secciones distintas, y
 * además hay que forzar el revelado de las apariciones antes de disparar,
 * porque el observador que las enciende depende de que el navegador dibuje.
 *
 * Se habla con Chrome por CDP a mano, sin Puppeteer: Node 22 ya trae WebSocket
 * global, así que no hace falta sumar una dependencia al proyecto para tres
 * fotos.
 *
 * Chrome captura WebP de forma nativa, o sea que no hace falta convertir nada
 * después: `Page.captureScreenshot` con `format: "webp"` ya devuelve el base64
 * listo para embeber.
 *
 * Uso: node scripts/capturas.mjs [origen]
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const SALIDA = path.join(ROOT, "docs", "propuesta", ".partes");
const ORIGEN = process.argv[2] ?? "http://localhost:4173";
const PUERTO_CDP = 9222;
const PERFIL = path.join(ROOT, ".cache", "chrome-capturas");

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const ANCHO = 1280;
const ALTO = 800;

/**
 * Las tres tomas del documento. `alt` no es decorativo: el HTML imprimible se
 * lee también en pantalla y la imagen tiene que describirse sola.
 */
const TOMAS = [
  {
    archivo: "img-inicio.part",
    ancla: null,
    alt: "Inicio del sitio: video aéreo de fondo, título ExpoJuy 2026 y dos llamadas a la acción.",
  },
  {
    archivo: "img-mapa.part",
    ancla: "mapa",
    alt: "Sección Mapa: maqueta isométrica del predio con volumen, sombras y marcadores de lugar.",
  },
  {
    archivo: "img-entradas.part",
    ancla: "entradas",
    alt: "Sección Entradas: pestañas de tipo de entrada, precio de referencia y collage de láminas.",
  },
];

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function objetivo() {
  for (let i = 0; i < 60; i++) {
    try {
      const lista = await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/list`).then((r) => r.json());
      const pagina = lista.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch {
      /* Chrome todavía no levantó su endpoint */
    }
    await esperar(250);
  }
  throw new Error("Chrome no expuso el endpoint de depuración");
}

/** Cliente CDP mínimo: un id incremental y un mapa de promesas pendientes. */
function conectar(url) {
  const ws = new WebSocket(url);
  const pendientes = new Map();
  let id = 0;
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    const p = pendientes.get(msg.id);
    if (!p) return;
    pendientes.delete(msg.id);
    if (msg.error) p.rechazar(new Error(msg.error.message));
    else p.resolver(msg.result);
  });
  const listo = new Promise((ok, mal) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", () => mal(new Error("no se pudo abrir el WebSocket")), {
      once: true,
    });
  });
  const enviar = (method, params = {}) =>
    new Promise((resolver, rechazar) => {
      const propio = ++id;
      pendientes.set(propio, { resolver, rechazar });
      ws.send(JSON.stringify({ id: propio, method, params }));
    });
  return { listo, enviar, cerrar: () => ws.close() };
}

async function main() {
  await mkdir(SALIDA, { recursive: true });
  await rm(PERFIL, { recursive: true, force: true });

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PUERTO_CDP}`,
      `--user-data-dir=${PERFIL}`,
      `--window-size=${ANCHO},${ALTO}`,
      "--hide-scrollbars",
      "--disable-gpu",
      "--no-first-run",
      "--autoplay-policy=no-user-gesture-required",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const cdp = conectar(await objetivo());
  await cdp.listo;

  try {
    await cdp.enviar("Page.enable");
    await cdp.enviar("Runtime.enable");
    await cdp.enviar("Emulation.setDeviceMetricsOverride", {
      width: ANCHO,
      height: ALTO,
      deviceScaleFactor: 2,
      mobile: false,
    });

    for (const toma of TOMAS) {
      await cdp.enviar("Page.navigate", { url: ORIGEN });
      // El loader de la primera visita tapa la pantalla: se espera a que
      // termine y recién ahí se posiciona.
      await esperar(4500);

      await cdp.enviar("Runtime.evaluate", {
        expression: `
          document.querySelectorAll('[data-reveal]').forEach(e => e.dataset.reveal = 'shown');
          ${
            toma.ancla
              ? `(() => { const s = document.getElementById('${toma.ancla}');
                   window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 88); })();`
              : "window.scrollTo(0, 0);"
          }
        `,
        awaitPromise: false,
      });
      await esperar(1800);

      const { data } = await cdp.enviar("Page.captureScreenshot", {
        format: "webp",
        quality: 82,
        captureBeyondViewport: false,
      });

      const html = `    <img src="data:image/webp;base64,${data}" alt="${toma.alt}">\n`;
      await writeFile(path.join(SALIDA, toma.archivo), html, "utf8");
      const kb = Math.round(html.length / 1024);
      console.log(`${toma.archivo.padEnd(20)} ${String(kb).padStart(4)} KB`);
    }
  } finally {
    cdp.cerrar();
    chrome.kill();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
