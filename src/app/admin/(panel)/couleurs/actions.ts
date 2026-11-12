"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { refreshCatalog } from "@/lib/admin-catalog";
import { failure, type FormState, int, invalid, isUniqueError, success, text } from "@/lib/admin-form";
import { db } from "@/lib/db";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #RRGGBB.");

const schema = z.object({
  name: z.string().min(2, "Nom trop court.").max(40),
  bg: hex,
  accent: hex,
  ink: hex,
  extraPrice: int("Supplément", 0, 100_000),
  position: int("Ordre", 0, 9999),
});

export async function saveColor(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    name: text(fd, "name"),
    bg: text(fd, "bg"),
    accent: text(fd, "accent"),
    ink: text(fd, "ink"),
    extraPrice: text(fd, "extraPrice") || "0",
    position: text(fd, "position") || "0",
  });
  if (!parsed.success) return invalid(parsed.error);
  const data = { ...parsed.data, bg: parsed.data.bg.toUpperCase(), accent: parsed.data.accent.toUpperCase(), ink: parsed.data.ink.toUpperCase() };

  try {
    await db.$transaction(async (tx) => {
      if (!id) {
        await tx.colorOption.create({ data });
        return;
      }
      const before = await tx.colorOption.findUniqueOrThrow({ where: { id }, select: { name: true } });
      await tx.colorOption.update({ where: { id }, data });
      // La couleur par défaut des toiles est enregistrée par son nom
      if (before.name !== data.name) {
        await tx.product.updateMany({ where: { defaultColor: before.name }, data: { defaultColor: data.name } });
      }
    });
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, message: "Ce nom de couleur existe déjà.", fieldErrors: { name: ["Déjà utilisé."] } };
    throw e;
  }
  refreshCatalog();
  return success(id ? "Couleur enregistrée." : "Couleur ajoutée.");
}

export async function deleteColor(id: string): Promise<FormState> {
  await requireAdmin();
  const color = await db.colorOption.findUniqueOrThrow({
    where: { id },
    select: { name: true, products: { select: { title: true, _count: { select: { colors: true } } } } },
  });
  const orphans = color.products.filter((p) => p._count.colors <= 1);
  if (orphans.length) {
    return failure(`Impossible : c'est la seule couleur de « ${orphans.map((p) => p.title).join(" », « ")} ». Ajoutez-leur une autre couleur d'abord.`);
  }
  await db.$transaction([
    db.product.updateMany({ where: { defaultColor: color.name }, data: { defaultColor: null } }),
    db.colorOption.delete({ where: { id } }),
  ]);
  refreshCatalog();
  return success("Couleur supprimée.");
}
