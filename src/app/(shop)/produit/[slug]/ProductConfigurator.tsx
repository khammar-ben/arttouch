"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArtSet, PANEL_GAP_CM } from "@/components/ArtSet";
import { useCart } from "@/components/cart/CartProvider";
import { RealMockup } from "@/components/RealMockup";
import { RoomPreview } from "@/components/RoomPreview";
import { COMPOSITIONS, compositionFactor } from "@/lib/compositions";
import { scenesFor } from "@/lib/mockup";
import { formatDH, unitPrice } from "@/lib/pricing";
import { SCRIPTS, SCRIPT_IDS } from "@/lib/scripts";
import { ROOMS, whatsappLink } from "@/lib/site";
import type { ArtStyle, ProductDTO, Script } from "@/lib/types";

const PANEL_LABELS: Record<number, string> = { 1: "Toile seule", 2: "Duo", 3: "Trio" };
const TEXT_STYLES = new Set<ArtStyle>(["calligraphy", "words", "band", "vertical", "diagonal", "texture"]);

type View = "photo" | "interieur" | "toile" | "salon";
const VIEW_LABELS: Record<View, string> = { photo: "Photo", interieur: "Dans un intérieur", toile: "Votre aperçu", salon: "À l'échelle" };

type Initial = { text?: string; script?: Script; colorId?: string; sizeId?: string; composition?: ArtStyle; scene?: string };

export function ProductConfigurator({ product, initial = {} }: { product: ProductDTO; initial?: Initial }) {
  const { add } = useCart();
  const defaultTexts = (product.artText ?? "").split("|");

  const [panels, setPanels] = useState(product.panelOptions[0]);
  const [sizeId, setSizeId] = useState(initial.sizeId ?? product.sizes[Math.min(1, product.sizes.length - 1)].id);
  const [colorId, setColorId] = useState(initial.colorId ?? product.colors[0].id);
  const [script, setScript] = useState<Script>(initial.script ?? "ruqaa");
  const [composition, setComposition] = useState<ArtStyle>(initial.composition ?? product.compositions[0] ?? product.artStyle);
  const hasCompositions = product.compositions.length > 1;
  const [framed, setFramed] = useState(false);
  const [texts, setTexts] = useState<string[]>(initial.text ? [initial.text] : []);
  const [note, setNote] = useState("");
  // Les toiles à composer se voient d'abord peintes dans une vraie pièce
  const views: View[] = hasCompositions ? ["interieur", "toile", "salon"] : product.images.length ? ["photo", "toile", "salon"] : ["toile", "salon"];
  // Un client qui arrive avec un texte personnalisé voit directement son aperçu.
  const [view, setView] = useState<View>(initial.text && !hasCompositions ? "toile" : views[0]);
  const [sceneId, setSceneId] = useState<string | null>(initial.scene ?? null);
  const [photo, setPhoto] = useState(product.images[0]);
  // Quand on change une couleur ou un texte, on montre l'aperçu plutôt que la photo du modèle.
  const showPreview = () => setView((v) => (v === "photo" ? "toile" : v));
  const [added, setAdded] = useState(false);

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const price = unitPrice(product, size, panels, color, framed, hasCompositions ? compositionFactor(composition) : 1);
  const canCustomize = product.allowsCustomText && TEXT_STYLES.has(product.artStyle);

  const customParts = Array.from({ length: panels }, (_, i) => (texts[i] ?? "").trim());
  const customText = canCustomize && customParts.some(Boolean) ? customParts.join("|") : null;
  const previewText = canCustomize
    ? Array.from({ length: panels }, (_, i) => customParts[i] || defaultTexts[i] || defaultTexts[0] || "").join("|")
    : product.artText;

  const scenes = hasCompositions ? scenesFor(composition) : [];
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];

  const art = {
    style: composition,
    palette: color,
    text: previewText,
    widthCm: size.widthCm,
    heightCm: size.heightCm,
    panels,
    framed,
    script: canCustomize ? script : null,
    painted: true,
  };

  const whatsappMessage = useMemo(
    () =>
      `Salam, je suis intéressé(e) par « ${product.title} » : ${PANEL_LABELS[panels]} ${size.label} cm, ${color.name}${
        framed ? ", avec cadre" : ""
      }${hasCompositions ? `, composition ${COMPOSITIONS[composition]?.label}` : ""}${customText ? `, texte : ${customText.replaceAll("|", " / ")} (écriture ${SCRIPTS[script].label})` : ""}.`,
    [product.title, panels, size.label, color.name, framed, customText, script, hasCompositions, composition],
  );

  function handleAdd() {
    if (price == null) return;
    add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      artStyle: composition,
      artText: previewText,
      palette: { bg: color.bg, accent: color.accent, ink: color.ink },
      sizeId: size.id,
      sizeLabel: size.label,
      widthCm: size.widthCm,
      heightCm: size.heightCm,
      panels,
      colorId: color.id,
      colorName: color.name,
      framed,
      customText,
      script: customText ? script : null,
      composition: hasCompositions ? composition : null,
      note: note.trim() || null,
      unitPrice: price,
    });
    setAdded(true);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.25fr_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        {view === "photo" && photo ? (
          <div className="relative aspect-[4/5] overflow-hidden bg-sand sm:aspect-[4/3]">
            <Image
              src={photo}
              alt={product.titleAr ? `${product.title} · ${product.titleAr}` : product.title}
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain"
            />
          </div>
        ) : view === "interieur" && scene ? (
          <>
            <RealMockup
              scene={scene}
              style={composition}
              palette={color}
              text={customParts[0] || defaultTexts[0] || ""}
              script={script}
              className="aspect-[3/4] sm:aspect-[4/5]"
            />
            {scenes.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {scenes.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    aria-pressed={sc.id === scene.id}
                    onClick={() => setSceneId(sc.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${sc.id === scene.id ? "border-ink bg-sand" : "border-line hover:border-ink"}`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : view === "salon" ? (
          <RoomPreview {...art} />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-sand">
            {/* Le set occupe au plus 80 % de la largeur et 80 % de la hauteur du cadre 4:3 */}
            <div style={{ width: `${Math.min(80, (60 * (panels * size.widthCm + (panels - 1) * PANEL_GAP_CM)) / size.heightCm)}%` }}>
              <ArtSet {...art} />
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full border px-4 py-1.5 text-sm ${view === v ? "border-ink bg-ink text-cream" : "border-line"}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        {product.images.length > 1 && view === "photo" && (
          <div className="mt-3 flex gap-2">
            {product.images.map((src) => (
              <button
                key={src}
                type="button"
                aria-label="Voir cette photo"
                onClick={() => setPhoto(src)}
                className={`relative h-16 w-16 overflow-hidden border-2 ${src === photo ? "border-ink" : "border-transparent"}`}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-taupe">
          {view === "photo"
            ? "Photo du modèle. Votre toile est peinte à la main dans la taille et les couleurs choisies."
            : view === "interieur"
              ? `Votre toile peinte dans une vraie pièce${panels > 1 ? " (une toile du set)" : ""}. Le tracé final est validé avec vous avant la peinture.`
              : "Aperçu de votre choix, à titre indicatif. Chaque toile est peinte à la main : de légères variations font son caractère."}
        </p>
      </div>

      <div>
        <h1 className="font-serif text-4xl leading-tight">{product.title}</h1>
        {product.titleAr && (
          <p className="mt-1 font-arabic text-2xl text-taupe" dir="rtl">
            {product.titleAr}
          </p>
        )}
        <p className="mt-4 text-2xl">{price != null ? formatDH(price) : "Sur devis"}</p>
        <p className="mt-4 text-taupe">{product.description}</p>

        {hasCompositions && (
          <Fieldset legend={`Composition : ${COMPOSITIONS[composition]?.label ?? ""}`}>
            {product.compositions.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={c === composition}
                title={COMPOSITIONS[c]?.label}
                onClick={() => {
                  setComposition(c);
                  setSceneId(null);
                  showPreview();
                }}
                className={`w-[84px] border p-1 text-left ${c === composition ? "border-ink" : "border-line hover:border-ink"}`}
              >
                <span className="relative block aspect-[3/4] overflow-hidden">
                  {COMPOSITIONS[c] && (
                    <Image src={COMPOSITIONS[c].image} alt="" fill sizes="84px" className="object-cover object-[50%_30%]" />
                  )}
                </span>
                <span className="mt-1 block text-[11px]">{COMPOSITIONS[c]?.label}</span>
              </button>
            ))}
          </Fieldset>
        )}

        {product.panelOptions.length > 1 && (
          <Fieldset legend="Format">
            {product.panelOptions.map((n) => (
              <Option key={n} active={n === panels} onClick={() => setPanels(n)}>
                {PANEL_LABELS[n] ?? `${n} toiles`}
              </Option>
            ))}
          </Fieldset>
        )}

        <Fieldset legend={`Taille${panels > 1 ? " de chaque toile" : ""} (cm)`}>
          {product.sizes.map((s) => (
            <Option key={s.id} active={s.id === sizeId} onClick={() => setSizeId(s.id)}>
              {s.label}
            </Option>
          ))}
        </Fieldset>

        <Fieldset legend={`Couleurs : ${color.name}`}>
          {product.colors.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.extraPrice ? `${c.name} (+${formatDH(c.extraPrice)} par toile)` : c.name}
              aria-label={c.name}
              aria-pressed={c.id === colorId}
              onClick={() => {
                setColorId(c.id);
                showPreview();
              }}
              className={`h-10 w-10 overflow-hidden rounded-full border-2 ${c.id === colorId ? "border-ink" : "border-transparent"}`}
            >
              <span
                className="block h-full w-full rounded-full"
                style={{ background: `linear-gradient(135deg, ${c.bg} 0 50%, ${c.accent} 50% 100%)`, boxShadow: `inset 0 0 0 2px ${c.ink}22` }}
              />
            </button>
          ))}
        </Fieldset>

        <Fieldset legend="Encadrement">
          <Option active={!framed} onClick={() => setFramed(false)}>
            Sans cadre
          </Option>
          <Option active={framed} onClick={() => setFramed(true)}>
            Cadre bois +{formatDH(size.framePrice * panels)}
          </Option>
        </Fieldset>

        {canCustomize && (
          <div className="mt-6">
            <p className="text-sm font-medium">Votre texte (optionnel)</p>
            <p className="mt-1 text-xs text-taupe">En arabe, {product.customTextMax} caractères max. Laissez vide pour garder le modèle.</p>
            <div className="mt-2 space-y-2">
              {Array.from({ length: panels }, (_, i) => (
                <input
                  key={i}
                  dir="rtl"
                  aria-label={panels > 1 ? `Texte de la toile ${i + 1}` : "Votre texte"}
                  maxLength={product.customTextMax}
                  placeholder={defaultTexts[i] || defaultTexts[0]}
                  value={texts[i] ?? ""}
                  onChange={(e) => {
                    showPreview();
                    setTexts((current) => {
                      const next = [...current];
                      next[i] = e.target.value;
                      return next;
                    });
                  }}
                  className="w-full border border-line bg-white px-4 py-2.5 font-arabic text-lg outline-none focus:border-ink"
                />
              ))}
            </div>
          </div>
        )}

        {canCustomize && (
          <Fieldset legend={`Écriture : ${SCRIPTS[script].label}`}>
            {SCRIPT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={id === script}
                onClick={() => {
                  setScript(id);
                  showPreview();
                }}
                className={`flex min-w-24 flex-col items-center border px-4 py-2 ${id === script ? "border-ink bg-white" : "border-line bg-white/60 hover:border-ink"}`}
              >
                <span dir="rtl" className="text-xl leading-9" style={{ fontFamily: SCRIPTS[id].fontFamily }}>
                  {(customParts[0] || defaultTexts[0] || "صبر").slice(0, 10)}
                </span>
                <span className="text-xs text-taupe">{SCRIPTS[id].label}</span>
              </button>
            ))}
          </Fieldset>
        )}

        <label className="mt-6 block text-sm font-medium" htmlFor="note">
          Une demande particulière ? (optionnel)
        </label>
        <textarea
          id="note"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 w-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
        />

        <p className="mt-6 text-sm text-taupe">
          Peinte en {product.productionDays} jours environ, puis livrée en 24 à 72 h. Paiement à la livraison.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAdd}
            disabled={price == null}
            className="flex-1 bg-ink px-6 py-3.5 text-sm text-cream hover:bg-bordeaux disabled:opacity-50"
          >
            Ajouter au panier · {price != null ? formatDH(price) : "—"}
          </button>
          <a
            href={whatsappLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border border-ink px-6 py-3.5 text-center text-sm hover:bg-ink hover:text-cream"
          >
            Commander sur WhatsApp
          </a>
        </div>
        {added && (
          <p className="mt-3 text-sm" role="status">
            Ajouté au panier. <Link href="/panier" className="underline underline-offset-4">Voir le panier</Link>
          </p>
        )}

        {product.rooms.length > 0 && (
          <p className="mt-8 border-t border-line pt-5 text-sm text-taupe">
            Idéale pour : {product.rooms.map((r) => ROOMS[r] ?? r).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`border px-4 py-2 text-sm ${active ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink"}`}
    >
      {children}
    </button>
  );
}
