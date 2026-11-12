import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime, PANEL_LABELS, PAYMENT_METHODS } from "@/lib/admin-labels";
import { orderWhere } from "@/lib/admin-orders";
import { db } from "@/lib/db";
import { statusLabel } from "@/lib/order-status";

export const dynamic = "force-dynamic";

// Point-virgule et BOM UTF-8 : Excel en français ouvre le fichier directement, accents compris.
function cell(value: string | number | null | undefined) {
  const s = String(value ?? "");
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  const orders = await db.order.findMany({
    where: orderWhere({ q: params.get("q") ?? undefined, statut: params.get("statut") ?? undefined }),
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const header = ["Numéro", "Date", "Statut", "Client", "Téléphone", "E-mail", "Ville", "Adresse", "Articles", "Sous-total", "Livraison", "Total", "Paiement", "Suivi", "Note"];
  const rows = orders.map((o) => [
    o.number,
    formatDateTime(o.createdAt),
    statusLabel(o.status),
    o.customerName,
    o.phone,
    o.email,
    o.city,
    o.address,
    o.items
      .map((i) => `${i.quantity} × ${i.title} (${PANEL_LABELS[i.panels] ?? i.panels}, ${i.sizeLabel}, ${i.colorName}${i.framed ? ", cadre" : ""}${i.customText ? `, texte : ${i.customText}` : ""})`)
      .join(" / "),
    o.subtotal,
    o.shippingFee,
    o.total,
    PAYMENT_METHODS[o.paymentMethod] ?? o.paymentMethod,
    o.trackingNumber,
    o.note,
  ]);

  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-arttouch-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
