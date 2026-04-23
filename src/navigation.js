// navigation.js — menu mobile, dropdowns, scroll vers sections

export function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenu) return;
  mobileMenu.classList.toggle('active');
  const isOpen = mobileMenu.classList.contains('active');
  document.body.style.overflow = isOpen ? 'hidden' : '';
  document.body.classList.toggle('mobile-menu-open', isOpen);
}

export function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  if (!mobileMenu) return;
  mobileMenu.classList.remove('active');
  document.body.style.overflow = '';
  document.body.classList.remove('mobile-menu-open');
}

export function initDesktopDropdownBlur() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  const open  = () => { if (window.innerWidth >= 768) document.body.classList.add('desktop-nav-menu-open'); };
  const close = () => document.body.classList.remove('desktop-nav-menu-open');

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('mouseenter', open);
    dropdown.addEventListener('mouseleave', close);
    dropdown.addEventListener('focusin', open);
    dropdown.addEventListener('focusout', (e) => {
      if (!dropdown.contains(e.relatedTarget)) close();
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) close();
  });
}

export function toggleMobileSubmenu(event) {
  event.preventDefault();
  event.stopPropagation();
  const button  = event.currentTarget;
  const submenu = button.parentElement.querySelector('.mobile-nav-submenu');
  const icon    = button.querySelector('.nav-expand-icon');
  if (!submenu) return;
  const isOpen = submenu.style.display !== 'none';
  submenu.style.display = isOpen ? 'none' : 'flex';
  if (icon) {
    icon.style.transform  = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    icon.style.transition = 'transform 0.3s ease';
  }
}

export function showServiceDetail(serviceId) {
  ['tarot-detail', 'pendule-detail', 'alignement-detail'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === serviceId ? 'block' : 'none';
  });
  const target = document.getElementById(serviceId);
  if (target) {
    setTimeout(() => {
      window.scrollTo({ top: window.pageYOffset + target.getBoundingClientRect().top - 80, behavior: 'smooth' });
    }, 50);
  }
}

export function showConsultations() {
  const s = document.getElementById('consultations-section');
  if (!s) return;
  s.classList.remove('consultation-focus');
  setTimeout(() => {
    if (window.innerWidth <= 980) {
      window.scrollTo({ top: window.pageYOffset + s.getBoundingClientRect().top - 80, behavior: 'smooth' });
    } else {
      s.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    s.classList.add('consultation-focus');
    setTimeout(() => s.classList.remove('consultation-focus'), 2000);
  }, 150);
}

export function showTemoignages() {
  const t = document.getElementById('temoignages-section');
  if (!t) return;
  t.style.display = 'block';
  setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

/** Attache les listeners clavier/resize globaux */
export function initNavigationGlobalListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      document.body.classList.remove('desktop-nav-menu-open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMobileMenu();
    if (window.innerWidth < 768) document.body.classList.remove('desktop-nav-menu-open');
  });
}
