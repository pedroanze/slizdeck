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
import { renumberHtml } from './lib/renumber.mjs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/renumber.mjs <deck.html>');
  process.exit(1);
}

if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}

const { html: outHtml, n, renamed, skipped, assetsFixed } = renumberHtml(readFileSync(file, 'utf8'));

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
