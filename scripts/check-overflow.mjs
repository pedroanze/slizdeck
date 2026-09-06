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
 * Alcance: NO implementa "no_overlapping_text" (superposicion entre dos
 * elementos) — generalizarlo sin falsos positivos requiere saber que
 * superposiciones son intencionales (un badge sobre una esquina, un icono
 * decorativo) y cuales no; queda fuera de este script hasta encontrar una
 * heuristica confiable. No confundir un chequeo acotado con uno completo.
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
  console.error(`No se pudo leer el resultado tras ${MAX_ATTEMPTS} intentos — Chrome headless no termino. No es un problema del deck evaluado: revisar que Chrome headless funcione en esta maquina.`);
  process.exit(1);
}

const unescape = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const violations = JSON.parse(unescape(m[1]));

console.log(`\n${file}\n`);
if (!violations.length) {
  console.log('  ✓ Ningún elemento desborda el canvas ni se trunca en una línea que no cabe.\n');
  process.exit(0);
}

for (const v of violations) {
  if (v.type === 'canvas-overflow') {
    console.log(`  ✗ [${v.slide}] la slide mide ${v.measured.width}×${v.measured.height}px, más que el canvas ${v.canvas.width}×${v.canvas.height}px`);
  } else {
    console.log(`  ✗ [${v.slide}] <${v.tag} class="${v.classes}"> "${v.text}" se trunca: contenido ${v.scrollWidth}px en una caja de ${v.clientWidth}px`);
  }
}
console.log(`\n✗ ${violations.length} elemento(s) con texto que no cabe\n`);
process.exit(1);
