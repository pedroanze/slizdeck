#!/usr/bin/env node
/**
 * slizdeck · studio
 *
 * Editor visual local de un deck: levanta un servidor en 127.0.0.1 que sirve
 * el deck dentro de un editor (studio/) y guarda cada cambio directo en el
 * HTML fuente, como parche sobre el texto (scripts/lib/studio-ops.mjs), sin
 * serializar el DOM.
 *
 *   node scripts/studio.mjs deck.html [--port=4173] [--no-open]
 *   node scripts/studio.mjs comments deck.html            lista los comentarios pendientes
 *   node scripts/studio.mjs comments deck.html --wait     espera a que el usuario envie comentarios
 *   node scripts/studio.mjs comments deck.html --resolve <id|all>
 *
 * Sin dependencias: node:http. Solo escucha en loopback, exige el token de
 * la sesion (cookie) y no sirve nada fuera de la carpeta del deck.
 *
 * Lo que NO hace: no valida el resultado por su cuenta. El boton "Revisar"
 * corre audit.mjs y check-overflow.mjs a pedido; mover o agrandar algo puede
 * dejar un desborde que solo esos scripts detectan.
 */

import http from 'node:http';
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, statSync, realpathSync, watchFile, unwatchFile, createReadStream } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { annotate, parseDeck } from './lib/source-map.mjs';
import { applyOps, OpError } from './lib/studio-ops.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO_DIR = path.join(ROOT, 'studio');
const HISTORY_MAX = 100;
const ASSET_MAX = 25 * 1024 * 1024;
const ASSET_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
};

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16);

/* ── Comentarios (sidecar <deck>.comments.json) ─────────────────────────── */

export const commentsPath = (file) => file.replace(/\.html?$/i, '') + '.comments.json';

export function readComments(file) {
  try {
    const data = JSON.parse(readFileSync(commentsPath(file), 'utf8'));
    return Array.isArray(data.comments) ? data.comments : [];
  } catch { return []; }
}

export function writeComments(file, comments) {
  writeFileSync(commentsPath(file), JSON.stringify({ version: 1, deck: path.basename(file), comments }, null, 2) + '\n');
}

/* ── Servidor ───────────────────────────────────────────────────────────── */

/**
 * Crea el servidor de Studio para un deck. Devuelve { server, url, token,
 * close() } una vez que escucha. `port: 0` elige un puerto libre.
 */
export function createStudio({ file, port = 0 }) {
  const deckFile = realpathSync(path.resolve(file));
  const deckDir = path.dirname(deckFile);
  const token = randomBytes(18).toString('hex');
  const read = () => readFileSync(deckFile, 'utf8');
  if (!parseDeck(read())) throw new Error(`${file}: no tiene <deck-stage>, no es un deck de slizdeck`);

  const undo = [];
  const redo = [];
  let lastWritten = hash(read());
  let backedUp = false;
  const clients = new Set();

  const send = (res, code, body, headers = {}) => {
    const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    res.writeHead(code, {
      'Content-Type': typeof body === 'string' || Buffer.isBuffer(body) ? 'text/plain; charset=utf-8' : MIME['.json'],
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers,
    });
    res.end(data);
  };

  const broadcast = (event, data) => {
    for (const res of clients) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const state = (html = read()) => ({ rev: hash(html), canUndo: undo.length > 0, canRedo: redo.length > 0 });

  /* Escritura atomica, con una copia de respaldo del deck la primera vez
     que la sesion lo toca. */
  const save = (html, before) => {
    if (!backedUp) {
      const dir = path.join(deckDir, '.slizdeck', 'studio');
      mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      writeFileSync(path.join(dir, `${path.basename(deckFile, '.html')}.${stamp}.html`), before);
      backedUp = true;
    }
    const tmp = `${deckFile}.studio-tmp`;
    writeFileSync(tmp, html);
    renameSync(tmp, deckFile);
    lastWritten = hash(html);
  };

  // Cambios hechos por fuera (el agente, otro editor): la pila de deshacer
  // deja de valer y el editor recarga.
  watchFile(deckFile, { interval: 500 }, () => {
    let html;
    try { html = read(); } catch { return; }
    const rev = hash(html);
    if (rev === lastWritten) return;
    lastWritten = rev;
    undo.length = 0; redo.length = 0;
    broadcast('changed', state(html));
  });

  const body = (req, max = 8 * 1024 * 1024) => new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > max) { reject(new Error('demasiado grande')); req.destroy(); } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const deckPage = (mode) => {
    const html = read();
    if (mode === 'preview') return html;
    const bridge = readFileSync(path.join(STUDIO_DIR, 'bridge.js'), 'utf8');
    const tag = `<script>window.__SZ_STUDIO_MODE=${JSON.stringify(mode)};${bridge}\n</` + 'script>';
    const base = mode === 'thumb' ? html : annotate(html);
    // Al principio del <head>: el puente tiene que registrar su listener de
    // teclado antes que el engine para poder frenar la navegacion.
    return /<head[^>]*>/i.test(base) ? base.replace(/<head[^>]*>/i, (m) => m + tag) : tag + base;
  };

  const runScript = (name, args) => new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(ROOT, 'scripts', name), ...args], { env: { ...process.env, NO_COLOR: '1' } });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ code: code ?? 1, out: out.replace(/\x1b\[[0-9;]*m/g, '') }));
    p.on('error', (e) => resolve({ code: 1, out: String(e) }));
  });

  const api = async (req, res, route, url) => {
    if (route === 'state' && req.method === 'GET') {
      return send(res, 200, { ...state(), name: path.basename(deckFile), comments: readComments(deckFile) });
    }

    if (route === 'events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write(': ok\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return undefined;
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'metodo no permitido' });

    if (route === 'asset') {
      const name = path.basename(String(url.searchParams.get('name') || '')).replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '');
      if (!ASSET_EXT.test(name)) return send(res, 400, { error: 'solo imagenes: png, jpg, gif, webp, avif o svg' });
      let data;
      try { data = await body(req, ASSET_MAX); } catch { return send(res, 413, { error: 'la imagen supera 25 MB' }); }
      const dir = path.join(deckDir, 'assets');
      mkdirSync(dir, { recursive: true });
      const ext = path.extname(name); const stem = path.basename(name, ext);
      let final = name;
      for (let i = 2; existsSync(path.join(dir, final)); i++) final = `${stem}-${i}${ext}`;
      writeFileSync(path.join(dir, final), data);
      return send(res, 200, { path: `assets/${final}` });
    }

    let payload = {};
    try { payload = JSON.parse((await body(req)).toString('utf8') || '{}'); } catch { return send(res, 400, { error: 'JSON invalido' }); }

    if (route === 'patch' || route === 'undo' || route === 'redo') {
      const before = read();
      if (payload.rev !== hash(before)) return send(res, 409, { error: 'el archivo cambio en disco', ...state(before) });
      let after; let results = [];
      if (route === 'patch') {
        try { ({ html: after, results } = applyOps(before, payload.ops || [])); } catch (e) {
          if (e instanceof OpError) return send(res, 422, { error: e.message });
          throw e;
        }
        if (after !== before) {
          undo.push(before); if (undo.length > HISTORY_MAX) undo.shift();
          redo.length = 0;
        }
      } else {
        const from = route === 'undo' ? undo : redo;
        const to = route === 'undo' ? redo : undo;
        if (!from.length) return send(res, 422, { error: route === 'undo' ? 'nada que deshacer' : 'nada que rehacer' });
        after = from.pop();
        to.push(before);
      }
      if (after !== before) save(after, before);
      return send(res, 200, { ...state(after), results });
    }

    if (route === 'check') {
      const audit = await runScript('audit.mjs', [deckFile]);
      const overflow = payload.chrome === false ? null : await runScript('check-overflow.mjs', [deckFile]);
      return send(res, 200, { audit, overflow });
    }

    if (route === 'comments') {
      let list = readComments(deckFile);
      if (payload.action === 'add') {
        const text = String(payload.text || '').trim();
        if (!text) return send(res, 400, { error: 'comentario vacio' });
        list.push({
          id: randomBytes(4).toString('hex'), status: 'draft', createdAt: new Date().toISOString(),
          slide: Number(payload.slide) || 1, label: String(payload.label || ''), text,
          target: payload.target && typeof payload.target === 'object' ? {
            tag: String(payload.target.tag || ''), classes: String(payload.target.classes || ''),
            text: String(payload.target.text || '').slice(0, 200), html: String(payload.target.html || '').slice(0, 800),
          } : null,
        });
      } else if (payload.action === 'remove') {
        list = list.filter((c) => c.id !== payload.id);
      } else if (payload.action === 'send') {
        const now = new Date().toISOString();
        list = list.map((c) => (c.status === 'draft' ? { ...c, status: 'sent', sentAt: now } : c));
      } else return send(res, 400, { error: 'accion desconocida' });
      writeComments(deckFile, list);
      return send(res, 200, { comments: list });
    }

    return send(res, 404, { error: 'no existe' });
  };

  const server = http.createServer(async (req, res) => {
    try {
      const addr = server.address();
      const hostOk = [`127.0.0.1:${addr.port}`, `localhost:${addr.port}`].includes(req.headers.host);
      if (!hostOk) return send(res, 403, 'host no permitido');
      const url = new URL(req.url, `http://${req.headers.host}`);
      const cookieOk = (req.headers.cookie || '').split(/;\s*/).includes(`sz_studio=${token}`);

      // Entrada: el token de la URL se cambia por una cookie de sesion.
      if (url.pathname === '/' && url.searchParams.get('t') === token) {
        return send(res, 200, readFileSync(path.join(STUDIO_DIR, 'index.html')), {
          'Content-Type': MIME['.html'],
          'Set-Cookie': `sz_studio=${token}; HttpOnly; SameSite=Strict; Path=/`,
        });
      }
      if (!cookieOk) return send(res, 403, 'sesion de Studio no valida: abrir la URL completa que imprime `slizdeck studio`');
      if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) {
        return send(res, 403, 'origen no permitido');
      }

      if (url.pathname === '/') return send(res, 200, readFileSync(path.join(STUDIO_DIR, 'index.html')), { 'Content-Type': MIME['.html'] });
      if (url.pathname === '/__deck') {
        const mode = url.searchParams.has('preview') ? 'preview' : url.searchParams.has('thumb') ? 'thumb' : 'edit';
        return send(res, 200, deckPage(mode), { 'Content-Type': MIME['.html'] });
      }
      if (url.pathname.startsWith('/__api/')) return await api(req, res, url.pathname.slice(7), url);

      // Estaticos: los del editor bajo /__studio/, el resto desde la carpeta del deck.
      const isStudio = url.pathname.startsWith('/__studio/');
      const baseDir = isStudio ? STUDIO_DIR : deckDir;
      const rel = decodeURIComponent(isStudio ? url.pathname.slice(10) : url.pathname.slice(1));
      const target = path.resolve(baseDir, rel);
      let real;
      try { real = realpathSync(target); } catch { return send(res, 404, 'no existe'); }
      const baseReal = realpathSync(baseDir);
      if (real !== baseReal && !real.startsWith(baseReal + path.sep)) return send(res, 403, 'fuera de la carpeta del deck');
      if (!statSync(real).isFile()) return send(res, 404, 'no existe');
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(real).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      });
      createReadStream(real).pipe(res);
      return undefined;
    } catch (e) {
      return send(res, 500, { error: String(e && e.message ? e.message : e) });
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const p = server.address().port;
      resolve({
        server, token, port: p, file: deckFile,
        url: `http://127.0.0.1:${p}/?t=${token}`,
        close: () => new Promise((done) => {
          unwatchFile(deckFile);
          for (const res of clients) res.end();
          server.close(() => done());
          server.closeAllConnections?.();
        }),
      });
    });
  });
}

/* ── CLI ────────────────────────────────────────────────────────────────── */

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]]
      : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* sin navegador: la URL ya esta impresa */ }
}

function printComment(c) {
  console.log(`\n[${c.id}] slide ${String(c.slide).padStart(2, '0')}${c.label ? ` · ${c.label}` : ''} (${c.status})`);
  console.log(`  ${c.text}`);
  if (c.target) {
    console.log(`  sobre: <${c.target.tag}${c.target.classes ? ` class="${c.target.classes}"` : ''}> "${c.target.text}"`);
  }
}

async function commentsCli(args) {
  const at = args.indexOf('--resolve');
  const file = args.find((a, i) => !a.startsWith('--') && (at === -1 || i !== at + 1));
  if (!file || !existsSync(file)) { console.error('uso: studio comments <deck.html> [--wait] [--json] [--resolve <id|all>]'); process.exit(1); }
  const json = args.includes('--json');

  if (at !== -1) {
    const id = args[at + 1];
    if (!id) { console.error('--resolve necesita un id o "all"'); process.exit(1); }
    const list = readComments(file);
    const hit = list.filter((c) => c.status !== 'resolved' && (id === 'all' || c.id === id));
    if (!hit.length) { console.error(`no hay comentario pendiente con id ${id}`); process.exit(1); }
    writeComments(file, list.map((c) => (hit.includes(c) ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString() } : c)));
    console.log(`✓ ${hit.length} comentario(s) resuelto(s)`);
    return;
  }

  const pending = () => readComments(file).filter((c) => c.status === 'sent');
  if (args.includes('--wait')) {
    // Bloquea hasta que el usuario aprieta "Enviar al agente" en el editor.
    while (!pending().length) await new Promise((r) => setTimeout(r, 700));
    const batch = pending();
    writeComments(file, readComments(file).map((c) => (c.status === 'sent' ? { ...c, status: 'delivered' } : c)));
    if (json) console.log(JSON.stringify({ deck: file, comments: batch }, null, 2));
    else { console.log(`${batch.length} comentario(s) enviados desde Studio para ${file}:`); batch.forEach(printComment); }
    return;
  }

  const open = readComments(file).filter((c) => c.status !== 'resolved');
  if (json) { console.log(JSON.stringify({ deck: file, comments: open }, null, 2)); return; }
  if (!open.length) { console.log('sin comentarios pendientes'); return; }
  console.log(`${open.length} comentario(s) sin resolver en ${file}:`);
  open.forEach(printComment);
  console.log('\nResolver: studio comments <deck.html> --resolve <id|all>');
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'comments') return commentsCli(args.slice(1));

  const file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.error('uso: node scripts/studio.mjs <deck.html> [--port=N] [--no-open]'); process.exit(1); }
  if (!existsSync(file)) { console.error(`no existe el archivo: ${file}`); process.exit(1); }
  const portArg = args.find((a) => a.startsWith('--port='));
  let studio;
  try {
    studio = await createStudio({ file, port: portArg ? Number(portArg.slice(7)) : 0 });
  } catch (e) {
    console.error(e.code === 'EADDRINUSE' ? `el puerto ${portArg.slice(7)} esta ocupado` : e.message);
    process.exit(1);
  }
  console.log(`Slizdeck Studio · ${path.basename(studio.file)}`);
  console.log(`  ${studio.url}`);
  console.log('  Los cambios se guardan directo en el archivo. Ctrl+C para cerrar.');
  if (!args.includes('--no-open')) openBrowser(studio.url);
  process.on('SIGINT', () => { studio.close().then(() => process.exit(0)); });
}

// realpath: la skill puede estar instalada como symlink a un clon.
const invoked = (() => { try { return realpathSync(process.argv[1]); } catch { return ''; } })();
if (invoked === fileURLToPath(import.meta.url)) main();
