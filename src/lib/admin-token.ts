export const ADMIN_COOKIE = "arttouch_admin";

/** Jeton de session dérivé du mot de passe admin ; null si aucun mot de passe n'est configuré. */
export async function adminToken(): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`arttouch-admin:${password}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
