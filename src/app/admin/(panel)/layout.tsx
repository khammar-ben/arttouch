import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: { default: "Atelier", template: "%s · Atelier Arttouch" },
  robots: { index: false },
};
export const dynamic = "force-dynamic";

function ShopAndLogout({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link href="/" target="_blank" className="hover:text-bordeaux">
        Voir la boutique ↗
      </Link>
      <form action={logout}>
        <button type="submit" className="hover:text-bordeaux">
          Déconnexion
        </button>
      </form>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const toConfirm = await db.order.count({ where: { status: "TO_CONFIRM" } });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white/70 print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/admin" className="font-serif text-2xl leading-none">
            Arttouch
            <span className="mt-1 block font-sans text-[0.65rem] uppercase tracking-[0.25em] text-terracotta">Atelier</span>
          </Link>
          <ShopAndLogout className="flex gap-4 text-sm lg:hidden" />
        </div>
        <AdminNav toConfirm={toConfirm} />
        <ShopAndLogout className="mt-auto hidden space-y-2 border-t border-line px-6 py-4 text-sm lg:block" />
      </aside>
      <div className="min-w-0 px-4 py-6 lg:px-10 lg:py-8">{children}</div>
    </div>
  );
}
