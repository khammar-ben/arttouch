"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { refreshCatalog } from "@/lib/admin-catalog";
import { checked, type FormState, int, invalid, isUniqueError, list, slugSchema, success, text } from "@/lib/admin-form";
import { ART_STYLES, PRODUCT_STATUSES, slugify } from "@/lib/admin-labels";
import { COMPOSITIONS } from "@/lib/compositions";
import { db } from "@/lib/db";
import { ROOMS } from "@/lib/site";
import { storageConfigured, uploadImage } from "@/lib/storage";

const enumOf = <T extends string>(values: T[]) => z.enum(values as [T, ...T[]]);

// Photo du dossier public ou de Supabase Storage : next/image refuse les autres domaines.
const imageUrl = z
  .string()
  .regex(/^(\/[^\s,]+|https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s,]+)$/, "Photo invalide.");

const schema = z.object({
  title: z.string().min(2, "Titre trop court.").max(120),
  titleAr: z.string().max(120),
  slug: slugSchema,
  description: z.string().min(10, "Description trop courte (10 caractères minimum).").max(3000),
  collectionId: z.string().min(1, "Choisissez une collection."),
  status: enumOf(Object.keys(PRODUCT_STATUSES) as (keyof typeof PRODUCT_STATUSES)[]),
  featured: z.boolean(),
  position: int("Ordre", 0, 9999),
  images: z.array(imageUrl).max(12, "12 photos maximum."),
  artStyle: enumOf(Object.keys(ART_STYLES)),
  artText: z.string().max(200),
  compositions: z.array(enumOf(Object.keys(COMPOSITIONS))),
  rooms: z.array(enumOf(Object.keys(ROOMS))),
  panelOptions: z.array(enumOf(["1", "2", "3"])).min(1, "Choisissez au moins une formule (seule, duo, trio)."),
  sizeIds: z.array(z.string()).min(1, "Choisissez au moins une taille."),
  colorIds: z.array(z.string()).min(1, "Choisissez au moins une couleur."),
  defaultColor: z.string(),
  priceMultiplier: z
    .string()
    .trim()
    .regex(/^\d+([.,]\d+)?$/, "Coefficient : nombre attendu (ex. 1,15).")
    .transform((s) => Number(s.replace(",", ".")))
    .refine((n) => n >= 0.1 && n <= 10, "Coefficient : entre 0,1 et 10."),
  allowsCustomText: z.boolean(),
  customTextMax: int("Longueur du texte", 1, 200),
  productionDays: int("Délai", 1, 120),
});

function readForm(fd: FormData) {
  return {
    title: text(fd, "title"),
    titleAr: text(fd, "titleAr"),
    slug: text(fd, "slug") || slugify(text(fd, "title")),
    description: text(fd, "description"),
    collectionId: text(fd, "collectionId"),
    status: text(fd, "status"),
    featured: checked(fd, "featured"),
    position: text(fd, "position") || "0",
    images: text(fd, "images").split(",").filter(Boolean),
    artStyle: text(fd, "artStyle"),
    artText: text(fd, "artText"),
    compositions: list(fd, "compositions"),
    rooms: list(fd, "rooms"),
    panelOptions: list(fd, "panelOptions"),
    sizeIds: list(fd, "sizeIds"),
    colorIds: list(fd, "colorIds"),
    defaultColor: text(fd, "defaultColor"),
    priceMultiplier: text(fd, "priceMultiplier") || "1",
    allowsCustomText: checked(fd, "allowsCustomText"),
    customTextMax: text(fd, "customTextMax") || "30",
    productionDays: text(fd, "productionDays") || "7",
  };
}

export async function saveProduct(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse(readForm(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { collectionId, sizeIds, colorIds, panelOptions, images, compositions, rooms, titleAr, artText, defaultColor, ...fields } = parsed.data;
  const panels = panelOptions.map(Number).sort();

  // La fiche produit a besoin d'au moins un prix dans la grille pour ces tailles et ces panneaux
  const [priceCount, colors] = await Promise.all([
    db.price.count({ where: { sizeId: { in: sizeIds }, panels: { in: panels } } }),
    db.colorOption.findMany({ where: { id: { in: colorIds } }, select: { name: true }, orderBy: { position: "asc" } }),
  ]);
  if (priceCount === 0) {
    return {
      ok: false,
      message: "Aucun prix pour ces tailles et ces formules.",
      fieldErrors: { sizeIds: ["Aucun prix dans la grille pour ces tailles avec ces formules : complétez « Tailles & prix »."] },
    };
  }

  const data = {
    ...fields,
    titleAr: titleAr || null,
    artText: artText || null,
    images: images.join(","),
    compositions: compositions.join(","),
    rooms: rooms.join(","),
    panelOptions: panels.join(","),
    defaultColor: colors.some((c) => c.name === defaultColor) ? defaultColor : (colors[0]?.name ?? null),
    collection: { connect: { id: collectionId } },
  };

  let productId = id;
  try {
    if (id) {
      await db.product.update({
        where: { id },
        data: { ...data, sizes: { set: sizeIds.map((s) => ({ id: s })) }, colors: { set: colorIds.map((c) => ({ id: c })) } },
      });
    } else {
      const created = await db.product.create({
        data: { ...data, sizes: { connect: sizeIds.map((s) => ({ id: s })) }, colors: { connect: colorIds.map((c) => ({ id: c })) } },
      });
      productId = created.id;
    }
  } catch (e) {
    if (isUniqueError(e)) return { ok: false, message: "Cette adresse est déjà utilisée.", fieldErrors: { slug: ["Déjà utilisée par une autre toile."] } };
    throw e;
  }

  refreshCatalog();
  if (!id) redirect(`/admin/produits/${productId}?cree=1`);
  return success("Toile enregistrée.");
}

export async function duplicateProduct(formData: FormData) {
  await requireAdmin();
  const source = await db.product.findUniqueOrThrow({
    where: { id: text(formData, "productId") },
    omit: { id: true, createdAt: true },
    include: { sizes: { select: { id: true } }, colors: { select: { id: true } } },
  });
  const taken = new Set(
    (await db.product.findMany({ where: { slug: { startsWith: `${source.slug}-copie` } }, select: { slug: true } })).map((p) => p.slug),
  );
  let slug = `${source.slug}-copie`;
  for (let n = 2; taken.has(slug); n++) slug = `${source.slug}-copie-${n}`;

  const { sizes, colors, ...fields } = source;
  const copy = await db.product.create({
    data: {
      ...fields,
      slug,
      title: `${source.title} (copie)`,
      status: "DRAFT",
      featured: false,
      sizes: { connect: sizes },
      colors: { connect: colors },
    },
  });
  refreshCatalog();
  redirect(`/admin/produits/${copy.id}?copie=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  // Les lignes de commande gardent leur copie du titre et du prix (productId passe à null)
  await db.product.delete({ where: { id: text(formData, "productId") } });
  refreshCatalog();
  redirect("/admin/produits");
}

const UPLOAD_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

export async function uploadProductImage(formData: FormData): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  await requireAdmin();
  if (!storageConfigured()) return { ok: false, message: "Stockage des photos non configuré (SUPABASE_SERVICE_ROLE_KEY)." };
  const file = formData.get("file");
  if (!(file instanceof Blob) || !UPLOAD_TYPES[file.type]) return { ok: false, message: "Format accepté : JPEG, PNG ou WebP." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Photo trop lourde (4 Mo maximum)." };
  try {
    return { ok: true, url: await uploadImage(file, UPLOAD_TYPES[file.type]) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Envoi impossible." };
  }
}
