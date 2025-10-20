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
      (document.head || document.documentElement).appendChild(s);
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
        try { document.documentElement.style.overflow = 'hidden'; } catch (e) {}
        try { document.body.style.overflow = 'hidden'; } catch (e) {}
        try { document.body.classList.add('pa-popup-open'); } catch (e) {}
      } else {
        try { document.documentElement.style.overflow = ''; } catch (e) {}
        try { document.body.style.overflow = ''; } catch (e) {}
        try { document.body.classList.remove('pa-popup-open'); } catch (e) {}
      }
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
      const selectors = ['.header-ia', '#header-ia', '[data-ia-button]'];
      selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el && !el.dataset.popupAdapterAttached) {
          el.addEventListener('click', (ev) => { try { showThemeChoice(); } catch (_) {} if (ev && ev.preventDefault) ev.preventDefault(); });
          el.dataset.popupAdapterAttached = '1';
        }
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
  // small left padding so content is slightly inset but tight to the left
  container.style.padding = '12px 12px 12px 4px';
  // hide overflow to remove internal scrollbars
  container.style.overflow = 'hidden';

    const title = document.createElement('h2');
    title.className = 'pm-popup-title';
    title.textContent = 'Choix du thème';
    container.appendChild(title);

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
  Object.assign(qInput.style, { width: '92%', minHeight: '56px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' });
    // action buttons container
    const qActions = document.createElement('div');
    Object.assign(qActions.style, { marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'center' });
    const btnValider = document.createElement('button');
    btnValider.textContent = 'Valider';
    Object.assign(btnValider.style, { padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' });
    const btnPasser = document.createElement('button');
    btnPasser.textContent = 'Passer';
    Object.assign(btnPasser.style, { padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: '#eee' });
    qActions.appendChild(btnValider);
    qActions.appendChild(btnPasser);
  questionWrap.appendChild(qInput);
    questionWrap.appendChild(qActions);

    // selected theme tracker
    let _selectedTheme = null;
    const themeButtons = {};

    themes.forEach(t => {
      const b = document.createElement('button');
      b.className = 'theme-choice-btn';
      b.textContent = t;
      const info = themeColors[t] || { bg: '#666', color: '#fff' };
      Object.assign(b.style, {
        background: info.bg,
        color: info.color,
        border: 'none',
        padding: '10px 14px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '700'
      });
      // store reference
      themeButtons[t] = b;
      b.addEventListener('click', () => {
        try {
          // stop any running rotation immediately so only theme messages will run after validation
          try { if (typeof stopThemeMessages === 'function') stopThemeMessages(); } catch (e) {}
          // reveal question area and focus input
          _selectedTheme = t;
          questionWrap.style.display = 'flex';
          qInput.value = '';
          setTimeout(() => { try { qInput.focus(); } catch (e) {} }, 60);
          // visually mark selected but keep buttons active (less vivid): selected stays normal, others dim
          try {
            Object.keys(themeButtons).forEach(k => {
              try { themeButtons[k].style.opacity = (k === t) ? '1' : '0.6'; } catch (e) {}
            });
          } catch (e) {}
          // start playing theme messages here (Step 2): show rotating messages for the selected theme
          try {
            const themeMsgs = (window.PopupAdapter && window.PopupAdapter._autoThemeMessages && window.PopupAdapter._autoThemeMessages[t]) || rawMessages[t] || [];
            // small delay so the UI settles
            setTimeout(() => {
              try {
                if (themeMsgs && themeMsgs.length && typeof playThemeMessages === 'function') {
                  playThemeMessages(t, themeMsgs, { exitEffect: (window.PopupAdapter && window.PopupAdapter._defaultExitEffect) || 'wipe', loop: true });
                }
              } catch (e) {}
            }, 160);
          } catch (e) {}
        } catch (_) {}
      });
      row.appendChild(b);
    });
    container.appendChild(row);

    // inert message frame (kept empty intentionally) — will be populated by external code via PopupAdapter.setThemeMessages
    const msgBox = document.createElement('div');
    msgBox.className = 'pm-popup-msgbox';
    Object.assign(msgBox.style, {
      marginTop: '18px',
      minHeight: '160px',
      padding: '12px',
      borderRadius: '8px',
      background: 'transparent',
      overflow: 'hidden',
      position: 'relative',
      width: '100%'
    });
  // small visible debug badge to surface internal state without DevTools
  const debugBadge = document.createElement('div');
  debugBadge.className = 'pm-debug-badge';
  Object.assign(debugBadge.style, {
    position: 'absolute',
    left: '8px',
    bottom: '8px',
    padding: '6px 8px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '6px',
    zIndex: '9999',
    pointerEvents: 'none'
  });
  debugBadge.textContent = 'debug: idle';
  // position relative to msgBox so it stays inside the popup
  msgBox.appendChild(debugBadge);
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
    const clearThemeMessages = function () { try { msgBox.innerHTML = ''; } catch (e) {} };

  const handle = openPopup(container);
  // pre-populate with a fixed test message as requested
  try { setThemeMessages([ 'test message' ]); } catch (e) { /* ignore */ }
    // attach helpers to global API so external code can call them
    window.PopupAdapter = window.PopupAdapter || {};
    window.PopupAdapter.setThemeMessages = setThemeMessages;
    window.PopupAdapter.clearThemeMessages = clearThemeMessages;
    // also expose a reference to the box (read-only)
    window.PopupAdapter._lastThemeMsgBox = msgBox;
  // expose debug badge for runtime updates
  window.PopupAdapter._debugBadge = debugBadge;
  // expose theme button refs so stopThemeMessages can reset visuals
  window.PopupAdapter._themeButtons = themeButtons;

    // helper to start playing messages for a specific theme
    function startThemePlay(themeKey, questionText) {
      try {
        try { if (typeof stopThemeMessages === 'function') stopThemeMessages(); } catch (e) {}
        const msgs = (window.PopupAdapter && window.PopupAdapter._autoThemeMessages && window.PopupAdapter._autoThemeMessages[themeKey]) || rawMessages[themeKey] || [];
  console && console.log && console.log('[PopupAdapter] startThemePlay', themeKey, 'msgs=', msgs && msgs.length);
  try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = 'theme=' + themeKey + ' msgs=' + (msgs && msgs.length || 0); } catch (e) {}
        // Instead of immediately playing the rotating theme messages, replace the message box
        // with two panels offering a choice: Tirage 3 cartes or Tirage 5 cartes.
        try {
          if (window.PopupAdapter && window.PopupAdapter._lastThemeMsgBox) {
            const box = window.PopupAdapter._lastThemeMsgBox;
            box.innerHTML = ''; // clear existing messages
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
              btn.addEventListener('mouseenter', function(){ try { this.style.transform = 'translateY(-3px)'; this.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)'; } catch(e){} });
              btn.addEventListener('mouseleave', function(){ try { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)'; } catch(e){} });
              btn.addEventListener('click', function () {
                try {
                  // open the tirage display for the chosen count
                  // open the full 22-card deck popup and mark the chosen draw count
                  if (typeof showDeckPopup === 'function') {
                      showDeckPopup(count);
                  } else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') {
                      window.PopupAdapter.showDeckPopup(count);
                  } else if (typeof showTirageDisplay === 'function') {
                      // fallback: open tirage with given count
                      showTirageDisplay(count);
                  }
                } catch (e) { console && console.warn && console.warn('open tirage error', e); }
              });
              p.appendChild(h); p.appendChild(para); p.appendChild(btn);
              return p;
            }

            // Panel A: Tirage 3 cartes — descriptive paragraph and choose button
            const panelThree = document.createElement('div');
            Object.assign(panelThree.style, {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: '1 1 300px',
              minWidth: '260px',
              maxWidth: '520px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.48))',
              borderRadius: '8px',
              padding: '12px',
              boxSizing: 'border-box',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 22px rgba(0,0,0,0.5)'
            });
            const p3h = document.createElement('h4'); p3h.textContent = 'Tirage 3 cartes';
            Object.assign(p3h.style, { margin: '0 0 8px 0', fontSize: '16px', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontWeight: '600' });
            const p3para = document.createElement('div');
            p3para.innerHTML = `Le tirage à trois cartes offre une lecture claire et rapide d’une situation. Il met en lumière le passé ou le contexte, le défi présent et la tendance à venir. Cette méthode simple permet d’obtenir une réponse précise tout en ouvrant une réflexion plus profonde. Chaque carte dialogue avec les autres pour révéler les influences en jeu et les pistes d’évolution possibles. C’est un tirage idéal pour éclairer une question ciblée ou prendre une décision en conscience.`;
            Object.assign(p3para.style, { fontSize: '13px', marginBottom: '10px', color: 'rgba(255,255,255,0.95)', flex: '1 1 auto', fontFamily: '"Quicksand", "Inter", Arial, sans-serif' });
            const p3btn = document.createElement('button'); p3btn.textContent = 'Choisir 3 cartes';
            Object.assign(p3btn.style, { padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'linear-gradient(90deg,#ff7a59,#ffb86b)', color: '#fff', fontWeight: '600', boxShadow: '0 5px 12px rgba(0,0,0,0.28)', transition: 'transform 160ms ease, box-shadow 160ms ease', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontSize: '0.85rem', display: 'inline-block', whiteSpace: 'nowrap', alignSelf: 'flex-start' });
            p3btn.addEventListener('mouseenter', function(){ try { this.style.transform = 'translateY(-3px)'; this.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)'; } catch(e){} });
            p3btn.addEventListener('mouseleave', function(){ try { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)'; } catch(e){} });
            p3btn.addEventListener('click', function () { try { if (typeof showDeckPopup === 'function') showDeckPopup(3); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(3); else if (typeof showTirageDisplay === 'function') showTirageDisplay(3); } catch (e) { console && console.warn && console.warn('open tirage error', e); } });
            panelThree.appendChild(p3h); panelThree.appendChild(p3para); panelThree.appendChild(p3btn);
            // Panel B: 5-card tirage descriptive panel (longer explanatory paragraph provided)
            const panelFive = document.createElement('div');
            Object.assign(panelFive.style, {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flex: '1 1 300px',
              minWidth: '260px',
              maxWidth: '520px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0.48))',
              borderRadius: '8px',
              padding: '12px',
              boxSizing: 'border-box',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 8px 22px rgba(0,0,0,0.5)'
            });
            const p5h = document.createElement('h4'); p5h.textContent = 'Tirage 5 cartes';
            Object.assign(p5h.style, { margin: '0 0 8px 0', fontSize: '16px', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontWeight: '600' });
            const p5para = document.createElement('div');
            p5para.innerHTML = 'Le tirage à cinq cartes offre une vision complète d’une situation en explorant plusieurs niveaux d\’influence. Chaque carte éclaire un aspect distinct : les forces favorables, les obstacles, les causes profondes, la tendance à venir et la synthèse ou le conseil final. Ce tirage met en lumière le jeu des équilibres, des tensions et des prises de conscience nécessaires pour avancer. Plus détaillé qu’un tirage simple, il permet d’obtenir une lecture nuancée et stratégique, alliant intuition et analyse.';
            Object.assign(p5para.style, { fontSize: '13px', marginBottom: '10px', color: 'rgba(255,255,255,0.95)', flex: '1 1 auto', fontFamily: '"Quicksand", "Inter", Arial, sans-serif' });
            const p5btn = document.createElement('button'); p5btn.textContent = 'Choisir 5 cartes';
            Object.assign(p5btn.style, { padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'linear-gradient(90deg,#ff7a59,#ffb86b)', color: '#fff', fontWeight: '600', boxShadow: '0 5px 12px rgba(0,0,0,0.28)', transition: 'transform 160ms ease, box-shadow 160ms ease', fontFamily: '"Quicksand", "Inter", Arial, sans-serif', fontSize: '0.85rem', display: 'inline-block', whiteSpace: 'nowrap', alignSelf: 'flex-start' });
            p5btn.addEventListener('mouseenter', function(){ try { this.style.transform = 'translateY(-3px)'; this.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)'; } catch(e){} });
            p5btn.addEventListener('mouseleave', function(){ try { this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)'; } catch(e){} });
            p5btn.addEventListener('click', function () { try { if (typeof showDeckPopup === 'function') showDeckPopup(5); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(5); else if (typeof showTirageDisplay === 'function') showTirageDisplay(5); } catch (e) { console && console.warn && console.warn('open tirage error', e); } });
            panelFive.appendChild(p5h); panelFive.appendChild(p5para); panelFive.appendChild(p5btn);

            grid.appendChild(panelThree); grid.appendChild(panelFive);
            box.appendChild(grid);
            try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = 'theme=' + themeKey + ' choose tirage'; } catch (e) {}
          }
        } catch (e) { /* ignore UI build errors */ }
        // ensure selected button stays normal while others are dimmed
        try {
          if (window.PopupAdapter && window.PopupAdapter._themeButtons) {
            Object.keys(window.PopupAdapter._themeButtons).forEach(k => { try { window.PopupAdapter._themeButtons[k].style.opacity = (k === themeKey) ? '1' : '0.6'; } catch (e) {} });
          }
        } catch (e) {}
        if (typeof onDone === 'function') {
          try { onDone(themeKey, questionText); } catch (e) {}
        }
      } catch (e) { /* ignore */ }
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
          setTimeout(() => { try { playThemeMessages('global', msgs, { delay: 1800, exitEffect: 'wipe' }); } catch (e) {} }, 120);
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
      c.addEventListener('click', () => { try { if (typeof onDone === 'function') onDone(i + 1); } catch (_) {} });
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
  stage.style.display = 'flex';
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
      } catch (e) {}
    });
  } catch (e) {}

    return popupHandle;
  }

  // New: show full deck popup with 22 slots pre-filled with verso image
  function showDeckPopup(chosenCount, opts) {
    try {
      opts = opts || {};
      const total = 22;
      // build container ourselves so we can tightly control dimensions
  const container = document.createElement('div');
  container.style.textAlign = 'center';
  // small left padding so content is slightly inset but tight to the left
  container.style.padding = '18px 18px 18px 4px';
  // request a larger popup frame from PopupManager (if present)
  try { container.dataset.maxWidth = Math.max(720, parseInt(String(getMaxFrameWidth()).replace(/[^0-9]/g,''),10)) + 'px'; } catch (e) {}
  // also set min visual dimensions so a simple container fallback looks bigger
  container.style.minWidth = '680px';
  container.style.minHeight = '520px';

      // dynamic title that shows remaining cards to draw
      const title = document.createElement('h3');
      title.className = 'pm-popup-title';
      // initialize remaining count from chosenCount (fallback to 0)
      const initialRemaining = (Number(chosenCount) === 3 || Number(chosenCount) === 5) ? Number(chosenCount) : 0;
      let remaining = initialRemaining;
      // create title with a span for the numeric counter so we can animate it
      const numSpan = document.createElement('span');
      numSpan.className = 'pa-remaining-num';
      numSpan.textContent = String(remaining);
      function updateTitle() {
        try {
          // build title: Tirez x cartes  (no quotes around x)
          if (remaining > 0) {
            title.textContent = 'Tirez ';
            title.appendChild(numSpan);
            title.appendChild(document.createTextNode(' cartes'));
          } else {
            title.textContent = 'Tirage terminé';
          }
          // animate the number: quick scale up then back
          try {
            const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!prefersReduced && remaining > 0) {
              numSpan.classList.remove('pa-remaining-pulse');
              // force reflow
              void numSpan.offsetWidth;
              numSpan.classList.add('pa-remaining-pulse');
            }
          } catch (e) {}
          // update numeric text
          try { numSpan.textContent = String(remaining); } catch (e) {}
          // expose remaining for external code
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._remainingCount = remaining; } catch (e) {}
        } catch (e) {}
      }
      // ensure we inject small styles for the number pulse
      try {
        if (!document.getElementById('pa-remaining-styles')) {
          const st = document.createElement('style');
          st.id = 'pa-remaining-styles';
          st.textContent = `
            .pa-remaining-num { font-weight: 700; margin: 0 6px; display: inline-block; transition: transform 220ms ease; }
            .pa-remaining-pulse { transform: scale(1.22); }
            @media (prefers-reduced-motion: reduce) { .pa-remaining-num, .pa-remaining-pulse { transition: none !important; transform: none !important; } }
          `;
          (document.head || document.documentElement).appendChild(st);
        }
      } catch (e) {}
      updateTitle();
      container.appendChild(title);

  const stage = document.createElement('div');
  stage.style.display = 'flex';
  // align grid to the left with a small offset so cards are 'collées' à gauche
  stage.style.justifyContent = 'flex-start';
  // more vertical padding to add breathing room above/below the grid
  stage.style.padding = '12px 0 12px 0';
  // no left padding — cards should hug the left edge
  stage.style.paddingLeft = '0px';
  // prevent stage from creating scrollbars
  stage.style.overflow = 'hidden';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  // gap is configured later (depends on computed `gap` variable)
  grid.style.gap = '0px';
  // use border-box so width accounts for padding if we add any later
  grid.style.boxSizing = 'border-box';
  // add small bottom margin so cards don't touch the popup edge
  grid.style.marginBottom = '12px';

      // compute available popup width and height and force 4-row layout (6,6,6,4)
      const maxW = parseInt(String(getMaxFrameWidth()).replace(/[^0-9]/g, ''), 10) || Math.max(420, window.innerWidth - 40);
      const reserved = (title.getBoundingClientRect ? Math.round(title.getBoundingClientRect().height) : 56) + 24;
      const availH = Math.max(320, window.innerHeight - reserved - 40);

  // reduce the gap to make cards appear closer and allow a larger enlarge factor
  const gap = 2; // tighter spacing between cards
  const enlargeFactor = 1.14; // slightly larger proportional growth for visual weight
  // tuning: increase width and set heightShrink to 1 so cards use full computed height
  const widthBoost = 1.12; // widen cards by ~12%
  const heightShrink = 1.0; // keep full height to balance vertical spacing
      const cardRatio = 3 / 2;
      const cols = 6;
      const rows = 4;

    // compute card size so 6x4 volume is used as base, then attempt a slight enlargement
    const baseCardW = Math.floor((maxW - (cols - 1) * gap) / cols);
    // desired width attempts to apply enlargeFactor then widthBoost
    const desiredW = Math.floor(baseCardW * enlargeFactor * widthBoost);
    // fallback to base if overflow
    let cardW = desiredW;
    let tentativeGridW = (cardW * cols) + ((cols - 1) * gap);
    if (tentativeGridW > maxW) {
      cardW = baseCardW;
      tentativeGridW = (cardW * cols) + ((cols - 1) * gap);
      // still if base overflows (unlikely), force a fit
      if (tentativeGridW > maxW) {
        cardW = Math.floor((maxW - (cols - 1) * gap) / cols);
      }
    }
    // apply a reduced height multiplier to tighten the fit inside the frame
    let cardH = Math.floor(cardW * cardRatio * heightShrink);
    // compute grid volume exact sizes
    let gridW = (cardW * cols) + ((cols - 1) * gap);
    let gridH = (cardH * rows) + ((rows - 1) * gap);
    // if vertical space is limited, scale both dimensions down proportionally
    if (gridH > availH) {
      const scale = Math.max(0.45, (availH / gridH) * 0.95);
      cardW = Math.max(36, Math.floor(cardW * scale));
      cardH = Math.max(48, Math.floor(cardW * cardRatio));
      gridW = (cardW * cols) + ((cols - 1) * gap);
      gridH = (cardH * rows) + ((rows - 1) * gap);
    }

  // breathing space around the grid (padding inside popup)
  const horizontalPadding = 48; // left + right total
    const verticalPadding = 120; // includes title + top/bottom spacing

    // set grid gap according to computed gap and set grid and stage sizes explicitly
    try { grid.style.gap = (typeof gap === 'number' ? gap : 4) + 'px'; } catch (e) {}
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cardW}px)`;
    grid.style.gridAutoRows = `${cardH}px`;
  grid.style.width = gridW + 'px';
    
    grid.style.height = gridH + 'px';
    // hide any overflow to avoid scrollbars
    grid.style.overflow = 'hidden';

      // create slots and fill with verso image; center last row by starting its first slot at column 2
      // We'll also prepare a staggered entrance animation for the verso images: start blurred/faded/scaled
      // and animate to sharp/opaque/normal. Respect prefers-reduced-motion.
      // Insert a small style block (id'd) to control animation timing where needed.
      try {
        if (!document.getElementById('pa-deck-entrance-styles')) {
          const st = document.createElement('style');
          st.id = 'pa-deck-entrance-styles';
          st.textContent = `
            .pa-deck-entrance { filter: blur(6px); opacity: 0; transform: scale(0.98) translateY(6px); transition: filter 420ms ease, opacity 420ms ease, transform 420ms ease; }
            .pa-deck-entrance.pa-deck-entrance--visible { filter: blur(0px); opacity: 1; transform: scale(1) translateY(0px); }
            @media (prefers-reduced-motion: reduce) {
              .pa-deck-entrance { transition: none !important; filter: none !important; opacity: 1 !important; transform: none !important; }
            }
          `;
          (document.head || document.documentElement).appendChild(st);
        }
      } catch (e) {}
  // fan option: when opts.fan === true (or a number), apply a small random rotation (-angle..+angle)
  // and a subtle translateY to create an 'eventail' effect. Respect prefers-reduced-motion.
  const prefersReduced = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fanEnabled = !!opts.fan && !prefersReduced;
  // fanAngleMax can be a number (degrees) provided via opts.fan or default to 8 degrees
  const fanAngleMax = (typeof opts.fan === 'number' && isFinite(opts.fan)) ? Math.abs(opts.fan) : 8;
  // store per-slot fan angles for debugging/external use
  const fanAngles = [];
      for (let i = 0; i < total; i++) {
        const slot = document.createElement('div');
        slot.className = 'pm-card-slot';
        Object.assign(slot.style, {
          overflow: 'hidden',
          // match the image rounding so no background peeks through
          borderRadius: '12px',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          // center the image inside the slot (image fills the slot)
          justifyContent: 'center',
          // remove any internal padding so the image touches the slot edges
          padding: '0px',
          boxSizing: 'border-box',
          // make the slot slightly larger to accommodate reduced inter-card gap
          width: cardW + 'px',
          height: cardH + 'px'
        });
        slot.dataset.slotIndex = i;
        // if first of last row, offset to center (for 6-columns layout and 22 cards)
        const firstOfLastRowIndex = cols * (rows - 1); // 6 * 3 = 18
        if (i === firstOfLastRowIndex && (total % cols) !== 0) {
          // start at column 2 so 4 cards sit in columns 2..5 (centered)
          try { slot.style.gridColumnStart = '2'; } catch (e) {}
        }
        // fill image
          try {
          const img = document.createElement('img');
          img.src = './public/img/majors/verso.webp';
          img.alt = 'verso';
          // ensure the image fills the slot exactly (no inset) and includes borders in sizing
          try { slot.style.padding = '0px'; slot.style.boxSizing = 'border-box'; } catch (e) {}
          // image fills the slot's inner box exactly and includes borders in sizing
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.boxSizing = 'border-box';
          img.style.objectFit = 'contain';
          // rounded corners to match the card aesthetic (no border/shadow behind images)
          img.style.borderRadius = '12px';
          img.style.display = 'block';
          img.style.background = 'transparent';
          // ensure the slot clips overflow so rounded corners show correctly
          slot.style.overflow = 'hidden';
          // entrance animation class
          img.classList.add('pa-deck-entrance');
          slot.appendChild(img);
        } catch (e) {}
        // apply optional fan rotation/offset here (small random per-slot angle + subtle translate)
        if (fanEnabled) {
          // angle between -fanAngleMax and +fanAngleMax
          const angle = (Math.random() * 2 * fanAngleMax) - fanAngleMax;
          // slight translate to enhance the fanned look (max 6px vertically, and small horizontal jitter)
          const ty = Math.round((Math.random() * 6) - 3);
          const tx = Math.round((Math.random() * 6) - 3);
          // apply transform while keeping the slot centered in its grid cell
          try {
            slot.style.transformOrigin = '50% 50%';
            slot.style.transition = 'transform 320ms ease, box-shadow 260ms ease';
            // use translate then rotate so rotation pivots around the center
            slot.style.transform = `translate(${tx}px, ${ty}px) rotate(${angle}deg)`;
          } catch (e) {}
          fanAngles.push({ index: i, angle: angle, tx: tx, ty: ty });
        } else {
          fanAngles.push({ index: i, angle: 0, tx: 0, ty: 0 });
        }

        grid.appendChild(slot);
      }

  stage.appendChild(grid);
  container.appendChild(stage);

  // compute desired popup frame dimensions based on grid + breathing
  const desiredWidth = Math.min(window.innerWidth - 40, gridW + horizontalPadding);
  const desiredHeight = Math.min(window.innerHeight - 80, gridH + verticalPadding);
  try { container.style.width = desiredWidth + 'px'; } catch (e) {}
  try { container.style.minHeight = desiredHeight + 'px'; } catch (e) {}

  const popupHandle = openPopup(container);
  // ensure page hides scrollbars while this popup is active (best-effort)
  try { setGlobalNoScroll(true); } catch (e) {}

  // If PopupManager returned a wrapper element, attempt to force larger visual
      // dimensions on the wrapper. If that still results in a too-small visual
      // frame (common when page modal managers enforce sizing), create a fallback
      // absolute-positioned overlay that guarantees the requested size and position.
      try {
        const wrapper = (popupHandle && popupHandle.nodeType === 1) ? popupHandle : (popupHandle && popupHandle.el) ? popupHandle.el : null;
        const target = wrapper || container;
        if (target && target.style) {
          try { target.style.minWidth = Math.max(720, desiredWidth) + 'px'; } catch (e) {}
          try { target.style.width = Math.max(760, desiredWidth + 20) + 'px'; } catch (e) {}
          try { target.style.minHeight = Math.max(540, desiredHeight) + 'px'; } catch (e) {}
          try { target.style.height = 'auto'; } catch (e) {}
          try { if (target.parentNode && target.parentNode.style) { target.parentNode.style.minWidth = Math.max(720, desiredWidth) + 'px'; target.parentNode.style.width = Math.max(760, desiredWidth + 20) + 'px'; target.parentNode.style.minHeight = Math.max(540, desiredHeight) + 'px'; } } catch (e) {}
        }

        // after a tiny delay, check if the visual width is still too small; if so, create fallback overlay
            setTimeout(() => {
          try {
            const checkEl = wrapper || container;
            const rect = (checkEl && checkEl.getBoundingClientRect) ? checkEl.getBoundingClientRect() : { width: 0, height: 0 };
            if ((rect.width || 0) < Math.min(700, desiredWidth)) {
              // create overlay
              const overlay = document.createElement('div');
              overlay.className = 'pa-deck-overlay-fallback';
              Object.assign(overlay.style, {
                position: 'fixed',
                left: '50%',
        transform: 'translate(-50%,0)',
          top: '120px', // lower placement
                zIndex: 999999,
                background: 'rgba(255,255,255,0.02)',
                padding: '12px',
                borderRadius: '10px',
                boxShadow: '0 18px 60px rgba(0,0,0,0.6)',
          width: Math.min(960, desiredWidth + 80) + 'px',
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 160px)',
          overflow: 'hidden',
          boxSizing: 'border-box'
              });
              // add a close button
              const closeBtn = document.createElement('button');
              closeBtn.textContent = '×';
              Object.assign(closeBtn.style, { position: 'absolute', right: '10px', top: '6px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' });
              closeBtn.addEventListener('click', () => { try { document.body.removeChild(overlay); setGlobalNoScroll(false); try { document.body.style.overflowX = ''; } catch (e) {} } catch (e) {} });
              overlay.appendChild(closeBtn);
              // move our container inside overlay (detach from previous parent)
              try { if (container.parentNode) container.parentNode.removeChild(container); } catch (e) {}
              Object.assign(container.style, { width: '100%', minWidth: '640px', minHeight: '520px', padding: '12px 12px 12px 4px', overflow: 'hidden', boxSizing: 'border-box', maxWidth: '100%', maxHeight: '100%' });
              overlay.appendChild(container);
              // prevent the page from scrolling horizontally while overlay is open
              try { document.body.style.overflowX = 'hidden'; } catch (e) {}
              document.body.appendChild(overlay);
            }
          } catch (e) {}
        }, 120);
      } catch (e) {}

  // build a randomized mapping of the 22 major-arcana face images to the slots
      // so each time the deck popup opens the faces are shuffled and assigned
      const deckFaceNames = [
        '00-le-mat.webp','01-le-bateleur.webp','02-la-papesse.webp','03-limperatrice.webp','04-lempereur.webp','05-le-pape.webp',
        '06-lamoureux.webp','07-le-chariot.webp','08-la-justice.webp','09-lermite.webp','10-la-roue.webp','11-la-force.webp',
        '12-le-pendu.webp','13-larcane-sans-nom.webp','14-temperance.webp','15-le-diable.webp','16-la-maison-dieu.webp','17-letoile.webp',
        '18-la-lune.webp','19-le-soleil.webp','20-le-jugement.webp','21-le-monde.webp'
      ];
      // shuffle in-place
      function _shuffleArray(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
      const shuffledFaces = deckFaceNames.slice(); _shuffleArray(shuffledFaces);
      const deckMapping = new Array(total);
      for (let i = 0; i < total; i++) deckMapping[i] = './public/img/majors/' + shuffledFaces[i % shuffledFaces.length];

      // track selected cards in selection order so we can display them in the interpretation popup
      const selectedCards = [];

      // helper to open an interpretation popup showing the chosen cards and a placeholder interpretation frame
      function showInterpretationPopup(cards) {
        try {
          const interp = document.createElement('div');
          interp.style.textAlign = 'center';
          // use balanced padding on all sides so inner frames don't touch the popup edges
          interp.style.padding = '18px';
          try { interp.dataset.maxWidth = Math.max(720, parseInt(String(getMaxFrameWidth()).replace(/[^0-9]/g,''),10)) + 'px'; } catch (e) {}
          interp.style.minWidth = (container.style && container.style.minWidth) ? container.style.minWidth : '680px';
          interp.style.minHeight = (container.style && container.style.minHeight) ? container.style.minHeight : '520px';
          // ensure no scrollbars: content fits inside the popup and overflow is hidden
          interp.style.overflow = 'hidden';

          // Center the whole popup content using a centered column max-width
          // similar to the tirage-choice panels: use width 100% and limit maxWidth
          interp.style.display = 'block';
          interp.style.width = '100%';
          try { interp.style.maxWidth = getMaxFrameWidth(); } catch (e) {}
          interp.style.margin = '0 auto';
          interp.style.gap = '12px';
          // small padding so content doesn't touch popup borders
          interp.style.paddingTop = '10px';
          interp.style.paddingBottom = '10px';
          const h = document.createElement('h3'); h.className = 'pm-popup-title'; h.textContent = 'Interprétation du tirage'; interp.appendChild(h);

          // Placeholder interpretation frame — to be replaced by API results later
          const frame = document.createElement('div');
          // mark the frame for diagnostic access
          try { frame.id = 'pa-last-interpretation-frame'; } catch (e) {}
          // ensure the frame has explicit internal padding and a safe max-width so text won't touch popup edges
          Object.assign(frame.style, {
            minHeight: '140px',
            width: '100%',
            maxWidth: '760px',
            borderRadius: '10px',
            padding: '18px',
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))',
            color: '#111',
            margin: '12px auto',
            overflow: 'hidden',
            textAlign: 'center'
          });
          frame.textContent = 'Interprétation en cours...';
          interp.appendChild(frame);
          // expose reference for diagnostics
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastInterpFrame = frame; } catch (e) {}

          // action buttons directly under the interpretation frame
          const btnRow = document.createElement('div');
          btnRow.style.display = 'flex';
          btnRow.style.justifyContent = 'center';
          btnRow.style.gap = '10px';
          btnRow.style.marginBottom = '12px';

          const btnTirage = document.createElement('button'); btnTirage.textContent = 'Tirage';
          const btnSave = document.createElement('button'); btnSave.textContent = 'Enregistrer';
          const btnBack = document.createElement('button'); btnBack.textContent = 'Retour';
          [btnTirage, btnSave, btnBack].forEach(b => Object.assign(b.style, { padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: '#2b2b2b', color: '#fff' }));
          btnRow.appendChild(btnTirage); btnRow.appendChild(btnSave); btnRow.appendChild(btnBack);
          interp.appendChild(btnRow);

          // Show the selected cards below the buttons in larger format
          const chosenWrap = document.createElement('div');
          chosenWrap.style.display = 'flex';
          chosenWrap.style.flexWrap = 'wrap';
          chosenWrap.style.gap = '14px';
          chosenWrap.style.justifyContent = 'center';
          chosenWrap.style.alignItems = 'center';
          chosenWrap.style.overflow = 'hidden';
          // clamp the chosen cards container so cards don't push into popup edges and center it
          chosenWrap.style.maxWidth = '100%';
          chosenWrap.style.padding = '6px 12px';
          chosenWrap.style.margin = '0 auto';
          cards.forEach((c, idx) => {
            try {
              const cardBox = document.createElement('div');
              // even larger card display
              cardBox.style.width = '220px';
              cardBox.style.height = '330px';
              cardBox.style.borderRadius = '10px';
              cardBox.style.overflow = 'hidden';
              cardBox.style.boxSizing = 'border-box';
              cardBox.style.display = 'flex';
              cardBox.style.alignItems = 'center';
              cardBox.style.justifyContent = 'center';
              cardBox.style.background = 'transparent';
              cardBox.style.border = '1px solid rgba(0,0,0,0.06)';
              const im = document.createElement('img');
              im.src = c.src || c;
              im.alt = c.alt || ('carte-' + (c.index != null ? c.index : idx));
              im.style.width = '100%'; im.style.height = '100%'; im.style.objectFit = 'contain'; im.style.borderRadius = '8px';
              cardBox.appendChild(im);
              chosenWrap.appendChild(cardBox);
            } catch (e) {}
          });
          interp.appendChild(chosenWrap);

          // fetch and render interpretation from configured API (Cloudflare Workers)
          try {
            // ensure global API base is available for configuration
            window.PopupAdapter = window.PopupAdapter || {};
            // default to the deployed worker route used in this repo
            const defaultApi = 'https://api-opanoma.csebille.workers.dev/api/open-proxy';
            const apiBase = (window.PopupAdapter.apiBase && String(window.PopupAdapter.apiBase).trim()) ? String(window.PopupAdapter.apiBase).trim() : defaultApi;

            // payload expected by the worker: { cartes: [...], theme: '', question: '' }
            const payload = {
              cartes: cards.map(c => (c && c.src) ? c.src.split('/').pop() : (typeof c === 'string' ? c.split('/').pop() : c.name || c.id || c)),
              theme: (window.PopupAdapter && window.PopupAdapter.currentTheme) ? window.PopupAdapter.currentTheme : '',
              question: (window.PopupAdapter && window.PopupAdapter.currentQuestion) ? window.PopupAdapter.currentQuestion : ''
            };

            // create a content container inside the frame for scrollable results
            const content = document.createElement('div');
            content.id = 'ia-interpretation-content';
            content.style.maxHeight = '320px';
            content.style.overflow = 'auto';
            content.style.padding = '6px';
            content.style.boxSizing = 'border-box';
            content.style.textAlign = 'left';
            content.textContent = 'Chargement de l\'interprétation...';
            // clear previous simple text and append content
            frame.textContent = '';
            frame.appendChild(content);

            // call the API with POST JSON
            (async () => {
              try {
                const resp = await fetch(apiBase, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if (!resp.ok) {
                  const txt = await resp.text().catch(()=>resp.statusText||String(resp.status));
                  content.textContent = 'Erreur API: ' + txt;
                  console.warn('[PopupAdapter] Interpretation API error', resp.status, txt);
                  return;
                }
                // prefer HTML, fallback to JSON/text
                const ctype = (resp.headers.get('content-type') || '').toLowerCase();
                if (ctype.indexOf('text/html') !== -1) {
                  const html = await resp.text();
                  content.innerHTML = html;
                } else if (ctype.indexOf('application/json') !== -1) {
                  const j = await resp.json();
                  // if API returns { html: '...' } render HTML, else stringify
                  if (j && j.html) {
                    content.innerHTML = j.html;
                  } else if (j && j.text) {
                    content.textContent = j.text;
                  } else {
                    content.textContent = typeof j === 'string' ? j : JSON.stringify(j, null, 2);
                  }
                } else {
                  const txt = await resp.text();
                  content.textContent = txt;
                }
              } catch (err) {
                content.textContent = 'Erreur réseau lors de la récupération de l\'interprétation.';
                console.error('[PopupAdapter] fetchInterpretation failed', err);
              }
            })();
          } catch (e) {
            console.warn('[PopupAdapter] Could not launch interpretation fetch', e);
          }

          // wire button behaviors
          btnTirage.addEventListener('click', function () {
            try {
              // reopen a new deck with the same initial chosen count (if available)
              try { if (typeof showDeckPopup === 'function') showDeckPopup(initialRemaining || 3, { fan: true }); else if (window.PopupAdapter && typeof window.PopupAdapter.showDeckPopup === 'function') window.PopupAdapter.showDeckPopup(initialRemaining || 3, { fan: true }); } catch (e) {}
            } catch (e) {}
          });

          btnSave.addEventListener('click', function () {
            try {
              // default save behavior: download a JSON file with the selection
              try {
                const payload = { date: (new Date()).toISOString(), selection: cards };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tirage-' + (new Date()).toISOString().replace(/[:.]/g, '-') + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) {
                // fallback: expose via callback
                try { if (window.PopupAdapter && typeof window.PopupAdapter._onSaveLastTirage === 'function') window.PopupAdapter._onSaveLastTirage(cards); } catch (ee) {}
              }
            } catch (e) {}
          });

          btnBack.addEventListener('click', function () {
            try {
              // close/hide this interpretation popup; best-effort removal
              try {
                // if inside a fallback overlay, remove that overlay
                const overlay = interp.closest('.pa-deck-overlay-fallback');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                else if (interp && interp.parentNode) interp.parentNode.removeChild(interp);
                // restore any applied transforms
                try { if (interp && interp.dataset && interp.dataset._pa_fixApplied) { interp.style.transform = interp.dataset._pa_origTransform || ''; delete interp.dataset._pa_fixApplied; delete interp.dataset._pa_origTransform; } } catch (e) {}
                try { setGlobalNoScroll(false); try { document.body.style.overflowX = ''; } catch (e) {} } catch (e) {}
              } catch (e) {}
            } catch (e) {}
          });

          // expose starter hook and auto-invoke if present (to allow automatic interpretation later)
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._interpretationStarter = function(cb) { try { if (typeof cb === 'function') cb(cards, frame); } catch (e) {} }; } catch (e) {}
          // ensure global no-scroll and clamp interp sizes so it won't cause page scrollbars
          try { setGlobalNoScroll(true); } catch (e) {}
          try { interp.style.boxSizing = 'border-box'; interp.style.maxWidth = 'calc(100vw - 40px)'; interp.style.maxHeight = 'calc(100vh - 160px)'; interp.style.overflow = 'hidden'; } catch (e) {}
                  // open the interpretation popup
                  const handle = openPopup(interp);
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
                          } catch (e) {}
                        }
                      } catch (e) {}
                    }, 140);
                  } catch (e) {}
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
                  } catch (e) {}
                  // try to center the wrapper returned by openPopup (best-effort)
                  try {
                    const wrapper = (handle && handle.nodeType === 1) ? handle : (handle && handle.el) ? handle.el : null;
                    if (wrapper && wrapper.classList) {
                      wrapper.classList.add('pa-center-popup');
                      try { wrapper.dataset._pa_centered = '1'; } catch (e) {}
                    }
                  } catch (e) {}
          // auto-invoke interpretation starter if provided by external code
          try { setTimeout(() => { try { if (window.PopupAdapter && typeof window.PopupAdapter._interpretationStarter === 'function') window.PopupAdapter._interpretationStarter(function(cardsArg, frameEl) { try { if (frameEl) frameEl.textContent = 'Appel API automatique… (exemple)'; } catch (e) {} }); } catch (e) {} }, 120); } catch (e) {}

          // expose selected cards for external usage
          try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastSelectedCards = cards.slice(); } catch (e) {}

          return handle;
        } catch (e) { console && console.warn && console.warn('interpretation popup error', e); }
      }

      // expose fan debug flags
      try {
        window.PopupAdapter = window.PopupAdapter || {};
        window.PopupAdapter._fanEnabled = !!fanEnabled;
        window.PopupAdapter._lastFanAngles = fanAngles.slice();
      } catch (e) {}

      // attach click handler to each slot to flip and reveal assigned face
      try {
        const slotsAll = grid.querySelectorAll('.pm-card-slot');
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
                setTimeout(() => { try { im.classList.add('pa-deck-entrance--visible'); } catch (e) {} }, Math.max(0, delay));
              } catch (e) {}
            });
          } else {
            // prefer reduced motion => remove entrance class immediately
            Array.prototype.forEach.call(slotsAll, function (s) { try { const im = s.querySelector('img.pa-deck-entrance'); if (im) im.classList.add('pa-deck-entrance--visible'); } catch (e) {} });
          }
        } catch (e) {}
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
                  try { numSpan && numSpan.classList.add('pa-remaining-pulse'); setTimeout(() => { try { numSpan && numSpan.classList.remove('pa-remaining-pulse'); } catch (e) {} }, 420); } catch (e) {}
                  return;
                }
              } catch (e) {}
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
                  } catch (e) {}
                }, 240);
              } else {
                // no img present — replace slot content
                slot.innerHTML = '';
                // ensure slot padding exists so image fits exactly in frame
                try { slot.style.padding = '4px'; slot.style.boxSizing = 'border-box'; } catch (e) {}
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
                setTimeout(() => { try { img.style.transform = 'scaleX(1)'; } catch (e) {} }, 20);
              }
              // mark slot as revealed visually
              try { slot.classList.add('pm-card-revealed'); } catch (e) {}
              // decrement remaining count and update title (if this popup was opened with a chosenCount)
              try {
                if (typeof remaining !== 'undefined' && remaining > 0) {
                  remaining = Math.max(0, remaining - 1);
                  try { updateTitle(); } catch (e) {}
                }
              } catch (e) {}
              // record selected card info
              try {
                const faceSrc = deckMapping[si];
                selectedCards.push({ index: si, src: faceSrc });
                try { window.PopupAdapter = window.PopupAdapter || {}; window.PopupAdapter._lastSelectedCards = selectedCards.slice(); } catch (e) {}
              } catch (e) {}
              // when remaining is zero, open the interpretation popup showing chosen cards
              try {
                if (typeof remaining !== 'undefined' && remaining === 0) {
                  try {
                    const delay = (opts && typeof opts.interpretationDelay === 'number' && isFinite(opts.interpretationDelay)) ? Math.max(0, Number(opts.interpretationDelay)) : 1200;
                    setTimeout(() => { try { showInterpretationPopup(selectedCards.slice()); } catch (e) {} }, delay);
                  } catch (e) {}
                }
              } catch (e) {}
            } catch (e) { /* ignore reveal errors */ }
          });
        });
      } catch (e) { /* ignore slot wiring errors */ }

      // expose helpers
      window.PopupAdapter = window.PopupAdapter || {};
      // expose the mapping so external code can inspect which face was assigned to which slot
      try { window.PopupAdapter._lastDeckMapping = deckMapping; } catch (e) {}
      // allow external code to place/clear cards inside this deck popup
        window.PopupAdapter.placeCardInSlot = function (index, src, alt) {
        try {
          const idx = Number(index) || 0;
          const sl = grid.querySelectorAll('.pm-card-slot');
          if (!sl || idx < 0 || idx >= sl.length) return false;
          sl[idx].innerHTML = '';
        if (src) {
          const im = document.createElement('img');
          im.src = src; im.alt = alt || '';
          // ensure slot has a small inset and uses border-box so image fits exactly
          try { sl[idx].style.padding = '4px'; sl[idx].style.boxSizing = 'border-box'; sl[idx].style.overflow = 'hidden'; } catch (e) {}
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
      window.PopupAdapter.clearAllSlots = function () { try { grid.querySelectorAll('.pm-card-slot').forEach(s => { s.innerHTML = ''; }); } catch (e) {} };

  // expose the showDeckPopup function so external callers can open the deck with options (e.g., {fan: true})
  try { window.PopupAdapter.showDeckPopup = function(count, opts) { return showDeckPopup(count, opts); }; } catch (e) {}

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
        _rotator.timers.forEach(t => { try { clearTimeout(t); } catch (e) {} });
      }
      _rotator.timers = [];
      // remove active elements
      if (_rotator.activeEls && _rotator.activeEls.length) {
        _rotator.activeEls.forEach(el => { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) {} });
      }
      _rotator.activeEls = [];
      if (window.PopupAdapter && window.PopupAdapter._lastThemeMsgBox) {
        window.PopupAdapter._lastThemeMsgBox.innerHTML = '';
      }
      // restore theme button visuals
      try {
        if (window.PopupAdapter && window.PopupAdapter._themeButtons) {
          Object.keys(window.PopupAdapter._themeButtons).forEach(k => { try { window.PopupAdapter._themeButtons[k].style.opacity = '1'; } catch (e) {} });
        }
      } catch (e) {}
    } catch (e) { /* ignore */ }
  }

  function playThemeMessages(theme, messages, opts) {
    console && console.log && console.log('[PopupAdapter] playThemeMessages', theme, 'messagesLen=', messages && messages.length, 'opts=', opts);
    try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = 'playing ' + theme + ' (' + (messages && messages.length || 0) + ')'; } catch (e) {}
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

          try { if (window.PopupAdapter && window.PopupAdapter._debugBadge) window.PopupAdapter._debugBadge.textContent = (window.PopupAdapter._debugBadge.textContent || '') + ' • spawn'; } catch (e) {}

          // choose a random typewriter speed for this message (three possibilities)
          const defaultSpeeds = Array.isArray(opts && opts.typeSpeeds) && opts.typeSpeeds.length ? opts.typeSpeeds.slice(0,3) : [18, 28, 44];
          const chosenSpeed = defaultSpeeds[Math.floor(Math.random() * defaultSpeeds.length)];
          const localCharDelay = Number(chosenSpeed) || charDelay || 28;
          // typewriter
          let i = 0;
          function tick() {
            if (!_rotator.running) { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) {} ; resolve(); return; }
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
                    try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) {}
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
                        try { inner.removeEventListener('transitionend', onEnd); } catch (e) {}
                        try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) {}
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
                      if (!_rotator.running) { try { el.parentNode && el.parentNode.removeChild(el); } catch (e) {} ; resolve(); return; }
                      const th = el.querySelector('.pm-rot-text');
                      const cur = th ? (th.textContent || '') : '';
                      if (cur.length === 0) {
                        try { if (el && el.parentNode) { el.parentNode.removeChild(el); } } catch (e) {}
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
        try { const old = document.getElementById('pa-frame-center-guide'); if (old && old.parentNode) old.parentNode.removeChild(old); } catch (e) {}
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

  window.PopupAdapter.clearCenterGuides = function () { try { const a = document.getElementById('pa-center-guide'); if (a && a.parentNode) a.parentNode.removeChild(a); const b = document.getElementById('pa-frame-center-guide'); if (b && b.parentNode) b.parentNode.removeChild(b); } catch (e) {} };

  

  if (document.readyState === 'complete' || document.readyState === 'interactive') attachHeaderHandlers();
  else document.addEventListener('DOMContentLoaded', attachHeaderHandlers);

})();

