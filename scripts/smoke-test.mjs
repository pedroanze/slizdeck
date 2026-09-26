#!/usr/bin/env node
/**
 * slizdeck · smoke-test
 *
 * Ejercita la matriz completa de packs x tipografia (default + cada
 * alternativa) contra el template real: aplica el pack, valida contraste,
 * comprueba balance de HTML y renderiza en Chrome headless (captura por
 * variante, para revisar a ojo).
 *
 * Existe porque los scripts de validacion existentes (check-style-pack,
 * apply-style-pack) se probaron manualmente caso por caso durante su
 * construccion, pero nunca los 5 packs x 3 variantes de fuente juntos en
 * una sola pasada — que es exactamente donde una regresion en el template
 * compartido se notaria en un pack y no en otro.
 *
 *   node scripts/smoke-test.mjs             # todos los packs, todas las fuentes
 *   node scripts/smoke-test.mjs --pack=terminal
 *   node scripts/smoke-test.mjs --no-render  # salta Chrome, solo checks estaticos
 *
 * Requiere Google Chrome/Chromium instalado (salvo con --no-render). Se
 * detecta automáticamente (macOS, Linux, Windows) vía
 * scripts/lib/find-chrome.mjs; si no está en una ruta típica, setear
 * CHROME_PATH con la ruta completa al ejecutable.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome } from './lib/find-chrome.mjs';

// fileURLToPath y no .pathname: .pathname deja %20 en las rutas con
// espacios y en Windows devuelve /C:/... que no resuelve.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.smoke-test-out');

const args = process.argv.slice(2);
const onlyPack = args.find((a) => a.startsWith('--pack='))?.slice('--pack='.length);
const noRender = args.includes('--no-render');

// Los packs salen de styles/, no de una lista escrita a mano.
const ALL_PACKS = readdirSync(path.join(ROOT, 'styles')).filter((f) => f.endsWith('.md') && f !== 'index.md').map((f) => f.slice(0, -3));
const PACKS = ALL_PACKS.filter((p) => !onlyPack || p === onlyPack);
if (!PACKS.length) {
  console.error(`--pack: no existe "${onlyPack}". Packs: ${ALL_PACKS.join(', ')}`);
  process.exit(1);
}

function readPackAlts(packFile) {
  const md = readFileSync(packFile, 'utf8');
  const ids = [...md.matchAll(/^### Alt: ([a-z0-9-]+) —/gm)].map((m) => m[1]);
  return ids;
}

function tagBalance(html, tag) {
  // Sin esto, las convenciones de uso documentadas en comentarios HTML
  // (ej. "<div class=\"pad\">  (standard padding frame)") se cuentan como
  // tags reales y disparan un falso positivo en todas las variantes.
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
  const open = (stripped.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
  const close = (stripped.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return open === close ? null : `${tag}: ${open} abiertos vs ${close} cerrados`;
}

function fontFamiliesInDeck(html) {
  const sans = /--cs-font-sans:\s*'([^']+)'/.exec(html)?.[1];
  const heading = /--cs-font-heading:\s*'([^']+)'/.exec(html)?.[1];
  const mono = /--cs-font-mono:\s*'([^']+)'/.exec(html)?.[1];
  return { sans, heading, mono };
}

let _chrome;
function chromePath() {
  if (!_chrome) _chrome = findChrome();
  return _chrome;
}

function renderAndCheck(file) {
  const png = file.replace(/\.html$/, '.png');
  try {
    execFileSync(chromePath(), [
      '--headless', '--disable-gpu', '--no-sandbox', '--force-device-scale-factor=1',
      '--window-size=1920,1080', `--screenshot=${png}`,
      '--virtual-time-budget=4000', `file://${file}`,
    ], { stdio: 'pipe', timeout: 30000 });
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString().trim() : '';
    return `render fallo: ${stderr || e.message.split('\n')[0]}`;
  }
  return null;
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const results = [];

  for (const pack of PACKS) {
    const packFile = path.join(ROOT, 'styles', `${pack}.md`);
    const alts = readPackAlts(packFile);
    const variants = [null, ...alts]; // null = default

    for (const variant of variants) {
      const label = `${pack}${variant ? `+${variant}` : ' (default)'}`;
      const outFile = path.join(OUT_DIR, `${pack}${variant ? `-${variant}` : ''}.html`);
      const issues = [];

      writeFileSync(outFile, readFileSync(path.join(ROOT, 'template.html'), 'utf8'));

      const applyArgs = ['scripts/apply-style-pack.mjs', `styles/${pack}.md`, outFile];
      if (variant) applyArgs.push(`--font=${variant}`);
      try {
        execFileSync(process.execPath, applyArgs, { cwd: ROOT, stdio: 'pipe' });
      } catch (e) {
        issues.push(`apply-style-pack fallo: ${e.stderr?.toString().trim() || e.message}`);
        results.push({ label, issues });
        continue;
      }

      const html = readFileSync(outFile, 'utf8');

      const balance = [tagBalance(html, 'section'), tagBalance(html, 'div')].filter(Boolean);
      issues.push(...balance);

      try {
        execFileSync(process.execPath, ['scripts/check-style-pack.mjs', outFile], { cwd: ROOT, stdio: 'pipe' });
      } catch (e) {
        issues.push(`check-style-pack fallo:\n${e.stdout?.toString().trim()}`);
      }

      const fonts = fontFamiliesInDeck(html);
      if (!fonts.sans && !fonts.heading) issues.push('no se encontraron tokens de fuente en :root');

      if (!noRender) {
        const renderIssue = renderAndCheck(outFile);
        if (renderIssue) issues.push(renderIssue);
      }

      results.push({ label, issues, fonts });
    }
  }

  // ── Fase 2: cada pack sobre CONTENIDO REAL ───────────────────────────
  // La fase de arriba aplica los packs al template vacio: verifica que los
  // tokens entren y la fuente cargue, pero un deck vacio no tiene texto que
  // desborde, ni cards que se pisen, ni contraste que medir sobre una
  // composicion de verdad. Aplicar cada pack al deck de ejemplo cubre eso:
  // si un cambio de engine rompe la composicion de `terminal`, se ve aca.
  const showcase = path.join(ROOT, 'examples', 'pitch-showcase.html');
  if (existsSync(showcase)) {
    for (const pack of PACKS) {
      const label = `${pack} sobre contenido real`;
      const outFile = path.join(OUT_DIR, `contenido-${pack}.html`);
      const issues = [];
      writeFileSync(outFile, readFileSync(showcase, 'utf8'));
      try {
        execFileSync(process.execPath, ['scripts/apply-style-pack.mjs', `styles/${pack}.md`, outFile], { cwd: ROOT, stdio: 'pipe' });
      } catch (e) {
        issues.push(`apply-style-pack fallo: ${e.stderr?.toString().trim() || e.message}`);
        results.push({ label, issues });
        continue;
      }
      // Estructura (audit, overflow, solape): independiente del pack, asi que
      // un fallo aqui SI es una regresion de engine y bloquea.
      // Contraste: informativo. El deck de ejemplo esta compuesto para
      // paper-white, y un pack puede tener reglas propias sobre su acento
      // (`--cs-accent-on: primary` en committed). Que su lima no sirva como
      // texto sobre fondo claro no es un bug del engine, es esa restriccion
      // aplicada a un contenido que no la respeta.
      const bloqueantes = noRender
        ? [['audit.mjs', 'audit']]
        : [['audit.mjs', 'audit'], ['check-overflow.mjs', 'overflow/solape']];
      for (const [script, nombre] of bloqueantes) {
        try {
          execFileSync(process.execPath, [`scripts/${script}`, outFile], { cwd: ROOT, stdio: 'pipe' });
        } catch (e) {
          issues.push(`${nombre} fallo:\n${(e.stdout?.toString() || e.stderr?.toString() || '').trim()}`);
        }
      }
      let nota = null;
      if (!noRender) {
        try {
          execFileSync(process.execPath, ['scripts/check-contrast.mjs', outFile], { cwd: ROOT, stdio: 'pipe' });
        } catch (e) {
          const out = (e.stdout?.toString() || '').trim();
          const n = /✗ (\d+) texto/.exec(out)?.[1];
          nota = `contraste: ${n || '?'} texto(s) bajo umbral al aplicar este pack a un contenido compuesto para otro`;
        }
      }
      results.push({ label, issues, nota });
    }
  }

  console.log('\n=== slizdeck smoke-test ===\n');
  let failCount = 0;
  for (const r of results) {
    const ok = r.issues.length === 0;
    if (!ok) failCount++;
    console.log(`${ok ? '✓' : '✗'} ${r.label}${r.fonts ? `  [${r.fonts.heading || r.fonts.sans}${r.fonts.mono ? ' + ' + r.fonts.mono : ''}]` : ''}`);
    for (const issue of r.issues) console.log(`    ${issue.split('\n').join('\n    ')}`);
    // Informativo, no cuenta como fallo: ver la nota de la fase 2.
    if (r.nota) console.log(`    ℹ ${r.nota}`);
  }
  console.log(`\n${failCount ? `✗ ${failCount}/${results.length} variantes con problemas` : `✓ ${results.length}/${results.length} variantes OK`}`);
  console.log(`Screenshots en ${OUT_DIR}\n`);
  process.exit(failCount ? 1 : 0);
}

main();
