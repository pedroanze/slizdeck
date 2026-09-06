#!/usr/bin/env node
/**
 * slizdeck · check-versions
 *
 * Una sola version gobierna el proyecto y vive en cuatro sitios. Este
 * script exige que coincidan.
 *
 *   package.json          "version"
 *   SKILL.md              metadata.version (frontmatter)
 *   template.html         marcador slizdeck-engine-version
 *   CHANGELOG.md          primera entrada "## X.Y.Z"
 *
 * Existe porque los cuatro ya se habian desalineado en silencio
 * (package.json y SKILL.md en 1.0.0 mientras el engine y el changelog
 * iban en 1.1.0) y nada lo detectaba. Es justo el tipo de desfase que
 * rompe scripts/doctor.mjs, que compara la version embebida en un deck
 * contra la del engine para decidir que fixes le faltan.
 *
 * En el push de un tag (GITHUB_REF_NAME=vX.Y.Z) exige ademas que el tag
 * coincida: un release solo puede publicar la version que el repo declara.
 *
 *   node scripts/check-versions.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(ROOT, f), 'utf8');

const SEMVER = '([0-9]+\\.[0-9]+\\.[0-9]+)';

const sources = [
  {
    file: 'package.json',
    what: 'campo "version"',
    value: () => JSON.parse(read('package.json')).version,
  },
  {
    file: 'SKILL.md',
    what: 'metadata.version del frontmatter',
    value: () => new RegExp(`^\\s*version:\\s*["']?${SEMVER}["']?\\s*$`, 'm').exec(read('SKILL.md'))?.[1],
  },
  {
    file: 'template.html',
    what: 'marcador slizdeck-engine-version',
    value: () => new RegExp(`slizdeck-engine-version:\\s*${SEMVER}`).exec(read('template.html'))?.[1],
  },
  {
    file: 'CHANGELOG.md',
    what: 'primera entrada "## X.Y.Z"',
    value: () => new RegExp(`^## ${SEMVER}`, 'm').exec(read('CHANGELOG.md'))?.[1],
  },
];

const found = sources.map((s) => {
  let value = null;
  let error = null;
  try { value = s.value(); } catch (e) { error = e.message; }
  return { ...s, value, error };
});

console.log('\nVersiones declaradas:\n');
for (const f of found) {
  console.log(`  ${f.value ?? '(no encontrada)'}  ${f.file} — ${f.what}${f.error ? ` [${f.error}]` : ''}`);
}

const missing = found.filter((f) => !f.value);
const values = [...new Set(found.filter((f) => f.value).map((f) => f.value))];

let fail = false;

if (missing.length) {
  fail = true;
  console.log(`\n✗ no se pudo leer la version en ${missing.length} sitio(s): ${missing.map((m) => m.file).join(', ')}`);
}

if (values.length > 1) {
  fail = true;
  console.log(`\n✗ las versiones no coinciden: ${values.join(' vs ')}`);
  console.log('  Al subir version hay que tocar los cuatro sitios de arriba, no solo el CHANGELOG.');
} else if (!missing.length) {
  console.log(`\n✓ los cuatro sitios coinciden en ${values[0]}`);
}

// En un push de tag, el tag manda: no publicar vX.Y.Z desde un repo que dice otra cosa.
const ref = process.env.GITHUB_REF_NAME || '';
if (/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(ref)) {
  const tagVersion = ref.slice(1);
  if (values.length === 1 && tagVersion === values[0]) {
    console.log(`✓ el tag ${ref} coincide con la version declarada`);
  } else {
    fail = true;
    console.log(`\n✗ el tag ${ref} no coincide con la version declarada (${values.join(', ') || 'ninguna'})`);
  }
}

console.log();
process.exit(fail ? 1 : 0);
