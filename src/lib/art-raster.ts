import { ART_W, compositionShapes, compositionText, fillColor, textLines } from "./art-geometry";
import { SCRIPTS } from "./scripts";
import type { ArtPalette, ArtStyle, Script } from "./types";

type ArtInput = { style: ArtStyle; palette: ArtPalette; text: string; script: Script };

/** Familles de polices réellement chargées par next/font, utilisables par le canvas. */
function fontFamily(script: Script) {
  const computed = getComputedStyle(document.body);
  const names = SCRIPTS[script].cssVars.map((v) => computed.getPropertyValue(v).trim()).filter(Boolean);
  return [...names, "serif"].join(", ");
}

/**
 * Peint une composition à plat (fond, formes, texte) dans un canvas de la taille voulue.
 * La matière (grain, relief, lumière) vient ensuite de la photo de la scène.
 */
export async function paintArt(canvas: HTMLCanvasElement, art: ArtInput, width: number, aspect: number) {
  const height = Math.round(width / aspect);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const H = ART_W / aspect;
  const family = fontFamily(art.script);
  // Police déjà chargée la plupart du temps : on n'attend que la première fois
  if (art.text && !document.fonts.check(`40px ${family}`, art.text)) await document.fonts.load(`40px ${family}`, art.text);

  ctx.setTransform(width / ART_W, 0, 0, width / ART_W, 0, 0);
  ctx.fillStyle = art.palette.bg;
  ctx.fillRect(0, 0, ART_W, H);

  for (const shape of compositionShapes(art.style, H, false, art.text)) {
    const path = new Path2D(shape.d);
    ctx.save();
    if (shape.dx) ctx.translate(shape.dx, 0);
    if (shape.fill) {
      ctx.fillStyle = fillColor(art.palette, shape.fill);
      ctx.fill(path);
    }
    if (shape.stroke) {
      ctx.strokeStyle = art.palette[shape.stroke];
      ctx.lineWidth = shape.width ?? 1;
      ctx.lineCap = shape.round ? "round" : "butt";
      ctx.stroke(path);
    }
    ctx.restore();
  }

  const box = compositionText(art.style, H, false, art.text);
  if (art.text && box) {
    const lines = textLines(art.text, box.stack);
    // Taille réelle mesurée, plutôt qu'estimée comme en SVG
    ctx.font = `100px ${family}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    const size = Math.min(box.maxSize, (box.maxWidth * 100) / widest);
    const lineHeight = size * 1.25;
    const top = box.y - ((lines.length - 1) * lineHeight) / 2;
    ctx.font = `${size}px ${family}`;
    ctx.fillStyle = art.palette.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    lines.forEach((line, i) => ctx.fillText(line, box.x, top + i * lineHeight));
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx;
}

/** Même rendu, lu en pixels pour le rendu processeur (sans WebGL) */
export async function renderArt(canvas: HTMLCanvasElement, art: ArtInput, width: number, aspect: number): Promise<ImageData> {
  const ctx = await paintArt(canvas, art, width, aspect);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
