import { db } from "@/lib/db";
import type { ProductFormOptions } from "./ProductForm";

/** Collections, tailles (avec la grille de prix) et couleurs proposées dans le formulaire produit. */
export async function loadProductFormOptions(): Promise<ProductFormOptions> {
  const [collections, sizes, colors] = await Promise.all([
    db.collection.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.size.findMany({ orderBy: { position: "asc" }, include: { prices: true } }),
    db.colorOption.findMany({ orderBy: { position: "asc" } }),
  ]);
  return {
    collections,
    sizes: sizes.map((s) => ({
      id: s.id,
      label: s.label,
      framePrice: s.framePrice,
      prices: Object.fromEntries(s.prices.map((p) => [p.panels, p.amount])),
    })),
    colors: colors.map(({ id, name, bg, accent, ink, extraPrice }) => ({ id, name, bg, accent, ink, extraPrice })),
  };
}
