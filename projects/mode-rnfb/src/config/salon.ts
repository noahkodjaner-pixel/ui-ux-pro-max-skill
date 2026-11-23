/**
 * ============================================================================
 *  DONNÉES DU SALON — fichier unique à éditer.
 * ============================================================================
 *
 *  Chaque information porte un statut :
 *   - 'confirme'      : fourni et validé par le salon.
 *   - 'source-google' : relevé sur la fiche Google Maps publique du salon,
 *                       à faire valider par le salon avant mise en ligne.
 *   - 'demo'          : contenu de démonstration, à remplacer. Affiché comme tel.
 *   - 'a-confirmer'   : information manquante. Le site ne l'affiche pas.
 *
 *  Règles : rien n'est inventé. Pas d'avis rédigés, pas de tarifs fictifs,
 *  pas de réservation simulée.
 */

export type Status = 'confirme' | 'source-google' | 'demo' | 'a-confirmer';

export interface Field<T> {
  value: T;
  status: Status;
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  /** Description courte (texte de démonstration tant que status = 'demo'). */
  description: string;
  /** Prix facultatif. null = non affiché. Ne jamais saisir de prix non confirmé. */
  price: string | null;
  image: string;
  status: Status;
}

export interface Visual {
  id: string;
  /** Chemin sans suffixe : `${src}-800.webp` et `${src}-1600.webp` doivent exister. */
  src: string;
  alt: string;
  title: string;
  /** Orientation, utilisée pour la composition asymétrique. */
  shape: 'portrait' | 'landscape' | 'square';
  /** 'demo' = étude 3D générée pour la démo, PAS une réalisation du salon. */
  status: Status;
}

export interface OpeningDay {
  /** 0 = dimanche … 6 = samedi */
  day: number;
  label: string;
  /** null = fermé */
  open: [string, string] | null;
}

const LISTING_NOTE = 'Relevé sur la fiche Google Maps le 23/11/2026 — à faire valider par le salon.';

export const salon = {
  name: { value: 'Mode RNFB', status: 'confirme' } as Field<string>,
  activity: { value: 'Salon de coiffure', status: 'confirme' } as Field<string>,
  city: { value: 'Wavre', status: 'confirme' } as Field<string>,
  country: { value: 'Belgique', status: 'confirme' } as Field<string>,

  /** Adresse exacte : manquante. Le site renvoie vers la fiche Google Maps. */
  street: { value: '', status: 'a-confirmer' } as Field<string>,
  postalCode: { value: '1300', status: 'confirme', note: 'Code postal de Wavre.' } as Field<string>,

  phone: {
    value: { display: '+32 479 04 69 69', href: 'tel:+32479046969' },
    status: 'source-google',
    note: LISTING_NOTE,
  } as Field<{ display: string; href: string }>,

  email: { value: '', status: 'a-confirmer' } as Field<string>,

  /** Lien de réservation en ligne (Planity, Salonkee, Treatwell…). Vide = non affiché. */
  bookingUrl: { value: '', status: 'a-confirmer' } as Field<string>,

  /** Recherche Google Maps : destination réelle, sans supposer l'adresse. */
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Mode RNFB Wavre'),

  hours: {
    status: 'source-google',
    note: LISTING_NOTE,
    value: [
      { day: 1, label: 'Lundi', open: null },
      { day: 2, label: 'Mardi', open: ['09:00', '18:30'] },
      { day: 3, label: 'Mercredi', open: ['09:00', '18:30'] },
      { day: 4, label: 'Jeudi', open: ['09:00', '18:30'] },
      { day: 5, label: 'Vendredi', open: ['09:00', '18:30'] },
      { day: 6, label: 'Samedi', open: ['09:00', '18:30'] },
      { day: 0, label: 'Dimanche', open: ['09:00', '18:30'] },
    ],
  } as Field<OpeningDay[]>,

  /** Note publique Google (pas un avis rédigé). Mettre status 'a-confirmer' pour la masquer. */
  googleRating: {
    value: { score: '5,0', count: 107, date: '23/11/2026' },
    status: 'source-google',
  } as Field<{ score: string; count: number; date: string }>,

  instagram: { value: '', status: 'a-confirmer' } as Field<string>,
};

/** Textes éditoriaux : rédaction de démonstration, à valider avec le salon. */
export const copy = {
  tagline: 'L’art de la transformation',
  heroLead: 'Un salon de coiffure à Wavre. Un lieu pour prendre le temps, et repartir changé.',
  manifesto:
    'Une coupe ne se résume pas à une longueur. C’est une ligne, une matière, une lumière. Une manière de se tenir. Chaque transformation commence par une écoute, et se termine dans le miroir.',
  universe: [
    { k: 'Écouter', v: 'Comprendre votre rythme, vos habitudes, ce que vous voulez garder et ce que vous voulez changer.' },
    { k: 'Dessiner', v: 'Construire une forme qui suit la nature de vos cheveux, pas une tendance passagère.' },
    { k: 'Révéler', v: 'Finir avec précision, pour un résultat qui vous ressemble encore dans trois semaines.' },
  ],
  experience: [
    { n: '01', title: 'L’accueil', text: 'On s’installe, on prend le temps. Le rendez-vous commence par une conversation.' },
    { n: '02', title: 'Le diagnostic', text: 'Matière, implantation, mouvement naturel : on observe avant de couper.' },
    { n: '03', title: 'Le geste', text: 'La transformation, réalisée avec précision, sans précipitation.' },
    { n: '04', title: 'Le miroir', text: 'Finitions, conseils d’entretien, et le plaisir de se redécouvrir.' },
  ],
};

/**
 * Prestations — CATÉGORIES DE DÉMONSTRATION.
 * La carte réelle du salon n'est pas connue : remplacer noms, descriptions et
 * prix (facultatifs) par ceux fournis par le salon, puis passer status à 'confirme'.
 */
export const services: Service[] = [
  { id: 'coupe', name: 'Coupe', description: 'Une forme pensée pour votre visage et votre quotidien.', price: null, image: 'stills/etude-01', status: 'demo' },
  { id: 'couleur', name: 'Couleur', description: 'Nuances, reflets et lumière, travaillés sur mesure.', price: null, image: 'stills/etude-04', status: 'demo' },
  { id: 'soin', name: 'Soin', description: 'Rendre à la matière sa souplesse et sa brillance.', price: null, image: 'stills/etude-07', status: 'demo' },
  { id: 'coiffage', name: 'Coiffage', description: 'Le dernier geste : celui qui donne le mouvement.', price: null, image: 'stills/etude-03', status: 'demo' },
];

/**
 * Galerie — ÉTUDES 3D DE DÉMONSTRATION, générées par le moteur du site
 * (scripts/render-stills.mjs). Ce ne sont pas des réalisations du salon.
 * À remplacer par les photos officielles (droits d'utilisation confirmés).
 */
export const gallery: Visual[] = [
  { id: 'g1', src: 'stills/etude-01', title: 'Mouvement', shape: 'portrait', status: 'demo', alt: 'Étude 3D abstraite : mèches champagne et ivoire entremêlées sur fond noir.' },
  { id: 'g2', src: 'stills/etude-02', title: 'Ligne', shape: 'landscape', status: 'demo', alt: 'Étude 3D abstraite : une nappe de mèches graphite et champagne parfaitement peignée sur fond ivoire.' },
  { id: 'g3', src: 'stills/etude-05', title: 'Lumière', shape: 'portrait', status: 'demo', alt: 'Étude 3D abstraite : longues mèches claires qui tombent en courbe sur fond noir.' },
  { id: 'g4', src: 'stills/etude-04', title: 'Matière', shape: 'square', status: 'demo', alt: 'Étude 3D abstraite : faisceau de mèches ivoire et graphite sur fond champagne.' },
  { id: 'g5', src: 'stills/etude-06', title: 'Souffle', shape: 'landscape', status: 'demo', alt: 'Étude 3D abstraite : mèches dorées qui s’enroulent sur fond noir.' },
  { id: 'g6', src: 'stills/etude-07', title: 'Tombé', shape: 'portrait', status: 'demo', alt: 'Étude 3D abstraite : mèches verticales champagne et ivoire, très rapprochées.' },
  { id: 'g7', src: 'stills/etude-08', title: 'Reflet', shape: 'square', status: 'demo', alt: 'Étude 3D abstraite : entrelacs de mèches bronze et blanches sur fond graphite.' },
];

export const isShown = (s: Status) => s !== 'a-confirmer';
