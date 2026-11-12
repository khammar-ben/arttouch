"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminPassword, adminToken } from "@/lib/admin-token";
import { db } from "@/lib/db";
import { STATUS_IDS } from "@/lib/order-status";

async function requireAdmin() {
  const token = await adminToken();
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || session !== token) redirect("/admin/login");
}

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

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!STATUS_IDS.has(status)) return;
  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin");
}
