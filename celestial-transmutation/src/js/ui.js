// Celestial Transmutation — UI layer. Decoupled from the scene: it observes the DOM
// the scene already updates (#planet-name, #auto-cycle) and clicks the existing controls.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LORE = {
    Aethera: { sigil: '☽', element: 'Water', metal: 'Silver', stage: 'Solutio', lore: 'Dissolution made visible: tides of liquid light carry the first matter toward its violet aurora.', stats: [['Luminance', 78], ['Volatility', 42], ['Resonance', 91]] },
    Pyra: { sigil: '♂', element: 'Fire', metal: 'Iron', stage: 'Calcinatio', lore: 'The furnace of the cosmos. Every fracture is a line of molten script that burns the old form away.', stats: [['Luminance', 95], ['Volatility', 97], ['Resonance', 55]] },
    Orison: { sigil: '☉', element: 'Aether', metal: 'Gold', stage: 'Sublimatio', lore: 'Matter rises into pure order: a ring of particles reads like sheet music for the quintessence.', stats: [['Luminance', 88], ['Volatility', 30], ['Resonance', 99]] },
    Vesper: { sigil: '♄', element: 'Earth', metal: 'Lead', stage: 'Coagulatio', lore: 'Starlight is crystallised into geometry, then released through cyan seams at the poles.', stats: [['Luminance', 66], ['Volatility', 48], ['Resonance', 84]] }
  };

  // ---- Toast feedback
  let toastTimer;
  const toast = (msg) => {
    const t = $('toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 1800);
  };

  // ---- Loader (hides when the scene fires ct:ready; reports failures)
  const loader = $('loader');
  let ready = false;
  const hideLoader = () => { ready = true; setTimeout(() => loader.classList.add('is-done'), reduced ? 0 : 700); };
  addEventListener('ct:ready', hideLoader);
  addEventListener('error', (e) => { if (!ready) $('loader-note').textContent = 'Could not start the scene. Check your connection and WebGL support, then reload.'; });
  addEventListener('unhandledrejection', () => { if (!ready) $('loader-note').textContent = 'Could not load 3D libraries. Check your connection, then reload.'; });
  setTimeout(() => { if (!ready) $('loader-note').textContent = 'Still gathering stardust… a slow connection or no WebGL can cause this.'; }, 9000);

  // ---- Modals
  const modals = { atlas: $('atlas'), credits: $('credits'), help: $('help') };
  const triggers = { atlas: $('btn-atlas'), credits: $('btn-credits'), help: $('btn-help') };
  let openKey = null, lastFocus = null;
  function openModal(key) {
    closeModal(true); openKey = key; lastFocus = document.activeElement;
    modals[key].classList.add('is-open'); modals[key].removeAttribute('aria-hidden');
    triggers[key].setAttribute('aria-expanded', 'true');
    modals[key].querySelector('.modal-close').focus();
    if (key === 'atlas') renderAtlas();
  }
  function closeModal(silent) {
    if (!openKey) return;
    const m = modals[openKey]; m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    triggers[openKey].setAttribute('aria-expanded', 'false'); openKey = null;
    if (!silent && lastFocus) lastFocus.focus();
  }
  Object.keys(modals).forEach((k) => {
    triggers[k].addEventListener('click', () => (openKey === k ? closeModal() : openModal(k)));
    modals[k].addEventListener('click', (e) => { if (e.target === modals[k] || e.target.closest('.modal-close')) closeModal(); });
  });

  // ---- Atlas (follows current planet)
  function renderAtlas() {
    const name = $('planet-name').textContent.trim(); const d = LORE[name]; if (!d) return;
    $('atlas-sigil').textContent = d.sigil; $('atlas-title').textContent = name;
    $('atlas-kicker').textContent = $('planet-kicker').textContent.replace(/^Phasing into /i, '');
    $('atlas-lore').textContent = d.lore;
    $('atlas-tags').innerHTML = [d.element, d.metal, d.stage].map((t) => `<span class="tag">${t}</span>`).join('');
    $('atlas-stats').innerHTML = d.stats.map(([l, v]) => `<div class="stat"><span>${l}</span><span class="bar"><i data-v="${v}"></i></span><span>${v}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $('atlas-stats').querySelectorAll('i').forEach((i) => (i.style.width = i.dataset.v + '%'))));
  }
  new MutationObserver(() => { if (openKey === 'atlas') renderAtlas(); }).observe($('planet-name'), { childList: true, characterData: true, subtree: true });

  // ---- Fullscreen
  const fsBtn = $('btn-full');
  if (!document.documentElement.requestFullscreen) fsBtn.hidden = true;
  fsBtn.addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => toast('Fullscreen is not available here')));

  // ---- Auto-cycle feedback
  $('auto-cycle').addEventListener('change', (e) => toast(e.target.checked ? 'Auto-cycle on' : 'Auto-cycle paused'));

  // ---- Keyboard (capture phase so open dialogs block the scene's arrow/space shortcuts)
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (openKey) {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      else if (e.key === 'Tab') { // simple focus trap
        const f = [...modals[openKey].querySelectorAll('a[href],button')]; const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      } else if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !(e.key === ' ' && document.activeElement.tagName === 'BUTTON')) e.stopImmediatePropagation();
      return;
    }
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '4') document.querySelector(`[data-planet="${Number(k) - 1}"]`).click();
    else if (k === 'i') openModal('atlas');
    else if (k === 'c') openModal('credits');
    else if (k === 'h' || k === '?') openModal('help');
    else if (k === 'f') fsBtn.click();
    else if (k === 'a') $('auto-cycle').click();
  }, true);

  // ---- Sparkle trail (cheap 2D canvas; capped particle count; off for reduced motion)
  if (!reduced) {
    const cv = $('sparkles'), ctx = cv.getContext('2d'); let W, H, parts = [], running = false;
    const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; size(); addEventListener('resize', size, { passive: true });
    const rgb = () => getComputedStyle(document.documentElement).getPropertyValue('--accent-a').trim() || '84,226,255';
    function frame() {
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter((p) => (p.life -= 0.022) > 0);
      parts.forEach((p) => { p.x += p.vx; p.y += p.vy; ctx.fillStyle = `rgba(${p.c},${p.life * .8})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.283); ctx.fill(); });
      if (parts.length) requestAnimationFrame(frame); else running = false;
    }
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || (e.buttons & 1)) return; // don't compete with orbit dragging
      if (parts.length < 60) for (let i = 0; i < 2; i++) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8 + .15, r: 1 + Math.random() * 1.8, life: 1, c: rgb() });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
  }
})();
