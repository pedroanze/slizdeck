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
 * "Sin numero" significa sin <span class="num"> o con el span vacio — un
 * provisional no numerico (`0X`, `NN`, `??`) SI se renumera, porque add.md
 * promete explicitamente que se puede insertar con "cualquier data-label o
 * <span class="num"> provisional". Antes se exigia \d+ ahi, y una slide con
 * provisional `0X` se saltaba en silencio dejando un hueco en la numeracion.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/renumber.mjs <deck.html>');
  process.exit(1);
}

if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}

const html = readFileSync(file, 'utf8');

// Los comentarios HTML se enmascaran con espacios (misma longitud, asi que
// los indices siguen valiendo sobre el original) antes de buscar nada. Un
// deck puede traer una <section> de ejemplo comentada — el template la trae —
// y sin enmascarar, su data-label o su </section> desbalancean la cuenta o
// se renumeran en su lugar los de una slide real.
const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));

let n = 0;
const renamed = [];
let skipped = 0;
let assetsFixed = 0;
const edits = [];   // { start, end, text } sobre indices del original

for (const sec of masked.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)) {
  const body = sec[0];
  const base = sec.index;

  const num = /<span class="num">([^<]*)<\/span>/.exec(body);
  if (!num || !num[1].trim()) {
    if (/^<section\b[^>]*data-label=/.test(body)) skipped++;
    continue;
  }
  n++;
  const nn = String(n).padStart(2, '0');
  const beforeNum = num[1].trim();

  // data-label solo en el tag de apertura de esta section, nunca en su interior.
  const open = /^<section\b[^>]*>/.exec(body)[0];
  const label = /data-label="([^"\s]+)(\s)/.exec(open);
  let beforeLabel;
  if (label) {
    beforeLabel = label[1];
    edits.push({ start: base + label.index, end: base + label.index + label[0].length, text: `data-label="${nn}${label[2]}` });
  }

  edits.push({ start: base + num.index, end: base + num.index + num[0].length, text: `<span class="num">${nn}</span>` });

  // Los marcadores de la fase assets llevan el numero de slide en el texto
  // ("SLIZDECK-ASSET-PENDING: slide 04 - foto del equipo"). Si no se
  // actualizan, despues de insertar una slide apuntan a la equivocada y
  // audit.mjs reporta un pendiente sobre una slide que no es. Se busca en
  // el HTML original, no en el enmascarado: aca el comentario si importa.
  const original = html.slice(base, base + body.length);
  const pend = /(SLIZDECK-ASSET-PENDING:\s*slide\s+)(\d+)/i.exec(original);
  if (pend && pend[2] !== nn) {
    edits.push({
      start: base + pend.index,
      end: base + pend.index + pend[0].length,
      text: `${pend[1]}${nn}`,
    });
    assetsFixed++;
  }

  if (beforeLabel !== nn || beforeNum !== nn) {
    renamed.push(`${beforeNum}${beforeLabel && beforeLabel !== beforeNum ? ` (label ${beforeLabel})` : ''} → ${nn}`);
  }
}

let outHtml = html;
for (const e of edits.sort((a, b) => b.start - a.start)) {
  outHtml = outHtml.slice(0, e.start) + e.text + outHtml.slice(e.end);
}

if (!n) {
  console.error(`${file}: no se encontro ninguna slide con <span class="num">`);
  process.exit(1);
}

writeFileSync(file, outHtml);
console.log(`✓ ${n} slides numeradas 01..${String(n).padStart(2, '0')} en ${file}`);
if (renamed.length) console.log(`  Renumeradas: ${renamed.join(', ')}`);
else console.log('  Ya estaban en orden, sin cambios de numero.');
if (assetsFixed) {
  console.log(`  ${assetsFixed} marcador(es) SLIZDECK-ASSET-PENDING reapuntado(s) a su slide.`);
}
if (skipped) {
  console.log(`  ${skipped} slide(s) saltada(s) por no llevar <span class="num"> (esperado en la pantalla de standby).`);
}
