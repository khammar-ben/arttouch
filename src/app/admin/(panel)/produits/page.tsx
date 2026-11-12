import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductVisual } from "@/components/ProductCard";
import { buttonClass, EmptyState, fieldClass, PageHeader, ProductStatusBadge } from "@/components/admin/ui";
import { PRODUCT_STATUSES } from "@/lib/admin-labels";
import { productInclude, toProductDTO } from "@/lib/catalog";
import { db } from "@/lib/db";
import { formatDH } from "@/lib/pricing";

export const metadata: Metadata = { title: "Produits" };

type SearchParams = Promise<{ q?: string; collection?: string; statut?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", collection = "", statut = "" } = await searchParams;
  const where: Prisma.ProductWhereInput = {
    ...(collection && { collectionId: collection }),
    ...(statut in PRODUCT_STATUSES && { status: statut }),
    ...(q.trim() && {
      OR: [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { titleAr: { contains: q.trim() } },
        { slug: { contains: q.trim(), mode: "insensitive" } },
      ],
    }),
  };

  const [records, collections, total, sales] = await Promise.all([
    db.product.findMany({ where, include: productInclude, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }),
    db.collection.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.product.count(),
    db.orderItem.groupBy({ by: ["productId"], where: { order: { status: { not: "CANCELLED" } } }, _sum: { quantity: true } }),
  ]);
  const soldOf = (id: string) => sales.find((s) => s.productId === id)?._sum.quantity ?? 0;
  const filtered = Boolean(q || collection || statut);

  return (
    <div>
      <PageHeader
        title="Produits"
        description={`${records.length}${filtered ? ` sur ${total}` : ""} toile${records.length > 1 ? "s" : ""}`}
        actions={
          <Link href="/admin/produits/nouveau" className={buttonClass.primary}>
            + Nouvelle toile
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Rechercher une toile…" aria-label="Rechercher une toile" className={`${fieldClass} max-w-xs`} />
        <select name="collection" defaultValue={collection} aria-label="Collection" className={`${fieldClass} w-auto`}>
          <option value="">Toutes les collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="statut" defaultValue={statut} aria-label="Statut" className={`${fieldClass} w-auto`}>
          <option value="">Tous les statuts</option>
          {Object.entries(PRODUCT_STATUSES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass.primary}>
          Filtrer
        </button>
        {filtered && (
          <Link href="/admin/produits" className={buttonClass.secondary}>
            Effacer
          </Link>
        )}
      </form>

      {records.length === 0 ? (
        <EmptyState title={filtered ? "Aucune toile ne correspond" : "Le catalogue est vide"}>
          {filtered ? (
            "Essayez un autre filtre."
          ) : (
            <Link href="/admin/produits/nouveau" className="underline">
              Ajouter la première toile
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-cream/60 text-left text-xs text-taupe">
              <tr className="border-b border-line">
                <th className="px-4 py-2.5 font-medium">Toile</th>
                <th className="px-4 py-2.5 font-medium">Collection</th>
                <th className="px-4 py-2.5 text-right font-medium">À partir de</th>
                <th className="px-4 py-2.5 text-right font-medium">Vendues</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                // Une fiche incomplète (sans taille ou sans couleur) ne peut pas être dessinée
                const complete = record.sizes.length > 0 && record.colors.length > 0;
                const product = complete ? toProductDTO(record) : null;
                return (
                  <tr key={record.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/produits/${record.id}`} className="flex items-center gap-3">
                        {product ? (
                          <ProductVisual product={product} className="h-14 w-11 shrink-0 px-1" sizes="44px" />
                        ) : (
                          <span className="h-14 w-11 shrink-0 bg-sand" />
                        )}
                        <span className="min-w-0">
                          <span className="block font-medium hover:underline">
                            {record.title}
                            {record.featured && (
                              <span className="ml-2 text-xs text-terracotta" title="Mise en avant sur l'accueil">
                                ★ accueil
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-taupe">/produit/{record.slug}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{record.collection.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {product && Number.isFinite(product.fromPrice) ? formatDH(product.fromPrice) : <span className="text-bordeaux">Sans prix</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{soldOf(record.id)}</td>
                    <td className="px-4 py-2.5">
                      <ProductStatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/admin/produits/${record.id}`} className={buttonClass.link}>
                        Modifier
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
