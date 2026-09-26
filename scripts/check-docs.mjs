#!/usr/bin/env node
/**
 * slizdeck · check-docs
 *
 * Canario contra el drift entre la documentacion y el repo real. No
 * comprueba que los textos sean buenos: comprueba invariantes que, si se
 * rompen, hacen que un modelo siguiendo la doc haga algo imposible.
 *
 *   1. Todo script de scripts/*.mjs y bin/ aparece en la tabla de
 *      CONTRIBUTING.md, y los que usa el agente tambien en la de SKILL.md
 *      (las herramientas de mantenimiento, DEV_ONLY, solo en CONTRIBUTING).
 *   2. Todo reference/*.md aparece en la tabla de SKILL.md.
 *   3. Los links relativos de los .md resuelven a un archivo real.
 *   4. Los colores clave de DESIGN.md coinciden con design.json — el
 *      son el mismo contrato en dos formatos.
 *   5. Ningun style pack declara una fuente de la lista de clichés que el
 *      propio check-style-pack.mjs rechaza (autoconsistencia).
 *
 * Nace de una auditoria que encontro los cuatro casos a la vez: PRODUCT.md
 * describiendo un producto de dos fases atras, design.json con la paleta
 * vieja, un ejemplo que enseñaba justo las fuentes prohibidas, y scripts
 * referenciados que ya no coincidian con la CI. Nada de eso fallaba en
 * ningun lado.
 *
 *   node scripts/check-docs.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

let fail = 0;
const problemas = [];
const bad = (msg, detail) => { fail++; problemas.push({ msg, detail }); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

/* 1 + 2. Cobertura de scripts y referencias en las tablas ─────────────── */

const skill = read('SKILL.md');
// La lista tecnica de archivos vive en CONTRIBUTING.md ("Como esta armado
// el repo"); el README es para quien instala la skill, no para quien la
// mantiene.
const readme = read('CONTRIBUTING.md');

const scripts = readdirSync(path.join(ROOT, 'scripts'))
  .filter((f) => f.endsWith('.mjs'));
const refs = readdirSync(path.join(ROOT, 'reference'))
  .filter((f) => f.endsWith('.md'));

// Herramientas de mantenimiento del repo: el agente que usa la skill no las
// necesita, asi que no ocupan lugar en SKILL.md.
const DEV_ONLY = ['check-docs.mjs', 'check-versions.mjs', 'smoke-test.mjs', 'score-deck.mjs'];
const faltanSkill = scripts.filter((f) => !DEV_ONLY.includes(f) && !skill.includes(`scripts/${f}`));
const faltanReadme = scripts.filter((f) => !readme.includes(`scripts/${f}`));
const bins = readdirSync(path.join(ROOT, 'bin')).filter((f) => f.endsWith('.mjs'));
const binsFaltan = bins.filter((f) => !skill.includes(`bin/${f}`) || !readme.includes(`bin/${f}`));
if (binsFaltan.length) bad('ejecutables de bin/ sin documentar en SKILL.md y CONTRIBUTING.md', binsFaltan.join(', '));
if (faltanSkill.length) bad('scripts sin documentar en SKILL.md', faltanSkill.join(', '));
if (faltanReadme.length) bad('scripts sin documentar en CONTRIBUTING.md', faltanReadme.join(', '));
if (!faltanSkill.length && !faltanReadme.length) ok(`los ${scripts.length} scripts estan en CONTRIBUTING.md, y los ${scripts.length - DEV_ONLY.length} que usa el agente tambien en SKILL.md`);

const refsFaltan = refs.filter((f) => !skill.includes(`reference/${f}`));
if (refsFaltan.length) bad('archivos de reference/ sin documentar en SKILL.md', refsFaltan.join(', '));
else ok(`los ${refs.length} archivos de reference/ estan en la tabla de SKILL.md`);

/* 3. Links relativos que no resuelven ─────────────────────────────────── */

const docs = ['SKILL.md', 'README.md', 'README.en.md', 'ROADMAP.md', 'CONTRIBUTING.md', 'DESIGN.md', 'PRODUCT.md', 'CHANGELOG.md', 'NOTICE.md']
  .concat(refs.map((f) => `reference/${f}`))
  .concat(readdirSync(path.join(ROOT, 'styles')).filter((f) => f.endsWith('.md')).map((f) => `styles/${f}`))
  .filter((f) => existsSync(path.join(ROOT, f)));

const rotos = [];
for (const doc of docs) {
  const body = read(doc);
  const dir = path.dirname(path.join(ROOT, doc));
  // [texto](destino) — solo rutas relativas, no URLs ni anclas
  for (const m of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].split('#')[0].trim();
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(path.resolve(dir, target))) rotos.push(`${doc} → ${target}`);
  }
}
if (rotos.length) bad('links relativos que no resuelven', rotos.join('\n      '));
else ok(`los links relativos de ${docs.length} documentos resuelven`);

/* 4. DESIGN.md y design.json cuentan lo mismo ─────────────────────────── */

const design = read('DESIGN.md');
const designJson = JSON.parse(read('design.json'));
const colorDe = (nombre) => new RegExp(`^\\s*${nombre}:\\s*"?(#[0-9A-Fa-f]{6})"?`, 'm').exec(design)?.[1]?.toUpperCase();
const meta = designJson.extensions?.colorMeta || {};
const pares = [
  ['accent', meta.accent?.canonical],
  ['primary', meta.primary?.canonical],
  ['ink-strong', meta['ink-strong']?.canonical],
];
const desalineados = pares
  .filter(([nombre, json]) => json && colorDe(nombre) && colorDe(nombre) !== json.toUpperCase())
  .map(([nombre, json]) => `${nombre}: DESIGN.md ${colorDe(nombre)} vs design.json ${json}`);
if (desalineados.length) bad('DESIGN.md y design.json declaran colores distintos', desalineados.join('\n      '));
else ok('DESIGN.md y design.json coinciden en los colores clave');

/* 5. Ningun pack usa una fuente que la propia skill rechaza ───────────── */

const checker = read('scripts/check-style-pack.mjs');
// La lista vive como una regex alternada (STOPPED_LOOKING) dentro del
// validador: se lee de ahi para que no haya una segunda copia que mantener.
const listaFuentes = /STOPPED_LOOKING\s*=\s*\/([^/]+)\/i/.exec(checker);
if (listaFuentes) {
  const prohibidas = listaFuentes[1].split('|').map((f) => f.trim().toLowerCase()).filter(Boolean);
  const packs = readdirSync(path.join(ROOT, 'styles')).filter((f) => f.endsWith('.md') && f !== 'index.md');
  const infractores = [];
  for (const pack of packs) {
    const body = read(`styles/${pack}`).toLowerCase();
    for (const f of prohibidas) {
      if (new RegExp(`--cs-font-[a-z]+:\\s*'${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'i').test(body)) {
        infractores.push(`${pack} usa "${f}"`);
      }
    }
  }
  if (infractores.length) bad('un style pack declara una fuente de la lista de clichés', infractores.join(', '));
  else ok(`los ${packs.length} style packs evitan las fuentes que check-style-pack.mjs rechaza`);
} else {
  bad('no se pudo leer la lista de fuentes de check-style-pack.mjs', '¿cambio el nombre de la constante? Sin la lista este chequeo no verifica nada.');
}

/* ── Salida ───────────────────────────────────────────────────────────── */

console.log();
if (fail) {
  for (const p of problemas) console.log(`✗ ${p.msg}\n      ${p.detail}`);
  console.log(`\n✗ ${fail} invariante(s) de documentacion rota(s)\n`);
  process.exit(1);
}
console.log('✓ la documentacion sigue alineada con el repo\n');
