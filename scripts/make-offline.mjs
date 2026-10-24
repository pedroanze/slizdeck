#!/usr/bin/env node
/**
 * slizdeck · make-offline
 *
 * Deja un deck 100% autonomo para presentar sin wifi:
 *  1. Descarga las fuentes de Google Fonts, las incrusta como data: URI
 *     dentro del propio HTML y quita el <link> de red.
 *  2. Si el deck usa .sz-3d (three.js), descarga los modulos fijados en
 *     scripts/lib/three-pin.mjs (con cache en ~/.cache/slizdeck/three@X),
 *     verifica el sha384 de cada archivo, reescribe sus imports relativos a
 *     URLs absolutas del CDN, mapea cada modulo a un data: URI en el
 *     importmap e incrusta los sidecars assets/3d/*.glb.js en linea.
 *  3. Revisa que no queden recursos remotos en <script>, <link>, <img>,
 *     importmaps ni imports de red.
 *
 *   node scripts/make-offline.mjs deck.html            # in place
 *   node scripts/make-offline.mjs deck.html salida.html
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { THREE_PIN, sha384 } from './lib/three-pin.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function get(url, asBuffer = false) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} al pedir ${url}`);
  return asBuffer ? Buffer.from(await res.arrayBuffer()) : res.text();
}

/**
 * Reescribe imports/exports relativos ('./...', '../...') dentro de un modulo
 * ES a su URL absoluta del CDN, para que sigan resolviendo a traves del
 * importmap cuando el modulo vive en un data: URI.
 */
export function rewriteRelativeImports(code, moduleUrl) {
  return code.replace(
    /(\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'])(\.\.?\/[^"']+)(["'])/g,
    (_, pre, rel, post) => `${pre}${new URL(rel, moduleUrl).href}${post}`,
  );
}

/**
 * Funcion pura: recibe el HTML del deck, el pin de three y los buffers de
 * cada archivo del pin (mas los sidecars .glb.js opcionales), verifica cada
 * sha384, reescribe imports relativos a URLs absolutas del CDN, mapea cada
 * modulo a data:text/javascript;base64,... en el importmap e incrusta los
 * sidecars .glb.js.
 */
export function inlineThreeOffline(html, { pin = THREE_PIN, filesByPath = {}, sidecarsBySrc = {}, postersBySrc = {} } = {}) {
  let next = html;
  const importMapRe = /<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i;
  const mapMatch = importMapRe.exec(next);
  let threeBytes = 0;
  let threeCount = 0;

  if (mapMatch) {
    let parsed = null;
    try { parsed = JSON.parse(mapMatch[1]); } catch {}
    const threeEntry = parsed?.imports?.three;
    if (threeEntry && !threeEntry.startsWith('data:')) {
      const dataByPath = new Map();
      const dataByUrl = new Map();
      for (const f of pin.files) {
        const raw = filesByPath[f.path];
        if (!raw) throw new Error(`falta el módulo ${f.path} para incrustar three.js offline`);
        const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'utf8');
        const actual = sha384(buf);
        if (actual !== f.integrity) {
          throw new Error(`hash sha384 inválido para ${f.path}: esperado ${f.integrity}, calculado ${actual}`);
        }
        const rewritten = rewriteRelativeImports(buf.toString('utf8'), f.url);
        const outBuf = Buffer.from(rewritten, 'utf8');
        threeBytes += outBuf.length;
        threeCount++;
        const uri = `data:text/javascript;base64,${outBuf.toString('base64')}`;
        dataByPath.set(f.path, uri);
        dataByUrl.set(f.url, uri);
      }

      const imports = {};
      const mainMod = pin.files.find((f) => f.path.endsWith('three.module.js')) || pin.files[0];
      if (mainMod) imports.three = dataByPath.get(mainMod.path);
      for (const f of pin.files) {
        if (f.path.startsWith('examples/jsm/')) {
          const sub = f.path.slice('examples/jsm/'.length);
          imports[`three/addons/${sub}`] = dataByPath.get(f.path);
        }
        imports[f.url] = dataByUrl.get(f.url);
      }
      // Escapar el host del CDN en las claves JSON para que JSON.parse y el
      // navegador vean la URL exacta, sin dejar la cadena literal cdn.jsdelivr
      // en el HTML offline.
      const serialized = JSON.stringify({ imports }).replace(/cdn\.jsdelivr\.net/g, '\\u0063dn.jsdelivr.net');
      next = next.replace(importMapRe, `<script type="importmap">${serialized}</script>`);
    }
  }

  let sidecarBytes = 0;
  let sidecarCount = 0;
  next = next.replace(/<script\b[^>]*\bsrc=["']([^"']*\.glb\.js)["'][^>]*>\s*<\/script>/gi, (full, src) => {
    const content = sidecarsBySrc[src];
    if (content == null) return full;
    const text = Buffer.isBuffer(content) ? content.toString('utf8') : String(content);
    sidecarBytes += Buffer.byteLength(text);
    sidecarCount++;
    return `<script>\n${text.trim()}\n</script>`;
  });

  let posterCount = 0;
  next = next.replace(/(<img\b[^>]*\bclass=["'][^"']*\bsz-3d-poster\b[^"']*["'][^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (full, pre, src, post) => {
    if (src.startsWith('data:')) return full;
    const content = postersBySrc[src];
    if (content == null) return full;
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    posterCount++;
    return `${pre}data:image/png;base64,${buf.toString('base64')}${post}`;
  });

  return { html: next, threeCount, threeBytes, sidecarCount, sidecarBytes, posterCount };
}

async function loadPinnedThreeFiles(pin = THREE_PIN) {
  const cacheDir = path.join(os.homedir(), '.cache', 'slizdeck', `three@${pin.version}`);
  mkdirSync(cacheDir, { recursive: true });
  const filesByPath = {};
  for (const f of pin.files) {
    const cacheFile = path.join(cacheDir, f.path.replace(/\//g, '__'));
    let buf = null;
    if (existsSync(cacheFile)) {
      const candidate = readFileSync(cacheFile);
      if (sha384(candidate) === f.integrity) buf = candidate;
    }
    if (!buf) {
      buf = await get(f.url, true);
      const actual = sha384(buf);
      if (actual !== f.integrity) {
        throw new Error(`integridad SRI falló al descargar ${f.url}: esperado ${f.integrity}, recibido ${actual}`);
      }
      writeFileSync(cacheFile, buf);
    }
    filesByPath[f.path] = buf;
  }
  return filesByPath;
}

export function findRemoteResources(html) {
  const visible = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));
  const remotos = [
    ...visible.matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi),
    ...visible.matchAll(/<link\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi),
    ...visible.matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi),
  ].map((x) => x[1]);

  for (const m of visible.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = m;
    if (/\btype=["']importmap["']/i.test(attrs)) {
      try {
        const parsed = JSON.parse(body);
        for (const v of Object.values(parsed?.imports || {})) {
          if (typeof v === 'string' && /^https?:\/\//i.test(v)) remotos.push(v);
        }
      } catch {}
      continue;
    }
    if (/\btype=["']application\/json["']/i.test(attrs)) continue;
    const clean = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?:^|\s)\/\/.*$/gm, '');
    for (const im of clean.matchAll(/\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](https?:\/\/[^"']+)["']/g)) {
      remotos.push(im[1]);
    }
    for (const dim of clean.matchAll(/\bimport\s*\(\s*["'](https?:\/\/[^"']+)["']\s*\)/g)) {
      remotos.push(dim[1]);
    }
  }
  return [...new Set(remotos)];
}

export function reportRemote(html) {
  const remotos = findRemoteResources(html);
  if (!remotos.length) {
    console.log('  El deck no depende de la red. Se puede presentar sin wifi.');
    return;
  }
  console.log(`  ⚠ Quedan ${remotos.length} recurso(s) remoto(s) sin incrustar: el deck TODAVIA depende de la red:`);
  for (const u of remotos) console.log(`      ${u}`);
  console.log('    Descargar esos recursos a local o quitarlos antes de presentar sin wifi.');
}

async function main() {
  const [input, outArg] = process.argv.slice(2);
  if (!input) {
    console.error('uso: node scripts/make-offline.mjs <deck.html> [salida.html]');
    process.exit(1);
  }
  if (!existsSync(input)) {
    console.error(`no existe el archivo: ${input}`);
    process.exit(1);
  }
  const out = outArg || input;
  let html = readFileSync(input, 'utf8');
  const deckDir = path.dirname(path.resolve(input));
  let changed = false;

  // 1. Fuentes de Google Fonts
  const linkRe = /[ \t]*<link\b[^>]*\bhref="(https:\/\/fonts\.googleapis\.com[^"]*)"[^>]*>\n?/;
  const link = linkRe.exec(html);
  let fontCount = 0;
  let fontBytes = 0;
  if (link) {
    const css = await get(link[1].replace(/&amp;/g, '&'));
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
    if (!urls.length) throw new Error('Google Fonts no devolvio woff2; revisa el User-Agent');

    process.stdout.write(`Descargando ${urls.length} archivos de fuente`);
    const map = new Map();
    for (const u of urls) {
      const buf = await get(u, true);
      fontBytes += buf.length;
      map.set(u, `data:font/woff2;base64,${buf.toString('base64')}`);
      process.stdout.write('.');
    }
    process.stdout.write('\n');
    fontCount = urls.length;

    let inlined = css;
    for (const [u, data] of map) inlined = inlined.split(u).join(data);
    html = html.replace(linkRe, `<style>\n/* Fuentes incrustadas: el deck no necesita red para verse bien. */\n${inlined}\n</style>\n`);
    changed = true;
  }

  // 2. Modulos three.js del importmap y sidecars .glb.js
  const hasRemoteThree = (() => {
    const m = /<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!m) return false;
    try {
      const p = JSON.parse(m[1]);
      return typeof p?.imports?.three === 'string' && !p.imports.three.startsWith('data:');
    } catch { return false; }
  })();
  const sidecarMatches = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']*\.glb\.js)["'][^>]*>\s*<\/script>/gi)];
  const posterMatches = [...html.matchAll(/<img\b[^>]*\bclass=["'][^"']*\bsz-3d-poster\b[^"']*["'][^>]*\bsrc=["'](?!data:)([^"']+)["']/gi)];

  let threeInfo = { threeCount: 0, threeBytes: 0, sidecarCount: 0, sidecarBytes: 0, posterCount: 0 };
  if (hasRemoteThree || sidecarMatches.length || posterMatches.length) {
    const filesByPath = hasRemoteThree ? await loadPinnedThreeFiles(THREE_PIN) : {};
    const sidecarsBySrc = {};
    for (const m of sidecarMatches) {
      const src = m[1];
      const fullPath = path.resolve(deckDir, src);
      if (existsSync(fullPath)) sidecarsBySrc[src] = readFileSync(fullPath, 'utf8');
    }
    const postersBySrc = {};
    for (const m of posterMatches) {
      const src = m[1];
      const fullPath = path.resolve(deckDir, src);
      if (existsSync(fullPath)) postersBySrc[src] = readFileSync(fullPath);
    }
    const res = inlineThreeOffline(html, { pin: THREE_PIN, filesByPath, sidecarsBySrc, postersBySrc });
    html = res.html;
    threeInfo = res;
    changed = true;
  }

  if (!changed) {
    console.log('El deck no carga fuentes de Google Fonts ni módulos 3D pendientes de incrustar.');
    if (out !== input) writeFileSync(out, html);
    reportRemote(html);
    return;
  }

  writeFileSync(out, html);
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`✓ ${out}`);
  const parts = [];
  if (fontCount) parts.push(`${fontCount} fuentes (${kb(fontBytes)})`);
  if (threeInfo.threeCount) parts.push(`${threeInfo.threeCount} módulos three.js (${kb(threeInfo.threeBytes)})`);
  if (threeInfo.sidecarCount) parts.push(`${threeInfo.sidecarCount} modelo(s) 3D (${kb(threeInfo.sidecarBytes)})`);
  parts.push(`archivo final ${kb(Buffer.byteLength(html))}`);
  console.log(`  ${parts.join(' · ')}`);

  reportRemote(html);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
