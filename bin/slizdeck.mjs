#!/usr/bin/env node
/**
 * slizdeck · CLI
 *
 * Un solo punto de entrada para instalar la skill y para correr sus scripts
 * desde cualquier carpeta, sin hacer cd a la raiz de la skill.
 *
 *   npx slizdeck install                  instala en los agentes detectados
 *   npx slizdeck install --agent claude,codex --project
 *   npx slizdeck update | uninstall | where
 *   npx slizdeck env                      Node, Chrome y dependencias
 *   npx slizdeck audit deck.html          (y el resto de los scripts, ver HELP)
 *
 * Los subcomandos de scripts delegan en scripts/*.mjs sin reescribirlos:
 * cada script ya encuentra su propia raiz con import.meta.url, y las rutas
 * que recibe se resuelven contra la carpeta desde donde se corre el CLI.
 */

import {
  existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, lstatSync, readdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const MARKER = '.slizdeck-install.json';

/* ── Agentes ────────────────────────────────────────────────────────────
   Carpeta base de cada agente, relativa a HOME (global) o al proyecto
   (--project). La skill queda en <base>/skills/slizdeck.                */
const AGENTS = {
  claude: '.claude',
  codex: '.codex',
  gemini: '.gemini',
  opencode: '.opencode',
};

/* Lo que viaja a la carpeta instalada: la skill y lo que sus scripts leen
   en runtime (doctor lee CHANGELOG.md, smoke-test lee los dos ejemplos). */
const PAYLOAD = [
  'SKILL.md', 'template.html', 'styles', 'reference', 'scripts', 'bin',
  'CHANGELOG.md', 'DESIGN.md', 'design.json', 'LICENSE', 'NOTICE.md', 'package.json',
  'examples/demo-deck.html', 'examples/pitch-showcase.html',
];

/* ── Scripts expuestos como subcomandos ─────────────────────────────────── */
const SCRIPTS = {
  audit: 'audit.mjs',
  'check-reveal': 'check-reveal.mjs',
  'check-overflow': 'check-overflow.mjs',
  'check-contrast': 'check-contrast.mjs',
  'check-style-pack': 'check-style-pack.mjs',
  shoot: 'shoot.mjs',
  doctor: 'doctor.mjs',
  renumber: 'renumber.mjs',
  'apply-pack': 'apply-style-pack.mjs',
  'export-pptx': 'export-pptx.mjs',
  'make-offline': 'make-offline.mjs',
  'smoke-test': 'smoke-test.mjs',
};

const HELP = `slizdeck ${PKG.version} — decks de slides HTML animados (Agent Skill)

Instalación
  install [--agent <lista>|all] [--project] [--force] [--no-deps]
      Copia la skill a <agente>/skills/slizdeck. Sin --agent, instala en los
      agentes detectados (${Object.keys(AGENTS).join(', ')}); si no detecta
      ninguno, en claude. --project instala en la carpeta actual en vez de HOME.
  update [--agent ...] [--project]     Reinstala sobre las instalaciones hechas con este CLI
  uninstall [--agent ...] [--project] [--force]
  where                                Lista dónde está instalada y en qué versión
  env                                  Verifica Node, Chrome y dependencias del export

Deck
  audit <deck>              Validación estática (contraste, balance, voz, assets)
  check <deck>              audit + check-reveal + check-overflow + check-contrast
  check-reveal <deck>       Cascada de .reveal en Chrome
  check-overflow <deck>     Desbordes y solapes de texto en Chrome
  check-contrast <deck>     Contraste medido por nodo en Chrome
  check-style-pack <pack|deck>
  shoot <deck> [--slides=1,3] [--out=dir]
  doctor <deck>             Fixes del engine que le faltan a un deck viejo
  renumber <deck>
  apply-pack <pack> <deck> [salida] [--font=<id>]   (pack: nombre o ruta)
  export pptx <deck> [salida.pptx]
  export offline <deck> [salida.html]
  smoke-test

  new <deck.html> [--pack=<pack>] [--font=<id>]     Copia el template y aplica un pack
`;

/* ── Utilidades ─────────────────────────────────────────────────────────── */

function parseFlags(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--agent') flags.agent = argv[++i];
    else if (a.startsWith('--agent=')) flags.agent = a.slice(8);
    else if (a === '--project') flags.project = true;
    else if (a === '--force') flags.force = true;
    else if (a === '--no-deps') flags.noDeps = true;
    else rest.push(a);
  }
  return { flags, rest };
}

const home = () => process.env.SLIZDECK_HOME || os.homedir();

function baseDir(agent, project) {
  return path.join(project ? process.cwd() : home(), AGENTS[agent]);
}

function targetDir(agent, project) {
  return path.join(baseDir(agent, project), 'skills', 'slizdeck');
}

function resolveAgents(spec, project, { detect }) {
  if (spec) {
    const list = spec === 'all' ? Object.keys(AGENTS) : spec.split(',').map((s) => s.trim()).filter(Boolean);
    const unknown = list.filter((a) => !AGENTS[a]);
    if (unknown.length) fail(`agente desconocido: ${unknown.join(', ')}. Opciones: ${Object.keys(AGENTS).join(', ')}, all`);
    return list;
  }
  if (!detect) return Object.keys(AGENTS);
  const found = Object.keys(AGENTS).filter((a) => existsSync(baseDir(a, project)));
  return found.length ? found : ['claude'];
}

/** Qué hay en la carpeta destino: nada, una instalación de este CLI, o algo ajeno. */
function inspect(dir) {
  let st;
  try { st = lstatSync(dir); } catch { return { kind: 'none' }; }
  if (st.isSymbolicLink()) return { kind: 'symlink' };
  if (existsSync(path.join(dir, '.git'))) return { kind: 'git' };
  const marker = path.join(dir, MARKER);
  if (existsSync(marker)) {
    try { return { kind: 'cli', ...JSON.parse(readFileSync(marker, 'utf8')) }; } catch { return { kind: 'cli' }; }
  }
  return { kind: 'other' };
}

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function installDeps(dir) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['install', '--omit=dev', '--no-audit', '--no-fund', '--no-package-lock', '--loglevel=error'], {
    cwd: dir, stdio: 'inherit', shell: process.platform === 'win32',
  });
  return r.status === 0;
}

/* ── install / update / uninstall / where ──────────────────────────────── */

function install(argv, { onlyExisting = false } = {}) {
  const { flags } = parseFlags(argv);
  const agents = resolveAgents(flags.agent, flags.project, { detect: !onlyExisting });
  let done = 0;
  let depsFailed = false;

  for (const agent of agents) {
    const dir = targetDir(agent, flags.project);
    const state = inspect(dir);

    if (onlyExisting && state.kind !== 'cli') continue;
    if ((state.kind === 'git' || state.kind === 'symlink') && !flags.force) {
      console.log(`  · ${agent}: ${dir} es un ${state.kind === 'git' ? 'clon de git' : 'symlink'} — no lo piso. Actualízalo con git pull, o usa --force.`);
      continue;
    }
    if (state.kind === 'other' && !flags.force) {
      console.log(`  · ${agent}: ${dir} ya existe y no lo instaló este CLI — no lo piso. Usa --force para reemplazarlo.`);
      continue;
    }

    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const item of PAYLOAD) {
      const src = path.join(ROOT, item);
      if (!existsSync(src)) continue;
      cpSync(src, path.join(dir, item), { recursive: true });
    }
    writeFileSync(path.join(dir, MARKER), JSON.stringify({
      version: PKG.version, agent, installedAt: new Date().toISOString(),
    }, null, 2) + '\n');

    let deps = 'sin dependencias (--no-deps)';
    if (!flags.noDeps) {
      if (installDeps(dir)) deps = 'dependencias del export instaladas';
      else { deps = 'falló npm install (el export a PPTX no va a funcionar hasta correrlo en esa carpeta)'; depsFailed = true; }
    }
    console.log(`  ✓ ${agent}: ${dir} (${PKG.version}, ${deps})`);
    done++;
  }

  if (!done) {
    console.log(onlyExisting
      ? '\nNo hay instalaciones hechas con este CLI para actualizar. Usa: npx slizdeck install'
      : '\nNo se instaló nada.');
    process.exit(onlyExisting ? 0 : 1);
  }
  console.log(`\nListo. Pídele a tu agente: "hazme un pitch deck sobre …"`);
  if (depsFailed) process.exitCode = 1;
}

function uninstall(argv) {
  const { flags } = parseFlags(argv);
  const agents = resolveAgents(flags.agent, flags.project, { detect: false });
  let removed = 0;
  for (const agent of agents) {
    const dir = targetDir(agent, flags.project);
    const state = inspect(dir);
    if (state.kind === 'none') continue;
    if (state.kind !== 'cli' && !flags.force) {
      console.log(`  · ${agent}: ${dir} no lo instaló este CLI (${state.kind}) — no lo borro. Usa --force.`);
      continue;
    }
    rmSync(dir, { recursive: true, force: true });
    console.log(`  ✓ ${agent}: ${dir} eliminado`);
    removed++;
  }
  if (!removed) console.log('No había nada que desinstalar.');
  console.log('\nSi agregaste a mano el hook de reference/hooks.md, quita su bloque hooks.PostToolUse del .claude/settings.local.json de tu proyecto.');
}

function where(argv) {
  const { flags } = parseFlags(argv);
  let any = false;
  for (const project of flags.project ? [true] : [false, true]) {
    for (const agent of Object.keys(AGENTS)) {
      const dir = targetDir(agent, project);
      const state = inspect(dir);
      if (state.kind === 'none') continue;
      any = true;
      let version = state.version;
      if (!version) {
        const skill = path.join(dir, 'SKILL.md');
        version = existsSync(skill) ? /version:\s*["']?([0-9.]+)/.exec(readFileSync(skill, 'utf8'))?.[1] : null;
      }
      const how = { cli: 'npx', git: 'git clone', symlink: 'symlink', other: 'manual' }[state.kind];
      console.log(`  ${agent.padEnd(9)} ${(version || '?').padEnd(7)} ${how.padEnd(9)} ${dir}`);
    }
  }
  if (!any) console.log('slizdeck no está instalada en ningún agente. Usa: npx slizdeck install');
}

/* ── env ────────────────────────────────────────────────────────────────── */

async function env() {
  let bad = 0;
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) console.log(`  ✓ Node ${process.versions.node}`);
  else { console.log(`  ✗ Node ${process.versions.node} — slizdeck necesita Node 20 o superior`); bad++; }

  try {
    const { findChrome } = await import('../scripts/lib/find-chrome.mjs');
    console.log(`  ✓ Chrome: ${findChrome()}`);
  } catch (e) {
    console.log(`  ✗ Chrome: ${e.message}\n    (solo lo necesitan check-reveal, check-overflow, check-contrast, shoot y smoke-test)`);
    bad++;
  }

  const missing = Object.keys(PKG.dependencies || {}).filter((d) => {
    try { createRequire(import.meta.url).resolve(d); return false; } catch { return true; }
  });
  if (!missing.length) console.log('  ✓ dependencias del export a PPTX');
  else {
    console.log(`  ✗ faltan dependencias del export a PPTX: ${missing.join(', ')}\n    Corre npm install en ${ROOT}`);
    bad++;
  }
  console.log(`\n  skill: ${ROOT} (${PKG.version})`);
  process.exitCode = bad ? 1 : 0;
}

/* ── Scripts ────────────────────────────────────────────────────────────── */

function runScript(file, args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', file), ...args], { stdio: 'inherit' });
  return r.status ?? 1;
}

/** Un pack se puede pasar por nombre ("terminal") o por ruta. */
function resolvePack(p) {
  if (!p || existsSync(p)) return p;
  const named = path.join(ROOT, 'styles', p.endsWith('.md') ? p : `${p}.md`);
  if (existsSync(named)) return named;
  const packs = readdirSync(path.join(ROOT, 'styles')).filter((f) => f.endsWith('.md') && f !== 'index.md').map((f) => f.slice(0, -3));
  fail(`no existe el pack "${p}". Disponibles: ${packs.join(', ')}`);
}

function newDeck(argv) {
  const pack = argv.find((a) => a.startsWith('--pack='))?.slice(7);
  const font = argv.find((a) => a.startsWith('--font='));
  const out = argv.find((a) => !a.startsWith('--'));
  if (!out) fail('uso: slizdeck new <deck.html> [--pack=<pack>] [--font=<id>]');
  if (existsSync(out)) fail(`${out} ya existe — no lo piso`);
  cpSync(path.join(ROOT, 'template.html'), out);
  console.log(`  ✓ ${out} creado desde el template ${PKG.version}`);
  if (pack) return runScript('apply-style-pack.mjs', [resolvePack(pack), out, ...(font ? [font] : [])]);
  return 0;
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(HELP);
      return;
    case '--version':
    case '-v':
      console.log(PKG.version);
      return;
    case 'install': return install(args);
    case 'update': return install(args, { onlyExisting: true });
    case 'uninstall': return uninstall(args);
    case 'where': return where(args);
    case 'env': return env();
    case 'new': process.exitCode = newDeck(args); return;
    case 'check': {
      if (!args[0]) fail('uso: slizdeck check <deck.html>');
      let worst = 0;
      for (const s of ['audit.mjs', 'check-reveal.mjs', 'check-overflow.mjs', 'check-contrast.mjs']) {
        console.log(`\n── ${s.replace('.mjs', '')} ──`);
        worst = Math.max(worst, runScript(s, args));
      }
      process.exitCode = worst;
      return;
    }
    case 'export': {
      const [format, ...rest] = args;
      const file = { pptx: 'export-pptx.mjs', offline: 'make-offline.mjs' }[format];
      if (!file) fail('uso: slizdeck export pptx|offline <deck.html> [salida]');
      process.exitCode = runScript(file, rest);
      return;
    }
    case 'apply-pack': {
      const [pack, ...rest] = args;
      process.exitCode = runScript('apply-style-pack.mjs', [resolvePack(pack), ...rest]);
      return;
    }
    case 'check-style-pack': {
      const [target, ...rest] = args;
      const resolved = target && !existsSync(target) && !target.endsWith('.html') ? resolvePack(target) : target;
      process.exitCode = runScript('check-style-pack.mjs', [resolved, ...rest].filter(Boolean));
      return;
    }
    default:
      if (SCRIPTS[cmd]) { process.exitCode = runScript(SCRIPTS[cmd], args); return; }
      console.error(`comando desconocido: ${cmd}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main();
