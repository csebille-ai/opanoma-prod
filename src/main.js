/* ===== Opanoma — Vite entry point ===== */

// Styles (injected by Vite)
import './style.css';
import './popup.css';
import './newsletter-mobile.css';

// Modules métier
import { initHoroscope } from './horoscope.js';
import { initNatal } from './natal.js';
import {
  initDesktopDropdownBlur,
  initNavigationGlobalListeners,
  toggleMobileMenu,
  closeMobileMenu,
  toggleMobileSubmenu,
  showServiceDetail,
  showConsultations,
  showTemoignages,
} from './navigation.js';
import { initUI, scrollToReservation } from './ui.js';

// Expose aux attributs onclick= encore présents dans le HTML
window.toggleMobileMenu    = toggleMobileMenu;
window.closeMobileMenu     = closeMobileMenu;
window.toggleMobileSubmenu = toggleMobileSubmenu;
window.showServiceDetail   = showServiceDetail;
window.showConsultations   = showConsultations;
window.showTemoignages     = showTemoignages;
window.scrollToReservation = scrollToReservation;

document.addEventListener('DOMContentLoaded', () => {
  initDesktopDropdownBlur();
  initNavigationGlobalListeners();
  initHoroscope();
  initNatal();
  initUI();
});
