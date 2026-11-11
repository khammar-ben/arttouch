"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { COMPOSITIONS, compositionFactor } from "@/lib/compositions";
import { scenesFor } from "@/lib/mockup";
import { formatDH, unitPrice } from "@/lib/pricing";
import { SCRIPTS, SCRIPT_IDS } from "@/lib/scripts";
import { whatsappLink } from "@/lib/site";
import type { ArtStyle, ProductDTO, Script } from "@/lib/types";
import { RealMockup } from "./RealMockup";

const MAX_LENGTH = 25;

const INSPIRATIONS = [
  { id: "valeurs", label: "Valeurs", words: ["صبر", "شكر", "توكل", "رضا", "أمل", "سكينة"] },
  { id: "versets", label: "Versets & douʿas", words: ["فصبر جميل", "إن مع العسر يسرا", "الحمد لله", "ما شاء الله", "رب اشرح لي صدري"] },
  { id: "prenoms", label: "Prénoms", words: ["مريم", "آدم", "يوسف", "سلمى", "إلياس", "ليلى"] },
];

// Format proposé par défaut depuis l'atelier
const STUDIO_SIZE = "60×90";

/** Résumé d'une toile de la boutique, pour les inspirations et les associations */
export type BoutiqueItem = { slug: string; title: string; image: string; fromPrice: number };

type Props = { product: ProductDTO; boutique: BoutiqueItem[] };

/**
 * Atelier de la page d'accueil : le visiteur compose sa toile (texte, composition, écriture, couleurs)
 * et la voit peinte dans de vraies photos d'intérieur, puis part commander avec ses choix.
 * Chaque composition renvoie à la toile de la boutique qui l'a inspirée et à celles qui vont bien avec.
 */
export function WordStudio({ product, boutique }: Props) {
  const { colors } = product;
  const firstComposition = product.compositions[0] ?? "calligraphy";
  const [text, setText] = useState("سكينة");
  const [script, setScript] = useState<Script>("ruqaa");
  const [composition, setComposition] = useState<ArtStyle>(firstComposition);
  const [colorId, setColorId] = useState(
    () => (colors.find((c) => c.name === COMPOSITIONS[firstComposition]?.palette) ?? colors[0]).id,
  );
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [tab, setTab] = useState(INSPIRATIONS[0].id);

  const color = colors.find((c) => c.id === colorId) ?? colors[0];
  const word = text.trim() || "سكينة";
  const meta = COMPOSITIONS[composition];
  const scenes = scenesFor(composition);
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const size = product.sizes.find((s) => s.label === STUDIO_SIZE) ?? product.sizes[0];
  const price = unitPrice(product, size, 1, color, false, compositionFactor(composition));
  const bySlug = (slug: string) => boutique.find((b) => b.slug === slug);
  const inspiration = meta && bySlug(meta.inspiredBy);
  const pairs = (meta?.pairs ?? []).map(bySlug).filter((b): b is BoutiqueItem => Boolean(b));

  const query = new URLSearchParams({ texte: word, composition, ecriture: script, couleur: color.name, taille: size.label });
  const sketchMessage = `Salam, j'aimerais recevoir le croquis de ma toile : « ${word} », composition ${meta?.label}, écriture ${SCRIPTS[script].label}, couleurs ${color.name}, ${size.label} cm.`;

  function chooseComposition(c: ArtStyle) {
    setComposition(c);
    // Chaque composition s'ouvre dans sa propre scène, avec les couleurs de sa toile d'inspiration
    setSceneId(null);
    const suggested = colors.find((col) => col.name === COMPOSITIONS[c]?.palette);
    if (suggested) setColorId(suggested.id);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          {scene ? (
            <RealMockup scene={scene} style={composition} palette={color} text={word} script={script} className="aspect-[3/4]" />
          ) : (
            <div className="aspect-[3/4] bg-white/5" />
          )}
          {scenes.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {scenes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === scene?.id}
                  onClick={() => setSceneId(s.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs ${
                    s.id === scene?.id ? "bg-cream text-ink" : "border border-white/20 text-cream hover:border-cream/70"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-cream/55">
            Aperçu de votre toile dans une vraie pièce. Le tracé final est dessiné à la main et validé avec vous avant la peinture.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-terracotta">Atelier sur mesure</p>
          <h2 className="mt-3 font-serif text-5xl leading-[1.05]">Votre mot, votre toile</h2>
          <p className="mt-4 max-w-md text-cream/70">
            Un mot qui vous porte, un verset, le prénom d&apos;un enfant. Composez votre toile ici : nous la dessinons à la main et
            vous envoyons le croquis avant de peindre.
          </p>

          <Step n="01" title="Votre texte">
            <div className="relative">
              <input
                dir="rtl"
                value={text}
                maxLength={MAX_LENGTH}
                onChange={(e) => setText(e.target.value)}
                aria-label="Votre texte en arabe"
                placeholder="اكتب كلمتك"
                className="w-full border border-white/15 bg-white/5 py-3 ps-4 pe-16 text-3xl text-cream outline-none placeholder:text-cream/30 focus:border-cream/60"
                style={{ fontFamily: SCRIPTS[script].fontFamily }}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs tabular-nums text-cream/45">
                {[...text].length}/{MAX_LENGTH}
              </span>
            </div>
            <div className="mt-4 flex gap-4 border-b border-white/10 text-xs">
              {INSPIRATIONS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={tab === group.id}
                  onClick={() => setTab(group.id)}
                  className={`-mb-px border-b pb-2 ${tab === group.id ? "border-cream text-cream" : "border-transparent text-cream/50 hover:text-cream"}`}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {INSPIRATIONS.find((g) => g.id === tab)!.words.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setText(w)}
                  className={`rounded-full border px-3 py-1 font-arabic text-base ${
                    w === text ? "border-cream bg-cream text-ink" : "border-white/20 hover:border-cream/70"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </Step>

          <Step n="02" title={`La composition : ${meta?.label ?? ""}`}>
            <div className="grid grid-cols-3 gap-2">
              {product.compositions.map((c) => {
                const info = COMPOSITIONS[c];
                if (!info) return null;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={c === composition}
                    onClick={() => chooseComposition(c)}
                    className={`group relative aspect-[3/4] overflow-hidden ring-1 ${
                      c === composition ? "ring-2 ring-cream" : "ring-white/15 hover:ring-white/50"
                    }`}
                  >
                    <Image
                      src={info.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 12vw, 30vw"
                      className="object-cover object-[50%_30%] transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-xs">
                      {info.label}
                      {info.priceFactor > 1 && <span className="ms-1 text-cream/60">+{Math.round((info.priceFactor - 1) * 100)}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {inspiration && (
              <Link
                href={`/produit/${inspiration.slug}`}
                className="group mt-3 flex items-center gap-3 border border-white/10 p-2 pe-4 hover:border-white/30"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden">
                  <Image src={inspiration.image} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="text-xs text-cream/60">
                  Inspirée de notre toile
                  <span className="block font-serif text-base text-cream group-hover:underline">{inspiration.title}</span>
                </span>
              </Link>
            )}
          </Step>

          <Step n="03" title="L'écriture">
            <div className="grid grid-cols-3 gap-2">
              {SCRIPT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === script}
                  onClick={() => setScript(id)}
                  className={`flex flex-col items-center gap-1 border px-2 pb-2 pt-3 ${
                    id === script ? "border-cream bg-white/10" : "border-white/15 hover:border-white/40"
                  }`}
                >
                  <span dir="rtl" className="h-10 truncate text-2xl leading-10" style={{ fontFamily: SCRIPTS[id].fontFamily }}>
                    {[...word].slice(0, 8).join("")}
                  </span>
                  <span className="text-[11px] text-cream/60">
                    {SCRIPTS[id].label} · {SCRIPTS[id].labelAr}
                  </span>
                </button>
              ))}
            </div>
          </Step>

          <Step n="04" title={`Les couleurs : ${color.name}${color.extraPrice ? ` (+${formatDH(color.extraPrice)})` : ""}`}>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={c.id === colorId}
                  onClick={() => setColorId(c.id)}
                  className={`h-11 w-11 rounded-full p-0.5 ring-1 ${c.id === colorId ? "ring-cream" : "ring-white/15 hover:ring-white/50"}`}
                >
                  <span
                    className="block h-full w-full rounded-full"
                    style={{ background: `linear-gradient(135deg, ${c.bg} 0 52%, ${c.accent} 52% 100%)` }}
                  />
                </button>
              ))}
            </div>
          </Step>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <Link
              href={`/produit/${product.slug}?${query}`}
              className="bg-cream px-6 py-3.5 text-center text-sm font-medium text-ink hover:bg-white"
            >
              Commander · {size.label} cm{price != null ? `, ${formatDH(price)}` : ""}
            </Link>
            <a
              href={whatsappLink(sketchMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 px-6 py-3.5 text-center text-sm hover:border-cream"
            >
              Recevoir le croquis gratuit
            </a>
          </div>
          <p className="mt-4 text-xs text-cream/50">
            Autres tailles de 30×40 à 80×120 · Peinte en 7 jours · Paiement à la livraison
          </p>
        </div>
      </div>

      {pairs.length > 0 && (
        <div className="mt-20 border-t border-white/10 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-terracotta">Composer un mur</p>
              <h3 className="mt-2 font-serif text-3xl">Ça va bien avec votre toile</h3>
            </div>
            <p className="max-w-sm text-sm text-cream/60">
              Notre sélection de la boutique pour accompagner une composition {meta?.label.toLowerCase()} : mêmes tons, même calme.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {pairs.map((p) => (
              <Link key={p.slug} href={`/produit/${p.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3 font-serif text-lg">{p.title}</p>
                <p className="text-sm text-cream/60">À partir de {formatDH(p.fromPrice)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="mb-3 flex items-baseline gap-3 text-sm">
        <span className="font-serif text-lg text-terracotta">{n}</span>
        <span className="font-medium">{title}</span>
      </p>
      {children}
    </div>
  );
}
