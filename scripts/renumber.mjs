#!/usr/bin/env node
/**
 * slizdeck · renumber
 *
 * Recalcula data-label="NN ..." y <span class="num">NN</span> de todas las
 * slides de un deck, en el orden en que aparecen en el documento.
 *
 * Existe para la fase `add`: insertar una slide en medio de un deck a mano
 * significa renumerar cada slide siguiente una por una, lo cual es
 * exactamente el tipo de tarea mecanica donde es facil dejar un hueco o un
 * duplicado. Este script hace esa cuenta una sola vez, de forma
 * determinista, en vez de confiar en editarla a mano slide por slide.
 *
 *   node scripts/renumber.mjs deck.html
 *
 * Las slides sin numero de footer (ej. la pantalla de standby de
 * media-and-data.md, que documentadamente "no lleva numero de footer") se
 * saltan por completo: ni su data-label ni su lugar en la cuenta se tocan.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/renumber.mjs <deck.html>');
  process.exit(1);
}

let html = readFileSync(file, 'utf8');

let n = 0;
const renamed = [];
html = html.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, (section) => {
  if (!/<span class="num">\d+<\/span>/.test(section)) return section;
  n++;
  const nn = String(n).padStart(2, '0');
  const before = /data-label="(\d+)/.exec(section)?.[1];
  let updated = section.replace(/data-label="\d+(\s)/, `data-label="${nn}$1`);
  updated = updated.replace(/<span class="num">\d+<\/span>/, `<span class="num">${nn}</span>`);
  if (before && before !== nn) renamed.push(`${before} → ${nn}`);
  return updated;
});

if (!n) {
  console.error(`${file}: no se encontro ninguna slide con <span class="num">`);
  process.exit(1);
}

writeFileSync(file, html);
console.log(`✓ ${n} slides numeradas 01..${String(n).padStart(2, '0')} en ${file}`);
if (renamed.length) console.log(`  Renumeradas: ${renamed.join(', ')}`);
else console.log('  Ya estaban en orden, sin cambios de numero.');
