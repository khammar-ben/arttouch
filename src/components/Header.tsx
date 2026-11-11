import Link from "next/link";
import { CartLink } from "./cart/CartLink";

const NAV = [
  { href: "/boutique", label: "Boutique" },
  { href: "/boutique?collection=calligraphie", label: "Calligraphie" },
  { href: "/boutique?collection=abstrait", label: "Abstrait" },
  { href: "/produit/votre-mot", label: "Personnaliser" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="font-serif text-2xl tracking-wide">
          Arttouch
        </Link>
        <nav className="hidden gap-7 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-bordeaux">
              {item.label}
            </Link>
          ))}
        </nav>
        <CartLink />
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-sm md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 hover:text-bordeaux">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
