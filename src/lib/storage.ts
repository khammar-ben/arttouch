// Photos produits sur Supabase Storage (Vercel n'a pas de disque persistant).
// Seule la clé secrète SUPABASE_SERVICE_ROLE_KEY est obligatoire : l'URL du projet se déduit de DATABASE_URL.

const BUCKET = "toiles";

function supabaseUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL.replace(/\/+$/, "");
  // Le pooler Supabase se connecte avec l'utilisateur postgres.<ref du projet>
  const ref = process.env.DATABASE_URL?.match(/\/\/postgres\.([a-z0-9]+)[:@]/)?.[1];
  return ref ? `https://${ref}.supabase.co` : null;
}

export function storageConfigured() {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Envoie une image et renvoie son URL publique. */
export async function uploadImage(file: Blob, extension: string): Promise<string> {
  const base = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Stockage des photos non configuré.");
  const auth = { apikey: key, Authorization: `Bearer ${key}` };
  const path = `produits/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

  const send = () =>
    fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: { ...auth, "Content-Type": file.type, "Cache-Control": "max-age=31536000" },
      body: file,
    });

  let res = await send();
  if (!res.ok && (await res.clone().text()).includes("Bucket not found")) {
    // Premier envoi : on crée le dossier public des photos
    await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    res = await send();
  }
  if (!res.ok) throw new Error(`Envoi refusé par Supabase (${res.status}) : ${(await res.text()).slice(0, 200)}`);
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
