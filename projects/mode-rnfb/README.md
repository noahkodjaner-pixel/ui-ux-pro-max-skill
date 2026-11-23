# Mode RNFB · site de démonstration (v2)

**The Art of Transformation.** Démo commerciale pour un salon de coiffure à Wavre.
React 19 + TypeScript + Vite, GSAP (ScrollTrigger, SplitText), Three.js.

## Phase 1 · analyse

**Confirmé :** nom (Mode RNFB), activité (salon de coiffure), ville (Wavre, Belgique).

**Relevé sur la fiche Google Maps, à faire valider par le salon** (`status: 'source-google'`) :
téléphone +32 479 04 69 69, horaires (lundi fermé, du mardi au dimanche 9h–18h30), note 5,0 sur 107 avis.

**Manquant, donc non affiché ou remplacé par une démo identifiée :** adresse exacte, email, outil de
réservation en ligne, carte des prestations et tarifs, équipe, photos, identité graphique officielle, Instagram.

Rien de tout cela n'est inventé. Toutes les données sont dans **`src/config/salon.ts`**.
Chacune porte un statut (`confirme`, `source-google`, `demo`, `a-confirmer`) : ce qui est `a-confirmer` n'est pas affiché.

### Direction artistique
- **Concept :** des mèches 3D passent du *mouvement* (trois mèches torsadées) à la *ligne* (une nappe peignée) au fil du défilement. La transformation est le fil narratif du site, pas un décor.
- **Palette :** noir #101010, ivoire #F2EEE8, sable #E7DED0, graphite #272727, champagne #C7AC83 (proposition artistique, pas l'identité officielle).
- **Typographie :** Instrument Serif (titres monumentaux, italique) et Inter Tight (texte), toutes deux sous licence SIL OFL, auto-hébergées via Fontsource.

### Les trois animations signature
1. **Hero :** scène WebGL de mèches. Sur ordinateur, le hero reste épinglé pendant que les mèches se démêlent (Mouvement → Ligne). Sur mobile, la transformation suit simplement le scroll. La scène réagit au pointeur et la caméra suit en parallaxe.
2. **Galerie :** défilement horizontal épinglé, piloté par le scroll, avec une parallaxe interne à chaque cadre et une visionneuse plein écran.
3. **Couleurs de page :** l'arrière-plan glisse entre noir, ivoire, sable et graphite selon la séquence, et le manifeste s'éclaire mot à mot.

S'y ajoutent : titres révélés par masque, filets qui se tracent, aperçu photo qui suit le curseur (prestations), numéro et carte en rotation 3D synchronisés au scroll (expérience), boutons magnétiques sur pointeur fin, menu plein écran.

## Architecture
```
src/config/salon.ts        données centralisées et éditables
src/three/RibbonField.ts   moteur 3D (géométrie calculée dans le shader, 1 draw call)
src/components/            Nav, Hero, Universe, Services, Gallery, Lightbox, Experience, Contact, Footer
src/lib/                   GSAP (useGsap + matchMedia), images, horaires, effet magnétique
src/stills.ts, stills.html outil interne : rend les études 3D de la galerie (non publié)
public/stills/             études 3D en WebP (800 et 1600 px)
```

## Lancer
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # vérification TypeScript + build dans dist/
npm run preview    # sert dist/
```

## Déployer
`dist/` est un site statique (`base: './'`), à déposer tel quel :
- **Netlify :** glisser `dist/` sur app.netlify.com/drop, ou connecter le dépôt (build `npm run build`, dossier `dist`, base `projects/mode-rnfb`).
- **Vercel :** importer le dépôt, *Root Directory* `projects/mode-rnfb`, framework Vite.

**Avant une mise en ligne officielle :** retirer `<meta name="robots" content="noindex">` dans `index.html` et compléter le JSON-LD `HairSalon` avec les données confirmées (adresse, téléphone, horaires).

## Remplacer les contenus de démonstration
- **Photos :** déposer `nom-800.webp` et `nom-1600.webp` dans `public/stills/`, référencer `stills/nom` dans `gallery` / `services`, puis passer `status` à `confirme`. Les mentions « démonstration » disparaissent d'elles-mêmes.
- **Prestations et tarifs :** `services` (le champ `price` est facultatif, `null` = non affiché).
- **Réservation en ligne :** renseigner `bookingUrl` (Planity, Salonkee, Treatwell…). Tous les boutons « Rendez-vous » l'utilisent alors à la place du téléphone.
- **Régénérer les études 3D :** `npm run render:stills` (nécessite Playwright et Python avec Pillow).

## Vérifications effectuées (Chromium headless, rendu WebGL logiciel)
- `tsc -b` sans erreur, build Vite OK. Bundle principal ≈ 129 kB gzip ; la 3D (≈ 137 kB gzip) se charge à part, après le premier affichage.
- 1440×900 et 390×844 : aucune erreur console, aucun débordement horizontal, scène WebGL active.
- Visionneuse : ouverture au clavier, flèches, Échap, retour du focus sur la vignette.
- Menu mobile : ouverture, navigation vers l'ancre, fermeture.
- Toutes les ancres internes pointent vers un élément existant. Liens externes : `tel:` et Google Maps.
- `prefers-reduced-motion: reduce` : aucun épinglage, scène 3D figée, contenu entièrement visible.

## Reste à vérifier
- **Vrais appareils** (iPhone/Safari, Android/Chrome) : fluidité de la 3D sur un GPU réel, comportement de la barre d'adresse avec `100svh`.
- **Mesures Lighthouse / Core Web Vitals :** non mesurées.
- **Lecteurs d'écran :** audit manuel non réalisé (VoiceOver, NVDA).
- **Contenus :** validation de tous les textes, horaires et du téléphone par le salon.
