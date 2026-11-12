import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton, SubmitButton } from "@/components/admin/form-controls";
import { buttonClass, OrderStatusBadge, PageHeader, Panel } from "@/components/admin/ui";
import { formatDateTime, PANEL_LABELS, PAYMENT_METHODS } from "@/lib/admin-labels";
import { COMPOSITIONS } from "@/lib/compositions";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/order-status";
import { formatDH } from "@/lib/pricing";
import { isScript, SCRIPTS } from "@/lib/scripts";
import type { ArtStyle } from "@/lib/types";
import { deleteOrder, setOrderStatus, updateOrderCustomer, updateOrderShipping } from "../../../actions";
import { CustomerForm, PrintButton, ShippingForm } from "./OrderForms";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const order = await db.order.findUnique({ where: { id: (await params).id }, select: { number: true } });
  return { title: order?.number ?? "Commande" };
}

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: { include: { product: { select: { id: true } } } } } });
  if (!order) notFound();

  const step = ORDER_STATUSES.find((s) => s.id === order.status);
  const whatsapp = order.phone.replace(/^\+/, "").replace(/^0/, "212");
  const firstName = order.customerName.split(" ")[0];
  const message = `Bonjour ${firstName}, ici l'atelier Arttouch au sujet de votre commande ${order.number}.`;

  return (
    <div>
      <Link href="/admin/commandes" className="text-sm text-taupe hover:text-ink print:hidden">
        ← Commandes
      </Link>
      <PageHeader
        title={`Commande ${order.number}`}
        description={`Passée le ${formatDateTime(order.createdAt)} · ${PAYMENT_METHODS[order.paymentMethod] ?? order.paymentMethod}`}
        actions={
          <>
            {step?.next && (
              <form action={setOrderStatus}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={step.next} />
                <SubmitButton pendingLabel="…">{step.action}</SubmitButton>
              </form>
            )}
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass.secondary}
            >
              WhatsApp
            </a>
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Articles" actions={<OrderStatusBadge status={order.status} />}>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-4 py-4 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {item.quantity} × {item.title}
                      {item.product && (
                        <Link href={`/admin/produits/${item.product.id}`} className="ml-2 text-xs font-normal text-taupe underline print:hidden">
                          fiche produit
                        </Link>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-taupe">
                      {PANEL_LABELS[item.panels] ?? `${item.panels} panneaux`} · {item.sizeLabel} cm · {item.colorName}
                      {item.framed ? " · Avec cadre" : " · Sans cadre"}
                      {item.composition ? ` · Composition ${COMPOSITIONS[item.composition as ArtStyle]?.label ?? item.composition}` : ""}
                    </p>
                    {item.customText && (
                      <div className="mt-2 bg-cream px-3 py-2">
                        <p
                          className="text-right text-2xl"
                          dir="rtl"
                          style={{ fontFamily: SCRIPTS[isScript(item.script) ? item.script : "ruqaa"].fontFamily }}
                        >
                          {item.customText.split("|").join(" · ")}
                        </p>
                        {isScript(item.script) && <p className="text-xs text-taupe">Écriture : {SCRIPTS[item.script].label}</p>}
                      </div>
                    )}
                    {item.note && <p className="mt-2 text-sm italic">« {item.note} »</p>}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p>{formatDH(item.unitPrice * item.quantity)}</p>
                    {item.quantity > 1 && <p className="text-xs text-taupe">{formatDH(item.unitPrice)} l&apos;unité</p>}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-taupe">Sous-total</dt>
                <dd className="tabular-nums">{formatDH(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-taupe">Livraison</dt>
                <dd className="tabular-nums">{order.shippingFee ? formatDH(order.shippingFee) : "Offerte"}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatDH(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Client" description="Corriger une adresse ou un numéro après l'appel de confirmation.">
            <CustomerForm action={updateOrderCustomer.bind(null, order.id)} customer={order} />
          </Panel>
        </div>

        <div className="space-y-6 print:hidden">
          <Panel title="Statut & expédition">
            <ShippingForm action={updateOrderShipping.bind(null, order.id)} status={order.status} trackingNumber={order.trackingNumber} />
            <p className="mt-4 text-xs text-taupe">Dernière mise à jour : {formatDateTime(order.updatedAt)}</p>
          </Panel>

          <Panel title="Zone sensible">
            <p className="mb-3 text-sm text-taupe">
              Pour une commande abandonnée, préférez le statut « Annulée » : elle reste dans l&apos;historique. La suppression est définitive.
            </p>
            <form action={deleteOrder}>
              <input type="hidden" name="orderId" value={order.id} />
              <ConfirmButton message={`Supprimer définitivement la commande ${order.number} ?`}>Supprimer la commande</ConfirmButton>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
