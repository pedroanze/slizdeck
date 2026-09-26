#!/usr/bin/env node
/**
 * slizdeck · check-contrast
 *
 * Mide el contraste REAL de cada texto del deck ya renderizado: color
 * computado del nodo contra el fondo efectivo que le queda detras.
 *
 * Es el complemento de check-style-pack.mjs, que valida los pares de
 * tokens declarados en :root. Esa validacion no ve como se combinan los
 * tokens al componer una slide: --cs-muted sobre --cs-cream pasa, pero el
 * mismo --cs-muted puesto dentro de una card de fondo --cs-primary es
 * ilegible y ningun chequeo de tokens lo nota. Aca se mide lo que el
 * publico va a ver de verdad.
 *
 *   node scripts/check-contrast.mjs deck.html
 *
 * Umbrales WCAG 2.1 AA sobre el canvas 1920x1080: 4.5:1 para texto normal,
 * 3:1 para texto grande (>=24px, o >=18.66px en negrita). Un deck se
 * proyecta, asi que el tamano en px del canvas es la referencia correcta.
 *
 * Alcance, explicito para no vender de mas:
 *   - Se saltan los textos sobre gradiente o imagen de fondo (las slides
 *     .grad, los overlays sobre foto): el fondo no es un color plano, asi
 *     que un solo ratio no lo describe. Se CUENTAN y se reportan como
 *     pendientes de revisar a ojo, nunca se dan por buenos en silencio.
 *   - Se salta el texto invisible (opacidad 0, display:none, tamano cero)
 *     y el chrome del reproductor, que no es contenido del deck.
 *
 * Requiere Chrome/Chromium (ver scripts/lib/find-chrome.mjs, CHROME_PATH).
 */

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';
import { injectBeforeBodyEnd } from './lib/inject.mjs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/check-contrast.mjs <deck.html>');
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

const harness = `
<style>*, *::before, *::after { transition: none !important; animation: none !important; }</style>
<script>
window.addEventListener('DOMContentLoaded', () => {
  // Un solo rAF + un macrotask (setTimeout), NO un rAF anidado dentro de
  // otro: en Chrome headless con --disable-gpu (sin compositor real) un
  // segundo rAF encadenado no llega a dispararse la inmensa mayoria de las
  // veces (medido: 9 de 10 corridas se quedan colgadas esperandolo, contra
  // 0 de 5 con este patron). Con --virtual-time-budget eso no truena con
  // error: el harness simplemente nunca corre, .reveal se queda en
  // opacidad 0, y ese texto se salta en silencio en vez de medirse.
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
    // Todas las slides a su estado final: si no, el texto aun no revelado
    // mide opacidad 0 y se saltaria justo lo que hay que verificar.
    try { window.dispatchEvent(new Event('beforeprint')); } catch (e) {}
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));

    // Solo la slide activa es visible: el resto queda en visibility:hidden
    // + opacity:0 (ver ::slotted en el shadow DOM de deck-stage). Sin esto
    // se medirian los textos de UNA slide y se daria el deck por revisado.
    document.querySelectorAll('deck-stage > section').forEach((s) => s.setAttribute('data-deck-active', ''));

    const parseColor = (s) => {
      const m = /rgba?\\(([^)]+)\\)/.exec(s || '');
      if (!m) return null;
      const p = m[1].split(',').map((x) => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const lum = (c) => {
      const ch = [c.r, c.g, c.b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const ratio = (a, b) => {
      const l1 = lum(a), l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    // Fondo efectivo: se apilan los backgrounds de los ancestros hasta dar
    // con uno opaco. Si aparece una imagen/gradiente por el camino, el
    // fondo no es un color plano y no se puede resolver a un solo ratio.
    const effectiveBg = (el) => {
      const layers = [];
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unresolved: true };
        const c = parseColor(cs.backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 0.999) break;
        }
      }
      let base = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      return { color: base };
    };

    const label = (section) => (section && section.getAttribute('data-label')) || '?';
    const stage = document.querySelector('deck-stage');
    const findings = [];
    let checked = 0, skippedGradient = 0;

    document.querySelectorAll('deck-stage > section').forEach((section) => {
      section.querySelectorAll('*').forEach((el) => {
        // Solo nodos con texto propio (no contenedores que heredan el texto de sus hijos)
        const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
        if (!own) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        // Opacidad acumulada de los ancestros: un texto a 0 no se ve.
        let op = 1;
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity || '1');
        if (op < 0.05) return;

        // Texto pintado con background-clip (el .grad-word del cover): el
        // color computado no es el que se ve.
        if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') { skippedGradient++; return; }

        // SVG (ejes, series, etiquetas de grafica) pinta con la propiedad
        // fill, no con color — leer siempre cs.color daba falsos verdes: un
        // fill claro sobre fondo claro pasaba porque cs.color medía el
        // negro heredado del documento, no el color realmente pintado.
        const isSvgText = el.namespaceURI === 'http://www.w3.org/2000/svg';
        const fillColor = isSvgText ? parseColor(cs.fill) : null;
        const fg = fillColor || parseColor(cs.color);
        if (!fg) return;

        // El fondo detras del texto puede estar en el propio elemento (ej.
        // el segmento .seg.a de una barra apilada, que lleva su color Y su
        // texto en el mismo nodo) — arrancar en el padre lo saltaba siempre
        // y medía el fondo de la slide en vez del real. effectiveBg ya
        // camina hacia arriba si el propio nodo no tiene fondo opaco, asi
        // que empezar en el elemento mismo cubre ambos casos.
        const bg = effectiveBg(el);
        if (bg.unresolved) { skippedGradient++; return; }

        const composed = over({ ...fg, a: fg.a * op }, bg.color);
        const size = parseFloat(cs.fontSize);
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        const got = ratio(composed, bg.color);
        checked++;
        if (got < need) {
          findings.push({
            slide: label(section),
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className : '',
            text: own.slice(0, 50),
            ratio: Math.round(got * 100) / 100,
            need,
            size: Math.round(size),
            color: cs.color,
            bg: 'rgb(' + [bg.color.r, bg.color.g, bg.color.b].map((v) => Math.round(v)).join(', ') + ')',
          });
        }
      });
    });

    document.title = 'DONE::' + JSON.stringify({ findings, checked, skippedGradient });
  });
});
</script>
`;

const withHarness = injectBeforeBodyEnd(html, harness);
// Al lado del deck real, no en os.tmpdir(): ver el comentario equivalente
// en check-overflow.mjs — rutas relativas a assets locales se rompen si el
// harness se copia a otra carpeta.
const tmp = path.join(path.dirname(path.resolve(file)), `.slizdeck-check-contrast-${process.pid}.html`);
writeFileSync(tmp, withHarness);

const MAX_ATTEMPTS = 2;
let m = null;
try {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !m; attempt++) {
    const dom = execFileSync(
      CHROME,
      ['--headless', '--disable-gpu', '--no-sandbox', '--dump-dom', '--virtual-time-budget=12000', `file://${tmp}`],
      { stdio: 'pipe', timeout: 40000 },
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
    console.error(`  Causa mas probable: el deck carga script(s) externo(s) bloqueante(s): ${externos.join(', ')}`);
  } else {
    console.error('  El deck no tiene scripts externos: revisar que Chrome headless funcione en esta maquina.');
  }
  process.exit(1);
}

const unescape = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const { findings, checked, skippedGradient } = JSON.parse(unescape(m[1]));

console.log(`\n${file}\n`);

if (findings.length) {
  const bySlide = new Map();
  for (const f of findings) {
    if (!bySlide.has(f.slide)) bySlide.set(f.slide, []);
    bySlide.get(f.slide).push(f);
  }
  for (const [slide, list] of bySlide) {
    console.log(`  ✗ ${slide}`);
    for (const f of list) {
      const cls = f.classes ? `.${f.classes.trim().split(/\s+/).join('.')}` : '';
      console.log(`      <${f.tag}${cls}>  "${f.text}"`);
      console.log(`      ${f.ratio}:1 sobre ${f.need}:1 requerido · ${f.color} sobre ${f.bg} · ${f.size}px`);
    }
    console.log();
  }
  console.log(`✗ ${findings.length} texto(s) por debajo del umbral WCAG AA (de ${checked} medidos).`);
  console.log('  Subir el contraste del token que use ese texto, o cambiarle el fondo.');
} else {
  console.log(`  ✓ los ${checked} textos medidos pasan el umbral WCAG AA sobre su fondo real.`);
}

if (skippedGradient) {
  console.log(`\n  ⚠ ${skippedGradient} texto(s) sobre gradiente, imagen o background-clip NO se midieron:`);
  console.log('    su fondo no es un color plano, asi que un solo ratio no lo describiria.');
  console.log('    Revisarlos a ojo (tipicamente el cover y el cierre).');
}

console.log();
process.exit(findings.length ? 1 : 0);
