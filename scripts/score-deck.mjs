#!/usr/bin/env node
/**
 * slizdeck · score-deck
 *
 * Puntaje automatico de 0 a 100 de un deck generado, para comparar la
 * calidad del output entre versiones de la skill (ver evals/README.md).
 * Es un proxy: mide lo que se puede medir sin mirar. La otra mitad de la
 * evaluacion es la rubrica visual de evals/rubric.md, sobre las capturas
 * de shoot.mjs.
 *
 *   node scripts/score-deck.mjs deck.html [--json] [--no-chrome]
 *   node scripts/score-deck.mjs --all <carpeta> [--out=resultados.json] [--no-chrome]
 *
 * Cinco componentes (el detalle de cada uno sale en el reporte):
 *
 *   validaciones  30  audit (10), check-overflow (10), check-contrast (10).
 *                     --no-chrome solo corre audit y escala a 30.
 *   texto         20  promedio de palabras en pantalla por slide de
 *                     contenido: 20 pts hasta 25 palabras, 0 desde 60.
 *   variedad      20  estructuras de slide distintas / slides de contenido
 *                     (0,7 o mas = 20 pts).
 *   visual        20  slides de contenido con algo mas que texto: imagen,
 *                     SVG, grafica, tabla, cifra animada, cards.
 *   notas         10  slides con notas del presentador.
 *
 * "Slide de contenido" = todas menos cover, transiciones (data-steps="1"
 * con .ts-title o h1.cover) y standby. Nada de esto reemplaza mirar el
 * deck: un deck puede sacar 90 y tener una slide que no se entiende.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const flagValue = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
const noChrome = flag('no-chrome');

function runScript(script, file) {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), file], { stdio: 'pipe', timeout: 180000 }).toString();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout?.toString() || '') + (e.stderr?.toString() || '') };
  }
}

const VISUAL = /<(img|svg|figure|table|canvas)\b|data-counter=|class="[^"]*\b(sz-chart|sz-timeline|card|pq-card|metrica|metricas|barras|prop|split|bleed|pipe-card)\b/;
const COMMON = /^(reveal|r-\w+|is-on|eyebrow|title|subtitle|footer|num|left|pad|center|act-marker|step-num|step-total|stagger|sweep|grad|grad-word|unit|cover|cover-md|ts-title|ts-tagline|payoff|lead|sub|hl)$/;

function analyze(html) {
  const visible = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, (m) => (/speaker-notes/.test(m) ? m : ''));
  const body = /<deck-stage[^>]*>([\s\S]*)<\/deck-stage>/.exec(visible)?.[1] || '';
  let jsonNotes = [];
  try { jsonNotes = JSON.parse(/<script[^>]*id="speaker-notes"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] || '[]'); } catch (e) {}
  const slides = [...body.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m, i) => {
    const attrs = m[1], inner = m[2];
    const label = /data-label="([^"]*)"/.exec(attrs)?.[1] || `slide ${i + 1}`;
    const isStatic = /data-steps="1"/.test(attrs);
    const special = /\bclass="[^"]*\bgrad\b/.test(attrs) && /h1 class="cover/.test(inner)
      || (isStatic && /class="ts-title/.test(inner))
      || /\bstandby\b/.test(inner) || /standby/i.test(label);
    const onScreen = inner.replace(/<aside class="notes"[\s\S]*?<\/aside>/g, ' ')
      .replace(/<div class="footer"[\s\S]*?<\/div>\s*<\/div>/g, ' ');
    const text = onScreen.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<table[\s\S]*?<\/table>/g, ' ')
      .replace(/<figure[\s\S]*?<\/figure>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
    const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    const classes = new Set();
    for (const c of inner.matchAll(/class="([^"]*)"/g)) for (const t of c[1].split(/\s+/)) if (t && !COMMON.test(t)) classes.add(t);
    const hasNotes = /<aside class="notes"[\s\S]*?\S[\s\S]*?<\/aside>/.test(inner) || (typeof jsonNotes[i] === 'string' && jsonNotes[i].trim().length > 0);
    return { label, special, words, sig: [...classes].sort().join(' '), visual: VISUAL.test(onScreen), notes: hasNotes, reveals: (inner.match(/class="[^"]*\breveal\b/g) || []).length };
  });
  return slides;
}

function score(file) {
  const html = readFileSync(file, 'utf8');
  const slides = analyze(html);
  const content = slides.filter((s) => !s.special);
  const n = content.length || 1;

  const audit = runScript('audit.mjs', file);
  const warnings = (audit.out.match(/^\s*⚠/gm) || []).length;
  const checks = { audit: audit.ok };
  if (!noChrome) {
    checks.overflow = runScript('check-overflow.mjs', file).ok;
    checks.contrast = runScript('check-contrast.mjs', file).ok;
  }
  const passed = Object.values(checks).filter(Boolean).length;
  const validaciones = Math.round((passed / Object.keys(checks).length) * 30);

  const avgWords = content.reduce((a, s) => a + s.words, 0) / n;
  const texto = Math.round(Math.max(0, Math.min(1, (60 - avgWords) / (60 - 25))) * 20);

  const distinct = new Set(content.map((s) => s.sig)).size;
  const variedad = Math.round(Math.min(1, distinct / n / 0.7) * 20);

  const withVisual = content.filter((s) => s.visual).length;
  const visual = Math.round((withVisual / n) * 20);

  const withNotes = slides.filter((s) => s.notes).length;
  const notas = Math.round((withNotes / (slides.length || 1)) * 10);

  const total = validaciones + texto + variedad + visual + notas;
  return {
    file: path.relative(process.cwd(), file) || file,
    total,
    parts: { validaciones, texto, variedad, visual, notas },
    detail: {
      slides: slides.length, contentSlides: content.length, checks, auditWarnings: warnings,
      avgWords: Math.round(avgWords * 10) / 10, maxWords: Math.max(0, ...content.map((s) => s.words)),
      distinctLayouts: distinct, withVisual, withNotes,
      animated: slides.filter((s) => s.reveals > 0).length,
    },
  };
}

function report(r) {
  const d = r.detail;
  const c = Object.entries(d.checks).map(([k, v]) => `${k} ${v ? '✓' : '✗'}`).join(' · ');
  console.log(`\n${r.file}\n`);
  console.log(`  ${String(r.total).padStart(3)} / 100\n`);
  console.log(`  validaciones  ${String(r.parts.validaciones).padStart(2)}/30   ${c}${d.auditWarnings ? ` · ${d.auditWarnings} aviso(s) de audit` : ''}${noChrome ? ' (sin Chrome)' : ''}`);
  console.log(`  texto         ${String(r.parts.texto).padStart(2)}/20   ${d.avgWords} palabras por slide de contenido en promedio (máx. ${d.maxWords})`);
  console.log(`  variedad      ${String(r.parts.variedad).padStart(2)}/20   ${d.distinctLayouts} estructuras distintas en ${d.contentSlides} slides de contenido`);
  console.log(`  visual        ${String(r.parts.visual).padStart(2)}/20   ${d.withVisual} de ${d.contentSlides} slides de contenido con algo más que texto`);
  console.log(`  notas         ${String(r.parts.notas).padStart(2)}/10   ${d.withNotes} de ${d.slides} slides con notas del presentador`);
  console.log('\n  Proxy automático: completar con la rúbrica visual de evals/rubric.md.\n');
}

const allDir = args.includes('--all') ? args[args.indexOf('--all') + 1] : null;
if (allDir) {
  if (!existsSync(allDir) || !statSync(allDir).isDirectory()) { console.error(`no es una carpeta: ${allDir}`); process.exit(1); }
  const files = readdirSync(allDir).filter((f) => f.endsWith('.html') && !f.startsWith('.')).map((f) => path.join(allDir, f));
  if (!files.length) { console.error(`${allDir}: no hay decks .html`); process.exit(1); }
  const results = files.map(score).map((r) => ({ ...r, file: path.basename(r.file) }));
  results.forEach(report);
  const avg = Math.round(results.reduce((a, r) => a + r.total, 0) / results.length);
  console.log(`Promedio: ${avg} / 100 en ${results.length} deck(s)\n`);
  const out = flagValue('out');
  if (out) {
    const version = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
    writeFileSync(out, JSON.stringify({ version, date: new Date().toISOString().slice(0, 10), chrome: !noChrome, average: avg, results }, null, 2) + '\n');
    console.log(`Resultados en ${out}\n`);
  }
} else {
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('uso: node scripts/score-deck.mjs <deck.html> [--json] [--no-chrome]\n     node scripts/score-deck.mjs --all <carpeta> [--out=resultados.json] [--no-chrome]');
    process.exit(1);
  }
  if (!existsSync(file)) { console.error(`no existe el archivo: ${file}`); process.exit(1); }
  const r = score(file);
  if (flag('json')) console.log(JSON.stringify(r, null, 2));
  else report(r);
}
