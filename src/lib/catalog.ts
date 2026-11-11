import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "./db";
import { lowestPrice } from "./pricing";
import type { ArtStyle, ProductDTO } from "./types";

export const productInclude = {
  collection: true,
  sizes: { include: { prices: true }, orderBy: { position: "asc" } },
  colors: { orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toProductDTO(p: ProductWithRelations): ProductDTO {
  const dto: Omit<ProductDTO, "fromPrice"> = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    titleAr: p.titleAr,
    description: p.description,
    images: p.images.split(",").filter(Boolean),
    collection: { slug: p.collection.slug, name: p.collection.name },
    artStyle: p.artStyle as ArtStyle,
    artText: p.artText,
    compositions: p.compositions.split(",").filter(Boolean) as ArtStyle[],
    rooms: p.rooms.split(",").filter(Boolean),
    panelOptions: p.panelOptions.split(",").map(Number).filter(Boolean),
    priceMultiplier: p.priceMultiplier,
    allowsCustomText: p.allowsCustomText,
    customTextMax: p.customTextMax,
    productionDays: p.productionDays,
    featured: p.featured,
    sizes: p.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      widthCm: s.widthCm,
      heightCm: s.heightCm,
      framePrice: s.framePrice,
      prices: Object.fromEntries(s.prices.map((pr) => [pr.panels, pr.amount])),
    })),
    // La couleur de la photo passe en premier : c'est elle qui est sélectionnée par défaut.
    colors: [...p.colors].sort((a, b) => Number(b.name === p.defaultColor) - Number(a.name === p.defaultColor)).map((c) => ({
      id: c.id,
      name: c.name,
      bg: c.bg,
      accent: c.accent,
      ink: c.ink,
      extraPrice: c.extraPrice,
    })),
  };
  return { ...dto, fromPrice: lowestPrice(dto) };
}

export async function getProducts(filter: { collection?: string; room?: string; featured?: boolean } = {}) {
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(filter.collection && { collection: { slug: filter.collection } }),
      ...(filter.room && { rooms: { contains: filter.room } }),
      ...(filter.featured && { featured: true }),
    },
    include: productInclude,
    orderBy: { position: "asc" },
  });
  return products.map(toProductDTO);
}

// Mis en cache le temps d'une requête : la page et ses métadonnées lisent le même produit
export const getProductBySlug = cache(async function getProductBySlug(slug: string) {
  const product = await db.product.findFirst({ where: { slug, status: "ACTIVE" }, include: productInclude });
  return product ? toProductDTO(product) : null;
});

export async function getCollections() {
  return db.collection.findMany({ orderBy: { position: "asc" } });
}
