"use client";

import { useEffect, useRef } from "react";
import { ConfirmButton, FormMessage, SubmitButton, useAdminForm } from "@/components/admin/form-controls";
import { Field, fieldClass } from "@/components/admin/ui";
import type { FormState } from "@/lib/admin-form";

type Size = {
  label: string;
  widthCm: number;
  heightCm: number;
  framePrice: number;
  position: number;
  prices: Record<number, number>;
};

export function SizeForm({
  size,
  productCount,
  save,
  remove,
}: {
  size?: Size;
  productCount?: number;
  save: (prev: FormState, fd: FormData) => Promise<FormState>;
  remove?: (prev: FormState) => Promise<FormState>;
}) {
  const { state, pending, onSubmit } = useAdminForm(save);
  const removal = useAdminForm(remove ?? (async () => null));
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!size && state?.ok) formRef.current?.reset();
  }, [size, state]);

  return (
    <div className="border border-line bg-white p-4">
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <Field label="Format" error={errors.label}>
            <input name="label" defaultValue={size?.label} placeholder="ex. 40×50" className={fieldClass} />
          </Field>
          <Field label="Largeur (cm)" error={errors.widthCm}>
            <input name="widthCm" type="number" min={5} defaultValue={size?.widthCm} required className={fieldClass} />
          </Field>
          <Field label="Hauteur (cm)" error={errors.heightCm}>
            <input name="heightCm" type="number" min={5} defaultValue={size?.heightCm} required className={fieldClass} />
          </Field>
          {[1, 2, 3].map((panels) => (
            <Field key={panels} label={`${panels === 1 ? "Seule" : panels === 2 ? "Duo" : "Trio"} (DH)`} error={errors[`price${panels}`]}>
              <input
                name={`price${panels}`}
                type="number"
                min={1}
                defaultValue={size?.prices[panels]}
                placeholder="—"
                className={fieldClass}
              />
            </Field>
          ))}
          <Field label="Cadre / panneau" error={errors.framePrice}>
            <input name="framePrice" type="number" min={0} defaultValue={size?.framePrice ?? 0} className={fieldClass} />
          </Field>
          <Field label="Ordre" error={errors.position}>
            <input name="position" type="number" min={0} defaultValue={size?.position ?? 0} className={fieldClass} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubmitButton pending={pending}>{size ? "Enregistrer" : "Ajouter le format"}</SubmitButton>
          {size && productCount != null && (
            <span className="text-xs text-taupe">
              Utilisé par {productCount} toile{productCount > 1 ? "s" : ""}
            </span>
          )}
          <FormMessage state={state} />
        </div>
      </form>
      {size && remove && (
        <form onSubmit={removal.onSubmit} className="mt-2 flex flex-wrap items-center gap-3">
          <ConfirmButton pending={removal.pending} message={`Supprimer le format ${size.label} ?`} variant="link" className="text-bordeaux">
            Supprimer
          </ConfirmButton>
          <FormMessage state={removal.state} />
        </form>
      )}
    </div>
  );
}
