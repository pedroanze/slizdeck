#!/usr/bin/env node
/**
 * slizdeck · audit
 *
 * Corre la checklist de calidad de reference/audit.md sobre un deck ya
 * generado: contraste (delega en check-style-pack.mjs), balance de HTML,
 * reglas de voz (em-dash, puntos finales, footers numerados), estados
 * estaticos de cover/transition, y assets pendientes marcados durante la
 * fase `assets`.
 *
 * Existe porque la checklist vivia solo como una lista para que el modelo
 * la revise a ojo antes de entregar — que funciona, pero no escala y no
 * dispara nada verificable en CI ni en una segunda pasada. Los checks aqui
 * son deliberadamente los que SI se pueden verificar con una regex sobre
 * el HTML final. Desde 2.2 avisa ademas (sin fallar) de texto de mas por
 * slide, emojis y rachas de layout repetido; la jerarquia visual y si el
 * mensaje de cada slide aterriza siguen siendo criterio del modelo.
 *
 *   node scripts/audit.mjs deck.html
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slides as parseSlides } from './lib/deck-html.mjs';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/audit.mjs <deck.html>');
  process.exit(1);
}
// fileURLToPath y no .pathname: .pathname deja los espacios como %20 y en
// Windows devuelve rutas tipo /C:/... que no resuelven.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(file)) {
  console.error(`no existe el archivo: ${file}`);
  process.exit(1);
}
const html = readFileSync(file, 'utf8');

let fail = 0, warn = 0;
const ok = (label) => console.log(`  ✓ ${label}`);
const bad = (label, detail) => { fail++; console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`); };
const caution = (label, detail) => { warn++; console.log(`  ⚠ ${label}${detail ? `\n      ${detail}` : ''}`); };

console.log(`\n${file}\n`);

// 1. Contraste y clichés (delegado, ya cubre su propio pass/fail)
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/check-style-pack.mjs'), file], { stdio: 'pipe' });
  ok('contraste y paleta (check-style-pack.mjs)');
} catch (e) {
  bad('contraste y paleta (check-style-pack.mjs)', e.stdout?.toString().trim());
}

// 2. Balance de HTML (ignorando comentarios, que documentan convenciones)
const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
for (const tag of ['section', 'div']) {
  const open = (stripped.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
  const close = (stripped.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  if (open === close) ok(`balance de <${tag}> (${open}/${open})`);
  else bad(`balance de <${tag}>`, `${open} abiertos vs ${close} cerrados`);
}

// 3. Sin em-dash en contenido visible (fuera de comentarios, <script>, <style>)
// El propio template documenta su sistema de animacion con comentarios CSS
// que mencionan "<script>" como prosa (ver template.html, bloque ANIMATION
// SYSTEM). Sin despojar los comentarios /* */ primero, esa mencion literal
// rompe el emparejamiento no-goloso de <script>...</script> para el resto
// del archivo y arrastra media hoja de estilos como "contenido visible".
const noBlockComments = stripped.replace(/\/\*[\s\S]*?\*\//g, '');
const visible = noBlockComments.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
const emdash = visible.match(/—|\s--\s/g);
if (!emdash) ok('sin em-dash en el contenido');
else bad('em-dash encontrado en el contenido', `${emdash.length} ocurrencia(s)`);

// 4. Sin punto final en h1/h2/h3/.subtitle
const trailingPeriod = [];
for (const m of visible.matchAll(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/g)) {
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (/[.]\s*$/.test(text) && !/\.\.\.$/.test(text)) trailingPeriod.push(`<${m[1]}>: "${text}"`);
}
for (const m of visible.matchAll(/<[^>]+class="[^"]*\bsubtitle\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/g)) {
  const text = m[1].replace(/<[^>]+>/g, '').trim();
  if (/[.]\s*$/.test(text) && !/\.\.\.$/.test(text)) trailingPeriod.push(`.subtitle: "${text}"`);
}
if (!trailingPeriod.length) ok('sin punto final en h1/h2/h3/.subtitle');
else bad('punto final donde no debería', trailingPeriod.join('\n      '));

// 5. Footers numerados sin huecos ni duplicados
const nums = [...visible.matchAll(/<span class="num">(\d+)<\/span>/g)].map((m) => parseInt(m[1], 10));
if (!nums.length) {
  caution('no se encontraron footers con número (¿deck sin slides de contenido?)');
} else {
  const expected = nums.map((_, i) => i + 1);
  const matches = nums.length === expected.length && nums.every((n, i) => n === expected[i]);
  if (matches) ok(`footers numerados 01..${String(nums.length).padStart(2, '0')} sin huecos ni duplicados`);
  else bad('footers numerados con huecos o duplicados', `encontrados: ${nums.join(', ')}`);
}

// 6. Cover/transition estaticas: data-steps="1" no debe convivir con .reveal adentro
const staticWithReveal = [];
for (const m of stripped.matchAll(/<section[^>]*data-steps="1"[^>]*data-label="([^"]*)"[^>]*>([\s\S]*?)<\/section>/g)) {
  if (/class="[^"]*\breveal\b/.test(m[2])) staticWithReveal.push(m[1]);
}
// data-label puede ir antes o despues de data-steps; reintentar con orden invertido
for (const m of stripped.matchAll(/<section[^>]*data-label="([^"]*)"[^>]*data-steps="1"[^>]*>([\s\S]*?)<\/section>/g)) {
  if (/class="[^"]*\breveal\b/.test(m[2]) && !staticWithReveal.includes(m[1])) staticWithReveal.push(m[1]);
}
if (!staticWithReveal.length) ok('slides estáticas (data-steps="1") sin .reveal adentro');
else bad('slide marcada estática pero con .reveal adentro', staticWithReveal.join(', '));

// 7. <title> actualizado (no el placeholder del template, que es
// "Slizdeck · [DECK NAME]": cualquier corchete sin resolver delata que
// no se toco, igual que "deck title here" del H1 de ejemplo)
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim();
const looksPlaceholder = !title || /\[[^\]]*\]/.test(title) || /deck title here/i.test(title);
if (!looksPlaceholder) ok(`<title> actualizado ("${title}")`);
else bad('<title> sin actualizar o vacío', title ? `"${title}"` : '(vacío)');

// 8. Assets pendientes (informativo, no bloquea: ya se aceptaron explícitamente en la fase `assets`)
const pending = [...html.matchAll(/<!--\s*SLIZDECK-ASSET-PENDING:\s*([^-][\s\S]*?)-->/g)].map((m) => m[1].trim());
if (!pending.length) ok('sin assets pendientes marcados');
else caution(`${pending.length} asset(s) pendiente(s), aceptados explícitamente en la fase assets`, pending.join('\n      '));

// 9-11. Criterio que antes quedaba solo a ojo: texto de mas, emojis y
// layouts repetidos. Avisos, no fallos: hay slides que justifican romper
// cada regla (una cita larga, un deck que pidio emojis), pero el modelo
// tiene que ver el aviso y decidirlo, no pasarlo por alto.
const slides = parseSlides(html);

const MAX_WORDS = 45;
const wordy = slides.filter((s) => s.words > MAX_WORDS);
if (!wordy.length) ok(`texto en pantalla contenido (≤ ${MAX_WORDS} palabras por slide, sin contar footer, notas, tablas ni gráficas)`);
else caution(`${wordy.length} slide(s) con más de ${MAX_WORDS} palabras en pantalla: el discurso va a las notas (regla de voz 1)`,
  wordy.map((s) => `${s.label}: ${s.words} palabras`).join('\n      '));

const EMOJI = /\p{Extended_Pictographic}/u;
const withEmoji = slides.filter((s) => EMOJI.test(s.text));
if (!withEmoji.length) ok('sin emojis en las slides');
else caution('emojis en pantalla (regla de voz 6: usar SVG de reference/icons.md salvo pedido explícito)',
  withEmoji.map((s) => `${s.label}: ${[...s.text.matchAll(/\p{Extended_Pictographic}/gu)].map((x) => x[0]).join(' ')}`).join('\n      '));

const runs = [];
for (let i = 2; i < slides.length; i++) {
  const [a, b, c] = [slides[i - 2], slides[i - 1], slides[i]];
  if (c.sig && a.sig === b.sig && b.sig === c.sig) runs.push(`${a.label} → ${c.label}  (${c.sig})`);
}
if (!runs.length) ok('variedad de layout (ninguna racha de 3 slides seguidas con la misma estructura)');
else caution('3 o más slides seguidas con la misma estructura: variar el layout (reference/design-guidelines.md)', runs.join('\n      '));

console.log(`\n${fail ? `✗ ${fail} categoría(s) con fallos` : '✓ audit OK'}${warn ? ` · ${warn} aviso(s)` : ''}\n`);
process.exit(fail ? 1 : 0);
