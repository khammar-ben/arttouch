// Génère les cartes d'ombrage des scènes (public/mockups/<id>-shade.png) avec un navigateur headless,
// puis reporte l'exposition et la teinte calibrées dans src/lib/mockup-scenes.json.
// Usage : node scripts/mockups/prepare.mjs [dossier-debug] [id-scene]
// Navigateur : variable BROWSER_PATH, sinon Microsoft Edge à son emplacement Windows par défaut.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const [debugDir, only] = process.argv.slice(2);
const browser = process.env.BROWSER_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const scenesPath = join(root, "src", "lib", "mockup-scenes.json");

const url = pathToFileURL(join(here, "prepare.html")).href + (only ? `?scene=${only}` : "");
const html = execFileSync(
  browser,
  ["--headless=new", "--disable-gpu", "--allow-file-access-from-files", "--virtual-time-budget=120000", "--dump-dom", url],
  { maxBuffer: 512 * 1024 * 1024, encoding: "utf8" },
);

const log = html.match(/<pre id="log">([\s\S]*?)<\/pre>/)?.[1] ?? "(pas de journal)";
console.log(log.trim());
if (!log.includes("DONE")) process.exit(1);

const outDir = join(root, "public", "mockups");
mkdirSync(outDir, { recursive: true });
if (debugDir) mkdirSync(debugDir, { recursive: true });

for (const [, id, kind, data] of html.matchAll(/<pre id="out-([\w-]+)-(shade|classes)">data:image\/png;base64,([^<]+)<\/pre>/g)) {
  const buffer = Buffer.from(data, "base64");
  if (kind === "shade") {
    const png = await greyAlpha(buffer);
    writeFileSync(join(outDir, `${id}-shade.png`), png);
    console.log(`public/mockups/${id}-shade.png (${Math.round(png.length / 1024)} Ko)`);
  } else if (debugDir) {
    writeFileSync(join(debugDir, `${id}-classes.png`), buffer);
  }
}

// Reporte la calibration dans la configuration des scènes
const config = JSON.parse(readFileSync(scenesPath, "utf8"));
for (const line of log.split(/\r?\n/)) {
  const m = line.match(/^([\w-]+) (\{.*\})$/);
  if (!m) continue;
  const info = JSON.parse(m[2]);
  const scene = config.scenes.find((s) => s.id === m[1]);
  if (scene && info.exposure != null) {
    scene.exposure = info.exposure;
    scene.tint = info.tint;
  }
}
writeFileSync(scenesPath, formatJson(config) + "\n");

// Supprime les cartes des scènes qui n'existent plus
const ids = new Set(config.scenes.map((s) => s.id));
if (existsSync(outDir)) {
  for (const file of readdirSync(outDir)) {
    const id = file.replace(/-shade\.png$/, "");
    if (file.endsWith("-shade.png") && !ids.has(id)) rmSync(join(outDir, file));
  }
}

/**
 * La carte d'ombrage n'utilise qu'un canal (R = V = B) et l'alpha : PNG gris + alpha, deux fois plus léger.
 * Copie exacte des valeurs ; si sharp n'est pas disponible, on garde le PNG RGBA du navigateur.
 */
async function greyAlpha(rgbaPng) {
  try {
    const { default: sharp } = await import("sharp");
    const { data, info } = await sharp(rgbaPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const out = Buffer.alloc(info.width * info.height * 2);
    for (let i = 0; i < info.width * info.height; i++) {
      out[i * 2] = data[i * 4];
      out[i * 2 + 1] = data[i * 4 + 3];
    }
    return await sharp(out, { raw: { width: info.width, height: info.height, channels: 2 } }).toColourspace("b-w").png({ compressionLevel: 9 }).toBuffer();
  } catch {
    return rgbaPng;
  }
}

/** JSON indenté, avec les tableaux de nombres et de points sur une seule ligne */
function formatJson(value) {
  return JSON.stringify(value, null, 2).replace(/\[[^[\]{}]*?\]/g, (arr) => arr.replace(/\s+/g, " ").replace(/\[ /g, "[").replace(/ \]/g, "]"))
    .replace(/\[\s*(\[[^[\]]*\](?:,\s*\[[^[\]]*\])*)\s*\]/g, (_, inner) => `[${inner.replace(/\s+/g, " ")}]`);
}
