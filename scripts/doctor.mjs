#!/usr/bin/env node
/**
 * slizdeck · doctor
 *
 * Reporta (no repara) drift entre la versión del engine con la que se
 * generó un deck y la versión actual de template.html. A diferencia de un
 * artefacto estructurado (design-tokens.json), un deck es HTML fuertemente
 * customizado a mano — contenido, animaciones propias, layouts copiados y
 * editados — así que un auto-fix real sería arriesgado. Este script solo
 * dice "esto cambió entre tu versión y la actual, decide si te aplica",
 * leyendo las entradas de CHANGELOG.md entre ambas versiones.
 *
 *   node scripts/doctor.mjs deck.html
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/doctor.mjs <deck.html>');
  process.exit(1);
}

const VERSION_RE = /slizdeck-engine-version:\s*([0-9]+\.[0-9]+\.[0-9]+)/;

function parseVersion(v) {
  const [major, minor, patch] = v.split('.').map(Number);
  return { major, minor, patch };
}

function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

function currentEngineVersion() {
  const templateHtml = readFileSync(path.join(ROOT, 'template.html'), 'utf8');
  const m = VERSION_RE.exec(templateHtml);
  if (!m) throw new Error('template.html no tiene el marcador slizdeck-engine-version — revisar la skill misma.');
  return m[1];
}

function changelogEntriesAfter(version) {
  const changelog = readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  const sections = changelog.split(/^## /m).slice(1); // cada bloque empieza con "X.Y.Z\n..."
  const relevant = [];
  for (const section of sections) {
    const versionMatch = /^([0-9]+\.[0-9]+\.[0-9]+)/.exec(section);
    if (!versionMatch) continue;
    const sectionVersion = versionMatch[1];
    if (compareVersions(sectionVersion, version) > 0) {
      relevant.push(`## ${section.trim()}`);
    }
  }
  return relevant;
}

if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}
const html = readFileSync(file, 'utf8');
const current = currentEngineVersion();
const m = VERSION_RE.exec(html);

console.log(`\n${file}\n`);

if (!m) {
  console.log(`  ⚠ este deck no tiene el marcador slizdeck-engine-version — se generó antes de que existiera (versiones < 1.0.0).`);
  console.log(`    No se puede comparar automáticamente contra la versión actual (${current}). Revisar CHANGELOG.md a mano si sospechas de un bug conocido (ej. correr scripts/check-reveal.mjs para el fix de cascada CSS de 1.0.0).\n`);
  process.exit(0);
}

const deckVersion = m[1];
if (compareVersions(deckVersion, current) >= 0) {
  console.log(`  ✓ generado con la versión ${deckVersion}, al día con el engine actual (${current}).\n`);
  process.exit(0);
}

const entries = changelogEntriesAfter(deckVersion);
console.log(`  ⚠ generado con la versión ${deckVersion}; el engine actual es ${current}. Cambios posteriores en CHANGELOG.md que podrían aplicarte:\n`);
for (const entry of entries) {
  console.log(entry.split('\n').map((l) => `    ${l}`).join('\n'));
  console.log();
}
console.log('  Esto es informativo, no un fallo — decide si alguno de estos cambios te aplica y aplícalo a mano si corresponde.\n');
process.exit(0);
