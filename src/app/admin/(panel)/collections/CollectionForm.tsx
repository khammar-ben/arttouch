"use client";

import { useEffect, useRef } from "react";
import { ConfirmButton, FormMessage, SubmitButton, useAdminForm } from "@/components/admin/form-controls";
import { Field, fieldClass } from "@/components/admin/ui";
import type { FormState } from "@/lib/admin-form";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;
type Collection = { name: string; nameAr: string; slug: string; description: string; position: number };

export function CollectionForm({
  collection,
  save,
  remove,
}: {
  collection?: Collection;
  save: Action;
  remove?: (prev: FormState) => Promise<FormState>;
}) {
  const { state, pending, onSubmit } = useAdminForm(save);
  const removal = useAdminForm(remove ?? (async () => null));
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};

  // Formulaire de création : on le vide après un ajout réussi
  useEffect(() => {
    if (!collection && state?.ok) formRef.current?.reset();
  }, [collection, state]);

  return (
    <div>
      <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" error={errors.name}>
          <input name="name" defaultValue={collection?.name} required className={fieldClass} />
        </Field>
        <Field label="Nom en arabe" error={errors.nameAr}>
          <input name="nameAr" defaultValue={collection?.nameAr} dir="rtl" className={`${fieldClass} font-arabic`} />
        </Field>
        <Field label="Adresse (slug)" hint={collection ? `/boutique?collection=${collection.slug}` : "Laisser vide : déduite du nom."} error={errors.slug}>
          <input name="slug" defaultValue={collection?.slug} className={fieldClass} />
        </Field>
        <Field label="Ordre d'affichage" error={errors.position}>
          <input name="position" type="number" min={0} defaultValue={collection?.position ?? 0} className={fieldClass} />
        </Field>
        <Field label="Description" className="sm:col-span-2" error={errors.description}>
          <textarea name="description" defaultValue={collection?.description} rows={2} className={fieldClass} />
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <SubmitButton pending={pending}>{collection ? "Enregistrer" : "Ajouter la collection"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
      {collection && remove && (
        <form onSubmit={removal.onSubmit} className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <ConfirmButton pending={removal.pending} message={`Supprimer la collection « ${collection.name} » ?`} variant="link" className="text-bordeaux">
            Supprimer
          </ConfirmButton>
          <FormMessage state={removal.state} />
        </form>
      )}
    </div>
  );
}
