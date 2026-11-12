"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { refreshCatalog } from "@/lib/admin-catalog";
import { failure, type FormState, int, invalid, isUniqueError, success, text } from "@/lib/admin-form";
import { db } from "@/lib/db";

const PANELS = [1, 2, 3] as const;
const optionalPrice = z.union([z.literal(""), int("Prix", 1, 100_000)]);

const schema = z
  .object({
    label: z.string().min(2, "Format requis.").max(20),
    widthCm: int("Largeur", 5, 400),
    heightCm: int("Hauteur", 5, 400),
    framePrice: int("Cadre", 0, 100_000),
    position: int("Ordre", 0, 9999),
    price1: optionalPrice,
    price2: optionalPrice,
    price3: optionalPrice,
  })
  .refine((s) => PANELS.some((p) => s[`price${p}`] !== ""), { message: "Indiquez au moins un prix.", path: ["price1"] });

export async function saveSize(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const width = text(fd, "widthCm");
  const height = text(fd, "heightCm");
  const parsed = schema.safeParse({
    label: text(fd, "label") || (width && height ? `${width}×${height}` : ""),
    widthCm: width,
    heightCm: height,
    framePrice: text(fd, "framePrice") || "0",
    position: text(fd, "position") || "0",
    price1: text(fd, "price1"),
    price2: text(fd, "price2"),
    price3: text(fd, "price3"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { price1, price2, price3, ...data } = parsed.data;
  const prices: Record<number, number | ""> = { 1: price1, 2: price2, 3: price3 };

  try {
    await db.$transaction(async (tx) => {
      const size = id ? await tx.size.update({ where: { id }, data }) : await tx.size.create({ data });
      for (const panels of PANELS) {
        const amount = prices[panels];
        // Case vide : ce nombre de panneaux n'est pas proposé dans ce format
        if (amount === "") await tx.price.deleteMany({ where: { sizeId: size.id, panels } });
        else
          await tx.price.upsert({
            where: { sizeId_panels: { sizeId: size.id, panels } },
            create: { sizeId: size.id, panels, amount },
            update: { amount },
          });
      }
    });
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, message: "Ce format existe déjà.", fieldErrors: { label: ["Déjà utilisé."] } };
    throw e;
  }
  refreshCatalog();
  return success(id ? "Format enregistré." : "Format ajouté.");
}

export async function deleteSize(id: string): Promise<FormState> {
  await requireAdmin();
  // Une toile doit garder au moins un format, sinon sa fiche ne peut plus s'afficher
  const products = await db.product.findMany({
    where: { sizes: { some: { id } } },
    select: { title: true, _count: { select: { sizes: true } } },
  });
  const orphans = products.filter((p) => p._count.sizes <= 1);
  if (orphans.length) {
    return failure(`Impossible : c'est le seul format de « ${orphans.map((p) => p.title).join(" », « ")} ». Ajoutez-leur un autre format d'abord.`);
  }
  await db.size.delete({ where: { id } });
  refreshCatalog();
  return success("Format supprimé.");
}
