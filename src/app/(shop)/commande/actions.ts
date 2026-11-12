"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { productInclude, toProductDTO } from "@/lib/catalog";
import { compositionFactor } from "@/lib/compositions";
import { db } from "@/lib/db";
import { shippingFee, unitPrice } from "@/lib/pricing";
import { SCRIPT_IDS } from "@/lib/scripts";
import { CITIES } from "@/lib/site";

const itemSchema = z.object({
  productId: z.string(),
  sizeId: z.string(),
  panels: z.number().int().min(1).max(3),
  colorId: z.string(),
  framed: z.boolean(),
  customText: z.string().max(200).nullable(),
  script: z.enum(SCRIPT_IDS as [string, ...string[]]).nullable().optional(),
  composition: z.string().max(20).nullable().optional(),
  note: z.string().max(500).nullable(),
  quantity: z.number().int().min(1).max(10),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Indiquez votre nom complet.").max(100),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s.-]/g, ""))
    .refine((s) => /^(\+212|0)[5-7]\d{8}$/.test(s), "Numéro marocain invalide (ex. 06 12 34 56 78)."),
  email: z.union([z.literal(""), z.string().trim().email("Adresse e-mail invalide.")]),
  city: z.enum(CITIES as [string, ...string[]], { message: "Choisissez une ville." }),
  address: z.string().trim().min(6, "Indiquez votre adresse complète.").max(300),
  note: z.string().trim().max(500),
  items: z.array(itemSchema).min(1, "Votre panier est vide.").max(20),
});

export type OrderInput = z.input<typeof orderSchema>;
export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof OrderInput, string[]>> };

export async function placeOrder(input: OrderInput): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Merci de vérifier le formulaire.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Les prix sont recalculés ici : on ne fait jamais confiance aux montants envoyés par le navigateur.
  const products = await db.product.findMany({
    where: { id: { in: [...new Set(data.items.map((i) => i.productId))] }, status: "ACTIVE" },
    include: productInclude,
  });

  const lines: Prisma.OrderItemCreateWithoutOrderInput[] = [];
  for (const item of data.items) {
    const record = products.find((p) => p.id === item.productId);
    if (!record) return { ok: false, error: "Une toile de votre panier n'est plus disponible. Retirez-la et réessayez." };
    const product = toProductDTO(record);
    const size = product.sizes.find((s) => s.id === item.sizeId);
    const color = product.colors.find((c) => c.id === item.colorId);
    // Une composition n'est retenue que si le produit la propose
    const composition = product.compositions.find((c) => c === item.composition) ?? null;
    const price =
      size && color && product.panelOptions.includes(item.panels)
        ? unitPrice(product, size, item.panels, color, item.framed, compositionFactor(composition))
        : null;
    if (!size || !color || price == null) {
      return { ok: false, error: `La configuration de « ${product.title} » n'est plus proposée. Retirez-la et réessayez.` };
    }

    let customText: string | null = null;
    if (item.customText && product.allowsCustomText) {
      const parts = item.customText.split("|").map((s) => s.trim());
      if (parts.length > item.panels || parts.some((s) => s.length > product.customTextMax)) {
        return { ok: false, error: `Le texte personnalisé de « ${product.title} » est trop long.` };
      }
      customText = parts.some(Boolean) ? parts.join("|") : null;
    }

    lines.push({
      product: { connect: { id: product.id } },
      title: product.title,
      sizeLabel: size.label,
      panels: item.panels,
      colorName: color.name,
      framed: item.framed,
      customText,
      // L'écriture ne compte que pour un texte personnalisé
      script: customText ? (item.script ?? "ruqaa") : null,
      composition,
      note: item.note?.trim() || null,
      unitPrice: price,
      quantity: item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shipping = shippingFee(subtotal);
  const year = new Date().getFullYear();

  // Numéro lisible AT-2026-0001 ; on réessaie si deux commandes arrivent en même temps.
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await db.order.count({ where: { number: { startsWith: `AT-${year}-` } } });
    const number = `AT-${year}-${String(count + 1 + attempt).padStart(4, "0")}`;
    try {
      const order = await db.order.create({
        data: {
          number,
          customerName: data.customerName,
          phone: data.phone,
          email: data.email || null,
          city: data.city,
          address: data.address,
          note: data.note || null,
          subtotal,
          shippingFee: shipping,
          total: subtotal + shipping,
          items: { create: lines },
        },
      });
      return { ok: true, orderId: order.id };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return { ok: false, error: "Une erreur est survenue, merci de réessayer." };
}
