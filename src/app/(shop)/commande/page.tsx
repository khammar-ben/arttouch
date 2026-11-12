"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatDH, shippingFee } from "@/lib/pricing";
import { CITIES } from "@/lib/site";
import { placeOrder, type OrderInput, type PlaceOrderResult } from "./actions";

type Errors = Extract<PlaceOrderResult, { ok: false }>["fieldErrors"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, subtotal, clear } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Errors>({});
  const shipping = shippingFee(subtotal);

  if (!hydrated) return <div className="mx-auto max-w-4xl px-4 pt-12" />;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-20 text-center">
        <h1 className="font-serif text-4xl">Votre panier est vide</h1>
        <Link href="/boutique" className="mt-8 inline-block bg-ink px-6 py-3 text-sm text-cream">
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input: OrderInput = {
      customerName: String(form.get("customerName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      note: String(form.get("note") ?? ""),
      items: items.map((i) => ({
        productId: i.productId,
        sizeId: i.sizeId,
        panels: i.panels,
        colorId: i.colorId,
        framed: i.framed,
        customText: i.customText,
        script: i.script ?? null,
        composition: i.composition ?? null,
        note: i.note,
        quantity: i.quantity,
      })),
    };
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(input);
      if (result.ok) {
        clear();
        router.push(`/commande/merci/${result.orderId}`);
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12">
      <h1 className="font-serif text-5xl">Commande</h1>
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field label="Nom complet" name="customerName" autoComplete="name" errors={fieldErrors?.customerName} />
          <Field
            label="Téléphone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            hint="Nous vous appelons pour confirmer la commande."
            errors={fieldErrors?.phone}
          />
          <Field label="E-mail (optionnel)" name="email" type="email" autoComplete="email" errors={fieldErrors?.email} />
          <div>
            <label htmlFor="city" className="text-sm font-medium">
              Ville
            </label>
            <select
              id="city"
              name="city"
              defaultValue=""
              className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
            >
              <option value="" disabled>
                Choisissez votre ville
              </option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <FieldError errors={fieldErrors?.city} />
          </div>
          <Field label="Adresse" name="address" autoComplete="street-address" placeholder="Quartier, rue, numéro…" errors={fieldErrors?.address} />
          <div>
            <label htmlFor="note" className="text-sm font-medium">
              Note pour la livraison (optionnel)
            </label>
            <textarea id="note" name="note" rows={2} maxLength={500} className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink" />
          </div>

          <div className="border border-line bg-white p-4 text-sm">
            <p className="font-medium">Paiement à la livraison</p>
            <p className="mt-1 text-taupe">Vous payez en espèces au livreur à la réception de votre toile.</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-bordeaux">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className="w-full bg-ink px-6 py-3.5 text-sm text-cream hover:bg-bordeaux disabled:opacity-60">
            {pending ? "Envoi…" : `Confirmer la commande · ${formatDH(subtotal + shipping)}`}
          </button>
        </form>

        <aside className="h-fit bg-sand/60 p-6 text-sm">
          <p className="font-serif text-xl">Récapitulatif</p>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-4">
                <span>
                  {i.title} <span className="text-taupe">× {i.quantity}</span>
                  <span className="block text-xs text-taupe">
                    {i.sizeLabel} cm · {i.colorName}
                  </span>
                </span>
                <span className="shrink-0">{formatDH(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4">
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd>{shipping ? formatDH(shipping) : "Offerte"}</dd>
            </div>
            <div className="flex justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatDH(subtotal + shipping)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  errors,
  ...props
}: { label: string; name: string; hint?: string; errors?: string[] } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={Boolean(errors?.length)}
        className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink aria-[invalid=true]:border-bordeaux"
        {...props}
      />
      {hint && !errors?.length && <p className="mt-1 text-xs text-taupe">{hint}</p>}
      <FieldError errors={errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1 text-xs text-bordeaux">{errors[0]}</p> : null;
}
