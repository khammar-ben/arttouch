import type { Metadata } from "next";
import Link from "next/link";
import { adminPassword } from "@/lib/admin-token";
import { login } from "../actions";

export const metadata: Metadata = { title: "Connexion à l'atelier", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="font-serif text-3xl leading-none">Arttouch</p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-terracotta">Atelier</p>
        {children}
      </div>
    </div>
  );
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!adminPassword()) {
    return (
      <Shell>
        <p className="mt-8 text-sm text-bordeaux">
          L&apos;accès n&apos;est pas configuré : ajouter la variable <code>ADMIN_PASSWORD</code> au projet Vercel, puis redéployer.
        </p>
      </Shell>
    );
  }
  return (
    <Shell>
      <form action={login} className="mt-8 space-y-4">
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
        {error && <p className="text-sm text-bordeaux">Mot de passe incorrect.</p>}
        <button type="submit" className="w-full bg-ink px-6 py-3 text-sm text-cream hover:bg-bordeaux">
          Entrer
        </button>
      </form>
      <Link href="/" className="mt-6 block text-center text-xs text-taupe hover:text-ink">
        ← Retour à la boutique
      </Link>
    </Shell>
  );
}
