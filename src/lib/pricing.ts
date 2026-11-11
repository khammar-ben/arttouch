import type { ColorDTO, ProductDTO, SizeDTO } from "./types";

export const SHIPPING_FEE = 40;
export const FREE_SHIPPING_FROM = 800;

/** Prix d'un exemplaire configuré, ou null si la taille n'existe pas pour ce nombre de panneaux. */
export function unitPrice(
  product: Pick<ProductDTO, "priceMultiplier">,
  size: Pick<SizeDTO, "prices" | "framePrice">,
  panels: number,
  color: Pick<ColorDTO, "extraPrice">,
  framed: boolean,
  /** Supplément de la composition choisie (ex. relief) */
  compositionFactor = 1,
): number | null {
  const base = size.prices[panels];
  if (base == null) return null;
  const adjusted = Math.round((base * product.priceMultiplier * compositionFactor) / 10) * 10;
  return adjusted + color.extraPrice * panels + (framed ? size.framePrice * panels : 0);
}

export function lowestPrice(product: Omit<ProductDTO, "fromPrice">): number {
  const minExtra = Math.min(...product.colors.map((c) => c.extraPrice), 0);
  const prices = product.sizes.flatMap((size) =>
    product.panelOptions.map((panels) => unitPrice(product, size, panels, { extraPrice: minExtra }, false)),
  );
  return Math.min(...prices.filter((p): p is number => p != null));
}

export function shippingFee(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}

export function formatDH(amount: number): string {
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DH`;
}
