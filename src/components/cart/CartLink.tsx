"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count, hydrated } = useCart();
  return (
    <Link href="/panier" className="relative inline-flex items-center gap-1.5 text-sm hover:text-bordeaux">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span>Panier</span>
      {hydrated && count > 0 && (
        <span className="ml-0.5 rounded-full bg-bordeaux px-1.5 text-[11px] font-medium leading-5 text-cream">{count}</span>
      )}
    </Link>
  );
}
