import Link from "next/link";
import { whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl">Arttouch</p>
          <p className="mt-3 max-w-xs text-sm text-taupe">
            Toiles peintes à la main au Maroc. Calligraphie, abstrait et line art, faits sur commande pour votre intérieur.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Boutique</p>
          <ul className="space-y-2 text-taupe">
            <li><Link href="/boutique" className="hover:text-ink">Toutes les toiles</Link></li>
            <li><Link href="/produit/votre-mot" className="hover:text-ink">Personnaliser une toile</Link></li>
            <li><Link href="/panier" className="hover:text-ink">Panier</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-medium">Une question ?</p>
          <a
            href={whatsappLink("Salam, j'ai une question sur vos toiles.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-ink px-4 py-2 hover:bg-ink hover:text-cream"
          >
            Écrire sur WhatsApp
          </a>
          <p className="mt-4 text-taupe">Paiement à la livraison partout au Maroc.</p>
        </div>
      </div>
      <p className="border-t border-line py-5 text-center text-xs text-taupe">© {new Date().getFullYear()} Arttouch</p>
    </footer>
  );
}
