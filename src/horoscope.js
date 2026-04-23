// horoscope.js — fetch API + rendu DOM horoscope
import {
  SIGNS,
  FALLBACK_ENERGIES,
  FALLBACK_RELATIONNELS,
  FALLBACK_ACTIONS,
  FALLBACK_TIPS,
  seededIndex,
} from './astro-utils.js';

/** Fallback local : sélection par seed signe+date */
export function renderHoroscopeFallback(sign) {
  const dayKey = new Date().toISOString().slice(0, 10);
  const seed = sign + '|' + dayKey;

  const signName = document.getElementById('horoscope-sign-name');
  const energy   = document.getElementById('horoscope-energy');
  const love     = document.getElementById('horoscope-love');
  const work     = document.getElementById('horoscope-work');
  const tip      = document.getElementById('horoscope-tip');
  if (!signName || !energy || !love || !work || !tip) return;

  signName.textContent = sign;
  energy.textContent = FALLBACK_ENERGIES[seededIndex(seed + '|e', FALLBACK_ENERGIES.length)];
  love.textContent   = FALLBACK_RELATIONNELS[seededIndex(seed + '|r', FALLBACK_RELATIONNELS.length)];
  work.textContent   = FALLBACK_ACTIONS[seededIndex(seed + '|a', FALLBACK_ACTIONS.length)];
  tip.textContent    = FALLBACK_TIPS[seededIndex(seed + '|t', FALLBACK_TIPS.length)];
}

async function fetchHoroscope(sign) {
  const response = await fetch('/astro/horoscope?sign=' + encodeURIComponent(sign), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Horoscope API HTTP ' + response.status);
  return response.json();
}

/** Rend l'horoscope depuis l'API avec fallback local */
export async function renderHoroscopeFromApi(sign) {
  const signName = document.getElementById('horoscope-sign-name');
  const energy   = document.getElementById('horoscope-energy');
  const love     = document.getElementById('horoscope-love');
  const work     = document.getElementById('horoscope-work');
  const tip      = document.getElementById('horoscope-tip');
  if (!signName || !energy || !love || !work || !tip) return;

  const horoscopeSection = document.getElementById('horoscope-section');
  if (horoscopeSection) {
    horoscopeSection.className = 'horoscope-section horoscope-sign-' + (sign || 'belier').toLowerCase();
  }

  const horoscopeCard = document.getElementById('horoscope-card');
  if (horoscopeCard) {
    horoscopeCard.className = 'horoscope-card horoscope-sign-' + (sign || 'belier').toLowerCase();
  }

  energy.textContent = 'Calcul astrologique en cours...';
  love.textContent   = '...';
  work.textContent   = '...';
  tip.textContent    = '...';

  try {
    const payload = await fetchHoroscope(sign);
    const guidance = payload && payload.guidance ? payload.guidance : null;
    if (!guidance) throw new Error('payload invalide');

    signName.textContent = payload.sign || sign;
    energy.textContent   = guidance.energy || '';
    love.textContent     = guidance.love   || '';
    work.textContent     = guidance.work   || '';
    tip.textContent      = guidance.tip    || '';
  } catch (err) {
    console.warn('[Horoscope] API indisponible, fallback local', err);
    renderHoroscopeFallback(sign);
  }
}

/** Remet la card à l'état initial (avant sélection) */
export function resetHoroscopeUi(signsWrap) {
  const signName       = document.getElementById('horoscope-sign-name');
  const energy         = document.getElementById('horoscope-energy');
  const love           = document.getElementById('horoscope-love');
  const work           = document.getElementById('horoscope-work');
  const tip            = document.getElementById('horoscope-tip');
  const horoscopeSection = document.getElementById('horoscope-section');
  const horoscopeCard    = document.getElementById('horoscope-card');

  if (signsWrap) {
    signsWrap.querySelectorAll('.horoscope-sign').forEach(node => node.classList.remove('active'));
  }
  if (horoscopeSection) horoscopeSection.className = 'horoscope-section';
  if (horoscopeCard)    horoscopeCard.className    = 'horoscope-card horoscope-sign-all';
  if (signName) signName.textContent = 'Choisissez votre signe';
  if (energy)   energy.textContent   = 'Selectionnez un signe pour afficher la guidance du jour.';
  if (love)     love.textContent     = '-';
  if (work)     work.textContent     = '-';
  if (tip)      tip.textContent      = '-';
}

/** Initialise la section horoscope (listeners + observer) */
export function initHoroscope() {
  const signsWrap = document.getElementById('horoscope-signs');
  if (!signsWrap) return;

  // Date du jour
  const dateLabel = document.getElementById('horoscope-date');
  if (dateLabel) {
    dateLabel.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
  }

  resetHoroscopeUi(signsWrap);

  let hasSelection = false;

  signsWrap.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.horoscope-sign');
    if (!btn) return;
    const selected = btn.getAttribute('data-sign');
    if (!selected || !SIGNS.includes(selected)) return;

    signsWrap.querySelectorAll('.horoscope-sign').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
    hasSelection = true;
    renderHoroscopeFromApi(selected);
  });

  const section = document.getElementById('horoscope-section');
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && hasSelection) {
          hasSelection = false;
          resetHoroscopeUi(signsWrap);
        }
      });
    }, { threshold: 0.1 }).observe(section);
  }
}
