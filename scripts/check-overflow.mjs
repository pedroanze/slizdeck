#!/usr/bin/env node
/**
 * slizdeck · check-overflow
 *
 * Detecta texto que desborda su contenedor o el canvas 1920x1080 del deck —
 * el chequeo que `template.html` ya anuncia (cada slide se marca con
 * `data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"`)
 * pero que ningun script implementaba hasta ahora. Nace de revisar slizdeck
 * contra `harden.md` de impeccable: un deck cuyo contenido lo escribe el
 * modelo en cada charla es exactamente el caso "texto real, no el de
 * fixture" que ese documento pide endurecer.
 *
 *   node scripts/check-overflow.mjs deck.html
 *
 * Dos chequeos, deliberadamente acotados (ver "Alcance" abajo):
 *
 *   1. Canvas overflow — el contenido de una slide no puede ser mas ancho
 *      o mas alto que el canvas declarado en <deck-stage width height>
 *      (1920x1080 por default). Se mide con scrollWidth/scrollHeight del
 *      propio <section>, que no depende del transform:scale() que aplica
 *      deck-stage para ajustar el canvas al viewport.
 *   2. Truncamiento en una linea — cualquier elemento con
 *      `white-space: nowrap` (computado) cuyo contenido real sea mas ancho
 *      que su caja (scrollWidth > clientWidth). Es la forma clasica en que
 *      un texto "no cabe": no se ve el desborde a simple vista porque el
 *      navegador lo recorta, pero el contenido real nunca llega a leerse.
 *
 * Para los data-counter, se mide con el valor final (el numero crudo de
 * data-counter, no el abreviado "2.4k" que muestra runCounter en vivo) en
 * vez del "0" inicial — es el texto mas largo posible para esa cifra, y
 * usar el numero sin abreviar es ademas mas conservador que abreviarlo.
 *
 *   3. Superposicion entre dos textos — dos elementos con texto propio,
 *      ninguno ancestro del otro, cuyas cajas se solapan mas del 25% del
 *      area del mas chico. Acotado a texto-contra-texto a proposito: un
 *      badge sobre una imagen o un icono decorativo detras de un titulo
 *      suelen ser intencionales, dos bloques de texto pisandose casi nunca
 *      lo son. Para el caso intencional que quede, `data-overlap-ok` en el
 *      contenedor lo excluye.
 *
 * Con esto quedan cubiertos los tres tokens que cada slide declara en
 * `data-om-validate` (no_overflowing_text, no_overlapping_text,
 * slide_sized_text): el engine ya no anuncia una validacion que ningun
 * script hace.
 *
 * Requiere Chrome/Chromium (ver scripts/lib/find-chrome.mjs, CHROME_PATH).
 * Reintenta hasta 2 veces si Chrome headless no termina a tiempo, igual
 * que check-reveal.mjs.
 */

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { findChrome } from './lib/find-chrome.mjs';

let CHROME;
try {
  CHROME = findChrome();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/check-overflow.mjs <deck.html>');
  process.exit(1);
}

const html = readFileSync(file, 'utf8');

const harness = `
<script>
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // Forzar cada data-counter a su valor final (texto mas largo posible)
    // antes de medir, en vez del "0" con el que arranca antes de runCounter.
    document.querySelectorAll('[data-counter]').forEach((el) => {
      const target = el.getAttribute('data-counter');
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) { node.textContent = target; break; }
      }
    });

    const stage = document.querySelector('deck-stage');
    const canvasW = stage ? parseInt(stage.getAttribute('width') || '1920', 10) : 1920;
    const canvasH = stage ? parseInt(stage.getAttribute('height') || '1080', 10) : 1080;
    const TOLERANCE = 2; // redondeo de subpixel

    const violations = [];
    const label = (section) => section.getAttribute('data-label') || '(sin data-label)';

    document.querySelectorAll('deck-stage > section').forEach((section) => {
      if (section.scrollWidth > canvasW + TOLERANCE || section.scrollHeight > canvasH + TOLERANCE) {
        violations.push({
          type: 'canvas-overflow',
          slide: label(section),
          measured: { width: section.scrollWidth, height: section.scrollHeight },
          canvas: { width: canvasW, height: canvasH },
        });
      }

      section.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.whiteSpace !== 'nowrap') return;
        if (el.scrollWidth > el.clientWidth + TOLERANCE) {
          violations.push({
            type: 'nowrap-overflow',
            slide: label(section),
            tag: el.tagName.toLowerCase(),
            classes: el.className,
            text: (el.textContent || '').trim().slice(0, 60),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          });
        }
      });
    });

    // ── 3. Superposicion entre dos textos ──────────────────────────
    // Se mide al final y en su propio contexto: primero se activan todas
    // las slides (solo la activa es visible: el resto queda en
    // visibility:hidden, ver ::slotted en el shadow DOM) y se llevan a su
    // estado final, porque un .reveal sin aplicar esta desplazado por su
    // propio transform y daria posiciones que nadie llega a ver.
    document.querySelectorAll('deck-stage > section').forEach((s) => s.setAttribute('data-deck-active', ''));
    try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));

    const MIN_SOLAPE = 0.25;   // fraccion del area del texto mas chico

    // La caja del ELEMENTO no sirve: un <div class="eyebrow"> es block y
    // ocupa todo el ancho de la slide aunque su texto sean 80px en la
    // esquina, asi que "solaparia" con cualquier cosa a su derecha. Se mide
    // la caja del texto en si, via Range, que devuelve los rects de linea
    // reales.
    const cajaTexto = (el) => {
      const rects = [];
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        rects.push(...r.getClientRects());
      }
      if (!rects.length) return null;
      return {
        left: Math.min(...rects.map((r) => r.left)),
        right: Math.max(...rects.map((r) => r.right)),
        top: Math.min(...rects.map((r) => r.top)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      };
    };
    const conTexto = (section) => [...section.querySelectorAll('*')].filter((el) => {
      // Solo hojas de texto: un contenedor "solapa" con sus hijos por
      // definicion, y eso no es un defecto.
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (el.closest('[data-overlap-ok]')) return false;   // solape declarado intencional
      const r = cajaTexto(el);
      return !!r && (r.right - r.left) > 0 && (r.bottom - r.top) > 0;
    });

    document.querySelectorAll('deck-stage > section').forEach((section) => {
      const els = conTexto(section);
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i], b = els[j];
          if (a.contains(b) || b.contains(a)) continue;
          const ra = cajaTexto(a), rb = cajaTexto(b);
          if (!ra || !rb) continue;
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w <= 0 || h <= 0) continue;
          const areaA = (ra.right - ra.left) * (ra.bottom - ra.top);
          const areaB = (rb.right - rb.left) * (rb.bottom - rb.top);
          const solape = (w * h) / Math.min(areaA, areaB);
          if (solape < MIN_SOLAPE) continue;
          violations.push({
            type: 'overlap',
            slide: label(section),
            a: { tag: a.tagName.toLowerCase(), classes: a.className, text: (a.textContent || '').trim().slice(0, 40) },
            b: { tag: b.tagName.toLowerCase(), classes: b.className, text: (b.textContent || '').trim().slice(0, 40) },
            solape: Math.round(solape * 100),
          });
        }
      }
    });

    document.title = 'DONE::' + JSON.stringify(violations);
  }));
});
</script>
`;

const withHarness = html.replace('</body>', harness + '</body>');
const tmp = path.join(os.tmpdir(), `slizdeck-check-overflow-${Date.now()}.html`);
writeFileSync(tmp, withHarness);

const MAX_ATTEMPTS = 2;
let m = null;
try {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !m; attempt++) {
    const dom = execFileSync(
      CHROME,
      ['--headless', '--disable-gpu', '--no-sandbox', '--dump-dom', '--virtual-time-budget=12000', `file://${tmp}`],
      { stdio: 'pipe', timeout: 30000 },
    ).toString();
    m = /<title>DONE::(.*?)<\/title>/s.exec(dom);
    if (!m && attempt < MAX_ATTEMPTS) {
      console.error(`(intento ${attempt}/${MAX_ATTEMPTS}: Chrome headless no termino a tiempo, reintentando...)`);
    }
  }
} finally {
  rmSync(tmp, { force: true });
}

if (!m) {
  console.error(`No se pudo leer el resultado tras ${MAX_ATTEMPTS} intentos — Chrome headless no termino.`);
  const externos = [...html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length)).matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((x) => x[1]);
  if (externos.length) {
    console.error(`\n  Causa mas probable: el deck carga ${externos.length} script(s) externo(s) bloqueante(s):`);
    for (const u of externos) console.error(`    ${u}`);
    console.error('  DOMContentLoaded espera a los scripts sincronos, asi que si esa URL no responde el chequeo nunca termina.');
    console.error('  Fix: comentar o quitar ese <script src> del deck (template.html lo trae comentado por default).');
  } else {
    console.error('  El deck no tiene scripts externos, asi que probablemente sea la maquina: revisar que Chrome headless funcione aca.');
  }
  process.exit(1);
}

const unescape = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const violations = JSON.parse(unescape(m[1]));

console.log(`\n${file}\n`);
if (!violations.length) {
  console.log('  ✓ Nada desborda el canvas, se trunca en una línea, ni se superpone con otro texto.\n');
  process.exit(0);
}

const cls = (c) => (c && typeof c === 'string' && c.trim()) ? '.' + c.trim().split(/\s+/).join('.') : '';
for (const v of violations) {
  if (v.type === 'canvas-overflow') {
    console.log(`  ✗ [${v.slide}] la slide mide ${v.measured.width}×${v.measured.height}px, más que el canvas ${v.canvas.width}×${v.canvas.height}px`);
  } else if (v.type === 'overlap') {
    console.log(`  ✗ [${v.slide}] dos textos superpuestos (${v.solape}% del más chico)`);
    console.log(`        <${v.a.tag}${cls(v.a.classes)}>  "${v.a.text}"`);
    console.log(`        <${v.b.tag}${cls(v.b.classes)}>  "${v.b.text}"`);
    console.log('        Si el solape es intencional, marcarlo con data-overlap-ok en el contenedor.');
  } else {
    console.log(`  ✗ [${v.slide}] <${v.tag} class="${v.classes}"> "${v.text}" se trunca: contenido ${v.scrollWidth}px en una caja de ${v.clientWidth}px`);
  }
}
const nOverlap = violations.filter((v) => v.type === 'overlap').length;
const nTexto = violations.length - nOverlap;
const partes = [];
if (nTexto) partes.push(`${nTexto} elemento(s) con texto que no cabe`);
if (nOverlap) partes.push(`${nOverlap} par(es) de texto superpuesto`);
console.log(`\n✗ ${partes.join(' · ')}\n`);
process.exit(1);
