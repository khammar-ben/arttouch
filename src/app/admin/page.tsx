import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CANCELLABLE, ORDER_STATUSES } from "@/lib/order-status";
import { formatDH } from "@/lib/pricing";
import { COMPOSITIONS } from "@/lib/compositions";
import { isScript, SCRIPTS } from "@/lib/scripts";
import type { ArtStyle } from "@/lib/types";
import { logout, setOrderStatus } from "./actions";

export const metadata: Metadata = { title: "Production", robots: { index: false } };
export const dynamic = "force-dynamic";

const PANEL_LABELS: Record<number, string> = { 1: "Seule", 2: "Duo", 3: "Trio" };

export default async function AdminPage() {
  const [orders, delivered] = await Promise.all([
    db.order.findMany({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    }),
    db.order.findMany({ where: { status: "DELIVERED" }, include: { items: true }, orderBy: { updatedAt: "desc" }, take: 10 }),
  ]);
  const all = [...orders, ...delivered];
  const revenue = delivered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="px-4 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Production</h1>
          <p className="mt-1 text-sm text-taupe">
            {orders.length} commande{orders.length > 1 ? "s" : ""} en cours · {formatDH(revenue)} sur les 10 dernières livrées
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm underline underline-offset-4">
            Déconnexion
          </button>
        </form>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto pb-6">
        {ORDER_STATUSES.map((status) => {
          const column = all.filter((o) => o.status === status.id);
          // Défilement horizontal sur petit écran ; sur grand écran les 6 colonnes tiennent sans barre
          return (
            <section key={status.id} className="w-72 shrink-0 bg-sand/60 p-3 2xl:w-auto 2xl:min-w-0 2xl:flex-1">
              <h2 className="flex items-center justify-between px-1 text-sm font-medium">
                {status.label}
                <span className="rounded-full bg-cream px-2 text-xs">{column.length}</span>
              </h2>
              <div className="mt-3 space-y-3">
                {column.length === 0 && <p className="px-1 text-xs text-taupe">Aucune commande</p>}
                {column.map((order) => {
                  const phone = order.phone.replace(/^0/, "212").replace(/^\+/, "");
                  return (
                    <article key={order.id} className="bg-white p-4 text-sm shadow-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium">{order.number}</p>
                        <p className="text-xs text-taupe">{order.createdAt.toLocaleDateString("fr-MA")}</p>
                      </div>
                      <p className="mt-1">
                        {order.customerName} · {order.city}
                      </p>
                      <p className="text-xs text-taupe">{order.address}</p>
                      <div className="mt-1 flex gap-3 text-xs">
                        <a href={`tel:${order.phone}`} className="underline">
                          {order.phone}
                        </a>
                        <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="underline">
                          WhatsApp
                        </a>
                      </div>

                      <ul className="mt-3 space-y-2 border-t border-line pt-3">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <p>
                              {item.quantity} × {item.title}
                            </p>
                            <p className="text-xs text-taupe">
                              {PANEL_LABELS[item.panels]} · {item.sizeLabel} cm · {item.colorName}
                              {item.framed ? " · Cadre" : ""}
                              {item.composition ? ` · Composition ${COMPOSITIONS[item.composition as ArtStyle]?.label ?? item.composition}` : ""}
                            </p>
                            {item.customText && (
                              <div className="mt-1 bg-cream px-2 py-1">
                                <p
                                  className="text-right text-xl"
                                  dir="rtl"
                                  style={{ fontFamily: SCRIPTS[isScript(item.script) ? item.script : "ruqaa"].fontFamily }}
                                >
                                  {item.customText.split("|").join(" · ")}
                                </p>
                                {isScript(item.script) && <p className="text-xs text-taupe">Écriture : {SCRIPTS[item.script].label}</p>}
                              </div>
                            )}
                            {item.note && <p className="mt-1 text-xs italic">« {item.note} »</p>}
                          </li>
                        ))}
                      </ul>
                      {order.note && <p className="mt-2 text-xs italic text-taupe">Livraison : {order.note}</p>}

                      <p className="mt-3 font-medium">{formatDH(order.total)}</p>

                      {(status.next || CANCELLABLE.has(order.status)) && (
                        <div className="mt-3 flex gap-2">
                          {status.next && (
                            <form action={setOrderStatus} className="flex-1">
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="status" value={status.next} />
                              <button type="submit" className="w-full bg-ink px-3 py-2 text-xs text-cream hover:bg-bordeaux">
                                {status.action}
                              </button>
                            </form>
                          )}
                          {CANCELLABLE.has(order.status) && (
                            <form action={setOrderStatus}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="status" value="CANCELLED" />
                              <button type="submit" className="border border-line px-3 py-2 text-xs hover:border-bordeaux hover:text-bordeaux">
                                Annuler
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
