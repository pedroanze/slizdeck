/**
 * slizdeck · tests del CLI (bin/slizdeck.mjs)
 *
 * Instala en un HOME temporal (SLIZDECK_HOME) y comprueba lo que un usuario
 * de `npx slizdeck install` va a tener: la skill completa en cada agente,
 * que no se pisa lo que no instalo el CLI, y que uninstall limpia solo lo
 * suyo. Sin red: siempre con --no-deps.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'bin', 'slizdeck.mjs');

function cli(args, { home, cwd = ROOT } = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd, encoding: 'utf8', env: { ...process.env, SLIZDECK_HOME: home },
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

function withHome(fn) {
  const home = mkdtempSync(path.join(os.tmpdir(), 'slizdeck-cli-'));
  try { fn(home); } finally { rmSync(home, { recursive: true, force: true }); }
}

const skillDir = (home, agent) => path.join(home, `.${agent}`, 'skills', 'slizdeck');

test('install --agent all deja la skill completa en los cuatro agentes', () => withHome((home) => {
  const { code, out } = cli(['install', '--agent', 'all', '--no-deps'], { home });
  assert.equal(code, 0, out);
  for (const agent of ['claude', 'codex', 'gemini', 'opencode']) {
    const dir = skillDir(home, agent);
    for (const f of ['SKILL.md', 'template.html', 'CHANGELOG.md', 'styles/index.md', 'scripts/audit.mjs',
      'scripts/lib/find-chrome.mjs', 'examples/pitch-showcase.html', '.slizdeck-install.json']) {
      assert.ok(existsSync(path.join(dir, f)), `${agent}: falta ${f}`);
    }
  }
}));

test('install sin --agent detecta los agentes presentes', () => withHome((home) => {
  mkdirSync(path.join(home, '.codex'));
  const { code, out } = cli(['install', '--no-deps'], { home });
  assert.equal(code, 0, out);
  assert.ok(existsSync(skillDir(home, 'codex')));
  assert.ok(!existsSync(skillDir(home, 'claude')), 'no deberia instalar en un agente no detectado');
}));

test('install no pisa una carpeta que no instalo el CLI', () => withHome((home) => {
  const dir = skillDir(home, 'claude');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'SKILL.md'), 'mio');
  const { code, out } = cli(['install', '--agent', 'claude', '--no-deps'], { home });
  assert.notEqual(code, 0, out);
  assert.equal(readFileSync(path.join(dir, 'SKILL.md'), 'utf8'), 'mio');
}));

test('uninstall borra lo instalado por el CLI y respeta lo ajeno', () => withHome((home) => {
  cli(['install', '--agent', 'claude', '--no-deps'], { home });
  const ajeno = skillDir(home, 'codex');
  mkdirSync(path.join(ajeno, '.git'), { recursive: true });
  const { code, out } = cli(['uninstall', '--agent', 'claude,codex'], { home });
  assert.equal(code, 0, out);
  assert.ok(!existsSync(skillDir(home, 'claude')));
  assert.ok(existsSync(ajeno), 'no deberia borrar un clon de git sin --force');
}));

test('new + apply-pack por nombre genera un deck que pasa audit', () => withHome((home) => {
  const deck = path.join(home, 'deck.html');
  let r = cli(['new', deck, '--pack=terminal'], { home, cwd: home });
  assert.equal(r.code, 0, r.out);
  writeFileSync(deck, readFileSync(deck, 'utf8').replace('Slizdeck · [DECK NAME]', 'CLI Test'));
  r = cli(['audit', 'deck.html'], { home, cwd: home });
  assert.equal(r.code, 0, r.out);
}));

test('un pack inexistente falla con la lista de packs', () => withHome((home) => {
  const r = cli(['apply-pack', 'no-existe', 'x.html'], { home });
  assert.notEqual(r.code, 0);
  assert.match(r.out, /terminal/);
}));

test('where corrido desde HOME no duplica la instalacion global', () => withHome((home) => {
  cli(['install', '--agent', 'claude', '--no-deps'], { home });
  const { code, out } = cli(['where'], { home, cwd: home });
  assert.equal(code, 0, out);
  assert.equal(out.trim().split('\n').filter((l) => l.includes('claude')).length, 1, out);
}));
