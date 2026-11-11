import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDH } from "@/lib/pricing";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Merci", robots: { index: false } };

export default async function ThankYouPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const firstName = order.customerName.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-terracotta">Commande {order.number}</p>
      <h1 className="mt-4 font-serif text-5xl">Merci {firstName} !</h1>
      <p className="mt-5 text-taupe">
        Nous vous appelons très vite pour confirmer votre commande. Ensuite, votre toile est peinte à la main et nous vous
        envoyons une photo sur WhatsApp avant l&apos;expédition.
      </p>

      <ul className="mx-auto mt-10 max-w-md divide-y divide-line border-y border-line text-left text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 py-3">
            <span>
              {item.title} × {item.quantity}
              <span className="block text-xs text-taupe">
                {item.sizeLabel} cm · {item.colorName}
                {item.framed ? " · Cadre bois" : ""}
              </span>
            </span>
            <span className="shrink-0">{formatDH(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3 font-medium">
          <span>Total à payer à la livraison</span>
          <span>{formatDH(order.total)}</span>
        </li>
      </ul>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <a
          href={whatsappLink(`Salam, je viens de passer la commande ${order.number}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-ink px-6 py-3 text-sm text-cream hover:bg-bordeaux"
        >
          Nous écrire sur WhatsApp
        </a>
        <Link href="/boutique" className="border border-ink px-6 py-3 text-sm hover:bg-ink hover:text-cream">
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
}
