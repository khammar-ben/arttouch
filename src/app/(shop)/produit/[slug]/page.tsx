import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { isScript } from "@/lib/scripts";
import { ProductConfigurator } from "./ProductConfigurator";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ texte?: string; ecriture?: string; couleur?: string; taille?: string; composition?: string; scene?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return { title: product.title, description: product.description };
}

export default async function ProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Choix venant de l'aperçu de la page d'accueil (ou d'un lien partagé) ; tout ce qui est inconnu est ignoré.
  const initial = {
    text: product.allowsCustomText ? query.texte?.trim().slice(0, product.customTextMax) || undefined : undefined,
    script: isScript(query.ecriture) ? query.ecriture : undefined,
    colorId: product.colors.find((c) => c.name === query.couleur)?.id,
    sizeId: product.sizes.find((s) => s.label === query.taille)?.id,
    composition: product.compositions.find((c) => c === query.composition),
    // Pièce de l'aperçu ; une valeur inconnue revient simplement à la pièce par défaut
    scene: query.scene?.slice(0, 40),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav className="text-sm text-taupe">
        <Link href="/boutique" className="hover:text-ink">Boutique</Link>
        <span className="mx-2">/</span>
        <Link href={`/boutique?collection=${product.collection.slug}`} className="hover:text-ink">
          {product.collection.name}
        </Link>
      </nav>
      <ProductConfigurator product={product} initial={initial} />
    </div>
  );
}
