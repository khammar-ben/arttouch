# Arttouch

Boutique en ligne de toiles peintes à la main (calligraphie, abstrait, line art, texture), fabriquées sur commande.

## Démarrer

```bash
npm install
cp .env.example .env      # puis renseigner DATABASE_URL (PostgreSQL), ADMIN_PASSWORD et NEXT_PUBLIC_WHATSAPP_NUMBER
npm run db:push           # crée les tables dans la base PostgreSQL
npm run db:seed           # collections, tailles, prix, couleurs et produits d'exemple
npm run dev               # http://localhost:3000
```

Espace atelier : `/admin` (mot de passe `ADMIN_PASSWORD`).

Pour la base locale, un Postgres Docker suffit :
`docker run -d --name arttouch-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=arttouch -p 5432:5432 postgres:16`
puis `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arttouch"`. Une branche Neon de développement fonctionne aussi.

## Ce qui existe

| Page | Rôle |
|---|---|
| `/` | Accueil : hero, collections, best-sellers, aperçu « votre mot » en direct |
| `/boutique` | Catalogue filtrable par collection et par pièce |
| `/produit/[slug]` | Photo + configurateur : format (seule/duo/trio), taille, couleurs, cadre, texte personnalisé, aperçu et vue à l'échelle |
| `/panier`, `/commande` | Panier (localStorage) et commande en paiement à la livraison |
| `/commande/merci/[id]` | Confirmation + lien WhatsApp |
| `/admin` | Tableau de production : À confirmer → Confirmée → En production → Prête → Expédiée → Livrée |

## Organisation

- `prisma/schema.prisma` : modèle de données ; `prisma/seed.ts` : catalogue et **grille de prix** d'exemple.
- `public/toiles/` : photos des produits (champ `images` du produit).
- `src/lib/pricing.ts` : calcul du prix (grille × multiplicateur produit + couleur + cadre). Le serveur recalcule toujours le prix à la commande.
- `src/components/CanvasArt.tsx` : rendu vectoriel des toiles, utilisé pour l'aperçu des choix du client et quand un produit n'a pas encore de photo.

## Aperçus en situation (« Votre mot, votre toile »)

La toile du client est peinte dans de vraies photos d'intérieur (`src/components/RealMockup.tsx`) :
la composition est dessinée à plat en canvas (`src/lib/art-raster.ts`, géométrie partagée avec le SVG dans `src/lib/art-geometry.ts`),
puis posée sur la photo avec la perspective, la lumière et le grain de la toile d'origine.
L'assemblage se fait sur la carte graphique (`src/lib/mockup-gl.ts`, quelques millisecondes par frappe), avec un repli processeur
(`composeMockup` dans `src/lib/mockup.ts`) si WebGL est absent ou perd son contexte. Les photos ne sont téléchargées
que lorsque l'aperçu approche de l'écran. Garder les photos de scène légères (JPEG d'environ 900 px de large, ~100 Ko).

Chaque scène est décrite dans `src/lib/mockup-scenes.json` (photo, coins de la toile, couleurs d'origine, compositions acceptées)
et possède une carte d'ombrage `public/mockups/<id>-shade.png`, qui contient la lumière de la photo sans le texte ni les couleurs d'origine.

Pour ajouter ou modifier une scène :

1. Placer la photo dans `public/` et ajouter la scène dans `src/lib/mockup-scenes.json` (coins dans l'ordre haut-gauche, haut-droit, bas-droit, bas-gauche ;
   `seeds` = couleurs de peinture visibles sur la photo ; `paint0` = vraie couleur de la première ; `occluders` = zones où un objet passe devant la toile).
2. Lancer `node scripts/mockups/prepare.mjs` (utilise Microsoft Edge en mode headless, ou le navigateur indiqué par `BROWSER_PATH`).
   Le script écrit les cartes d'ombrage et reporte l'exposition et la teinte calibrées dans le JSON.

## Production (Vercel)

1. Créer une base PostgreSQL : sur Vercel, onglet **Storage** → **Neon** (gratuit), reliée au projet ; ou Neon / Supabase directement.
2. Dans **Settings → Environment Variables** du projet Vercel : `DATABASE_URL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
3. Créer les tables et le catalogue **une seule fois**, depuis sa machine, avec l'URL de production dans `DATABASE_URL` :
   `npx prisma db push && npm run db:seed`.
   Le build n'accède pas à la base (toutes les pages qui lisent le catalogue sont rendues à la demande), mais le site affiche une erreur tant que les tables n'existent pas.
4. Importer le dépôt GitHub dans Vercel (le préréglage Next.js suffit) et déployer.

Le seed **vide toutes les tables**. Il refuse de tourner dès qu'il y a une commande en base (forcer avec `SEED_FORCE=1`, à éviter en production).
Après une modification de `prisma/schema.prisma`, relancer `npx prisma db push` sur la base de production avant de déployer.

Sur une machine où le disque est presque plein, `NEXT_NO_BUILD_CACHE=1 npm run build` évite le cache webpack (environ 110 Mo).
