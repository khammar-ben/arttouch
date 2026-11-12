export const ADMIN_COOKIE = "arttouch_admin";

/** Mot de passe admin ; ignore les espaces et guillemets collés par erreur dans Vercel. null si non configuré. */
export function adminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim().replace(/^(["'])(.*)\1$/, "$2");
  return password || null;
}

/** Jeton de session dérivé du mot de passe admin ; null si aucun mot de passe n'est configuré. */
export async function adminToken(): Promise<string | null> {
  const password = adminPassword();
  if (!password) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`arttouch-admin:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
