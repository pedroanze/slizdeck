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
import { THREE_VERSION, THREE_IMPORTS, THREE_INTEGRITY } from './lib/three-pin.mjs';

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

// 12. <script type="module"> con import estatico de red (bloquea DOMContentLoaded y cuelga Chrome headless)
const staticNetModules = [];
for (const m of stripped.matchAll(/<script\b([^>]*\btype=["']module["'][^>]*)>([\s\S]*?)<\/script>/gi)) {
  const [, attrs, body] = m;
  const srcMatch = /\bsrc=["'](https?:\/\/[^"']+)["']/i.exec(attrs);
  if (srcMatch) staticNetModules.push(srcMatch[1]);
  const cleanBody = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?:^|\s)\/\/.*$/gm, '');
  for (const im of cleanBody.matchAll(/\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["'](https?:\/\/[^"']+)["']/g)) {
    staticNetModules.push(im[1]);
  }
}
if (staticNetModules.length) {
  bad('<script type="module"> con import estático de red (bloquea DOMContentLoaded; usar import() dinámico con importmap)', staticNetModules.join('\n      '));
}

// 13. Escenas 3D (.sz-3d): importmap fijado con SRI, poster con alt, JSON valido y sidecars
const figs3d = [...stripped.matchAll(/<figure\b([^>]*\bclass=["'][^"']*\bsz-3d\b[^"']*["'][^>]*)>([\s\S]*?)<\/figure>/gi)];
if (figs3d.length) {
  const deckDir = path.dirname(path.resolve(file));
  const mapMatch = /<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/i.exec(stripped);
  let netThree = false;
  if (!mapMatch) {
    bad('.sz-3d sin <script type="importmap"> en <head>', `ejecuta: node scripts/add-3d.mjs ${file}`);
  } else {
    let mapJson = null;
    try { mapJson = JSON.parse(mapMatch[1]); } catch (e) {
      bad('<script type="importmap"> con JSON inválido', e.message);
    }
    if (mapJson) {
      const imp = mapJson.imports || {};
      const threeUrl = imp.three;
      const addonsUrl = imp['three/addons/'];
      const isOfflineData = typeof threeUrl === 'string' && threeUrl.startsWith('data:');
      if (!threeUrl) {
        bad('importmap sin entrada "three"');
      } else if (!isOfflineData) {
        netThree = /^https?:\/\//i.test(threeUrl);
        if (threeUrl !== THREE_IMPORTS.three || addonsUrl !== THREE_IMPORTS['three/addons/']) {
          bad(
            `three.js sin versión exacta fijada o distinta del pin (${THREE_VERSION})`,
            `esperado: ${THREE_IMPORTS.three} (encontrado: ${threeUrl})`,
          );
        } else {
          ok(`importmap three@${THREE_VERSION} fijado exactamente`);
        }
        const integ = mapJson.integrity;
        if (!integ || typeof integ !== 'object') {
          bad('importmap sin bloque "integrity" (SRI requerido para three.js)');
        } else {
          const missingSri = Object.entries(THREE_INTEGRITY)
            .filter(([u, hash]) => integ[u] !== hash)
            .map(([u]) => u.split('/').pop());
          if (missingSri.length) {
            bad('importmap con hashes de integrity (SRI) ausentes o distintos del pin', missingSri.join(', '));
          } else {
            ok('importmap con hashes SRI (sha384) verificados');
          }
        }
      } else {
        ok('importmap 3D incrustado como data: URI (offline)');
      }
    }
  }

  let posterIssues = 0;
  let jsonIssues = 0;
  let sidecarIssues = 0;
  for (let i = 0; i < figs3d.length; i++) {
    const [, attrs, inner] = figs3d[i];
    const id = /\bdata-id=["']([^"']+)["']/i.exec(attrs)?.[1] || `sz-3d #${i + 1}`;
    const imgMatch = /<img\b([^>]*\bclass=["'][^"']*\bsz-3d-poster\b[^"']*["'][^>]*)>/i.exec(inner);
    if (!imgMatch) {
      posterIssues++;
      bad(`.sz-3d (${id}) sin póster <img class="sz-3d-poster">`, `ejecuta: node scripts/poster-3d.mjs ${file}`);
    } else {
      const imgAttrs = imgMatch[1];
      const src = /\bsrc=["']([^"']*)["']/i.exec(imgAttrs)?.[1]?.trim();
      const alt = /\balt=["']([^"']*)["']/i.exec(imgAttrs)?.[1]?.trim();
      if (!src) {
        posterIssues++;
        bad(`.sz-3d (${id}) con póster sin atributo src`);
      } else if (!src.startsWith('data:') && !/^https?:\/\//i.test(src) && !existsSync(path.resolve(deckDir, src))) {
        posterIssues++;
        bad(`.sz-3d (${id}) apunta a un póster que no existe: ${src}`, `ejecuta: node scripts/poster-3d.mjs ${file}`);
      }
      if (!alt) {
        posterIssues++;
        bad(`.sz-3d (${id}) con póster sin atributo alt descriptivo`);
      }
    }

    const specMatch = /<script\b[^>]*\btype=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i.exec(inner);
    if (!specMatch) {
      jsonIssues++;
      bad(`.sz-3d (${id}) sin bloque <script type="application/json">`);
    } else {
      let spec = null;
      try {
        spec = JSON.parse(specMatch[1]);
      } catch (e) {
        jsonIssues++;
        bad(`.sz-3d (${id}) con JSON inválido`, e.message);
      }
      if (spec) {
        const validModel = typeof spec.model === 'string' && spec.model.trim().length > 0;
        const validPreset = spec.preset === 'logo' || spec.preset === 'particles';
        if (!validModel && !validPreset) {
          jsonIssues++;
          bad(`.sz-3d (${id}) con JSON sin "model" ni "preset" válido ("logo"|"particles")`);
        } else if (validModel) {
          const mId = spec.model.trim();
          const escId = mId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const sidecarTag = new RegExp(`<script\\b[^>]*\\bsrc=["']([^"']*\\b${escId}\\.glb\\.js)["'][^>]*>`, 'i').exec(stripped);
          const inlinedModel = new RegExp(`__szModels\\s*(?:\\[\\s*["']${escId}["']\\s*\\]|\\.\\s*${escId})\\s*=`).test(stripped);
          if (sidecarTag) {
            const sidecarPath = path.resolve(deckDir, sidecarTag[1]);
            if (!existsSync(sidecarPath)) {
              sidecarIssues++;
              bad(`.sz-3d (${id}) sin archivo sidecar en disco: ${sidecarTag[1]}`);
            }
          } else if (!inlinedModel) {
            sidecarIssues++;
            bad(`.sz-3d (${id}) sin sidecar <script src="assets/3d/${mId}.glb.js" defer> para el modelo "${mId}"`);
          }
        }
      }
    }
  }
  if (!posterIssues) ok(`pósters .sz-3d presentes y con atributo alt (${figs3d.length}/${figs3d.length})`);
  if (!jsonIssues && !sidecarIssues) ok('configuración JSON y sidecars .sz-3d válidos');

  if (figs3d.length > 2) {
    caution(`${figs3d.length} figuras .sz-3d en el deck (recomendado: 1 o 2 por deck para cuidar memoria y GPU)`);
  }
  const special3d = [];
  for (const m of stripped.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)) {
    const [, sAttrs, sInner] = m;
    if (!/\bsz-3d\b/.test(sInner)) continue;
    const isCoverOrTrans = (/\bclass=["'][^"']*\bgrad\b/.test(sAttrs) && /<h1\b[^>]*\bclass=["'][^"']*\bcover\b/.test(sInner))
      || (/data-steps=["']1["']/.test(sAttrs) && /\bclass=["'][^"']*\bts-title\b/.test(sInner));
    if (isCoverOrTrans) {
      const lbl = /data-label=["']([^"']*)["']/.exec(sAttrs)?.[1] || 'slide';
      special3d.push(lbl);
    }
  }
  if (special3d.length) {
    caution(`.sz-3d en slide de portada o transición (${special3d.join(', ')}): recomendado solo en slides de contenido`);
  }
  if (netThree) {
    caution(`el deck 3D carga three.js desde la red (si no hay wifi se verá el póster; para presentar offline: npx slizdeck export offline ${file})`);
  }
}

console.log(`\n${fail ? `✗ ${fail} categoría(s) con fallos` : '✓ audit OK'}${warn ? ` · ${warn} aviso(s)` : ''}\n`);
process.exit(fail ? 1 : 0);
