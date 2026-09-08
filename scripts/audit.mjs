/**
 * Auditoría Lighthouse sobre el build de producción.
 *
 * Levanta `next start`, espera a que el puerto responda, corre Lighthouse en
 * headless para cada perfil pedido y guarda HTML mas JSON en reports/lighthouse/.
 *
 * Uso: node scripts/audit.mjs [mobile] [desktop]
 * Requiere un build previo: pnpm run build
 *
 * PROCEDENCIA: adaptado del script del prototipo de Nacho. Lo único que cambia
 * es el servidor que levanta, porque el resto es agnóstico del framework.
 *
 * ADVERTENCIA QUE CONVIENE CONSERVAR: Chrome headless no hereda
 * `prefers-reduced-motion` del sistema, así que esta auditoría siempre mide el
 * peor caso, con todas las animaciones activas. Es la lectura que queremos.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "reports", "lighthouse");

const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;
const SERVER_TIMEOUT_MS = 90_000;
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

/** Cada perfil solo cambia los flags extra que recibe Lighthouse. */
const PROFILES = {
  mobile: { label: "Mobile", flags: [] },
  desktop: { label: "Desktop", flags: ["--preset=desktop"] },
};

/** Resuelve el entrypoint JS de un paquete para invocarlo con el node actual. */
function binOf(pkg, relative) {
  return path.join(path.dirname(require.resolve(`${pkg}/package.json`)), relative);
}

/** 2026-09-08-1432, ordena alfabéticamente y se lee sin traducir. */
function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join("-");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(args[0] ?? command)} terminó con código ${code}`));
    });
  });
}

async function respondsOn(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Espera al servidor que levantamos nosotros. Mira el proceso además del
 * puerto: si `next start` se cae, por ejemplo porque el puerto ya estaba
 * tomado, otro servidor podría contestar el ping y estaríamos auditando
 * cualquier otra cosa sin enterarnos.
 */
async function waitForServer(server, url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`next start terminó con código ${server.exitCode} antes de responder`);
    }
    if (await respondsOn(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`El servidor no respondió en ${url} después de ${timeoutMs / 1000}s`);
}

function startServer() {
  const child = spawn(
    process.execPath,
    [binOf("next", "dist/bin/next"), "start", "--port", String(PORT)],
    { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
  );
  child.on("error", (error) => {
    console.error("No se pudo levantar next start:", error.message);
    process.exit(1);
  });
  return child;
}

async function audit(profile, when) {
  const { label, flags } = PROFILES[profile];
  const base = path.join(OUT_DIR, `${profile}-${when}`);

  console.log(`\nLighthouse ${label}`);
  await run(process.execPath, [
    binOf("lighthouse", "cli/index.js"),
    ORIGIN,
    ...flags,
    `--only-categories=${CATEGORIES.join(",")}`,
    "--output=html",
    "--output=json",
    `--output-path=${base}`,
    "--chrome-flags=--headless=new --disable-gpu --hide-scrollbars",
    "--quiet",
  ]);

  const report = JSON.parse(await readFile(`${base}.report.json`, "utf8"));
  const scores = CATEGORIES.map((id) => {
    const category = report.categories[id];
    return { title: category.title, score: Math.round((category.score ?? 0) * 100) };
  });

  console.log(`\n  ${label} ${ORIGIN}`);
  for (const { title, score } of scores) {
    console.log(`  ${String(score).padStart(3)}  ${title}`);
  }
  console.log(`  -> ${path.relative(ROOT, base)}.report.html`);

  return { label, scores };
}

async function main() {
  const requested = process.argv.slice(2).filter((arg) => arg in PROFILES);
  const profiles = requested.length > 0 ? requested : Object.keys(PROFILES);

  try {
    await readFile(path.join(ROOT, ".next", "BUILD_ID"));
  } catch {
    console.error("No hay build en .next/. Corré `pnpm run build` antes de auditar.");
    process.exit(1);
  }

  if (await respondsOn(ORIGIN)) {
    console.error(`Ya hay algo escuchando en ${ORIGIN}. Cerralo y volvé a correr la auditoría.`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const when = stamp();
  const server = startServer();
  const stop = () => {
    if (!server.killed) server.kill();
  };
  process.on("exit", stop);
  process.on("SIGINT", () => {
    stop();
    process.exit(130);
  });

  try {
    await waitForServer(server, ORIGIN, SERVER_TIMEOUT_MS);
    const results = [];
    for (const profile of profiles) {
      results.push(await audit(profile, when));
    }

    console.log("\n--- Resumen ---");
    for (const { label, scores } of results) {
      console.log(
        `${label.padEnd(8)} ${scores.map(({ score }) => String(score).padStart(3)).join("  ")}`,
      );
    }
    console.log(`${"".padEnd(8)} ${CATEGORIES.map((id) => id.slice(0, 3).padStart(3)).join("  ")}`);
  } finally {
    stop();
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
