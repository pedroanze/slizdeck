#!/usr/bin/env node
/**
 * slizdeck · check-style-pack
 *
 * Valida un style pack contra las reglas duras que impeccable define para
 * una paleta (ver ~/.claude/skills/impeccable/scripts/palette.mjs) y contra
 * WCAG. Sirve tanto para los packs que trae slizdeck como para uno que el
 * usuario arme con los colores de su marca.
 *
 *   node scripts/check-style-pack.mjs styles/terminal.md
 *   node scripts/check-style-pack.mjs deck.html      # valida un deck ya generado
 *
 * Reglas verificadas:
 *   ink  vs bg  >= 7.0  (texto de cuerpo legible)
 *   muted vs bg >= 3.5  (texto secundario legible)
 *   title vs bg >= 7.0
 *   primary vs bg >= 3.0  (usado en eyebrows y numeros, texto grande)
 *   accent vs bg >= 3.0
 *   primary vs accent >= 1.7 (deben ser distinguibles entre si)
 * Y avisa de las zonas atractoras de IA que impeccable nombra.
 */

import { readFileSync } from 'node:fs';

const hex2rgb = (h) => {
  h = h.replace('#', '').trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const relLum = (hex) => {
  const [r, g, b] = hex2rgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
/* Saturacion y matiz aproximados (HSL) para detectar zonas atractoras. */
const hsl = (hex) => {
  const [r, g, b] = hex2rgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s, l };
};

function readTokens(text) {
  const t = {};
  for (const m of text.matchAll(/--cs-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    t[m[1]] = m[2].trim();
  }
  return t;
}
const asHex = (v = '') => (/#([0-9a-f]{6}|[0-9a-f]{3})\b/i.exec(v) || [])[0] || null;

const CHECKS = [
  ['ink de cuerpo vs fondo',  'body',    'cream', 7.0],
  ['titulo vs fondo',         'black',   'cream', 7.0],
  ['texto atenuado vs fondo', 'muted',   'cream', 3.5],
  ['primario vs fondo',       'primary', 'cream', 3.0],
  ['acento vs fondo',         'accent',  'cream', 3.0],
  ['ink de cuerpo vs card',   'body',    'surface', 7.0],
];

function main() {
  const file = process.argv[2];
  if (!file) { console.error('uso: node scripts/check-style-pack.mjs <pack.md|deck.html>'); process.exit(1); }
  const t = readTokens(readFileSync(file, 'utf8'));
  const required = ['primary', 'accent', 'cream', 'body'];
  const missing = required.filter((k) => !asHex(t[k]));
  if (missing.length) {
    console.error(`No es un style pack valido: faltan --cs-${missing.join(', --cs-')} en ${file}`);
    process.exit(1);
  }

  let fail = 0, warn = 0;
  console.log(`\n${file}\n`);

  // Un pack puede declarar que su acento vive sobre el primario (campo de
  // color) y no sobre el fondo. Ej.: un lima que solo aparece sobre cobalto.
  const accentOn = (t['accent-on'] || 'cream').replace(/;$/, '').trim();

  for (const [label, fg, bgRole, min] of CHECKS) {
    const bg = fg === 'accent' ? accentOn : bgRole;
    const a = asHex(t[fg]), b = asHex(t[bg]);
    if (!a || !b) { console.log(`  ? ${label}: falta token (${fg}/${bg})`); continue; }
    const c = contrast(a, b);
    const ok = c >= min;
    if (!ok) fail++;
    const shown = fg === 'accent' && accentOn !== 'cream' ? `acento vs ${accentOn}` : label;
    console.log(`  ${ok ? '✓' : '✗'} ${shown.padEnd(24)} ${c.toFixed(2)}:1  (min ${min})`);
    // Un acento declarado sobre el primario no esta validado contra el fondo
    // de las slides: usarlo ahi como color de texto puede quedar ilegible.
    if (fg === 'accent' && accentOn !== 'cream') {
      const sobreFondo = asHex(t.cream) && contrast(a, asHex(t.cream));
      if (sobreFondo && sobreFondo < 3) {
        console.log(`      (--cs-accent-on: ${accentOn}) sobre el fondo de las slides daria ${sobreFondo.toFixed(2)}:1 —`);
        console.log('      este acento es para elementos sobre el primario, no para texto sobre el fondo claro.');
      }
    }
  }

  const p = asHex(t.primary), acc = asHex(t.accent);
  if (p && acc) {
    const c = contrast(p, acc);
    const ok = c >= 1.7;
    if (!ok) fail++;
    console.log(`  ${ok ? '✓' : '✗'} ${'primario vs acento'.padEnd(24)} ${c.toFixed(2)}:1  (min 1.7)`);
  }

  // Zonas atractoras que impeccable nombra explicitamente
  const bg = asHex(t.cream);
  if (p && bg) {
    const P = hsl(p), B = hsl(bg);
    const bgTinted = B.s > 0.06 && B.l > 0.85;
    const warmCream = bgTinted && B.h >= 20 && B.h <= 70;
    if (warmCream && P.h >= 80 && P.h <= 170) {
      console.log('\n  ⚠ zona atractora de IA: verde sobre crema (forest-green-on-cream)'); warn++;
    }
    if (warmCream && P.h >= 15 && P.h <= 45 && P.s < 0.5) {
      console.log('\n  ⚠ zona atractora de IA: crema calido + primario marron apagado (claude-beige)'); warn++;
    }
    if (B.l > 0.9 && B.s < 0.06 && P.h >= 260 && P.h <= 310) {
      console.log('\n  ⚠ zona atractora de IA: purpura sobre blanco (AI-purple-on-white)'); warn++;
    }
    if (warmCream) {
      console.log('  ⚠ fondo crema/tintado: impeccable recomienda blanco puro o negro puro salvo que el mood sea explicitamente ambiental'); warn++;
    }
  }

  // Fuentes que impeccable marca como training-data defaults
  const STOPPED_LOOKING = /fraunces|playfair|cormorant|lora|crimson|newsreader|syne|space grotesk|space mono|ibm plex|inter|dm sans|dm serif|outfit|plus jakarta|instrument sans|geist|roboto/i;
  for (const key of ['font-heading', 'font-sans', 'font-mono']) {
    const v = t[key];
    if (v && STOPPED_LOOKING.test(v)) {
      const hit = STOPPED_LOOKING.exec(v)[0];
      console.log(`\n  ⚠ --cs-${key}: "${hit}" esta en la lista de training-data defaults de impeccable`); warn++;
    }
  }

  console.log(`\n${fail ? `✗ ${fail} regla(s) de contraste incumplidas` : '✓ contraste OK'}${warn ? ` · ${warn} aviso(s)` : ''}\n`);
  process.exit(fail ? 1 : 0);
}
main();
