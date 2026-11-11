import type { Metadata } from "next";
import { Amiri, Aref_Ruqaa, Cormorant_Garamond, Inter, Reem_Kufi } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"] });
const amiri = Amiri({ variable: "--font-amiri", subsets: ["arabic"], weight: ["400", "700"] });
const ruqaa = Aref_Ruqaa({ variable: "--font-ruqaa", subsets: ["arabic"], weight: ["400", "700"] });
const kufi = Reem_Kufi({ variable: "--font-kufi", subsets: ["arabic"], weight: ["500"] });

export const metadata: Metadata = {
  title: { default: "Arttouch · Toiles peintes à la main", template: "%s · Arttouch" },
  description: "Calligraphie moderne, abstrait et line art peints à la main au Maroc. Personnalisez votre toile, paiement à la livraison.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${cormorant.variable} ${amiri.variable} ${ruqaa.variable} ${kufi.variable} font-sans antialiased`}>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
