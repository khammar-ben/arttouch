export type ArtStyle = "calligraphy" | "words" | "band" | "vertical" | "diagonal" | "blobs" | "waves" | "lineart" | "texture";

/** Style d'écriture du texte arabe */
export type Script = "ruqaa" | "naskh" | "kufi";

export type ArtPalette = { bg: string; accent: string; ink: string };

export type SizeDTO = {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
  framePrice: number;
  /** Prix par nombre de panneaux */
  prices: Record<number, number>;
};

export type ColorDTO = ArtPalette & { id: string; name: string; extraPrice: number };

export type ProductDTO = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  description: string;
  /** Photos réelles ; vide = on affiche l'aperçu dessiné */
  images: string[];
  collection: { slug: string; name: string };
  artStyle: ArtStyle;
  artText: string | null;
  /** Compositions au choix du client (toile personnalisée) ; vide = composition fixe */
  compositions: ArtStyle[];
  rooms: string[];
  panelOptions: number[];
  priceMultiplier: number;
  allowsCustomText: boolean;
  customTextMax: number;
  productionDays: number;
  sizes: SizeDTO[];
  colors: ColorDTO[];
  featured: boolean;
  fromPrice: number;
};

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  artStyle: ArtStyle;
  artText: string | null;
  palette: ArtPalette;
  sizeId: string;
  sizeLabel: string;
  widthCm: number;
  heightCm: number;
  panels: number;
  colorId: string;
  colorName: string;
  framed: boolean;
  /** Texte personnalisé, "|" sépare les panneaux */
  customText: string | null;
  script: Script | null;
  /** Composition choisie, quand le produit en propose plusieurs */
  composition: ArtStyle | null;
  note: string | null;
  unitPrice: number;
  quantity: number;
};
