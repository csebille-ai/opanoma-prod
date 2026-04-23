// ui.js — interactions DOM générales (bio, offres, réservation, newsletter, FAQ, témoignages)
import { showServiceDetail } from './navigation.js';

// ── Bio toggle ────────────────────────────────────────────────────────────────
function initBio() {
  const btnBio = document.getElementById('btn-bio');
  if (!btnBio) return;

  btnBio.addEventListener('click', function () {
    const bio = document.getElementById('manon-bio');
    const bioContent = bio && bio.querySelector('.manon-bio-content');
    if (!bio) return;

    if (bio.style.display === 'none' || bio.style.display === '') {
      bio.style.display = 'block';
      this.textContent = 'Fermer';
      bio.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (bioContent) setTimeout(() => bioContent.classList.add('text-sunshine-effect'), 100);
    } else {
      bio.style.display = 'none';
      this.textContent = 'En savoir plus';
      if (bioContent) bioContent.classList.remove('text-sunshine-effect');
    }
  });
}

// ── Fermer tous les cadres / retour accueil ───────────────────────────────────
export function fermerTousLesCadres() {
  const bio = document.getElementById('manon-bio');
  if (bio) {
    bio.style.display = 'none';
    const bc = bio.querySelector('.manon-bio-content');
    if (bc) bc.classList.remove('text-sunshine-effect');
  }
  ['tarot-detail', 'pendule-detail', 'alignement-detail'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const temoignages = document.querySelector('.temoignages-section');
  if (temoignages) temoignages.style.display = 'none';
  const faq = document.querySelector('.faq-section');
  if (faq) faq.style.display = 'none';
  const btnBio = document.getElementById('btn-bio');
  if (btnBio) btnBio.textContent = 'En savoir plus';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Brand logo → retour accueil ───────────────────────────────────────────────
function initBrandReset() {
  const brandBlock = document.querySelector('.brand');
  if (!brandBlock) return;
  brandBlock.removeAttribute('href');
  brandBlock.style.cursor = 'pointer';
  brandBlock.style.transition = 'all 0.2s ease';
  brandBlock.addEventListener('click', (e) => { e.preventDefault(); fermerTousLesCadres(); });
  brandBlock.addEventListener('mouseenter', function () {
    this.style.transform = 'translateY(-1px)';
    this.style.filter = 'brightness(1.1)';
  });
  brandBlock.addEventListener('mouseleave', function () {
    this.style.transform = 'translateY(0)';
    this.style.filter = 'brightness(1)';
  });
}

// ── Offre-tarif cards ─────────────────────────────────────────────────────────
function initOffreCards() {
  document.querySelectorAll('.offre-tarif-card[data-offre]').forEach((card) => {
    card.addEventListener('click', function () {
      const offre = this.getAttribute('data-offre');
      const detailMap = { Tarot: 'tarot-detail', Pendule: 'pendule-detail', Alignement: 'alignement-detail' };
      const detailId = detailMap[offre];
      if (detailId) {
        showServiceDetail(detailId);
        return;
      }
      const select = document.getElementById('offre-select');
      if (select) {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text === offre) { select.selectedIndex = i; break; }
        }
      }
      const reservation = document.getElementById('reservation');
      if (reservation) {
        reservation.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (select) select.focus();
      }
    });
  });
}

// ── Scroll vers réservation ───────────────────────────────────────────────────
export function scrollToReservation() {
  const reservation = document.getElementById('reservation');
  if (!reservation) return;
  const top = window.pageYOffset + reservation.getBoundingClientRect().top - 70;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

// ── Réservation API ───────────────────────────────────────────────────────────
function initReservation() {
  const submitBtn    = document.getElementById('submit-reservation');
  const statusEl     = document.getElementById('reservation-status');
  const slotsEl      = document.getElementById('slots-suggestion');
  if (!submitBtn) return;

  const RESERVATION_API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'https://opanoma.fr/api/reservation.php'
    : '/api/reservation.php';

  function showStatus(msg, type) {
    statusEl.style.display = 'block';
    statusEl.textContent   = msg;
    const colors = {
      success: { bg: 'rgba(80,180,80,.15)',   text: '#8f8',     border: 'rgba(80,180,80,.3)'   },
      error:   { bg: 'rgba(200,80,80,.15)',   text: '#f88',     border: 'rgba(200,80,80,.3)'   },
      warn:    { bg: 'rgba(201,169,110,.1)',  text: '#ff7a2f',  border: 'rgba(201,169,110,.3)' },
    };
    const c = colors[type] || colors.warn;
    statusEl.style.background = c.bg;
    statusEl.style.color      = c.text;
    statusEl.style.border     = '1px solid ' + c.border;
  }

  function showNearestSlots(slots, _date) {
    if (!slots || !slots.length) {
      slotsEl.style.display = 'block';
      slotsEl.innerHTML = '<p style="color:var(--text-dim);font-size:.85rem;">Aucun créneau proche disponible. Essayez une autre date.</p>';
      return;
    }
    let html = '<div style="display:flex;gap:12px;justify-content:center;margin-top:.5em;">';
    slots.forEach((slot, i) => {
      const label = slots.length === 1 ? (slot < '12:00' ? 'Avant' : 'Après') : (i === 0 ? 'Avant' : 'Après');
      html += `<button type="button"
        onclick="document.getElementById('reservation-time').value='${slot}';document.getElementById('slots-suggestion').style.display='none';document.getElementById('reservation-status').style.display='none';"
        style="background:var(--bg-warm);border:1px solid var(--gold);color:var(--gold);padding:10px 20px;border-radius:8px;cursor:pointer;font-size:.95rem;font-family:Inter,sans-serif;transition:all .2s;">
        <span style="display:block;font-size:.7rem;color:var(--text-dim);margin-bottom:2px;">${label}</span>${slot}</button>`;
    });
    html += '</div>';
    slotsEl.style.display = 'block';
    slotsEl.innerHTML = html;
  }

  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    slotsEl.style.display  = 'none';
    statusEl.style.display = 'none';

    const clientName      = document.getElementById('client-name')?.value.trim();
    const clientEmail     = document.getElementById('client-email')?.value.trim();
    const reservationDate = document.getElementById('reservation-date')?.value;
    const reservationTime = document.getElementById('reservation-time')?.value;
    const selectedOffre   = document.getElementById('offre-select')?.value;

    if (!clientName || !clientEmail || !reservationDate || !reservationTime || !selectedOffre) {
      showStatus('Merci de remplir tous les champs pour réserver votre séance.', 'error');
      return;
    }

    submitBtn.disabled     = true;
    submitBtn.textContent  = 'Réservation en cours…';

    try {
      const resp = await fetch(RESERVATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clientName, email: clientEmail, date: reservationDate, time: reservationTime, offre: selectedOffre }),
      });
      const data = await resp.json();

      if (data.success) {
        showStatus('✨ Réservation confirmée ! Vous recevrez un email de confirmation.', 'success');
        ['client-name', 'client-email', 'reservation-date', 'reservation-time'].forEach((id) => {
          const el = document.getElementById(id); if (el) el.value = '';
        });
        const sel = document.getElementById('offre-select'); if (sel) sel.value = '';
      } else if (data.error === 'Créneau déjà pris' && data.nearest_slots) {
        showStatus('Ce créneau est déjà pris.', 'warn');
        showNearestSlots(data.nearest_slots, reservationDate);
      } else {
        showStatus(data.error || 'Une erreur est survenue.', 'error');
      }
    } catch (_err) {
      showStatus('Erreur de connexion. Veuillez réessayer.', 'error');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Réserver';
    }
  });

  // Boutons "offre-btn-small" → pré-sélection + scroll
  document.querySelectorAll('.offre-btn-small').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const offreType = btn.getAttribute('data-offre');
      const sel = document.getElementById('offre-select');
      if (offreType && sel) sel.value = offreType;
      scrollToReservation();
    });
  });

  // Bouton "Réserver" (header/nav)
  const btnReserver = document.querySelector('.btn-pro');
  if (btnReserver) {
    btnReserver.addEventListener('click', (e) => { e.preventDefault(); scrollToReservation(); });
  }

  // Changer la date → masque les suggestions
  const dateInput = document.getElementById('reservation-date');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      slotsEl.style.display  = 'none';
      statusEl.style.display = 'none';
    });
  }
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('.newsletter-input');
    const submitBtn  = form.querySelector('.newsletter-btn');
    const email      = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@')) { alert('Veuillez saisir un email valide.'); return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Inscription...';

    fetch('./api/newsletter-subscribe.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { alert('Erreur: ' + data.error); return; }
        if (emailInput) emailInput.value = '';
        submitBtn.textContent  = '✅ Inscrit !';
        submitBtn.style.background = '#4caf50';
        const msg = document.createElement('div');
        msg.textContent = data.message || 'Inscription réussie !';
        Object.assign(msg.style, { color: '#4caf50', fontWeight: '600', marginTop: '1em', textAlign: 'center' });
        form.appendChild(msg);
        setTimeout(() => {
          submitBtn.disabled    = false;
          submitBtn.textContent = "Je m'abonne";
          submitBtn.style.background = '';
          if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 3000);
      })
      .catch(() => alert('Erreur de connexion. Veuillez réessayer.'))
      .finally(() => {
        if (submitBtn.textContent === 'Inscription...') {
          submitBtn.disabled    = false;
          submitBtn.textContent = "Je m'abonne";
        }
      });
  });
}

// ── Témoignages ───────────────────────────────────────────────────────────────
function initTemoignages() {
  const links   = document.querySelectorAll('a[href="#temoignages"]');
  const section = document.getElementById('temoignages-section');
  if (!links.length || !section) return;

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const reservation = document.getElementById('reservation');
        if (reservation && reservation.nextElementSibling !== section) {
          reservation.parentNode.insertBefore(section, reservation.nextSibling);
        }
        const isHidden = !section.style.display || section.style.display === 'none';
        if (isHidden) {
          section.style.display = 'block';
          if (reservation) {
            const top = window.pageYOffset + reservation.getBoundingClientRect().bottom + 12;
            window.scrollTo({ top, behavior: 'smooth' });
          } else {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          section.style.display = 'none';
        }
      } catch (err) {
        console.warn('Erreur témoignages:', err);
      }
    });
  });
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function initFaq() {
  const links  = document.querySelectorAll('a[href="#faq"]');
  const section = document.getElementById('faq-section');

  if (links.length && section) {
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (!section.style.display || section.style.display === 'none') {
          section.style.display = 'block';
          setTimeout(() => {
            const top = window.pageYOffset + section.getBoundingClientRect().top - 100;
            window.scrollTo({ top, behavior: 'smooth' });
          }, 50);
        } else {
          section.style.display = 'none';
        }
      });
    });
  }

  // Accordéons
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      items.forEach((other) => { if (other !== item) other.classList.remove('active'); });
      item.classList.toggle('active');
    });
  });

  // Filtres catégorie
  const categories = document.querySelectorAll('.faq-category');
  categories.forEach((cat) => {
    cat.addEventListener('click', () => {
      categories.forEach((c) => c.classList.remove('active'));
      cat.classList.add('active');
      const selected = cat.getAttribute('data-category');
      items.forEach((item) => {
        const match = selected === 'all' || item.getAttribute('data-category') === selected;
        item.style.display = match ? 'block' : 'none';
        item.classList.remove('active');
      });
    });
  });
}

// ── Trigger Tirage IA ─────────────────────────────────────────────────────────
function initTirageIA() {
  function triggerTirageIA() {
    try {
      if (window.PopupAdapter && typeof window.PopupAdapter.showThemeChoice === 'function') {
        window.PopupAdapter.showThemeChoice();
        return;
      }
    } catch (_e) {}
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      try {
        if (window.PopupAdapter && typeof window.PopupAdapter.showThemeChoice === 'function') {
          clearInterval(poll);
          window.PopupAdapter.showThemeChoice();
          return;
        }
      } catch (_e) {}
      if (attempts >= 20) {
        clearInterval(poll);
        const btn = document.querySelector('.header-btn-ia');
        if (btn) try { btn.click(); } catch (_e) {}
      }
    }, 250);
  }
  window.triggerTirageIA = triggerTirageIA;
}

// ── Export init ───────────────────────────────────────────────────────────────
export function initUI() {
  initBio();
  initBrandReset();
  initOffreCards();
  initReservation();
  initNewsletter();
  initTemoignages();
  initFaq();
  initTirageIA();
}
