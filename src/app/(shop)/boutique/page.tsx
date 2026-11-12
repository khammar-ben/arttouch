import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCollections, getProducts } from "@/lib/catalog";
import { ROOMS } from "@/lib/site";

export const metadata: Metadata = { title: "Boutique" };

type SearchParams = Promise<{ collection?: string; piece?: string }>;

function filterHref(params: { collection?: string; piece?: string }) {
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  return `/boutique${qs.size ? `?${qs}` : ""}`;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
        active ? "border-ink bg-ink text-cream" : "border-line hover:border-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function BoutiquePage({ searchParams }: { searchParams: SearchParams }) {
  const { collection, piece } = await searchParams;
  const [collections, products] = await Promise.all([getCollections(), getProducts({ collection, room: piece })]);
  const current = collections.find((c) => c.slug === collection);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="font-serif text-5xl">{current?.name ?? "Toutes les toiles"}</h1>
      <p className="mt-3 max-w-xl text-taupe">
        {current?.description ?? "Chaque toile est peinte à la main sur commande, dans la taille et les couleurs de votre choix."}
      </p>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <Chip href={filterHref({ piece })} active={!collection}>
          Toutes
        </Chip>
        {collections.map((c) => (
          <Chip key={c.id} href={filterHref({ collection: c.slug, piece })} active={c.slug === collection}>
            {c.name}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
        <span className="shrink-0 text-sm text-taupe">Pièce :</span>
        <Chip href={filterHref({ collection })} active={!piece}>
          Toutes
        </Chip>
        {Object.entries(ROOMS).map(([id, label]) => (
          <Chip key={id} href={filterHref({ collection, piece: id })} active={id === piece}>
            {label}
          </Chip>
        ))}
      </div>

      {products.length ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-taupe">
          Aucune toile pour ce filtre. <Link href="/boutique" className="underline">Voir toute la boutique</Link>
        </p>
      )}
    </div>
  );
}
