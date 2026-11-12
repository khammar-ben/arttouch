"use client";

import { FormMessage, SubmitButton, useAdminForm } from "@/components/admin/form-controls";
import { Field, fieldClass } from "@/components/admin/ui";
import type { FormState } from "@/lib/admin-form";
import { statusLabel, STATUS_IDS } from "@/lib/order-status";
import { CITIES } from "@/lib/site";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function ShippingForm({ action, status, trackingNumber }: { action: Action; status: string; trackingNumber: string | null }) {
  const { state, pending, onSubmit } = useAdminForm(action);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Statut" htmlFor="status">
        <select id="status" name="status" defaultValue={status} className={fieldClass}>
          {[...STATUS_IDS].map((id) => (
            <option key={id} value={id}>
              {statusLabel(id)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Numéro de suivi" htmlFor="trackingNumber" hint="Transporteur (Amana, CTM…) et numéro du colis." error={state?.fieldErrors?.trackingNumber}>
        <input id="trackingNumber" name="trackingNumber" defaultValue={trackingNumber ?? ""} className={fieldClass} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

type Customer = { customerName: string; phone: string; email: string | null; city: string; address: string; note: string | null };

export function CustomerForm({ action, customer }: { action: Action; customer: Customer }) {
  const { state, pending, onSubmit } = useAdminForm(action);
  const errors = state?.fieldErrors ?? {};
  // La ville d'une ancienne commande peut ne plus être dans la liste : on la garde comme option.
  const cities = CITIES.includes(customer.city) ? CITIES : [customer.city, ...CITIES];
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nom" htmlFor="customerName" error={errors.customerName}>
        <input id="customerName" name="customerName" defaultValue={customer.customerName} required className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="phone" error={errors.phone}>
          <input id="phone" name="phone" defaultValue={customer.phone} required className={fieldClass} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email}>
          <input id="email" name="email" type="email" defaultValue={customer.email ?? ""} className={fieldClass} />
        </Field>
      </div>
      <Field label="Ville" htmlFor="city" error={errors.city}>
        <select id="city" name="city" defaultValue={customer.city} className={fieldClass}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Adresse" htmlFor="address" error={errors.address}>
        <textarea id="address" name="address" defaultValue={customer.address} rows={2} required className={fieldClass} />
      </Field>
      <Field label="Note de livraison" htmlFor="note" error={errors.note}>
        <textarea id="note" name="note" defaultValue={customer.note ?? ""} rows={2} className={fieldClass} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center border border-line bg-white px-4 py-2 text-sm hover:border-ink">
      Imprimer
    </button>
  );
}
