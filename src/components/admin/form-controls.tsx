"use client";

import { startTransition, useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/admin-form";
import { buttonClass } from "./ui";

type Variant = keyof typeof buttonClass;

/**
 * Envoie le formulaire à une action serveur sans le vider.
 * (Avec <form action>, React 19 réinitialise les champs après chaque envoi, même quand l'action renvoie une erreur.)
 */
export function useAdminForm(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, pending, onSubmit };
}

export function SubmitButton({
  children,
  pendingLabel = "Enregistrement…",
  variant = "primary",
  className,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  /** État d'envoi fourni par useAdminForm ; sinon celui du <form action> parent */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={`${buttonClass[variant]} ${className ?? ""}`}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Bouton d'envoi qui demande confirmation (suppression…). */
export function ConfirmButton({
  children,
  message,
  variant = "danger",
  className,
  pending: pendingProp,
}: {
  children: React.ReactNode;
  message: string;
  variant?: Variant;
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`${buttonClass[variant]} ${className ?? ""}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-[#245a31]" : "text-bordeaux"}`}>
      {state.message}
    </p>
  );
}
