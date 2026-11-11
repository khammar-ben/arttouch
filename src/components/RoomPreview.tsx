"use client";

import type { ComponentProps } from "react";
import { ArtSet, PANEL_GAP_CM } from "./ArtSet";

// Dimensions réelles représentées par la scène
const WALL_WIDTH_CM = 300;
const WALL_HEIGHT_CM = 225;
const FLOOR_PCT = 10;
const CONSOLE = { width: 140, height: 78 };

type Props = ComponentProps<typeof ArtSet> & { showScale?: boolean };

/** Les toiles accrochées à l'échelle au-dessus d'une console, sur un mur de 3 m. */
export function RoomPreview({ showScale = true, className, ...art }: Props) {
  const totalWidth = art.panels * art.widthCm + (art.panels - 1) * PANEL_GAP_CM;
  // Accrochage classique : ~25 cm au-dessus de la console
  const bottomCm = CONSOLE.height + 25;
  const v = (cm: number) => (cm / WALL_HEIGHT_CM) * (100 - FLOOR_PCT);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden ${className ?? ""}`}
      style={{ background: "linear-gradient(180deg, #E9E1D5 0%, #E2D8CA 100%)" }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width: `${(totalWidth / WALL_WIDTH_CM) * 100}%`, bottom: `${FLOOR_PCT + v(bottomCm)}%` }}
      >
        <ArtSet {...art} />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ width: `${(CONSOLE.width / WALL_WIDTH_CM) * 100}%`, height: `${v(CONSOLE.height)}%`, bottom: `${FLOOR_PCT}%` }}
      >
        <div className="absolute -top-[22%] left-[12%] h-[22%] w-[7%] rounded-t-full bg-[#2B2724]" />
        <div className="absolute -top-[14%] left-[22%] h-[14%] w-[9%] rounded-full bg-[#CBBBA6]" />
        <div className="absolute -top-[30%] right-[14%] h-[30%] w-[4%] rounded-sm bg-[#3F5A3A]/80" />
        <div className="h-[14%] w-full rounded-sm bg-[#9C7552]" />
        <div className="absolute bottom-0 left-[6%] h-[86%] w-[5%] bg-[#8A6545]" />
        <div className="absolute bottom-0 right-[6%] h-[86%] w-[5%] bg-[#8A6545]" />
      </div>

      <div className="absolute bottom-0 h-[10%] w-full bg-[#BFA587]" />

      {showScale && (
        <span className="absolute left-3 top-3 rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-taupe">
          À l&apos;échelle · mur de 3 m, console de 140 cm
        </span>
      )}
    </div>
  );
}
