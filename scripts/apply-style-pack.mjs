#!/usr/bin/env node
/**
 * slizdeck · apply-style-pack
 *
 * Aplica un style pack a un deck (o al propio template) de forma segura:
 * **fusiona** los tokens del pack sobre los del deck en vez de reemplazar el
 * bloque :root completo, y sustituye el <link> de Google Fonts.
 *
 *   node scripts/apply-style-pack.mjs styles/terminal.md deck.html
 *   node scripts/apply-style-pack.mjs styles/terminal.md template.html nuevo.html
 *   node scripts/apply-style-pack.mjs styles/terminal.md deck.html --font=mono-tech
 *
 * Por que un script y no "copia el bloque :root": un pack solo declara los
 * tokens que le son propios (color y tipografia). Los que no declara
 * —padding, radios, sombras, easing— tienen que sobrevivir. Reemplazar el
 * bloque entero los borra y el deck pierde el padding sin ningun error
 * visible hasta que se renderiza.
 *
 * --font=<id> aplica una de las alternativas tipograficas del pack (seccion
 * "Alternativas tipograficas", bloques `### Alt: <id> — <label>`) en vez de
 * la tipografia por defecto. Sin el flag se usa siempre el default del pack.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const readPack = (file) => {
  const md = readFileSync(file, 'utf8');
  const css = /```css\s*\n:root\s*\{([\s\S]*?)\}\s*\n```/.exec(md);
  if (!css) throw new Error(`${file}: no se encontro un bloque \`\`\`css con :root { }`);
  const tokens = new Map();
  for (const m of css[1].matchAll(/(--cs-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(m[1], m[2].trim());
  }
  const fonts = /\*\*Google Fonts:\*\*\s*\n```\s*\n(https:\/\/fonts\.googleapis\.com[^\n]+)\n```/.exec(md);
  const name = (/^#\s+(.+)$/m.exec(md) || [, file])[1].trim();

  const fontAlts = new Map();
  for (const m of md.matchAll(/^### Alt: ([a-z0-9-]+) — (.+)\n([^\n]+)\n```css\n([\s\S]*?)```\n```\n(https:\/\/fonts\.googleapis\.com[^\n]+)\n```/gm)) {
    const [, id, label, note, cssBlock] = m;
    const altTokens = new Map();
    for (const t of cssBlock.matchAll(/(--cs-[a-z0-9-]+)\s*:\s*([^;]+);/g)) altTokens.set(t[1], t[2].trim());
    fontAlts.set(id, { label, note: note.trim(), tokens: altTokens, fontsUrl: m[5].trim() });
  }

  return { name, tokens, fontsUrl: fonts?.[1]?.trim() ?? null, fontAlts };
};

function main() {
  const args = process.argv.slice(2);
  const fontFlag = args.find((a) => a.startsWith('--font='));
  const [packFile, deckFile, outArg] = args.filter((a) => !a.startsWith('--font='));
  if (!packFile || !deckFile) {
    console.error('uso: node scripts/apply-style-pack.mjs <pack.md> <deck.html> [salida.html] [--font=<id>]');
    process.exit(1);
  }
  const out = outArg || deckFile;
  const pack = readPack(packFile);

  if (fontFlag) {
    const id = fontFlag.slice('--font='.length);
    const alt = pack.fontAlts.get(id);
    if (!alt) {
      const ids = [...pack.fontAlts.keys()];
      console.error(`${packFile}: no tiene la alternativa tipografica "${id}".${ids.length ? ` Disponibles: ${ids.join(', ')}` : ' Este pack no declara alternativas.'}`);
      process.exit(1);
    }
    for (const [name, value] of alt.tokens) pack.tokens.set(name, value);
    pack.fontsUrl = alt.fontsUrl;
    console.log(`  Tipografia: ${alt.label} (${id}) en vez del default`);
  }

  let deck = readFileSync(deckFile, 'utf8');

  const rootRe = /(:root\s*\{)([\s\S]*?)(\n\s*\})/;
  const root = rootRe.exec(deck);
  if (!root) { console.error(`${deckFile}: no tiene bloque :root`); process.exit(1); }

  let body = root[2];
  const applied = [], added = [];
  for (const [name, value] of pack.tokens) {
    const declRe = new RegExp(`(${name}\\s*:\\s*)([^;]+)(;)`);
    if (declRe.test(body)) {
      body = body.replace(declRe, `$1${value}$3`);
      applied.push(name);
    } else {
      // Token que el deck no tenia (ej. --cs-accent-on): se anade al final.
      body += `\n    ${name}: ${value};`;
      added.push(name);
    }
  }
  deck = deck.replace(rootRe, `$1${body}$3`);

  let fontsSwapped = false;
  if (pack.fontsUrl) {
    const linkRe = /<link href="https:\/\/fonts\.googleapis\.com[^"]*" rel="stylesheet">/;
    if (linkRe.test(deck)) {
      deck = deck.replace(linkRe, `<link href="${pack.fontsUrl}" rel="stylesheet">`);
      fontsSwapped = true;
    }
  }

  writeFileSync(out, deck);
  console.log(`✓ ${pack.name} aplicado a ${out}`);
  console.log(`  ${applied.length} tokens sustituidos${added.length ? `, ${added.length} anadidos (${added.join(', ')})` : ''}`);
  console.log(`  Google Fonts: ${fontsSwapped ? 'sustituido' : pack.fontsUrl ? 'NO se encontro el <link> a sustituir' : 'el pack no declara ninguno'}`);
  const untouched = ['--cs-pad-x', '--cs-radius-lg', '--cs-shadow-2', '--cs-ease-std']
    .filter((t) => deck.includes(t));
  console.log(`  Tokens estructurales preservados: ${untouched.length}/4`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
