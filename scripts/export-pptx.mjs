#!/usr/bin/env node
/**
 * slizdeck · export-pptx
 *
 * Convierte un deck HTML de slizdeck en un .pptx EDITABLE, por geometria:
 * renderiza cada slide en Chrome headless en su estado final, mide lo que el
 * navegador realmente dibujo (scripts/lib/measure-deck.mjs) y lo reconstruye
 * en PowerPoint en la misma posicion:
 *
 *  - Texto: cajas de texto nativas con sus runs de estilo (color, tamaño,
 *    peso, italica, tracking), en la posicion y ancho medidos.
 *  - Cajas con fondo o borde (cards, barras, reglas): formas nativas, con
 *    radio de borde.
 *  - Imagenes: embebidas de verdad, ya recortadas como las muestra el deck
 *    (object-fit, border-radius, filtros CSS).
 *  - SVG (iconos, diagramas, charts a mano): imagen PNG a 2x; sus <text>
 *    viajan como texto editable encima.
 *  - Fondos con degradado o grano: captura del fondo de la slide, sin su
 *    contenido, como imagen de fondo.
 *  - Speaker notes (<script id="speaker-notes">): al campo nativo de notas.
 *
 * Un patron de layout nuevo se exporta sin tocar este script.
 *
 *   node scripts/export-pptx.mjs deck.html [salida.pptx] [--safe-fonts] [--slides=1,3-5] [--legacy]
 *
 *   --safe-fonts  usa Arial/Georgia/Consolas en vez de las fuentes del deck
 *                 (para abrirlo en una maquina sin las fuentes del pack)
 *   --slides      exporta solo esas slides
 *   --legacy      el exportador anterior por reconocimiento de clases
 *
 * Lo que no viaja se reporta y el script sale con codigo 1: texto que no se
 * pudo ubicar, texto generado por CSS (::before/::after con content). Los
 * degradados de cajas aplanados a su primer color y las decoraciones CSS
 * sin texto se avisan sin fallar. Ninguna validacion de esta skill dice
 * mas de lo que comprobo.
 *
 * Requiere Chrome/Chromium (scripts/lib/find-chrome.mjs, CHROME_PATH).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const flagValue = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');

if (flag('legacy')) {
  const legacy = path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib', 'export-pptx-legacy.mjs');
  const r = spawnSync(process.execPath, [legacy, ...args.filter((a) => a !== '--legacy')], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

// La unica dependencia npm de la skill (junto con node-html-parser, que usa
// solo el legacy). import() para fallar con un mensaje que dice que hacer.
let PptxGenJS, JSZip;
try {
  ({ default: PptxGenJS } = await import('pptxgenjs'));
  ({ default: JSZip } = await import('jszip'));
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  const root = fileURLToPath(new URL('..', import.meta.url));
  console.error('✗ falta la dependencia del export a PPTX (pptxgenjs).');
  console.error(`  Instálala con: npm install --prefix "${root}"`);
  console.error('  (o reinstala la skill con: npx slizdeck install)');
  process.exit(1);
}

const { measureDeck, shootBackground } = await import('./lib/measure-deck.mjs');

const [input, outArg] = args.filter((a) => !a.startsWith('--'));
if (!input) {
  console.error('uso: node scripts/export-pptx.mjs <deck.html> [salida.pptx] [--safe-fonts] [--slides=1,3-5] [--legacy]');
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`no existe el archivo: ${input}`);
  process.exit(1);
}
const out = outArg || path.basename(input, path.extname(input)) + '.pptx';

// Antes de levantar Chrome: un HTML que no es un deck de slizdeck produciria
// un .pptx vacio con un "✓", que es justo lo que ningun script debe hacer.
{
  const masked = readFileSync(input, 'utf8').replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const stage = /<deck-stage[^>]*>([\s\S]*?)<\/deck-stage>/.exec(masked);
  if (!stage || !/<section\b/.test(stage[1])) {
    console.error(`✗ ${input}: no se encontro <deck-stage> con slides. ¿Es un deck de slizdeck?`);
    process.exit(1);
  }
}

/* ── Unidades ────────────────────────────────────────────────────────────
   El canvas mide 1920x1080 px; PPTX 16:9 mide 13.333x7.5 in = 960x540 pt.
   Con otro tamaño de canvas la proporcion se recalcula abajo.            */
let PX_PER_IN = 144;
const inch = (v) => v / PX_PER_IN;
const pt = (v) => (v / PX_PER_IN) * 72;
const transparency = (a = 1, op = 1) => Math.max(0, Math.min(100, Math.round((1 - a * op) * 100)));

/* ── Fuentes ─────────────────────────────────────────────────────────────
   Las familias genericas (o las pilas de sistema) no existen como fuente
   en Office: se nombran con una equivalente universal.                    */
const GENERIC = [
  [/^(-apple-system|system-ui|blinkmacsystemfont|ui-sans-serif|sans-serif|segoe ui|helvetica neue|helvetica)$/i, 'Arial'],
  [/^(ui-monospace|monospace|sfmono-regular|menlo|monaco|sf mono)$/i, 'Consolas'],
  [/^(ui-serif|serif)$/i, 'Georgia'],
];
const safeFont = (f) => /mono|code|courier/i.test(f) ? 'Consolas'
  : /serif|garamond|caslon|georgia|times|playfair|young|spectral|newsreader|fraunces/i.test(f) && !/sans/i.test(f) ? 'Georgia'
  : 'Arial';
const SAFE = flag('safe-fonts');
function fontFor(f) {
  if (SAFE) return safeFont(f || '');
  for (const [re, name] of GENERIC) if (re.test(f || '')) return name;
  return f || 'Arial';
}

function parseRange(spec, max) {
  if (!spec) return null;
  const set = new Set();
  for (const part of spec.split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!m) { console.error(`--slides: no entiendo "${part}"`); process.exit(1); }
    for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) if (i >= 1 && i <= max) set.add(i);
  }
  return set;
}

/* ── Imagenes que el navegador no pudo leer (remotas sin CORS) ─────────── */
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };
async function loadSrc(src) {
  if (src.startsWith('data:')) return src.slice(5);
  const ext = (/\.([a-z0-9]+)(?:[?#]|$)/i.exec(src)?.[1] || 'png').toLowerCase();
  const mime = MIME[ext] || 'image/png';
  if (src.startsWith('file:')) return `${mime};base64,${readFileSync(fileURLToPath(src)).toString('base64')}`;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type')?.split(';')[0] || mime;
  return `${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
}

/* ── Texto ───────────────────────────────────────────────────────────── */
function textRuns(item) {
  const runs = [];
  for (const r of item.runs) {
    if (r.br) {
      if (runs.length) runs[runs.length - 1].options.breakLine = true;
      continue;
    }
    const parts = r.text.split('\n');
    parts.forEach((part, i) => {
      runs.push({
        text: part,
        options: {
          color: r.color.hex,
          transparency: transparency(r.color.a, item.op),
          fontSize: Math.round(pt(r.size) * 10) / 10,
          fontFace: fontFor(r.font),
          bold: r.bold,
          italic: r.italic,
          charSpacing: r.spacing ? Math.round(pt(r.spacing) * 10) / 10 : undefined,
          underline: r.underline ? { style: 'sng' } : undefined,
          strike: r.strike ? 'sngStrike' : undefined,
          breakLine: i < parts.length - 1,
        },
      });
    });
  }
  return runs;
}

function addText(slide, item) {
  const lh = item.lineHeight || item.firstLineH;
  // La caja medida es la del texto (Range); la linea completa arranca
  // medio interlineado mas arriba, que es donde PowerPoint empieza a
  // contar el espaciado exacto.
  const top = item.y - Math.max(0, (lh - item.firstLineH) / 2);
  let x, w, wrap;
  if (item.lines <= 1) {
    // Una linea: sin ajuste de linea y con holgura, para que una fuente
    // sustituta un poco mas ancha no la parta en dos.
    wrap = false;
    w = item.w * 1.12 + 12;
    x = item.align === 'center' ? item.x - (w - item.w) / 2 : item.align === 'right' ? item.x - (w - item.w) : item.x;
  } else {
    wrap = true;
    const cw = item.content && item.content.w > item.w ? item.content.w : item.w;
    const cx = item.content && item.content.w > item.w ? item.content.x : item.x;
    w = cw * 1.03;
    x = item.align === 'center' ? cx - (w - cw) / 2 : item.align === 'right' ? cx - (w - cw) : cx;
  }
  const h = Math.max(item.h, lh * item.lines);
  slide.addText(textRuns(item), {
    x: inch(x), y: inch(top), w: inch(w), h: inch(h),
    margin: 0, valign: 'top', wrap, fit: 'none',
    align: item.align === 'justify' ? 'justify' : item.align,
    lineSpacing: Math.round(pt(lh) * 10) / 10,
    paraSpaceBefore: 0, paraSpaceAfter: 0,
    bullet: item.list === 'bullet' ? true : item.list === 'number' ? { type: 'number' } : undefined,
    // OOXML exige 0..359; un rotate(-15) del SVG es 345.
    rotate: item.rotate ? ((item.rotate % 360) + 360) % 360 : undefined,
  });
}

/* ── Formas ──────────────────────────────────────────────────────────── */
function addRect(pptx, slide, item) {
  const rounded = item.radius > 0.5;
  slide.addShape(rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x: inch(item.x), y: inch(item.y), w: inch(item.w), h: inch(item.h),
    fill: item.fill ? { color: item.fill.hex, transparency: transparency(item.fill.a, item.op) } : { type: 'none' },
    line: item.line
      ? { color: item.line.c.hex, width: Math.max(0.25, pt(item.line.w)), transparency: transparency(item.line.c.a, item.op), dashType: item.line.dash ? 'dash' : 'solid' }
      : { type: 'none' },
    rectRadius: rounded ? inch(item.radius) : undefined,
  });
}

/* ── Main ────────────────────────────────────────────────────────────── */
let model;
try {
  model = measureDeck(input);
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
PX_PER_IN = model.canvas.w / 13.333;

const only = parseRange(flagValue('slides'), model.slides.length);
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = path.basename(input, path.extname(input));

const lost = [];
const warnings = { gradients: 0, decorations: 0, raster: [] };

// Un fondo capturado se guarda una sola vez, en un slide master, y lo
// comparten todas las slides con el mismo fondo (cover y cierre suelen
// ser identicos): el .pptx no repite la imagen por slide.
const masters = new Map();
function masterFor(jpeg) {
  const hash = createHash('sha1').update(jpeg).digest('hex').slice(0, 12);
  if (!masters.has(hash)) {
    const title = `slizdeck-bg-${masters.size + 1}`;
    pptx.defineSlideMaster({ title, background: { data: `image/jpeg;base64,${jpeg.toString('base64')}` } });
    masters.set(hash, title);
  }
  return masters.get(hash);
}

for (const s of model.slides) {
  if (only && !only.has(s.index)) continue;
  let slide;
  if (s.rasterBg) {
    try {
      slide = pptx.addSlide({ masterName: masterFor(shootBackground(input, s.index)) });
    } catch (e) {
      slide = pptx.addSlide();
      slide.background = { color: s.bg.hex };
      warnings.raster.push(`slide ${s.index}: fondo degradado aplanado a color (${e.message.split('\n')[0]})`);
    }
  } else {
    slide = pptx.addSlide();
    slide.background = { color: s.bg.hex };
  }

  for (const item of s.items) {
    if (item.type === 'rect') addRect(pptx, slide, item);
    else if (item.type === 'text') addText(slide, item);
    else if (item.type === 'image' || item.type === 'image-src') {
      let data = item.data ? item.data.replace(/^data:/, '') : null;
      if (!data) {
        try { data = await loadSrc(item.src); } catch (e) {
          warnings.raster.push(`slide ${s.index}: imagen ${item.src.slice(0, 60)} no se pudo leer (${e.message})`);
          continue;
        }
      }
      slide.addImage({
        data, x: inch(item.x), y: inch(item.y), w: inch(item.w), h: inch(item.h),
        transparency: item.op < 1 ? transparency(1, item.op) : undefined,
        altText: item.alt || undefined,
      });
    }
  }

  if (s.notes) slide.addNotes(s.notes);

  const slideLost = [...s.lostText, ...s.stats.pseudoText.map((t) => ({ tag: '::before/::after', cls: '', text: t }))];
  if (slideLost.length) lost.push({ n: s.index, label: s.label, lost: slideLost });
  warnings.gradients += s.stats.gradientsFlattened;
  warnings.decorations += s.stats.pseudoDecorations;
  for (const f of s.stats.rasterFailed) warnings.raster.push(`slide ${s.index}: ${f} no se pudo rasterizar`);
}

/* pptxgenjs repite <a:pPr> delante de cada run de un parrafo con varios
   estilos ("Autor · <b>04</b>"): el schema solo admite uno, al principio.
   PowerPoint puede pedir "reparar" el archivo. Se deja solo el primero. */
function fixParagraphs(xml) {
  return xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (p, body) => {
    let first = true;
    return '<a:p>' + body.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (m) => {
      if (first) { first = false; return m; }
      return '';
    }) + '</a:p>';
  });
}
const zip = await JSZip.loadAsync(await pptx.write({ outputType: 'nodebuffer' }));
for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
  zip.file(name, fixParagraphs(await zip.file(name).async('string')));
}
writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

const exported = only ? only.size : model.slides.length;
const fonts = [...new Set(model.fonts.map(fontFor))];
const withNotes = model.slides.filter((s) => (!only || only.has(s.index)) && s.notes).length;

if (lost.length) {
  const total = lost.reduce((a, p) => a + p.lost.length, 0);
  console.log(`⚠ ${out} · ${exported} slides — EXPORT INCOMPLETO`);
  console.log(`  ${total} texto(s) no viajaron al .pptx, en ${lost.length} slide(s):`);
  for (const { n, lost: l } of lost) {
    console.log(`\n  slide ${n}:`);
    for (const x of l.slice(0, 6)) console.log(`    <${x.tag}${x.cls ? '.' + x.cls.split(/\s+/).join('.') : ''}>  "${x.text}"`);
    if (l.length > 6) console.log(`    … y ${l.length - 6} mas`);
  }
  console.log('\n  El texto generado por CSS (content: "…" en ::before/::after) no existe en el DOM: si es contenido, pasarlo al HTML.');
  process.exitCode = 1;
} else {
  console.log(`✓ ${out} · ${exported} slides, todo el texto exportado como texto editable`);
}

console.log(`  Fuentes: ${fonts.join(', ')}${SAFE ? ' (--safe-fonts)' : ''}`);
if (!SAFE) console.log('  Quien abra el .pptx necesita esas fuentes instaladas (Google Fonts); si no, usa --safe-fonts.');
if (withNotes) console.log(`  Speaker notes en ${withNotes} slide(s), en el campo de notas de PowerPoint.`);
if (warnings.gradients) console.log(`  · ${warnings.gradients} degradado(s) de cajas aplanados a su primer color.`);
if (warnings.decorations) console.log(`  · ${warnings.decorations} decoracion(es) CSS (::before/::after sin texto) no se exportan.`);
for (const w of warnings.raster) console.log(`  · ${w}`);
console.log('  Sin animaciones: cada slide en su estado final.');
