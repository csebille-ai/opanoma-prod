import './style.css';

// année dynamique
import './style.css';

// année dynamique
document.addEventListener('DOMContentLoaded', () => {
  const y = document.querySelector('#year');
  if (y) y.textContent = new Date().getFullYear();
});

// scroll fluide pour les ancres internes
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = document.querySelector(id);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
