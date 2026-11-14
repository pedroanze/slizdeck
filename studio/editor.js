/* slizdeck studio · editor
   Shell del editor: el deck corre en un iframe de 1920x1080 escalado; la
   seleccion, los tiradores y las guias se dibujan aca encima. Cada cambio se
   aplica en vivo al DOM del iframe y se manda como parche al servidor, que lo
   escribe en el HTML fuente por offsets (data-sz-src). El DOM del iframe
   nunca se serializa. */
(() => {
  'use strict';

  const SRC = 'data-sz-src';
  const W = 1920; const H = 1080;
  const INLINE = new Set(['A', 'ABBR', 'B', 'BR', 'CITE', 'CODE', 'DEL', 'EM', 'I', 'INS', 'KBD', 'MARK', 'S', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP', 'U', 'WBR']);
  const REPLACED = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE']);
  const COLOR_TOKENS = ['--cs-fg-1', '--cs-fg-2', '--cs-muted', '--cs-primary', '--cs-secondary', '--cs-accent-ink', '--cs-on-primary'];
  const THUMBS_MAX = 30;
  const SNAP = 6;

  const $ = (id) => document.getElementById(id);
  const frame = $('frame'); const canvas = $('canvas'); const overlay = $('overlay');
  const selBox = $('sel-box'); const hoverBox = $('hover-box'); const guides = $('guides');
  const rail = $('rail'); const panel = $('panel'); const statusEl = $('status');

  const S = {
    rev: null, canUndo: false, canRedo: false, name: '', comments: [],
    slide: 0, sel: null, editing: null, scale: 1, ready: false, pendingSel: null,
  };
  let doc = null; let win = null;

  /* ── Utilidades ── */

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k in el && k !== 'list') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
    return el;
  }

  let toastTimer = 0;
  function toast(text, kind) {
    const t = $('toast');
    t.textContent = text; t.dataset.kind = kind || ''; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, kind === 'error' ? 6000 : 3200);
  }

  function setStatus(text, state) { statusEl.textContent = text; statusEl.dataset.state = state || ''; }

  async function call(route, body, raw) {
    const res = await fetch(`/__api/${route}`, body === undefined ? {} : {
      method: 'POST',
      headers: raw ? {} : { 'Content-Type': 'application/json' },
      body: raw ? body : JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* respuesta sin cuerpo JSON */ }
    return { ok: res.ok, status: res.status, data };
  }

  const srcId = (el) => (el && el.hasAttribute && el.hasAttribute(SRC) ? Number(el.getAttribute(SRC)) : null);
  const bySrc = (id) => (doc && id !== null ? doc.querySelector(`[${SRC}="${id}"]`) : null);
  const slides = () => (win && win.__szStudio ? win.__szStudio.slides() : []);
  const activeSlide = () => slides()[S.slide] || null;
  const px = (n) => `${Math.round(n)}px`;

  function syncBar() {
    $('btn-undo').disabled = !S.canUndo;
    $('btn-redo').disabled = !S.canRedo;
    const drafts = S.comments.filter((c) => c.status === 'draft').length;
    const send = $('btn-send');
    send.disabled = !drafts;
    send.textContent = drafts ? `Enviar al agente (${drafts})` : 'Enviar al agente';
  }

  /* ── Guardado: cola de parches ── */

  let queue = Promise.resolve();
  let inFlight = 0;

  /** Manda ops al servidor, en orden. Devuelve los results o null si fallo. */
  function patch(ops, opts = {}) {
    inFlight++;
    setStatus('Guardando…', 'saving');
    const run = async () => {
      let r;
      try { r = await call('patch', { rev: S.rev, ops }); } catch (e) {
        setStatus('Sin conexión con Studio: el cambio no se guardó', 'error');
        toast('Studio no responde. ¿Sigue corriendo `slizdeck studio` en la terminal?', 'error');
        return null;
      } finally { inFlight--; }
      if (r.ok) {
        Object.assign(S, { rev: r.data.rev, canUndo: r.data.canUndo, canRedo: r.data.canRedo });
        syncBar();
        if (!inFlight) setStatus('Guardado');
        const structural = r.data.results.some((x) => x && x.structural);
        for (const x of r.data.results) for (const w of (x && x.warnings) || []) toast(w);
        if (structural || opts.reload) loadDeck(structural && !opts.keepSel ? null : opts.sel);
        else touchThumb();
        return r.data.results;
      }
      if (r.status === 409) {
        Object.assign(S, { rev: r.data.rev, canUndo: r.data.canUndo, canRedo: r.data.canRedo });
        syncBar();
        toast('El deck cambió en disco mientras editabas. Se recargó; el último cambio no se aplicó.', 'error');
      } else {
        toast(`No se pudo guardar: ${r.data.error || r.status}`, 'error');
      }
      setStatus('Último cambio sin guardar', 'error');
      loadDeck(null);
      return null;
    };
    queue = queue.then(run, run);
    return queue;
  }

  async function history(route) {
    if (S.editing) return;
    await queue;
    const r = await call(route, { rev: S.rev });
    if (r.data.rev) Object.assign(S, { rev: r.data.rev, canUndo: r.data.canUndo, canRedo: r.data.canRedo });
    syncBar();
    if (!r.ok && r.status !== 409) { toast(r.data.error || 'No se pudo', 'error'); return; }
    setStatus(route === 'undo' ? 'Deshecho' : 'Rehecho');
    loadDeck(null);
  }

  /* ── Carga del deck en el iframe ── */

  function loadDeck(keepSel) {
    S.ready = false;
    S.pendingSel = keepSel === undefined ? srcId(S.sel) : keepSel;
    S.sel = null; S.editing = null;
    overlay.classList.remove('editing');
    selBox.hidden = true; hoverBox.hidden = true;
    const url = `/__deck?r=${Date.now()}#${S.slide + 1}`;
    if (frame.contentWindow && frame.src) frame.contentWindow.location.replace(url);
    else frame.src = url;
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'sz-studio-ready') return;
    if (e.source === frame.contentWindow) return onDeckReady();
    // Miniatura: se la deja en su slide.
    for (const f of rail.querySelectorAll('iframe')) {
      if (f.contentWindow === e.source) {
        try { e.source.__szStudio.show(Number(f.dataset.index)); } catch (err) { /* miniatura a medio cargar */ }
        f.style.visibility = 'visible';
      }
    }
    return undefined;
  });

  function onDeckReady() {
    win = frame.contentWindow; doc = frame.contentDocument;
    S.ready = true;
    const list = slides();
    S.slide = Math.max(0, Math.min(list.length - 1, S.slide));
    win.__szStudio.show(S.slide);
    canvas.classList.remove('loading');
    wireFrame();
    buildRail();
    const again = bySrc(S.pendingSel);
    S.pendingSel = null;
    select(again && activeSlide() && activeSlide().contains(again) ? again : null);
  }

  /* Eventos que solo existen dentro del iframe (texto en edicion). */
  function wireFrame() {
    doc.addEventListener('keydown', (e) => {
      if (!S.editing) return;
      if (e.key === 'Escape') { e.preventDefault(); S.editing.el.blur(); }
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); doc.execCommand('insertLineBreak'); }
    });
    doc.addEventListener('paste', (e) => {
      if (!S.editing) return;
      e.preventDefault();
      doc.execCommand('insertText', false, (e.clipboardData || win.clipboardData).getData('text/plain'));
    });
    doc.addEventListener('input', () => { if (S.editing) drawSel(); });
    doc.addEventListener('drop', (e) => e.preventDefault());
    doc.addEventListener('dragover', (e) => e.preventDefault());
  }

  function fit() {
    const stage = $('stage');
    const availW = stage.clientWidth - 48; const availH = stage.clientHeight - 60;
    S.scale = Math.max(0.1, Math.min(availW / W, availH / H));
    canvas.style.width = px(W * S.scale); canvas.style.height = px(H * S.scale);
    frame.style.width = `${W}px`; frame.style.height = `${H}px`;
    frame.style.transform = `scale(${S.scale})`;
    for (const t of rail.querySelectorAll('.thumb')) sizeThumb(t);
    drawSel();
  }

  /* ── Que es cada elemento ── */

  function kindOf(el) {
    if (!el) return null;
    const tag = el.tagName.toUpperCase();
    if (el.classList.contains('sz-chart')) return 'chart';
    if (el.classList.contains('sz-3d')) return '3d';
    if (tag === 'IMG' || tag === 'PICTURE') return 'image';
    if (tag === 'SVG' || tag === 'VIDEO' || tag === 'CANVAS') return 'media';
    if (isTextEl(el)) return 'text';
    return 'box';
  }
  const KIND_LABEL = { chart: 'Gráfica', '3d': 'Figura 3D', image: 'Imagen', media: 'Gráfico', text: 'Texto', box: 'Bloque' };

  /** Bloque cuyo contenido es solo texto e inline: se edita en el lugar. */
  function isTextEl(el) {
    if (!el || el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return false;
    if (REPLACED.has(el.tagName) || el.hasAttribute('data-counter')) return false;
    if (!el.textContent.trim()) return false;
    for (const d of el.querySelectorAll('*')) if (!INLINE.has(d.tagName)) return false;
    return true;
  }

  function hasBox(el) {
    const cs = win.getComputedStyle(el);
    const bg = cs.backgroundColor;
    const painted = bg && bg !== 'transparent' && !/rgba?\([^)]*,\s*0\)$/.test(bg);
    return painted || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0
      || parseFloat(cs.borderBottomWidth) > 0 || cs.boxShadow !== 'none';
  }

  const ownText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());

  /** Del elemento bajo el cursor a la unidad que se selecciona. null = fondo. */
  function pick(hit) {
    const slide = activeSlide();
    if (!hit || !slide || hit === slide || !slide.contains(hit)) return null;
    let el = hit;
    // Lo que dibuja el runtime (SVG de la grafica, canvas 3D) no esta en el fuente.
    const widget = el.closest('.sz-chart, .sz-3d');
    if (widget && slide.contains(widget)) el = widget;
    const svg = el.closest('svg');
    if (svg) { el = svg; while (el.parentElement && el.parentElement.closest('svg')) el = el.parentElement.closest('svg'); }
    while (el !== slide && srcId(el) === null) el = el.parentElement;
    // Un inline dentro de un parrafo no se mueve solo: se sube a su bloque.
    while (el !== slide && el.parentElement !== slide && win.getComputedStyle(el).display === 'inline') el = el.parentElement;
    if (el === slide) return null;
    const k = kindOf(el);
    // Un contenedor de layout sin nada propio que mostrar cuenta como fondo.
    if (k === 'box' && !hasBox(el) && !ownText(el)) return null;
    return el;
  }

  function hitAt(e) {
    const r = overlay.getBoundingClientRect();
    return doc.elementFromPoint((e.clientX - r.left) / S.scale, (e.clientY - r.top) / S.scale);
  }

  /* ── Seleccion ── */

  function select(el) {
    S.sel = el || null;
    drawSel();
    renderPanel();
  }

  function place(box, el) {
    const r = el.getBoundingClientRect();
    box.style.left = `${r.left * S.scale}px`; box.style.top = `${r.top * S.scale}px`;
    box.style.width = `${r.width * S.scale}px`; box.style.height = `${r.height * S.scale}px`;
    box.hidden = false;
  }

  function drawSel() {
    if (!S.ready || !S.sel || !S.sel.isConnected) { selBox.hidden = true; return; }
    place(selBox, S.sel);
    const k = kindOf(S.sel);
    selBox.classList.toggle('no-s', k === 'text' || k === 'chart');
    $('sel-label').textContent = KIND_LABEL[k];
  }
  setInterval(() => { if (S.sel && !drag) drawSel(); }, 500);   // imagenes y fuentes que terminan de cargar

  /* ── Texto ── */

  function startEdit(el, e) {
    if (!isTextEl(el)) {
      const k = kindOf(el);
      toast(k === 'chart' ? 'Los textos de la gráfica salen de sus datos: se editan en el panel.'
        : el.hasAttribute('data-counter') ? 'La cifra de un contador se edita en el panel (valor final).'
          : k === '3d' ? 'El contenido de una figura 3D no se edita desde Studio.'
            : 'Este bloque no tiene texto propio. Doble clic sobre el texto que quieras cambiar.');
      return;
    }
    select(el);
    S.editing = { el, before: el.innerHTML, count: el.querySelectorAll(`[${SRC}]`).length };
    el.contentEditable = 'true'; el.spellcheck = false;
    overlay.classList.add('editing');
    hoverBox.hidden = true;
    el.focus({ preventScroll: true });
    const sel = win.getSelection();
    let range = null;
    if (e && doc.caretRangeFromPoint) {
      const r = overlay.getBoundingClientRect();
      range = doc.caretRangeFromPoint((e.clientX - r.left) / S.scale, (e.clientY - r.top) / S.scale);
      if (range && !el.contains(range.startContainer)) range = null;
    }
    if (!range) { range = doc.createRange(); range.selectNodeContents(el); }
    sel.removeAllRanges(); sel.addRange(range);
    el.addEventListener('blur', commitEdit, { once: true });
  }

  async function commitEdit() {
    const ed = S.editing;
    if (!ed) return;
    S.editing = null;
    const { el } = ed;
    el.removeAttribute('contenteditable'); el.removeAttribute('spellcheck');
    overlay.classList.remove('editing');
    window.focus();
    if (el.innerHTML === ed.before) { drawSel(); return; }
    const id = srcId(el);
    const results = await patch([{ type: 'setText', id, html: el.innerHTML }]);
    if (!results || !el.isConnected) return;
    // El fuente quedo con el HTML saneado: el DOM se iguala y los data-sz-src
    // que siguen se corren lo que cambio la cantidad de etiquetas internas.
    el.innerHTML = results[0].html;
    const kids = el.querySelectorAll('*');
    const delta = kids.length - ed.count;
    if (delta) {
      for (const n of doc.querySelectorAll(`[${SRC}]`)) {
        const v = Number(n.getAttribute(SRC));
        if (v > id + ed.count) n.setAttribute(SRC, v + delta);
      }
    }
    kids.forEach((k, i) => k.setAttribute(SRC, id + 1 + i));
    drawSel(); renderPanel();
  }

  /* ── Estilos en vivo + parche ── */

  function liveStyle(el, props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null) el.style.removeProperty(k); else el.style.setProperty(k, v);
    }
  }

  function setStyle(el, props) {
    liveStyle(el, props);
    drawSel();
    return patch([{ type: 'setStyle', id: srcId(el), props }]);
  }

  function offsetOf(el) {
    const t = win.getComputedStyle(el).translate;
    if (!t || t === 'none') return { x: 0, y: 0 };
    const p = t.split(/\s+/).map(parseFloat);
    return { x: p[0] || 0, y: p[1] || 0 };
  }
  const translateValue = (x, y) => (Math.round(x) || Math.round(y) ? `${Math.round(x)}px ${Math.round(y)}px` : null);

  /* ── Mover y redimensionar ── */

  let drag = null;

  function snapTargets(el) {
    const slide = activeSlide();
    const sr = slide.getBoundingClientRect();
    const cs = win.getComputedStyle(slide);
    const v = (name) => { const n = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(n) ? n : null; };
    const xs = [sr.left, sr.left + sr.width / 2, sr.right];
    const ys = [sr.top, sr.top + sr.height / 2, sr.bottom];
    const padX = v('--cs-pad-x'); const padT = v('--cs-pad-top'); const padB = v('--cs-pad-bottom');
    if (padX) xs.push(sr.left + padX, sr.right - padX);
    if (padT) ys.push(sr.top + padT);
    if (padB) ys.push(sr.bottom - padB);
    for (const sib of el.parentElement ? el.parentElement.children : []) {
      if (sib === el || srcId(sib) === null) continue;
      const r = sib.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      xs.push(r.left, r.left + r.width / 2, r.right);
      ys.push(r.top, r.top + r.height / 2, r.bottom);
    }
    return { xs, ys };
  }

  function nearest(points, targets) {
    let best = null;
    for (const p of points) for (const t of targets) {
      const d = t - p;
      if (Math.abs(d) <= SNAP && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at: t };
    }
    return best;
  }

  function showGuides(x, y) {
    guides.replaceChildren();
    if (x !== null) guides.append(h('i', { class: 'v', style: `left:${x * S.scale}px` }));
    if (y !== null) guides.append(h('i', { class: 'hz', style: `top:${y * S.scale}px` }));
  }

  overlay.addEventListener('pointerdown', (e) => {
    if (!S.ready || e.button !== 0 || S.editing) return;
    const handle = e.target.dataset && e.target.dataset.h;
    let el = S.sel;
    if (!handle) {
      el = pick(hitAt(e));
      if (el !== S.sel) select(el);
      if (!el) return;
    }
    const r = el.getBoundingClientRect();
    const cs = win.getComputedStyle(el);
    drag = {
      el, handle: handle || null, x0: e.clientX, y0: e.clientY, moved: false,
      rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      off: offsetOf(el), kind: kindOf(el),
      fontSize: parseFloat(cs.fontSize), targets: handle ? null : snapTargets(el),
      props: {},
    };
    overlay.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  overlay.addEventListener('pointermove', (e) => {
    if (!S.ready || S.editing) return;
    if (!drag) {
      const el = pick(hitAt(e));
      if (el && el !== S.sel) place(hoverBox, el); else hoverBox.hidden = true;
      return;
    }
    const dxs = e.clientX - drag.x0; const dys = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dxs, dys) < 4) return;
    drag.moved = true; hoverBox.hidden = true;
    let dx = dxs / S.scale; let dy = dys / S.scale;
    if (drag.handle) resizeTo(dx, dy, e.shiftKey);
    else {
      let gx = null; let gy = null;
      if (!e.altKey) {
        const R = drag.rect;
        const sx = nearest([R.left + dx, R.left + R.width / 2 + dx, R.right + dx], drag.targets.xs);
        const sy = nearest([R.top + dy, R.top + R.height / 2 + dy, R.bottom + dy], drag.targets.ys);
        if (sx) { dx += sx.d; gx = sx.at; }
        if (sy) { dy += sy.d; gy = sy.at; }
      }
      showGuides(gx, gy);
      drag.props = { translate: translateValue(drag.off.x + dx, drag.off.y + dy) };
      liveStyle(drag.el, drag.props);
    }
    drawSel();
  });

  /* Redimensionar: se cambia width / font-size y despues se mide y se corrige
     el desplazamiento para que el borde opuesto al tirador no se mueva, sea
     cual sea el layout (flex, grid, centrado). */
  function resizeTo(dx, dy) {
    const d = drag; const el = d.el; const R = d.rect; const hd = d.handle;
    const left = hd.includes('w'); const top = hd.includes('n');
    const horiz = hd.includes('e') || left; const vert = hd.includes('s') || top;
    const props = {};
    const w = Math.max(24, R.width + (left ? -dx : dx));
    const hgt = Math.max(16, R.height + (top ? -dy : dy));
    if (d.kind === 'text' && horiz && vert) {
      // Esquina sobre texto: escala el cuerpo de letra.
      const ratio = Math.max(0.2, Math.max(w / R.width, hgt / R.height));
      props['font-size'] = `${Math.max(8, Math.round(d.fontSize * ratio))}px`;
    } else if (horiz && vert) {
      const ratio = Math.max(w / R.width, hgt / R.height);
      props.width = px(R.width * ratio);
      if (d.kind === 'image' || d.kind === 'media') props.height = px(R.height * ratio);
    } else if (horiz) {
      props.width = px(w);
    } else {
      props[d.kind === 'image' || d.kind === 'media' ? 'height' : 'min-height'] = px(hgt);
    }
    if (props.width) {
      const pcs = el.parentElement ? win.getComputedStyle(el.parentElement) : null;
      if (pcs && /flex/.test(pcs.display) && !/column/.test(pcs.flexDirection)) props.flex = 'none';
      const max = parseFloat(win.getComputedStyle(el).maxWidth);
      if (Number.isFinite(max) && parseFloat(props.width) > max) props['max-width'] = 'none';
    }
    liveStyle(el, { translate: translateValue(d.off.x, d.off.y), ...props });
    const now = el.getBoundingClientRect();
    const fx = left ? R.right - now.right : R.left - now.left;
    const fy = top ? R.bottom - now.bottom : R.top - now.top;
    props.translate = translateValue(d.off.x + fx, d.off.y + fy);
    liveStyle(el, { translate: props.translate });
    d.props = props;
  }

  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    guides.replaceChildren();
    try { overlay.releasePointerCapture(e.pointerId); } catch (err) { /* ya liberado */ }
    if (!d.moved || !Object.keys(d.props).length) return;
    patch([{ type: 'setStyle', id: srcId(d.el), props: d.props }]);
    drawSel(); renderPanel();
  }
  overlay.addEventListener('pointerup', endDrag);
  overlay.addEventListener('pointercancel', endDrag);
  overlay.addEventListener('pointerleave', () => { if (!drag) hoverBox.hidden = true; });

  overlay.addEventListener('dblclick', (e) => {
    if (!S.ready || S.editing) return;
    const el = pick(hitAt(e));
    if (el) startEdit(el, e);
  });

  // Flechas: varios toques seguidos se guardan como un solo cambio.
  let nudgeTimer = 0;
  function nudge(dx, dy) {
    const el = S.sel;
    const o = offsetOf(el);
    const value = translateValue(o.x + dx, o.y + dy);
    liveStyle(el, { translate: value });
    drawSel();
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(() => {
      if (el.isConnected) patch([{ type: 'setStyle', id: srcId(el), props: { translate: translateValue(offsetOf(el).x, offsetOf(el).y) } }]).then(renderPanel);
    }, 450);
  }

  /* ── Imagenes ── */

  async function replaceImage(img, file) {
    if (!file || !/^image\//.test(file.type)) { toast('Solo imágenes: png, jpg, gif, webp, avif o svg.', 'error'); return; }
    setStatus('Subiendo imagen…', 'saving');
    let r;
    try { r = await call(`asset?name=${encodeURIComponent(file.name)}`, file, true); } catch (e) { r = { ok: false, data: {} }; }
    if (!r.ok) { setStatus('La imagen no se subió', 'error'); toast(r.data.error || 'No se pudo subir la imagen', 'error'); return; }
    img.setAttribute('src', r.data.path);
    await patch([{ type: 'setAttr', id: srcId(img), name: 'src', value: r.data.path }]);
    select(img);
  }

  const imageOf = (el) => (!el ? null : el.tagName === 'IMG' ? el : el.tagName === 'PICTURE' ? el.querySelector('img') : null);

  $('file-input').addEventListener('change', (e) => {
    const img = imageOf(S.sel);
    if (img && srcId(img) !== null && e.target.files[0]) replaceImage(img, e.target.files[0]);
    e.target.value = '';
  });

  overlay.addEventListener('dragover', (e) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    const el = pick(hitAt(e));
    if (imageOf(el)) { place(hoverBox, el); e.dataTransfer.dropEffect = 'copy'; } else { hoverBox.hidden = true; e.dataTransfer.dropEffect = 'none'; }
  });
  overlay.addEventListener('drop', (e) => {
    e.preventDefault(); hoverBox.hidden = true;
    const el = pick(hitAt(e));
    const img = imageOf(el);
    if (!img) { toast('Soltar la imagen sobre la imagen que se quiere reemplazar.'); return; }
    select(el);
    replaceImage(img, e.dataTransfer.files[0]);
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  /* ── Acciones de elemento ── */

  function removeSel() {
    if (!S.sel) return;
    patch([{ type: 'removeEl', id: srcId(S.sel) }]);
  }
  function duplicateSel() {
    if (!S.sel) return;
    patch([{ type: 'duplicateEl', id: srcId(S.sel) }]);
  }
  function selectParent() {
    const slide = activeSlide();
    let p = S.sel && S.sel.parentElement;
    while (p && p !== slide && srcId(p) === null) p = p.parentElement;
    select(p && p !== slide && slide.contains(p) ? p : null);
  }

  /* ── Slides ── */

  function goSlide(i) {
    if (!S.ready) return;
    if (S.editing) S.editing.el.blur();
    S.slide = win.__szStudio.show(i);
    for (const item of rail.children) item.setAttribute('aria-current', String(Number(item.dataset.index) === S.slide));
    const cur = rail.children[S.slide];
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    hoverBox.hidden = true;
    select(null);
  }

  const labelOf = (slide, i) => (slide.getAttribute('data-label') || `Slide ${i + 1}`).replace(/^\S*\d\S*\s+/, '') || `Slide ${i + 1}`;

  function sizeThumb(t) {
    const f = t.querySelector('iframe');
    if (!f) return;
    f.style.width = `${W}px`; f.style.height = `${H}px`;
    f.style.transform = `scale(${t.clientWidth / W})`;
  }

  const thumbObserver = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      thumbObserver.unobserve(en.target);
      const i = Number(en.target.dataset.index);
      const f = h('iframe', { tabIndex: -1, 'aria-hidden': 'true', scrolling: 'no', style: 'visibility:hidden' });
      f.dataset.index = i;
      en.target.append(f);
      sizeThumb(en.target);
      f.src = `/__deck?thumb&r=${Date.now()}#${i + 1}`;
    }
  }, { root: rail, rootMargin: '300px' });

  let thumbTimer = 0;
  /** Refresca la miniatura de la slide actual un rato despues del ultimo cambio. */
  function touchThumb() {
    clearTimeout(thumbTimer);
    const i = S.slide;
    thumbTimer = setTimeout(() => {
      const f = rail.querySelector(`.thumb[data-index="${i}"] iframe`);
      if (f && f.contentWindow) f.contentWindow.location.replace(`/__deck?thumb&r=${Date.now()}#${i + 1}`);
    }, 900);
  }

  let dragFrom = null;
  function buildRail() {
    const list = slides();
    const withThumbs = list.length <= THUMBS_MAX;
    rail.replaceChildren(...list.map((slide, i) => {
      const thumb = withThumbs ? h('div', { class: 'thumb' }) : null;
      if (thumb) { thumb.dataset.index = i; }
      const item = h('div', {
        class: 'slide', tabIndex: 0, role: 'button', draggable: true, 'aria-current': String(i === S.slide),
        'aria-label': `Slide ${i + 1}: ${labelOf(slide, i)}`,
        onclick: () => goSlide(i),
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goSlide(i); } },
        ondragstart: (e) => { dragFrom = i; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); },
        ondragend: () => { dragFrom = null; for (const x of rail.children) x.classList.remove('dragging', 'drop-before', 'drop-after'); },
        ondragover: (e) => {
          if (dragFrom === null) return;
          e.preventDefault();
          const r = item.getBoundingClientRect();
          const after = e.clientY > r.top + r.height / 2;
          for (const x of rail.children) x.classList.remove('drop-before', 'drop-after');
          item.classList.add(after ? 'drop-after' : 'drop-before');
        },
        ondrop: (e) => {
          e.preventDefault(); e.stopPropagation();
          if (dragFrom === null) return;
          const after = item.classList.contains('drop-after');
          let to = i + (after ? 1 : 0);
          if (dragFrom < to) to--;
          const from = dragFrom;
          if (to !== from) { S.slide = to; patch([{ type: 'moveSlide', from, to }]); }
        },
      },
      h('span', { class: 'n', text: String(i + 1).padStart(2, '0') }),
      thumb,
      h('span', { class: 'name', text: labelOf(slide, i), style: withThumbs ? null : 'grid-column:2;margin-top:2px' }),
      h('span', { class: 'tools' },
        h('button', { type: 'button', title: 'Duplicar slide', 'aria-label': 'Duplicar slide', text: '⧉', onclick: (e) => { e.stopPropagation(); duplicateSlide(i); } }),
        h('button', { type: 'button', title: 'Borrar slide', 'aria-label': 'Borrar slide', text: '×', onclick: (e) => { e.stopPropagation(); removeSlide(i); } })));
      item.dataset.index = i;
      return item;
    }));
    for (const t of rail.querySelectorAll('.thumb')) thumbObserver.observe(t);
  }

  function duplicateSlide(i) { S.slide = i + 1; patch([{ type: 'duplicateSlide', index: i }]); }
  function removeSlide(i) {
    const list = slides();
    if (list.length < 2) { toast('Un deck necesita al menos una slide.'); return; }
    if (!window.confirm(`¿Borrar la slide ${i + 1} (${labelOf(list[i], i)})? Se puede deshacer.`)) return;
    if (S.slide > i || S.slide === list.length - 1) S.slide = Math.max(0, S.slide - 1);
    patch([{ type: 'removeSlide', index: i }]);
  }

  /* ── Panel ── */

  const group = (title, ...kids) => h('div', { class: 'group' }, title ? h('h3', { text: title }) : null, kids);
  const field = (label, input) => h('label', { class: 'f' }, label, input);

  function seg(options, current, onPick) {
    return h('div', { class: 'seg', role: 'group' }, options.map(([value, label]) => h('button', {
      type: 'button', text: label, 'aria-pressed': String(value === current), onclick: () => onPick(value),
    })));
  }

  function renderPanel() {
    if (!S.ready) return;
    const keep = panel.scrollTop;
    panel.replaceChildren(...(S.sel ? elementPanel(S.sel) : slidePanel()), commentsGroup());
    panel.scrollTop = keep;
    syncBar();
  }

  function slidePanel() {
    const slide = activeSlide();
    if (!slide) return [];
    const i = S.slide;
    const notesEl = slide.querySelector(':scope > aside.notes');
    const before = notesEl ? Array.from(notesEl.querySelectorAll('p')).map((p) => p.innerText.trim()).join('\n\n') || notesEl.innerText.trim() : '';
    const notes = h('textarea', {
      class: 'field', value: before, placeholder: 'Lo que vas a decir en esta slide. Solo lo ve quien presenta.',
      onchange: () => { if (notes.value.trim() !== before) patch([{ type: 'setNotes', index: i, text: notes.value }], { reload: true, sel: null }); },
    });
    const steps = Number(slide.getAttribute('data-steps') || 1);
    const reveals = slide.querySelectorAll('.reveal').length;
    return [
      h('div', { class: 'group' },
        h('div', { class: 'head' }, h('strong', { text: `Slide ${String(i + 1).padStart(2, '0')}` })),
        h('p', { text: labelOf(slide, i) }),
        h('p', { class: 'note', text: reveals ? `${reveals} elemento(s) animados en ${steps} paso(s). Acá se ven en su estado final.` : 'Sin animaciones por pasos.' }),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn small', text: 'Duplicar', onclick: () => duplicateSlide(i) }),
          h('button', { type: 'button', class: 'btn small danger', text: 'Borrar', onclick: () => removeSlide(i) }))),
      group('Notas del presentador', notes),
      group('Atajos', h('div', { class: 'keys' },
        h('kbd', { text: 'Doble clic' }), 'Editar texto',
        h('kbd', { text: '← ↑ → ↓' }), 'Mover 1 px (con Shift, 10)',
        h('kbd', { text: 'Alt' }), 'Arrastrar sin guías',
        h('kbd', { text: 'Esc' }), 'Subir al contenedor',
        h('kbd', { text: '⌘Z' }), 'Deshacer',
        h('kbd', { text: '⌘D' }), 'Duplicar',
        h('kbd', { text: 'Supr' }), 'Borrar')),
    ];
  }

  function elementPanel(el) {
    const k = kindOf(el);
    const cs = win.getComputedStyle(el);
    const out = [];
    const cls = Array.from(el.classList).filter((c) => c !== 'is-on').slice(0, 3).join('.');
    out.push(h('div', { class: 'group' },
      h('div', { class: 'head' }, h('strong', { text: KIND_LABEL[k] }),
        h('button', { type: 'button', class: 'btn small', text: 'Contenedor ↑', title: 'Seleccionar el elemento que lo contiene (Esc)', onclick: selectParent })),
      h('p', { class: 'note', text: `<${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}>` }),
      k === 'text' ? h('p', { text: 'Doble clic sobre el texto para editarlo.' }) : null,
      k === '3d' ? h('p', { text: 'Se puede mover y redimensionar la caja. El contenido 3D no se edita acá, y si cambia el tamaño hay que regenerar el póster con `slizdeck 3d poster`.' }) : null,
      k === 'chart' ? h('p', { text: 'Los rótulos y valores salen de los datos de abajo.' }) : null,
      k === 'media' ? h('p', { text: 'Se mueve y redimensiona entero; su interior no se edita desde Studio.' }) : null));

    const img = imageOf(el);
    if (img) {
      const alt = h('input', { class: 'field', value: img.getAttribute('alt') || '', placeholder: 'Qué muestra la imagen',
        onchange: () => { img.setAttribute('alt', alt.value); patch([{ type: 'setAttr', id: srcId(img), name: 'alt', value: alt.value }]); } });
      out.push(group('Imagen',
        h('div', { class: 'row one' }, h('button', { type: 'button', class: 'btn block', text: 'Reemplazar imagen…', onclick: () => $('file-input').click() })),
        h('p', { class: 'note', text: 'También se puede soltar un archivo sobre la imagen. Se copia a assets/ junto al deck.' }),
        h('div', { class: 'row one' }, field('Texto alternativo', alt))));
    }

    if (el.hasAttribute('data-counter')) {
      const val = h('input', { class: 'field', value: el.getAttribute('data-counter'), inputMode: 'decimal',
        onchange: () => {
          const v = val.value.trim().replace(',', '.');
          if (!/^-?\d+(\.\d+)?$/.test(v)) { toast('El valor final tiene que ser un número.', 'error'); val.value = el.getAttribute('data-counter'); return; }
          patch([{ type: 'setAttr', id: srcId(el), name: 'data-counter', value: v }], { reload: true, sel: srcId(el) });
        } });
      out.push(group('Contador', h('div', { class: 'row one' }, field('Valor final', val)),
        h('p', { class: 'note', text: 'La cifra cuenta desde 0 hasta este valor al entrar la slide.' })));
    }

    if (k === 'chart') out.push(chartGroup(el));

    if (k === 'text' || (k === 'box' && el.textContent.trim()) || el.hasAttribute('data-counter')) {
      const size = h('input', { class: 'field', type: 'number', min: 8, max: 600, step: 1, value: Math.round(parseFloat(cs.fontSize)),
        onchange: () => { const n = Math.max(8, Math.min(600, Number(size.value) || 0)); setStyle(el, { 'font-size': `${n}px` }).then(renderPanel); } });
      const wNow = Number(cs.fontWeight) || 400;
      const weights = [[400, 'Regular'], [500, 'Medio'], [700, 'Bold']];
      const wCur = weights.reduce((a, b) => (Math.abs(b[0] - wNow) < Math.abs(a[0] - wNow) ? b : a))[0];
      const aNow = /center/.test(cs.textAlign) ? 'center' : /right|end/.test(cs.textAlign) ? 'right' : 'left';
      const inlineColor = (el.style.color.match(/var\((--cs-[\w-]+)\)/) || [])[1] || null;
      const rootCs = win.getComputedStyle(doc.documentElement);
      const tokens = COLOR_TOKENS.filter((t) => rootCs.getPropertyValue(t).trim());
      out.push(group('Texto',
        h('div', { class: 'row size' }, field('Tamaño (px)', size),
          field('Peso', seg(weights, wCur, (v) => setStyle(el, { 'font-weight': String(v) }).then(renderPanel)))),
        h('div', { class: 'row one' }, field('Alineación',
          seg([['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']], aNow, (v) => setStyle(el, { 'text-align': v }).then(renderPanel)))),
        h('div', { class: 'row one' }, field('Color (del pack de estilo)', h('div', { class: 'swatches' },
          h('button', { type: 'button', class: 'swatch none', title: 'El del diseño', 'aria-label': 'Color del diseño', 'aria-pressed': String(!inlineColor),
            onclick: () => setStyle(el, { color: null }).then(renderPanel) }),
          tokens.map((t) => h('button', { type: 'button', class: 'swatch', title: t, 'aria-label': t, 'aria-pressed': String(inlineColor === t),
            style: `--c:${rootCs.getPropertyValue(t).trim()}`, onclick: () => setStyle(el, { color: `var(${t})` }).then(renderPanel) })))))));
    }

    // Animacion por pasos.
    const slide = activeSlide();
    const steps = Number(slide.getAttribute('data-steps') || 1);
    const cur = el.classList.contains('reveal') ? String(el.getAttribute('data-step') || 1) : '';
    const stepSel = h('select', { class: 'field',
      onchange: () => patch([{ type: 'setStep', id: srcId(el), step: stepSel.value ? Number(stepSel.value) : null }], { reload: true, sel: srcId(el) }) },
    h('option', { value: '', text: 'Siempre visible' }),
    Array.from({ length: Math.min(20, steps + 1) }, (_, n) => h('option', { value: String(n + 1), text: `Aparece en el paso ${n + 1}${n + 1 > steps ? ' (nuevo)' : ''}` })));
    stepSel.value = cur;
    out.push(group('Animación', h('div', { class: 'row one' }, stepSel),
      h('p', { class: 'note', text: 'Para verla correr: Vista previa.' })));

    // Posicion y tamano.
    const o = offsetOf(el);
    // En graficas y 3D el alto inline es parte del diseno: restablecer no lo quita.
    const sizeProps = k === 'chart' || k === '3d' ? ['width', 'flex', 'max-width'] : ['width', 'height', 'min-height', 'font-size', 'flex', 'max-width'];
    const sized = sizeProps.filter((p) => el.style.getPropertyValue(p));
    out.push(group('Posición y tamaño',
      h('p', { text: o.x || o.y ? `Desplazado ${Math.round(o.x)} px, ${Math.round(o.y)} px de su lugar en el diseño.` : 'En su lugar del diseño.' }),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn small', text: 'Restablecer posición', disabled: !(o.x || o.y), onclick: () => setStyle(el, { translate: null }).then(renderPanel) }),
        h('button', { type: 'button', class: 'btn small', text: 'Restablecer tamaño', disabled: !sized.length,
          onclick: () => setStyle(el, Object.fromEntries(sized.map((p) => [p, null]))).then(renderPanel) }))));

    out.push(group('Elemento', h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn small', text: 'Duplicar', onclick: duplicateSel }),
      h('button', { type: 'button', class: 'btn small danger', text: 'Borrar', onclick: removeSel }))));
    return out;
  }

  /* Datos de una .sz-chart: una fila por etiqueta, una columna por serie. */
  function chartGroup(fig) {
    const tag = fig.querySelector('script[type="application/json"]');
    let spec = null;
    try { spec = JSON.parse(tag.textContent); } catch (e) { /* sin JSON legible */ }
    if (!spec || !Array.isArray(spec.series) || !spec.series.length) {
      return group('Datos', h('p', { text: 'Esta gráfica no trae sus datos en un bloque JSON: se edita en el HTML.' }));
    }
    const rows = Math.max(...spec.series.map((s) => (s.values || []).length), (spec.labels || []).length);
    const data = {
      labels: Array.from({ length: rows }, (_, r) => String((spec.labels || [])[r] ?? r + 1)),
      series: spec.series.map((s) => ({ ...s, values: Array.from({ length: rows }, (_, r) => (s.values || [])[r] ?? '') })),
    };
    const wrap = h('div', {});
    const draw = () => {
      const cell = (value, on, cls) => h('input', { class: `field${cls || ''}`, value: String(value), oninput: (e) => on(e.target.value) });
      const table = h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}), data.series.map((s) => h('th', {}, cell(s.name || '', (v) => { s.name = v; }))))),
        h('tbody', {}, data.labels.map((label, r) => h('tr', {},
          h('td', {}, cell(label, (v) => { data.labels[r] = v; })),
          data.series.map((s) => h('td', {}, cell(s.values[r], (v) => { s.values[r] = v; })))))));
      wrap.replaceChildren(
        h('div', { class: 'chart-table' }, table),
        h('div', { class: 'actions', style: 'margin-bottom:8px' },
          h('button', { type: 'button', class: 'btn small', text: '+ Fila', onclick: () => { data.labels.push(''); data.series.forEach((s) => s.values.push('')); draw(); } }),
          h('button', { type: 'button', class: 'btn small', text: '− Fila', disabled: data.labels.length < 2, onclick: () => { data.labels.pop(); data.series.forEach((s) => s.values.pop()); draw(); } }),
          h('button', { type: 'button', class: 'btn small', text: '+ Serie', onclick: () => { data.series.push({ name: `Serie ${data.series.length + 1}`, values: data.labels.map(() => '') }); draw(); } }),
          h('button', { type: 'button', class: 'btn small', text: '− Serie', disabled: data.series.length < 2, onclick: () => { data.series.pop(); draw(); } })),
        h('button', { type: 'button', class: 'btn block primary', text: 'Aplicar datos', onclick: apply }));
    };
    const apply = () => {
      const series = [];
      for (const s of data.series) {
        const values = s.values.map((v) => Number(String(v).trim().replace(',', '.')));
        if (s.values.some((v) => String(v).trim() === '') || values.some((v) => !Number.isFinite(v))) {
          toast('Todos los valores tienen que ser números (sin símbolos: el prefijo y la unidad van aparte).', 'error');
          return;
        }
        series.push({ ...s, values });
      }
      patch([{ type: 'setChartData', id: srcId(fig), data: { ...spec, labels: data.labels.map((l) => String(l)), series } }], { keepSel: true, sel: srcId(fig) });
    };
    draw();
    return group('Datos', wrap);
  }

  /* ── Comentarios al agente ── */

  const STATUS_LABEL = { draft: 'borrador', sent: 'enviado', delivered: 'lo tiene el agente' };

  function commentsGroup() {
    const el = S.sel;
    const open = S.comments.filter((c) => c.status !== 'resolved');
    const text = h('textarea', { class: 'field', style: 'min-height:60px', placeholder: el ? 'Qué debería cambiar el agente en este elemento' : 'Qué debería cambiar el agente en esta slide' });
    const add = async () => {
      if (!text.value.trim()) return;
      const slide = activeSlide();
      const target = el ? {
        tag: el.tagName.toLowerCase(), classes: Array.from(el.classList).filter((c) => c !== 'is-on').join(' '),
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 200),
        html: el.outerHTML.replace(new RegExp(` ${SRC}="\\d+"`, 'g'), '').slice(0, 800),
      } : null;
      const r = await call('comments', { action: 'add', text: text.value, slide: S.slide + 1, label: slide.getAttribute('data-label') || '', target });
      if (!r.ok) { toast(r.data.error || 'No se pudo guardar el comentario', 'error'); return; }
      S.comments = r.data.comments;
      renderPanel();
    };
    return group('Comentarios para el agente',
      h('p', { class: 'note', text: 'Para lo que no se resuelve moviendo o editando. Se guardan junto al deck y el agente los aplica cuando se los envías.' }),
      open.map((c) => h('div', { class: 'comment' },
        h('div', { class: 'meta' },
          h('span', {}, `Slide ${String(c.slide).padStart(2, '0')}${c.target ? ` · <${c.target.tag}>` : ''} · `, h('span', { class: `tag${c.status === 'draft' ? '' : ' sent'}`, text: STATUS_LABEL[c.status] || c.status })),
          c.status === 'draft' ? h('button', { type: 'button', text: 'Quitar', onclick: async () => {
            const r = await call('comments', { action: 'remove', id: c.id });
            if (r.ok) { S.comments = r.data.comments; renderPanel(); }
          } }) : null),
        h('div', { class: 'body', text: c.text }))),
      text,
      h('div', { class: 'actions', style: 'margin-top:8px' }, h('button', { type: 'button', class: 'btn small', text: 'Agregar comentario', onclick: add })));
  }

  $('btn-send').addEventListener('click', async () => {
    const r = await call('comments', { action: 'send' });
    if (!r.ok) { toast(r.data.error || 'No se pudo enviar', 'error'); return; }
    S.comments = r.data.comments;
    renderPanel();
    toast('Comentarios enviados. El agente los recibe si está esperando con `slizdeck studio comments --wait`; si no, pedile que los revise.');
  });

  /* ── Barra ── */

  $('btn-undo').addEventListener('click', () => history('undo'));
  $('btn-redo').addEventListener('click', () => history('redo'));
  $('btn-preview').addEventListener('click', () => window.open(`/__deck?preview#${S.slide + 1}`, '_blank', 'noopener'));
  $('drawer-close').addEventListener('click', () => { $('drawer').hidden = true; });

  $('btn-check').addEventListener('click', async () => {
    const btn = $('btn-check');
    await queue;
    btn.disabled = true; btn.textContent = 'Revisando…';
    let r;
    try { r = await call('check', {}); } catch (e) { r = { ok: false, data: {} }; }
    btn.disabled = false; btn.textContent = 'Revisar';
    if (!r.ok) { toast('No se pudo correr la revisión', 'error'); return; }
    const section = (title, res) => (res ? [
      h('h4', {}, h('span', { class: `dot${res.code ? ' bad' : ''}` }), `${title} · ${res.code ? 'con hallazgos' : 'sin problemas'}`),
      h('pre', { text: res.out.trim() || '(sin salida)' }),
    ] : []);
    $('drawer-body').replaceChildren(
      ...section('audit (estático: contraste de tokens, HTML, voz)', r.data.audit),
      ...section('check-overflow (Chrome: texto desbordado o encimado)', r.data.overflow),
      h('p', { class: 'note', style: 'color:var(--ink-3);margin:0', text: 'No cubre todo: check-reveal, check-contrast y los exports se corren desde la terminal (`slizdeck check deck.html`).' }));
    $('drawer').hidden = false;
  });

  /* ── Teclado ── */

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); history(e.shiftKey ? 'redo' : 'undo'); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); history('redo'); return; }
    if (typing || !S.ready || S.editing) return;
    if (e.key === 'Escape') {
      if (!$('drawer').hidden) $('drawer').hidden = true; else if (S.sel) selectParent();
      return;
    }
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (S.sel) {
      if (arrows[e.key]) { e.preventDefault(); const k = e.shiftKey ? 10 : 1; nudge(arrows[e.key][0] * k, arrows[e.key][1] * k); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); return; }
      if (e.key === 'Enter') { e.preventDefault(); startEdit(S.sel, null); return; }
    } else if (!mod) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goSlide(S.slide + 1); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goSlide(S.slide - 1); }
    }
  });

  /* ── Arranque ── */

  async function refreshState() {
    let r;
    try { r = await call('state'); } catch (e) { setStatus('Sin conexión con Studio', 'error'); return false; }
    if (!r.ok) { setStatus('Sesión de Studio no válida', 'error'); return false; }
    const changed = JSON.stringify(r.data.comments) !== JSON.stringify(S.comments);
    S.comments = r.data.comments;
    if (S.rev === null) Object.assign(S, r.data);
    if (changed && S.ready && !panel.contains(document.activeElement)) renderPanel();
    syncBar();
    return true;
  }

  async function boot() {
    canvas.classList.add('loading');
    fit();
    if (!(await refreshState())) return;
    $('file-name').textContent = S.name;
    document.title = `${S.name} · Slizdeck Studio`;
    setStatus('Guardado');
    const n = parseInt(location.hash.slice(1), 10);
    if (n > 0) S.slide = n - 1;
    loadDeck(null);

    const events = new EventSource('/__api/events');
    events.addEventListener('changed', (e) => {
      const data = JSON.parse(e.data);
      if (data.rev === S.rev) return;
      Object.assign(S, data);
      syncBar();
      setStatus('Recargado: el archivo cambió en disco');
      toast('El deck cambió en disco (el agente u otro editor). Se recargó.');
      loadDeck(null);
      refreshState();
    });
    events.onerror = () => { if (events.readyState === 2) setStatus('Sin conexión con Studio', 'error'); };
    // Los comentarios los resuelve el agente por fuera, en su propio archivo.
    setInterval(() => { if (!document.hidden) refreshState(); }, 4000);
  }

  window.addEventListener('resize', fit);
  new ResizeObserver(fit).observe($('stage'));
  boot();
})();
