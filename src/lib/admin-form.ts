import { z, type ZodError } from "zod";

/** Nombre entier saisi dans un champ texte ("" refusé, contrairement à z.coerce). */
export function int(label: string, min = 0, max = 1_000_000) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} : nombre entier attendu.`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${label} : entre ${min} et ${max}.`);
}

export const slugSchema = z
  .string()
  .min(2, "Adresse trop courte.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets uniquement.");

/** Violation d'unicité Prisma (slug, nom… déjà pris). */
export function isUniqueError(e: unknown) {
  return (e as { code?: string } | null)?.code === "P2002";
}

/** Retour des formulaires de l'atelier (useActionState). */
export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;

export function invalid(error: ZodError, message = "Merci de corriger les champs en rouge."): FormState {
  return { ok: false, message, fieldErrors: error.flatten().fieldErrors };
}

export function failure(message: string): FormState {
  return { ok: false, message };
}

export function success(message = "Enregistré."): FormState {
  return { ok: true, message };
}

/** Champ texte d'un FormData ("" si absent). */
export function text(fd: FormData, key: string) {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Case à cocher : présente = cochée. */
export function checked(fd: FormData, key: string) {
  return fd.get(key) != null;
}

/** Valeurs multiples (cases à cocher de même nom). */
export function list(fd: FormData, key: string) {
  return fd.getAll(key).filter((v): v is string => typeof v === "string" && v !== "");
}
