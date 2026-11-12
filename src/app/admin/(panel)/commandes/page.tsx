import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, EmptyState, fieldClass, OrderStatusBadge, PageHeader } from "@/components/admin/ui";
import { formatDateTime, PAYMENT_METHODS } from "@/lib/admin-labels";
import { type OrderFilters, orderWhere } from "@/lib/admin-orders";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/order-status";
import { formatDH } from "@/lib/pricing";

export const metadata: Metadata = { title: "Commandes" };

const PAGE_SIZE = 25;
const TABS = [{ id: "", label: "Toutes" }, ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })), { id: "CANCELLED", label: "Annulées" }];

function href(filters: OrderFilters & { page?: number }, base = "/admin/commandes") {
  const qs = new URLSearchParams();
  if (filters.q) qs.set("q", filters.q);
  if (filters.statut) qs.set("statut", filters.statut);
  if (filters.page && filters.page > 1) qs.set("page", String(filters.page));
  return `${base}${qs.size ? `?${qs}` : ""}`;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; statut?: string; page?: string }> }) {
  const { q = "", statut = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const where = orderWhere({ q, statut });

  const [orders, total, byStatus] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { quantity: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tabCount = (id: string) =>
    id ? (byStatus.find((s) => s.status === id)?._count ?? 0) : byStatus.reduce((sum, s) => sum + s._count, 0);

  return (
    <div>
      <PageHeader
        title="Commandes"
        description={`${total} commande${total > 1 ? "s" : ""}${q ? ` pour « ${q} »` : ""}`}
        actions={
          <a href={href({ q, statut }, "/admin/commandes/export")} className={buttonClass.secondary}>
            Exporter (CSV)
          </a>
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line text-sm">
        {TABS.map((tab) => {
          const active = tab.id === statut;
          return (
            <Link
              key={tab.id || "all"}
              href={href({ q, statut: tab.id })}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 ${
                active ? "border-ink font-medium" : "border-transparent text-taupe hover:text-ink"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-sand px-2 text-xs text-ink">{tabCount(tab.id)}</span>
            </Link>
          );
        })}
      </div>

      <form className="mb-4 flex max-w-xl gap-2" role="search">
        {statut && <input type="hidden" name="statut" value={statut} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Numéro, nom, téléphone, ville…"
          aria-label="Rechercher une commande"
          className={fieldClass}
        />
        <button type="submit" className={buttonClass.primary}>
          Rechercher
        </button>
        {q && (
          <Link href={href({ statut })} className={buttonClass.secondary}>
            Effacer
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <EmptyState title={q || statut ? "Aucune commande ne correspond" : "Aucune commande pour l'instant"}>
          {q || statut ? "Essayez un autre filtre ou une autre recherche." : "Les commandes passées sur la boutique apparaîtront ici."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-cream/60 text-left text-xs text-taupe">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-medium">Commande</th>
                <th className="px-4 py-2.5 font-medium">Client</th>
                <th className="px-4 py-2.5 font-medium">Ville</th>
                <th className="px-4 py-2.5 text-right font-medium">Articles</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/commandes/${o.id}`} className="font-medium hover:underline">
                      {o.number}
                    </Link>
                    <p className="text-xs text-taupe">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    <p className="text-xs text-taupe">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3">{o.city}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatDH(o.total)}
                    <p className="text-xs text-taupe">{PAYMENT_METHODS[o.paymentMethod] ?? o.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-taupe">
            Page {page} sur {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ q, statut, page: page - 1 })} className={buttonClass.secondary}>
                ← Précédente
              </Link>
            )}
            {page < pages && (
              <Link href={href({ q, statut, page: page + 1 })} className={buttonClass.secondary}>
                Suivante →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
