"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { refreshCatalog } from "@/lib/admin-catalog";
import { failure, type FormState, int, invalid, isUniqueError, slugSchema, success, text } from "@/lib/admin-form";
import { slugify } from "@/lib/admin-labels";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Nom trop court.").max(80),
  nameAr: z.string().max(80),
  slug: slugSchema,
  description: z.string().max(500),
  position: int("Ordre", 0, 9999),
});

export async function saveCollection(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    name: text(fd, "name"),
    nameAr: text(fd, "nameAr"),
    slug: text(fd, "slug") || slugify(text(fd, "name")),
    description: text(fd, "description"),
    position: text(fd, "position") || "0",
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (id) await db.collection.update({ where: { id }, data: parsed.data });
    else await db.collection.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, message: "Cette adresse est déjà utilisée.", fieldErrors: { slug: ["Déjà utilisée par une autre collection."] } };
    throw e;
  }
  refreshCatalog();
  return success(id ? "Collection enregistrée." : "Collection créée.");
}

export async function deleteCollection(id: string): Promise<FormState> {
  await requireAdmin();
  const products = await db.product.count({ where: { collectionId: id } });
  if (products > 0) {
    return failure(`Impossible : ${products} toile${products > 1 ? "s" : ""} dans cette collection. Déplacez-les d'abord.`);
  }
  await db.collection.delete({ where: { id } });
  refreshCatalog();
  return success("Collection supprimée.");
}
