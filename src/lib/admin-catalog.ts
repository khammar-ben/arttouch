import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "./catalog";

/** Après une modification du catalogue : la boutique (cache de l'accueil) et l'atelier se mettent à jour. */
export function refreshCatalog() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
}
