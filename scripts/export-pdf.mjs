#!/usr/bin/env node
/**
 * slizdeck · export-pdf
 *
 * Exporta un deck a PDF con Chrome headless: una pagina por slide, en su
 * estado final (las mismas reglas @media print del template: reveals
 * visibles, contadores en su cifra real, sin el chrome del reproductor).
 *
 *   node scripts/export-pdf.mjs deck.html [salida.pdf] [--grain]
 *
 * Dos diferencias con imprimir a mano desde el navegador, las dos por peso:
 *
 *  - Sin el grano de los fondos degradados (.grad::before). Chrome lo
 *    rasteriza pixel a pixel al imprimir: un deck de 18 slides pasaba de
 *    ~1 MB a 22 MB (examples/test-03). En pantalla aporta textura; en un PDF
 *    que se manda por mail solo aporta megas. --grain lo conserva.
 *  - Sin el marcador de pasos (.act-marker, "3 / 3"): es UI del reproductor
 *    en vivo, no contenido, y en un PDF siempre diria el ultimo paso.
 *
 * Al terminar verifica lo que puede verificar: que el PDF tenga tantas
 * paginas como slides el deck, y avisa si pesa mas de 10 MB.
 *
 * Requiere Chrome/Chromium (scripts/lib/find-chrome.mjs, CHROME_PATH).
 */

import { existsSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';
import { injectBeforeBodyEnd } from './lib/inject.mjs';

const args = process.argv.slice(2);
const [input, outArg] = args.filter((a) => !a.startsWith('--'));
const keepGrain = args.includes('--grain');

if (!input) {
  console.error('uso: node scripts/export-pdf.mjs <deck.html> [salida.pdf] [--grain]');
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`no existe el archivo: ${input}`);
  process.exit(1);
}

let CHROME;
try {
  CHROME = findChrome();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const out = path.resolve(outArg || path.basename(input, path.extname(input)) + '.pdf');
const html = readFileSync(input, 'utf8');
const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
const stage = /<deck-stage[^>]*>([\s\S]*?)<\/deck-stage>/.exec(masked);
const slides = stage ? [...stage[1].matchAll(/<section\b/g)].length : 0;
if (!slides) {
  console.error(`${input}: no se encontro <deck-stage> con slides. ¿Es un deck de slizdeck?`);
  process.exit(1);
}

const harness = `
<style>
  @media print {
    .act-marker { display: none !important; }
    ${keepGrain ? '' : '.grad::before { display: none !important; }'}
  }
</style>
<script>
window.addEventListener('DOMContentLoaded', () => {
  // rAF + setTimeout como siempre, pero con un temporizador de respaldo:
  // en Chrome headless sin GPU (Linux del CI) a veces ni el primer rAF
  // llega, y el harness no corria nunca: "Chrome no termino a tiempo" sin
  // ningun error real. Lo que llegue primero arranca, una sola vez.
  const __szStart = (fn) => {
    let done = false;
    const once = () => { if (!done) { done = true; fn(); } };
    requestAnimationFrame(() => setTimeout(once, 0));
    setTimeout(once, 250);
  };
  __szStart(() => {
    try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));
  });
});
</script>
`;

// Al lado del deck: las rutas relativas de <img> tienen que seguir resolviendo.
const tmp = path.join(path.dirname(path.resolve(input)), `.slizdeck-pdf-${process.pid}.html`);
writeFileSync(tmp, injectBeforeBodyEnd(html, harness));

try {
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    `--print-to-pdf=${out}`, '--virtual-time-budget=10000', `file://${tmp}`,
  ], { stdio: 'pipe', timeout: 120000 });
} catch (e) {
  const detail = (e.stderr ? e.stderr.toString().trim().split('\n')[0] : '') || e.message.split('\n')[0];
  console.error(`✗ Chrome no pudo generar el PDF: ${detail}`);
  process.exit(1);
} finally {
  rmSync(tmp, { force: true });
}

if (!existsSync(out)) {
  console.error('✗ Chrome termino sin escribir el PDF.');
  process.exit(1);
}

const bytes = statSync(out).size;
const pdf = readFileSync(out).toString('latin1');
const pages = (pdf.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
const mb = (bytes / 1024 / 1024).toFixed(1);

let fail = false;
if (pages && pages !== slides) {
  console.log(`✗ ${out}: ${pages} página(s) para ${slides} slide(s). Alguna slide se partió o se perdió al imprimir.`);
  fail = true;
} else {
  console.log(`✓ ${out} · ${pages || '?'} página(s), ${mb} MB${keepGrain ? ' (con grano)' : ''}`);
}
if (!pages) console.log('  (no se pudo contar las páginas del PDF: revisarlo a mano)');
if (bytes > 10 * 1024 * 1024) {
  console.log(`  ⚠ pesa ${mb} MB.${keepGrain ? ' Sin --grain suele bajar mucho.' : ' Revisar imágenes muy grandes en el deck.'}`);
}
process.exit(fail ? 1 : 0);
