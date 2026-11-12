"use client";

import Link from "next/link";
import { ArtSet } from "@/components/ArtSet";
import { useCart } from "@/components/cart/CartProvider";
import { FREE_SHIPPING_FROM, formatDH, shippingFee } from "@/lib/pricing";
import { COMPOSITIONS } from "@/lib/compositions";
import { SCRIPTS } from "@/lib/scripts";

const PANEL_LABELS: Record<number, string> = { 1: "Toile seule", 2: "Duo", 3: "Trio" };

export default function CartPage() {
  const { items, hydrated, subtotal, setQuantity, remove } = useCart();
  const shipping = shippingFee(subtotal);

  if (!hydrated) return <div className="mx-auto max-w-4xl px-4 pt-12" />;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-20 text-center">
        <h1 className="font-serif text-4xl">Votre panier est vide</h1>
        <Link href="/boutique" className="mt-8 inline-block bg-ink px-6 py-3 text-sm text-cream hover:bg-bordeaux">
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12">
      <h1 className="font-serif text-5xl">Panier</h1>
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-5 py-6">
              <Link href={`/produit/${item.slug}`} className="flex w-28 shrink-0 items-center justify-center bg-sand p-3 sm:w-36">
                <ArtSet
                  style={item.artStyle}
                  palette={item.palette}
                  text={item.artText}
                  widthCm={item.widthCm}
                  heightCm={item.heightCm}
                  panels={item.panels}
                  framed={item.framed}
                  script={item.script}
                  className="w-full"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link href={`/produit/${item.slug}`} className="font-serif text-xl leading-tight">
                    {item.title}
                  </Link>
                  <p className="shrink-0">{formatDH(item.unitPrice * item.quantity)}</p>
                </div>
                <p className="mt-1 text-sm text-taupe">
                  {PANEL_LABELS[item.panels]} · {item.sizeLabel} cm · {item.colorName}
                  {item.framed ? " · Cadre bois" : ""}
                  {item.composition ? ` · ${COMPOSITIONS[item.composition]?.label}` : ""}
                </p>
                {item.customText && (
                  <p className="mt-1 text-lg" dir="rtl" style={{ fontFamily: SCRIPTS[item.script ?? "ruqaa"].fontFamily }}>
                    {item.customText.split("|").filter(Boolean).join(" · ")}
                    <span className="ms-2 font-sans text-xs text-taupe">{SCRIPTS[item.script ?? "ruqaa"].label}</span>
                  </p>
                )}
                {item.note && <p className="mt-1 text-sm italic text-taupe">« {item.note} »</p>}
                <div className="mt-auto flex items-center gap-4 pt-3 text-sm">
                  <div className="flex items-center border border-line">
                    <button type="button" aria-label="Diminuer" onClick={() => setQuantity(item.key, item.quantity - 1)} className="px-3 py-1">
                      −
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button type="button" aria-label="Augmenter" onClick={() => setQuantity(item.key, item.quantity + 1)} className="px-3 py-1">
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(item.key)} className="text-taupe underline underline-offset-4 hover:text-bordeaux">
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit bg-sand/60 p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Sous-total</dt>
              <dd>{formatDH(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd>{shipping ? formatDH(shipping) : "Offerte"}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-taupe">Livraison offerte dès {formatDH(FREE_SHIPPING_FROM)}.</p>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatDH(subtotal + shipping)}</dd>
            </div>
          </dl>
          <Link href="/commande" className="mt-6 block bg-ink px-6 py-3.5 text-center text-sm text-cream hover:bg-bordeaux">
            Passer la commande
          </Link>
          <p className="mt-3 text-center text-xs text-taupe">Paiement à la livraison</p>
        </aside>
      </div>
    </div>
  );
}
