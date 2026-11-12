"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmButton, FormMessage, SubmitButton, useAdminForm } from "@/components/admin/form-controls";
import { Field, fieldClass } from "@/components/admin/ui";
import type { FormState } from "@/lib/admin-form";

type Color = { name: string; bg: string; accent: string; ink: string; extraPrice: number; position: number };

const NEW_COLOR = { bg: "#F1EADF", accent: "#B5745A", ink: "#1E1B18" };
const ROLES = [
  { key: "bg", label: "Fond" },
  { key: "accent", label: "Accent" },
  { key: "ink", label: "Encre" },
] as const;

export function ColorForm({
  color,
  productCount,
  save,
  remove,
}: {
  color?: Color;
  productCount?: number;
  save: (prev: FormState, fd: FormData) => Promise<FormState>;
  remove?: (prev: FormState) => Promise<FormState>;
}) {
  const { state, pending, onSubmit } = useAdminForm(save);
  const removal = useAdminForm(remove ?? (async () => null));
  const formRef = useRef<HTMLFormElement>(null);
  const [palette, setPalette] = useState({ bg: color?.bg ?? NEW_COLOR.bg, accent: color?.accent ?? NEW_COLOR.accent, ink: color?.ink ?? NEW_COLOR.ink });
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!color && state?.ok) {
      formRef.current?.reset();
      setPalette(NEW_COLOR);
    }
  }, [color, state]);

  return (
    <div className="border border-line bg-white p-4">
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row">
        {/* Aperçu : fond, une bande d'accent et le texte à l'encre */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden shadow-[2px_4px_10px_rgba(30,27,24,0.2)] sm:w-24" style={{ background: palette.bg }} aria-hidden>
          <div className="absolute inset-x-0 top-[55%] h-[22%]" style={{ background: palette.accent }} />
          <p className="absolute inset-x-0 top-[18%] text-center font-calli text-2xl" style={{ color: palette.ink }} dir="rtl">
            صبر
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3">
          <Field label="Nom" error={errors.name} className="col-span-2 lg:col-span-1">
            <input name="name" defaultValue={color?.name} required className={fieldClass} />
          </Field>
          <Field label="Supplément / panneau (DH)" error={errors.extraPrice}>
            <input name="extraPrice" type="number" min={0} defaultValue={color?.extraPrice ?? 0} className={fieldClass} />
          </Field>
          <Field label="Ordre" error={errors.position}>
            <input name="position" type="number" min={0} defaultValue={color?.position ?? 0} className={fieldClass} />
          </Field>
          {ROLES.map(({ key, label }) => (
            <Field key={key} label={label} error={errors[key]}>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label={`${label} (sélecteur)`}
                  value={palette[key]}
                  onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value.toUpperCase() }))}
                  className="h-[38px] w-10 shrink-0 cursor-pointer border border-line bg-white p-0.5"
                />
                <input
                  name={key}
                  value={palette[key]}
                  onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value }))}
                  className={`${fieldClass} font-mono uppercase`}
                />
              </div>
            </Field>
          ))}
          <div className="col-span-2 flex flex-wrap items-center gap-3 lg:col-span-3">
            <SubmitButton pending={pending}>{color ? "Enregistrer" : "Ajouter la couleur"}</SubmitButton>
            {color && productCount != null && (
              <span className="text-xs text-taupe">
                Proposée sur {productCount} toile{productCount > 1 ? "s" : ""}
              </span>
            )}
            <FormMessage state={state} />
          </div>
        </div>
      </form>
      {color && remove && (
        <form onSubmit={removal.onSubmit} className="mt-2 flex flex-wrap items-center gap-3 sm:pl-28">
          <ConfirmButton pending={removal.pending} message={`Supprimer la couleur « ${color.name} » ?`} variant="link" className="text-bordeaux">
            Supprimer
          </ConfirmButton>
          <FormMessage state={removal.state} />
        </form>
      )}
    </div>
  );
}
