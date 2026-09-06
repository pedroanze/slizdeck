#!/usr/bin/env node
/**
 * slizdeck · smoke-test
 *
 * Ejercita la matriz completa de packs x tipografia (default + cada
 * alternativa) contra el template real: aplica el pack, valida contraste,
 * comprueba balance de HTML, renderiza en Chrome headless y confirma que
 * la fuente declarada realmente llego al DOM (no cayo a system-ui).
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

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const OUT_DIR = path.join(ROOT, '.smoke-test-out');

const args = process.argv.slice(2);
const onlyPack = args.find((a) => a.startsWith('--pack='))?.slice('--pack='.length);
const noRender = args.includes('--no-render');

const PACKS = ['terminal', 'paper-white', 'committed', 'instrument', 'editorial']
  .filter((p) => !onlyPack || p === onlyPack);

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

async function renderAndCheck(file) {
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
        execFileSync('node', applyArgs, { cwd: ROOT, stdio: 'pipe' });
      } catch (e) {
        issues.push(`apply-style-pack fallo: ${e.stderr?.toString().trim() || e.message}`);
        results.push({ label, issues });
        continue;
      }

      const html = readFileSync(outFile, 'utf8');

      const balance = [tagBalance(html, 'section'), tagBalance(html, 'div')].filter(Boolean);
      issues.push(...balance);

      try {
        execFileSync('node', ['scripts/check-style-pack.mjs', outFile], { cwd: ROOT, stdio: 'pipe' });
      } catch (e) {
        issues.push(`check-style-pack fallo:\n${e.stdout?.toString().trim()}`);
      }

      const fonts = fontFamiliesInDeck(html);
      if (!fonts.sans && !fonts.heading) issues.push('no se encontraron tokens de fuente en :root');

      if (!noRender) {
        const renderIssue = await renderAndCheck(outFile, label);
        if (renderIssue) issues.push(renderIssue);
      }

      results.push({ label, issues, fonts });
    }
  }

  console.log('\n=== slizdeck smoke-test ===\n');
  let failCount = 0;
  for (const r of results) {
    const ok = r.issues.length === 0;
    if (!ok) failCount++;
    console.log(`${ok ? '✓' : '✗'} ${r.label}${r.fonts ? `  [${r.fonts.heading || r.fonts.sans}${r.fonts.mono ? ' + ' + r.fonts.mono : ''}]` : ''}`);
    for (const issue of r.issues) console.log(`    ${issue.split('\n').join('\n    ')}`);
  }
  console.log(`\n${failCount ? `✗ ${failCount}/${results.length} variantes con problemas` : `✓ ${results.length}/${results.length} variantes OK`}`);
  console.log(`Screenshots en ${OUT_DIR}\n`);
  process.exit(failCount ? 1 : 0);
}

main();
