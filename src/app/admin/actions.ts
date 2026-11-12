"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { type FormState, invalid, success, text } from "@/lib/admin-form";
import { ADMIN_COOKIE, adminPassword, adminToken } from "@/lib/admin-token";
import { db } from "@/lib/db";
import { STATUS_IDS } from "@/lib/order-status";

export async function login(formData: FormData) {
  const expected = adminPassword();
  if (!expected) redirect("/admin/login");
  const password = String(formData.get("password") ?? "");
  // Comparaison des empreintes : même longueur quelle que soit la saisie (accents compris)
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(hash(password), hash(expected))) redirect("/admin/login?error=1");

  (await cookies()).set(ADMIN_COOKIE, (await adminToken())!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/** Toutes les pages de l'atelier affichent des compteurs de commandes (menu, tableau de bord). */
function refreshOrders() {
  revalidatePath("/admin", "layout");
}

/** Passage rapide d'une commande à un autre statut (tableau de production, fiche commande). */
export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId");
  const status = text(formData, "status");
  if (!STATUS_IDS.has(status)) return;
  await db.order.update({ where: { id: orderId }, data: { status } });
  refreshOrders();
}

const trackingSchema = z.object({
  status: z.string().refine((s) => STATUS_IDS.has(s), "Statut inconnu."),
  trackingNumber: z.string().max(100),
});

export async function updateOrderShipping(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = trackingSchema.safeParse({ status: text(formData, "status"), trackingNumber: text(formData, "trackingNumber") });
  if (!parsed.success) return invalid(parsed.error);
  await db.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status, trackingNumber: parsed.data.trackingNumber || null },
  });
  refreshOrders();
  return success("Commande mise à jour.");
}

const customerSchema = z.object({
  customerName: z.string().min(2, "Nom trop court.").max(100),
  phone: z.string().min(6, "Téléphone invalide.").max(20),
  email: z.union([z.literal(""), z.string().email("Adresse e-mail invalide.")]),
  city: z.string().min(2, "Ville requise.").max(60),
  address: z.string().min(4, "Adresse trop courte.").max(300),
  note: z.string().max(500),
});

export async function updateOrderCustomer(orderId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = customerSchema.safeParse(Object.fromEntries(Object.keys(customerSchema.shape).map((k) => [k, text(formData, k)])));
  if (!parsed.success) return invalid(parsed.error);
  const { email, note, ...rest } = parsed.data;
  await db.order.update({ where: { id: orderId }, data: { ...rest, email: email || null, note: note || null } });
  refreshOrders();
  return success("Coordonnées enregistrées.");
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  await db.order.delete({ where: { id: text(formData, "orderId") } });
  refreshOrders();
  redirect("/admin/commandes");
}
