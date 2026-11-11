import Image from "next/image";
import Link from "next/link";
import { formatDH } from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types";
import { ArtSet } from "./ArtSet";

export function ProductCard({ product }: { product: ProductDTO }) {
  return (
    <Link href={`/produit/${product.slug}`} className="group block">
      <ProductVisual product={product} className="aspect-[4/5]" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg leading-tight">{product.title}</h3>
        {product.titleAr && (
          <span className="hidden shrink truncate font-arabic text-sm text-taupe sm:block" dir="rtl">
            {product.titleAr}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-taupe">
        À partir de <span className="text-ink">{formatDH(product.fromPrice)}</span>
      </p>
    </Link>
  );
}

/** Photo principale du produit, ou l'aperçu dessiné quand il n'y a pas encore de photo. */
export function ProductVisual({ product, className, sizes }: { product: ProductDTO; className?: string; sizes: string }) {
  const photo = product.images[0];
  if (photo) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className ?? ""}`}>
        <Image
          src={photo}
          alt={product.titleAr ? `${product.title} · ${product.titleAr}` : product.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  const size = product.sizes[Math.min(1, product.sizes.length - 1)];
  return (
    <div className={`flex items-center justify-center bg-sand px-[14%] transition-colors group-hover:bg-[#E4D8C8] ${className ?? ""}`}>
      <ArtSet
        style={product.artStyle}
        palette={product.colors[0]}
        text={product.artText}
        widthCm={size.widthCm}
        heightCm={size.heightCm}
        panels={product.panelOptions[product.panelOptions.length - 1]}
        className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </div>
  );
}
