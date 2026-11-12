import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Grille de prix d'exemple (DH) : [1 panneau, 2 panneaux, 3 panneaux]
const SIZES = [
  { label: "30×30", widthCm: 30, heightCm: 30, framePrice: 120, prices: [220, 420, 600] },
  { label: "40×40", widthCm: 40, heightCm: 40, framePrice: 140, prices: [300, 560, 800] },
  { label: "30×40", widthCm: 30, heightCm: 40, framePrice: 130, prices: [250, 450, 650] },
  { label: "40×50", widthCm: 40, heightCm: 50, framePrice: 150, prices: [350, 650, 950] },
  { label: "50×70", widthCm: 50, heightCm: 70, framePrice: 200, prices: [500, 950, 1400] },
  { label: "60×90", widthCm: 60, heightCm: 90, framePrice: 250, prices: [750, 1400, 2000] },
  { label: "80×120", widthCm: 80, heightCm: 120, framePrice: 350, prices: [1200, 2300, 3300] },
];

const COLORS = [
  { name: "Sable & Noir", bg: "#EDE3D6", accent: "#CDB9A0", ink: "#1E1B18" },
  { name: "Crème & Noir", bg: "#F1EADF", accent: "#1E1B18", ink: "#1E1B18" },
  { name: "Terracotta", bg: "#EFE3D7", accent: "#B5745A", ink: "#1E1B18" },
  { name: "Bordeaux", bg: "#F3EEE6", accent: "#7E2A26", ink: "#1E1B18" },
  { name: "Rouge", bg: "#F1EADF", accent: "#B3201B", ink: "#1E1B18" },
  { name: "Gris & Rose", bg: "#EAD9D2", accent: "#9C908B", ink: "#1E1B18" },
  { name: "Rose poudré", bg: "#F3ECE6", accent: "#C99A90", ink: "#1E1B18" },
  { name: "Ardoise & Or", bg: "#8C8A87", accent: "#3A3836", ink: "#D4A23A", extraPrice: 50 },
];

const COLLECTIONS = [
  { slug: "calligraphie", name: "Calligraphie moderne", nameAr: "خط عربي", description: "Des mots qui comptent, peints à la main sur des fonds doux." },
  { slug: "mots-en-set", name: "Mots en set", nameAr: "كلمات", description: "Deux ou trois toiles qui se répondent sur un même mur." },
  { slug: "abstrait", name: "Abstrait organique", nameAr: "تجريدي", description: "Formes libres et contrastes francs, pour un intérieur affirmé." },
  { slug: "line-art", name: "Line art", nameAr: "خط واحد", description: "Un trait unique, une diagonale de couleur, beaucoup de calme." },
  { slug: "texture", name: "Texture & relief", nameAr: "نحت", description: "Matière en relief que l'on a envie de toucher." },
];

const RECT = ["30×40", "40×50", "50×70", "60×90", "80×120"];
const SMALL = ["30×30", "30×40", "40×50"];
const SQUARE = ["30×30", "40×40"];

type Seed = {
  slug: string;
  title: string;
  titleAr?: string;
  description: string;
  /** Photos sous /public, la première est la principale */
  images?: string[];
  collection: string;
  artStyle: string;
  artText?: string;
  compositions?: string;
  rooms: string;
  panelOptions: string;
  sizes: string[];
  colors: string[];
  priceMultiplier?: number;
  allowsCustomText?: boolean;
  customTextMax?: number;
  featured?: boolean;
};

const PRODUCTS: Seed[] = [
  {
    slug: "fa-idha-azamta",
    title: "Fa idha ʿazamta",
    titleAr: "فإذا عزمت فتوكل على الله",
    description: "Un grand format pour l'entrée : le verset qui accompagne chaque décision, calligraphié en noir sur une toile texturée.",
    images: ["/toiles/fa-idha-azamta.png"],
    collection: "calligraphie",
    artStyle: "calligraphy",
    artText: "فإذا عزمت فتوكل على الله",
    rooms: "entree,salon,bureau",
    panelOptions: "1",
    sizes: ["50×70", "60×90", "80×120"],
    colors: ["Sable & Noir", "Bordeaux", "Terracotta"],
    priceMultiplier: 1.15,
    featured: true,
  },
  {
    slug: "fasabrun-jamil",
    title: "Fasabrun Jamil",
    titleAr: "فصبر جميل",
    description: "« Patience, une belle patience. » Une calligraphie fluide sur un fond bicolore, pensée pour un coin lumineux du salon.",
    images: ["/toiles/fasabrun-jamil.jpg"],
    collection: "calligraphie",
    artStyle: "calligraphy",
    artText: "فصبر جميل",
    rooms: "salon,chambre",
    panelOptions: "1",
    sizes: RECT,
    colors: ["Terracotta", "Sable & Noir", "Bordeaux", "Rose poudré"],
    allowsCustomText: true,
    featured: true,
  },
  {
    slug: "allah-muhammad",
    title: "Allah · Muhammad",
    titleAr: "الله · محمد",
    description: "Les deux noms sur des aplats gris et vieux rose, reliés par deux lignes fines.",
    images: ["/toiles/allah-muhammad.jpg"],
    collection: "calligraphie",
    artStyle: "calligraphy",
    artText: "الله|محمد",
    rooms: "salon,entree,chambre",
    panelOptions: "1,2",
    sizes: RECT,
    colors: ["Gris & Rose", "Sable & Noir", "Bordeaux"],
    featured: true,
  },
  {
    slug: "courbe-bordeaux",
    title: "Courbe bordeaux",
    description: "Une calligraphie noire qui épouse une vague bordeaux, sur une toile crème. Très belle posée sur une console.",
    images: ["/toiles/courbe-bordeaux.jpg"],
    collection: "calligraphie",
    artStyle: "calligraphy",
    artText: "الحمد لله",
    rooms: "salon,entree",
    panelOptions: "1",
    sizes: ["50×70", "60×90", "80×120"],
    colors: ["Bordeaux", "Terracotta", "Sable & Noir"],
    priceMultiplier: 1.1,
    featured: true,
  },
  {
    slug: "la-ilaha-illa-allah",
    title: "La ilaha illa Allah",
    titleAr: "لا إله إلا الله",
    description: "Le texte posé sur l'horizon d'une toile en deux tons, blanc et sable.",
    images: ["/toiles/la-ilaha-illa-allah.webp"],
    collection: "calligraphie",
    artStyle: "words",
    artText: "لا إله إلا الله",
    rooms: "salon,entree",
    panelOptions: "1",
    sizes: RECT,
    colors: ["Sable & Noir", "Terracotta", "Ardoise & Or"],
  },
  {
    slug: "sabr-shukr-tawakkul",
    title: "Sabr · Shukr · Tawakkul",
    titleAr: "صبر · شكر · توكل",
    description: "Trois petites toiles, trois mots peints en doré sur un fond ardoise. Gardez ceux-ci ou choisissez les vôtres.",
    images: ["/toiles/sabr-shukr-tawakkul.png"],
    collection: "mots-en-set",
    artStyle: "words",
    artText: "صبر|شكر|توكل",
    rooms: "chambre,bureau,salon",
    panelOptions: "3",
    sizes: SQUARE,
    colors: ["Ardoise & Or", "Sable & Noir", "Terracotta"],
    allowsCustomText: true,
    customTextMax: 12,
    featured: true,
  },
  {
    slug: "bismillah-trio",
    title: "Bismillah · Alhamdulillah · Allahu Akbar",
    titleAr: "بسم الله · الحمد لله · الله أكبر",
    description: "Un triptyque blanc et taupe dont les courbes se répondent, à accrocher au-dessus d'un canapé.",
    images: ["/toiles/bismillah-trio.jpg"],
    collection: "mots-en-set",
    artStyle: "calligraphy",
    artText: "بسم الله|الحمد لله|الله أكبر",
    rooms: "salon",
    panelOptions: "3",
    sizes: ["30×40", "40×50", "50×70"],
    colors: ["Sable & Noir", "Bordeaux"],
    featured: true,
  },
  {
    slug: "galets",
    title: "Galets",
    description: "De grandes formes organiques, noires et mates, sur une toile sable. Seule, en duo ou en triptyque.",
    images: ["/toiles/galets-duo.jpg"],
    collection: "abstrait",
    artStyle: "blobs",
    rooms: "salon,chambre,bureau",
    panelOptions: "1,2,3",
    sizes: RECT,
    colors: ["Crème & Noir", "Terracotta", "Bordeaux", "Rouge"],
    featured: true,
  },
  {
    slug: "meandres",
    title: "Méandres",
    description: "Un triptyque noir et crème : le motif circule d'une toile à l'autre, parfait au-dessus d'un lit.",
    images: ["/toiles/meandres-trio.webp"],
    collection: "abstrait",
    artStyle: "waves",
    rooms: "chambre,salon",
    panelOptions: "3",
    sizes: ["40×50", "50×70", "60×90"],
    colors: ["Crème & Noir", "Terracotta", "Bordeaux"],
    priceMultiplier: 1.1,
    featured: true,
  },
  {
    slug: "flux",
    title: "Flux rouge",
    description: "Des courbes franches, rouge et crème, dans une caisse américaine en bois.",
    images: ["/toiles/flux-rouge.webp"],
    collection: "abstrait",
    artStyle: "waves",
    rooms: "salon,chambre,entree",
    panelOptions: "1,3",
    sizes: RECT,
    colors: ["Rouge", "Bordeaux", "Crème & Noir", "Terracotta"],
    priceMultiplier: 1.1,
    featured: true,
  },
  {
    slug: "visage-aux-mains",
    title: "Visage aux mains",
    description: "Un visage et deux mains brodés d'un seul fil noir, sur une diagonale blanc et doré.",
    images: ["/toiles/visage-mains.webp"],
    collection: "line-art",
    artStyle: "lineart",
    artText: "tulipe",
    rooms: "chambre,bureau",
    panelOptions: "1",
    sizes: SMALL,
    colors: ["Sable & Noir", "Rose poudré", "Terracotta"],
    priceMultiplier: 1.2,
  },
  {
    slug: "tulipe",
    title: "Tulipe",
    description: "Une tulipe d'un seul trait de fil sur une diagonale vieux rose.",
    images: ["/toiles/tulipe.webp"],
    collection: "line-art",
    artStyle: "lineart",
    artText: "tulipe",
    rooms: "chambre,bureau",
    panelOptions: "1",
    sizes: SMALL,
    colors: ["Rose poudré", "Sable & Noir", "Terracotta"],
  },
  {
    slug: "al-hamdulillah-relief",
    title: "Al Hamdulillah · relief",
    titleAr: "الحمد لله",
    description: "Une calligraphie à l'encre noire sous des vagues de matière blanche en relief.",
    images: ["/toiles/al-hamdulillah-relief.png"],
    collection: "texture",
    artStyle: "texture",
    artText: "الحمد لله",
    rooms: "salon,entree",
    panelOptions: "1",
    sizes: RECT,
    colors: ["Sable & Noir", "Terracotta", "Rose poudré"],
    priceMultiplier: 1.2,
    allowsCustomText: true,
    featured: true,
  },
  {
    slug: "galet-texture",
    title: "Galet texturé",
    description: "Une forme noire sur un fond crème travaillé en relief, encadrée de noir.",
    images: ["/toiles/galet-texture.png"],
    collection: "texture",
    artStyle: "texture",
    rooms: "salon,bureau",
    panelOptions: "1",
    sizes: ["40×40", "50×70", "60×90"],
    colors: ["Sable & Noir", "Terracotta", "Rose poudré"],
    priceMultiplier: 1.2,
  },
  {
    slug: "votre-mot",
    title: "Votre mot en calligraphie",
    titleAr: "كلمتك",
    description: "Choisissez le mot, le prénom ou la courte phrase : nous le peignons à la main sur une toile aux tons doux. Un croquis vous est envoyé sur WhatsApp avant la peinture.",
    collection: "calligraphie",
    artStyle: "calligraphy",
    artText: "توكل",
    compositions: "calligraphy,words,band,vertical,diagonal,texture",
    rooms: "salon,chambre,entree,bureau",
    panelOptions: "1,2,3",
    sizes: RECT,
    colors: ["Sable & Noir", "Terracotta", "Bordeaux", "Rose poudré", "Gris & Rose", "Ardoise & Or"],
    allowsCustomText: true,
    customTextMax: 25,
  },
];

async function main() {
  // Le seed vide toutes les tables : on refuse de tourner sur une base qui a déjà des commandes.
  const orders = await db.order.count();
  if (orders > 0 && !process.env.SEED_FORCE) {
    throw new Error(`${orders} commande(s) en base : le seed effacerait tout. Relancer avec SEED_FORCE=1 pour forcer.`);
  }

  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.product.deleteMany();
  await db.price.deleteMany();
  await db.size.deleteMany();
  await db.colorOption.deleteMany();
  await db.collection.deleteMany();

  for (const [position, s] of SIZES.entries()) {
    await db.size.create({
      data: {
        label: s.label,
        widthCm: s.widthCm,
        heightCm: s.heightCm,
        framePrice: s.framePrice,
        position,
        prices: { create: s.prices.map((amount, i) => ({ panels: i + 1, amount })) },
      },
    });
  }

  for (const [position, c] of COLORS.entries()) {
    await db.colorOption.create({ data: { ...c, position } });
  }

  for (const [position, c] of COLLECTIONS.entries()) {
    await db.collection.create({ data: { ...c, position } });
  }

  for (const [position, p] of PRODUCTS.entries()) {
    const { collection, sizes, colors, images, ...rest } = p;
    await db.product.create({
      data: {
        ...rest,
        images: (images ?? []).join(","),
        defaultColor: colors[0],
        position,
        collection: { connect: { slug: collection } },
        sizes: { connect: sizes.map((label) => ({ label })) },
        colors: { connect: colors.map((name) => ({ name })) },
      },
    });
  }

  console.log(`Seed : ${PRODUCTS.length} produits, ${SIZES.length} tailles, ${COLORS.length} couleurs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
