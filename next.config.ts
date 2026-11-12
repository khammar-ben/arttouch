import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Un package-lock.json existe aussi dans le dossier utilisateur : on fixe la racine du projet ici.
  outputFileTracingRoot: process.cwd(),
  // Photos produits envoyées depuis l'atelier (Supabase Storage)
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // Les photos sont réduites dans le navigateur avant l'envoi ; marge sous la limite de 4,5 Mo de Vercel
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Quand le disque manque de place : NEXT_NO_BUILD_CACHE=1 npm run build (pas de cache webpack sur disque)
  webpack: (config) => {
    if (process.env.NEXT_NO_BUILD_CACHE) config.cache = false;
    return config;
  },
};

export default nextConfig;
