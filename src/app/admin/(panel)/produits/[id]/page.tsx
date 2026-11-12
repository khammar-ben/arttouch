import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton, SubmitButton } from "@/components/admin/form-controls";
import { buttonClass, PageHeader, ProductStatusBadge } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin-labels";
import { db } from "@/lib/db";
import { storageConfigured } from "@/lib/storage";
import { deleteProduct, duplicateProduct, saveProduct, uploadProductImage } from "../actions";
import { loadProductFormOptions } from "../options";
import { ProductForm } from "../ProductForm";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await db.product.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: product?.title ?? "Toile" };
}

export default async function EditProductPage({ params, searchParams }: { params: Params; searchParams: Promise<{ cree?: string; copie?: string }> }) {
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const [product, options, sold] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { sizes: { select: { id: true } }, colors: { select: { id: true } } },
    }),
    loadProductFormOptions(),
    db.orderItem.aggregate({ where: { productId: id }, _sum: { quantity: true } }),
  ]);
  if (!product) notFound();

  const split = (s: string) => s.split(",").filter(Boolean);
  const notice = flags.cree ? "Toile créée." : flags.copie ? "Copie créée en brouillon : modifiez-la puis passez-la en ligne." : null;

  return (
    <div>
      <Link href="/admin/produits" className="text-sm text-taupe hover:text-ink">
        ← Produits
      </Link>
      <PageHeader
        title={product.title}
        description={`${sold._sum.quantity ?? 0} vendue${(sold._sum.quantity ?? 0) > 1 ? "s" : ""} · créée le ${formatDate(product.createdAt)}`}
        actions={
          <>
            <ProductStatusBadge status={product.status} />
            {product.status === "ACTIVE" && (
              <a href={`/produit/${product.slug}`} target="_blank" className={buttonClass.secondary}>
                Voir sur la boutique ↗
              </a>
            )}
            <form action={duplicateProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <SubmitButton variant="secondary" pendingLabel="Copie…">
                Dupliquer
              </SubmitButton>
            </form>
            <form action={deleteProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <ConfirmButton
                message={`Supprimer « ${product.title} » ? Les commandes passées gardent leur détail. Pour la retirer de la boutique sans la perdre, choisissez plutôt le statut « Masqué ».`}
              >
                Supprimer
              </ConfirmButton>
            </form>
          </>
        }
      />
      {notice && <p className="mb-6 border border-[#245a31]/30 bg-[#d3e6d6]/40 px-4 py-3 text-sm text-[#245a31]">{notice}</p>}

      <ProductForm
        key={product.id}
        isNew={false}
        initial={{
          title: product.title,
          titleAr: product.titleAr ?? "",
          slug: product.slug,
          description: product.description,
          collectionId: product.collectionId,
          status: product.status,
          featured: product.featured,
          position: product.position,
          images: split(product.images),
          artStyle: product.artStyle,
          artText: product.artText ?? "",
          compositions: split(product.compositions),
          rooms: split(product.rooms),
          panelOptions: split(product.panelOptions).map(Number),
          sizeIds: product.sizes.map((s) => s.id),
          colorIds: product.colors.map((c) => c.id),
          defaultColor: product.defaultColor ?? "",
          priceMultiplier: product.priceMultiplier,
          allowsCustomText: product.allowsCustomText,
          customTextMax: product.customTextMax,
          productionDays: product.productionDays,
        }}
        options={options}
        save={saveProduct.bind(null, product.id)}
        upload={uploadProductImage}
        storageReady={storageConfigured()}
      />
    </div>
  );
}
