import type { ArtStyle } from "./types";

type Composition = {
  label: string;
  /** Photo de la composition en situation (carte de choix) */
  image: string;
  /** Toile de la boutique dont la composition s'inspire */
  inspiredBy: string;
  /** Couleurs de la toile d'inspiration, proposées quand on choisit la composition */
  palette: string;
  /** Toiles de la boutique qui vont bien à côté */
  pairs: string[];
  /** Supplément de travail (le relief demande plus de matière et de temps) */
  priceFactor: number;
};

/** Compositions proposées pour une toile personnalisée, chacune tirée d'une pièce de la boutique. */
export const COMPOSITIONS: Partial<Record<ArtStyle, Composition>> = {
  calligraphy: {
    label: "Courbe",
    image: "/compositions/courbe.jpg",
    inspiredBy: "fasabrun-jamil",
    palette: "Terracotta",
    pairs: ["allah-muhammad", "tulipe", "bismillah-trio"],
    priceFactor: 1,
  },
  words: {
    label: "Horizon",
    image: "/compositions/horizon.jpg",
    inspiredBy: "la-ilaha-illa-allah",
    palette: "Sable & Noir",
    pairs: ["sabr-shukr-tawakkul", "galets", "al-hamdulillah-relief"],
    priceFactor: 1,
  },
  band: {
    label: "Bande",
    image: "/compositions/bande.jpg",
    inspiredBy: "courbe-bordeaux",
    palette: "Bordeaux",
    pairs: ["flux", "galets", "fa-idha-azamta"],
    priceFactor: 1,
  },
  vertical: {
    label: "Verticale",
    image: "/compositions/verticale.jpg",
    inspiredBy: "fa-idha-azamta",
    palette: "Sable & Noir",
    pairs: ["galet-texture", "al-hamdulillah-relief", "la-ilaha-illa-allah"],
    priceFactor: 1.1,
  },
  diagonal: {
    label: "Diagonale",
    image: "/compositions/diagonale.jpg",
    inspiredBy: "tulipe",
    palette: "Rose poudré",
    pairs: ["visage-aux-mains", "tulipe", "allah-muhammad"],
    priceFactor: 1,
  },
  texture: {
    label: "Relief",
    image: "/compositions/relief.jpg",
    inspiredBy: "al-hamdulillah-relief",
    palette: "Sable & Noir",
    pairs: ["galet-texture", "fa-idha-azamta", "meandres"],
    priceFactor: 1.2,
  },
};

export function compositionFactor(style: ArtStyle | null | undefined) {
  return (style && COMPOSITIONS[style]?.priceFactor) || 1;
}
