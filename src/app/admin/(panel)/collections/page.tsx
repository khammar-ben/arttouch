import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { deleteCollection, saveCollection } from "./actions";
import { CollectionForm } from "./CollectionForm";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <div className="space-y-6">
      <PageHeader title="Collections" description="Les familles de toiles affichées sur l'accueil et dans les filtres de la boutique." />

      {collections.map((c) => (
        <Panel
          key={c.id}
          title={c.name}
          description={`${c._count.products} toile${c._count.products > 1 ? "s" : ""}`}
          actions={
            <Link href={`/admin/produits?collection=${c.id}`} className="text-sm underline underline-offset-4">
              Voir les toiles
            </Link>
          }
        >
          <CollectionForm collection={c} save={saveCollection.bind(null, c.id)} remove={deleteCollection.bind(null, c.id)} />
        </Panel>
      ))}

      <Panel title="Nouvelle collection">
        <CollectionForm save={saveCollection.bind(null, null)} />
      </Panel>
    </div>
  );
}
