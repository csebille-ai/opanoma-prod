// popup-adapter.js — single clean implementation

(function () {
  'use strict';

  // Utility: preferred max width for popup frames
  function getMaxFrameWidth() {
    try {
      const w = Math.max(420, Math.min(window.innerWidth - 40, 820));
      return w + 'px';
    } catch (e) {
      return '720px';
    }
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
        return PopupManager.open({ html: container, maxWidth: getMaxFrameWidth() });
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
        justifyContent: 'center',
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
            img.style.width = '100%';
            img.style.height = '100%';
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

    return popupHandle;
  }

  // New: show full deck popup with 22 slots pre-filled with verso image
  function showDeckPopup(chosenCount) {
    try {
      const total = 22;
      // build container ourselves so we can tightly control dimensions
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.padding = '10px';

      const title = document.createElement('h3');
      title.className = 'pm-popup-title';
      title.textContent = 'Tirage - Choisissez vos cartes';
      container.appendChild(title);

      const stage = document.createElement('div');
      stage.style.display = 'flex';
      stage.style.justifyContent = 'center';
      stage.style.padding = '6px 0 6px 0';

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gap = '8px';
      grid.style.boxSizing = 'content-box';

      // compute available popup width and height and force 4-row layout (6,6,6,4)
      const maxW = parseInt(String(getMaxFrameWidth()).replace(/[^0-9]/g, ''), 10) || Math.max(420, window.innerWidth - 40);
      const reserved = (title.getBoundingClientRect ? Math.round(title.getBoundingClientRect().height) : 56) + 24;
      const availH = Math.max(320, window.innerHeight - reserved - 40);

      const gap = 8;
      const cardRatio = 3 / 2;
      const cols = 6;
      const rows = 4;

      // base card width to fill cols in available width
      let cardW = Math.floor((maxW - (cols - 1) * gap) / cols);
      let cardH = Math.floor(cardW * cardRatio);
      let totalH = rows * cardH + (rows - 1) * gap;
      if (totalH > availH) {
        const scale = Math.max(0.45, (availH / totalH) * 0.95);
        cardW = Math.max(36, Math.floor(cardW * scale));
        cardH = Math.max(48, Math.floor(cardW * cardRatio));
        totalH = rows * cardH + (rows - 1) * gap;
      }

      grid.style.gridTemplateColumns = `repeat(${cols}, ${cardW}px)`;
      grid.style.gridAutoRows = `${cardH}px`;
      grid.style.width = (cardW * cols + (cols - 1) * gap) + 'px';

      // create slots and fill with verso image; center last row by starting its first slot at column 2
      for (let i = 0; i < total; i++) {
        const slot = document.createElement('div');
        slot.className = 'pm-card-slot';
        Object.assign(slot.style, {
          overflow: 'hidden',
          borderRadius: '6px',
          background: 'linear-gradient(180deg,#eee,#ddd)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          slot.appendChild(img);
        } catch (e) {}
        grid.appendChild(slot);
      }

      stage.appendChild(grid);
      container.appendChild(stage);

      const popupHandle = openPopup(container);

      // expose helpers
      window.PopupAdapter = window.PopupAdapter || {};
      // allow external code to place/clear cards inside this deck popup
      window.PopupAdapter.placeCardInSlot = function (index, src, alt) {
        try {
          const idx = Number(index) || 0;
          const sl = grid.querySelectorAll('.pm-card-slot');
          if (!sl || idx < 0 || idx >= sl.length) return false;
          sl[idx].innerHTML = '';
          if (src) {
            const im = document.createElement('img'); im.src = src; im.alt = alt || ''; im.style.width = '100%'; im.style.height = '100%'; im.style.objectFit = 'cover'; sl[idx].appendChild(im);
          }
          return true;
        } catch (e) { return false; }
      };
      window.PopupAdapter.clearAllSlots = function () { try { grid.querySelectorAll('.pm-card-slot').forEach(s => { s.innerHTML = ''; }); } catch (e) {} };

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

  if (document.readyState === 'complete' || document.readyState === 'interactive') attachHeaderHandlers();
  else document.addEventListener('DOMContentLoaded', attachHeaderHandlers);

})();

