"use client";

import { useId } from "react";
import { compositionShapes, compositionText, fillColor, isTextComposition, textLines } from "@/lib/art-geometry";
import { SCRIPTS } from "@/lib/scripts";
import type { ArtPalette, ArtStyle, Script } from "@/lib/types";

type Props = {
  style: ArtStyle;
  palette: ArtPalette;
  /** Texte arabe (calligraphy, words, texture) ou motif (lineart) */
  text?: string | null;
  widthCm: number;
  heightCm: number;
  panelIndex?: number;
  panelCount?: number;
  /** Style d'écriture du texte arabe */
  script?: Script | null;
  /** Lumière douce sur la toile, pour les aperçus en grand */
  painted?: boolean;
  className?: string;
};

// Largeur du viewBox ; la hauteur suit le format de la toile.
const W = 100;

/**
 * Rendu vectoriel d'une toile, utilisé comme visuel tant que les vraies photos ne sont pas prêtes,
 * et comme aperçu en direct dans le configurateur.
 */
export function CanvasArt({
  style,
  palette,
  text,
  widthCm,
  heightCm,
  panelIndex = 0,
  panelCount = 1,
  script,
  painted = false,
  className,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const H = (W * heightCm) / widthCm;
  // "waves" est peint sur toute la largeur du set puis découpé panneau par panneau.
  const continuous = style === "waves";
  const x0 = continuous ? panelIndex * W : 0;
  const mirror = panelIndex % 2 === 1;
  const font = SCRIPTS[script ?? "ruqaa"];
  const ink = { fontFamily: font.fontFamily, widthFactor: font.widthFactor };
  // Le relief n'est calculé que pour les compositions qui en ont (filtre coûteux à l'affichage)
  const relief = style === "vertical" || style === "texture";

  return (
    <svg
      viewBox={`${x0} 0 ${W} ${H}`}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
      role="img"
      aria-label={text && style !== "lineart" ? text : "Toile peinte à la main"}
    >
      <defs>
        {relief && (
          <filter id={`relief${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" result="noise" />
            <feDiffuseLighting in="noise" surfaceScale="2.2" lightingColor="#ffffff" result="light">
              <feDistantLight azimuth="225" elevation="50" />
            </feDiffuseLighting>
            <feComposite in="light" in2="SourceGraphic" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" />
          </filter>
        )}
        <linearGradient id={`light${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect x={x0} y={0} width={W} height={H} fill={palette.bg} />

      <g>
        {/* Matière : enduit léger pour la verticale, vagues en relief pour la texture */}
        {style === "vertical" && <rect x={0} y={0} width={W} height={H} fill={palette.bg} filter={`url(#relief${uid})`} opacity={0.3} />}
        {style === "texture" && <ReliefBands H={H} palette={palette} filterId={`relief${uid}`} />}
        {isTextComposition(style) && <TextComposition style={style} H={H} palette={palette} text={text} mirror={mirror} ink={ink} />}
        {style === "blobs" && <Blobs H={H} palette={palette} variant={panelIndex % BLOB_SETS.length} />}
        {style === "waves" && <Waves H={H} palette={palette} panelCount={panelCount} />}
        {style === "lineart" && <LineArt H={H} palette={palette} motif={text} mirror={mirror} />}
      </g>

      {painted && <rect x={x0} y={0} width={W} height={H} fill={`url(#light${uid})`} />}
    </svg>
  );
}

type Ink = { fontFamily: string; widthFactor: number };

function ArabicText({
  text,
  x,
  y,
  maxWidth,
  maxSize,
  fill,
  ink,
  stack = false,
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  maxSize: number;
  fill: string;
  ink: Ink;
  /** Un mot par ligne, empilés (composition verticale) */
  stack?: boolean;
}) {
  const lines = textLines(text, stack);
  const longest = Math.max(...lines.map((l) => [...l].length), 1);
  const size = Math.min(maxSize, maxWidth / (longest * ink.widthFactor));
  const lineHeight = size * 1.25;
  const top = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    // La clé relance l'animation d'encre à chaque changement de texte ou d'écriture
    <g key={`${text}|${ink.fontFamily}`} className="ink-in" fill={fill} style={{ fontFamily: ink.fontFamily }}>
      {lines.map((line, i) => (
        <text key={i} x={x} y={top + i * lineHeight} fontSize={size} textAnchor="middle" dominantBaseline="middle" direction="rtl">
          {line}
        </text>
      ))}
    </g>
  );
}

function TextComposition({
  style,
  H,
  palette,
  text,
  mirror,
  ink,
}: {
  style: ArtStyle;
  H: number;
  palette: ArtPalette;
  text?: string | null;
  mirror: boolean;
  ink: Ink;
}) {
  const box = compositionText(style, H, mirror, text ?? "");
  return (
    <>
      {compositionShapes(style, H, mirror, text ?? "").map((shape) => (
        <path
          key={shape.d}
          d={shape.d}
          transform={shape.dx ? `translate(${shape.dx} 0)` : undefined}
          fill={shape.fill ? fillColor(palette, shape.fill) : "none"}
          stroke={shape.stroke ? palette[shape.stroke] : undefined}
          strokeWidth={shape.width}
          strokeLinecap={shape.round ? "round" : undefined}
        />
      ))}
      {text && box && <ArabicText text={text} {...box} fill={palette.ink} ink={ink} />}
    </>
  );
}

// Formes dessinées dans un carré 0–100, étirées au format de la toile.
const BLOB_SETS = [
  [
    "M18 12 C35 4 62 8 66 22 C70 36 52 46 32 44 C12 42 2 20 18 12 Z",
    "M14 58 C24 48 50 50 56 64 C62 80 46 94 28 92 C10 90 4 68 14 58 Z",
    "M80 40 C92 44 96 70 90 88 C86 98 70 96 68 82 C66 66 70 36 80 40 Z",
  ],
  [
    "M40 8 C60 2 88 10 86 28 C84 46 58 50 46 40 C34 30 26 12 40 8 Z",
    "M6 40 C14 34 26 44 26 62 C26 80 18 96 10 92 C2 88 -2 46 6 40 Z",
    "M70 62 C82 52 102 56 100 70 L100 100 L60 100 C56 88 60 70 70 62 Z",
  ],
  [
    "M28 6 C46 0 62 10 58 24 C54 36 36 36 28 26 C22 18 16 10 28 6 Z",
    "M-4 48 C18 40 40 52 44 66 C48 82 30 98 12 98 L-4 98 Z",
    "M64 44 C80 36 100 46 100 46 L100 100 L58 100 C50 84 50 52 64 44 Z",
  ],
];

function Blobs({ H, palette, variant }: { H: number; palette: ArtPalette; variant: number }) {
  return (
    <g transform={`scale(${W / 100} ${H / 100})`} fill={palette.accent}>
      {BLOB_SETS[variant].map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
}

function Waves({ H, palette, panelCount }: { H: number; palette: ArtPalette; panelCount: number }) {
  return (
    <g transform={`scale(${(W * panelCount) / 100} ${H / 100})`} fill={palette.accent}>
      <path d="M0 8 C20 0 45 10 48 35 C50 50 30 55 25 70 C20 85 30 100 30 100 L0 100 Z" />
      <path d="M55 0 L100 0 L100 55 C85 60 70 50 62 40 C52 28 70 15 55 0 Z" />
      <path d="M45 100 C48 80 62 62 80 62 C92 62 100 70 100 72 L100 100 Z" />
    </g>
  );
}

// Motifs dessinés dans une boîte de 50 × 70
const LINE_MOTIFS: Record<string, string[]> = {
  tulipe: [
    "M25 70 C24 55 26 40 25 28",
    "M25 28 C16 26 14 14 17 4 C20 10 23 12 25 14 C27 10 30 6 33 4 C36 14 34 26 25 28 Z",
    "M25 55 C34 48 40 40 42 32 C36 36 30 42 25 50",
    "M25 48 C18 44 12 38 10 30 C16 34 22 38 25 44",
  ],
  branche: [
    "M8 68 C18 50 30 30 44 4",
    "M14 56 C6 52 4 46 6 42 C12 44 15 50 14 56",
    "M20 46 C28 44 32 38 32 34 C26 34 21 40 20 46",
    "M24 38 C16 34 14 28 16 24 C22 26 25 32 24 38",
    "M30 28 C38 26 42 20 42 16 C36 16 31 22 30 28",
    "M34 20 C28 15 27 10 29 6 C34 9 35 15 34 20",
  ],
};

function LineArt({ H, palette, motif, mirror }: { H: number; palette: ArtPalette; motif?: string | null; mirror: boolean }) {
  const paths = LINE_MOTIFS[motif ?? ""] ?? LINE_MOTIFS.tulipe;
  const s = Math.min((W * 0.62) / 50, (H * 0.62) / 70);
  return (
    <>
      <path d={mirror ? `M ${W} 0 L 0 0 L ${W} ${H} Z` : `M 0 0 L ${W} 0 L 0 ${H} Z`} fill={palette.accent} />
      <g
        transform={`translate(${(W - 50 * s) / 2} ${(H - 70 * s) / 2}) scale(${s})`}
        fill="none"
        stroke={palette.ink}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </>
  );
}

function ReliefBands({ H, palette, filterId }: { H: number; palette: ArtPalette; filterId: string }) {
  return (
    <g filter={`url(#${filterId})`}>
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${W * (0.3 + i * 0.12)} ${-H * 0.05} C ${W * (0.45 + i * 0.12)} ${H * (0.18 + i * 0.05)}, ${W * 0.75} ${
            H * (0.28 + i * 0.07)
          }, ${W * 1.05} ${H * (0.2 + i * 0.07)}`}
          fill="none"
          stroke={palette.accent}
          strokeWidth={W * 0.075}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
