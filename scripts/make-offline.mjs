#!/usr/bin/env node
/**
 * slizdeck · make-offline
 *
 * Deja un deck 100% autonomo: descarga las fuentes de Google Fonts, las
 * incrusta como data: URI dentro del propio HTML, y quita el <link> de red.
 *
 *   node scripts/make-offline.mjs deck.html            # in place
 *   node scripts/make-offline.mjs deck.html salida.html
 *
 * Por que importa: presentar depende del wifi de la sala. Si el <link> a
 * fonts.googleapis.com no resuelve, la tipografia cae al fallback del
 * sistema y el deck pierde su caracter justo cuando mas se ve. Con las
 * fuentes incrustadas el archivo funciona sin red, y se puede pasar por
 * USB o mandar por correo sabiendo que se vera igual en la otra maquina.
 *
 * Coste: unos 100 KB por pareja de fuentes. El deck sigue siendo un solo
 * archivo.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function get(url, asBuffer = false) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} al pedir ${url}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.text();
}

async function main() {
  const [input, outArg] = process.argv.slice(2);
  if (!input) {
    console.error('uso: node scripts/make-offline.mjs <deck.html> [salida.html]');
    process.exit(1);
  }
  const out = outArg || input;
  let html = readFileSync(input, 'utf8');

  const linkRe = /[ \t]*<link href="(https:\/\/fonts\.googleapis\.com[^"]*)"[^>]*>\n?/;
  const link = linkRe.exec(html);
  if (!link) {
    console.log('El deck no carga fuentes de Google Fonts. Nada que incrustar.');
    return;
  }

  // El User-Agent decide el formato: con uno moderno Google sirve woff2,
  // que pesa la mitad que ttf.
  const css = await get(link[1].replace(/&amp;/g, '&'));
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  if (!urls.length) throw new Error('Google Fonts no devolvio woff2; revisa el User-Agent');

  process.stdout.write(`Descargando ${urls.length} archivos de fuente`);
  const map = new Map();
  let bytes = 0;
  for (const u of urls) {
    const buf = await get(u, true);
    bytes += buf.length;
    map.set(u, `data:font/woff2;base64,${buf.toString('base64')}`);
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  let inlined = css;
  for (const [u, data] of map) inlined = inlined.split(u).join(data);

  // El CSS incrustado sustituye al <link>, en el mismo sitio del <head>.
  html = html.replace(linkRe, `<style>\n/* Fuentes incrustadas: el deck no necesita red para verse bien. */\n${inlined}\n</style>\n`);

  writeFileSync(out, html);
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`✓ ${out}`);
  console.log(`  ${urls.length} fuentes incrustadas · ${kb(bytes)} de fuentes · archivo final ${kb(Buffer.byteLength(html))}`);

  // Solo se incrustan fuentes. Cualquier otro recurso remoto sigue necesitando
  // red, asi que no se puede prometer "presentable sin wifi" sin revisarlo.
  // Con los comentarios enmascarados: template.html trae el <script> de
  // lucide comentado como opt-in, y contarlo seria un falso positivo.
  const visible = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const remotos = [
    ...visible.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi),
    ...visible.matchAll(/<link\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi),
    ...visible.matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi),
  ].map((x) => x[1]);

  if (!remotos.length) {
    console.log('  El deck ya no depende de la red. Se puede presentar sin wifi.');
  } else {
    console.log(`  ⚠ Quedan ${remotos.length} recurso(s) remoto(s) sin incrustar — el deck TODAVIA depende de la red:`);
    for (const u of [...new Set(remotos)]) console.log(`      ${u}`);
    console.log('    Este script solo incrusta fuentes. Descargar esos recursos a local o quitarlos antes de presentar sin wifi.');
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
