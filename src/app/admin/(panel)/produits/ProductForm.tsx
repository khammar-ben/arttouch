"use client";

import { useState } from "react";
import { FormMessage, SubmitButton, useAdminForm } from "@/components/admin/form-controls";
import { Field, fieldClass, Panel } from "@/components/admin/ui";
import type { FormState } from "@/lib/admin-form";
import { ART_STYLES, PANEL_LABELS, PRODUCT_STATUSES, slugify } from "@/lib/admin-labels";
import { COMPOSITIONS } from "@/lib/compositions";
import { formatDH, unitPrice } from "@/lib/pricing";
import { ROOMS } from "@/lib/site";
import { ImageManager } from "./ImageManager";

export type ProductFormValues = {
  title: string;
  titleAr: string;
  slug: string;
  description: string;
  collectionId: string;
  status: string;
  featured: boolean;
  position: number;
  images: string[];
  artStyle: string;
  artText: string;
  compositions: string[];
  rooms: string[];
  panelOptions: number[];
  sizeIds: string[];
  colorIds: string[];
  defaultColor: string;
  priceMultiplier: number;
  allowsCustomText: boolean;
  customTextMax: number;
  productionDays: number;
};

export type ProductFormOptions = {
  collections: { id: string; name: string }[];
  sizes: { id: string; label: string; framePrice: number; prices: Record<number, number> }[];
  colors: { id: string; name: string; bg: string; accent: string; ink: string; extraPrice: number }[];
};

type Upload = (fd: FormData) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;

const checkboxClass = "h-4 w-4 accent-[var(--color-ink)]";

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductForm({
  initial,
  options,
  save,
  upload,
  storageReady,
  isNew,
}: {
  initial: ProductFormValues;
  options: ProductFormOptions;
  save: (prev: FormState, fd: FormData) => Promise<FormState>;
  upload: Upload;
  storageReady: boolean;
  isNew: boolean;
}) {
  const { state, pending, onSubmit } = useAdminForm(save);
  const errors = state?.fieldErrors ?? {};

  // Champs qui pilotent l'aperçu du prix et la couleur par défaut
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [sizeIds, setSizeIds] = useState(initial.sizeIds);
  const [colorIds, setColorIds] = useState(initial.colorIds);
  const [panels, setPanels] = useState(initial.panelOptions);
  const [multiplier, setMultiplier] = useState(String(initial.priceMultiplier).replace(".", ","));
  const [artStyle, setArtStyle] = useState(initial.artStyle);
  const [customText, setCustomText] = useState(initial.allowsCustomText);

  const chosenColors = options.colors.filter((c) => colorIds.includes(c.id));
  const factor = Number(multiplier.replace(",", ".")) || 0;
  const minExtra = Math.min(0, ...chosenColors.map((c) => c.extraPrice));
  const prices = options.sizes
    .filter((s) => sizeIds.includes(s.id))
    .flatMap((s) => panels.map((p) => unitPrice({ priceMultiplier: factor }, s, p, { extraPrice: minExtra }, false)))
    .filter((p): p is number => p != null);
  const fromPrice = prices.length ? Math.min(...prices) : null;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Panel title="Informations">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre" htmlFor="title" error={errors.title}>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
                className={fieldClass}
              />
            </Field>
            <Field label="Titre en arabe" htmlFor="titleAr" error={errors.titleAr}>
              <input id="titleAr" name="titleAr" defaultValue={initial.titleAr} dir="rtl" className={`${fieldClass} font-arabic`} />
            </Field>
            <Field
              label="Adresse de la page"
              htmlFor="slug"
              className="sm:col-span-2"
              hint={isNew ? `/produit/${slug || "…"}` : `/produit/${slug} · la changer casse les liens déjà partagés`}
              error={errors.slug}
            >
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className={fieldClass}
              />
            </Field>
            <Field label="Description" htmlFor="description" className="sm:col-span-2" error={errors.description}>
              <textarea id="description" name="description" defaultValue={initial.description} rows={4} required className={fieldClass} />
            </Field>
          </div>
        </Panel>

        <Panel title="Photos" description="Photos de la toile réelle. Sans photo, la boutique dessine un aperçu.">
          <ImageManager initial={initial.images} upload={upload} storageReady={storageReady} error={errors.images} />
        </Panel>

        <Panel title="Formats & prix" description="Les prix viennent de la grille « Tailles & prix », multipliés par le coefficient de la toile.">
          <div className="space-y-5">
            <Field label="Formules proposées" error={errors.panelOptions}>
              <div className="flex flex-wrap gap-4 text-sm">
                {[1, 2, 3].map((p) => (
                  <label key={p} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="panelOptions"
                      value={p}
                      checked={panels.includes(p)}
                      onChange={() => setPanels((list) => toggle(list, p).sort())}
                      className={checkboxClass}
                    />
                    {PANEL_LABELS[p]} ({p} panneau{p > 1 ? "x" : ""})
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Tailles" error={errors.sizeIds}>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.sizes.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 border border-line px-3 py-2 text-sm has-checked:border-ink">
                    <input
                      type="checkbox"
                      name="sizeIds"
                      value={s.id}
                      checked={sizeIds.includes(s.id)}
                      onChange={() => setSizeIds((list) => toggle(list, s.id))}
                      className={checkboxClass}
                    />
                    <span className="font-medium">{s.label}</span>
                    <span className="ml-auto text-xs tabular-nums text-taupe">
                      {[1, 2, 3].map((p) => (s.prices[p] != null ? formatDH(s.prices[p]) : "—")).join(" · ")}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Coefficient de prix" htmlFor="priceMultiplier" hint="1 = prix de la grille ; 1,15 = +15 %." error={errors.priceMultiplier}>
                <input
                  id="priceMultiplier"
                  name="priceMultiplier"
                  inputMode="decimal"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className={fieldClass}
                />
              </Field>
              <div className="self-end bg-cream px-4 py-3 text-sm">
                {fromPrice != null ? (
                  <>
                    Affiché « à partir de <strong>{formatDH(fromPrice)}</strong> »
                  </>
                ) : (
                  <span className="text-bordeaux">Aucun prix pour ces tailles et formules.</span>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Couleurs" description="Palettes proposées au client sur la fiche produit.">
          <Field label="Couleurs proposées" error={errors.colorIds}>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.colors.map((c) => (
                <label key={c.id} className="flex items-center gap-3 border border-line px-3 py-2 text-sm has-checked:border-ink">
                  <input
                    type="checkbox"
                    name="colorIds"
                    value={c.id}
                    checked={colorIds.includes(c.id)}
                    onChange={() => setColorIds((list) => toggle(list, c.id))}
                    className={checkboxClass}
                  />
                  <span className="flex h-6 w-10 shrink-0 overflow-hidden border border-line" aria-hidden>
                    <span className="flex-1" style={{ background: c.bg }} />
                    <span className="flex-1" style={{ background: c.accent }} />
                    <span className="w-2" style={{ background: c.ink }} />
                  </span>
                  {c.name}
                  {c.extraPrice > 0 && <span className="ml-auto text-xs text-taupe">+{formatDH(c.extraPrice)}</span>}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Couleur sélectionnée par défaut" htmlFor="defaultColor" hint="Celle de la photo." className="mt-4 max-w-sm">
            <select id="defaultColor" name="defaultColor" defaultValue={initial.defaultColor} className={fieldClass}>
              {chosenColors.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Panel>

        <Panel title="Aperçu dessiné & personnalisation" description="Utilisé pour les aperçus de la boutique et quand il n'y a pas de photo.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Style" htmlFor="artStyle" error={errors.artStyle}>
              <select id="artStyle" name="artStyle" value={artStyle} onChange={(e) => setArtStyle(e.target.value)} className={fieldClass}>
                {Object.entries(ART_STYLES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={artStyle === "lineart" ? "Motif" : "Texte arabe"}
              htmlFor="artText"
              hint={artStyle === "lineart" ? "tulipe ou branche" : "« | » sépare les panneaux (duo, trio)."}
              error={errors.artText}
            >
              <input
                id="artText"
                name="artText"
                defaultValue={initial.artText}
                dir={artStyle === "lineart" ? "ltr" : "rtl"}
                className={`${fieldClass} ${artStyle === "lineart" ? "" : "font-arabic"}`}
              />
            </Field>
          </div>

          <Field label="Compositions au choix du client" hint="Pour une toile personnalisable ; vide = composition fixe." className="mt-4" error={errors.compositions}>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {Object.entries(COMPOSITIONS).map(([id, c]) => (
                <label key={id} className="flex items-center gap-2">
                  <input type="checkbox" name="compositions" value={id} defaultChecked={initial.compositions.includes(id)} className={checkboxClass} />
                  {c.label}
                </label>
              ))}
            </div>
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input
                type="checkbox"
                name="allowsCustomText"
                checked={customText}
                onChange={(e) => setCustomText(e.target.checked)}
                className={checkboxClass}
              />
              Le client peut écrire son propre texte
            </label>
            <Field label="Longueur max. du texte (par panneau)" htmlFor="customTextMax" error={errors.customTextMax}>
              <input
                id="customTextMax"
                name="customTextMax"
                type="number"
                min={1}
                max={200}
                defaultValue={initial.customTextMax}
                readOnly={!customText}
                className={`${fieldClass} read-only:bg-sand/40 read-only:text-taupe`}
              />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Panel title="Publication">
          <div className="space-y-4">
            <Field label="Statut" htmlFor="status" error={errors.status}>
              <select id="status" name="status" defaultValue={initial.status} className={fieldClass}>
                {Object.entries(PRODUCT_STATUSES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collection" htmlFor="collectionId" error={errors.collectionId}>
              <select id="collectionId" name="collectionId" defaultValue={initial.collectionId} required className={fieldClass}>
                <option value="">Choisir…</option>
                {options.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={initial.featured} className={checkboxClass} />
              Mise en avant sur l&apos;accueil
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ordre" htmlFor="position" error={errors.position}>
                <input id="position" name="position" type="number" min={0} defaultValue={initial.position} className={fieldClass} />
              </Field>
              <Field label="Délai (jours)" htmlFor="productionDays" error={errors.productionDays}>
                <input id="productionDays" name="productionDays" type="number" min={1} defaultValue={initial.productionDays} className={fieldClass} />
              </Field>
            </div>
            <Field label="Pièces conseillées" error={errors.rooms}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(ROOMS).map(([id, label]) => (
                  <label key={id} className="flex items-center gap-2">
                    <input type="checkbox" name="rooms" value={id} defaultChecked={initial.rooms.includes(id)} className={checkboxClass} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Panel>

        <div className="space-y-2 border border-line bg-white p-5">
          <SubmitButton pending={pending} className="w-full py-3">
            {isNew ? "Créer la toile" : "Enregistrer"}
          </SubmitButton>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
