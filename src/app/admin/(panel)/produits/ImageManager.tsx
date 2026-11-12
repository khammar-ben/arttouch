"use client";

import { useRef, useState } from "react";
import { buttonClass, fieldClass } from "@/components/admin/ui";

type Upload = (fd: FormData) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;

const MAX_SIDE = 1800;
const LOCAL_PATH = /^\/[^\s,]+$/;

/** Réduit la photo dans le navigateur (WebP, 1800 px max) : envoi rapide et sous la limite de Vercel. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  const webp = await encode("image/webp");
  // Certains Safari ne savent pas encoder le WebP et renvoient du PNG
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("Impossible de lire cette photo.");
  return jpeg;
}

export function ImageManager({
  initial,
  upload,
  storageReady,
  error,
}: {
  initial: string[];
  upload: Upload;
  storageReady: boolean;
  error?: string[];
}) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [path, setPath] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const move = (from: number, to: number) =>
    setImages((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage(null);
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const fd = new FormData();
        const blob = await shrink(file);
        fd.append("file", blob, file.name);
        const result = await upload(fd);
        if (result.ok) setImages((list) => [...list, result.url]);
        else setMessage(`${file.name} : ${result.message}`);
      } catch (e) {
        setMessage(`${file.name} : ${e instanceof Error ? e.message : "envoi impossible"}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function addPath() {
    const value = path.trim();
    if (!LOCAL_PATH.test(value)) {
      setMessage("Adresse attendue sous la forme /toiles/ma-photo.jpg (fichier du dossier public).");
      return;
    }
    setImages((list) => [...list, value]);
    setPath("");
    setMessage(null);
  }

  return (
    <div>
      <input type="hidden" name="images" value={images.join(",")} />

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((src, i) => (
            <li key={`${src}-${i}`} className="border border-line bg-cream">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                {/* Aperçu brut : l'adresse n'est validée qu'à l'enregistrement */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 bg-ink px-2 py-0.5 text-[0.65rem] text-cream">Principale</span>}
              </div>
              <div className="flex items-center justify-between px-1 py-1 text-sm">
                <div className="flex">
                  <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="px-2 py-1 disabled:opacity-30" aria-label="Avancer la photo">
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1}
                    onClick={() => move(i, i + 1)}
                    className="px-2 py-1 disabled:opacity-30"
                    aria-label="Reculer la photo"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setImages((list) => list.filter((_, j) => j !== i))}
                  className="px-2 py-1 text-bordeaux"
                  aria-label="Retirer la photo"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-line bg-cream/50 px-4 py-6 text-center text-sm text-taupe">
          Pas de photo : la boutique affiche un aperçu dessiné à partir du style et des couleurs.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {storageReady ? (
          <>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy > 0} className={buttonClass.secondary}>
              {busy > 0 ? `Envoi en cours (${busy})…` : "Ajouter des photos"}
            </button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <span className="text-xs text-taupe">JPEG, PNG ou WebP · réduites automatiquement · la première est la principale</span>
          </>
        ) : (
          <p className="text-xs text-bordeaux">
            Envoi de photos désactivé : ajouter <code>SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → Project Settings → API Keys) dans .env et
            sur Vercel.
          </p>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-taupe">Ajouter une photo du dossier public</summary>
        <div className="mt-2 flex max-w-md gap-2">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPath();
              }
            }}
            placeholder="/toiles/ma-photo.jpg"
            className={fieldClass}
          />
          <button type="button" onClick={addPath} className={buttonClass.secondary}>
            Ajouter
          </button>
        </div>
      </details>

      {(message || error?.length) && <p className="mt-2 text-sm text-bordeaux">{message ?? error?.[0]}</p>}
    </div>
  );
}
