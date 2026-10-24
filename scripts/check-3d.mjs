#!/usr/bin/env node
/**
 * slizdeck · check-3d
 *
 * Verifica en Chrome headless con WebGL por software (SwiftShader) que cada
 * figura .sz-3d del deck:
 *  1. Carga three.js correctamente.
 *  2. Parsea su modelo GLB o preset sin errores.
 *  3. Pinta un primer frame no vacio (varianza de pixeles > 0).
 *  4. Declara solo clips de animacion que existen en el modelo.
 *  5. Tiene un poster PNG valido cuyo aspecto coincide con el estado final.
 *  6. Detiene su loop al salir de la slide (__sz3d.live() vuelve a 0).
 *  7. No emite errores de consola ni excepciones sin capturar.
 *
 * No sobrepromete: aclara explicitamente que corre sobre SwiftShader (CPU)
 * y que no mide FPS reales en la GPU fisica donde se va a presentar.
 *
 *   node scripts/check-3d.mjs deck.html
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';
import { injectBeforeBodyEnd } from './lib/inject.mjs';
import { START, writeBeside } from './lib/chrome-run.mjs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/check-3d.mjs <deck.html>');
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

const html = readFileSync(file, 'utf8');
if (!html.includes('</body>')) {
  console.error(`✗ ${file}: no tiene </body>`);
  process.exit(1);
}

const HARNESS = `
<script>
(() => {
  const consoleErrors = [];
  const origError = console.error.bind(console);
  console.error = (...args) => {
    consoleErrors.push(args.map((a) => (a && a.message) ? a.message : String(a)).join(' '));
    origError(...args);
  };
  window.addEventListener('error', (e) => {
    consoleErrors.push(e.message || 'error de script');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    consoleErrors.push((r && r.message) ? r.message : String(r || 'promesa rechazada'));
  });

  function loadImg(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('no se pudo cargar la imagen'));
      im.src = src;
    });
  }

  async function sampleImage(srcOrImg) {
    const im = typeof srcOrImg === 'string' ? await loadImg(srcOrImg) : srcOrImg;
    if (!im.complete || !im.naturalWidth) throw new Error('imagen vacia o sin cargar');
    const N = 64;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, N, N);
    const data = cx.getImageData(0, 0, N, N).data;
    let nonEmpty = 0;
    let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
    const total = N * N;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) nonEmpty++;
      sumR += data[i]; sumG += data[i + 1]; sumB += data[i + 2]; sumA += data[i + 3];
    }
    const mR = sumR / total, mG = sumG / total, mB = sumB / total, mA = sumA / total;
    let varSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      varSum += (data[i] - mR) ** 2 + (data[i + 1] - mG) ** 2 + (data[i + 2] - mB) ** 2 + (data[i + 3] - mA) ** 2;
    }
    const variance = Math.round((varSum / (total * 4)) * 10) / 10;
    return { nonEmpty, variance, data };
  }

  function compareSamples(a, b) {
    let diff = 0;
    let inter = 0, union = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      diff += Math.abs(a.data[i] - b.data[i])
        + Math.abs(a.data[i + 1] - b.data[i + 1])
        + Math.abs(a.data[i + 2] - b.data[i + 2])
        + Math.abs(a.data[i + 3] - b.data[i + 3]);
      const onA = a.data[i + 3] > 16;
      const onB = b.data[i + 3] > 16;
      if (onA && onB) inter++;
      if (onA || onB) union++;
    }
    const mad = diff / (a.data.length * 255);
    const iou = union > 0 ? inter / union : 0;
    return {
      mad: Math.round(mad * 1000) / 1000,
      iou: Math.round(iou * 1000) / 1000,
      similar: mad < 0.18 || iou > 0.45,
    };
  }

  window.addEventListener('DOMContentLoaded', () => {
${START}
    __szStart(async () => {
      const finish = (payload) => {
        const out = document.createElement('script');
        out.type = 'application/json';
        out.id = 'slizdeck-check3d-out';
        out.textContent = JSON.stringify(payload).replace(/</g, '\\\\u003c');
        document.body.appendChild(out);
        document.title = 'SLIZDECK_CHECK3D_DONE';
      };

      try {
        const cv = document.createElement('canvas');
        const gl = window.WebGL2RenderingContext && cv.getContext('webgl2');
        if (!gl) {
          finish({ ok: false, noWebGL: true, error: 'WebGL2 no disponible en Chrome headless' });
          return;
        }
        const stageEl = document.querySelector('deck-stage');
        const slides = Array.from(stageEl.querySelectorAll(':scope > section'));
        const figs = Array.from(document.querySelectorAll('.sz-3d'));
        if (!figs.length) {
          finish({ ok: false, error: 'el deck no contiene ninguna figura .sz-3d' });
          return;
        }
        if (!window.__sz3d) {
          finish({ ok: false, error: 'window.__sz3d no se inicializo en el deck' });
          return;
        }

        const results = [];
        for (let i = 0; i < figs.length; i++) {
          const fig = figs[i];
          const slide = fig.closest('section');
          const si = slide ? slides.indexOf(slide) : -1;
          if (si >= 0 && stageEl.goTo) stageEl.goTo(si);
          if (slide && typeof applyStep === 'function') applyStep(slide, 1);

          const info = await window.__sz3d.inspect(fig);
          const item = {
            id: info.id || fig.dataset.id || ('3d-' + (i + 1)),
            slide: si + 1,
            threeLoaded: !!info.threeLoaded,
            status: info.status,
            error: info.error || null,
            availableClips: info.availableClips || [],
            requestedClips: info.requestedClips || [],
            missingClips: info.missingClips || [],
            firstFrame: null,
            poster: null,
          };

          if (info.status === 'ready') {
            try {
              const firstUrl = await window.__sz3d.capture(fig, 1);
              const firstSample = await sampleImage(firstUrl);
              item.firstFrame = {
                nonEmpty: firstSample.nonEmpty,
                variance: firstSample.variance,
                ok: firstSample.nonEmpty > 20 && firstSample.variance > 5,
              };

              const finalStep = slide ? Math.max(1, parseInt(slide.dataset.steps || '1', 10)) : 1;
              if (slide && typeof applyStep === 'function') applyStep(slide, finalStep);
              const finalUrl = await window.__sz3d.capture(fig, finalStep);
              const finalSample = await sampleImage(finalUrl);

              const posterImg = fig.querySelector('img.sz-3d-poster');
              const posterSrc = posterImg ? posterImg.getAttribute('src') : null;
              const posterAlt = posterImg ? (posterImg.getAttribute('alt') || '').trim() : '';
              if (!posterImg || !posterSrc) {
                item.poster = { ok: false, error: 'falta <img class="sz-3d-poster" src="...">' };
              } else if (!posterAlt) {
                item.poster = { ok: false, error: 'el poster no tiene atributo alt descriptivo' };
              } else {
                try {
                  const posterSample = await sampleImage(posterImg);
                  const cmp = compareSamples(finalSample, posterSample);
                  item.poster = {
                    src: posterSrc.startsWith('data:') ? 'data:image/png;base64,...' : posterSrc,
                    alt: posterAlt,
                    nonEmpty: posterSample.nonEmpty,
                    variance: posterSample.variance,
                    mad: cmp.mad,
                    iou: cmp.iou,
                    ok: posterSample.nonEmpty > 20 && posterSample.variance > 5 && cmp.similar,
                    error: cmp.similar ? null : ('el poster difiere del estado final (mad=' + cmp.mad + ', iou=' + cmp.iou + ')'),
                  };
                } catch (pErr) {
                  item.poster = {
                    src: posterSrc,
                    alt: posterAlt,
                    ok: false,
                    error: 'no se pudo cargar el poster (' + posterSrc + '): ' + (pErr && pErr.message ? pErr.message : String(pErr)),
                  };
                }
              }
            } catch (err) {
              item.error = err && err.message ? err.message : String(err);
            }
          }
          results.push(item);
        }

        // Salir a una slide sin .sz-3d para comprobar que live() vuelve a 0.
        const non3dIdx = slides.findIndex((s) => !s.querySelector('.sz-3d'));
        if (non3dIdx >= 0 && stageEl.goTo) {
          stageEl.goTo(non3dIdx);
        } else {
          window.dispatchEvent(new Event('beforeprint'));
        }
        await new Promise((r) => setTimeout(r, 40));
        const liveAfterExit = window.__sz3d.live();

        finish({
          ok: true,
          figures: results,
          liveAfterExit,
          consoleErrors,
        });
      } catch (e) {
        finish({ ok: false, error: e && e.message ? e.message : String(e), consoleErrors });
      }
    });
  });
})();
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

const tmp = writeBeside(file, 'check3d', injectBeforeBodyEnd(html, HARNESS));
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
    const m = /<script type="application\/json" id="slizdeck-check3d-out">([\s\S]*?)<\/script>/.exec(dom);
    if (m) payload = JSON.parse(m[1]);
    else if (attempt < 2) console.error(`(intento ${attempt}/2: Chrome no termino check-3d, reintentando...)`);
  }
} finally {
  rmSync(tmp, { force: true });
}

if (!payload) {
  console.error('✗ Chrome headless no termino de ejecutar check-3d.');
  process.exit(1);
}

if (payload.noWebGL) {
  console.error(`✗ ${payload.error || 'WebGL2 no disponible en Chrome headless'}.`);
  process.exit(1);
}

if (!payload.ok) {
  console.error(`✗ check-3d fallo: ${payload.error}`);
  process.exit(1);
}

let fail = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg, detail) => { fail++; console.log(`  ✗ ${msg}${detail ? `\n      ${detail}` : ''}`); };

console.log(`\n${file}\n`);

for (const f of payload.figures) {
  const prefix = `[slide ${String(f.slide).padStart(2, '0')} · ${f.id}]`;
  if (f.threeLoaded) ok(`${prefix} three.js cargó correctamente`);
  else bad(`${prefix} three.js no cargó`, f.error || '');

  if (f.status === 'ready' && !f.error) ok(`${prefix} escena/modelo inicializado sin errores`);
  else bad(`${prefix} fallo al inicializar la escena`, f.error || f.status);

  if (f.firstFrame && f.firstFrame.ok) {
    ok(`${prefix} primer frame no está en blanco (varianza ${f.firstFrame.variance}, ${f.firstFrame.nonEmpty} px activos)`);
  } else {
    bad(`${prefix} primer frame en blanco o sin varianza`, f.firstFrame ? `varianza=${f.firstFrame.variance}, px=${f.firstFrame.nonEmpty}` : '');
  }

  if (!f.missingClips.length) {
    const clipDesc = f.requestedClips.length ? f.requestedClips.join(', ') : 'sin clips solicitados';
    ok(`${prefix} clips válidos (${clipDesc})`);
  } else {
    bad(`${prefix} clips inexistentes en el modelo: ${f.missingClips.join(', ')}`, `disponibles: ${f.availableClips.join(', ') || '(ninguno)'}`);
  }

  if (f.poster && f.poster.ok) {
    ok(`${prefix} póster válido y coherente con el paso final (${f.poster.src}, iou=${f.poster.iou})`);
  } else {
    bad(`${prefix} póster ausente, vacío o distinto del estado final`, f.poster?.error || 'sin póster');
  }
}

if (payload.liveAfterExit === 0) {
  ok('al salir de la slide 3D, __sz3d.live() vuelve a 0 (sin loops en segundo plano)');
} else {
  bad(`al salir de la slide 3D quedaron ${payload.liveAfterExit} loop(s) activos`);
}

if (!payload.consoleErrors || !payload.consoleErrors.length) {
  ok('sin errores de consola ni excepciones');
} else {
  bad(`${payload.consoleErrors.length} error(es) de consola`, payload.consoleErrors.join('\n      '));
}

console.log('\n  Nota: verificado en Chrome headless con SwiftShader (WebGL en CPU); este chequeo NO mide FPS reales en tu GPU.');
console.log(`\n${fail ? `✗ ${fail} verificación(es) 3D fallaron` : '✓ check-3d OK'}\n`);
process.exit(fail ? 1 : 0);
