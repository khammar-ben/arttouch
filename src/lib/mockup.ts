import scenesData from "./mockup-scenes.json";
import type { ArtStyle } from "./types";

type Point = [number, number];

export type MockupFace = {
  /** front = face peinte ; les autres sont les tranches visibles du châssis */
  edge: "front" | "left" | "right" | "top" | "bottom";
  /** Coins dans l'ordre haut-gauche, haut-droit, bas-droit, bas-gauche (pixels de la photo) */
  quad: Point[];
  region?: number;
};

export type MockupScene = {
  id: string;
  label: string;
  photo: string;
  size: [number, number];
  /** Largeur / hauteur de la toile représentée */
  aspect: number;
  faces: MockupFace[];
  /** Couleur de la lumière de la pièce */
  tint: [number, number, number];
  exposure: number;
  compositions: ArtStyle[];
};

export const MOCKUP_SCENES = scenesData.scenes as unknown as MockupScene[];

export function scenesFor(style: ArtStyle) {
  return MOCKUP_SCENES.filter((s) => s.compositions.includes(style));
}

export function shadeUrl(scene: MockupScene) {
  return `/mockups/${scene.id}-shade.png`;
}

/** Largeur du rendu à plat : un peu plus que la taille de la toile dans la photo, inutile d'aller au-delà */
export function artWidthFor(scene: MockupScene) {
  const [tl, tr, br, bl] = scene.faces[0].quad;
  const across = Math.max(Math.hypot(tr[0] - tl[0], tr[1] - tl[1]), Math.hypot(br[0] - bl[0], br[1] - bl[1]));
  const down = Math.max(Math.hypot(bl[0] - tl[0], bl[1] - tl[1]), Math.hypot(br[0] - tr[0], br[1] - tr[1]));
  return Math.round(Math.min(1024, Math.max(320, Math.max(across, down * scene.aspect) * 1.3)));
}

// Carte d'ombrage : valeur / SHADE_SCALE = facteur de lumière (voir scripts/mockups/prepare.html)
const SHADE_SCALE = 150;

// --- Homographie carré unité -> quadrilatère, et son inverse ---
function squareToQuad(q: Point[]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) return [x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0, 0, 1];
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

function invert3([a, b, c, d, e, f, g, h, i]: number[]) {
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const D = -(b * i - c * h), E = a * i - c * g, F = -(a * h - b * g);
  const G = b * f - c * e, H = -(a * f - c * d), I = a * e - b * d;
  const det = a * A + b * B + c * C;
  return [A / det, D / det, G / det, B / det, E / det, H / det, C / det, F / det, I / det];
}

/** Droites des bords, normales vers l'intérieur : distance signée = a x + b y + c */
function edgeLines(quad: Point[]) {
  return quad.map((p, k) => {
    const q = quad[(k + 1) % 4];
    const nx = -(q[1] - p[1]), ny = q[0] - p[0];
    const len = Math.hypot(nx, ny);
    return [nx / len, ny / len, -(nx * p[0] + ny * p[1]) / len];
  });
}

// --- Couleur : on éclaire en lumière linéaire ---
const TO_LIN = new Float32Array(256).map((_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
});
const LIN_STEPS = 4096;
const TO_SRGB = new Uint8ClampedArray(LIN_STEPS + 1).map((_, i) => {
  const c = i / LIN_STEPS;
  return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
});

export type PreparedFace = { inv: number[]; lines: number[][]; edge: MockupFace["edge"] };

const prepared = new Map<string, PreparedFace[]>();
/** Homographies inverses (photo -> toile) et bords de chaque face, calculés une fois par scène */
export function facesOf(scene: MockupScene) {
  let faces = prepared.get(scene.id);
  if (!faces) {
    faces = scene.faces.map((f) => ({ inv: invert3(squareToQuad(f.quad)), lines: edgeLines(f.quad), edge: f.edge }));
    prepared.set(scene.id, faces);
  }
  return faces;
}

/**
 * Pose la toile peinte (art, à plat) sur la photo : perspective par homographie,
 * lumière et grain du tissu repris de la carte d'ombrage, bords anticrénelés.
 */
export function composeMockup(scene: MockupScene, photo: ImageData, shade: ImageData, art: ImageData, out: ImageData) {
  const W = photo.width, H = photo.height;
  const pd = photo.data, sd = shade.data, ad = art.data, od = out.data;
  od.set(pd);
  const faces = facesOf(scene);
  const aw = art.width, ah = art.height;
  const [tr, tg, tb] = scene.tint.map((t) => t * scene.exposure);

  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const f of scene.faces) for (const [x, y] of f.quad) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, Math.floor(x0) - 2); y0 = Math.max(0, Math.floor(y0) - 2);
  x1 = Math.min(W - 1, Math.ceil(x1) + 2); y1 = Math.min(H - 1, Math.ceil(y1) + 2);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4;
      if (sd[i + 3] === 0) continue;
      const cx = x + 0.5, cy = y + 0.5;
      let best = 0, inside = -Infinity;
      for (let f = 0; f < faces.length; f++) {
        let d = Infinity;
        for (const [a, b, c] of faces[f].lines) d = Math.min(d, a * cx + b * cy + c);
        if (d > inside) { inside = d; best = f; }
      }
      const coverage = Math.min(1, inside + 0.5);
      if (coverage <= 0) continue;

      const { inv, edge } = faces[best];
      const w = inv[6] * cx + inv[7] * cy + inv[8];
      let u = (inv[0] * cx + inv[1] * cy + inv[2]) / w;
      let v = (inv[3] * cx + inv[4] * cy + inv[5]) / w;
      // Les tranches prolongent la couleur du bord correspondant de la toile
      if (edge === "right") u = 1;
      else if (edge === "left") u = 0;
      else if (edge === "bottom") v = 1;
      else if (edge === "top") v = 0;
      u = Math.min(1, Math.max(0, u)) * (aw - 1);
      v = Math.min(1, Math.max(0, v)) * (ah - 1);

      // Échantillonnage bilinéaire de la toile peinte
      const ux = Math.min(Math.floor(u), aw - 2), vy = Math.min(Math.floor(v), ah - 2);
      const fx = u - ux, fy = v - vy;
      const p00 = (vy * aw + ux) * 4, p10 = p00 + 4, p01 = p00 + aw * 4, p11 = p01 + 4;
      const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
      const light = sd[i] / SHADE_SCALE;
      const r = (TO_LIN[ad[p00]] * w00 + TO_LIN[ad[p10]] * w10 + TO_LIN[ad[p01]] * w01 + TO_LIN[ad[p11]] * w11) * tr * light;
      const g = (TO_LIN[ad[p00 + 1]] * w00 + TO_LIN[ad[p10 + 1]] * w10 + TO_LIN[ad[p01 + 1]] * w01 + TO_LIN[ad[p11 + 1]] * w11) * tg * light;
      const b = (TO_LIN[ad[p00 + 2]] * w00 + TO_LIN[ad[p10 + 2]] * w10 + TO_LIN[ad[p01 + 2]] * w01 + TO_LIN[ad[p11 + 2]] * w11) * tb * light;
      const R = TO_SRGB[Math.min(LIN_STEPS, (r * LIN_STEPS) | 0)];
      const G = TO_SRGB[Math.min(LIN_STEPS, (g * LIN_STEPS) | 0)];
      const B = TO_SRGB[Math.min(LIN_STEPS, (b * LIN_STEPS) | 0)];
      od[i] = pd[i] + (R - pd[i]) * coverage;
      od[i + 1] = pd[i + 1] + (G - pd[i + 1]) * coverage;
      od[i + 2] = pd[i + 2] + (B - pd[i + 2]) * coverage;
    }
  }
}
