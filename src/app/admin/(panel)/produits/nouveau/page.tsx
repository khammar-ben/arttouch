import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { storageConfigured } from "@/lib/storage";
import { saveProduct, uploadProductImage } from "../actions";
import { loadProductFormOptions } from "../options";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Nouvelle toile" };

export default async function NewProductPage() {
  const options = await loadProductFormOptions();

  return (
    <div>
      <Link href="/admin/produits" className="text-sm text-taupe hover:text-ink">
        ← Produits
      </Link>
      <PageHeader title="Nouvelle toile" description="Elle est créée en brouillon : passez-la « En ligne » quand la fiche est prête." />
      <ProductForm
        isNew
        initial={{
          title: "",
          titleAr: "",
          slug: "",
          description: "",
          collectionId: "",
          status: "DRAFT",
          featured: false,
          position: 0,
          images: [],
          artStyle: "calligraphy",
          artText: "",
          compositions: [],
          rooms: [],
          panelOptions: [1],
          sizeIds: [],
          colorIds: options.colors.slice(0, 1).map((c) => c.id),
          defaultColor: "",
          priceMultiplier: 1,
          allowsCustomText: false,
          customTextMax: 30,
          productionDays: 7,
        }}
        options={options}
        save={saveProduct.bind(null, null)}
        upload={uploadProductImage}
        storageReady={storageConfigured()}
      />
    </div>
  );
}
