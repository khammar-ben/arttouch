"use client";

import type { ArtPalette, ArtStyle, Script } from "@/lib/types";
import { CanvasArt } from "./CanvasArt";

export const PANEL_GAP_CM = 4;

type Props = {
  style: ArtStyle;
  palette: ArtPalette;
  /** "|" sépare le texte de chaque panneau */
  text?: string | null;
  widthCm: number;
  heightCm: number;
  panels: number;
  framed?: boolean;
  script?: Script | null;
  painted?: boolean;
  className?: string;
};

/** Un set de 1 à 3 toiles côte à côte, avec ombre portée. */
export function ArtSet({ style, palette, text, widthCm, heightCm, panels, framed = false, script, painted, className }: Props) {
  const texts = (text ?? "").split("|");
  const totalWidth = panels * widthCm + (panels - 1) * PANEL_GAP_CM;

  return (
    <div className={`flex items-end ${className ?? ""}`} style={{ gap: `${(PANEL_GAP_CM / totalWidth) * 100}%` }}>
      {Array.from({ length: panels }, (_, i) => (
        <div
          key={i}
          style={{ flexBasis: `${(widthCm / totalWidth) * 100}%`, flexShrink: 0 }}
          className={`shadow-[3px_6px_14px_rgba(30,27,24,0.28)] ${framed ? "bg-[#5B3E28] p-[4%]" : ""}`}
        >
          <CanvasArt
            style={style}
            palette={palette}
            text={(texts[i] || texts[0] || "").trim() || null}
            widthCm={widthCm}
            heightCm={heightCm}
            panelIndex={i}
            panelCount={panels}
            script={script}
            painted={painted}
          />
        </div>
      ))}
    </div>
  );
}
