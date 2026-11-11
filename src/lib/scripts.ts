import type { Script } from "./types";

type ScriptStyle = {
  label: string;
  labelAr: string;
  /** Pour le CSS et le SVG */
  fontFamily: string;
  /** Variables CSS des polices (next/font), dans l'ordre de repli, pour le rendu canvas */
  cssVars: string[];
  widthFactor: number;
};

/** Styles d'écriture proposés pour les textes personnalisés. */
export const SCRIPTS: Record<Script, ScriptStyle> = {
  ruqaa: {
    label: "Ruqʿa",
    labelAr: "رقعة",
    fontFamily: "var(--font-ruqaa), var(--font-amiri), serif",
    cssVars: ["--font-ruqaa", "--font-amiri"],
    widthFactor: 0.42,
  },
  naskh: { label: "Naskh", labelAr: "نسخ", fontFamily: "var(--font-amiri), serif", cssVars: ["--font-amiri"], widthFactor: 0.4 },
  kufi: {
    label: "Kufi",
    labelAr: "كوفي",
    fontFamily: "var(--font-kufi), var(--font-amiri), sans-serif",
    cssVars: ["--font-kufi", "--font-amiri"],
    widthFactor: 0.5,
  },
};

export const SCRIPT_IDS = Object.keys(SCRIPTS) as Script[];

export function isScript(value: unknown): value is Script {
  return typeof value === "string" && value in SCRIPTS;
}
