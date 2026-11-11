import type { ArtPalette, ArtStyle } from "./types";

/**
 * Géométrie des compositions à texte, partagée entre le rendu SVG (CanvasArt)
 * et le rendu canvas des aperçus en situation (RealMockup).
 * Tout est exprimé dans un repère de 100 unités de large ; H suit le format de la toile.
 */
export const ART_W = 100;

export const TEXT_COMPOSITIONS = ["calligraphy", "words", "band", "vertical", "diagonal", "texture"] as const;

export function isTextComposition(style: ArtStyle): style is (typeof TEXT_COMPOSITIONS)[number] {
  return (TEXT_COMPOSITIONS as readonly string[]).includes(style);
}

/** Teintes peintes : l'accent, et deux mélanges fond/accent pour les compositions à plusieurs tons */
export type ArtFill = "accent" | "soft" | "deep";

export type ArtShape = {
  d: string;
  fill?: ArtFill;
  stroke?: "ink";
  width?: number;
  round?: boolean;
  /** Décalage horizontal, en unités */
  dx?: number;
};

export type TextBox = {
  x: number;
  y: number;
  maxWidth: number;
  maxSize: number;
  /** Un mot par ligne */
  stack?: boolean;
};

const W = ART_W;

/** Formes peintes d'une composition (hors fond et hors effets de matière). */
export function compositionShapes(style: ArtStyle, H: number, mirror = false, text = ""): ArtShape[] {
  switch (style) {
    case "calligraphy": {
      const shapes: ArtShape[] = [
        // Deux galets de teinte intermédiaire à gauche, la vague d'accent à droite
        {
          d: `M 0 0 L ${W * 0.27} 0 C ${W * 0.36} ${H * 0.12}, ${W * 0.5} ${H * 0.3}, ${W * 0.47} ${H * 0.44} C ${W * 0.45} ${H * 0.52}, ${W * 0.3} ${H * 0.55}, 0 ${H * 0.53} Z`,
          fill: "soft",
        },
        {
          d: `M 0 ${H * 0.53} C ${W * 0.2} ${H * 0.52}, ${W * 0.42} ${H * 0.6}, ${W * 0.47} ${H * 0.75} C ${W * 0.5} ${H * 0.85}, ${W * 0.5} ${H * 0.95}, ${W * 0.49} ${H} L 0 ${H} Z`,
          fill: "deep",
        },
        { d: `M ${W * 0.6} 0 C ${W * 0.4} ${H * 0.3}, ${W * 1.02} ${H * 0.52}, ${W * 0.7} ${H} L ${W} ${H} L ${W} 0 Z`, fill: "accent" },
        // Trait fin qui longe la vague, sans traverser le texte
        { d: `M ${W * 0.62} ${H * 0.02} C ${W * 0.44} ${H * 0.3}, ${W * 0.96} ${H * 0.5}, ${W * 0.62} ${H * 0.98}`, stroke: "ink", width: 0.5 },
      ];
      return mirror ? shapes.map(mirrorShape) : shapes;
    }
    case "words":
      return [{ d: `M 0 ${H * 0.56} C ${W * 0.35} ${H * 0.5}, ${W * 0.65} ${H * 0.62}, ${W} ${H * 0.54} L ${W} ${H} L 0 ${H} Z`, fill: "accent" }];
    case "band": {
      // Une bande de couleur ondulée sur un côté, soulignée d'un trait
      const edge = `M ${W * 0.8} 0 C ${W * 0.6} ${H * 0.28}, ${W * 0.96} ${H * 0.42}, ${W * 0.7} ${H * 0.6} C ${W * 0.52} ${H * 0.72}, ${W * 0.76} ${H * 0.9}, ${W * 0.74} ${H}`;
      const shapes: ArtShape[] = [
        { d: `${edge} L ${W} ${H} L ${W} 0 Z`, fill: "accent" },
        { d: edge, stroke: "ink", width: 0.9, dx: -W * 0.025 },
      ];
      return mirror ? shapes.map(mirrorShape) : shapes;
    }
    case "vertical": {
      // Un long trait vertical qui descend du haut jusqu'au bloc de mots
      const top = verticalBlock(H, text).top;
      return [{ d: `M ${W * 0.5} 0 L ${W * 0.5} ${top - H * 0.03}`, stroke: "ink", width: 1.2, round: true }];
    }
    case "diagonal":
      return [{ d: mirror ? `M ${W} 0 L 0 0 L ${W} ${H} Z` : `M 0 0 L ${W} 0 L 0 ${H} Z`, fill: "accent" }];
    default:
      return [];
  }
}

/** Emplacement du texte d'une composition. */
export function compositionText(style: ArtStyle, H: number, mirror = false, text = ""): TextBox | null {
  const m = Math.min(H, W);
  switch (style) {
    case "calligraphy":
      return { x: mirror ? W * 0.6 : W * 0.4, y: H * 0.58, maxWidth: W * 0.68, maxSize: m * 0.36 };
    case "words":
      return { x: W / 2, y: H * 0.52, maxWidth: W * 0.8, maxSize: m * 0.34 };
    case "band":
      // Le mot repose sur le fond clair et vient toucher la bande
      return { x: mirror ? W * 0.58 : W * 0.42, y: H * 0.55, maxWidth: W * 0.62, maxSize: m * 0.34 };
    case "vertical": {
      const { top, blockHeight, count } = verticalBlock(H, text);
      return { x: W * 0.5, y: top + blockHeight / 2, maxWidth: W * 0.7, maxSize: Math.min(blockHeight / count / 1.15, W * 0.34), stack: true };
    }
    case "diagonal":
      return { x: W / 2, y: H / 2, maxWidth: W * 0.72, maxSize: m * 0.3 };
    case "texture":
      return { x: W * 0.38, y: H * 0.8, maxWidth: W * 0.6, maxSize: m * 0.26 };
    default:
      return null;
  }
}

/** Lignes de texte : un mot par ligne si empilé, deux lignes pour une phrase longue. */
export function textLines(text: string, stack = false): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (stack) return words.length ? words : [text.trim()];
  if (text.length > 14 && words.length > 1) {
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
  }
  return [text.trim()];
}

function verticalBlock(H: number, text: string) {
  const count = Math.max(text.trim().split(/\s+/).filter(Boolean).length, 1);
  const blockHeight = Math.min(H * 0.5, count * H * 0.16);
  return { top: H * 0.84 - blockHeight, blockHeight, count };
}

function mirrorShape(shape: ArtShape): ArtShape {
  // Symétrie horizontale : x -> W - x sur toutes les coordonnées x du chemin
  let isX = true;
  const d = shape.d.replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (n) => {
    const v = isX ? W - Number(n) : Number(n);
    isX = !isX;
    return String(v);
  });
  return { ...shape, d, dx: shape.dx ? -shape.dx : undefined };
}

/** Couleur d'une teinte peinte pour une palette donnée */
export function fillColor(palette: ArtPalette, fill: ArtFill): string {
  if (fill === "accent") return palette.accent;
  return mixHex(palette.bg, palette.accent, fill === "soft" ? 0.3 : 0.5);
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${[16, 8, 0].map((sh) => channel(sh).toString(16).padStart(2, "0")).join("")}`;
}
