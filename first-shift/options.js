/* User-controlled decorative motion preference. Physics continues at full speed. */
(function (global) {
  'use strict';
  const key = 'quota-panic-reduced-motion';
  const media = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let saved = null;
  try {
    const value = global.localStorage.getItem(key);
    if (value === 'true' || value === 'false') saved = value === 'true';
  } catch (_) { /* The control still works for this session without storage. */ }
  let reduced = saved === null ? !!(media && media.matches) : saved;
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'motion';
  button.setAttribute('aria-label', 'Reduce decorative motion');
  button.title = 'Reduce decorative motion; game physics remains active';
  function render() {
    document.documentElement.dataset.reducedMotion = String(reduced);
    button.setAttribute('aria-pressed', String(reduced));
    button.textContent = reduced ? 'MOTION REDUCED' : 'MOTION FULL';
  }
  function change(value, persist) {
    reduced = !!value;
    if (persist) {
      saved = reduced;
      try { global.localStorage.setItem(key, String(reduced)); } catch (_) {}
    }
    render();
    global.dispatchEvent(new CustomEvent('fs-motion-change', {detail: {reducedMotion: reduced}}));
  }
  button.addEventListener('click', () => change(!reduced, true));
  const systemChanged = event => { if (saved === null) change(event.matches, false); };
  if (media) {
    if (media.addEventListener) media.addEventListener('change', systemChanged);
    else if (media.addListener) media.addListener(systemChanged);
  }
  global.FSOptions = Object.freeze({get reducedMotion() { return reduced; }, setReducedMotion(value) { change(value, true); }});
  render();
  const mount = () => { const toolbar = document.querySelector('.toolbar'); if (toolbar && !button.isConnected) toolbar.appendChild(button); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
})(window);
