import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, OrderStatusBadge, PageHeader, Panel } from "@/components/admin/ui";
import { formatDateTime, PRODUCT_STATUSES, type ProductStatus } from "@/lib/admin-labels";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/order-status";
import { formatDH } from "@/lib/pricing";

export const metadata: Metadata = { title: "Tableau de bord" };

const DAY = 24 * 60 * 60 * 1000;

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <p className="mt-2 text-xs text-taupe">{current > 0 ? "Pas de période précédente à comparer" : "—"}</p>;
  const change = Math.round(((current - previous) / previous) * 100);
  const tone = change > 0 ? "text-[#245a31]" : change < 0 ? "text-bordeaux" : "text-taupe";
  return (
    <p className="mt-2 text-xs text-taupe">
      <span className={tone}>
        {change > 0 ? "▲" : change < 0 ? "▼" : "="} {change > 0 ? "+" : ""}
        {change} %
      </span>{" "}
      vs 30 jours précédents
    </p>
  );
}

function StatTile({ label, value, children, href }: { label: string; value: string; children?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-taupe">{label}</p>
      <p className="mt-2 text-2xl font-semibold sm:text-3xl">{value}</p>
      {children}
    </>
  );
  return href ? (
    <Link href={href} className="block border border-line bg-white p-4 hover:border-ink sm:p-5">
      {body}
    </Link>
  ) : (
    <div className="border border-line bg-white p-4 sm:p-5">{body}</div>
  );
}

export default async function DashboardPage() {
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY);
  const since60 = new Date(now - 60 * DAY);
  const since90 = new Date(now - 90 * DAY);
  const notCancelled = { status: { not: "CANCELLED" } };

  const [current, previous, byStatus, recent, bestSellers, catalog] = await Promise.all([
    db.order.aggregate({ where: { ...notCancelled, createdAt: { gte: since30 } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { ...notCancelled, createdAt: { gte: since60, lt: since30 } }, _sum: { total: true }, _count: true }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { _count: { select: { items: true } } } }),
    db.orderItem.groupBy({
      by: ["title"],
      where: { order: { ...notCancelled, createdAt: { gte: since90 } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.product.groupBy({ by: ["status"], _count: true }),
  ]);

  const revenue = current._sum.total ?? 0;
  const previousRevenue = previous._sum.total ?? 0;
  const average = current._count ? Math.round(revenue / current._count) : 0;
  const previousAverage = previous._count ? Math.round(previousRevenue / previous._count) : 0;
  const countOf = (status: string) => byStatus.find((s) => s.status === status)?._count ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Tableau de bord" description="L'activité de la boutique sur les 30 derniers jours (hors commandes annulées)." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Chiffre d'affaires" value={formatDH(revenue)}>
          <Delta current={revenue} previous={previousRevenue} />
        </StatTile>
        <StatTile label="Commandes" value={String(current._count)}>
          <Delta current={current._count} previous={previous._count} />
        </StatTile>
        <StatTile label="Panier moyen" value={formatDH(average)}>
          <Delta current={average} previous={previousAverage} />
        </StatTile>
        <StatTile label="À confirmer" value={String(countOf("TO_CONFIRM"))} href="/admin/commandes?statut=TO_CONFIRM">
          <p className="mt-2 text-xs text-taupe">Clients à appeler avant la mise en peinture →</p>
        </StatTile>
      </div>

      <Panel title="Commandes par étape" description="Toutes les commandes en cours, quelle que soit leur date.">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUSES.map((s) => (
            <Link key={s.id} href={`/admin/commandes?statut=${s.id}`} className="bg-white p-3 hover:bg-cream">
              <p className="text-xs text-taupe">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{countOf(s.id)}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Dernières commandes"
          actions={
            <Link href="/admin/commandes" className="text-sm underline underline-offset-4">
              Tout voir
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState title="Aucune commande pour l'instant">Les commandes passées sur la boutique apparaîtront ici.</EmptyState>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-taupe">
                  <tr className="border-b border-line">
                    <th className="px-5 py-2 font-medium">Commande</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                      <td className="px-5 py-2.5">
                        <Link href={`/admin/commandes/${o.id}`} className="font-medium hover:underline">
                          {o.number}
                        </Link>
                        <p className="text-xs text-taupe">{formatDateTime(o.createdAt)}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {o.customerName}
                        <p className="text-xs text-taupe">
                          {o.city} · {o._count.items} article{o._count.items > 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">{formatDH(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Meilleures ventes" description="Toiles commandées sur les 90 derniers jours.">
            {bestSellers.length === 0 ? (
              <p className="text-sm text-taupe">Pas encore de ventes.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {bestSellers.map((b, i) => (
                  <li key={b.title} className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="mr-2 text-taupe">{i + 1}.</span>
                      {b.title}
                    </span>
                    <span className="tabular-nums text-taupe">× {b._sum.quantity ?? 0}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel
            title="Catalogue"
            actions={
              <Link href="/admin/produits/nouveau" className="text-sm underline underline-offset-4">
                Ajouter une toile
              </Link>
            }
          >
            <ul className="space-y-2 text-sm">
              {(Object.keys(PRODUCT_STATUSES) as ProductStatus[]).map((status) => (
                <li key={status} className="flex justify-between">
                  <Link href={`/admin/produits?statut=${status}`} className="hover:underline">
                    {PRODUCT_STATUSES[status]}
                  </Link>
                  <span className="tabular-nums">{catalog.find((c) => c.status === status)?._count ?? 0}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
