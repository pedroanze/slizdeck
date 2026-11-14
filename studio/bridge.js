/* slizdeck studio · puente
   Se inyecta al principio del <head> del deck cuando lo sirve Studio (nunca
   se guarda en el archivo). Deja el deck quieto y en su estado final para
   poder editarlo: sin navegacion por teclado, sin animaciones, todas las
   slides reveladas y el 3D en poster. El editor (studio/editor.js) maneja el
   resto desde la ventana padre. */
(() => {
  const mode = window.__SZ_STUDIO_MODE || 'edit';
  const root = document.documentElement;
  root.classList.add('sz-studio', 'sz-3d--poster');

  // Registrado antes que el engine: las flechas no cambian de slide ni de
  // paso mientras se edita. Escribir dentro de un texto en edicion si pasa.
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && t.isContentEditable) return;
    e.stopImmediatePropagation();
  }, { capture: true });

  const style = document.createElement('style');
  style.textContent =
    '*, *::before, *::after { transition: none !important; animation: none !important; }' +
    '#progress-bar, #fs-btn { display: none !important; }' +
    '.reveal { opacity: 1 !important; filter: none !important; clip-path: none !important; }' +
    '[contenteditable] { outline: none !important; cursor: text; }' +
    (mode === 'thumb' ? 'html, body { overflow: hidden !important; }' : '');
  document.head.appendChild(style);

  const stage = () => document.querySelector('deck-stage');
  const slides = () => Array.from(stage() ? stage().children : []).filter((el) => !/^(TEMPLATE|SCRIPT|STYLE)$/.test(el.tagName));

  /* Estado final de todas las slides. beforeprint es la via del engine
     (contadores en su cifra, pasos al final); lo de abajo cubre engines
     viejos que no lo traen. */
  function finalize() {
    try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
    slides().forEach((slide) => {
      slide.dataset.currentStep = slide.dataset.steps || '1';
      slide.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));
    });
    const s = stage();
    if (s && s.shadowRoot) {
      const hide = document.createElement('style');
      hide.textContent = '.overlay, .tapzones { display: none !important; }';
      s.shadowRoot.appendChild(hide);
    }
  }

  /* Cambia de slide sin pasar por el engine: su slidechange reinicia los
     reveals de la slide que entra, y aca todas tienen que quedarse al final. */
  function show(i) {
    const list = slides();
    const n = Math.max(0, Math.min(list.length - 1, i));
    list.forEach((el, k) => {
      if (k === n) { el.setAttribute('data-deck-active', ''); el.setAttribute('data-active', 'true'); }
      else { el.removeAttribute('data-deck-active'); el.removeAttribute('data-active'); }
    });
    try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {}
    return n;
  }

  const current = () => Math.max(0, slides().findIndex((el) => el.hasAttribute('data-deck-active')));

  window.__szStudio = { finalize, show, slides, current };

  function ready() {
    // El engine entra a la slide inicial con un temporizador de hasta 120 ms;
    // se finaliza despues para que no la devuelva al paso 1.
    setTimeout(() => {
      finalize();
      show(current());
      if (window.parent !== window) window.parent.postMessage({ type: 'sz-studio-ready', mode }, location.origin);
    }, 220);
  }
  if (document.readyState !== 'loading') ready();
  else document.addEventListener('DOMContentLoaded', ready);
})();
