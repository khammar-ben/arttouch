import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { SHIPPING_FEE, FREE_SHIPPING_FROM, formatDH } from "@/lib/pricing";
import { deleteSize, saveSize } from "./actions";
import { SizeForm } from "./SizeForm";

export const metadata: Metadata = { title: "Tailles & prix" };

export default async function SizesPage() {
  const sizes = await db.size.findMany({
    orderBy: { position: "asc" },
    include: { prices: true, _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Tailles & prix"
        description="Grille de base par format et par nombre de panneaux. Le prix final = grille × coefficient de la toile + supplément couleur + cadre."
      />
      <p className="mb-6 text-sm text-taupe">
        Case vide : ce nombre de panneaux n&apos;est pas proposé dans ce format. Livraison : {formatDH(SHIPPING_FEE)}, offerte dès{" "}
        {formatDH(FREE_SHIPPING_FROM)}.
      </p>

      <div className="space-y-3">
        {sizes.map((s) => (
          <SizeForm
            key={s.id}
            size={{ ...s, prices: Object.fromEntries(s.prices.map((p) => [p.panels, p.amount])) }}
            productCount={s._count.products}
            save={saveSize.bind(null, s.id)}
            remove={deleteSize.bind(null, s.id)}
          />
        ))}
      </div>

      <h2 className="mb-3 mt-10 font-medium">Nouveau format</h2>
      <SizeForm save={saveSize.bind(null, null)} />
    </div>
  );
}
