/**
 * slizdeck · chrome-run
 *
 * Lo que comparten los scripts que miden un deck en Chrome headless
 * (check-reveal, check-overflow, check-contrast): arrancar el harness sin
 * depender de requestAnimationFrame, escribir la copia al lado del deck,
 * correr Chrome con reintentos y explicar por que no termino.
 */

import { writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './find-chrome.mjs';
import { injectBeforeBodyEnd } from './inject.mjs';

/* Arranque del harness: rAF + setTimeout, con un temporizador de respaldo.
   Un rAF anidado en otro no llega a dispararse en Chrome headless sin GPU,
   y en Linux sin GPU (el CI) a veces ni el primero llega: el harness no
   corria nunca y el chequeo abortaba sin ningun problema real en el deck.
   Lo que llegue primero arranca, una sola vez, y siempre despues de que
   cargaron las fuentes web del deck. Uso: __szStart(() => {...}) */
export const START = `
  // Esperar las fuentes web antes de medir: con la fuente de respaldo (mas
  // angosta) un titulo que en el deck ocupa dos lineas se mide en una, y
  // el export y check-overflow trabajan con una geometria que nadie ve.
  // document.fonts.ready solo no alcanza: resuelve de inmediato si la hoja
  // de Google Fonts todavia no llego. Tope de 4 s para no colgar sin red.
  const __szFonts = () => new Promise((resolve) => {
    const cap = setTimeout(resolve, 4000);
    const go = () => {
      const fams = new Set();
      document.querySelectorAll('body *').forEach((el) => {
        const f = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
        if (f) fams.add(f);
      });
      Promise.all([...fams].map((f) => document.fonts.load('16px "' + f + '"').catch(() => null)))
        .then(() => document.fonts.ready)
        .then(() => { clearTimeout(cap); resolve(); }, () => { clearTimeout(cap); resolve(); });
    };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  });
  const __szStart = (fn) => {
    let done = false;
    const once = () => { if (!done) { done = true; fn(); } };
    __szFonts().then(() => {
      requestAnimationFrame(() => setTimeout(once, 0));
      setTimeout(once, 250);
    });
  };`;

/* Sin transiciones ni animaciones: se mide el estado final, no un frame a
   mitad del reveal (un .r-rise a mitad de camino esta 44px mas abajo). */
export const NO_MOTION = '<style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>';

/* Copia del deck con el harness, AL LADO del deck real y no en tmpdir: un
   <img> con ruta relativa se resuelve contra la carpeta del archivo que
   Chrome carga, y copiado a /tmp la imagen no carga (sin ningun error). */
export function writeBeside(file, tag, html) {
  const tmp = path.join(path.dirname(path.resolve(file)), `.slizdeck-${tag}-${process.pid}-${Date.now()}.html`);
  writeFileSync(tmp, html);
  return tmp;
}

export const unescapeHtml = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function externalScripts(html) {
  const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  return [...masked.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((x) => x[1]);
}

/** Por que Chrome no termino: casi siempre un script externo que no responde. */
export function explainHang(html, attempts) {
  console.error(`No se pudo leer el resultado tras ${attempts} intento(s): Chrome headless no termino.`);
  const ext = externalScripts(html);
  if (ext.length) {
    console.error(`\n  Causa mas probable: el deck carga ${ext.length} script(s) externo(s) bloqueante(s):`);
    for (const u of ext) console.error(`    ${u}`);
    console.error('  DOMContentLoaded espera a los scripts sincronos: si esa URL no responde, el chequeo no termina.');
    console.error('  Fix: comentar o quitar ese <script src> del deck (template.html lo trae comentado).');
  } else {
    console.error('  El deck no tiene scripts externos: revisar que Chrome headless funcione en esta maquina.');
  }
}

/**
 * Inyecta `harness` en el deck, corre Chrome --dump-dom y devuelve lo que el
 * harness dejo en <title>DONE::<json></title>, ya parseado. Si Chrome no
 * termina (sale con error, se pasa del timeout o no escribe el resultado)
 * reintenta; si tras `attempts` intentos no hay resultado, explica por que
 * y termina el proceso con codigo 1. Un resultado con violaciones NUNCA se
 * reintenta: es real y deterministico.
 */
export function runHarness(file, html, harness, { tag, attempts = 2, budget = 12000, timeout = 45000 } = {}) {
  let chrome;
  try { chrome = findChrome(); } catch (err) { console.error(err.message); process.exit(1); }
  const tmp = writeBeside(file, tag, injectBeforeBodyEnd(html, harness));
  let result = null;
  try {
    for (let i = 1; i <= attempts && !result; i++) {
      let dom = '';
      try {
        dom = execFileSync(chrome,
          ['--headless', '--disable-gpu', '--no-sandbox', '--dump-dom', `--virtual-time-budget=${budget}`, `file://${tmp}`],
          { stdio: 'pipe', timeout, maxBuffer: 256 * 1024 * 1024 }).toString();
      } catch (e) {
        dom = e.stdout ? e.stdout.toString() : '';
      }
      const m = /<title>DONE::(.*?)<\/title>/s.exec(dom);
      if (m) result = JSON.parse(unescapeHtml(m[1]));
      else if (i < attempts) console.error(`(intento ${i}/${attempts}: Chrome headless no termino, reintentando...)`);
    }
  } finally {
    rmSync(tmp, { force: true });
  }
  if (!result) { explainHang(html, attempts); process.exit(1); }
  return result;
}
