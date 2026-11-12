"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes", badge: "toConfirm" },
  { href: "/admin/production", label: "Production" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/tailles", label: "Tailles & prix" },
  { href: "/admin/couleurs", label: "Couleurs" },
] as const;

export function AdminNav({ toConfirm }: { toConfirm: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        const count = "badge" in link ? toConfirm : 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-3 px-3 py-2 ${
              active ? "bg-ink text-cream" : "hover:bg-sand"
            }`}
          >
            {link.label}
            {count > 0 && (
              <span className={`rounded-full px-2 text-xs ${active ? "bg-cream text-ink" : "bg-terracotta text-cream"}`}>{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
