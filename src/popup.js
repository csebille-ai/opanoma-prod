// Compatibility shim for legacy `./src/popup.js` loader.
// Many pages expect a `PopupManager` global; our new adapter lives in `popup-adapter.js`.
// This file prevents a noisy "failed to load ./src/popup.js" message and provides a
// minimal stub when a host doesn't expose a manager.
(function () {
  try {
    if (window.PopupManager) {
      console.info('popup.js shim: PopupManager already present');
      return;
    }

    // Functional shim: mounts the provided `html` container into a simple
    // modal wrapper with a backdrop and returns the wrapper element. This is
    // intentionally small but usable so `popup-adapter.js` can operate when
    // no host PopupManager is available.
    const _openPopups = [];

    function createBackdrop() {
      const bd = document.createElement('div');
      bd.className = 'pm-overlay';
      return bd;
    }

    function createWrapper(maxWidth) {
      const root = document.createElement('div');
      root.className = 'pm-popup';
      if (maxWidth) root.style.maxWidth = maxWidth;
      const box = document.createElement('div');
      box.className = 'pm-popup-inner';
      root.appendChild(box);
      // expose box for convenience
      root.box = box;
      return root;
    }

    function mount(opts) {
      try {
        opts = opts || {};
        const html = opts.html;
        const maxWidth = opts.maxWidth || opts.maxwidth || '820px';

        const bd = createBackdrop();
        const wrapper = createWrapper(maxWidth);
        // ensure wrapper.box is accessible
        const box = wrapper.box || wrapper.querySelector && wrapper.querySelector('.pm-popup-inner');

        // attach content
        if (html && html.nodeType === 1) {
          // move the node into the box
          try { box.appendChild(html); } catch (e) { box.innerHTML = ''; box.appendChild(html); }
        } else if (typeof html === 'string') {
          box.innerHTML = html;
        } else {
          // nothing usable: create a placeholder
          const n = document.createElement('div'); n.textContent = 'Popup'; box.appendChild(n);
        }

        // nest popup inside overlay so CSS flex‑centering works
        bd.appendChild(wrapper);
        try { document.body.appendChild(bd); } catch (e) { document.documentElement.appendChild(bd); }

        // wire close on backdrop click (only if click is on overlay itself, not popup content)
        bd.addEventListener('click', function (ev) {
          if (ev.target === bd) { try { unmount(handle); } catch (e) {} }
        });

        // create a handle that's friendly to popup-adapter usage
        const handle = wrapper;
        handle.el = wrapper;
        handle.box = box;
        handle.close = function () { try { unmount(handle); } catch (e) {} };

        _openPopups.push({ wrapper: wrapper, backdrop: bd, handle: handle });
        console.info('popup.js shim: mounted popup (shim)');
        return handle;
      } catch (e) { console.warn('popup.js shim mount failed', e); return null; }
    }

    function unmount(handle) {
      try {
        if (!handle) return;
        let entry = null;
        for (let i = _openPopups.length - 1; i >= 0; i--) {
          if (_openPopups[i].handle === handle || _openPopups[i].wrapper === handle || _openPopups[i].wrapper === handle.el) { entry = _openPopups[i]; _openPopups.splice(i,1); break; }
        }
        if (!entry) {
          // try to remove handle as a DOM node
          try { if (handle && handle.parentNode) handle.parentNode.removeChild(handle); } catch (e) {}
          return;
        }
        try { if (entry.backdrop && entry.backdrop.parentNode) entry.backdrop.parentNode.removeChild(entry.backdrop); } catch (e) {}
      } catch (e) { console.warn('popup.js shim unmount failed', e); }
    }

    window.PopupManager = {
      open: function (opts) { return mount(opts); },
      close: function (h) { try { unmount(h); } catch(e){} },
      create: function () { return window.PopupManager; }
    };

    console.info('popup.js shim: created functional PopupManager shim');
  } catch (e) {
    try { console.warn('popup.js shim: error', e); } catch(_){}
  }
})();
