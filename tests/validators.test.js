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
 * Solo node:test y node:assert — cero dependencias, como el resto de los
 * scripts. Los validadores que necesitan Chrome (reveal, overflow,
 * contrast, shoot) no se cubren aca: ya corren en CI sobre el showcase.
 *
 *   node --test tests/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOWCASE = path.join(ROOT, 'examples', 'pitch-showcase.html');

/** Corre un script de la skill y devuelve {code, out}. Nunca lanza. */
function run(script, args = []) {
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', script), ...args], {
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
  return { file, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
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
  (h) => h.replace(/<title>[^<]*<\/title>/, '<title>Claude Slides · [DECK NAME]</title>'),
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

for (const script of ['audit.mjs', 'doctor.mjs', 'export-pptx.mjs', 'check-contrast.mjs']) {
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
  // template.html trae el <script> de lucide comentado como opt-in: contarlo
  // haria que el deck mas comun reportase una dependencia de red que no tiene.
  const { file, cleanup } = deckWith((h) => h);
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
    execFileSync('node', [path.join(ROOT, 'scripts', 'check-versions.mjs')], {
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

