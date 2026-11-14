/**
 * slizdeck · tests de Studio
 *
 * Sin Chrome. Tres cosas que Studio promete y que un cambio puede romper sin
 * que se note en el navegador:
 *  - el mapa fuente es exacto: anotar y quitar las anotaciones devuelve el
 *    archivo byte a byte;
 *  - cada operacion toca solo lo que dice y el deck editado sigue pasando
 *    audit.mjs;
 *  - el servidor no entrega ni escribe nada sin la sesion, fuera de la
 *    carpeta del deck o sobre una version vieja del archivo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, statSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseDeck, slideNodes, annotate, stripAnnotations, getAttr, mergeStyle, SRC_ATTR } from '../scripts/lib/source-map.mjs';
import { applyOp, applyOps, sanitizeInline, isTextNode, OpError } from '../scripts/lib/studio-ops.mjs';
import { createStudio, readComments } from '../scripts/studio.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PITCH = readFileSync(path.join(ROOT, 'examples', 'pitch-showcase.html'), 'utf8');
const DATOS = readFileSync(path.join(ROOT, 'examples', 'datos-showcase.html'), 'utf8');

function htmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) htmlFiles(p, out); else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const find = (html, pred) => parseDeck(html).nodes.find((n) => pred(n, html));
const byClass = (html, cls) => find(html, (n) => new RegExp(`\\b${cls}\\b`).test(getAttr(html, n, 'class') || ''));
/** Lineas distintas entre dos versiones con la misma cantidad de lineas. */
const changedLines = (a, b) => { const A = a.split('\n'); const B = b.split('\n'); assert.equal(A.length, B.length); return A.filter((l, i) => l !== B[i]).length; };

function audit(html) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-studio-'));
  try {
    const file = path.join(dir, 'deck.html');
    writeFileSync(file, html);
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'audit.mjs'), file], { encoding: 'utf8' });
    return { code: r.status, out: r.stdout + r.stderr };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

/* ── Mapa fuente ── */

test('annotate + stripAnnotations devuelve el archivo identico en el template y todos los ejemplos', () => {
  const files = [path.join(ROOT, 'template.html'), ...htmlFiles(path.join(ROOT, 'examples'))];
  assert.ok(files.length >= 3);
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    const tree = parseDeck(html);
    assert.ok(tree, `${f}: no se encontro <deck-stage>`);
    assert.equal(tree.nodes.filter((n) => n.implicit).length, 0, `${f}: elementos sin cierre`);
    const marked = annotate(html);
    assert.ok(marked.includes(`${SRC_ATTR}="1"`), f);
    assert.equal(stripAnnotations(marked), html, f);
  }
});

test('parseDeck ignora el <deck-stage> nombrado en el CSS y las sections comentadas', () => {
  const tree = parseDeck(PITCH);
  assert.equal(tree.stage.tag, 'deck-stage');
  assert.equal(slideNodes(tree).length, 7);
  assert.equal(parseDeck('<html><body><p>no es un deck</p></body></html>'), null);
});

test('mergeStyle conserva el formato que ya traia el style', () => {
  assert.equal(mergeStyle('font-size:180px;font-weight:700', { translate: '4px 0px' }), 'font-size:180px;font-weight:700;translate:4px 0px');
  assert.equal(mergeStyle('color: red; margin: 0;', { color: null }), 'margin: 0;');
  assert.equal(mergeStyle('background: url(a;b.png); width: 10px', { width: '20px' }), 'background: url(a;b.png); width: 20px');
  assert.equal(mergeStyle('', { translate: null }), '');
});

/* ── Operaciones ── */

test('setText cambia una sola linea y sanea lo que manda el navegador', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  const { html, result } = applyOp(PITCH, {
    type: 'setText', id: h1.id,
    html: `Nimbus <strong ${SRC_ATTR}="99" onclick="x()" contenteditable="true">dos</strong><div>otra linea</div><script>alert(1)</script><br>`,
  });
  assert.equal(result.html, 'Nimbus <strong>dos</strong><br>otra linea');
  assert.equal(changedLines(PITCH, html), 1);
  assert.ok(html.includes('<h1 class="cover">Nimbus <strong>dos</strong><br>otra linea</h1>'));
  assert.equal(audit(html).code, 0, audit(html).out);
});

test('sanitizeInline no deja pasar bloques, scripts ni javascript:', () => {
  assert.equal(sanitizeInline('<img src=x onerror=alert(1)>hola'), 'hola');
  assert.equal(sanitizeInline('<a href="javascript:alert(1)" title="t">x</a>'), '<a title="t">x</a>');
  assert.equal(sanitizeInline('a < b'), 'a &lt; b');
  assert.equal(sanitizeInline('<div>uno</div><div>dos</div>'), 'uno<br>dos');
});

test('setText rechaza un contenedor con bloques adentro', () => {
  const pad = byClass(PITCH, 'pad');
  assert.equal(isTextNode(pad), false);
  assert.throws(() => applyOp(PITCH, { type: 'setText', id: pad.id, html: 'x' }), OpError);
});

test('setStyle mueve con translate sin tocar nada mas, y quitarlo devuelve el original', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  const moved = applyOp(PITCH, { type: 'setStyle', id: h1.id, props: { translate: '40px -12px' } }).html;
  assert.equal(changedLines(PITCH, moved), 1);
  assert.ok(moved.includes('<h1 class="cover" style="translate:40px -12px">Nimbus</h1>'));
  assert.equal(applyOp(moved, { type: 'setStyle', id: h1.id, props: { translate: null } }).html, PITCH);
  assert.throws(() => applyOp(PITCH, { type: 'setStyle', id: h1.id, props: { color: 'red}</style><script>' } }), OpError);
  assert.equal(audit(moved).code, 0);
});

test('setAttr solo acepta atributos de contenido', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  assert.ok(applyOp(PITCH, { type: 'setAttr', id: h1.id, name: 'title', value: 'a "b"' }).html.includes('title="a &quot;b&quot;"'));
  for (const name of ['onclick', 'style', 'class', 'data-sz-src']) {
    assert.throws(() => applyOp(PITCH, { type: 'setAttr', id: h1.id, name, value: 'x' }), OpError, name);
  }
  assert.throws(() => applyOp(PITCH, { type: 'setAttr', id: h1.id, name: 'href', value: 'javascript:x' }), OpError);
});

test('setStep agrega el reveal, sube data-steps de su slide y deja el deck valido', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  const { html } = applyOp(PITCH, { type: 'setStep', id: h1.id, step: 2 });
  assert.ok(html.includes('<h1 class="cover reveal" data-step="2">Nimbus</h1>'));
  assert.ok(html.includes('data-label="01 Cover" data-steps="2" data-current-step="0"'));
  assert.ok(html.includes('<deck-stage width="1920" height="1080">'), 'el stage no se toca');
  assert.equal(audit(html).code, 0, audit(html).out);
  const back = applyOp(html, { type: 'setStep', id: h1.id, step: null }).html;
  assert.ok(back.includes('<h1 class="cover">Nimbus</h1>'));
});

test('duplicar y borrar un elemento son inversas', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  const dup = applyOp(PITCH, { type: 'duplicateEl', id: h1.id }).html;
  assert.equal(dup.split('<h1 class="cover">Nimbus</h1>').length, 3);
  const copy = parseDeck(dup).nodes.filter((n) => n.tag === 'h1')[1];
  assert.equal(applyOp(dup, { type: 'removeEl', id: copy.id }).html, PITCH);
});

test('moveSlide renumera, es reversible y renumerar de nuevo no cambia nada', () => {
  const { html } = applyOp(PITCH, { type: 'moveSlide', from: 0, to: 2 });
  const labels = [...html.matchAll(/<section[^>]*data-label="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(labels.slice(0, 3), ['01 Problem', '02 Solution', '03 Cover']);
  assert.equal(audit(html).code, 0, audit(html).out);
  assert.equal(applyOp(html, { type: 'moveSlide', from: 2, to: 0 }).html, PITCH);
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), 'slizdeck-studio-')), 'd.html');
  writeFileSync(file, html);
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'renumber.mjs'), file]);
  assert.equal(readFileSync(file, 'utf8'), html);
  rmSync(path.dirname(file), { recursive: true, force: true });
});

test('duplicateSlide + removeSlide devuelve el original, y no se puede borrar la ultima slide', () => {
  for (const src of [PITCH, DATOS]) {
    const dup = applyOp(src, { type: 'duplicateSlide', index: 0 }).html;
    assert.equal(slideNodes(parseDeck(dup)).length, slideNodes(parseDeck(src)).length + 1);
    assert.equal(audit(dup).code, 0, audit(dup).out);
    assert.equal(applyOp(dup, { type: 'removeSlide', index: 1 }).html, src);
  }
  let one = PITCH;
  for (let i = 0; i < 6; i++) one = applyOp(one, { type: 'removeSlide', index: 0 }).html;
  assert.throws(() => applyOp(one, { type: 'removeSlide', index: 0 }), OpError);
});

test('setChartData reemplaza solo el JSON de la grafica', () => {
  const fig = byClass(DATOS, 'sz-chart');
  const data = { type: 'bar', labels: ['a', '</script>'], series: [{ name: 'S', values: [1, 2] }] };
  const { html } = applyOp(DATOS, { type: 'setChartData', id: fig.id, data });
  assert.equal(changedLines(DATOS, html), 1);
  assert.ok(html.includes('"labels":["a","<\\/script>"]'), 'el cierre de script va escapado');
  assert.equal(parseDeck(html).nodes.length, parseDeck(DATOS).nodes.length);
  const h2 = find(DATOS, (n) => n.tag === 'h2');
  assert.throws(() => applyOp(DATOS, { type: 'setChartData', id: h2.id, data }), OpError);
});

test('setNotes escribe la nota existente y crea el aside donde falta', () => {
  const a = applyOp(PITCH, { type: 'setNotes', index: 0, text: 'Uno\n\nDos <b>' }).html;
  assert.equal(changedLines(PITCH, a), 1);
  assert.ok(a.includes('<aside class="notes"><p>Uno</p><p>Dos &lt;b&gt;</p></aside>'));
  const index = slideNodes(parseDeck(DATOS)).findIndex((n) => !/class="notes"/.test(DATOS.slice(n.openEnd, n.closeStart)));
  assert.ok(index >= 0);
  const b = applyOp(DATOS, { type: 'setNotes', index, text: 'Nueva' }).html;
  assert.equal(b.split('\n').length, DATOS.split('\n').length + 1);
  assert.equal(audit(b).code, 0, audit(b).out);
});

test('applyOps es todo o nada', () => {
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  assert.throws(() => applyOps(PITCH, [
    { type: 'setStyle', id: h1.id, props: { translate: '1px 1px' } },
    { type: 'noExiste' },
  ]), OpError);
  assert.throws(() => applyOp(PITCH, { type: 'removeEl', id: 0 }), OpError);
  assert.throws(() => applyOp(PITCH, { type: 'removeEl', id: 999999 }), OpError);
});

/* ── Servidor ── */

async function withStudio(fn) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-studio-'));
  const file = path.join(dir, 'deck.html');
  copyFileSync(path.join(ROOT, 'examples', 'pitch-showcase.html'), file);
  writeFileSync(path.join(dir, '..', 'slizdeck-studio-secreto.txt'), 'SECRETO-VECINO');
  const studio = await createStudio({ file });
  const base = `http://127.0.0.1:${studio.port}`;
  const cookie = { Cookie: `sz_studio=${studio.token}` };
  const post = (route, body, headers = {}) => fetch(`${base}/__api/${route}`, {
    method: 'POST', headers: { ...cookie, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  try { await fn({ studio, base, cookie, post, file, dir }); } finally {
    await studio.close();
    rmSync(dir, { recursive: true, force: true });
    rmSync(path.join(dir, '..', 'slizdeck-studio-secreto.txt'), { force: true });
  }
}

test('servidor: nada sin sesion, y el token de la URL entrega la cookie', () => withStudio(async ({ studio, base, cookie }) => {
  for (const p of ['/', '/__deck', '/__api/state', '/deck.html', '/?t=malo']) {
    assert.equal((await fetch(base + p)).status, 403, p);
  }
  assert.equal((await fetch(`${base}/__api/patch`, { method: 'POST', body: '{}' })).status, 403);
  const entry = await fetch(studio.url);
  assert.equal(entry.status, 200);
  assert.match(entry.headers.get('set-cookie'), /sz_studio=.*HttpOnly.*SameSite=Strict/);
  assert.equal((await fetch(`${base}/__api/state`, { headers: cookie })).status, 200);
}));

test('servidor: no sirve nada fuera de la carpeta del deck ni acepta otro origen', () => withStudio(async ({ base, cookie, post }) => {
  for (const p of ['/..%2Fslizdeck-studio-secreto.txt', '/%2e%2e/slizdeck-studio-secreto.txt', '/__studio/..%2F..%2Fpackage.json']) {
    const r = await fetch(base + p, { headers: cookie });
    assert.ok([403, 404].includes(r.status), `${p} → ${r.status}`);
    assert.ok(!/SECRETO-VECINO|"pptxgenjs"/.test(await r.text()), p);
  }
  assert.equal((await fetch(`${base}/deck.html`, { headers: cookie })).status, 200);
  const cross = await post('patch', { rev: 'x', ops: [] }, { Origin: 'http://evil.example' });
  assert.equal(cross.status, 403);
}));

test('servidor: el deck se sirve anotado pero el archivo nunca guarda nada del editor', () => withStudio(async ({ base, cookie, post, file, dir }) => {
  const served = await (await fetch(`${base}/__deck`, { headers: cookie })).text();
  assert.ok(served.includes(`${SRC_ATTR}="1"`) && served.includes('__SZ_STUDIO_MODE="edit"'));
  assert.equal(await (await fetch(`${base}/__deck?preview`, { headers: cookie })).text(), PITCH);

  const state = await (await fetch(`${base}/__api/state`, { headers: cookie })).json();
  const h1 = find(PITCH, (n) => n.tag === 'h1');
  const r = await post('patch', { rev: state.rev, ops: [{ type: 'setStyle', id: h1.id, props: { translate: '5px 5px' } }] });
  assert.equal(r.status, 200);
  const after = await r.json();
  const saved = readFileSync(file, 'utf8');
  assert.ok(saved.includes('style="translate:5px 5px"'));
  assert.ok(!/data-sz-|__SZ_STUDIO|contenteditable/.test(saved));
  assert.equal(after.canUndo, true);
  assert.equal(readdirSync(path.join(dir, '.slizdeck', 'studio')).length, 1, 'un respaldo por sesion');

  // rev viejo: no se escribe.
  const stale = await post('patch', { rev: state.rev, ops: [{ type: 'removeSlide', index: 0 }] });
  assert.equal(stale.status, 409);
  assert.equal(readFileSync(file, 'utf8'), saved);

  // op invalida: 422 y el archivo intacto.
  const bad = await post('patch', { rev: after.rev, ops: [{ type: 'setAttr', id: h1.id, name: 'onclick', value: 'x' }] });
  assert.equal(bad.status, 422);
  assert.equal(readFileSync(file, 'utf8'), saved);

  const undone = await (await post('undo', { rev: after.rev })).json();
  assert.equal(readFileSync(file, 'utf8'), PITCH);
  assert.equal(undone.canRedo, true);
  await post('redo', { rev: undone.rev });
  assert.equal(readFileSync(file, 'utf8'), saved);
}));

test('servidor: assets solo imagenes, dentro de assets/ y sin pisar', () => withStudio(async ({ base, cookie, dir }) => {
  const up = (name) => fetch(`${base}/__api/asset?name=${encodeURIComponent(name)}`, { method: 'POST', headers: cookie, body: Buffer.from('png') });
  assert.deepEqual(await (await up('../../foto equipo.png')).json(), { path: 'assets/foto-equipo.png' });
  assert.deepEqual(await (await up('foto equipo.png')).json(), { path: 'assets/foto-equipo-2.png' });
  assert.ok(existsSync(path.join(dir, 'assets', 'foto-equipo.png')));
  assert.equal((await up('malo.html')).status, 400);
  assert.equal((await up('x.js')).status, 400);
}));

test('comentarios: borrador → enviado → entregado al agente con --wait → resuelto', () => withStudio(async ({ post, file }) => {
  const cli = (...args) => spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'studio.mjs'), 'comments', file, ...args], { encoding: 'utf8' });
  assert.equal((await post('comments', { action: 'add', text: '  ' })).status, 400);
  await post('comments', { action: 'add', text: 'Mas aire arriba', slide: 2, label: '02 Problem', target: { tag: 'h2', classes: 'title', text: 'x', html: '<h2>x</h2>' } });
  const [c] = readComments(file);
  assert.equal(c.status, 'draft');
  assert.match(cli().stdout, /Mas aire arriba/);
  await post('comments', { action: 'send' });
  const waited = cli('--wait', '--json');
  assert.equal(waited.status, 0, waited.stderr);
  assert.equal(JSON.parse(waited.stdout).comments[0].text, 'Mas aire arriba');
  assert.equal(readComments(file)[0].status, 'delivered');
  assert.equal(cli('--resolve', c.id).status, 0);
  assert.equal(readComments(file)[0].status, 'resolved');
  assert.equal(cli('--resolve', c.id).status, 1, 'resolver dos veces falla');
}));
