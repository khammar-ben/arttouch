import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

// Habillage de la boutique ; l'espace atelier (/admin) a le sien.
export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}
