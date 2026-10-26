#!/usr/bin/env node
/**
 * slizdeck · add-3d
 *
 * Prepara un deck para usar el componente .sz-3d (reference/3d.md):
 *  1. Inserta o actualiza en <head> el <script type="importmap"> con la
 *     version e integridad (sha384) fijadas en scripts/lib/three-pin.mjs,
 *     de forma idempotente.
 *  2. Si se pasa --model <archivo.glb> [--id <id>]: valida el encabezado
 *     binario glTF 2.0 y su chunk JSON, avisa si supera los 15 MB o 100 mil
 *     triangulos, genera el sidecar clasico assets/3d/<id>.glb.js
 *     (window.__szModels[<id>] = "<base64>") para que funcione en file://
 *     sin fetch(), agrega <script src="assets/3d/<id>.glb.js" defer></script>
 *     al <head>, e imprime los nombres de los clips de animacion.
 *     Nunca imprime el base64 en la terminal.
 *
 *   node scripts/add-3d.mjs deck.html [--model personaje.glb --id astra]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THREE_VERSION, importMapScript } from './lib/three-pin.mjs';

const MAX_RECOMMENDED_BYTES = 15 * 1024 * 1024;
const MAX_RECOMMENDED_TRIANGLES = 100_000;

export function parseGlb(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 20) {
    throw new Error('no es un archivo GLB válido (tamaño insuficiente)');
  }
  const magic = buf.toString('ascii', 0, 4);
  if (magic !== 'glTF') {
    throw new Error('no es un archivo GLB válido (magic "glTF" ausente)');
  }
  const version = buf.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`versión GLB no soportada (${version}; se requiere glTF 2.0)`);
  }
  const chunkLen = buf.readUInt32LE(12);
  const chunkType = buf.toString('ascii', 16, 20);
  if (chunkType !== 'JSON' || 20 + chunkLen > buf.length) {
    throw new Error('no es un archivo GLB válido (chunk JSON corrupto o ausente)');
  }
  let json;
  try {
    json = JSON.parse(buf.toString('utf8', 20, 20 + chunkLen));
  } catch (e) {
    throw new Error(`chunk JSON del GLB inválido: ${e.message}`);
  }
  const clips = Array.isArray(json.animations)
    ? json.animations.map((a, i) => (a && typeof a.name === 'string' && a.name.trim() ? a.name.trim() : `clip_${i}`))
    : [];

  let triangles = 0;
  const accessors = Array.isArray(json.accessors) ? json.accessors : [];
  if (Array.isArray(json.meshes)) {
    for (const mesh of json.meshes) {
      for (const prim of mesh?.primitives || []) {
        const mode = prim?.mode ?? 4;
        if (mode !== 4) continue;
        const idxAcc = prim.indices != null ? accessors[prim.indices] : null;
        const posAcc = prim.attributes?.POSITION != null ? accessors[prim.attributes.POSITION] : null;
        const count = idxAcc?.count ?? posAcc?.count ?? 0;
        triangles += Math.floor(count / 3);
      }
    }
  }
  return { version, bytes: buf.length, clips, triangles, json };
}

export function upsertImportMapAndSidecar(html, { id = null, pin } = {}) {
  const mapTag = importMapScript(pin);
  const importMapRe = /<script\b[^>]*\btype=["']importmap["'][^>]*>[\s\S]*?<\/script>/i;
  let next = html;
  if (importMapRe.test(next)) {
    next = next.replace(importMapRe, mapTag);
  } else if (/<style\b/i.test(next)) {
    next = next.replace(/<style\b/i, `${mapTag}\n<style`);
  } else if (/<\/head>/i.test(next)) {
    next = next.replace(/<\/head>/i, `${mapTag}\n</head>`);
  } else {
    throw new Error('el HTML no tiene <head> donde insertar el importmap');
  }

  if (id) {
    const relSrc = `assets/3d/${id}.glb.js`;
    const esc = relSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sidecarRe = new RegExp(`<script\\b[^>]*\\bsrc=["']${esc}["'][^>]*>\\s*<\\/script>`, 'i');
    const sidecarTag = `<script src="${relSrc}" defer></script>`;
    if (!sidecarRe.test(next)) {
      next = next.replace(importMapRe, (m) => `${m}\n${sidecarTag}`);
    }
  }
  return next;
}

function parseArgs(argv) {
  let deck = null;
  let model = null;
  let id = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--model') model = argv[++i];
    else if (a.startsWith('--model=')) model = a.slice(8);
    else if (a === '--id') id = argv[++i];
    else if (a.startsWith('--id=')) id = a.slice(5);
    else if (!a.startsWith('--') && !deck) deck = a;
  }
  return { deck, model, id };
}

function main() {
  const { deck, model, id: rawId } = parseArgs(process.argv.slice(2));
  if (!deck) {
    console.error('uso: node scripts/add-3d.mjs <deck.html> [--model <archivo.glb> [--id <id>]]');
    process.exit(1);
  }
  if (!existsSync(deck)) {
    console.error(`no existe el archivo: ${deck}`);
    process.exit(1);
  }

  let modelInfo = null;
  let modelId = null;
  let sidecarRel = null;

  if (model) {
    if (!existsSync(model)) {
      console.error(`no existe el archivo de modelo: ${model}`);
      process.exit(1);
    }
    const buf = readFileSync(model);
    try {
      modelInfo = parseGlb(buf);
    } catch (e) {
      console.error(`✗ ${model}: ${e.message}`);
      process.exit(1);
    }
    modelId = (rawId || path.basename(model, path.extname(model)))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/^-+|-+$/g, '') || 'model';
    const deckDir = path.dirname(path.resolve(deck));
    const outDir = path.join(deckDir, 'assets', '3d');
    mkdirSync(outDir, { recursive: true });
    const sidecarPath = path.join(outDir, `${modelId}.glb.js`);
    sidecarRel = `assets/3d/${modelId}.glb.js`;
    const b64 = buf.toString('base64');
    const js = `window.__szModels = window.__szModels || {};\nwindow.__szModels[${JSON.stringify(modelId)}] = "${b64}";\n`;
    writeFileSync(sidecarPath, js);
  }

  const html = readFileSync(deck, 'utf8');
  let updated;
  try {
    updated = upsertImportMapAndSidecar(html, { id: modelId });
  } catch (e) {
    console.error(`✗ ${deck}: ${e.message}`);
    process.exit(1);
  }
  if (updated !== html) writeFileSync(deck, updated);

  console.log(`\n✓ ${deck} · importmap three@${THREE_VERSION} con SRI listo`);
  if (modelInfo) {
    const kb = Math.round(modelInfo.bytes / 1024);
    console.log(`  ✓ ${sidecarRel} (${kb} KB, ~${modelInfo.triangles} triángulos)`);
    console.log(`  Clips (${modelInfo.clips.length}): ${modelInfo.clips.length ? modelInfo.clips.join(', ') : '(ninguno)'}`);
    if (modelInfo.bytes > MAX_RECOMMENDED_BYTES) {
      const mb = (modelInfo.bytes / 1024 / 1024).toFixed(1);
      console.log(`  ⚠ el modelo pesa ${mb} MB (> 15 MB recomendados). Optimízalo con gltf-transform (ver reference/3d.md).`);
    }
    if (modelInfo.triangles > MAX_RECOMMENDED_TRIANGLES) {
      console.log(`  ⚠ el modelo tiene ~${modelInfo.triangles} triángulos (> 100.000 recomendados).`);
    }
  }
  console.log();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
