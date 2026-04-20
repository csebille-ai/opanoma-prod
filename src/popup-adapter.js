// popup-adapter.js — single clean implementation

(function () {
  'use strict';

  // inject helper styles to hide scrollbars when popup is open
  try {
    if (!document.getElementById('pa-popup-styles')) {
      const s = document.createElement('style');
      s.id = 'pa-popup-styles';
      s.textContent = `
        /* Force-hide page scrollbars while popup is active */
        .pa-popup-open, .pa-popup-open html, .pa-popup-open body, html.pa-popup-open, body.pa-popup-open { overflow: hidden !important; height: 100% !important; }
        /* Hide scrollbars for common engines when popup open */
        .pa-popup-open * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pa-popup-open *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .pa-deck-overlay-fallback { overflow: hidden !important; }
        .pa-deck-overlay-fallback::-webkit-scrollbar { display: none !important; }
        .pm-popup-msgbox { overflow-x: hidden !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pm-popup-msgbox::-webkit-scrollbar { display: none !important; }
        .pm-card-slot { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pm-card-slot::-webkit-scrollbar { display: none !important; }
  `;
    }
  } catch (e) { /* ignore style injection errors */ }

  // Utility: preferred max width for popup frames
  function getMaxFrameWidth() {
    try {
      const w = Math.max(420, Math.min(window.innerWidth - 40, 820));
      return w + 'px';
    } catch (e) {
      return '720px';
    }
  }

  // Force-hide page scrollbars (useful when showing modal popups). Use sparingly.
  function setGlobalNoScroll(on) {
    try {
      if (on) {
        try { document.documentElement.style.overflow = 'hidden'; } catch (e) { console.warn('[PA]', e); }
        try { document.body.style.overflow = 'hidden'; } catch (e) { console.warn('[PA]', e); }
        try { document.body.classList.add('pa-popup-open'); } catch (e) { console.warn('[PA]', e); }
      } else {
        try { document.documentElement.style.overflow = ''; } catch (e) { console.warn('[PA]', e); }
        try { document.body.style.overflow = ''; } catch (e) { console.warn('[PA]', e); }
        try { document.body.classList.remove('pa-popup-open'); } catch (e) { console.warn('[PA]', e); }
      }
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.padding = '12px';
    } catch (e) { /* ignore */ }
  }

  // Preserved raw messages (for compatibility)
  const rawMessages = {
    'Santé': [
      'Comment retrouver mon énergie vitale ?',
      'Que cherche à me dire mon corps ?',
      'Quelle habitude devrais-je changer ?',
      'Comment retrouver mon harmonie intérieure ?',
      'Que veulent m’apprendre mes ressentis ?'
    ],
    'Travail': [
      'quelle évolution pour ma carrière et mes projets professionnels ?',
      'dois-je envisager un changement ou une formation ?',
      'quelles opportunités se présentent et comment les reconnaître ?',
      'mon environnement de travail est-il propice à ma réussite ?',
      'comment mieux gérer le stress lié au travail ?'
    ],
    'Amour': [
      'Vais-je bientôt rencontrer quelqu’un ?',
      'Cette relation a-t-elle un avenir ?',
      'Mes sentiments sont-ils partagés ?',
      'Dois-je tourner la page ?',
      'Vais-je retrouver l’amour ?'
    ],
    'Argent': [
      'Vais-je bientôt améliorer ma situation financière ?',
      'Mon travail va-t-il me rapporter davantage ?',
      'Une rentrée d’argent est-elle à venir ?',
      'Dois-je faire attention à mes dépenses ?',
      'Est-ce le bon moment pour investir ?'
    ]
  };

  // Theme color mapping used for message styling
  const THEME_COLORS = {
    'Santé': { bg: '#2E7D32', color: '#fff' },
    'Amour': { bg: '#E91E63', color: '#fff' },
    'Argent': { bg: '#FFC107', color: '#111' },
    'Travail': { bg: '#1976D2', color: '#fff' }
  };

  // internal state used by showTirageDisplay
  let currentSlots = null;

  function attachHeaderHandlers() {
    try {
      // attach click handlers to elements marked with data-popup-adapter
      const triggers = document.querySelectorAll('[data-popup-adapter]');
      Array.prototype.forEach.call(triggers || [], (el) => {
        try {
          if (el.dataset && el.dataset.popupAdapterAttached) return;
          el.addEventListener('click', (ev) => { try { showThemeChoice(); } catch (e) { console.warn('[PA]', e); } if (ev && ev.preventDefault) ev.preventDefault(); });
          el.dataset.popupAdapterAttached = '1';
        } catch (e) { console.warn('[PA]', e); }
      });
    } catch (e) { /* ignore */ }

  }

  function openPopup(container) {
    // Try to use page's PopupManager if available; otherwise return the container
    try {
      if (typeof PopupManager !== 'undefined' && PopupManager && typeof PopupManager.open === 'function') {
        // allow per-container override of maxWidth (e.g., large deck popup)
        const override = container && container.dataset && container.dataset.maxWidth;
        const mw = override || getMaxFrameWidth();
        return PopupManager.open({ html: container, maxWidth: mw });
      }
    } catch (e) {
      // fall through to returning container
    }
    return container;
  }

  function showThemeChoice(onDone) {
  const container = document.createElement('div');
  container.style.textAlign = 'center';
  container.style.padding = '12px';

    const title = document.createElement('h2');
    title.className = 'pm-popup-title';
    title.textContent = 'Choix du thème';
    container.appendChild(title);

    const disclaimer = document.createElement('p');
    disclaimer.style.cssText = 'font-size:12px;color:rgba(201,169,110,.5);font-style:italic;margin:4px 0 10px;line-height:1.4;font-family:"Quicksand",sans-serif';
    disclaimer.textContent = 'Ce tirage est généré par intelligence artificielle à titre indicatif. Il ne remplace pas une consultation personnalisée.';
    container.appendChild(disclaimer);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'center';
    row.style.gap = '12px';
    row.style.marginTop = '12px';
    row.style.flexWrap = 'wrap';

    const themes = ['Santé', 'Amour', 'Argent', 'Travail'];
    const themeColors = {
      'Santé': { bg: '#2E7D32', color: '#fff' },
      'Amour': { bg: '#E91E63', color: '#fff' },
      'Argent': { bg: '#FFC107', color: '#111' },
      'Travail': { bg: '#1976D2', color: '#fff' }
    };

    // Create an area that will host the question input and action buttons (hidden initially)
    const questionWrap = document.createElement('div');
    Object.assign(questionWrap.style, { marginTop: '12px', display: 'none', flexDirection: 'column', alignItems: 'center' });
  // textarea with prompt as placeholder
  const qInput = document.createElement('textarea');
  qInput.placeholder = 'Posez votre question (facultatif) :';
  qInput.className = 'pm-question-box';
  Object.assign(qInput.style, { width: '92%', minHeight: '56px', resize: 'vertical' });
    // action buttons container
    const qActions = document.createElement('div');
    Object.assign(qActions.style, { marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' });
    const btnValider = document.createElement('button');
    btnValider.textContent = 'Valider';
    btnValider.className = 'pm-theme-btn selected';
    const btnPasser = document.createElement('button');
    btnPasser.textContent = 'Passer';
    btnPasser.className = 'pm-close-btn';
    qActions.appendChild(btnValider);
    qActions.appendChild(btnPasser);
  questionWrap.appendChild(qInput);
    questionWrap.appendChild(qActions);

    // selected theme tracker
    let _selectedTheme = null;
    const themeButtons = {};

    themes.forEach(t => {
      const b = document.createElement('button');
      b.className = 'pm-theme-btn';
      b.textContent = t;
      // store reference
      themeButtons[t] = b;
      b.addEventListener('click', () => {
        try {
          // stop any running rotation immediately so only theme messages will run after validation
          try { if (typeof stopThemeMessages === 'function') stopThemeMessages(); } catch (e) { console.warn('[PA]', e); }
          // reveal question area and focus input
          _selectedTheme = t;
          questionWrap.style.display = 'flex';
          qInput.value = '';
          setTimeout(() => { try { qInput.focus(); } catch (e) { console.warn('[PA]', e); } }, 60);
          // visually mark selected but keep buttons active (less vivid): selected stays normal, others dim
          try {
            Object.keys(themeButtons).forEach(k => {
              try {
                if (k === t) {
                  themeButtons[k].classList.add('selected');
                  themeButtons[k].classList.remove('dimmed');
                } else {
                  themeButtons[k].classList.remove('selected');
                  themeButtons[k].classList.add('dimmed');
                }
              } catch (e) { console.warn('[PA]', e); }
            });
          } catch (e) { console.warn('[PA]', e); }
          // start playing theme messages here (Step 2): show rotating messages for the selected theme
          try {
            const themeMsgs = (window.PopupAdapter && window.PopupAdapter._autoThemeMessages && window.PopupAdapter._autoThemeMessages[t]) || rawMessages[t] || [];
            // small delay so the UI settles
            setTimeout(() => {
              try {
                if (themeMsgs && themeMsgs.length && typeof playThemeMessages === 'function') {
                  playThemeMessages(t, themeMsgs, { exitEffect: (window.PopupAdapter && window.PopupAdapter._defaultExitEffect) || 'wipe', loop: true });
                }
              } catch (e) { console.warn('[PA]', e); }
            }, 160);
          } catch (e) { console.warn('[PA]', e); }
        } catch (e) { console.warn('[PA]', e); }
      });
      row.appendChild(b);
    });
    container.appendChild(row);

    // inert message frame (kept empty intentionally) — will be populated by external code via PopupAdapter.setThemeMessages
    const msgBox = document.createElement('div');
    msgBox.className = 'pm-popup-msgbox';
    Object.assign(msgBox.style, {
      marginTop: '12px',
      minHeight: '0',
      padding: '0 12px',
      borderRadius: '8px',
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      width: '100%'
    });
  const debugBadge = null;
  // Insert questionWrap before the message box so it appears under the buttons
  container.appendChild(questionWrap);
  container.appendChild(msgBox);

    // expose helper to set/clear messages in this box (kept per-popup so multiple popups don't conflict)
    // We'll attach them to window.PopupAdapter when the popup is opened so external code can call them.
    const setThemeMessages = function (messages) {
      try {
        msgBox.innerHTML = '';
        if (!messages || !messages.length) return;
        messages.forEach(m => {
          const p = document.createElement('div');
          p.className = 'pm-msg';
          p.textContent = String(m);
          Object.assign(p.style, { marginBottom: '8px', textAlign: 'left' });
          msgBox.appendChild(p);
        });
      } catch (e) { /* ignore */ }
    };
    const clearThemeMessages = function () { try { msgBox.innerHTML = ''; } catch (e) { console.warn('[PA]', e); } };

  const handle = openPopup(container);
    // attach helpers to global API so external code can call them
    window.PopupAdapter = window.PopupAdapter || {};
    window.PopupAdapter._lastThemePopupHandle = handle;
    window.PopupAdapter.setThemeMessages = setThemeMessages;
    window.PopupAdapter.clearThemeMessages = clearThemeMessages;
    // also expose a reference to the box (read-only)
    window.PopupAdapter._lastThemeMsgBox = msgBox;
  // expose debug badge for runtime updates
  window.PopupAdapter._debugBadge = debugBadge;
  // expose theme button refs so stopThemeMessages can reset visuals
  window.PopupAdapter._themeButtons = themeButtons;

  // helper: return the last measured deck popup size/rect (if any)
  try {
    window.PopupAdapter.getLastDeckSize = function () {
      try {
        return window.PopupAdapter._lastDeckPopupRect || window.PopupAdapter._lastDeckPopupSize || null;
      } catch (e) { return null; }
    };

    // helper: ask the user (confirm) and apply the stored deck size to the active deck popup wrapper/container
    window.PopupAdapter.confirmAndApplyLastDeckSize = function () {
      try {
        const rect = window.PopupAdapter.getLastDeckSize();
        if (!rect) {
          return { ok: false, reason: 'no-stored-size' };
        }
        const msg = `Taille détectée pour le tirage : ${rect.width}px × ${rect.height}px.\nAppliquer cette taille au popup tirage maintenant ?`;
        // use window.confirm so the user is explicitly warned in-page
        const apply = (typeof window.confirm === 'function') ? window.confirm(msg) : true;
        if (!apply) return { ok: false, reason: 'user-declined' };

        // find candidates: recent interp frame, any .pa-deck-overlay-fallback, or last opened container
        const candidates = [];
        try { const w = document.querySelector('.pa-deck-overlay-fallback'); if (w) candidates.push(w); } catch (e) { console.warn('[PA]', e); }
        try { const lastDeck = document.getElementById && document.getElementById('pa-last-deck-container'); if (lastDeck) candidates.push(lastDeck); } catch (e) { console.warn('[PA]', e); }
        try { const popupNodes = document.querySelectorAll && document.querySelectorAll('.pm-popup, .pm-popup-inner'); if (popupNodes && popupNodes.length) popupNodes.forEach(n => candidates.push(n)); } catch (e) { console.warn('[PA]', e); }

        // fallback: use body children that match inline-style width/height hints
        if (!candidates.length) {
          try { Array.from(document.body.children).slice(-6).forEach(n => candidates.push(n)); } catch (e) { console.warn('[PA]', e); }
        }

        // apply to found candidates
        let applied = 0;
        candidates.forEach(node => {
          try {
            if (!node || !node.style) return;
            node.style.width = rect.width + 'px';
            node.style.minWidth = rect.width + 'px';
            node.style.maxWidth = rect.width + 'px';
            // let content expand freely
            node.style.maxHeight = 'none';
            node.style.height = 'auto';
            node.style.minHeight = 'auto';
            applied++;
          } catch (e) { console.warn('[PA]', e); }
        });
        return { ok: true, applied: applied, rect: rect };
      } catch (e) { return { ok: false, reason: 'exception' }; }
    };
  } catch (e) { console.warn('[PA]', e); }

    // helper to start playing messages for a specific theme
    function startThemePlay(themeKey, questionText) {
      try {
        // Store theme and question so the API call can read them
        window.PopupAdapter = window.PopupAdapter || {};
        window.PopupAdapter.currentTheme = themeKey || '';
        window.PopupAdapter.currentQuestion = questionText || '';
        try { if (typeof stopThemeMessages === 'function') stopThemeMessages(); } catch (e) { console.warn('[PA]', e); }
        const msgs = (window.PopupAdapter && window.PopupAdapter._autoThemeMessages && window.PopupAdapter._autoThemeMessages[themeKey]) || rawMessages[themeKey] || [];
  console && console.log && console.log('[PopupAdapter] startThemePlay', themeKey, 'msgs=', msgs && msgs.length);
        // Hide the question area, theme row and title so only the 3/5 panels are visible
        try { questionWrap.style.display = 'none'; } catch (e) { console.warn('[PA]', e); }
        try { row.style.display = 'none'; } catch (e) { console.warn('[PA]', e); }
        try { title.style.display = 'none'; } catch (e) { console.warn('[PA]', e); }
        // Instead of immediately playing the rotating theme messages, replace the message box
        // with two panels offering a choice: Tirage 3 cartes or Tirage 5 cartes.
        try {
          if (window.PopupAdapter && window.PopupAdapter._lastThemeMsgBox) {
            const box = window.PopupAdapter._lastThemeMsgBox;
            box.innerHTML = ''; // clear existing messages
            // Add a heading for the choice screen
            const choiceTitle = document.createElement('h3');
            choiceTitle.textContent = 'Choisissez votre tirage';
            Object.assign(choiceTitle.style, { textAlign: 'center', color: '#c9a96e', fontFamily: '"Cinzel", serif', fontSize: '1.2rem', margin: '8px 0 16px', letterSpacing: '0.04em' });
            box.appendChild(choiceTitle);
            // create container
            const grid = document.createElement('div');
            grid.style.display = 'flex';
            grid.style.gap = '12px';
            grid.style.justifyContent = 'center';
            grid.style.alignItems = 'stretch';
            grid.style.flexWrap = 'wrap';

            function makePanel(titleText, explText, count) {
              const p = document.createElement('div');
              Object.assign(p.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: '1 1 260px',
                minWidth: '220px',
                maxWidth: '420px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.45))',
                borderRadius: '8px',
                padding: '12px',
                boxSizing: 'border-box',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.45)'
              });
              const h = document.createElement('h4'); h.textContent = titleText;
              const forcedFont = '"Quicksand", "Inter", Arial, sans-serif';
              Object.assign(h.style, { margin: '0 0 8px 0', fontSize: '16px', fontFamily: forcedFont, fontWeight: '600', lineHeight: '1.15' });
              const para = document.createElement('div'); para.innerHTML = String(explText);
              Object.assign(para.style, { fontSize: '13px', marginBottom: '10px', color: 'rgba(255,255,255,0.9)', flex: '1 1 auto', fontFamily: forcedFont });
              const btn = document.createElement('button'); btn.textContent = 'Choisir ' + count + ' cartes';
              try { btn.setAttribute('data-pa-choose', String(count)); } catch (e) { console.warn('[PA]', e); }
              Object.assign(btn.style, {
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: 'none',
                background: 'linear-gradient(90deg,#ff7a59,#ffb86b)',
                color: '#fff',
                fontWeight: '600',
                boxShadow: '0 5px 12px rgba(0,0,0,0.28)',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                fontFamily: forcedFont,
                fontSize: '0.85rem',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                alignSelf: 'flex-start'
              });
              // subtle hover lift
              btn.addEventListener('mouseenter', function(){ try { this.style.transform = 'translateY(-3px)'; this.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)'; } catch (e) { console.warn('[PA]', e); } });
              btn.addEventListener('mouseleave', function(){ try { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)'; } catch (e) { console.warn('[PA]', e); } });
              btn.addEventListener('click', function () {
                try {
                  // Close theme popup before opening deck
                  try { if (window.PopupAdapter && window.PopupAdapter._lastThemePopupHandle) { var h = window.PopupAdapter._lastThemePopupHandle; if (h.close) h.close(); else if (typeof PopupManager !== 'undefined' && PopupManager.close) PopupManager.close(h); else { var overlay = (h.el || h).closest && (h.el || h).closest('.pm-overlay'); if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); else if (h.parentNode) h.parentNode.removeChild(h); } window.PopupAdapter._lastThemePopupHandle = null; } } catch (e) { console.warn('[PA]', e); }
                  if (typeof showDeckPopup === 'function') {
                      showDeckPopup(count);
                  } else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') {
                      window.PopupAdapter.showDeckPopup(count);
                  } else if (typeof showTirageDisplay === 'function') {
                      showTirageDisplay(count);
                  }
                } catch (e) { console && console.warn && console.warn('open tirage error', e); }
              });
              p.appendChild(h); p.appendChild(para); p.appendChild(btn);
              return p;
            }

            // Panel A: Tirage 3 cartes
            const panelThree = document.createElement('div');
            Object.assign(panelThree.style, {
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
              flex: '1 1 260px', minWidth: '220px', maxWidth: '380px',
              background: 'linear-gradient(180deg, rgba(20,16,14,0.92), rgba(12,10,9,0.88))',
              borderRadius: '12px', padding: '20px 18px', boxSizing: 'border-box',
              color: '#ede8e3', border: '1px solid rgba(201,169,110,0.12)',
              boxShadow: '0 8px 22px rgba(0,0,0,0.5)', textAlign: 'center'
            });
            const p3icon = document.createElement('div');
            p3icon.innerHTML = '&#x2728;&#x2728;&#x2728;';
            Object.assign(p3icon.style, { fontSize: '24px', marginBottom: '10px', letterSpacing: '6px' });
            const p3h = document.createElement('h4'); p3h.textContent = 'Tirage 3 cartes';
            Object.assign(p3h.style, { margin: '0 0 10px 0', fontSize: '17px', fontFamily: '"Cinzel", serif', fontWeight: '600', color: '#c9a96e', letterSpacing: '0.04em' });
            const p3para = document.createElement('div');
            p3para.innerHTML = '<span style="color:rgba(237,232,227,0.65)">Pass\u00e9 \u00b7 Pr\u00e9sent \u00b7 Futur</span><br>Rapide et \u00e9clairant \u2014 id\u00e9al pour une question pr\u00e9cise.';
            Object.assign(p3para.style, { fontSize: '13.5px', marginBottom: '16px', color: 'rgba(237,232,227,0.88)', lineHeight: '1.55', fontFamily: '"Quicksand", "Inter", Arial, sans-serif' });
            const p3btn = document.createElement('button'); p3btn.textContent = '\u2726  3 cartes';
            try { p3btn.setAttribute('data-pa-choose', '3'); } catch (e) { console.warn('[PA]', e); }
            Object.assign(p3btn.style, { padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.1)', color: '#c9a96e', fontWeight: '600', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', transition: 'all 180ms ease', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontSize: '0.9rem', display: 'inline-block', whiteSpace: 'nowrap' });
            p3btn.addEventListener('mouseenter', function(){ try { this.style.background = '#c9a96e'; this.style.color = '#0c0a09'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 8px 24px rgba(201,169,110,0.3)'; } catch (e) { console.warn('[PA]', e); } });
            p3btn.addEventListener('mouseleave', function(){ try { this.style.background = 'rgba(201,169,110,0.1)'; this.style.color = '#c9a96e'; this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'; } catch (e) { console.warn('[PA]', e); } });
            p3btn.addEventListener('click', function () { try {
                // Close the theme popup entirely before opening the deck
                try { if (window.PopupAdapter && window.PopupAdapter._lastThemePopupHandle) { var h = window.PopupAdapter._lastThemePopupHandle; if (h.close) h.close(); else if (typeof PopupManager !== 'undefined' && PopupManager.close) PopupManager.close(h); else { var overlay = (h.el || h).closest && (h.el || h).closest('.pm-overlay'); if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); else if (h.el && h.el.parentNode) h.el.parentNode.removeChild(h.el); else if (h.parentNode) h.parentNode.removeChild(h); } window.PopupAdapter._lastThemePopupHandle = null; } } catch (e) { console.warn('close theme popup failed', e); }
                if (typeof showDeckPopup === 'function') showDeckPopup(3); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(3); else if (typeof showTirageDisplay === 'function') showTirageDisplay(3);
              } catch (e) { console && console.warn && console.warn('open tirage error', e); } });
            panelThree.appendChild(p3icon); panelThree.appendChild(p3h); panelThree.appendChild(p3para); panelThree.appendChild(p3btn);
            // Panel B: Tirage 5 cartes
            const panelFive = document.createElement('div');
            Object.assign(panelFive.style, {
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
              flex: '1 1 260px', minWidth: '220px', maxWidth: '380px',
              background: 'linear-gradient(180deg, rgba(20,16,14,0.92), rgba(12,10,9,0.88))',
              borderRadius: '12px', padding: '20px 18px', boxSizing: 'border-box',
              color: '#ede8e3', border: '1px solid rgba(201,169,110,0.12)',
              boxShadow: '0 8px 22px rgba(0,0,0,0.5)', textAlign: 'center'
            });
            const p5icon = document.createElement('div');
            p5icon.innerHTML = '&#x2728;&#x2728;&#x2728;&#x2728;&#x2728;';
            Object.assign(p5icon.style, { fontSize: '24px', marginBottom: '10px', letterSpacing: '6px' });
            const p5h = document.createElement('h4'); p5h.textContent = 'Tirage 5 cartes';
            Object.assign(p5h.style, { margin: '0 0 10px 0', fontSize: '17px', fontFamily: '"Cinzel", serif', fontWeight: '600', color: '#c9a96e', letterSpacing: '0.04em' });
            const p5para = document.createElement('div');
            p5para.innerHTML = '<span style="color:rgba(237,232,227,0.65)">Forces \u00b7 Obstacles \u00b7 Conseil \u00b7 \u00c9volution \u00b7 Synth\u00e8se</span><br>Approfondi et strat\u00e9gique \u2014 pour une vision compl\u00e8te.';
            Object.assign(p5para.style, { fontSize: '13.5px', marginBottom: '16px', color: 'rgba(237,232,227,0.88)', lineHeight: '1.55', fontFamily: '"Quicksand", "Inter", Arial, sans-serif' });
            const p5btn = document.createElement('button'); p5btn.textContent = '\u2726  5 cartes';
            try { p5btn.setAttribute('data-pa-choose', '5'); } catch (e) { console.warn('[PA]', e); }
            Object.assign(p5btn.style, { padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.1)', color: '#c9a96e', fontWeight: '600', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', transition: 'all 180ms ease', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontSize: '0.9rem', display: 'inline-block', whiteSpace: 'nowrap' });
            p5btn.addEventListener('mouseenter', function(){ try { this.style.background = '#c9a96e'; this.style.color = '#0c0a09'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 8px 24px rgba(201,169,110,0.3)'; } catch (e) { console.warn('[PA]', e); } });
            p5btn.addEventListener('mouseleave', function(){ try { this.style.background = 'rgba(201,169,110,0.1)'; this.style.color = '#c9a96e'; this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'; } catch (e) { console.warn('[PA]', e); } });
            p5btn.addEventListener('click', function () { try {
                // Close the theme popup entirely before opening the deck
                try { if (window.PopupAdapter && window.PopupAdapter._lastThemePopupHandle) { var h = window.PopupAdapter._lastThemePopupHandle; if (h.close) h.close(); else if (typeof PopupManager !== 'undefined' && PopupManager.close) PopupManager.close(h); else { var overlay = (h.el || h).closest && (h.el || h).closest('.pm-overlay'); if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); else if (h.el && h.el.parentNode) h.el.parentNode.removeChild(h.el); else if (h.parentNode) h.parentNode.removeChild(h); } window.PopupAdapter._lastThemePopupHandle = null; } } catch (e) { console.warn('close theme popup failed', e); }
                if (typeof showDeckPopup === 'function') showDeckPopup(5); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(5); else if (typeof showTirageDisplay === 'function') showTirageDisplay(5);
              } catch (e) { console && console.warn && console.warn('open tirage error', e); } });
            panelFive.appendChild(p5icon); panelFive.appendChild(p5h); panelFive.appendChild(p5para); panelFive.appendChild(p5btn);

            grid.appendChild(panelThree); grid.appendChild(panelFive);
            box.appendChild(grid);
            try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = 'theme=' + themeKey + ' choose tirage'; } catch (e) { console.warn('[PA]', e); }
          }
        } catch (e) { console.error('[PopupAdapter] UI build error in startThemePlay:', e); }
        // ensure selected button stays normal while others are dimmed
        try {
          if (window.PopupAdapter && window.PopupAdapter._themeButtons) {
            Object.keys(window.PopupAdapter._themeButtons).forEach(k => { try { window.PopupAdapter._themeButtons[k].style.opacity = (k === themeKey) ? '1' : '0.6'; } catch (e) { console.warn('[PA]', e); } });
          }
        } catch (e) { console.warn('[PA]', e); }
        if (typeof onDone === 'function') {
          try { onDone(themeKey, questionText); } catch (e) { console.warn('[PA]', e); }
        }
      } catch (e) { console.error('[PopupAdapter] startThemePlay error:', e); }
    }

    // wire Valider and Passer
    btnValider.addEventListener('click', () => {
      const q = String(qInput.value || '').trim();
      if (!_selectedTheme) return;
      startThemePlay(_selectedTheme, q);
    });
    btnPasser.addEventListener('click', () => {
      if (!_selectedTheme) return;
      startThemePlay(_selectedTheme, '');
    });

    // On open: play messages drawn from all themes (or use any _autoThemeMessages overrides)
    try {
      const autoAll = (window.PopupAdapter && window.PopupAdapter._autoThemeMessages) || {};
      const msgs = [];
      // include rawMessages and override/append with any auto messages; keep theme association
      Object.keys(rawMessages).forEach(k => {
        const fromAuto = Array.isArray(autoAll[k]) ? autoAll[k] : null;
        if (fromAuto && fromAuto.length) fromAuto.forEach(t => msgs.push({ text: String(t), theme: k }));
        else if (Array.isArray(rawMessages[k])) rawMessages[k].forEach(t => msgs.push({ text: String(t), theme: k }));
      });
      // also include any keys present in autoAll that aren't in rawMessages
      Object.keys(autoAll).forEach(k => { if (!rawMessages[k] && Array.isArray(autoAll[k])) autoAll[k].forEach(t => msgs.push({ text: String(t), theme: k })); });
      if (msgs && msgs.length) {
        if (typeof playThemeMessages === 'function') {
          setTimeout(() => { try { playThemeMessages('global', msgs, { delay: 1800, exitEffect: 'wipe' }); } catch (e) { console.warn('[PA]', e); } }, 120);
        } else {
          setThemeMessages(msgs);
        }
      }
    } catch (e) { /* ignore */ }

    return handle;
  }

  function showTirageChoicePopup(onDone, opts) {
    opts = opts || {};
    const count = (opts.count === 3 || opts.count === 5) ? opts.count : 3;
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.padding = '10px';

    const title = document.createElement('h3');
    title.className = 'pm-popup-title';
    title.textContent = 'Choisissez votre tirage';
    container.appendChild(title);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.justifyContent = 'center';

    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'tirage-choice-card';
      c.textContent = (i + 1).toString();
      Object.assign(c.style, {
        width: '76px',
        height: '110px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        background: '#fff',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
        cursor: 'pointer'
      });
      c.addEventListener('click', () => { try { if (typeof onDone === 'function') onDone(i + 1); } catch (e) { console.warn('[PA]', e); } });
      row.appendChild(c);
    }

    container.appendChild(row);
    return openPopup(container);
  }

  function showTirageDisplay(total) {
    total = Number(total) || 22;
    const cols = 4;
    const rows = Math.ceil(total / cols);

    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.padding = '12px';

    const title = document.createElement('h3');
    title.className = 'pm-popup-title';
    title.textContent = 'Tirage';
    container.appendChild(title);

    const stage = document.createElement('div');
     stage.style.display = 'block';
    stage.style.justifyContent = 'center';

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gap = '8px';
    grid.style.boxSizing = 'content-box';
    const slots = [];

      for (let i = 0; i < total; i++) {
        const slot = document.createElement('div');
        slot.className = 'pm-card-slot';
        Object.assign(slot.style, {
          overflow: 'hidden',
          borderRadius: '6px',
          background: 'linear-gradient(180deg,#eee,#ddd)',
          display: 'flex',
          alignItems: 'center',
        // align image to left inside slot with no left padding so it hugs the edge
        justifyContent: 'flex-start',
        paddingLeft: '0px',
          width: '80px',
          height: '120px'
        });
      slot.dataset.slotIndex = i;
      grid.appendChild(slot);
      slots.push(slot);
    }

    stage.appendChild(grid);
    container.appendChild(stage);

    const popupHandle = openPopup(container);

    // layout scaling shortly after open (keeps responsive behavior)
    setTimeout(() => {
      try {
        const maxW = parseInt(String(getMaxFrameWidth()).replace(/[^0-9]/g, ''), 10) || Math.max(420, window.innerWidth - 40);
        const reserved = (title.getBoundingClientRect ? Math.round(title.getBoundingClientRect().height) : 56) + 12;
        const availH = Math.max(320, window.innerHeight - reserved - 40);
        const gap = 8;
        const cardRatio = 3 / 2;
        let slotW = Math.floor((maxW - (cols - 1) * gap) / cols);
        slotW = Math.max(40, slotW);
        let slotH = Math.floor(slotW * cardRatio);
        let totalH = rows * slotH + (rows - 1) * gap;
        if (totalH > availH) {
          const scale = (availH / totalH) * 0.95;
          slotW = Math.max(36, Math.floor(slotW * scale));
          slotH = Math.max(52, Math.floor(slotW * cardRatio));
          totalH = rows * slotH + (rows - 1) * gap;
        }
        const scaledW = slotW;
        const scaledH = slotH;
        grid.style.gridTemplateColumns = `repeat(${cols}, ${scaledW}px)`;
        grid.style.gridAutoRows = `${scaledH}px`;
        grid.style.width = (scaledW * cols + (cols - 1) * gap) + 'px';
        stage.style.width = grid.style.width;
        stage.style.maxHeight = totalH + 'px';
        slots.forEach(s => { s.style.width = scaledW + 'px'; s.style.height = scaledH + 'px'; });

        // expose helpers for external code to place/clear cards
        currentSlots = slots;
        window.PopupAdapter = window.PopupAdapter || {};
        window.PopupAdapter.placeCardInSlot = function (index, src, alt) {
          if (!currentSlots) return false;
          const i = Number(index) || 0;
          if (i < 0 || i >= currentSlots.length) return false;
          const containerSlot = currentSlots[i];
          containerSlot.innerHTML = '';
          if (src) {
            const img = document.createElement('img');
            img.src = src;
            img.alt = alt || '';
            img.style.width = '95%';
            img.style.height = '95%';
            img.style.objectFit = 'cover';
            containerSlot.appendChild(img);
          }
          return true;
        };
        window.PopupAdapter.clearAllSlots = function () { if (!currentSlots) return; currentSlots.forEach(s => { s.innerHTML = ''; }); };
      } catch (e) {
        console && console.warn && console.warn('popup-adapter layout error', e);
      }
    }, 50);

  // restore body overflow when popups close (best-effort) - attach a global listener
  try {
    document.addEventListener('click', function (ev) {
      // if overlay is absent, restore overflowX
      try {
        if (!document.querySelector('.pa-deck-overlay-fallback')) {
          if (document.body && document.body.style) document.body.style.overflowX = '';
        }
      } catch (e) { console.warn('[PA]', e); }
    });
  } catch (e) { console.warn('[PA]', e); }

    return popupHandle;
  }

  // New: show full deck popup with 22 slots pre-filled with verso image
  function showDeckPopup(chosenCount, opts) {
    try {
      opts = opts || {};
      const total = 22;
      // build container ourselves so we can tightly control dimensions
  const container = document.createElement('div');
  container.className = 'pa-deck-container';
  try { container.dataset.maxWidth = '920px'; } catch (e) { console.warn('[PA]', e); }

      // dynamic title that shows remaining cards to draw
  const title = document.createElement('h3');
  title.className = 'pm-popup-title pa-deck-title';
      const initialRemaining = (Number(chosenCount) === 3 || Number(chosenCount) === 5) ? Number(chosenCount) : 0;
      let remaining = initialRemaining;
      const numSpan = document.createElement('span');
      numSpan.className = 'pa-remaining-num';
      numSpan.textContent = String(remaining);
      function updateTitle() {
        try {
          if (remaining > 0) {
            title.textContent = '';
            title.appendChild(document.createTextNode('Choisissez '));
            title.appendChild(numSpan);
            title.appendChild(document.createTextNode(remaining === 1 ? ' carte' : ' cartes'));
          } else {
            title.textContent = 'Tirage termin\u00e9';
          }
          try { numSpan.textContent = String(remaining); } catch (e) { console.warn('[PA]', e); }
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._remainingCount = remaining; } catch (e) { console.warn('[PA]', e); }
        } catch (e) { console.warn('[PA]', e); }
      }
      try {
        if (!document.getElementById('pa-remaining-styles')) {
          const st = document.createElement('style');
          st.id = 'pa-remaining-styles';
          st.textContent = '.pa-remaining-num { font-weight: 700; color: #c9a96e; margin: 0 4px; display: inline-block; transition: transform 220ms ease; } .pa-remaining-pulse { transform: scale(1.3); } @media (prefers-reduced-motion: reduce) { .pa-remaining-num, .pa-remaining-pulse { transition: none !important; transform: none !important; } }';
          (document.head || document.documentElement).appendChild(st);
        }
      } catch (e) { console.warn('[PA]', e); }
      // Subtitle hint
      const subtitle = document.createElement('p');
      subtitle.className = 'pa-deck-subtitle';
      subtitle.textContent = '\u00c9coutez votre intuition\u2026';
      updateTitle();
      container.appendChild(title);
      container.appendChild(subtitle);

  // Responsive grid: adapt columns to viewport
  const vw = window.innerWidth;
  const cols = vw <= 480 ? 5 : vw <= 768 ? 6 : 11;
  const rows = Math.ceil(total / cols);
  const gap = vw <= 480 ? 6 : 10;
  // Card size: fill available width nicely (420×630 = 2:3 ratio)
  const popupMaxW = Math.min(880, vw - 32);
  const cardW = Math.max(52, Math.floor((popupMaxW - (cols - 1) * gap) / cols));
  const cardH = Math.floor(cardW * 1.5);

  const grid = document.createElement('div');
  grid.className = 'pa-deck-grid';
  grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  grid.style.gap = gap + 'px';
  grid.style.maxWidth = (cols * cardW + (cols - 1) * gap + 8) + 'px';

      // entrance animation styles
      try {
        if (!document.getElementById('pa-deck-entrance-styles')) {
          const st = document.createElement('style');
          st.id = 'pa-deck-entrance-styles';
          st.textContent = '.pa-deck-entrance { opacity: 0; transform: translateY(12px) scale(0.88); transition: opacity 400ms ease, transform 400ms cubic-bezier(.2,.9,.3,1); } .pa-deck-entrance.pa-deck-entrance--visible { opacity: 1; transform: translateY(0) scale(1); } @media (prefers-reduced-motion: reduce) { .pa-deck-entrance { transition: none !important; opacity: 1 !important; transform: none !important; } }';
          (document.head || document.documentElement).appendChild(st);
        }
      } catch (e) { console.warn('[PA]', e); }

  const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fanEnabled = false;
  const fanAngles = [];

      for (let i = 0; i < total; i++) {
        const slot = document.createElement('div');
        slot.className = 'pa-deck-card';
        slot.dataset.slotIndex = i;

        // Center last row if incomplete
        const lastRowStart = cols * (rows - 1);
        const lastRowCount = total - lastRowStart;
        if (i === lastRowStart && lastRowCount < cols) {
          slot.style.gridColumnStart = String(Math.floor((cols - lastRowCount) / 2) + 1);
        }

        try {
          const img = document.createElement('img');
          img.src = '/img/majors/verso.webp?v=2';
          img.alt = 'Carte face cach\u00e9e';
          img.className = 'pa-deck-entrance';
          img.draggable = false;
          slot.appendChild(img);
        } catch (e) { console.warn('[PA]', e); }
        fanAngles.push({ index: i, angle: 0, tx: 0, ty: 0 });
        grid.appendChild(slot);
      }

  container.appendChild(grid);

  // compute desired popup frame dimensions
  const gridW = cols * cardW + (cols - 1) * gap;
  const gridH = rows * cardH + (rows - 1) * gap;
  const desiredWidth = Math.min(vw - 24, Math.max(gridW + 48, 420));
  const desiredHeight = Math.min(window.innerHeight - 60, gridH + 140);
  try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastDeckPopupSize = { width: Math.round(desiredWidth), height: Math.round(desiredHeight) }; } catch (e) { console.warn('[PA]', e); }
  try { container.style.width = desiredWidth + 'px'; } catch (e) { console.warn('[PA]', e); }

  const popupHandle = openPopup(container);
  try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastDeckPopupHandle = popupHandle; } catch (e) { console.warn('[PA]', e); }
  try { setGlobalNoScroll(true); } catch (e) { console.warn('[PA]', e); }
      // build a randomized mapping of the 22 major-arcana face images to the slots
      // so each time the deck popup opens the faces are shuffled and assigned
      const deckFaceNames = [
        '00-le-fou.webp','01-le-bateleur.webp','02-la-papesse.webp','03-limperatrice.webp','04-lempereur.webp','05-le-pape.webp',
        '06-lamoureux.webp','07-le-chariot.webp','08-la-force.webp','09-lermite.webp','10-la-roue-de-fortune.webp','11-la-justice.webp',
        '12-le-pendu.webp','13-larcane-sans-nom.webp','14-la-temperance.webp','15-le-diable.webp','16-la-maison-dieu.webp','17-letoile.webp',
        '18-la-lune.webp','19-le-soleil.webp','20-le-jugement.webp','21-le-monde.webp'
      ];
      // shuffle in-place
      function _shuffleArray(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
      const shuffledFaces = deckFaceNames.slice(); _shuffleArray(shuffledFaces);
      const deckMapping = new Array(total);
      for (let i = 0; i < total; i++) deckMapping[i] = '/img/majors/' + shuffledFaces[i % shuffledFaces.length] + '?v=2';

      // track selected cards in selection order so we can display them in the interpretation popup
      const selectedCards = [];

      // helper to open an interpretation popup showing the chosen cards and a placeholder interpretation frame
      function showInterpretationPopup(cards) {
        try {
          const interp = document.createElement('div');
          interp.className = 'pa-interp-container';
          try { interp.dataset.maxWidth = '960px'; } catch (e) { console.warn('[PA]', e); }
          const h = document.createElement('h3'); h.className = 'pm-popup-title pa-interp-title'; h.textContent = 'Interpr\u00e9tation du tirage';
          interp.appendChild(h);

          // Placeholder interpretation frame
          const frame = document.createElement('div');
          frame.className = 'pa-interp-frame';
          try { frame.id = 'pa-last-interpretation-frame'; } catch (e) { console.warn('[PA]', e); }
          frame.textContent = 'Interpr\u00e9tation en cours\u2026';
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastInterpFrame = frame; } catch (e) { console.warn('[PA]', e); }

          // We'll place the chosen cards at the top, then the interpretation frame and buttons below.
          // action buttons (Tirage / Enregistrer / Retour) and audio control will be placed under the frame.
          const btnRow = document.createElement('div');
          btnRow.className = 'pa-interp-actions';

          const btnTirage = document.createElement('button'); btnTirage.textContent = '\u2726 Nouveau tirage';
          const btnSave = document.createElement('button'); btnSave.textContent = '\u2709 Recevoir par email';
          const btnBack = document.createElement('button'); btnBack.textContent = 'Fermer';
          try { btnTirage.className = 'pa-action-btn primary'; } catch (e) { console.warn('[PA]', e); }
          try { btnSave.className = 'pa-action-btn'; } catch (e) { console.warn('[PA]', e); }
          try { btnBack.className = 'pa-action-btn'; } catch (e) { console.warn('[PA]', e); }

          // add a single audio icon button to control TTS (placed to the right)
          const audioBtn = document.createElement('button');
          audioBtn.title = 'Lire / Couper le son';
          audioBtn.className = 'pa-action-btn audio';
          // insert inline SVG icon (speaker)
          audioBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19 8a5 5 0 0 1 0 8"></path></svg>';
          // start disabled until the interpretation is ready
          audioBtn.disabled = true;

          // We'll append the buttons after the frame is created/filled below

          // wiring: when interpretation content is rendered, the renderInterpretationInto
          // function returns controls which we attach here to toggle audio.
          let _interpControls = null;
          // helper to stop any playing audio/TTS immediately and update UI
          function stopPlayback() {
            try {
              try { if (_interpControls && typeof _interpControls.stop === 'function') { try { _interpControls.stop(); } catch (e) { console.warn('[PA]', e); } } } catch (e) { console.warn('[PA]', e); }
              try { if (typeof speechSynthesis !== 'undefined' && speechSynthesis && speechSynthesis.speaking) { try { speechSynthesis.cancel(); } catch (e) { console.warn('[PA]', e); } } } catch (e) { console.warn('[PA]', e); }
              try { setAudioIcon(false); if (audioBtn) { audioBtn.disabled = true; } } catch (e) { console.warn('[PA]', e); }
            } catch (e) { console.warn('[PA]', e); }
          }
          // helper to update button icon
          function setAudioIcon(isPlaying) {
            try {
              if (!audioBtn) return;
              if (isPlaying) {
                audioBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5h3v14H6z"></path><path d="M15 5h3v14h-3z"></path></svg>';
              } else {
                audioBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19 8a5 5 0 0 1 0 8"></path></svg>';
              }
            } catch (e) { console.warn('[PA]', e); }
          }
          // click toggles play/stop
          audioBtn.addEventListener('click', function(){
            try {
              if (!audioBtn || audioBtn.disabled) return;
              if (_interpControls) {
                try {
                  // if TTS is ongoing, stop; otherwise start
                  if (typeof _interpControls.isPlaying === 'function' ? _interpControls.isPlaying() : false) {
                    try { _interpControls.stop(); setAudioIcon(false); } catch (e) { setAudioIcon(false); }
                  } else {
                    try { _interpControls.play(1.0); setAudioIcon(true); } catch (e) { setAudioIcon(false); }
                  }
                } catch (e) { console && console.warn && console.warn('audio toggle failed', e); }
              }
            } catch (e) { console.warn('[PA]', e); }
          });

          // Show the selected cards in a compact horizontal row
          const chosenWrap = document.createElement('div');
          chosenWrap.className = 'pa-interp-cards';
          chosenWrap.style.opacity = '0';
          chosenWrap.style.transition = 'opacity 1.2s ease';
          cards.forEach((c, idx) => {
            try {
              const cardBox = document.createElement('div');
              cardBox.className = 'pa-interp-card';
              const im = document.createElement('img');
              im.src = c.src || c;
              im.alt = c.alt || ('carte-' + (c.index != null ? c.index : idx));
              im.draggable = false;
              if (c.reversed) im.style.transform = 'rotate(180deg)';
              cardBox.appendChild(im);
              // Click to zoom card (fixed clone so it escapes overflow:hidden parents)
              cardBox.addEventListener('click', function (ev) {
                ev.stopPropagation();
                // close any existing zoom
                try { var oldC = document.querySelector('.pa-card-zoom-clone'); if (oldC && oldC.parentNode) oldC.parentNode.removeChild(oldC); } catch (e) {}
                try { var oldB = document.querySelector('.pa-card-zoom-backdrop'); if (oldB && oldB.parentNode) oldB.parentNode.removeChild(oldB); } catch (e) {}
                // create backdrop
                var zoomBd = document.createElement('div');
                zoomBd.className = 'pa-card-zoom-backdrop';
                // create clone image
                var clone = document.createElement('img');
                clone.className = 'pa-card-zoom-clone';
                clone.src = im.src;
                clone.alt = im.alt;
                clone.draggable = false;
                if (c.reversed) clone.style.transform = 'translate(-50%,-50%) rotate(180deg)';
                // close on click
                function closeZoom() {
                  try { if (clone.parentNode) clone.parentNode.removeChild(clone); } catch (e) {}
                  try { if (zoomBd.parentNode) zoomBd.parentNode.removeChild(zoomBd); } catch (e) {}
                }
                zoomBd.addEventListener('click', closeZoom);
                clone.addEventListener('click', closeZoom);
                try { document.body.appendChild(zoomBd); document.body.appendChild(clone); } catch (e) {}
              });
              // Extract card name from filename for label
              try {
                const fname = (c.src || String(c)).split('/').pop().split('?')[0].replace(/\.(webp|png|jpg|jpeg)$/i, '').replace(/^\d+-/, '').replace(/-/g, ' ');
                const label = document.createElement('span');
                label.className = 'pa-interp-card-label';
                label.textContent = fname.charAt(0).toUpperCase() + fname.slice(1) + (c.reversed ? ' (Invers\u00e9e)' : '');
                cardBox.appendChild(label);
              } catch (e) { console.warn('[PA]', e); }
              chosenWrap.appendChild(cardBox);
            } catch (e) { console.warn('[PA]', e); }
          });
          interp.appendChild(chosenWrap);
          interp.appendChild(frame);

          // fetch and render interpretation from configured API (Cloudflare Workers)
          try {
            // ensure global API base is available for configuration
            window.PopupAdapter = window.PopupAdapter || {};
            // In dev (localhost), use relative paths (Vite proxy). In prod, use Cloudflare Worker directly.
            const _workerBase = 'https://api-opanoma.csebille.workers.dev';
            const _isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            const defaultApi = _isLocal ? '/api/open-proxy' : _workerBase + '/api/open-proxy';
            const apiBase = (window.PopupAdapter.apiBase && String(window.PopupAdapter.apiBase).trim()) ? String(window.PopupAdapter.apiBase).trim() : defaultApi;

            // payload expected by the worker: { cartes: [...], theme: '', question: '' }
            const payload = {
              cartes: cards.map(c => {
                const name = (c && c.src) ? c.src.split('/').pop() : (typeof c === 'string' ? c.split('/').pop() : c.name || c.id || c);
                return (c && c.reversed) ? name + ' (invers\u00e9e)' : name;
              }),
              theme: (window.PopupAdapter && window.PopupAdapter.currentTheme) ? window.PopupAdapter.currentTheme : '',
              question: (window.PopupAdapter && window.PopupAdapter.currentQuestion) ? window.PopupAdapter.currentQuestion : ''
            };

            // create a content container inside the frame for scrollable results
            const content = document.createElement('div');
            content.id = 'ia-interpretation-content';
            content.style.padding = '6px';
            content.style.boxSizing = 'border-box';
            content.style.textAlign = 'left';
            // Show a visible loading indicator
            content.innerHTML = '<div class="pa-interpretation-loader"><div class="pa-loader-spinner"></div><p class="pa-loader-text">Consultation des arcanes\u2026</p></div>';
            // clear previous simple text and append content
            frame.textContent = '';
            frame.appendChild(content);
            // append control buttons below the frame
            interp.appendChild(btnRow);
            btnRow.appendChild(btnTirage); btnRow.appendChild(btnSave); btnRow.appendChild(btnBack);
            btnRow.appendChild(audioBtn);

            // inject small stylesheet for interpretation frame (once)
            try {
              if (!document.getElementById('pa-interpretation-styles')) {
                const st = document.createElement('style');
                st.id = 'pa-interpretation-styles';
                st.textContent = `
                  #ia-interpretation-content { font-family: 'Quicksand', 'Inter', Arial, sans-serif; color: #ede8e3; font-size: 14px; line-height: 1.65; padding: 8px; }
                  #ia-interpretation-content p { margin: 0 0 0.8em 0; }
                  .pa-interpretation-viewport { overflow-y: auto; position: relative; }
                  #ia-interpretation-content { overflow: visible !important; }
                  
                  .pa-interpretation-viewport::-webkit-scrollbar { width: 5px !important; display: block !important; }
                  .pa-interpretation-viewport::-webkit-scrollbar-track { background: transparent; }
                  .pa-interpretation-viewport::-webkit-scrollbar-thumb { background: rgba(201,169,110,.25); border-radius: 4px; }
                  #ia-interpretation-content::-webkit-scrollbar { display: none !important; width: 0 !important; }
                  .pa-interpret-line { transition: transform 260ms ease, opacity 220ms ease; white-space: pre-wrap; color: rgba(237,232,227,.88); }
                  .pa-interpretation-skeleton { background: linear-gradient(90deg, rgba(201,169,110,.06), rgba(201,169,110,.12), rgba(201,169,110,.06)); height:14px; border-radius:6px; margin-bottom:8px; background-size:400px 100%; animation: pa-skel 1.4s linear infinite }
                  @keyframes pa-skel { 0% { background-position: -200px 0 } 100% { background-position: 200px 0 } }
                  .pa-interpretation-fadein { animation: pa-fade-in 320ms ease both }
                  @keyframes pa-fade-in { from { opacity: 0; transform: translateY(6px) } to { opacity:1; transform:none } }
                `;
                (document.head || document.documentElement).appendChild(st);
              }
              // overlay styles (ensure present alongside interpretation styles)
              if (!document.getElementById('pa-interpretation-overlay-styles')) {
                const ov = document.createElement('style');
                ov.id = 'pa-interpretation-overlay-styles';
                ov.textContent = `
                  .pa-interpretation-overlay { pointer-events: auto; }
                  .pa-interpretation-overlay::backdrop { background: rgba(0,0,0,0.35); }
                `;
                (document.head || document.documentElement).appendChild(ov);
              }
            } catch (e) { console.warn('[PA]', e); }

            // helper to render interpretation text/html into the content area
            function renderInterpretationInto(el, data, opts) {
              try {
                // NOTE: toolbar buttons removed per UX request. We provide programmatic TTS controls
                // returned from this function. The UI button will be placed next to Tirage/Enregistrer/Retour.

                // content body
                const body = document.createElement('div');
                body.style.opacity = '0';
                body.className = 'pa-interpretation-fadein';

                // helper to safely set text as paragraphs (used for reduced-motion fallback)
                function setTextAsParagraphs(target, txt) {
                  const parts = String(txt || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
                  target.innerHTML = '';
                  parts.forEach(p => {
                    const pEl = document.createElement('p');
                    pEl.innerHTML = p.replace(/\n/g, '<br>');
                    target.appendChild(pEl);
                  });
                  if (!parts.length) target.textContent = String(txt || '');
                }

                // put body into the element (clear first)
                el.innerHTML = '';
                el.appendChild(body);

                // create a fixed viewport for typed content so we can control overflow
                const viewport = document.createElement('div');
                viewport.className = 'pa-interpretation-viewport';
                viewport.style.overflowY = 'auto';
                try { viewport.style.maxHeight = 'none'; } catch (e) { console.warn('[PA]', e); }
                try {
                  viewport.style.height = 'auto';
                  viewport.style.minHeight = '0';
                } catch (e) { console.warn('[PA]', e); }
                viewport.style.position = 'relative';
                viewport.style.boxSizing = 'border-box';

                // inner queue will hold lines stacked vertically; start from top
                const queue = document.createElement('div');
                queue.style.display = 'flex';
                queue.style.flexDirection = 'column';
                queue.style.justifyContent = 'flex-start';
                queue.style.width = '100%';
                queue.style.boxSizing = 'border-box';
                queue.style.gap = '6px';
                queue.style.willChange = 'transform';

                viewport.appendChild(queue);
                // attach body + viewport to element
                el.innerHTML = '';
                el.appendChild(body);
                el.appendChild(viewport);

                // fade in effect for the body/viewport
                setTimeout(() => { try { viewport.style.opacity = '1'; } catch (e) { console.warn('[PA]', e); } }, 20);

                // debug: log viewport size at open for easier troubleshooting
                try { const rect = viewport.getBoundingClientRect(); console && console.log && console.log('[PopupAdapter] interp viewport rect', rect); } catch (e) { console.warn('[PA]', e); }

                // speech / TTS wiring (OpenAI TTS via /api/tts, fallback to speechSynthesis)
                let _audioEl = null; // <audio> element for OpenAI TTS
                let _audioBlobUrl = null;
                let utter = null; // fallback speechSynthesis
                let _ttsPlaying = false;

                function stopSpeak() {
                  try {
                    _ttsPlaying = false;
                    if (_audioEl) { try { _audioEl.pause(); _audioEl.currentTime = 0; } catch (e) { console.warn('[PA]', e); } }
                    if (utter) { try { speechSynthesis.cancel(); } catch (e) { console.warn('[PA]', e); } utter = null; }
                  } catch (e) { console.warn('[PA]', e); }
                }

                function isTTSPlaying() {
                  if (_audioEl && !_audioEl.paused && !_audioEl.ended) return true;
                  if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) return true;
                  return _ttsPlaying;
                }

                // fetch OpenAI TTS audio, returns blob URL. Caches result.
                async function fetchTTSAudio(text) {
                  if (_audioBlobUrl) return _audioBlobUrl;
                  const ttsUrl = _isLocal ? '/api/tts' : _workerBase + '/api/tts';
                  const resp = await fetch(ttsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, voice: 'nova', speed: 0.85 }),
                  });
                  if (!resp.ok) throw new Error('TTS API ' + resp.status);
                  const blob = await resp.blob();
                  _audioBlobUrl = URL.createObjectURL(blob);
                  return _audioBlobUrl;
                }

                function playSpeak(text, rate) {
                  try {
                    stopSpeak();
                    const txt = String(text || (queue.innerText || queue.textContent || '') || '').trim();
                    if (!txt) return false;
                    _ttsPlaying = true;

                    // Try OpenAI TTS first, fall back to speechSynthesis
                    fetchTTSAudio(txt).then(function(blobUrl) {
                      if (!_ttsPlaying) return; // cancelled while fetching
                      if (!_audioEl) {
                        _audioEl = new Audio();
                      }
                      _audioEl.src = blobUrl;
                      _audioEl.playbackRate = Number(rate || 1.0) || 1.0;

                      // sync credits with actual audio duration once metadata loads
                      _audioEl.onloadedmetadata = function() {
                        try {
                          const realDuration = _audioEl.duration; // seconds
                          if (realDuration && realDuration > 0) {
                            const existingLines = Array.prototype.slice.call(queue.children || []).map(function(c) { return c.innerText || c.textContent || ''; });
                            if (existingLines.length) {
                              startCreditsMode(existingLines, null, realDuration / (_audioEl.playbackRate || 1));
                            }
                          }
                        } catch (e) { console.warn('[PA]', e); }
                      };
                      _audioEl.onended = function() {
                        _ttsPlaying = false;
                        try { setAudioIcon(false); } catch (e) { console.warn('[PA]', e); }
                      };
                      _audioEl.play().catch(function(e) { console.warn('[PA] audio play blocked', e); });
                    }).catch(function(e) {
                      // fallback to speechSynthesis
                      console.warn('[PA] OpenAI TTS failed, fallback to speechSynthesis', e);
                      try {
                        utter = new SpeechSynthesisUtterance(txt);
                        utter.lang = 'fr-FR';
                        utter.rate = Number(rate || 1.25) || 1.25;
                        utter.onend = function() {
                          _ttsPlaying = false;
                          try { setAudioIcon(false); } catch (e) { console.warn('[PA]', e); }
                        };
                        speechSynthesis.speak(utter);
                        // estimate duration for credits sync (fallback)
                        var words = txt.split(/\s+/).filter(Boolean).length;
                        var estSec = Math.max(15, (words / (140 * (utter.rate || 1.25))) * 60);
                        var existingLines = Array.prototype.slice.call(queue.children || []).map(function(c) { return c.innerText || c.textContent || ''; });
                        if (existingLines.length) { startCreditsMode(existingLines, null, estSec); }
                      } catch (fe) { console.warn('[PA] speechSynthesis fallback failed', fe); _ttsPlaying = false; }
                    });
                    return true;
                  } catch (e) { console && console.warn && console.warn('TTS play failed', e); _ttsPlaying = false; return false; }
                }

                // Credits mode state
                let _creditsRunning = false;
                let _creditsCancel = null;

                // Typing implementation: append lines at the bottom, remove top lines when overflow
                let _typingCancelled = false;
                function stopTyping() { _typingCancelled = true; }

                const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                // accumulated removed height so transforms are continuous
                let _removedHeight = 0;

                // helper to perform a smooth upward scroll of the queue by 'shift' px
                // This creates a movie-credits effect: the whole queue translates up, then
                // we remove the top child and reset transform to keep visual continuity.
                function animateScrollUp(shift) {
                  return new Promise(resolve => {
                    try {
                      if (!shift || shift <= 0) return resolve();
                      // ensure no concurrent transition
                      queue.style.transition = 'transform 700ms linear';
                      // animate from current removedHeight to removedHeight + shift
                      queue.style.transform = `translateY(-${_removedHeight + shift}px)`;
                      let done = false;
                      const onEnd = () => {
                        if (done) return; done = true;
                        try {
                          // remove the top child and update removedHeight; keep transform equal to -_removedHeight
                          const first = queue.firstElementChild;
                          if (first && first.parentNode) first.parentNode.removeChild(first);
                          _removedHeight += shift;
                          // clear transition so subsequent updates are immediate
                          queue.style.transition = '';
                          // leave queue.style.transform as translateY(-_removedHeight) to preserve continuity
                        } catch (e) { console.warn('[PA]', e); }
                        try { queue.removeEventListener('transitionend', onEnd); } catch (e) { console.warn('[PA]', e); }
                        resolve();
                      };
                      queue.addEventListener('transitionend', onEnd);
                      // fallback guard
                      setTimeout(onEnd, 900);
                    } catch (e) { resolve(); }
                  });
                }

                // Immediately populate all lines and start credits-mode (no typewriter)
                (function() {
                  try {
                    // resolve text source depending on type
                    let rawText = '';
                    if (opts && opts.type === 'html') {
                      // render HTML first, then derive raw text from its textContent so we can split into paragraphs
                      queue.innerHTML = data || '';
                      rawText = (queue && (queue.innerText || queue.textContent)) ? (queue.innerText || queue.textContent) : String(data || '');
                    } else if (opts && opts.type === 'json') {
                      if (data && data.html) { queue.innerHTML = data.html; rawText = (queue && (queue.innerText || queue.textContent)) ? (queue.innerText || queue.textContent) : String(data.html || ''); }
                      else if (data && data.result) rawText = String(data.result || '');
                      else rawText = JSON.stringify(data, null, 2);
                    } else {
                      rawText = String(data || '');
                    }

                    // sanitize text: remove leading header like "Interprétation des cartes :" and problematic glyphs
                    function sanitizeTextForDisplay(t) {
                      if (!t) return '';
                      // remove header variants (case-insensitive)
                      t = t.replace(/^\s*Interpr[eé]tation des cartes\s*[:\-–—]*\s*/i, '');
                      // remove markdown-like leading markers and bullets on lines
                      t = t.replace(/^[ \t]*([\-*•·\u2022]+)[ \t]*/mg, '');
                      t = t.replace(/^[ \t]*([#>~=\-]{1,3})[ \t]*/mg, '');
                      // remove leading numeric enumerations like '1.', '1)', '1 -', or '01.'
                      t = t.replace(/^[ \t]*\d+(?:[\.\)\-]|\s+-)\s*/mg, '');
                      // remove nested dot enumerations like '1.2.3' appearing at start or inline
                      t = t.replace(/\b\d+(?:\.\d+){1,}\b/g, '');
                      // remove parenthetical numeric suffixes like ' (00)' or ' (1)'
                      t = t.replace(/\s*\(\s*\d{1,3}\s*\)\s*/g, '');
                      // remove common decorative glyphs
                      t = t.replace(/[\*`•·▪■►◄●★☆✓✔‣›‹»«…·°°•◆◆●]/g, '');
                      // remove other brackets and control chars
                      t = t.replace(/[\[\]\{\}\<\>\|\\]/g, '');
                      // remove control characters except newlines
                      t = t.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]+/g, '');
                      // replace sequences of punctuation like '---' or '***' by a single separator (space)
                      t = t.replace(/[-*_]{2,}/g, ' ');
                      // collapse multiple spaces
                      t = t.replace(/[ \t]{2,}/g, ' ');
                      // collapse multiple blank lines to a single blank line
                      t = t.replace(/(?:\r?\n){3,}/g, '\n\n');
                      // trim
                      return t.trim();
                    }

                    // split into paragraphs (blank-line separated) to preserve paragraph breaks
                    const paragraphs = sanitizeTextForDisplay(rawText).split(/\r?\n\s*\r?\n/).map(s => s.replace(/^\s+|\s+$/g, '')).filter(Boolean);

                    // reduced-motion: inject paragraphs and allow user scrolling
                    if (prefersReduced) {
                      queue.innerHTML = '';
                      paragraphs.forEach(p => {
                        const clean = sanitizeTextForDisplay(p);
                        const pEl = document.createElement('div'); pEl.className = 'pa-interpret-line'; pEl.style.margin = '0'; pEl.style.whiteSpace = 'pre-wrap';
                        pEl.textContent = clean || '\u00A0';
                        queue.appendChild(pEl);
                      });
                      // allow scroll within viewport (no credits animation)
                      viewport.style.overflowY = 'auto';
                      viewport.style.scrollbarWidth = 'thin';
                      viewport.style.scrollbarColor = 'rgba(201,169,110,.25) transparent';
                      return;
                    }

                    // Normal: render all paragraphs and auto-scroll from bottom of frame
                    queue.innerHTML = '';
                    paragraphs.forEach(p => {
                      const clean = sanitizeTextForDisplay(p);
                      const pEl = document.createElement('div'); pEl.className = 'pa-interpret-line'; pEl.style.margin = '0'; pEl.style.whiteSpace = 'pre-wrap';
                      pEl.textContent = clean || '\u00A0';
                      queue.appendChild(pEl);
                    });
                    // start auto-scroll: text begins at bottom of frame and scrolls up
                    try {
                      viewport.style.overflowY = 'hidden';
                      void queue.offsetHeight;
                      var frameH = (el.closest('.pa-interp-frame') || el.parentElement || viewport).clientHeight || 280;
                      var queueH = queue.scrollHeight || queue.offsetHeight || 300;
                      // position text just below visible area
                      queue.style.transition = 'none';
                      queue.style.transform = 'translateY(' + frameH + 'px)';
                      void queue.offsetHeight;
                      // scroll duration: ~12px/s (slow reading speed)
                      var totalDist = frameH + queueH;
                      var durationMs = Math.max(10000, Math.round((totalDist / 12) * 1000));
                      queue.style.transition = 'transform ' + durationMs + 'ms linear';
                      queue.style.transform = 'translateY(-' + queueH + 'px)';
                      // when done, reset and allow manual scroll
                      var _scrollDone = function() {
                        queue.style.transition = 'none';
                        queue.style.transform = 'none';
                        viewport.style.overflowY = 'auto';
                        viewport.style.scrollbarWidth = 'thin';
                        viewport.style.scrollbarColor = 'rgba(201,169,110,.25) transparent';
                      };
                      queue.addEventListener('transitionend', _scrollDone, { once: true });
                      setTimeout(function() { _scrollDone(); }, durationMs + 500);
                    } catch(e) { console.warn('[PA]', e); }
                  } catch (e) { console && console.warn && console.warn('[PopupAdapter] credits render error', e); }
                })();

                // Credits-mode animator: render all lines and smoothly scroll them upward like film credits
                // durationOverrideSec: if provided, ignore speedPxPerSec and use this total duration
                function startCreditsMode(lines, speedPxPerSec, durationOverrideSec) {
                  try {
                    stopCreditsMode();
                    _creditsRunning = true;
                    _creditsCancel = null;
                    queue.innerHTML = '';
                    viewport.style.overflowY = 'hidden';
                    // fill queue with paragraph elements (use textContent to avoid HTML injection)
                    lines.forEach(l => {
                      const lineEl = document.createElement('div');
                      lineEl.className = 'pa-interpret-line';
                      lineEl.style.margin = '0';
                      lineEl.style.whiteSpace = 'pre-wrap';
                      lineEl.textContent = String(l || '\u00A0');
                      queue.appendChild(lineEl);
                    });
                    // compute total distance to scroll: queueHeight + viewportHeight
                    // ensure layout updated
                    void queue.offsetHeight;
                    const qh = queue.scrollHeight || queue.offsetHeight || 0;
                    const vh = viewport.clientHeight || 320;
                    const totalDistance = qh + vh;
                    let durationMs;
                    if (durationOverrideSec && durationOverrideSec > 0) {
                      // match scroll to TTS duration (add 20% buffer so text doesn't outrun voice)
                      durationMs = Math.max(800, Math.round(durationOverrideSec * 1000 * 1.20));
                    } else {
                      const speed = Math.max(10, Number(speedPxPerSec) || 30); // px per second
                      durationMs = Math.max(800, Math.round((totalDistance / speed) * 1000));
                    }

                    // start with queue positioned below viewport (translateY = viewportHeight)
                    queue.style.transition = '';
                    queue.style.transform = `translateY(${vh}px)`;
                    // force reflow
                    void queue.offsetHeight;
                    // then animate to -qh over duration
                    queue.style.transition = `transform ${durationMs}ms linear`;
                    queue.style.transform = `translateY(-${qh}px)`;

                    const onEnd = () => {
                      try {
                        _creditsRunning = false; _creditsCancel = null;
                        queue.style.transition = '';
                        queue.style.transform = '';
                        // switch viewport to scrollable after credits finish
                        viewport.style.overflowY = 'auto';
                        viewport.style.scrollbarWidth = 'thin';
                        viewport.style.scrollbarColor = 'rgba(201,169,110,.25) transparent';
                      } catch (e) { console.warn('[PA]', e); }
                    };
                    const onEndHandler = () => { onEnd(); queue.removeEventListener('transitionend', onEndHandler); };
                    queue.addEventListener('transitionend', onEndHandler);
                    // cancel function
                    _creditsCancel = () => {
                      try {
                        queue.style.transition = ''; queue.style.transform = ''; _creditsRunning = false; _creditsCancel = null;
                        viewport.style.overflowY = 'auto';
                        viewport.style.scrollbarWidth = 'thin';
                        viewport.style.scrollbarColor = 'rgba(201,169,110,.25) transparent';
                      } catch (e) { console.warn('[PA]', e); }
                    };
                    // fallback guard
                    setTimeout(() => { if (_creditsRunning) onEnd(); }, durationMs + 300);
                  } catch (e) { console && console.warn && console.warn('startCreditsMode failed', e); }
                }

                function stopCreditsMode() { try { if (_creditsCancel) { _creditsCancel(); } _creditsRunning = false; _creditsCancel = null; } catch (e) { console.warn('[PA]', e); } }

                // provide a programmatic credits trigger (no UI button)
                function triggerCredits() {
                  try {
                    // collect last rendered text or request the API result body
                    let existingLines = Array.prototype.slice.call(queue.children || []).map(c => c.innerText || c.textContent || '');
                    if (!existingLines || !existingLines.length) {
                      try {
                        const raw = (typeof rawText !== 'undefined') ? rawText : (opts && opts.type === 'json' && data && data.result ? String(data.result || '') : String(data || ''));
                        existingLines = (raw || '').split(/\r?\n/).map(s => s.replace(/^\s+|\s+$/g, ''));
                      } catch (e) { existingLines = [String(data || '')]; }
                    }
                    startCreditsMode(existingLines, 28);
                  } catch (e) { console && console.warn && console.warn('credits trigger error', e); }
                }

                // return programmatic controls for external UI wiring
                return { play: (rate) => playSpeak(null, rate), stop: stopSpeak, isPlaying: isTTSPlaying, stopTyping, credits: triggerCredits };
              } catch (e) { try { el.textContent = (typeof data === 'string') ? data : JSON.stringify(data); } catch (er) {} }
            }

            // call the API with POST JSON, but use a retry wrapper and provide a retry button on failure
            (async () => {
              // helper: fetch with attempts + timeout
              async function fetchWithRetries(url, options, attempts = 3, baseDelay = 700, timeoutMs = 60000) {
                let lastErr = null;
                for (let i = 0; i < attempts; i++) {
                  try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), timeoutMs);
                    const resp = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
                    clearTimeout(id);
                    return resp;
                  } catch (e) {
                    lastErr = e;
                    // if aborted due to timeout or network, wait then retry (unless last attempt)
                    if (i < attempts - 1) await new Promise(r => setTimeout(r, baseDelay * (i + 1)));
                  }
                }
                throw lastErr;
              }

              // main request runner with UI hooks so we can retry on user click
              async function doRequest() {
                try {
                  // show loading message while waiting
                  content.innerHTML = '';
                  const loader = document.createElement('div'); loader.className = 'pa-interpretation-loader';
                  loader.innerHTML = '<div class="pa-loader-spinner"></div><p class="pa-loader-text">Les astres alignent votre tirage…</p>';
                  content.appendChild(loader);
                  // run fetch with retries
                  const resp = await fetchWithRetries(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 3, 700, 60000);
                  if (!resp || !resp.ok) {
                    const txt = await (resp ? resp.text().catch(()=>resp.statusText||String(resp.status)) : Promise.resolve('No response'));
                    const isTimeout = txt.indexOf('TimeoutError') !== -1 || txt.indexOf('timeout') !== -1 || txt.indexOf('aborted') !== -1;
                    showError(isTimeout ? 'Le serveur met trop de temps à répondre. Réessayez dans quelques instants.' : 'Erreur API: ' + txt);
                    console.warn('[PopupAdapter] Interpretation API error', resp && resp.status, txt);
                    return;
                  }
                  const ctype = (resp.headers.get('content-type') || '').toLowerCase();
                  if (ctype.indexOf('text/html') !== -1) {
                    const html = await resp.text();
                    try {
                      const ctr = renderInterpretationInto(content, html, { type: 'html' });
                      if (ctr && typeof ctr.play === 'function') { _interpControls = ctr; audioBtn.disabled = false; setAudioIcon(false); }
                    } catch (e) { content.innerHTML = html; }
                  } else if (ctype.indexOf('application/json') !== -1) {
                    const j = await resp.json();
                    try {
                      const ctr = renderInterpretationInto(content, j, { type: 'json' });
                      if (ctr && typeof ctr.play === 'function') { _interpControls = ctr; audioBtn.disabled = false; setAudioIcon(false); }
                    } catch (e) { content.textContent = typeof j === 'string' ? j : JSON.stringify(j, null, 2); }
                  } else {
                    const txt = await resp.text();
                    try {
                      const ctr = renderInterpretationInto(content, txt, { type: 'text' });
                      if (ctr && typeof ctr.play === 'function') { _interpControls = ctr; audioBtn.disabled = false; setAudioIcon(false); }
                    } catch (e) { content.textContent = txt; }
                  }
                  // Fade out carto video and fade in cards when interpretation is ready
                  try {
                    if (window.PopupAdapter._cartoVideo) {
                      window.PopupAdapter._cartoVideo.style.opacity = '0';
                    }
                  } catch (_ve) {}
                  try { chosenWrap.style.opacity = '1'; } catch (_cw) {}
                  // Log tirage to admin API (fire-and-forget)
                  try {
                    const _logUrl = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                      ? 'https://opanoma.fr/api/admin.php?action=tirage-log'
                      : '/api/admin.php?action=tirage-log';
                    fetch(_logUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
                  } catch (_le) {}
                } catch (err) {
                  // network/abort error
                  const msg = (err && err.name === 'AbortError') ? 'Temps d\'attente épuisé' : (err && err.message) ? err.message : 'Erreur réseau lors de la récupération de l\'interprétation.';
                  showError('Erreur API: ' + msg, err);
                }
              }

              function showError(msg, err) {
                try {
                  content.innerHTML = '';
                  const em = document.createElement('div'); em.style.padding = '8px'; em.style.color = '#b00'; em.textContent = msg;
                  const detail = document.createElement('div'); detail.style.fontSize = '12px'; detail.style.color = '#666'; detail.style.marginTop = '6px'; detail.textContent = (err && err.toString()) || '';
                  content.appendChild(em); content.appendChild(detail);
                  const retry = document.createElement('button'); retry.textContent = 'Réessayer'; retry.style.marginTop = '8px'; retry.className = 'pa-interpretation-btn';
                  retry.addEventListener('click', function(){ try { doRequest(); } catch (e) { console.warn('[PA]', e); } });
                  content.appendChild(retry);
                } catch (e) { try { content.textContent = msg; } catch (ee) {} }
                console.error('[PopupAdapter] fetchInterpretation failed', err || msg);
              }

              // respect offline mode quickly
              if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                showError('Vous êtes hors-ligne. Vérifiez votre connexion et réessayez.');
                return;
              }

              // launch initial request
              doRequest();
            })();
          } catch (e) {
            console.warn('[PopupAdapter] Could not launch interpretation fetch', e);
          }

          // wire button behaviors
          btnTirage.addEventListener('click', function () {
            try {
              // stop audio before leaving
              try { stopPlayback(); } catch (e) { console.warn('[PA]', e); }
              // reopen a new deck with the same initial chosen count (if available)
              try { if (typeof showDeckPopup === 'function') showDeckPopup(initialRemaining || 3, { fan: true }); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(initialRemaining || 3, { fan: true }); } catch (e) { console.warn('[PA]', e); }
            } catch (e) { console.warn('[PA]', e); }
          });
          // Ensure the Back button removes our overlay (if we used it) and stops audio
          btnBack.addEventListener('click', function () {
            try {
              // ensure playback is stopped as soon as the popup is dismissed
              try { stopPlayback(); } catch (e) { console.warn('[PA]', e); }
              // close/hide this interpretation popup; best-effort removal
              try {
                const overlay = interp.closest('.pa-interpretation-overlay');
                const backdrop = document.querySelector && document.querySelector('.pa-interpretation-backdrop');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                else if (interp && interp.parentNode) interp.parentNode.removeChild(interp);
                try { setGlobalNoScroll(false); try { document.body.style.overflowX = ''; } catch (e) { console.warn('[PA]', e); } } catch (e) { console.warn('[PA]', e); }
              } catch (e) { console.warn('[PA]', e); }
            } catch (e) { console.warn('[PA]', e); }
          });

          btnSave.addEventListener('click', function () {
            try {
              // Show email input prompt
              var existing = document.getElementById('pa-email-overlay');
              if (existing) existing.remove();

              var overlay = document.createElement('div');
              overlay.id = 'pa-email-overlay';
              overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:2147483647;display:flex;align-items:center;justify-content:center;';

              var box = document.createElement('div');
              box.style.cssText = 'background:#1a1614;border:1px solid rgba(201,169,110,.3);border-radius:12px;padding:28px;max-width:380px;width:90%;text-align:center;font-family:Quicksand,Inter,sans-serif;';
              box.innerHTML = '<div style="font-family:Cinzel,serif;font-size:18px;color:#c9a96e;margin-bottom:12px;">Recevoir par email</div>' +
                '<p style="color:rgba(237,232,227,.7);font-size:14px;margin:0 0 16px;">Entrez votre adresse email pour recevoir votre tirage complet.</p>' +
                '<input id="pa-email-input" type="email" placeholder="votre@email.com" style="width:100%;padding:12px;border-radius:8px;border:1px solid rgba(201,169,110,.3);background:rgba(255,255,255,.08);color:#ede8e3;font-size:15px;box-sizing:border-box;outline:none;margin-bottom:12px;" />' +
                '<div style="display:flex;gap:10px;justify-content:center;">' +
                '<button id="pa-email-send" style="padding:10px 24px;background:#c9a96e;color:#110e0c;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Envoyer</button>' +
                '<button id="pa-email-cancel" style="padding:10px 24px;background:transparent;color:#c9a96e;border:1px solid rgba(201,169,110,.3);border-radius:8px;cursor:pointer;font-size:14px;">Annuler</button>' +
                '</div>' +
                '<div id="pa-email-status" style="margin-top:12px;font-size:13px;color:#c9a96e;"></div>';

              overlay.appendChild(box);
              document.body.appendChild(overlay);

              overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
              document.getElementById('pa-email-cancel').addEventListener('click', function() { overlay.remove(); });

              document.getElementById('pa-email-send').addEventListener('click', function() {
                var emailInput = document.getElementById('pa-email-input');
                var status = document.getElementById('pa-email-status');
                var emailVal = (emailInput.value || '').trim();
                if (!emailVal || !emailVal.includes('@')) {
                  status.textContent = 'Veuillez entrer un email valide.';
                  status.style.color = '#e57373';
                  return;
                }
                status.textContent = 'Envoi en cours...';
                status.style.color = '#c9a96e';
                this.disabled = true;

                // Get interpretation text
                var interpText = '';
                try {
                  var el = document.getElementById('ia-interpretation-content');
                  if (el) {
                    // Clone and remove any loader elements before extracting text
                    var clone = el.cloneNode(true);
                    var loaders = clone.querySelectorAll('.pa-interpretation-loader, .pa-loader-spinner, .pa-loader-text');
                    for (var li = 0; li < loaders.length; li++) loaders[li].remove();
                    interpText = (clone.innerText || clone.textContent || '').trim();
                  }
                  if (!interpText) {
                    var vp = document.querySelector('.pa-interpretation-viewport');
                    if (vp) {
                      var clone2 = vp.cloneNode(true);
                      var loaders2 = clone2.querySelectorAll('.pa-interpretation-loader, .pa-loader-spinner, .pa-loader-text');
                      for (var li2 = 0; li2 < loaders2.length; li2++) loaders2[li2].remove();
                      interpText = (clone2.innerText || clone2.textContent || '').trim();
                    }
                  }
                } catch (e) {}

                // Get card names and image filenames
                var cardNames = [];
                var cardImages = [];
                cards.forEach(function(c) {
                  var src = c.src || c;
                  var file = String(src).split('/').pop().replace(/\?.*$/, '');
                  var fname = file.replace(/\.(webp|png|jpg|jpeg)$/i, '').replace(/^\d+-/, '').replace(/-/g, ' ');
                  fname = fname.replace(/^l(er|arc|imp|emp|amo|eto)/i, function(m, p) { return "l'" + p.charAt(0).toUpperCase() + p.slice(1); });
                  cardNames.push(fname.charAt(0).toUpperCase() + fname.slice(1) + (c.reversed ? ' (Invers\u00e9e)' : ''));
                  cardImages.push({ file: file, reversed: !!c.reversed });
                });

                fetch('/api/send-tarot-email-v2.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: emailVal, tirage: interpText, cartes: cardNames, images: cardImages })
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  if (data.success) {
                    status.textContent = '\u2728 Email envoy\u00e9 ! V\u00e9rifiez votre bo\u00eete de r\u00e9ception.';
                    status.style.color = '#81c784';
                    setTimeout(function() { overlay.remove(); }, 2500);
                  } else {
                    status.textContent = data.error || 'Erreur lors de l\u2019envoi.';
                    status.style.color = '#e57373';
                    document.getElementById('pa-email-send').disabled = false;
                  }
                })
                .catch(function() {
                  status.textContent = 'Erreur r\u00e9seau. R\u00e9essayez.';
                  status.style.color = '#e57373';
                  document.getElementById('pa-email-send').disabled = false;
                });
              });

              // Focus input
              setTimeout(function() { document.getElementById('pa-email-input').focus(); }, 100);
            } catch (e) { console.warn('[PopupAdapter] Email send failed', e); }
          });

          btnBack.addEventListener('click', function () {
            try {
              // ensure playback is stopped as soon as the popup is dismissed
              try { stopPlayback(); } catch (e) { console.warn('[PA]', e); }
              // close/hide this interpretation popup; best-effort removal
              try {
                // if inside a fallback overlay, remove that overlay
                const overlay = interp.closest('.pa-deck-overlay-fallback');
                const backdrop = document.querySelector && document.querySelector('.pa-interpretation-backdrop');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                else if (interp && interp.parentNode) interp.parentNode.removeChild(interp);
                // restore any applied transforms
                try { if (interp && interp.dataset && interp.dataset._pa_fixApplied) { interp.style.transform = interp.dataset._pa_origTransform || ''; delete interp.dataset._pa_fixApplied; delete interp.dataset._pa_origTransform; } } catch (e) { console.warn('[PA]', e); }
                try { setGlobalNoScroll(false); try { document.body.style.overflowX = ''; } catch (e) { console.warn('[PA]', e); } } catch (e) { console.warn('[PA]', e); }
              } catch (e) { console.warn('[PA]', e); }
            } catch (e) { console.warn('[PA]', e); }
          });

          // expose starter hook and auto-invoke if present
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._interpretationStarter = function(cb) { try { if (typeof cb === 'function') cb(cards, frame); } catch (e) { console.warn('[PA]', e); } }; } catch (e) { console.warn('[PA]', e); }
          try { setGlobalNoScroll(true); } catch (e) { console.warn('[PA]', e); }
                  // open the interpretation popup via PopupManager
                          let _popupHandle = null;
                          let handle = null;
                          try {
                            // create overlay if missing (and ensure a backdrop always exists)
                            let overlay = document.querySelector('.pa-interpretation-overlay');
                            // ensure backdrop exists (create if missing)
                            let bd = document.querySelector('.pa-interpretation-backdrop');
                            if (!overlay) {
                              overlay = document.createElement('div');
                              overlay.className = 'pa-interpretation-overlay';
                              Object.assign(overlay.style, {
                                position: 'fixed',
                                left: '50%',
                                top: '2vh',
                                transform: 'translateX(-50%)',
                                zIndex: 2147483646,
                                background: 'transparent',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                padding: '8px'
                              });
                              // ensure overlay does not capture pointer events except children
                              overlay.style.pointerEvents = 'auto';
                            }
                            // create backdrop if missing
                            if (!bd) {
                              bd = document.createElement('div');
                              bd.className = 'pa-interpretation-backdrop';
                              Object.assign(bd.style, {
                                position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
                                background: 'rgba(0,0,0,1)', zIndex: 2147483645
                              });
                              // clicking backdrop closes overlay
                              bd.addEventListener('click', function () {
                                try {
                                  // restore any hidden deck parents
                                  try { const hidden = document.querySelectorAll('[data-_pa_hiddenByInterp="1"]'); if (hidden && hidden.length) Array.prototype.forEach.call(hidden, h => { try { h.style.visibility = ''; delete h.dataset._pa_hiddenByInterp; } catch (e) { console.warn('[PA]', e); } }); } catch (e) { console.warn('[PA]', e); }
                                } catch (e) { console.warn('[PA]', e); }
                                try { const ov = document.querySelector('.pa-interpretation-overlay'); if (ov && ov.parentNode) ov.parentNode.removeChild(ov); } catch (e) { console.warn('[PA]', e); }
                                try { setGlobalNoScroll(false); } catch (e) { console.warn('[PA]', e); }
                                try { if (typeof stopPlayback === 'function') stopPlayback(); } catch (e) { console.warn('[PA]', e); }
                                try { if (bd && bd.parentNode) bd.parentNode.removeChild(bd); } catch (e) { console.warn('[PA]', e); }
                              });
                            }
                            // ensure backdrop and overlay are appended (backdrop before overlay)
                            try {
                              if (!bd.parentNode) document.body.appendChild(bd);
                              // Insert carto video into backdrop
                              if (!bd.querySelector('.pa-carto-video')) {
                                const vid = document.createElement('video');
                                vid.className = 'pa-carto-video';
                                vid.src = '/img/carto-video.mp4';
                                vid.autoplay = true; vid.muted = false; vid.loop = false; vid.playsInline = true;
                                vid.setAttribute('playsinline', '');
                                Object.assign(vid.style, {
                                  position: 'absolute', top: '50%', left: '50%',
                                  transform: 'translate(-50%,-50%)',
                                  width: '100%', height: '100%',
                                  objectFit: 'contain', opacity: '0',
                                  transition: 'opacity 1.5s ease', zIndex: '0'
                                });
                                // Cross-fade: ramp video in once it starts playing
                                vid.addEventListener('playing', function () {
                                  requestAnimationFrame(function () { vid.style.opacity = '0.5'; });
                                }, { once: true });
                                bd.style.overflow = 'hidden';
                                bd.appendChild(vid);
                                // Store reference to fade out later
                                window.PopupAdapter._cartoVideo = vid;
                              }
                              if (!overlay.parentNode) document.body.appendChild(overlay);
                              // apply stored deck background to overlay so it's opaque like the deck popup
                              try {
                                const bg = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupBackground) ? window.PopupAdapter._lastDeckPopupBackground : '';
                                // helper: produce a slightly veiled rgba color from various inputs
                                function veilColor(input) {
                                  try {
                                    if (!input) return 'rgba(255,255,255,0.96)';
                                    const s = String(input).trim();
                                    if (!s || s === 'transparent') return 'rgba(255,255,255,0.96)';
                                    // rgb/rgba
                                    const rgbm = s.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9\.]+))?\s*\)/i);
                                    if (rgbm) {
                                      const r = Math.max(0, Math.min(255, parseInt(rgbm[1],10)||255));
                                      const g = Math.max(0, Math.min(255, parseInt(rgbm[2],10)||255));
                                      const b = Math.max(0, Math.min(255, parseInt(rgbm[3],10)||255));
                                      const aIn = (rgbm[4] !== undefined && rgbm[4] !== null) ? parseFloat(rgbm[4]) : 1.0;
                                      const a = Math.min(0.96, isFinite(aIn) ? aIn : 0.96);
                                      // ensure veil is slightly transparent even if original fully opaque
                                      return 'rgba(' + r + ',' + g + ',' + b + ',' + (Math.max(0.36, a * 0.96)).toFixed(2) + ')';
                                    }
                                    // hex #rrggbb or #rgb
                                    const hexm = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
                                    if (hexm) {
                                      let hex = hexm[1];
                                      if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
                                      const r = parseInt(hex.substring(0,2),16);
                                      const g = parseInt(hex.substring(2,4),16);
                                      const b = parseInt(hex.substring(4,6),16);
                                      return 'rgba(' + r + ',' + g + ',' + b + ',0.94)';
                                    }
                                    // fallback: use the string directly but add slight opacity if possible
                                    return 'rgba(255,255,255,0.96)';
                                  } catch (e) { return 'rgba(255,255,255,0.96)'; }
                                }
                                try { overlay.style.background = 'transparent'; } catch (e) { overlay.style.background = 'transparent'; }
                              } catch (e) { console.warn('[PA]', e); }
                            } catch (e) { console.warn('[PA]', e); }

                            // apply measured deck popup width if available; let height adapt to content
                            const rect = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupRect) ? window.PopupAdapter._lastDeckPopupRect : (window.PopupAdapter && window.PopupAdapter._lastDeckPopupSize) ? window.PopupAdapter._lastDeckPopupSize : null;
                            if (rect) {
                              try { overlay.style.width = rect.width + 'px'; } catch (e) { console.warn('[PA]', e); }
                              try { overlay.style.minWidth = rect.width + 'px'; } catch (e) { console.warn('[PA]', e); }
                            }
                            // let overlay expand and scroll naturally
                            try { overlay.style.maxHeight = 'none'; } catch (e) { console.warn('[PA]', e); }
                            try { overlay.style.maxWidth = '95vw'; } catch (e) { console.warn('[PA]', e); }
                            try { overlay.style.width = '900px'; } catch (e) { console.warn('[PA]', e); }
                            try { overlay.style.overflowY = 'auto'; } catch (e) { console.warn('[PA]', e); }
                            try { overlay.style.overflowX = 'hidden'; } catch (e) { console.warn('[PA]', e); }

                            // Before moving interp into overlay, aggressively remove any remaining deck popup elements
                            try {
                              // remove the last deck popup handle if still present
                              try {
                                const lastHandle = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupHandle) ? window.PopupAdapter._lastDeckPopupHandle : null;
                                const wrapper = (lastHandle && lastHandle.nodeType === 1) ? lastHandle : (lastHandle && lastHandle.el) ? lastHandle.el : null;
                                if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                              } catch (e) { console.warn('[PA]', e); }
                              // remove any fallback overlays created for the deck
                              try { const fbs = document.querySelectorAll && document.querySelectorAll('.pa-deck-overlay-fallback'); if (fbs && fbs.length) Array.prototype.forEach.call(fbs, f => { try { if (f && f.parentNode) f.parentNode.removeChild(f); } catch (e) { console.warn('[PA]', e); } }); } catch (e) { console.warn('[PA]', e); }
                              // cross-fade .pm-overlay (carto.webp) out instead of removing abruptly
                              try {
                                const pmOvs = document.querySelectorAll('.pm-overlay');
                                if (pmOvs && pmOvs.length) Array.prototype.forEach.call(pmOvs, function (o) {
                                  try {
                                    o.style.transition = 'opacity 1.2s ease';
                                    o.style.opacity = '0';
                                    setTimeout(function () { try { if (o && o.parentNode) o.parentNode.removeChild(o); } catch (e) {} }, 1300);
                                  } catch (e) {}
                                });
                              } catch (e) { console.warn('[PA]', e); }
                              // remove any legacy deck container id
                              try { const lastC = document.getElementById && document.getElementById('pa-last-deck-container'); if (lastC && lastC.parentNode) lastC.parentNode.removeChild(lastC); } catch (e) { console.warn('[PA]', e); }
                            } catch (e) { console.warn('[PA]', e); }
                            // hide any popup ancestors that contain deck slots so they cannot be seen under the interpretation
                            try {
                              const slots = document.querySelectorAll && document.querySelectorAll('.pa-deck-card, .pm-card-slot');
                              if (slots && slots.length) {
                                Array.prototype.forEach.call(slots, function(s) {
                                  try {
                                    const parent = (s.closest && (s.closest('.pa-deck-overlay-fallback') || s.closest('.pm-popup') || s.closest('.pm-popup-inner') || s.closest('#pa-last-deck-container')) ) || s.parentNode;
                                    if (parent && parent.style && !parent.dataset._pa_hiddenByInterp) {
                                      parent.dataset._pa_hiddenByInterp = '1';
                                      parent.style.visibility = 'hidden';
                                    }
                                  } catch (e) { console.warn('[PA]', e); }
                                });
                              }
                            } catch (e) { console.warn('[PA]', e); }
                            // move interp into overlay
                            try { if (interp.parentNode) interp.parentNode.removeChild(interp); } catch (e) { console.warn('[PA]', e); }
                            interp.style.width = '100%';
                            interp.style.boxSizing = 'border-box';
                            overlay.appendChild(interp);
                            handle = overlay;
                          } catch (e) {
                            // fallback: use openPopup (host PopupManager)
                            try { handle = openPopup(interp); } catch (er) { handle = interp; }
                          }
                          try { _popupHandle = handle; } catch (e) { console.warn('[PA]', e); }
                          // Diagnostic logger: capture wrapper rects and events for troubleshooting
                          try {
                            try { window.__PopupWatcherLogs = window.__PopupWatcherLogs || []; } catch (e) { window.__PopupWatcherLogs = []; }
                            function _pw_now() { try { return Date.now(); } catch (e) { return +(new Date()); } }
                            function _pw_rect(n) { try { if (!n || !n.getBoundingClientRect) return null; const r = n.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; } catch (e) { return null; } }
                            function _pw_log(msg, node) { try { window.__PopupWatcherLogs.push({ t: _pw_now(), msg: String(msg || ''), rect: _pw_rect(node), style: node && node.getAttribute ? node.getAttribute('style') : null, class: node && node.className ? node.className : null }); } catch (e) { console.warn('[PA]', e); } }
                            // attempt to identify the wrapper returned by openPopup
                            try {
                              const wrapperNode = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                              _pw_log('wrapper-initial', wrapperNode || interp);
                              // probes at intervals
                              [60,120,240,480,900].forEach((ms) => setTimeout(() => { try { _pw_log('wrapper-probe+' + ms, wrapperNode || interp); } catch (e) { console.warn('[PA]', e); } }, ms));
                              // listen for transitionend/animationend
                              try {
                                if (wrapperNode) {
                                  const onEnd = function(ev) { try { _pw_log('wrapper-transitionend:' + (ev && ev.propertyName) , wrapperNode); } catch (e) { console.warn('[PA]', e); } };
                                  wrapperNode.addEventListener && wrapperNode.addEventListener('transitionend', onEnd);
                                  wrapperNode.addEventListener && wrapperNode.addEventListener('animationend', onEnd);
                                }
                              } catch (e) { console.warn('[PA]', e); }
                              // observe attribute changes on wrapper for short period
                              try {
                                if (wrapperNode && window.MutationObserver) {
                                  const mo = new MutationObserver(function(list) {
                                    try { _pw_log('wrapper-mutation', wrapperNode); } catch (e) { console.warn('[PA]', e); }
                                  });
                                  try { mo.observe(wrapperNode, { attributes: true, attributeFilter: ['style','class'] }); } catch (e) { console.warn('[PA]', e); }
                                  setTimeout(() => { try { mo.disconnect(); } catch (e) { console.warn('[PA]', e); } }, 1200);
                                }
                              } catch (e) { console.warn('[PA]', e); }
                              // also probe deck slot rects if present (helpful to see source positions)
                              try {
                                const deckSlots = document.querySelectorAll && document.querySelectorAll('.pa-deck-card, .pm-card-slot');
                                if (deckSlots && deckSlots.length) {
                                  Array.prototype.forEach.call(deckSlots, function(s, idx) { try { _pw_log('deck-slot-' + idx, s); } catch (e) { console.warn('[PA]', e); } });
                                }
                              } catch (e) { console.warn('[PA]', e); }
                            } catch (e) { _pw_log('wrapper-log-setup-failed', interp); }
                            // expose reader helper
                            try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter.getPopupWatcherLogs = function() { try { return window.__PopupWatcherLogs || []; } catch (e) { return []; } }; } catch (e) { console.warn('[PA]', e); }
                          } catch (e) { console.warn('[PA]', e); }
                          // Try morph transition: clone visible card images from the deck and animate them
                          try {
                            // Disable morph by default to avoid visual displacement; can be re-enabled
                            // by setting window.PopupAdapter.transition = 'morph' at runtime.
                            const transition = (window.PopupAdapter && window.PopupAdapter.transition) ? window.PopupAdapter.transition : 'none';
                            const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                            if (transition === 'morph' && !prefersReduced) {
                              try {
                                // Try to lock the popup wrapper width to avoid horizontal reflow while morphing.
                                let _morphLockedWrapper = null;
                                  try {
                                    const wrapperNode = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                                    if (wrapperNode && wrapperNode.getBoundingClientRect) {
                                      const wr = wrapperNode.getBoundingClientRect();
                                      // preserve originals
                                      try { wrapperNode.dataset._pa_origTransition = wrapperNode.style.transition || ''; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.dataset._pa_origTransform = wrapperNode.style.transform || ''; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.dataset._pa_origLeft = wrapperNode.style.left || ''; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.dataset._pa_origPosition = wrapperNode.style.position || ''; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.dataset._pa_origWidth = wrapperNode.style.width || ''; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.dataset._pa_origMinWidth = wrapperNode.style.minWidth || ''; } catch (e) { console.warn('[PA]', e); }
                                      // disable transitions and enforce centering class
                                      try { wrapperNode.style.transition = 'none'; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.style.width = Math.max(48, Math.round(wr.width || 720)) + 'px'; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.style.minWidth = Math.max(48, Math.round(wr.width || 720)) + 'px'; } catch (e) { console.warn('[PA]', e); }
                                      try { wrapperNode.classList && wrapperNode.classList.add('pa-center-popup'); } catch (e) { console.warn('[PA]', e); }
                                      _morphLockedWrapper = wrapperNode;
                                    }
                                  } catch (e) { console.warn('[PA]', e); }
                                // hide interp content until morph completes (use opacity so visibility/layout remains)
                                try { interp.style.visibility = 'hidden'; interp.style.opacity = '0'; } catch (e) { console.warn('[PA]', e); }
                                // locate deck slot images by index (if deck still present)
                                const clones = [];
                                const body = document.body || document.documentElement;
                                const deckSlots = (function(){ try { return Array.prototype.slice.call(document.querySelectorAll('.pa-deck-card, .pm-card-slot')); } catch(e){ return []; } })();
                                // create clones mapped to the chosen cards
                                cards.forEach((c, i) => {
                                  try {
                                    const src = (c && c.src) ? c.src : (typeof c === 'string' ? c : null);
                                    let sourceImg = null;
                                    if (typeof c === 'object' && c.index != null && deckSlots && deckSlots.length) {
                                      const slot = deckSlots[Number(c.index)];
                                      if (slot) sourceImg = slot.querySelector('img');
                                    }
                                    // fallback: try to find any image with matching src
                                    if (!sourceImg && src) {
                                      try { sourceImg = document.querySelector('img[src$="' + String(src).split('/').pop() + '"]'); } catch (e) { console.warn('[PA]', e); }
                                    }
                                    // build clone element
                                    const cl = document.createElement('img');
                                    cl.src = src || (sourceImg && sourceImg.src) || '';
                                    cl.alt = '';
                                    cl.style.position = 'fixed';
                                    cl.style.zIndex = 2147483646;
                                    cl.style.borderRadius = '12px';
                                    cl.style.boxShadow = '0 12px 34px rgba(0,0,0,0.28)';
                                    cl.style.willChange = 'transform, opacity';
                                    cl.style.transition = 'transform 520ms cubic-bezier(.2,.9,.25,1), opacity 420ms ease';
                                    // initial placement from source image rect or center fallback
                                    let sRect = null;
                                    try { if (sourceImg && sourceImg.getBoundingClientRect) sRect = sourceImg.getBoundingClientRect(); } catch (e) { console.warn('[PA]', e); }
                                    if (!sRect) {
                                      sRect = { left: window.innerWidth/2 - 80, top: window.innerHeight/2 - 120, width: 160, height: 240 };
                                    }
                                    cl.style.left = (sRect.left) + 'px';
                                    cl.style.top = (sRect.top) + 'px';
                                    cl.style.width = (sRect.width) + 'px';
                                    cl.style.height = (sRect.height) + 'px';
                                    cl.style.objectFit = 'contain';
                                    body.appendChild(cl);
                                    clones.push({ el: cl, sourceRect: sRect, sourceImg: sourceImg });
                                  } catch (e) { console.warn('[PA]', e); }
                                });

                                // ensure chosenWrap children exist inside interp; wait for wrapper to stabilize
                                (function waitAndAnimate() {
                                  try {
                                    const wrapperNode = (handle && handle.nodeType === 1) ? handle : (handle && handle.el) ? handle.el : null;
                                    // helper: wait until getBoundingClientRect stabilizes or timeout
                                    function waitForStableRect(node, maxMs = 900, interval = 60, stableNeeded = 3) {
                                      return new Promise((resolve) => {
                                        if (!node || !node.getBoundingClientRect) return resolve(true);
                                        try {
                                          // If the node has a CSS transition on left/top/width/height/transform, wait for transitionend
                                          const cs = window.getComputedStyle(node);
                                          const trans = (cs && cs.transition && cs.transition !== 'all 0s ease 0s');
                                          let resolved = false;
                                          if (trans) {
                                            const onEnd = (ev) => {
                                              try { if (ev && (ev.propertyName === 'left' || ev.propertyName === 'top' || ev.propertyName === 'width' || ev.propertyName === 'height' || ev.propertyName === 'transform')) {
                                                if (!resolved) { resolved = true; try { node.removeEventListener('transitionend', onEnd); } catch (e) { console.warn('[PA]', e); } resolve(true); }
                                              } } catch (e) { console.warn('[PA]', e); }
                                            };
                                            try { node.addEventListener('transitionend', onEnd); } catch (e) { console.warn('[PA]', e); }
                                            // fallback timeout
                                            setTimeout(() => { if (!resolved) { resolved = true; try { node.removeEventListener('transitionend', onEnd); } catch (e) { console.warn('[PA]', e); } resolve(true); } }, Math.min(maxMs, 900));
                                            return;
                                          }
                                        } catch (e) { console.warn('[PA]', e); }
                                        // otherwise poll for stable rect
                                        let lastKey = null;
                                        let stable = 0;
                                        let elapsed = 0;
                                        const id = setInterval(() => {
                                          try {
                                            const r = node.getBoundingClientRect();
                                            const key = Math.round(r.left) + '|' + Math.round(r.top) + '|' + Math.round(r.width) + '|' + Math.round(r.height);
                                            if (key === lastKey) stable++; else { stable = 0; lastKey = key; }
                                            elapsed += interval;
                                            if (stable >= stableNeeded || elapsed >= maxMs) { clearInterval(id); resolve(true); }
                                          } catch (e) { clearInterval(id); resolve(true); }
                                        }, interval);
                                        // safety: ensure promise eventually resolves
                                        setTimeout(() => { try { clearInterval(id); resolve(true); } catch (e) { resolve(true); } }, maxMs + 120);
                                      });
                                    }

                                    (async function () {
                                      try {
                                        await waitForStableRect(wrapperNode, 900, 60, 3);
                                      } catch (e) { console.warn('[PA]', e); }
                                      try {
                                        const targetChildren = interp.querySelectorAll && interp.querySelectorAll('#pa-chosen-wrap > div');
                                        clones.forEach((cclone, idx) => {
                                          try {
                                            // recompute source rect just before animation (in case it moved)
                                            if (cclone.sourceImg && cclone.sourceImg.getBoundingClientRect) {
                                              try { cclone.sourceRect = cclone.sourceImg.getBoundingClientRect(); } catch (e) { console.warn('[PA]', e); }
                                              // apply current source rect to current clone position so transform is correct
                                              try {
                                                cclone.el.style.left = (cclone.sourceRect.left) + 'px';
                                                cclone.el.style.top = (cclone.sourceRect.top) + 'px';
                                                cclone.el.style.width = (cclone.sourceRect.width) + 'px';
                                                cclone.el.style.height = (cclone.sourceRect.height) + 'px';
                                              } catch (e) { console.warn('[PA]', e); }
                                            }
                                            const tgt = (targetChildren && targetChildren[idx]) ? targetChildren[idx] : null;
                                            let tRect = null;
                                            if (tgt && tgt.getBoundingClientRect) tRect = tgt.getBoundingClientRect();
                                            if (!tRect) {
                                              tRect = { left: (window.innerWidth/2 - 110) + (idx*8), top: (window.innerHeight/2 - 160) + (idx*6), width: 220, height: 330 };
                                            }
                                            const dx = (tRect.left - (cclone.sourceRect.left || 0));
                                            const dy = (tRect.top - (cclone.sourceRect.top || 0));
                                            const sx = (tRect.width || 1) / (cclone.sourceRect.width || 1);
                                            const sy = (tRect.height || 1) / (cclone.sourceRect.height || 1);
                                            const s = Math.min(sx, sy);
                                            // trigger layout before transform
                                            try { void cclone.el.offsetWidth; } catch (e) { console.warn('[PA]', e); }
                                            cclone.el.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
                                            cclone.el.style.opacity = '1';
                                          } catch (e) { console.warn('[PA]', e); }
                                        });
                                      } catch (e) { console.warn('[PA]', e); }
                                    })();
                                  } catch (e) { console.warn('[PA]', e); }
                                })();

                                // finish morph: unhide interp after transition and remove clones
                                setTimeout(() => {
                                  try {
                                    // remove clones with a small fade
                                    clones.forEach(cc => { try { cc.el.style.opacity = '0'; cc.el.style.transition = 'opacity 200ms ease'; } catch (e) { console.warn('[PA]', e); } });
                                    setTimeout(() => {
                                      try { clones.forEach(cc => { try { if (cc.el && cc.el.parentNode) cc.el.parentNode.removeChild(cc.el); } catch (e) { console.warn('[PA]', e); } }); } catch (e) { console.warn('[PA]', e); }
                                      try { interp.style.visibility = ''; interp.style.opacity = '1'; } catch (e) { console.warn('[PA]', e); }
                                      // restore wrapper width/transition and class if we locked it
                                      try {
                                        if (_morphLockedWrapper) {
                                          try { _morphLockedWrapper.style.width = (_morphLockedWrapper.dataset && _morphLockedWrapper.dataset._pa_origWidth) ? _morphLockedWrapper.dataset._pa_origWidth : ''; } catch (e) { console.warn('[PA]', e); }
                                          try { _morphLockedWrapper.style.minWidth = (_morphLockedWrapper.dataset && _morphLockedWrapper.dataset._pa_origMinWidth) ? _morphLockedWrapper.dataset._pa_origMinWidth : ''; } catch (e) { console.warn('[PA]', e); }
                                          try { _morphLockedWrapper.style.transition = (_morphLockedWrapper.dataset && _morphLockedWrapper.dataset._pa_origTransition) ? _morphLockedWrapper.dataset._pa_origTransition : ''; } catch (e) { console.warn('[PA]', e); }
                                          try { if (_morphLockedWrapper.classList) _morphLockedWrapper.classList.remove('pa-center-popup'); } catch (e) { console.warn('[PA]', e); }
                                          try { if (_morphLockedWrapper.dataset) { delete _morphLockedWrapper.dataset._pa_origTransition; delete _morphLockedWrapper.dataset._pa_origTransform; delete _morphLockedWrapper.dataset._pa_origLeft; delete _morphLockedWrapper.dataset._pa_origPosition; delete _morphLockedWrapper.dataset._pa_origWidth; delete _morphLockedWrapper.dataset._pa_origMinWidth; } } catch (e) { console.warn('[PA]', e); }
                                          _morphLockedWrapper = null;
                                        }
                                      } catch (e) { console.warn('[PA]', e); }
                                    }, 220);
                                  } catch (e) { console.warn('[PA]', e); }
                                }, 620);
                              } catch (e) { console.warn('[PA]', e); }
                            } else {
                              // not morphing: ensure interp visible
                              try { interp.style.visibility = ''; interp.style.opacity = '1'; } catch (e) { console.warn('[PA]', e); }
                            }
                          } catch (e) { console.warn('[PA]', e); }
                          // Observe DOM removal of the interpretation node so we can stop audio
                          try {
                            // If the popup node is removed by PopupManager or by host, stop playback immediately
                            const removalObserver = new MutationObserver((mutList) => {
                              try {
                                if (!interp || !interp.isConnected) {
                                  try { stopPlayback(); } catch (e) { console.warn('[PA]', e); }
                                  try { removalObserver.disconnect(); } catch (e) { console.warn('[PA]', e); }
                                }
                              } catch (e) { console.warn('[PA]', e); }
                            });
                            // observe document.body subtree for changes; disconnect when interp removed
                            try { removalObserver.observe(document.body, { childList: true, subtree: true }); } catch (e) { console.warn('[PA]', e); }
                          } catch (e) { console.warn('[PA]', e); }
                          // robustly enforce wrapper sizing. PopupManager may wrap/override; use immediate + delayed reapply + MutationObserver
                          try {
                            const rect = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupRect) ? window.PopupAdapter._lastDeckPopupRect : (window.PopupAdapter && window.PopupAdapter._lastDeckPopupSize) ? window.PopupAdapter._lastDeckPopupSize : null;
                            const wrapper = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                            if (wrapper && rect) {
                              const applyRect = (w, r) => {
                                try { w.style.minWidth = r.width + 'px'; } catch (e) { console.warn('[PA]', e); }
                                try { w.style.width = r.width + 'px'; } catch (e) { console.warn('[PA]', e); }
                                // Let wrapper height adapt freely to content
                                try { w.style.maxHeight = 'none'; } catch (e) { console.warn('[PA]', e); }
                                try { w.style.height = 'auto'; } catch (e) { console.warn('[PA]', e); }
                                try { w.style.minHeight = 'auto'; } catch (e) { console.warn('[PA]', e); }
                              };
                              try { applyRect(wrapper, rect); } catch (e) { console.warn('[PA]', e); }
                              // reapply slightly later in case the host mutates the wrapper
                              setTimeout(() => { try { applyRect(wrapper, rect); } catch (e) { console.warn('[PA]', e); } }, 120);
                              setTimeout(() => { try { applyRect(wrapper, rect); } catch (e) { console.warn('[PA]', e); } }, 420);
                              // observe wrapper for attribute/style changes and reapply once if needed
                              try {
                                const mo = new MutationObserver((mut) => {
                                  try { applyRect(wrapper, rect); } catch (e) { console.warn('[PA]', e); }
                                });
                                mo.observe(wrapper, { attributes: true, attributeFilter: ['style', 'class'], childList: false, subtree: false });
                                // disconnect after a short grace period
                                setTimeout(() => { try { mo.disconnect(); } catch (e) { console.warn('[PA]', e); } }, 2500);
                              } catch (e) { console.warn('[PA]', e); }
                            }
                          } catch (e) { console.warn('[PA]', e); }
                  // after the popup is attached to the DOM, ensure popup bottom is below the chosen cards
                  try {
                    setTimeout(() => {
                      try {
                        const wrapper = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                        const chosenEl = document.getElementById('pa-chosen-wrap');
                        if (!wrapper || !chosenEl) return;
                        const wRect = wrapper.getBoundingClientRect();
                        const cRect = chosenEl.getBoundingClientRect();
                        // if the wrapper bottom is above the chosen cards bottom, expand wrapper minHeight
                        if ((wRect.bottom || 0) < (cRect.bottom || 0)) {
                          const delta = Math.round((cRect.bottom || 0) - (wRect.bottom || 0)) + 12;
                          try {
                            const newMin = ( (wrapper.clientHeight || wRect.height || 0) + delta );
                            wrapper.style.minHeight = newMin + 'px';
                            // also ensure wrapper height can grow
                            try { wrapper.style.height = 'auto'; } catch (e) { console.warn('[PA]', e); }
                          } catch (e) { console.warn('[PA]', e); }
                        }
                      } catch (e) { console.warn('[PA]', e); }
                    }, 160);
                  } catch (e) { console.warn('[PA]', e); }
                  // Force a downward offset of 100px on the wrapper returned by openPopup (some page managers override positioning)
                  try {
                            const wrapper = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                    if (wrapper && wrapper.style) {
                      try {
                        // preserve original transform
                        if (!wrapper.dataset._pa_origTransform) wrapper.dataset._pa_origTransform = wrapper.style.transform || '';
              // apply a smaller translateY so the popup sits higher on the page
            wrapper.style.transform = (wrapper.style.transform || '') + ' translateY(40px)';
            wrapper.dataset._pa_downshift = '40';
                      } catch (e) { console.warn('[PA]', e); }
                    }
                  } catch (e) { console.warn('[PA]', e); }
                  // After the popup is visible, measure alignment and apply a corrective translate if needed
                  try {
                    setTimeout(() => {
                      try {
                        const m = window.PopupAdapter && typeof window.PopupAdapter.measureInterpretationAlignment === 'function' ? window.PopupAdapter.measureInterpretationAlignment(false) : null;
                        if (m && Math.abs(m.offsetPx) > 2) {
                          try {
                            if (!interp.dataset._pa_origTransform) interp.dataset._pa_origTransform = interp.style.transform || '';
                            interp.style.transform = (interp.style.transform || '') + ` translateX(${ -m.offsetPx }px)`;
                            interp.dataset._pa_fixApplied = '1';
                            console && console.log && console.log('[PopupAdapter] applied interp corrective translateX', -m.offsetPx);
                          } catch (e) { console.warn('[PA]', e); }
                        }
                      } catch (e) { console.warn('[PA]', e); }
                    }, 140);
                  } catch (e) { console.warn('[PA]', e); }
                  // inject centering CSS if missing
                  try {
                    if (!document.getElementById('pa-popup-center-styles')) {
                      const st = document.createElement('style');
                      st.id = 'pa-popup-center-styles';
                      st.textContent = `
                        .pa-center-popup { left: 50% !important; transform: translateX(-50%) !important; margin-left: auto !important; margin-right: auto !important; }
                      `;
                      (document.head || document.documentElement).appendChild(st);
                    }
                  } catch (e) { console.warn('[PA]', e); }
                  // try to center the wrapper returned by openPopup (best-effort)
                  try {
                    const wrapper = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                    if (wrapper && wrapper.classList) {
                      wrapper.classList.add('pa-center-popup');
                      try { wrapper.dataset._pa_centered = '1'; } catch (e) { console.warn('[PA]', e); }
                    }
                  } catch (e) { console.warn('[PA]', e); }
                  // Aggressive inline centering enforcement: some hosts reflow/translate the wrapper
                  // after we open it which causes a micro-offset. Force inline left/transform and
                  // reapply a few times via MutationObserver to override transient host mutations.
                  try {
                    const wrapper = (_popupHandle && _popupHandle.nodeType === 1) ? _popupHandle : (_popupHandle && _popupHandle.el) ? _popupHandle.el : null;
                    const rect = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupRect) ? window.PopupAdapter._lastDeckPopupRect : null;
                    if (wrapper && wrapper.style) {
                      try { wrapper.style.transition = 'none'; } catch (e) { console.warn('[PA]', e); }
                      try { wrapper.style.left = '50%'; } catch (e) { console.warn('[PA]', e); }
                      try { wrapper.style.transform = 'translateX(-50%)'; } catch (e) { console.warn('[PA]', e); }
                      try { if (rect && rect.width) { wrapper.style.width = rect.width + 'px'; wrapper.style.minWidth = rect.width + 'px'; } } catch (e) { console.warn('[PA]', e); }

                      try {
                        let attempts = 0;
                        const mo = new MutationObserver(() => {
                          try {
                            attempts++;
                            if (attempts <= 6) {
                              wrapper.style.transition = 'none';
                              wrapper.style.left = '50%';
                              wrapper.style.transform = 'translateX(-50%)';
                              if (rect && rect.width) { wrapper.style.width = rect.width + 'px'; wrapper.style.minWidth = rect.width + 'px'; }
                            } else {
                              try { mo.disconnect(); } catch (e) { console.warn('[PA]', e); }
                            }
                          } catch (e) { console.warn('[PA]', e); }
                        });
                        try { mo.observe(wrapper, { attributes: true, attributeFilter: ['style','class'] }); } catch (e) { console.warn('[PA]', e); }
                        // safety disconnect after short grace period
                        setTimeout(() => { try { mo.disconnect(); } catch (e) { console.warn('[PA]', e); } }, 900);
                      } catch (e) { console.warn('[PA]', e); }
                    }
                  } catch (e) { console.warn('[PA]', e); }
          // Note: previously we auto-invoked a sample interpretation starter which
          // wrote a placeholder ('Appel API automatique… (exemple)') into the frame.
          // That placeholder could overwrite the real API results that are fetched
          // just above. We no longer auto-set that placeholder; external code can
          // still use window.PopupAdapter._interpretationStarter to run custom logic.

          // expose selected cards for external usage
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastSelectedCards = cards.slice(); } catch (e) { console.warn('[PA]', e); }

          return handle;
        } catch (e) { console && console.warn && console.warn('interpretation popup error', e); }
      }

      // expose fan debug flags
      try {
        window.PopupAdapter = window.PopupAdapter || {};
        window.PopupAdapter._fanEnabled = !!fanEnabled;
        window.PopupAdapter._lastFanAngles = fanAngles.slice();
      } catch (e) { console.warn('[PA]', e); }

      // attach click handler to each slot to flip and reveal assigned face
      try {
        const slotsAll = grid.querySelectorAll('.pa-deck-card');
        // run a staggered reveal for the entrance: per-image, toggle visible class with small delay
        try {
          const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!prefersReduced) {
            let baseDelay = 80; // ms between each card's entrance
            // if opts.stagger exists and is a number, use it
            if (opts && typeof opts.stagger === 'number' && isFinite(opts.stagger)) baseDelay = Math.max(24, Number(opts.stagger));
            Array.prototype.forEach.call(slotsAll, function (s, idx) {
              try {
                const im = s.querySelector('img.pa-deck-entrance');
                if (!im) return;
                const jitter = Math.round((Math.random() * 40) - 20); // +/- jitter
                const delay = baseDelay * idx + jitter;
                setTimeout(() => { try { im.classList.add('pa-deck-entrance--visible'); } catch (e) { console.warn('[PA]', e); } }, Math.max(0, delay));
              } catch (e) { console.warn('[PA]', e); }
            });
          } else {
            // prefer reduced motion => remove entrance class immediately
            Array.prototype.forEach.call(slotsAll, function (s) { try { const im = s.querySelector('img.pa-deck-entrance'); if (im) im.classList.add('pa-deck-entrance--visible'); } catch (e) { console.warn('[PA]', e); } });
          }
        } catch (e) { console.warn('[PA]', e); }
        slotsAll.forEach((slot, si) => {
          slot.dataset.revealed = '0';
          slot.style.cursor = 'pointer';
          slot.addEventListener('click', function _revealHandler(ev) {
            try {
              if (slot.dataset.revealed === '1') return;
              // prevent selecting more cards than initially chosen
              try {
                if (typeof initialRemaining === 'number' && initialRemaining > 0 && selectedCards.length >= initialRemaining) {
                  // visual feedback: pulse the remaining number
                  try { numSpan && numSpan.classList.add('pa-remaining-pulse'); setTimeout(() => { try { numSpan && numSpan.classList.remove('pa-remaining-pulse'); } catch (e) { console.warn('[PA]', e); } }, 420); } catch (e) { console.warn('[PA]', e); }
                  return;
                }
              } catch (e) { console.warn('[PA]', e); }
              slot.dataset.revealed = '1';
              // find existing img (verso) or create one
              let img = slot.querySelector('img');
              const faceSrc = deckMapping[si];
              // animate a simple horizontal flip using scaleX
              if (img) {
                img.style.transition = 'transform 220ms ease';
                // shrink to 0 width
                img.style.transformOrigin = '50% 50%';
                img.style.transform = 'scaleX(0)';
                setTimeout(() => {
                  try {
                    img.src = faceSrc;
                    img.alt = '';
                    // ensure face image fills slot's inner area exactly
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.boxSizing = 'border-box';
                    img.style.objectFit = 'contain';
                    // restore scale to visible
                    img.style.transform = 'scaleX(1)';
                  } catch (e) { console.warn('[PA]', e); }
                }, 240);
              } else {
                // no img present — replace slot content
                slot.innerHTML = '';
                // ensure slot padding exists so image fits exactly in frame
                try { slot.style.padding = '4px'; slot.style.boxSizing = 'border-box'; } catch (e) { console.warn('[PA]', e); }
                img = document.createElement('img');
                img.src = faceSrc;
                img.alt = '';
                img.style.width = '100%'; img.style.height = '100%'; img.style.boxSizing = 'border-box'; img.style.objectFit = 'contain';
                img.style.borderRadius = '12px';
                // start visually small then scale in
                img.style.transform = 'scaleX(0)';
                img.style.transition = 'transform 260ms ease';
                slot.appendChild(img);
                // force reflow then animate in
                void img.offsetWidth;
                setTimeout(() => { try { img.style.transform = 'scaleX(1)'; } catch (e) { console.warn('[PA]', e); } }, 20);
              }
              // mark slot as revealed visually
              try { slot.classList.add('pm-card-revealed'); } catch (e) { console.warn('[PA]', e); }
              // decrement remaining count and update title (if this popup was opened with a chosenCount)
              try {
                if (typeof remaining !== 'undefined' && remaining > 0) {
                  remaining = Math.max(0, remaining - 1);
                  try { updateTitle(); } catch (e) { console.warn('[PA]', e); }
                }
              } catch (e) { console.warn('[PA]', e); }
              // record selected card info (50% chance reversed)
              try {
                const faceSrc = deckMapping[si];
                const reversed = Math.random() < 0.5;
                selectedCards.push({ index: si, src: faceSrc, reversed: reversed });
                // visually rotate the card 180° if reversed
                if (reversed && img) {
                  try {
                    img.style.transition = 'transform 350ms ease';
                    setTimeout(function() { try { img.style.transform = 'rotate(180deg)'; } catch (e) { console.warn('[PA]', e); } }, 300);
                  } catch (e) { console.warn('[PA]', e); }
                }
                try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastSelectedCards = selectedCards.slice(); } catch (e) { console.warn('[PA]', e); }
              } catch (e) { console.warn('[PA]', e); }
              // when remaining is zero, open the interpretation popup showing chosen cards
              try {
                if (typeof remaining !== 'undefined' && remaining === 0) {
                  try {
                    const delay = (opts && typeof opts.interpretationDelay === 'number' && isFinite(opts.interpretationDelay)) ? Math.max(0, Number(opts.interpretationDelay)) : 1200;
                    // keep the deck visible for a short display duration so users can see the final revealed cards
                    const displayMs = Math.max(600, Math.min(1800, delay || 1200));
                    setTimeout(() => {
                      try {
                        // remove the deck popup/fallback overlay so it disappears before interpretation opens
                        try {
                          const lastHandle = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupHandle) ? window.PopupAdapter._lastDeckPopupHandle : null;
                          const wrapper = (lastHandle && lastHandle.nodeType === 1) ? lastHandle : (lastHandle && lastHandle.el) ? lastHandle.el : null;
                          if (wrapper) {
                            try {
                              // capture the wrapper background so interpretation overlay can reuse it
                              try {
                                const cs = window.getComputedStyle && window.getComputedStyle(wrapper);
                                if (cs) {
                                  try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastDeckPopupBackground = cs.background || cs.backgroundImage || cs.backgroundColor || ''; } catch (e) { console.warn('[PA]', e); }
                                }
                              } catch (e) { console.warn('[PA]', e); }
                            } catch (e) { console.warn('[PA]', e); }
                            try { const pf = wrapper.closest && wrapper.closest('.pa-deck-overlay-fallback'); if (pf && pf.parentNode) pf.parentNode.removeChild(pf); } catch (e) { console.warn('[PA]', e); }
                            try { if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); } catch (e) { console.warn('[PA]', e); }
                          }
                        } catch (e) { console.warn('[PA]', e); }
                        // small gap to let layout settle visually, then open interpretation
                        setTimeout(() => { try { showInterpretationPopup(selectedCards.slice()); } catch (e) { console.warn('[PA]', e); } }, 220);
                      } catch (e) { console.warn('[PA]', e); }
                    }, displayMs);
                  } catch (e) { console.warn('[PA]', e); }
                }
              } catch (e) { console.warn('[PA]', e); }
            } catch (e) { /* ignore reveal errors */ }
          });
        });
      } catch (e) { /* ignore slot wiring errors */ }

      // expose helpers
      window.PopupAdapter = window.PopupAdapter || {};
      // expose the mapping so external code can inspect which face was assigned to which slot
      try { window.PopupAdapter._lastDeckMapping = deckMapping; } catch (e) { console.warn('[PA]', e); }
      // allow external code to place/clear cards inside this deck popup
        window.PopupAdapter.placeCardInSlot = function (index, src, alt) {
        try {
          const idx = Number(index) || 0;
          const sl = grid.querySelectorAll('.pa-deck-card');
          if (!sl || idx < 0 || idx >= sl.length) return false;
          sl[idx].innerHTML = '';
        if (src) {
          const im = document.createElement('img');
          im.src = src; im.alt = alt || '';
          // ensure slot has a small inset and uses border-box so image fits exactly
          try { sl[idx].style.padding = '4px'; sl[idx].style.boxSizing = 'border-box'; sl[idx].style.overflow = 'hidden'; } catch (e) { console.warn('[PA]', e); }
          im.style.width = '100%';
          im.style.height = '100%';
          im.style.boxSizing = 'border-box';
          im.style.objectFit = 'contain';
          im.style.borderRadius = '12px';
          sl[idx].appendChild(im);
          }
          return true;
        } catch (e) { return false; }
      };
      window.PopupAdapter.clearAllSlots = function () { try { grid.querySelectorAll('.pa-deck-card').forEach(s => { s.innerHTML = ''; }); } catch (e) { console.warn('[PA]', e); } };

  // expose the showDeckPopup function so external callers can open the deck with options (e.g., {fan: true})
  try { window.PopupAdapter.showDeckPopup = function(count, opts) { return showDeckPopup(count, opts); }; } catch (e) { console.warn('[PA]', e); }

      return popupHandle;
    } catch (e) { console && console.warn && console.warn('showDeckPopup error', e); }
  }

  // Message rotator state and helpers
  let _rotator = {
    timers: [],
    running: false,
    activeEls: []
  };

  function stopThemeMessages() {
    try {
      _rotator.running = false;
      // clear scheduled timers
      if (_rotator.timers && _rotator.timers.length) {
        _rotator.timers.forEach(t => { try { clearTimeout(t); } catch (e) { console.warn('[PA]', e); } });
      }
      _rotator.timers = [];
      // remove active elements
      if (_rotator.activeEls && _rotator.activeEls.length) {
        _rotator.activeEls.forEach(el => { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) { console.warn('[PA]', e); } });
      }
      _rotator.activeEls = [];
      if (window.PopupAdapter && window.PopupAdapter._lastThemeMsgBox) {
        window.PopupAdapter._lastThemeMsgBox.innerHTML = '';
      }
      // restore theme button visuals
      try {
        if (window.PopupAdapter && window.PopupAdapter._themeButtons) {
          Object.keys(window.PopupAdapter._themeButtons).forEach(k => { try { window.PopupAdapter._themeButtons[k].style.opacity = '1'; } catch (e) { console.warn('[PA]', e); } });
        }
      } catch (e) { console.warn('[PA]', e); }
    } catch (e) { /* ignore */ }
  }

  function playThemeMessages(theme, messages, opts) {
    console && console.log && console.log('[PopupAdapter] playThemeMessages', theme, 'messagesLen=', messages && messages.length, 'opts=', opts);
    try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = 'playing ' + theme + ' (' + (messages && messages.length || 0) + ')'; } catch (e) { console.warn('[PA]', e); }
    opts = opts || {};
    const charDelay = Number(opts.charDelay) || 28; // ms between chars (faster)
    const hold = Number(opts.hold) || 700; // ms to keep message after complete (shorter)
    const spawnInterval = Number(opts.spawnInterval) || Number(opts.between) || 220; // interval between spawns
    const jitter = Number(opts.jitter) || 120; // random jitter to avoid exact simultaneous starts
  // default to looping forever unless explicitly false
  const loop = (opts.loop === undefined) ? true : !!opts.loop;
    const box = (window.PopupAdapter && window.PopupAdapter._lastThemeMsgBox) || null;
    if (!box || !messages || !messages.length) return false;
    // normalize messages to objects { text, theme }
    let list = messages.slice().map(item => {
      if (!item) return { text: '', theme: theme === 'global' ? null : theme };
      if (typeof item === 'string') return { text: item, theme: theme === 'global' ? null : theme };
      if (typeof item === 'object' && item.text) return { text: String(item.text), theme: item.theme || (theme === 'global' ? null : theme) };
      return { text: String(item), theme: theme === 'global' ? null : theme };
    });
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
    shuffle(list);
    stopThemeMessages();
    _rotator.running = true;

  // Determine theme color and text color. If theme === 'global', we'll pick random theme colors per message.
  const baseThemeColor = (THEME_COLORS[theme] && THEME_COLORS[theme].bg) || null;
  const baseTextColor = baseThemeColor || '#2E7D32';

    let idx = 0;

    function showTypewriterText(text, itemTheme) {
      return new Promise(resolve => {
        try {
          const el = document.createElement('div');
          el.className = 'pm-rot-msg';
          // determine color from item's theme if present, otherwise fall back
          const themeKey = itemTheme || (theme === 'global' ? null : theme);
          const themeDef = themeKey && THEME_COLORS[themeKey] ? THEME_COLORS[themeKey] : null;
          const thisThemeColor = themeDef ? themeDef.bg : (Object.values(THEME_COLORS)[Math.floor(Math.random() * Object.values(THEME_COLORS).length)].bg);
          // use theme contrast color for text for readability, keep the dot as theme bg
          const thisTextColor = (themeDef && themeDef.color) ? themeDef.color : '#111';
          // random size: small / medium / large
          const sizes = ['small','medium','large'];
          const chosenSize = sizes[Math.floor(Math.random() * sizes.length)];
          let fontSize = '14px';
          if (chosenSize === 'small') fontSize = '12px';
          else if (chosenSize === 'large') fontSize = '18px';
          Object.assign(el.style, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            background: 'transparent',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'pre',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: fontSize,
          });
          // append hidden to measure size, then find a non-overlapping position
          // helper to slightly darken a theme color so letters remain readable on light backgrounds
          function darkenHex(hex, amt) {
            try {
              if (!hex) return '#000';
              const h = String(hex).replace('#','');
              const r = Math.max(0, Math.min(255, Math.floor(parseInt(h.substring(0,2),16) * (1 - amt))));
              const g = Math.max(0, Math.min(255, Math.floor(parseInt(h.substring(2,4),16) * (1 - amt))));
              const b = Math.max(0, Math.min(255, Math.floor(parseInt(h.substring(4,6),16) * (1 - amt))));
              const toHex = (v) => v.toString(16).padStart(2,'0');
              return '#' + toHex(r) + toHex(g) + toHex(b);
            } catch (e) { return '#000'; }
          }

          // create text holder only — we use colored letters (no colored bubble)
          const textHolder = document.createElement('span');
          textHolder.className = 'pm-rot-text';
          // compute a readable variant of the theme color for letters
          const letterColor = (themeDef && themeDef.bg) ? darkenHex(themeDef.bg, 0.25) : darkenHex(thisThemeColor, 0.25);
          Object.assign(textHolder.style, { color: letterColor, lineHeight: '1.1', whiteSpace: 'pre' });
          textHolder.textContent = '';
          el.appendChild(textHolder);
          // keep bubble background transparent
          Object.assign(el.style, { background: 'transparent', color: letterColor, padding: '4px 8px' });
          el.style.visibility = 'hidden';
          box.appendChild(el);
          const rect = box.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const elW = elRect.width || 120;
          const elH = elRect.height || 24;
          const maxLeft = Math.max(0, rect.width - elW);
          const maxTop = Math.max(0, rect.height - elH);

          // try several attempts to find a position that doesn't overlap existing activeEls
          let placed = false;
          const attempts = 12;
          for (let a = 0; a < attempts; a++) {
            const left = Math.floor(Math.random() * (maxLeft + 1));
            const top = Math.floor(Math.random() * (maxTop + 1));
            const candidate = { left, top, right: left + elW, bottom: top + elH };
            let coll = false;
            for (let k = 0; k < _rotator.activeEls.length; k++) {
              try {
                const ae = _rotator.activeEls[k];
                const ar = ae.el.getBoundingClientRect();
                // translate ar relative to box
                const relLeft = ar.left - rect.left;
                const relTop = ar.top - rect.top;
                const arect = { left: relLeft, top: relTop, right: relLeft + ar.width, bottom: relTop + ar.height };
                if (!(candidate.right < arect.left || candidate.left > arect.right || candidate.bottom < arect.top || candidate.top > arect.bottom)) { coll = true; break; }
              } catch (e) { /* ignore */ }
            }
            if (!coll) { el.style.left = left + 'px'; el.style.top = top + 'px'; placed = true; break; }
          }
          if (!placed) {
            // fallback: place at random (may overlap)
            const left = Math.floor(Math.random() * (maxLeft + 1));
            const top = Math.floor(Math.random() * (maxTop + 1));
            el.style.left = left + 'px'; el.style.top = top + 'px';
          }
          el.style.visibility = 'visible';
          _rotator.activeEls.push({ el: el });

          try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = (window.PopupAdapter._debugBadge.textContent || '') + ' • spawn'; } catch (e) { console.warn('[PA]', e); }

          // choose a random typewriter speed for this message (three possibilities)
          const defaultSpeeds = Array.isArray(opts && opts.typeSpeeds) && opts.typeSpeeds.length ? opts.typeSpeeds.slice(0,3) : [18, 28, 44];
          const chosenSpeed = defaultSpeeds[Math.floor(Math.random() * defaultSpeeds.length)];
          const localCharDelay = Number(chosenSpeed) || charDelay || 28;
          // typewriter
          let i = 0;
          function tick() {
            if (!_rotator.running) { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) { console.warn('[PA]', e); } ; resolve(); return; }
            if (i < text.length) {
              // append into the textHolder to preserve the dot
              const th = el.querySelector('.pm-rot-text');
              if (th) th.textContent = (th.textContent || '') + text.charAt(i);
              i += 1;
              const t = setTimeout(tick, localCharDelay);
              _rotator.timers.push(t);
            } else {
              // fully written -> wait hold then delete in reverse (typewriter delete)
              const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              const deleteSpeed = (opts && opts.deleteSpeed) ? Number(opts.deleteSpeed) : 28;
              const effectiveDeleteSpeed = prefersReduced ? 8 : Math.max(8, deleteSpeed);
              let exitEffect = (opts && opts.exitEffect) ? String(opts.exitEffect) : null;
              if (!exitEffect && window.PopupAdapter && window.PopupAdapter._defaultExitEffect) exitEffect = String(window.PopupAdapter._defaultExitEffect);
              if (!exitEffect) exitEffect = 'reverse';
              const holdTimer = setTimeout(() => {
                try {
                  // respects reduced motion preference
                  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) { console.warn('[PA]', e); }
                    _rotator.activeEls = _rotator.activeEls.filter(a => a.el !== el);
                    resolve();
                    return;
                  }

                  if (exitEffect === 'wipe') {
                    // create inner wrapper and animate it sliding left + fade
                    try {
                      const th = el.querySelector('.pm-rot-text');
                      const curText = th ? (th.textContent || '') : '';
                      if (th) th.textContent = '';
                      const inner = document.createElement('span');
                      inner.className = 'pm-inner-wipe';
                      inner.textContent = curText;
                      Object.assign(inner.style, {
                        display: 'inline-block',
                        filter: 'blur(0px)',
                        transition: 'filter 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms ease-out',
                        willChange: 'filter, opacity',
                        opacity: '1'
                      });
                      // append the inner wipe into the text holder so dot remains
                      const th2 = el.querySelector('.pm-rot-text');
                      if (th2) th2.appendChild(inner);
                      else el.appendChild(inner);
                      // force reflow
                      void inner.offsetWidth;
                      // trigger blur+fade in-place: blur increases while opacity falls
                      inner.style.filter = 'blur(6px)';
                      inner.style.opacity = '0';
                      let finished = false;
                      const onEnd = () => {
                        if (finished) return; finished = true;
                        try { inner.removeEventListener('transitionend', onEnd); } catch (e) { console.warn('[PA]', e); }
                        try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) { console.warn('[PA]', e); }
                        _rotator.activeEls = _rotator.activeEls.filter(a => a.el !== el);
                        resolve();
                      };
                      inner.addEventListener('transitionend', onEnd);
                      // fallback guard
                      const fb = setTimeout(() => { onEnd(); }, 480);
                      _rotator.timers.push(fb);
                      return;
                    } catch (e) { try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (ee) {} ; resolve(); return; }
                  }

                  // fallback / default: reverse deletion (typewriter reverse)
                  (function delTick() {
                    try {
                      if (!_rotator.running) { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) { console.warn('[PA]', e); } ; resolve(); return; }
                      const th = el.querySelector('.pm-rot-text');
                      const cur = th ? (th.textContent || '') : '';
                      if (cur.length === 0) {
                        try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) { console.warn('[PA]', e); }
                        _rotator.activeEls = _rotator.activeEls.filter(a => a.el !== el);
                        resolve();
                        return;
                      }
                      // remove last char from holder
                      if (th) th.textContent = cur.substring(0, cur.length - 1);
                      const dt = setTimeout(delTick, effectiveDeleteSpeed);
                      _rotator.timers.push(dt);
                    } catch (e) { try { el.parentNode && el.parentNode.removeChild(el); } catch (ee) {} ; resolve(); }
                  })();
                } catch (e) { try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (ee) {} ; resolve(); }
              }, hold);
              _rotator.timers.push(holdTimer);
            }
          }
          tick();
        } catch (e) { resolve(); }
      });
    }

    // spawn messages at regular intervals (allow multiple simultaneously)
    function spawnOne() {
      if (!_rotator.running) return;
      if (idx >= list.length) {
        if (loop) { shuffle(list); idx = 0; }
        else { stopThemeMessages(); return; }
      }
      const item = list[idx] || { text: '', theme: null };
      idx += 1;
      // start the typewriter for this item without waiting for previous ones
      showTypewriterText(item.text, item.theme).catch(() => {});
      // schedule next spawn with small jitter to avoid exact simultaneous starts
      const base = spawnInterval;
      const j = Math.floor(Math.random() * jitter);
      const nextDelay = Math.max(40, base + j - Math.floor(j/2));
      const t = setTimeout(spawnOne, nextDelay);
      _rotator.timers.push(t);
    }
    // initial small delay before first spawn so popup settles
    const initial = setTimeout(spawnOne, 80 + Math.floor(Math.random() * 80));
    _rotator.timers.push(initial);

    return true;
  }

  // Export API
  window.PopupAdapter = window.PopupAdapter || {};
  // default exit effect: can be overridden by callers via opts.exitEffect
  if (window.PopupAdapter._defaultExitEffect === undefined) window.PopupAdapter._defaultExitEffect = 'blur';
  window.PopupAdapter.showThemeChoice = showThemeChoice;
  window.PopupAdapter.showTirageChoicePopup = showTirageChoicePopup;
  window.PopupAdapter.showTirageDisplay = showTirageDisplay;
  window.PopupAdapter._rawMessages = rawMessages;
  // expose rotator controls
  window.PopupAdapter.playThemeMessages = playThemeMessages;
  window.PopupAdapter.stopThemeMessages = stopThemeMessages;

  // Debug helper: show/hide a 1px vertical center guide to verify horizontal centering of popups
  window.PopupAdapter.showCenterGuide = function (on) {
    try {
      let g = document.getElementById('pa-center-guide');
      if (!on) {
        if (g && g.parentNode) g.parentNode.removeChild(g);
        return;
      }
      if (!g) {
        g = document.createElement('div');
        g.id = 'pa-center-guide';
        Object.assign(g.style, {
          position: 'fixed',
          left: '50%',
          top: '0',
          bottom: '0',
          width: '1px',
          background: 'rgba(255,0,0,0.85)',
          zIndex: 2147483647,
          pointerEvents: 'none'
        });
        document.body.appendChild(g);
      }
    } catch (e) { /* ignore */ }
  };

  // Diagnostic: measure interpretation frame alignment vs viewport center
  window.PopupAdapter.measureInterpretationAlignment = function (showMarkers) {
    try {
      const frame = document.getElementById('pa-last-interpretation-frame') || (window.PopupAdapter && window.PopupAdapter._lastInterpFrame);
      if (!frame) { console && console.warn && console.warn('[PopupAdapter] No interpretation frame found (_lastInterpFrame missing)'); return null; }
      const r = frame.getBoundingClientRect();
      const frameCenter = r.left + (r.width / 2);
      const viewCenter = window.innerWidth / 2;
      const offsetPx = Math.round(frameCenter - viewCenter);
      const pxPerCm = 37.7952755906; // approx CSS px per cm
      const offsetCm = +(offsetPx / pxPerCm).toFixed(2);
      console.log('[PopupAdapter] interpretation frame center:', Math.round(frameCenter), 'viewport center:', Math.round(viewCenter), 'offsetPx:', offsetPx, 'offsetCm:', offsetCm);
      if (showMarkers === undefined) showMarkers = true;
      // draw a green guide at the frame center
      if (showMarkers) {
        // remove existing guide
        try { const old = document.getElementById('pa-frame-center-guide'); if (old && old.parentNode) old.parentNode.removeChild(old); } catch (e) { console.warn('[PA]', e); }
        const g = document.createElement('div');
        g.id = 'pa-frame-center-guide';
        Object.assign(g.style, {
          position: 'fixed',
          left: Math.round(frameCenter) + 'px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'rgba(0,255,0,0.9)',
          zIndex: 2147483646,
          pointerEvents: 'none'
        });
        document.body.appendChild(g);
      }
      return { offsetPx: offsetPx, offsetCm: offsetCm, frameCenter: frameCenter, viewCenter: viewCenter };
    } catch (e) { console && console.warn && console.warn('[PopupAdapter] measure error', e); return null; }
  };

  // Return heights for the interpretation viewport and its content (in pixels).
  // Useful to inspect opening height (viewport) vs final content height (queue.scrollHeight).
  window.PopupAdapter.getInterpretationHeights = function () {
    try {
      const frame = document.getElementById('pa-last-interpretation-frame') || (window.PopupAdapter && window.PopupAdapter._lastInterpFrame);
      if (!frame) return null;
      const viewport = frame.querySelector && (frame.querySelector('.pa-interpretation-viewport') || frame.querySelector('#ia-interpretation-content'));
      // queue is the inner element holding lines
      const queue = viewport && viewport.querySelector ? (viewport.querySelector('div') || null) : null;
      const viewportHeight = viewport ? (viewport.clientHeight || parseInt(window.getComputedStyle(viewport).height || '0', 10)) : null;
      const contentHeight = queue ? (queue.scrollHeight || queue.offsetHeight || null) : null;
      return { viewportHeight: viewportHeight, contentHeight: contentHeight };
    } catch (e) { console && console.warn && console.warn('[PopupAdapter] getInterpretationHeights error', e); return null; }
  };

  // Reapply last deck popup size (width/height) to a given element or wrapper.
  window.PopupAdapter.reapplyLastDeckSize = function (el) {
    try {
      const last = (window.PopupAdapter && window.PopupAdapter._lastDeckPopupSize) ? window.PopupAdapter._lastDeckPopupSize : null;
      const node = el || null;
      if (!last || !node) return false;
      try { node.style.minWidth = last.width + 'px'; } catch (e) { console.warn('[PA]', e); }
      try { node.style.width = last.width + 'px'; } catch (e) { console.warn('[PA]', e); }
      try { node.style.minHeight = last.height + 'px'; } catch (e) { console.warn('[PA]', e); }
      try { node.style.height = last.height + 'px'; } catch (e) { console.warn('[PA]', e); }
      return true;
    } catch (e) { return false; }
  };

  window.PopupAdapter.clearCenterGuides = function () { try { const a = document.getElementById('pa-center-guide'); if (a && a.parentNode) a.parentNode.removeChild(a); const b = document.getElementById('pa-frame-center-guide'); if (b && b.parentNode) b.parentNode.removeChild(b); } catch (e) { console.warn('[PA]', e); } };

  

  if (document.readyState === 'complete' || document.readyState === 'interactive') attachHeaderHandlers();
  else document.addEventListener('DOMContentLoaded', attachHeaderHandlers);

})();

