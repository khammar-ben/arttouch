"use client";

import { useEffect, useRef, useState } from "react";
import { paintArt, renderArt } from "@/lib/art-raster";
import { artWidthFor, composeMockup, shadeUrl, type MockupScene } from "@/lib/mockup";
import { createMockupRenderer, type MockupRenderer } from "@/lib/mockup-gl";
import type { ArtPalette, ArtStyle, Script } from "@/lib/types";

type Images = { photo: HTMLImageElement; shade: HTMLImageElement };

// Les images de chaque scène sont téléchargées une seule fois par page
const imageCache = new Map<string, Promise<Images>>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
    img.src = src;
  });
}

function loadScene(scene: MockupScene) {
  let images = imageCache.get(scene.id);
  if (!images) {
    images = Promise.all([loadImage(scene.photo), loadImage(shadeUrl(scene))]).then(([photo, shade]) => ({ photo, shade }));
    images.catch(() => imageCache.delete(scene.id));
    imageCache.set(scene.id, images);
  }
  return images;
}

function pixels(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

type Props = {
  scene: MockupScene;
  style: ArtStyle;
  palette: ArtPalette;
  text: string;
  script: Script;
  className?: string;
};

/**
 * La toile du client, peinte avec ses choix, posée dans une vraie photo :
 * perspective, lumière et grain du tissu de la scène.
 * Rendu sur la carte graphique (WebGL), avec un repli processeur ; rien n'est chargé avant que l'aperçu approche de l'écran.
 */
export function RealMockup({ scene, style, palette, text, script, className }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artCanvas = useRef<HTMLCanvasElement | null>(null);
  const engine = useRef<{ gl: MockupRenderer | null; scene: string | null; cpu?: { scene: string; photo: ImageData; shade: ImageData } }>({
    gl: null,
    scene: null,
  });
  const [visible, setVisible] = useState(false);
  const [shownScene, setShownScene] = useState<string | null>(null);
  // Passe au rendu processeur si WebGL est absent, échoue ou perd son contexte
  const [cpuOnly, setCpuOnly] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    // Une seule mise à jour par image affichée, même si l'on tape vite
    const frame = requestAnimationFrame(async () => {
      try {
        const images = await loadScene(scene);
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const state = engine.current;
        artCanvas.current ??= document.createElement("canvas");
        const art = { style, palette, text, script };

        if (!cpuOnly) {
          if (!state.gl) {
            state.gl = createMockupRenderer(canvas, () => {
              engine.current.gl = null;
              setShownScene(null);
              setCpuOnly(true);
            });
            // Le canvas porte peut-être déjà un contexte WebGL inutilisable : le repli se fait sur un canvas neuf
            if (!state.gl) return setCpuOnly(true);
            state.scene = null;
          }
          if (state.scene !== scene.id) {
            state.gl.setScene(scene, images.photo, images.shade);
            state.scene = scene.id;
          }
          await paintArt(artCanvas.current, art, artWidthFor(scene), scene.aspect);
          if (cancelled) return;
          state.gl.render(artCanvas.current);
        } else {
          // Sans WebGL : même rendu, calculé pixel par pixel
          if (state.cpu?.scene !== scene.id) state.cpu = { scene: scene.id, photo: pixels(images.photo), shade: pixels(images.shade) };
          const flat = await renderArt(artCanvas.current, art, artWidthFor(scene), scene.aspect);
          if (cancelled) return;
          const [width, height] = scene.size;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          const out = ctx.createImageData(width, height);
          composeMockup(scene, state.cpu.photo, state.cpu.shade, flat, out);
          ctx.putImageData(out, 0, 0);
        }
        setShownScene(scene.id);
      } catch {
        // Scène indisponible : le fond neutre reste affiché
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [visible, cpuOnly, scene, style, palette, text, script]);

  const ready = shownScene === scene.id;
  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-[#2a2622] ${className ?? ""}`}>
      <canvas
        key={cpuOnly ? "cpu" : "webgl"}
        ref={canvasRef}
        width={scene.size[0]}
        height={scene.size[1]}
        role="img"
        data-renderer={ready ? (cpuOnly ? "cpu" : "webgl") : undefined}
        aria-label={`Aperçu de votre toile « ${text} » ${scene.label.toLowerCase()}`}
        className={`absolute inset-0 h-full w-full object-cover ${ready ? "" : "invisible"}`}
      />
      {!ready && <div className="absolute inset-0 animate-pulse bg-white/5" aria-hidden />}
    </div>
  );
}
