#!/usr/bin/env node
/**
 * slizdeck · shoot
 *
 * Renderiza cada slide del deck a un PNG 1920x1080, en su estado FINAL
 * (reveals aplicados, contadores en su cifra real), para que el modelo
 * pueda mirar el deck en vez de deducirlo del HTML.
 *
 * Existe porque hasta ahora ningun paso del flujo miraba el resultado
 * renderizado: audit.mjs lee el HTML estatico, check-style-pack mira los
 * tokens del :root, y check-overflow/check-reveal miden propiedades
 * puntuales. Ninguno ve lo que un validador mecanico no puede juzgar y un
 * modelo si: jerarquia rota, tres slides seguidas con la misma
 * composicion, una imagen que pelea con el titulo, peso de color
 * desbalanceado. Ese juicio necesita la imagen.
 *
 *   node scripts/shoot.mjs deck.html                  # todas las slides
 *   node scripts/shoot.mjs deck.html --slides=3,7-9   # solo algunas
 *   node scripts/shoot.mjs deck.html --out=/tmp/shots # directorio destino
 *
 * El estado final se consigue disparando el evento `beforeprint`, que es
 * lo mismo que hace el export a PDF — asi no hay una segunda copia de la
 * logica de "llevar la slide a su estado final" que se pueda desincronizar
 * de la del template (ver finalizeForPrint en template.html).
 *
 * Uso previsto: UNA ronda acotada en la fase audit, no un loop. Mirar N
 * imagenes cuesta tokens; el flujo es "generar completo -> una ronda de
 * inspeccion -> un batch de fixes", no screenshot tras cada edicion.
 *
 * Requiere Chrome/Chromium (ver scripts/lib/find-chrome.mjs, CHROME_PATH).
 */

import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { findChrome } from './lib/find-chrome.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const getFlag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

if (!file) {
  console.error('uso: node scripts/shoot.mjs <deck.html> [--slides=1,3-5] [--out=<dir>]');
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}

let CHROME;
try {
  CHROME = findChrome();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const html = readFileSync(file, 'utf8');

// Contar slides sin parsear todo el DOM: las <section> hijas de <deck-stage>.
// Se enmascaran los comentarios primero — el template trae una <section> de
// ejemplo comentada, y contarla desplazaria toda la numeracion.
const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
const stageMatch = /<deck-stage[^>]*>([\s\S]*?)<\/deck-stage>/.exec(masked);
if (!stageMatch) {
  console.error(`${file}: no se encontro <deck-stage>. ¿Es un deck de slizdeck?`);
  process.exit(1);
}
const total = [...stageMatch[1].matchAll(/<section\b/g)].length;
if (!total) {
  console.error(`${file}: <deck-stage> no tiene ninguna <section>.`);
  process.exit(1);
}

function parseRange(spec, max) {
  if (!spec) return Array.from({ length: max }, (_, i) => i + 1);
  const out = new Set();
  for (const part of spec.split(',')) {
    const range = /^(\d+)-(\d+)$/.exec(part.trim());
    if (range) {
      const [, a, b] = range;
      for (let i = Number(a); i <= Number(b); i++) out.add(i);
    } else if (/^\d+$/.test(part.trim())) {
      out.add(Number(part.trim()));
    } else {
      console.error(`--slides: no entiendo "${part.trim()}" (formatos: 3, 3-5, 1,4,7-9)`);
      process.exit(1);
    }
  }
  const picked = [...out].sort((a, b) => a - b);
  const fuera = picked.filter((n) => n < 1 || n > max);
  if (fuera.length) {
    console.error(`--slides: el deck tiene ${max} slides, no existe ${fuera.join(', ')}`);
    process.exit(1);
  }
  return picked;
}

const slides = parseRange(getFlag('slides'), total);
const outDir = path.resolve(getFlag('out') || path.join(path.dirname(path.resolve(file)), '.slizdeck-shots'));
mkdirSync(outDir, { recursive: true });

// El harness lleva la slide activa a su estado final. Dispara `beforeprint`
// en vez de reimplementar la logica: es el mismo camino que el export a PDF.
const harness = `
<style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
<script>
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
    // Cinturon y tirantes: si un deck viejo no tiene finalizeForPrint
    // (engine < 1.0.0), al menos revelar los .reveal a mano.
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));
    document.documentElement.setAttribute('data-slizdeck-shot', 'ready');
  }));
});
</script>
`;

const withHarness = html.replace('</body>', harness + '</body>');
const tmp = path.join(os.tmpdir(), `slizdeck-shoot-${process.pid}.html`);
writeFileSync(tmp, withHarness);

const base = path.basename(file).replace(/\.html$/, '');
const written = [];
const failed = [];

console.log(`\n${file} — ${slides.length} de ${total} slide(s) a ${outDir}\n`);

try {
  for (const n of slides) {
    const png = path.join(outDir, `${base}-${String(n).padStart(2, '0')}.png`);
    try {
      execFileSync(CHROME, [
        '--headless', '--disable-gpu', '--no-sandbox',
        '--force-device-scale-factor=1', '--hide-scrollbars',
        '--window-size=1920,1080', `--screenshot=${png}`,
        '--virtual-time-budget=5000', `file://${tmp}#${n}`,
      ], { stdio: 'pipe', timeout: 40000 });
      if (!existsSync(png)) throw new Error('Chrome no escribio el PNG');
      written.push({ n, png });
      console.log(`  ✓ slide ${String(n).padStart(2, '0')} → ${path.basename(png)}`);
    } catch (e) {
      const detail = (e.stderr ? e.stderr.toString().trim().split('\n')[0] : '') || e.message.split('\n')[0];
      failed.push({ n, detail });
      console.log(`  ✗ slide ${String(n).padStart(2, '0')} — ${detail}`);
    }
  }
} finally {
  rmSync(tmp, { force: true });
}

console.log();
if (failed.length) {
  const externos = [...html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length)).matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((x) => x[1]);
  console.log(`✗ ${failed.length} slide(s) sin captura.`);
  if (externos.length) {
    console.log(`  El deck carga ${externos.length} script(s) externo(s) (${externos[0]}${externos.length > 1 ? ', …' : ''}):`);
    console.log('  si esa URL no responde, el render se cuelga. Quitarlos o bajarlos a local.');
  }
}
if (written.length) {
  console.log(`✓ ${written.length} PNG en ${outDir}`);
  console.log('  Ahora MIRAR las imagenes (leerlas como imagen, no listarlas) y juzgar lo que ningun');
  console.log('  validador puede: jerarquia, variedad de composicion, peso de color, respiracion.');
  console.log('  Una sola ronda: anotar todo lo que haya que cambiar y arreglarlo en un batch.');
}
console.log();
process.exit(failed.length ? 1 : 0);
