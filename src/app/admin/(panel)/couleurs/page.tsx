import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { deleteColor, saveColor } from "./actions";
import { ColorForm } from "./ColorForm";

export const metadata: Metadata = { title: "Couleurs" };

export default async function ColorsPage() {
  const colors = await db.colorOption.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <div>
      <PageHeader
        title="Couleurs"
        description="Palettes proposées au client : fond de la toile, couleur d'accent et encre du texte. Le supplément s'ajoute par panneau (ex. peinture dorée)."
      />
      <div className="space-y-3">
        {colors.map((c) => (
          <ColorForm key={c.id} color={c} productCount={c._count.products} save={saveColor.bind(null, c.id)} remove={deleteColor.bind(null, c.id)} />
        ))}
      </div>
      <h2 className="mb-3 mt-10 font-medium">Nouvelle couleur</h2>
      <ColorForm save={saveColor.bind(null, null)} />
    </div>
  );
}
