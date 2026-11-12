import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { ProductCard, ProductVisual } from "@/components/ProductCard";
import { WordStudio } from "@/components/WordStudio";
import { CATALOG_TAG, getCollections, getProducts } from "@/lib/catalog";
import { FREE_SHIPPING_FROM, formatDH } from "@/lib/pricing";

// Rendue à la demande : le build (Vercel) n'a pas besoin d'accéder à la base.
export const dynamic = "force-dynamic";

// Le catalogue est relu au plus toutes les 60 s, ou tout de suite après une modification dans l'atelier.
const getHomeCatalog = unstable_cache(() => Promise.all([getCollections(), getProducts()]), ["home-catalog"], {
  revalidate: 60,
  tags: [CATALOG_TAG],
});

const TRUST = [
  { title: "Peint à la main", text: "Chaque toile est unique, faite dans notre atelier." },
  { title: "Paiement à la livraison", text: "Vous payez quand vous recevez votre toile." },
  { title: "Photo avant envoi", text: "Vous voyez votre toile sur WhatsApp avant l'expédition." },
  { title: "Livraison partout au Maroc", text: `Offerte dès ${formatDH(FREE_SHIPPING_FROM)} d'achat.` },
];

export default async function HomePage() {
  // Une seule lecture du catalogue pour toute la page
  const [collections, all] = await getHomeCatalog();
  const featured = all.filter((p) => p.featured);
  const custom = all.find((p) => p.slug === "votre-mot");
  const boutique = all
    .filter((p) => p.images.length)
    .map((p) => ({ slug: p.slug, title: p.title, image: p.images[0], fromPrice: p.fromPrice }));
  const hero = featured.find((p) => p.slug === "fa-idha-azamta") ?? featured[0];

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1fr_1.2fr] md:pt-16">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-terracotta">Atelier marocain</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-6xl">Toiles peintes à la main, pour votre intérieur</h1>
          <p className="mt-5 max-w-md text-lg text-taupe">
            Calligraphie moderne, formes abstraites et line art. Choisissez la taille et les couleurs, nous peignons votre toile sur
            commande.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/boutique" className="bg-ink px-6 py-3 text-sm text-cream hover:bg-bordeaux">
              Découvrir la boutique
            </Link>
            <Link href="/produit/votre-mot" className="border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-cream">
              Personnaliser ma toile
            </Link>
          </div>
        </div>
        <Link href={`/produit/${hero.slug}`} className="relative block aspect-square overflow-hidden bg-sand">
          {hero.images[0] && (
            <Image src={hero.images[0]} alt={hero.title} fill priority sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
          )}
          <span className="absolute bottom-4 left-4 bg-cream/90 px-3 py-1.5 text-sm">
            {hero.title} · dès {formatDH(hero.fromPrice)}
          </span>
        </Link>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title}>
              <p className="font-serif text-lg">{t.title}</p>
              <p className="mt-1 text-sm text-taupe">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <h2 className="font-serif text-4xl">Les collections</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {collections.map((c) => {
            const inCollection = all.filter((p) => p.collection.slug === c.slug);
            const sample = inCollection.find((p) => p.images.length) ?? inCollection[0];
            return (
              <Link key={c.id} href={`/boutique?collection=${c.slug}`} className="group block">
                {sample && <ProductVisual product={sample} className="aspect-square" sizes="(min-width: 768px) 20vw, 50vw" />}
                <p className="mt-3 font-serif text-lg">{c.name}</p>
                <p className="font-arabic text-sm text-taupe" dir="rtl">
                  {c.nameAr}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl">Les plus aimées</h2>
          <Link href="/boutique" className="text-sm underline underline-offset-4 hover:text-bordeaux">
            Tout voir
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {featured.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {custom && (
        <section id="atelier" className="mt-24 scroll-mt-16 bg-ink text-cream">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <WordStudio product={custom} boutique={boutique} />
          </div>
        </section>
      )}
    </>
  );
}
