import type { ArtStyle } from "./types";

export const ART_STYLES: Record<ArtStyle, string> = {
  calligraphy: "Calligraphie",
  words: "Mots",
  band: "Bande",
  vertical: "Verticale",
  diagonal: "Diagonale",
  blobs: "Formes organiques",
  waves: "Vagues",
  lineart: "Line art",
  texture: "Texture & relief",
};

export const PRODUCT_STATUSES = {
  ACTIVE: "En ligne",
  DRAFT: "Brouillon",
  HIDDEN: "Masqué",
} as const;

export type ProductStatus = keyof typeof PRODUCT_STATUSES;

export const PANEL_LABELS: Record<number, string> = { 1: "Seule", 2: "Duo", 3: "Trio" };

export const PAYMENT_METHODS: Record<string, string> = {
  COD: "Paiement à la livraison",
  TRANSFER: "Virement",
  CARD: "Carte bancaire",
};

const dateTime = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", dateStyle: "medium" });

/** Dates à l'heure du Maroc (le serveur Vercel tourne en UTC). */
export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

export function formatDate(date: Date) {
  return dateOnly.format(date);
}

/** "Fa idha ʿazamta" -> "fa-idha-azamta" */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯʰ-˿]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
