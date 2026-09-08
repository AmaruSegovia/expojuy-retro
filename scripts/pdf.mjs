/**
 * Genera los PDF entregables a partir de los HTML imprimibles.
 *
 * POR QUÉ CDP Y NO `chrome --print-to-pdf`: el flag de línea de comandos no
 * expone `printBackground`, y sin fondos el documento pierde exactamente lo
 * que lo hace legible, que son las superficies de color sobre las que se
 * apoyan los bloques. Por CDP se puede pedir explícitamente.
 *
 * LOS MÁRGENES LOS PONE EL CSS. `@page { margin: 12mm 12mm 16mm }` ya está en
 * la hoja de los documentos, así que acá se piden márgenes en cero: si se
 * declararan en los dos lados, se sumarían y el ancho útil dejaría de ser los
 * 186mm para los que está calculada la caja de texto.
 *
 * Uso: node scripts/pdf.mjs
 */
import { spawn } from "node:child_process";
import { writeFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs", "propuesta");
const PERFIL = path.join(ROOT, ".cache", "chrome-pdf");
const PUERTO_CDP = 9223;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const DOCUMENTOS = [
  { fuente: "memoria-descriptiva-purple.html", salida: "ExpoJuy2026-MemoriaDescriptiva.pdf" },
  { fuente: "declaracion-ia-purple.html", salida: "ExpoJuy2026-DeclaracionIA.pdf" },
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function objetivo() {
  for (let i = 0; i < 60; i++) {
    try {
      const lista = await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/list`).then((r) => r.json());
      const pagina = lista.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch {
      /* todavía no levantó */
    }
    await esperar(250);
  }
  throw new Error("Chrome no expuso el endpoint de depuración");
}

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
  await mkdir(PERFIL, { recursive: true });
  await rm(PERFIL, { recursive: true, force: true });

  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PUERTO_CDP}`,
      `--user-data-dir=${PERFIL}`,
      "--no-first-run",
      "--disable-gpu",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const cdp = conectar(await objetivo());
  await cdp.listo;

  try {
    await cdp.enviar("Page.enable");

    for (const doc of DOCUMENTOS) {
      const url = "file:///" + path.join(DOCS, doc.fuente).replace(/\\/g, "/");
      await cdp.enviar("Page.navigate", { url });
      // Las fuentes y las capturas van embebidas en base64, así que no hay red
      // que esperar, pero sí decodificación.
      await esperar(3000);

      const { data } = await cdp.enviar("Page.printToPDF", {
        printBackground: true,
        paperWidth: 8.27,
        paperHeight: 11.69,
        marginTop: 0.472,
        marginBottom: 0.63,
        marginLeft: 0.472,
        marginRight: 0.472,
        displayHeaderFooter: false,
      });

      const destino = path.join(DOCS, doc.salida);
      await writeFile(destino, Buffer.from(data, "base64"));
      const kb = Math.round(Buffer.from(data, "base64").length / 1024);
      console.log(`${doc.salida.padEnd(38)} ${String(kb).padStart(5)} KB`);
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
