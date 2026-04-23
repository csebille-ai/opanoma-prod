// astro-utils.js — fonctions pures, zéro dépendance DOM

export const SIGNS = [
  'Belier', 'Taureau', 'Gemeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
];

export const HOUSE_THEMES = [
  'Qui vous etes et comment vous vous montrez aux autres.',
  'Votre argent, vos ressources et votre sentiment de securite.',
  'Votre facon de parler, d apprendre et d echanger au quotidien.',
  'Votre foyer, vos racines et votre vie familiale.',
  'Votre joie, votre creativite et vos plaisirs du coeur.',
  'Votre routine, votre organisation et votre equilibre de vie.',
  'Votre couple, vos partenariats et les relations importantes.',
  'Vos grandes transformations et vos passages de vie.',
  'Votre vision, vos voyages et votre ouverture d esprit.',
  'Votre voie pro, vos ambitions et votre image publique.',
  'Vos amis, vos projets communs et votre place dans le groupe.',
  'Votre monde interieur, votre intuition et votre besoin de recul.',
];

// Templates fallback horoscope local
export const FALLBACK_ENERGIES = [
  'Une energie montante vous pousse a clarifier vos priorites.',
  'Le calme revient et vous aide a choisir avec lucidite.',
  'Votre intuition est vive: notez vos idees sans tarder.',
  'Un besoin d ancrage se fait sentir, prenez votre temps.',
  'La confiance reprend le dessus, osez passer a l action.',
  'Vous gagnez en precision et en discernement aujourd hui.',
];

export const FALLBACK_RELATIONNELS = [
  'Une conversation sincere ouvre un nouvel equilibre.',
  'Montrez ce que vous ressentez, meme simplement.',
  'Une presence douce vous aide a relativiser.',
  'Evitez de surinterpreter: revenez aux faits.',
  'Le bon mot au bon moment peut tout changer.',
  'Un lien se renforce si vous posez des limites claires.',
];

export const FALLBACK_ACTIONS = [
  'Concentrez-vous sur une seule tache cle pour avancer.',
  'Terminez ce qui est en cours avant de relancer autre chose.',
  'Un petit ajustement aujourd hui vous fera gagner demain.',
  'Priorisez la qualite plutot que la vitesse.',
  'Faites un choix concret avant la fin de journee.',
  'Votre sens de l organisation devient un vrai atout.',
];

export const FALLBACK_TIPS = [
  'Respirez 3 fois avant chaque decision importante.',
  'Ecrivez votre intention du jour en une phrase.',
  'Proteger votre energie est aussi un acte de clarte.',
  'Avancez pas a pas: la coherence vaut mieux que la precipitation.',
  'Faites confiance au signal faible que vous ressentez.',
  'Coupez le bruit exterieur pour entendre votre boussole interieure.',
];

/** Hash FNV-1a pour une sélection stable par seed */
export function seededIndex(seed, max) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0) % max;
}

/** Convertit une longitude écliptique en nom de signe */
export function degToSignName(value) {
  const longitude = Number(value);
  if (Number.isNaN(longitude)) return '?';
  const idx = Math.floor((((longitude % 360) + 360) % 360) / 30);
  return SIGNS[idx] || '?';
}

/** Parse un input de coordonnée, retourne NaN si vide ou invalide */
export function parseCoordinateInput(inputEl) {
  if (!inputEl) return NaN;
  const raw = String(inputEl.value || '').trim();
  if (!raw) return NaN;
  const normalized = raw.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Valide une paire lat/lon */
export function hasValidCoordinates(lat, lon) {
  return Number.isFinite(lat)
    && Number.isFinite(lon)
    && lat >= -90 && lat <= 90
    && lon >= -180 && lon <= 180;
}
