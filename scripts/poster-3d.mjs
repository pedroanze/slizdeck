#!/usr/bin/env node
/**
 * slizdeck · poster-3d
 *
 * Renderiza el poster PNG estatico de cada figura .sz-3d del deck en su
 * paso final, usando Chrome headless con WebGL por software (SwiftShader:
 * sin --disable-gpu, con --use-angle=swiftshader --enable-unsafe-swiftshader
 * --ignore-gpu-blocklist).
 *
 * El poster es lo que ven el navegador antes del primer frame, los entornos
 * sin WebGL o sin red, y los exports a PDF, PPTX y shoot.mjs.
 *
 *   node scripts/poster-3d.mjs deck.html
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';
import { injectBeforeBodyEnd } from './lib/inject.mjs';
import { START, writeBeside } from './lib/chrome-run.mjs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/poster-3d.mjs <deck.html>');
  process.exit(1);
}
if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}

let chrome;
try {
  chrome = findChrome();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

let html = readFileSync(file, 'utf8');
if (!html.includes('</body>')) {
  console.error(`✗ ${file}: no tiene </body>`);
  process.exit(1);
}

// Si alguna figura .sz-3d todavia no tiene <img class="sz-3d-poster">, se le
// inserta apuntando a assets/3d/<id>-poster.png para que quede lista.
let figCounter = 0;
const updatedHtml = html.replace(/<figure\b([^>]*\bclass=["'][^"']*\bsz-3d\b[^"']*["'][^>]*)>([\s\S]*?)<\/figure>/gi, (full, attrs, inner) => {
  figCounter++;
  if (/<img\b[^>]*\bsz-3d-poster\b/i.test(inner)) return full;
  const idMatch = /\bdata-id=["']([^"']+)["']/i.exec(attrs);
  let specId = null;
  const jsonMatch = /<script\b[^>]*\btype=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i.exec(inner);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      specId = parsed.model || parsed.preset || null;
    } catch {}
  }
  const id = idMatch?.[1] || specId || `3d-${figCounter}`;
  const imgTag = `\n  <img class="sz-3d-poster" src="assets/3d/${id}-poster.png" alt="Escena 3D ${id}">`;
  return `<figure${attrs}>${imgTag}${inner}</figure>`;
});

if (updatedHtml !== html) {
  html = updatedHtml;
  writeFileSync(file, html);
}

if (!figCounter) {
  console.error(`✗ ${file}: no contiene ninguna figura .sz-3d`);
  process.exit(1);
}

const HARNESS = `
<script>
window.addEventListener('DOMContentLoaded', () => {
${START}
  __szStart(async () => {
    const finish = (payload) => {
      const out = document.createElement('script');
      out.type = 'application/json';
      out.id = 'slizdeck-posters-out';
      out.textContent = JSON.stringify(payload).replace(/</g, '\\\\u003c');
      document.body.appendChild(out);
      document.title = 'SLIZDECK_POSTERS_DONE';
    };
    try {
      const cv = document.createElement('canvas');
      const gl = window.WebGL2RenderingContext && cv.getContext('webgl2');
      if (!gl) {
        finish({ ok: false, noWebGL: true, error: 'WebGL2 no disponible en este Chrome headless' });
        return;
      }
      if (!window.__sz3d || typeof window.__sz3d.capture !== 'function') {
        finish({ ok: false, error: 'window.__sz3d no esta disponible en el deck' });
        return;
      }
      const stageEl = document.querySelector('deck-stage');
      const slides = Array.from(stageEl.querySelectorAll(':scope > section'));
      const figs = Array.from(document.querySelectorAll('.sz-3d'));
      const posters = [];
      for (let i = 0; i < figs.length; i++) {
        const fig = figs[i];
        const slide = fig.closest('section');
        const si = slide ? slides.indexOf(slide) : -1;
        if (si >= 0 && stageEl.goTo) stageEl.goTo(si);
        const finalStep = slide ? Math.max(1, parseInt(slide.dataset.steps || '1', 10)) : 1;
        if (slide && typeof applyStep === 'function') applyStep(slide, finalStep);
        const img = fig.querySelector('img.sz-3d-poster');
        const id = fig.dataset.id || ('3d-' + (i + 1));
        const src = (img && img.getAttribute('src')) || ('assets/3d/' + id + '-poster.png');
        try {
          const dataUrl = await window.__sz3d.capture(fig, finalStep);
          posters.push({ id, src, slide: si + 1, step: finalStep, dataUrl });
        } catch (err) {
          posters.push({ id, src, slide: si + 1, step: finalStep, error: err && err.message ? err.message : String(err) });
        }
      }
      finish({ ok: true, posters });
    } catch (e) {
      finish({ ok: false, error: e && e.message ? e.message : String(e) });
    }
  });
});
</script>
`;

const CHROME_3D_FLAGS = [
  '--headless',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--no-sandbox',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1920,1080',
  '--allow-file-access-from-files',
];

const tmp = writeBeside(file, 'poster3d', injectBeforeBodyEnd(html, HARNESS));
let payload = null;
try {
  for (let attempt = 1; attempt <= 2 && !payload; attempt++) {
    let dom = '';
    try {
      dom = execFileSync(chrome, [
        ...CHROME_3D_FLAGS,
        '--dump-dom',
        '--virtual-time-budget=25000',
        `file://${tmp}`,
      ], { stdio: 'pipe', timeout: 60000, maxBuffer: 256 * 1024 * 1024 }).toString();
    } catch (e) {
      dom = e.stdout ? e.stdout.toString() : '';
    }
    const m = /<script type="application\/json" id="slizdeck-posters-out">([\s\S]*?)<\/script>/.exec(dom);
    if (m) payload = JSON.parse(m[1]);
    else if (attempt < 2) console.error(`(intento ${attempt}/2: Chrome no termino de renderizar los posters 3D, reintentando...)`);
  }
} finally {
  rmSync(tmp, { force: true });
}

if (!payload) {
  console.error('✗ Chrome headless no termino de renderizar los posters 3D.');
  console.error('  Verifica la conexion de red (si el deck no es offline) o ejecuta antes: npx slizdeck 3d add <deck.html>');
  process.exit(1);
}

if (payload.noWebGL) {
  console.error(`✗ ${payload.error || 'WebGL2 no disponible en Chrome headless'}.`);
  console.error('  Cómo seguir: verifica que tu versión de Chrome soporte --use-angle=swiftshader --enable-unsafe-swiftshader,');
  console.error('  o abre el deck en un navegador con GPU y guarda el resultado de await __sz3d.capture(fig) en assets/3d/<id>-poster.png.');
  process.exit(1);
}

if (!payload.ok) {
  console.error(`✗ no se pudieron generar los posters 3D: ${payload.error}`);
  process.exit(1);
}

const deckDir = path.dirname(path.resolve(file));
let failed = 0;
console.log(`\n${file}\n`);
for (const p of payload.posters) {
  if (p.error || !p.dataUrl) {
    failed++;
    console.log(`  ✗ ${p.id} (slide ${p.slide}): ${p.error || 'captura vacia'}`);
    continue;
  }
  const b64 = p.dataUrl.replace(/^data:image\/png;base64,/, '');
  const buf = Buffer.from(b64, 'base64');
  const dest = path.resolve(deckDir, p.src);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  const kb = Math.max(1, Math.round(buf.length / 1024));
  console.log(`  ✓ ${p.src} (${kb} KB · slide ${p.slide}, paso ${p.step})`);
}
console.log('\n  Nota: pósters renderizados con SwiftShader (WebGL en CPU), no con la GPU física.\n');
process.exit(failed ? 1 : 0);
