/**
 * slizdeck · measure-deck
 *
 * Renderiza un deck en Chrome headless, lo lleva al estado final (todos los
 * .reveal encendidos, contadores en su cifra real, el mismo finalizeForPrint
 * que usa el PDF) y devuelve la geometria real de cada slide: cajas con
 * fondo o borde, bloques de texto con sus runs de estilo, imagenes y SVG
 * rasterizados, en coordenadas del canvas (1920x1080 por default).
 *
 * Es la base del export a PPTX por geometria: en vez de reconocer clases
 * conocidas (lo que hacia export-pptx.mjs hasta 2.0), mide lo que el
 * navegador realmente dibujo. Un patron de layout nuevo se exporta sin
 * tocar el exportador.
 *
 * Mismas convenciones que el resto de los scripts con Chrome: el harness se
 * escribe al lado del deck (las rutas relativas de <img> tienen que seguir
 * resolviendo) y se espera con rAF + setTimeout, nunca con un rAF anidado.
 */

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './find-chrome.mjs';

const HARNESS = String.raw`
<style>
  *, *::before, *::after {
    transition-duration: 0s !important; transition-delay: 0s !important;
    animation-duration: 0s !important; animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
  }
</style>
<script>
(() => {
const SVGNS = 'http://www.w3.org/2000/svg';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function finalize() {
  try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));
  document.querySelectorAll('deck-stage > section').forEach((s) => s.setAttribute('data-deck-active', ''));
}

/* ── Color: cualquier sintaxis CSS (rgb, color(), oklch, color-mix) a hex+alpha,
   pintando un pixel. Es la unica normalizacion que no depende de como Chrome
   decida serializar el valor computado. */
const cv = document.createElement('canvas'); cv.width = cv.height = 1;
const cx = cv.getContext('2d', { willReadFrequently: true });
const colorCache = new Map();
function color(css) {
  if (!css || css === 'transparent' || css === 'none') return null;
  if (colorCache.has(css)) return colorCache.get(css);
  cx.clearRect(0, 0, 1, 1);
  cx.fillStyle = 'rgba(0,0,0,0)';
  cx.fillStyle = css;
  cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
  const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const out = a === 0 ? null : { hex, a: Math.round((a / 255) * 100) / 100 };
  colorCache.set(css, out);
  return out;
}
const COLOR_FN = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-fA-F]{3,8}/;
const firstGradientColor = (bgImage) => {
  const m = COLOR_FN.exec(bgImage || '');
  return m ? color(m[0]) : null;
};

(async () => {
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  finalize();
  await sleep(200);
  finalize();               // resetAndEnter() del deck puede haber corrido en medio
  try { await document.fonts.ready; } catch (e) {}
  await sleep(50);

  const stage = document.querySelector('deck-stage');
  const W = stage ? parseInt(stage.getAttribute('width') || '1920', 10) : 1920;
  const H = stage ? parseInt(stage.getAttribute('height') || '1080', 10) : 1080;
  const rootStyle = getComputedStyle(document.documentElement);
  const stageBg = color(rootStyle.getPropertyValue('--cs-cream').trim()) || { hex: 'FFFFFF', a: 1 };

  let notes = [];
  try { notes = JSON.parse(document.getElementById('speaker-notes')?.textContent || '[]'); } catch (e) {}

  const fontsUsed = new Set();
  const slides = [];
  const sections = [...document.querySelectorAll('deck-stage > section')];

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sRect = section.getBoundingClientRect();
    const scale = sRect.width / W || 1;
    const rel = (r) => ({
      x: (r.left - sRect.left) / scale, y: (r.top - sRect.top) / scale,
      w: r.width / scale, h: r.height / scale,
    });
    const canvasBox = { x: 0, y: 0, w: W, h: H };
    const intersect = (a, b) => {
      const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
      const r = Math.min(a.x + a.w, b.x + b.w), btm = Math.min(a.y + a.h, b.y + b.h);
      return r > x && btm > y ? { x, y, w: r - x, h: btm - y } : null;
    };

    const items = [];
    const collected = new Set();     // text nodes exportados
    const stats = { gradientsFlattened: 0, pseudoDecorations: 0, pseudoText: [], rasterFailed: [] };

    /* ── Fondo de la slide ─────────────────────────────────────────── */
    const scs = getComputedStyle(section);
    const bgColor = color(scs.backgroundColor);
    const pseudoPaints = (el) => ['::before', '::after'].some((p) => {
      const ps = getComputedStyle(el, p);
      if (!ps.content || ps.content === 'none' || ps.content === 'normal') return false;
      return ps.backgroundImage !== 'none' || !!color(ps.backgroundColor);
    });
    const rasterBg = scs.backgroundImage !== 'none' || pseudoPaints(section);
    const bg = bgColor || firstGradientColor(scs.backgroundImage) || stageBg;

    /* ── Utilidades de estilo ──────────────────────────────────────── */
    const isInline = (d) => d === 'inline' || d === 'contents';
    const isReplaced = (el) => el.namespaceURI === SVGNS || ['IMG', 'CANVAS', 'VIDEO', 'IFRAME', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
    const px = (v) => parseFloat(v) || 0;
    const family = (ff) => (ff || '').split(',')[0].trim().replace(/^["']|["']$/g, '');

    function boxFill(el, cs) {
      const c = color(cs.backgroundColor);
      if (c) return c;
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) {
        stats.gradientsFlattened++;
        return firstGradientColor(cs.backgroundImage);
      }
      return null;
    }
    function borders(cs) {
      const side = (s) => {
        const w = px(cs['border' + s + 'Width']);
        const st = cs['border' + s + 'Style'];
        const c = color(cs['border' + s + 'Color']);
        return w > 0 && st !== 'none' && st !== 'hidden' && c ? { w, c, dash: st === 'dashed' || st === 'dotted' } : null;
      };
      return { t: side('Top'), r: side('Right'), b: side('Bottom'), l: side('Left') };
    }
    const sameBorder = (b) => b.t && b.r && b.b && b.l &&
      [b.r, b.b, b.l].every((o) => o.w === b.t.w && o.c.hex === b.t.c.hex && o.c.a === b.t.c.a);

    function pushBox(el, cs, rect, op) {
      const fill = boxFill(el, cs);
      const b = borders(cs);
      const any = fill || b.t || b.r || b.b || b.l;
      if (!any || rect.w < 0.5 || rect.h < 0.5) return;
      const radius = Math.min(px(cs.borderTopLeftRadius), rect.w / 2, rect.h / 2);
      if (fill || sameBorder(b)) {
        items.push({ type: 'rect', ...rect, fill, line: sameBorder(b) ? b.t : null, radius, op });
      }
      if (!sameBorder(b)) {
        // Bordes de un solo lado (el acento a la izquierda de una quote, la
        // regla bajo un titulo): una franja fina por lado.
        if (b.t) items.push({ type: 'rect', x: rect.x, y: rect.y, w: rect.w, h: b.t.w, fill: b.t.c, op });
        if (b.b) items.push({ type: 'rect', x: rect.x, y: rect.y + rect.h - b.b.w, w: rect.w, h: b.b.w, fill: b.b.c, op });
        if (b.l) items.push({ type: 'rect', x: rect.x, y: rect.y, w: b.l.w, h: rect.h, fill: b.l.c, op });
        if (b.r) items.push({ type: 'rect', x: rect.x + rect.w - b.r.w, y: rect.y, w: b.r.w, h: rect.h, fill: b.r.c, op });
      }
    }

    function countPseudo(el) {
      for (const p of ['::before', '::after']) {
        const ps = getComputedStyle(el, p);
        if (!ps.content || ps.content === 'none' || ps.content === 'normal') continue;
        const literal = /^"(.*)"$/s.exec(ps.content);
        if (literal && /[\p{L}\p{N}]{2,}/u.test(literal[1])) {
          stats.pseudoText.push(literal[1].slice(0, 40));
        } else if (ps.backgroundImage !== 'none' || color(ps.backgroundColor) || px(ps.borderTopWidth) || px(ps.borderLeftWidth)) {
          stats.pseudoDecorations++;
        }
      }
    }

    /* ── Texto ─────────────────────────────────────────────────────── */
    function runStyle(el) {
      const cs = getComputedStyle(el);
      let c = color(cs.webkitTextFillColor) || color(cs.color);
      const fillTransparent = !color(cs.webkitTextFillColor) && cs.webkitTextFillColor !== cs.color && cs.webkitTextFillColor !== 'currentcolor';
      if (!c || fillTransparent) {
        // Texto con degradado (background-clip:text): el color solido que
        // el PDF ya usa para la misma palabra.
        let g = null;
        for (let e = el; e && e !== section && !g; e = e.parentElement) g = firstGradientColor(getComputedStyle(e).backgroundImage);
        c = g || c || { hex: '000000', a: 1 };
      }
      const fam = family(cs.fontFamily);
      fontsUsed.add(fam);
      const deco = cs.textDecorationLine || '';
      return {
        color: c, size: px(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400,
        italic: cs.fontStyle === 'italic' || cs.fontStyle.startsWith('oblique'),
        font: fam, spacing: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing),
        underline: deco.includes('underline'), strike: deco.includes('line-through'),
        transform: cs.textTransform, ws: cs.whiteSpace, hidden: cs.visibility === 'hidden',
      };
    }
    const applyTransform = (t, tr) => tr === 'uppercase' ? t.toUpperCase()
      : tr === 'lowercase' ? t.toLowerCase()
      : tr === 'capitalize' ? t.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()) : t;

    function collectText(container, op) {
      const runs = [];
      const rects = [];
      const inlineBoxes = [];
      const visit = (node) => {
        for (const n of node.childNodes) {
          if (n.nodeType === 3) {
            if (!n.textContent) continue;
            const st = runStyle(n.parentElement);
            if (st.hidden) continue;
            // La opacidad de un <span> dentro del bloque (el numero atenuado
            // del footer) se suma al alpha de su color.
            let rop = 1;
            for (let e = n.parentElement; e && e !== container; e = e.parentElement) rop *= parseFloat(getComputedStyle(e).opacity || '1');
            if (rop < 1) st.color = { ...st.color, a: Math.round(st.color.a * rop * 100) / 100 };
            const pre = /^pre/.test(st.ws) || st.ws === 'break-spaces';
            let t = pre ? n.textContent : n.textContent.replace(/[\t\n\r ]+/g, ' ');
            t = applyTransform(t, st.transform);
            runs.push({ text: t, pre, st, node: n });
            const r = document.createRange();
            r.selectNodeContents(n);
            for (const cr of r.getClientRects()) if (cr.width > 0 && cr.height > 0) rects.push(rel(cr));
          } else if (n.nodeType === 1) {
            const cs = getComputedStyle(n);
            if (cs.display === 'none') continue;
            if (n.tagName === 'BR') { runs.push({ br: true }); continue; }
            if (isReplaced(n) || !isInline(cs.display)) continue;   // atomicos: se exportan solos
            if (boxFill(n, cs) || Object.values(borders(cs)).some(Boolean)) inlineBoxes.push(n);
            visit(n);
          }
        }
      };
      visit(container);
      if (!runs.some((r) => r.text && r.text.trim())) return null;

      // Colapsar espacios entre runs como lo hace el navegador.
      let prevSpace = true;
      for (const r of runs) {
        if (r.br) { prevSpace = true; continue; }
        if (r.pre) { prevSpace = /\s$/.test(r.text); continue; }
        if (prevSpace) r.text = r.text.replace(/^ /, '');
        if (r.text) prevSpace = / $/.test(r.text);
      }
      for (let i = runs.length - 1; i >= 0; i--) {
        if (runs[i].br) continue;
        if (runs[i].pre) break;
        runs[i].text = runs[i].text.replace(/ $/, '');
        if (runs[i].text) break;
      }
      if (!rects.length) return null;
      for (const r of runs) if (r.node) collected.add(r.node);

      for (const ib of inlineBoxes) {
        const ics = getComputedStyle(ib);
        for (const cr of ib.getClientRects()) pushBox(ib, ics, rel(cr), op);
      }

      // Lineas: rects que no se solapan verticalmente con la linea anterior.
      rects.sort((a, b) => a.y - b.y);
      let lines = 0, lineBottom = -Infinity;
      for (const r of rects) {
        if (r.y >= lineBottom - 1) { lines++; lineBottom = r.y + r.h; }
        else lineBottom = Math.max(lineBottom, r.y + r.h);
      }
      const u = {
        x: Math.min(...rects.map((r) => r.x)), y: Math.min(...rects.map((r) => r.y)),
        r: Math.max(...rects.map((r) => r.x + r.w)), b: Math.max(...rects.map((r) => r.y + r.h)),
      };
      const ccs = getComputedStyle(container);
      const cb = rel(container.getBoundingClientRect());
      const content = {
        x: cb.x + (px(ccs.paddingLeft) + px(ccs.borderLeftWidth)) / 1,
        w: cb.w - px(ccs.paddingLeft) - px(ccs.paddingRight) - px(ccs.borderLeftWidth) - px(ccs.borderRightWidth),
      };
      const fs = px(ccs.fontSize);
      const lh = ccs.lineHeight === 'normal' ? fs * 1.2 : px(ccs.lineHeight);
      let align = ccs.textAlign;
      if (align === 'start' || align === '-webkit-auto') align = 'left';
      if (align === 'end') align = 'right';
      if (/flex|grid/.test(ccs.display) && ccs.justifyContent === 'center') align = 'center';

      return {
        type: 'text',
        x: u.x, y: u.y, w: u.r - u.x, h: u.b - u.y,
        content, lines, align, lineHeight: lh,
        firstLineH: rects[0].h,
        runs: runs.filter((r) => r.br || r.text).map((r) => r.br ? { br: true } : {
          text: r.text, color: r.st.color, size: r.st.size, bold: r.st.weight >= 600, italic: r.st.italic,
          font: r.st.font, spacing: r.st.spacing, underline: r.st.underline, strike: r.st.strike,
        }),
        list: container.tagName === 'LI' ? (ccs.listStyleType === 'none' ? null : (container.parentElement?.tagName === 'OL' ? 'number' : 'bullet')) : null,
        op,
      };
    }

    /* ── Imagenes y SVG, rasterizados en el propio navegador ───────── */
    const loadImage = (src) => new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('no carga'));
      im.src = src;
    });

    function drawFitted(ctx, img, nw, nh, box, cs) {
      const fit = cs.objectFit || 'fill';
      const [px0, py0] = (cs.objectPosition || '50% 50%').split(' ').map((v) => v.endsWith('%') ? parseFloat(v) / 100 : null);
      let w = box.w, h = box.h;
      if (fit === 'cover' || fit === 'contain' || fit === 'scale-down' || fit === 'none') {
        const s = fit === 'cover' ? Math.max(box.w / nw, box.h / nh)
          : fit === 'none' ? 1
          : fit === 'scale-down' ? Math.min(1, box.w / nw, box.h / nh)
          : Math.min(box.w / nw, box.h / nh);
        w = nw * s; h = nh * s;
      }
      const ox = (box.w - w) * (px0 ?? 0.5), oy = (box.h - h) * (py0 ?? 0.5);
      ctx.drawImage(img, ox, oy, w, h);
    }

    async function rasterImage(el, cs, box, vis, op) {
      const nw = el.naturalWidth || box.w, nh = el.naturalHeight || box.h;
      const k = Math.min(2, Math.max(1, nw / box.w));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(vis.w * k)); c.height = Math.max(1, Math.round(vis.h * k));
      const ctx = c.getContext('2d');
      ctx.scale(k, k);
      ctx.translate(box.x - vis.x, box.y - vis.y);
      const radius = Math.min(px(cs.borderTopLeftRadius) / scale, box.w / 2, box.h / 2);
      if (radius > 0) { ctx.beginPath(); ctx.roundRect(0, 0, box.w, box.h, radius); ctx.clip(); }
      if (cs.filter && cs.filter !== 'none') ctx.filter = cs.filter;
      drawFitted(ctx, el, nw, nh, box, cs);
      const src = el.currentSrc || el.src || '';
      const jpeg = /\.jpe?g($|\?)|^data:image\/jpe?g/i.test(src) && radius === 0;
      try {
        return { type: 'image', ...vis, data: c.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.9), op, alt: el.alt || '' };
      } catch (e) {
        // Canvas contaminado (imagen remota sin CORS): Node la baja y la
        // coloca sin recorte.
        return { type: 'image-src', ...box, src, op, alt: el.alt || '' };
      }
    }

    const SVG_PROPS = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
      'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'visibility', 'display', 'font-family',
      'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'stop-color', 'stop-opacity', 'transform', 'transform-origin'];

    async function rasterSvg(svg, box, vis, op) {
      const clone = svg.cloneNode(true);
      const src = [svg, ...svg.querySelectorAll('*')];
      const dst = [clone, ...clone.querySelectorAll('*')];
      const texts = [];
      src.forEach((o, i) => {
        const d = dst[i];
        const cs = getComputedStyle(o);
        d.setAttribute('style', SVG_PROPS.map((p) => p + ':' + cs.getPropertyValue(p)).join(';'));
        if (o.tagName === 'text' && cs.display !== 'none' && cs.visibility !== 'hidden') texts.push([o, d]);
      });
      // El texto de un SVG (etiquetas de un chart, rotulos de un diagrama)
      // viaja como texto editable; el resto se rasteriza.
      for (const [o, d] of texts) {
        const r = rel(o.getBoundingClientRect());
        const content = (o.textContent || '').replace(/\s+/g, ' ').trim();
        if (!content || r.w <= 0) continue;
        const cs = getComputedStyle(o);
        const ctm = o.getScreenCTM ? o.getScreenCTM() : null;
        const k = ctm ? Math.hypot(ctm.a, ctm.b) / scale : 1;
        const angle = ctm ? Math.round((Math.atan2(ctm.b, ctm.a) * 180) / Math.PI) : 0;
        const fam = family(cs.fontFamily);
        fontsUsed.add(fam);
        const anchor = cs.getPropertyValue('text-anchor');
        // Rotado (rotate() en el SVG): la caja medida es la envolvente del
        // texto girado; se reconstruye la caja sin girar alrededor del mismo
        // centro y PowerPoint la rota.
        let tb = { x: r.x, y: r.y, w: r.w, h: r.h };
        if (angle) {
          const len = (o.getComputedTextLength ? o.getComputedTextLength() : r.w) * k;
          const th = px(cs.fontSize) * k * 1.25;
          const cxm = r.x + r.w / 2, cym = r.y + r.h / 2;
          tb = { x: cxm - len / 2, y: cym - th / 2, w: len, h: th };
        }
        items.push({
          type: 'text', x: tb.x, y: tb.y, w: tb.w, h: tb.h, content: { x: tb.x, w: tb.w }, lines: 1, rotate: angle || undefined,
          align: anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left',
          lineHeight: tb.h, firstLineH: tb.h,
          runs: [{ text: content, color: color(cs.fill) || { hex: '000000', a: 1 }, size: px(cs.fontSize) * k,
            bold: (parseInt(cs.fontWeight, 10) || 400) >= 600, italic: cs.fontStyle === 'italic', font: fam,
            spacing: 0, underline: false, strike: false }],
          op, fromSvg: true,
        });
        for (const tn of o.querySelectorAll('*')) void tn;
        const walker = document.createTreeWalker(o, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) collected.add(walker.currentNode);
        d.remove();
      }
      clone.setAttribute('xmlns', SVGNS);
      clone.setAttribute('width', String(box.w));
      clone.setAttribute('height', String(box.h));
      if (!clone.getAttribute('viewBox') && svg.viewBox?.baseVal?.width) {
        const vb = svg.viewBox.baseVal;
        clone.setAttribute('viewBox', [vb.x, vb.y, vb.width, vb.height].join(' '));
      }
      const xml = new XMLSerializer().serializeToString(clone);
      try {
        const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml));
        const k = 2;
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(vis.w * k)); c.height = Math.max(1, Math.round(vis.h * k));
        const ctx = c.getContext('2d');
        ctx.scale(k, k);
        ctx.drawImage(img, box.x - vis.x, box.y - vis.y, box.w, box.h);
        return { type: 'image', ...vis, data: c.toDataURL('image/png'), op, alt: svg.getAttribute('aria-label') || '' };
      } catch (e) {
        stats.rasterFailed.push('svg' + (svg.id ? '#' + svg.id : ''));
        return null;
      }
    }

    /* ── Recorrido en orden de pintado (orden de documento) ────────── */
    async function walk(el, opacity, clip) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return;
      const op = opacity * parseFloat(cs.opacity || '1');
      if (op < 0.02) return;
      const box = rel(el.getBoundingClientRect());
      const hidden = cs.visibility === 'hidden';

      if (el.namespaceURI === SVGNS) {
        const vis = intersect(box, clip);
        if (vis && !hidden) { const it = await rasterSvg(el, box, vis, op); if (it) items.push(it); }
        return;
      }
      if (el.tagName === 'IMG') {
        const vis = intersect(box, clip);
        if (vis && !hidden && el.complete && el.naturalWidth) items.push(await rasterImage(el, cs, box, vis, op));
        else if (vis && !hidden) stats.rasterFailed.push('img ' + (el.getAttribute('src') || '').slice(0, 60));
        return;
      }
      if (el.tagName === 'CANVAS') {
        const vis = intersect(box, clip);
        try { if (vis) items.push({ type: 'image', ...box, data: el.toDataURL('image/png'), op }); } catch (e) { stats.rasterFailed.push('canvas'); }
        return;
      }

      if (el !== section && !hidden && !isInline(cs.display)) pushBox(el, cs, box, op);
      if (el !== section) countPseudo(el);
      if (!isInline(cs.display) || el === section) {
        const t = collectText(el, op);
        if (t) items.push(t);
      }

      let childClip = clip;
      if (el !== section && /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY)) childClip = intersect(box, clip) || clip;
      for (const child of el.children) await walk(child, op, childClip);
    }

    await walk(section, 1, canvasBox);

    /* ── Texto que no viajo ────────────────────────────────────────── */
    const lostText = [];
    const tw = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (collected.has(n) || !n.textContent.trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest('script,style,template,noscript')) continue;
      const pcs = getComputedStyle(p);
      if (pcs.visibility === 'hidden' || !p.getClientRects().length) continue;
      let op = 1;
      for (let e = p; e && e !== section.parentElement; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity || '1');
      if (op < 0.02) continue;
      const text = n.textContent.replace(/\s+/g, ' ').trim();
      if (text.length < 2) continue;
      lostText.push({ tag: p.tagName.toLowerCase(), cls: (p.getAttribute('class') || '').trim(), text: text.slice(0, 48) });
    }

    slides.push({
      index: si + 1,
      label: section.getAttribute('data-label') || '',
      bg, rasterBg, items, lostText, stats,
      notes: typeof notes[si] === 'string' ? notes[si] : '',
    });
  }

  const out = document.createElement('script');
  out.type = 'application/json';
  out.id = 'slizdeck-geometry';
  out.textContent = JSON.stringify({ canvas: { w: W, h: H }, fonts: [...fontsUsed].filter(Boolean), slides })
    .replace(/</g, '\\u003c');
  document.body.appendChild(out);
  document.title = 'SLIZDECK_GEOMETRY_DONE';
})().catch((e) => { document.title = 'SLIZDECK_GEOMETRY_ERROR::' + (e && e.message); });
})();
</script>
`;

const CHROME_FLAGS = [
  '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1920,1080',
  // Sin esto, dibujar un <img> local en un canvas lo contamina (file:// es
  // un origen opaco) y no se puede leer como PNG.
  '--allow-file-access-from-files',
];

function writeBeside(file, suffix, html) {
  const tmp = path.join(path.dirname(path.resolve(file)), `.slizdeck-${suffix}-${process.pid}-${Date.now()}.html`);
  writeFileSync(tmp, html);
  return tmp;
}

/** Mide el deck y devuelve { canvas, fonts, slides[] }. */
export function measureDeck(file, { attempts = 2 } = {}) {
  const chrome = findChrome();
  const html = readFileSync(file, 'utf8');
  if (!html.includes('</body>')) throw new Error(`${file}: no tiene </body>, no se puede inyectar el medidor`);
  const tmp = writeBeside(file, 'measure', html.replace('</body>', HARNESS + '</body>'));
  try {
    for (let i = 1; i <= attempts; i++) {
      const dom = execFileSync(chrome, [...CHROME_FLAGS, '--dump-dom', '--virtual-time-budget=20000', `file://${tmp}`], {
        stdio: 'pipe', timeout: 90000, maxBuffer: 512 * 1024 * 1024,
      }).toString();
      const err = /<title>SLIZDECK_GEOMETRY_ERROR::(.*?)<\/title>/s.exec(dom);
      if (err) throw new Error(`el medidor fallo dentro de Chrome: ${err[1]}`);
      const m = /<script type="application\/json" id="slizdeck-geometry">([\s\S]*?)<\/script>/.exec(dom);
      if (m) return JSON.parse(m[1]);
      if (i < attempts) console.error(`(intento ${i}/${attempts}: Chrome headless no termino de medir, reintentando...)`);
    }
    throw new Error('Chrome headless no termino de medir el deck. ¿Carga algun script externo que no responde?');
  } finally {
    rmSync(tmp, { force: true });
  }
}

/**
 * Captura el fondo de una slide (degradado, grano, decoraciones del propio
 * <section>) sin su contenido, para usarlo como imagen de fondo en el PPTX.
 * Devuelve un JPEG como Buffer: el grano en PNG pesa ~2,7 MB por slide, en
 * JPEG unas decenas de KB sin diferencia visible (Chrome elige el formato
 * por la extension del archivo).
 */
export function shootBackground(file, n) {
  const chrome = findChrome();
  const html = readFileSync(file, 'utf8');
  const hide = `
<style>
  *, *::before, *::after { transition: none !important; animation: none !important; }
  deck-stage > section > * { visibility: hidden !important; }
  #progress-bar, #fs-btn { display: none !important; }
</style>`;
  const tmp = writeBeside(file, 'bg', html.replace('</body>', hide + '</body>'));
  const png = tmp.replace(/\.html$/, '.jpeg');
  try {
    execFileSync(chrome, [...CHROME_FLAGS, `--screenshot=${png}`, '--virtual-time-budget=5000', `file://${tmp}#${n}`], {
      stdio: 'pipe', timeout: 60000,
    });
    if (!existsSync(png)) throw new Error('Chrome no escribio la captura');
    return readFileSync(png);
  } finally {
    rmSync(tmp, { force: true });
    rmSync(png, { force: true });
  }
}
