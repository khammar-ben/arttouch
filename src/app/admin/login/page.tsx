import type { Metadata } from "next";
import { login } from "../actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 pt-24">
      <h1 className="font-serif text-4xl">Espace atelier</h1>
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
          className="w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink"
        />
        {error && <p className="text-sm text-bordeaux">Mot de passe incorrect.</p>}
        <button type="submit" className="w-full bg-ink px-6 py-3 text-sm text-cream hover:bg-bordeaux">
          Entrer
        </button>
      </form>
    </div>
  );
}
