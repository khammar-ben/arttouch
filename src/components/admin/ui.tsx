import { statusLabel } from "@/lib/order-status";
import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/admin-labels";

export const fieldClass =
  "w-full border border-line bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-ink disabled:bg-sand/40 aria-[invalid=true]:border-bordeaux";

export const buttonClass = {
  primary: "inline-flex items-center justify-center gap-2 bg-ink px-4 py-2 text-sm text-cream hover:bg-bordeaux disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 border border-line bg-white px-4 py-2 text-sm hover:border-ink disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-2 border border-bordeaux/40 px-4 py-2 text-sm text-bordeaux hover:bg-bordeaux hover:text-cream disabled:opacity-60",
  link: "text-sm underline underline-offset-4 hover:text-bordeaux",
};

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-line bg-white p-5 ${className ?? ""}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-medium">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-taupe">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium uppercase tracking-wide text-taupe">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p className="mt-1 text-xs text-bordeaux">{error[0]}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-taupe">{hint}</p>
      )}
    </div>
  );
}

const ORDER_TONES: Record<string, string> = {
  TO_CONFIRM: "bg-terracotta/15 text-[#874c33]",
  CONFIRMED: "bg-sand text-ink",
  IN_PRODUCTION: "bg-[#efe3c4] text-[#6b5216]",
  READY: "bg-[#e0e8d6] text-[#3c5a2a]",
  SHIPPED: "bg-[#dce5ee] text-[#2d4a66]",
  DELIVERED: "bg-[#d3e6d6] text-[#245a31]",
  CANCELLED: "bg-line/70 text-taupe",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_TONES[status] ?? ORDER_TONES.CONFIRMED}`}>
      {statusLabel(status)}
    </span>
  );
}

const PRODUCT_TONES: Record<ProductStatus, string> = {
  ACTIVE: "bg-[#d3e6d6] text-[#245a31]",
  DRAFT: "bg-[#efe3c4] text-[#6b5216]",
  HIDDEN: "bg-line/70 text-taupe",
};

export function ProductStatusBadge({ status }: { status: string }) {
  const known = status in PRODUCT_STATUSES ? (status as ProductStatus) : "HIDDEN";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${PRODUCT_TONES[known]}`}>
      {PRODUCT_STATUSES[known]}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line bg-white/50 px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-taupe">{children}</div>}
    </div>
  );
}
