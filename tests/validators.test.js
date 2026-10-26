/**
 * slizdeck · tests de los validadores
 *
 * Prueba que los scripts que juzgan un deck distingan de verdad un deck
 * bueno de uno roto. Un validador que siempre dice ✓ es peor que no tener
 * validador: da una confianza que no gano.
 *
 * Cada test parte de examples/pitch-showcase.html (que pasa limpio) y le
 * introduce UN defecto concreto, para comprobar que el script lo detecta y
 * sale con codigo distinto de 0. Sin fixtures propios que mantener al dia:
 * el deck de referencia ya vive en el repo y se valida en CI.
 *
 * Solo node:test y node:assert, sin dependencias. Los validadores que
 * necesitan Chrome (reveal, overflow, contrast, shoot) no se cubren aca:
 * ya corren en CI sobre los ejemplos.
 *
 *   npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { THREE_PIN, sha384 } from '../scripts/lib/three-pin.mjs';
import { inlineThreeOffline, findRemoteResources } from '../scripts/make-offline.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOWCASE = path.join(ROOT, 'examples', 'pitch-showcase.html');
const SHOWCASE_3D = path.join(ROOT, 'examples', '3d', '3d-showcase.html');

/** Corre un script de la skill y devuelve {code, out}. Nunca lanza. */
function run(script, args = []) {
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
      stdio: 'pipe', timeout: 60000, cwd: ROOT,
    }).toString();
    return { code: 0, out };
  } catch (e) {
    return {
      code: e.status ?? 1,
      out: (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : ''),
    };
  }
}

/** Copia el showcase a un temporal, le aplica `mutate`, y lo entrega. */
function deckWith(mutate) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-test-'));
  const file = path.join(dir, 'deck.html');
  writeFileSync(file, mutate(readFileSync(SHOWCASE, 'utf8')));
  return { file, dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Copia el showcase 3D junto con sus assets/3d/ a un temporal y aplica `mutate`. */
function deck3dWith(mutate) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-test-3d-'));
  cpSync(path.join(ROOT, 'examples', '3d', 'assets'), path.join(dir, 'assets'), { recursive: true });
  const file = path.join(dir, '3d-showcase.html');
  writeFileSync(file, mutate(readFileSync(SHOWCASE_3D, 'utf8')));
  return { file, dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Un caso: el deck mutado debe fallar, y el mensaje debe nombrar el problema. */
function detecta(nombre, script, mutate, esperado) {
  test(nombre, () => {
    const { file, cleanup } = deckWith(mutate);
    try {
      const { code, out } = run(script, [file]);
      assert.notEqual(code, 0, `${script} deberia fallar sobre este deck, pero salio con 0:\n${out}`);
      assert.match(out, esperado, `el mensaje no explica el problema:\n${out}`);
    } finally { cleanup(); }
  });
}

/** Un caso sobre el showcase 3D (con sus assets relativos copiados). */
function detecta3d(nombre, script, mutate, esperado) {
  test(nombre, () => {
    const { file, cleanup } = deck3dWith(mutate);
    try {
      const { code, out } = run(script, [file]);
      assert.notEqual(code, 0, `${script} deberia fallar sobre este deck 3D, pero salio con 0:\n${out}`);
      assert.match(out, esperado, `el mensaje no explica el problema:\n${out}`);
    } finally { cleanup(); }
  });
}

/** Un aviso: el deck sigue pasando (exit 0) pero audit tiene que decirlo. */
function avisa(nombre, mutate, esperado) {
  test(nombre, () => {
    const { file, cleanup } = deckWith(mutate);
    try {
      const { code, out } = run('audit.mjs', [file]);
      assert.equal(code, 0, `un aviso no deberia hacer fallar audit:\n${out}`);
      assert.match(out, esperado, `audit no aviso:\n${out}`);
    } finally { cleanup(); }
  });
}

/* ── El caso base: sin defectos, todo pasa ──────────────────────────── */

test('audit.mjs aprueba el deck de referencia', () => {
  const { code, out } = run('audit.mjs', [SHOWCASE]);
  assert.equal(code, 0, `el showcase deberia pasar limpio:\n${out}`);
  assert.match(out, /audit OK/);
});

test('check-versions.mjs pasa con el repo tal como esta', () => {
  const { code, out } = run('check-versions.mjs');
  assert.equal(code, 0, `las versiones estan desalineadas:\n${out}`);
});

/* ── Defectos que audit.mjs tiene que atrapar ───────────────────────── */

detecta('audit.mjs detecta un em-dash en el contenido', 'audit.mjs',
  (h) => h.replace(/(<h2 class="title[^"]*"[^>]*>)([^<]+)(<\/h2>)/, '$1$2 — con em-dash$3'),
  /em-dash/i);

detecta('audit.mjs detecta un punto final en un titulo', 'audit.mjs',
  (h) => h.replace(/(<h2 class="title[^"]*"[^>]*>)([^<.]+)(<\/h2>)/, '$1$2.$3'),
  /punto final/i);

detecta('audit.mjs detecta un hueco en la numeracion de footers', 'audit.mjs',
  (h) => h.replace('<span class="num">03</span>', '<span class="num">09</span>'),
  /hueco|duplicad/i);

detecta('audit.mjs detecta HTML desbalanceado', 'audit.mjs',
  (h) => h.replace('</section>', '<div></section>'),
  /balance/i);

detecta('audit.mjs detecta el <title> sin personalizar', 'audit.mjs',
  (h) => h.replace(/<title>[^<]*<\/title>/, '<title>Slizdeck · [DECK NAME]</title>'),
  /title/i);

/* ── Negativos: lo que NO debe pasar por deck ───────────────────────── */

test('export-pptx.mjs rechaza un HTML que no es un deck', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-test-'));
  const file = path.join(dir, 'nope.html');
  writeFileSync(file, '<!doctype html><html><body><p>no soy un deck</p></body></html>');
  try {
    const { code, out } = run('export-pptx.mjs', [file, path.join(dir, 'o.pptx')]);
    assert.notEqual(code, 0);
    assert.match(out, /deck/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const script of ['audit.mjs', 'doctor.mjs', 'export-pptx.mjs', 'export-pdf.mjs', 'check-contrast.mjs', 'check-reveal.mjs', 'check-overflow.mjs', 'check-style-pack.mjs', 'renumber.mjs', 'make-offline.mjs', 'shoot.mjs', 'score-deck.mjs', 'add-3d.mjs', 'poster-3d.mjs', 'check-3d.mjs']) {
  test(`${script} da un error legible si el archivo no existe`, () => {
    const { code, out } = run(script, ['/tmp/no-existe-jamas-slizdeck.html']);
    assert.notEqual(code, 0, `${script} deberia fallar con un archivo inexistente`);
    assert.doesNotMatch(out, /at .*\(.*:\d+:\d+\)/,
      `${script} escupe un stack trace de Node en vez de un mensaje:\n${out}`);
  });
}

/* ── renumber.mjs: el bug que motivo el fix de 1.2.0 ────────────────── */

test('renumber.mjs no toca un deck que ya esta en orden', () => {
  const { file, cleanup } = deckWith((h) => h);
  try {
    const antes = readFileSync(file, 'utf8');
    const { code } = run('renumber.mjs', [file]);
    assert.equal(code, 0);
    assert.equal(readFileSync(file, 'utf8'), antes, 'renumber modifico un deck ya ordenado');
  } finally { cleanup(); }
});

test('renumber.mjs renumera una slide con provisional no numerico', () => {
  // add.md promete que se puede insertar con "cualquier provisional".
  const { file, cleanup } = deckWith((h) =>
    h.replace('<span class="num">04</span>', '<span class="num">0X</span>'));
  try {
    const { code, out } = run('renumber.mjs', [file]);
    assert.equal(code, 0, out);
    const despues = readFileSync(file, 'utf8');
    assert.ok(!despues.includes('0X'), 'el provisional 0X sobrevivio al renumber');
    assert.match(out, /0X.*→ 04/, `renumber no reporto el cambio:\n${out}`);
    const { code: auditCode } = run('audit.mjs', [file]);
    assert.equal(auditCode, 0, 'el deck renumerado ya no pasa audit');
  } finally { cleanup(); }
});

/* ── El canario de documentacion ────────────────────────────────────── */

test('check-docs.mjs pasa con el repo tal como esta', () => {
  const { code, out } = run('check-docs.mjs');
  assert.equal(code, 0, `la documentacion driftó:\n${out}`);
});

test('make-offline no cuenta como remoto un <script> comentado', () => {
  // Un <script src="https://..."> dentro de un comentario HTML no se ejecuta:
  // contarlo haria que el deck reportase una dependencia de red que no tiene.
  const { file, cleanup } = deckWith((h) =>
    h.replace('</head>', '<!-- <script src="https://cdn.example.com/no-se-carga.js"></script> -->\n</head>'));
  try {
    const { code, out } = run('make-offline.mjs', [file]);
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /TODAVIA depende de la red/,
      `falso positivo: conto un recurso que esta dentro de un comentario\n${out}`);
  } finally { cleanup(); }
});

/* ── check-versions.mjs: el gate que evita publicar desalineado ─────── */

test('check-versions.mjs falla si el tag no coincide con la version', () => {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'check-versions.mjs')], {
      stdio: 'pipe', cwd: ROOT, env: { ...process.env, GITHUB_REF_NAME: 'v0.0.1' },
    });
    assert.fail('deberia haber fallado con un tag que no coincide');
  } catch (e) {
    assert.equal(e.status, 1);
    assert.match(e.stdout.toString(), /no coincide/i);
  }
});

/* ── Avisos de criterio (2.2): no fallan, pero se tienen que ver ───────── */

avisa('audit.mjs avisa de una slide con demasiado texto',
  (h) => h.replace(/(<h2 class="title[^"]*"[^>]*>[^<]+<\/h2>)/, '$1<p>' + 'palabra '.repeat(60) + '</p>'),
  /⚠ \d+ slide\(s\) con más de 45 palabras/);

avisa('audit.mjs avisa de emojis en pantalla',
  (h) => h.replace(/(<h2 class="title[^"]*"[^>]*>)([^<]+)(<\/h2>)/, '$1$2 🚀$3'),
  /⚠ emojis en pantalla/);

test('audit.mjs no cuenta las notas del presentador como texto en pantalla', () => {
  // 80 palabras de notas en la cover: si contaran, la cover apareceria en
  // la lista de slides con demasiado texto.
  const { file, cleanup } = deckWith((h) => h.replace('</section>', '<aside class="notes"><p>' + 'palabra '.repeat(80) + '</p></aside></section>'));
  try {
    const { code, out } = run('audit.mjs', [file]);
    assert.equal(code, 0, out);
    assert.doesNotMatch(out, /01 Cover: \d+ palabras/, out);
  } finally { cleanup(); }
});

detecta('check-style-pack.mjs detecta un acento ilegible como resaltado sobre el fondo', 'check-style-pack.mjs',
  // Un lima sobre blanco (1.3:1): valido sobre el primario, no para resaltar
  // la cifra de una grafica sobre el fondo claro.
  (h) => h.replace(/--cs-accent:\s*#[0-9A-Fa-f]{6};/, '--cs-accent: #C8F135; --cs-accent-on: primary;'),
  /acento resaltado vs fondo/);

test('apply-style-pack.mjs: pasar de un pack a otro deja el deck igual que aplicar el segundo de entrada', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-test-'));
  const tokens = (f) => [...readFileSync(f, 'utf8').matchAll(/(--cs-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
    .map((m) => `${m[1]}:${m[2].trim()}`).sort().join('\n');
  try {
    const via = path.join(dir, 'via.html'), direct = path.join(dir, 'direct.html');
    for (const [pack, from, to] of [['committed', SHOWCASE, via], ['terminal', via, via], ['terminal', SHOWCASE, direct]]) {
      const r = run('apply-style-pack.mjs', [path.join(ROOT, 'styles', `${pack}.md`), from, to]);
      assert.equal(r.code, 0, r.out);
    }
    assert.equal(tokens(via), tokens(direct), 'committed → terminal dejo tokens de committed');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ── Escenas 3D (.sz-3d · 2.4.0) ────────────────────────────────────── */

test('audit.mjs aprueba el showcase 3D de referencia', () => {
  const { code, out } = run('audit.mjs', [SHOWCASE_3D]);
  assert.equal(code, 0, `el showcase 3D deberia pasar limpio:\n${out}`);
  assert.match(out, /audit OK/);
});

detecta3d('audit.mjs detecta una figura .sz-3d sin poster', 'audit.mjs',
  (h) => h.replace(/<img\b[^>]*\bsz-3d-poster\b[^>]*>/, ''),
  /póster/i);

detecta3d('audit.mjs detecta un poster .sz-3d sin atributo alt', 'audit.mjs',
  (h) => h.replace(/(<img\b[^>]*\bsz-3d-poster\b[^>]*?)\s+alt="[^"]*"/, '$1'),
  /alt/i);

detecta3d('audit.mjs detecta un importmap 3D sin bloque integrity (SRI)', 'audit.mjs',
  (h) => h.replace(/,"integrity":\{[^}]+\}/, ''),
  /integrity|SRI/i);

detecta3d('audit.mjs detecta una version de three sin fijar o distinta del pin', 'audit.mjs',
  (h) => h.replace(/three@0\.186\.1/g, 'three@latest'),
  /versión|fijada|0\.186\.1/i);

detecta3d('audit.mjs detecta JSON invalido dentro de .sz-3d', 'audit.mjs',
  (h) => h.replace('{"model":"robot"', '{model: roto'),
  /JSON inválido/i);

detecta3d('audit.mjs detecta un sidecar .glb.js ausente', 'audit.mjs',
  (h) => h.replace('"model":"robot"', '"model":"fantasma"'),
  /sidecar|fantasma\.glb\.js/i);

detecta3d('audit.mjs bloquea un <script type="module"> con import estatico de red', 'audit.mjs',
  (h) => h.replace('</body>', '<script type="module">import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";</script></body>'),
  /módulo estático|DOMContentLoaded/i);

/** Construye un GLB 2.0 minimo valido con los nombres de clips indicados. */
function makeMinimalGlb(clipNames = ['Idle', 'Wave']) {
  const jsonObj = {
    asset: { version: '2.0' },
    scenes: [{ nodes: [] }],
    animations: clipNames.map((name) => ({ name, channels: [], samplers: [] })),
  };
  let jsonStr = JSON.stringify(jsonObj);
  while (Buffer.byteLength(jsonStr, 'utf8') % 4 !== 0) jsonStr += ' ';
  const jsonBuf = Buffer.from(jsonStr, 'utf8');
  const totalLen = 12 + 8 + jsonBuf.length;
  const out = Buffer.alloc(totalLen);
  out.writeUInt32LE(0x46546C67, 0); // 'glTF'
  out.writeUInt32LE(2, 4);          // version 2
  out.writeUInt32LE(totalLen, 8);
  out.writeUInt32LE(jsonBuf.length, 12);
  out.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
  jsonBuf.copy(out, 20);
  return out;
}

test('add-3d.mjs es idempotente y consistente con scripts/lib/three-pin.mjs', () => {
  const { file, cleanup } = deckWith((h) => h);
  try {
    const r1 = run('add-3d.mjs', [file]);
    assert.equal(r1.code, 0, r1.out);
    const html1 = readFileSync(file, 'utf8');

    const r2 = run('add-3d.mjs', [file]);
    assert.equal(r2.code, 0, r2.out);
    const html2 = readFileSync(file, 'utf8');
    assert.equal(html1, html2, 'add-3d.mjs no fue idempotente al correrlo por segunda vez');

    const mapMatches = [...html2.matchAll(/<script\b[^>]*\btype=["']importmap["'][^>]*>([\s\S]*?)<\/script>/gi)];
    assert.equal(mapMatches.length, 1, 'deberia haber exactamente un <script type="importmap">');
    const parsed = JSON.parse(mapMatches[0][1]);
    assert.equal(parsed.imports.three, THREE_PIN.imports.three);
    assert.equal(parsed.imports['three/addons/'], THREE_PIN.imports['three/addons/']);
    for (const f of THREE_PIN.files) {
      assert.equal(parsed.integrity[f.url], f.integrity, `hash SRI desalineado para ${f.path}`);
    }
  } finally { cleanup(); }
});

test('add-3d.mjs rechaza un archivo que no es un GLB valido', () => {
  const { file, dir, cleanup } = deckWith((h) => h);
  try {
    const badGlb = path.join(dir, 'falso.glb');
    writeFileSync(badGlb, 'esto no es un archivo glTF binario');
    const { code, out } = run('add-3d.mjs', [file, '--model', badGlb, '--id', 'falso']);
    assert.notEqual(code, 0, 'add-3d.mjs deberia rechazar un archivo sin cabecera glTF');
    assert.match(out, /GLB|glTF/i);
  } finally { cleanup(); }
});

test('add-3d.mjs empaqueta un GLB minimo en sidecar .glb.js y lista sus clips sin volcar base64', () => {
  const { file, dir, cleanup } = deckWith((h) => h);
  try {
    const glbPath = path.join(dir, 'mini.glb');
    writeFileSync(glbPath, makeMinimalGlb(['Reposo', 'Saludo', 'Giro']));
    const { code, out } = run('add-3d.mjs', [file, '--model', glbPath, '--id', 'mini']);
    assert.equal(code, 0, out);
    assert.match(out, /Reposo, Saludo, Giro/);
    assert.doesNotMatch(out, /window\.__szModels/);
    const sidecar = path.join(dir, 'assets', '3d', 'mini.glb.js');
    assert.ok(existsSync(sidecar), 'no se escribio assets/3d/mini.glb.js');
    const sidecarCode = readFileSync(sidecar, 'utf8');
    assert.match(sidecarCode, /window\.__szModels\["mini"\]\s*=\s*"[A-Za-z0-9+/=]+"/);
  } finally { cleanup(); }
});

test('inlineThreeOffline (make-offline) verifica sha384, reescribe imports relativos e incrusta modulos y sidecars', () => {
  const fakeCore = 'export const REVISION = "0.0.1";\n';
  const fakeModule = 'import { REVISION } from "./three.core.js";\nexport { REVISION };\n';
  const fakePin = {
    version: '0.0.1',
    cdnBase: 'https://cdn.jsdelivr.net/npm/three@0.0.1',
    imports: {
      three: 'https://cdn.jsdelivr.net/npm/three@0.0.1/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.0.1/examples/jsm/',
    },
    files: [
      {
        path: 'build/three.module.js',
        url: 'https://cdn.jsdelivr.net/npm/three@0.0.1/build/three.module.js',
        integrity: sha384(fakeModule),
      },
      {
        path: 'build/three.core.js',
        url: 'https://cdn.jsdelivr.net/npm/three@0.0.1/build/three.core.js',
        integrity: sha384(fakeCore),
      },
    ],
  };

  const inputHtml = [
    '<!doctype html><html><head>',
    `<script type="importmap">${JSON.stringify({ imports: fakePin.imports })}</script>`,
    '<script src="assets/3d/bot.glb.js" defer></script>',
    '</head><body>',
    '<figure class="sz-3d"><img class="sz-3d-poster" src="assets/3d/bot-poster.png" alt="Bot"></figure>',
    '</body></html>',
  ].join('\n');

  const res = inlineThreeOffline(inputHtml, {
    pin: fakePin,
    filesByPath: {
      'build/three.module.js': Buffer.from(fakeModule, 'utf8'),
      'build/three.core.js': Buffer.from(fakeCore, 'utf8'),
    },
    sidecarsBySrc: {
      'assets/3d/bot.glb.js': 'window.__szModels = { bot: "AAAA" };',
    },
    postersBySrc: {
      'assets/3d/bot-poster.png': Buffer.from([137, 80, 78, 71]),
    },
  });

  assert.equal(res.threeCount, 2);
  assert.equal(res.sidecarCount, 1);
  assert.equal(res.posterCount, 1);
  assert.ok(!res.html.includes('cdn.jsdelivr'), 'no debe quedar la cadena literal cdn.jsdelivr en el HTML offline');
  assert.deepEqual(findRemoteResources(res.html), [], 'no deben quedar recursos remotos tras incrustar');

  const mapBody = /<script type="importmap">([\s\S]*?)<\/script>/.exec(res.html)[1];
  const parsedMap = JSON.parse(mapBody);
  assert.match(parsedMap.imports.three, /^data:text\/javascript;base64,/);
  assert.match(parsedMap.imports['https://cdn.jsdelivr.net/npm/three@0.0.1/build/three.core.js'], /^data:text\/javascript;base64,/);

  const decodedModule = Buffer.from(parsedMap.imports.three.replace(/^data:text\/javascript;base64,/, ''), 'base64').toString('utf8');
  assert.match(decodedModule, /from "https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.0\.1\/build\/three\.core\.js"/);

  // Si el sha384 no coincide con el pin, debe lanzar error.
  assert.throws(() => {
    inlineThreeOffline(inputHtml, {
      pin: fakePin,
      filesByPath: {
        'build/three.module.js': Buffer.from('contenido adulterado', 'utf8'),
        'build/three.core.js': Buffer.from(fakeCore, 'utf8'),
      },
    });
  }, /sha384 inválido/);
});


