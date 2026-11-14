/**
 * slizdeck · source-map
 *
 * Mapa entre los elementos de un deck y su posicion en el archivo fuente.
 * Studio lo usa para editar por parches: el DOM en vivo esta mutado por el
 * runtime (.is-on, data-deck-active, el SVG de las graficas, los contadores)
 * y guardarlo tal cual corromperia el deck. En su lugar cada elemento dentro
 * de <deck-stage> se sirve con data-sz-src="N" y cada edicion se aplica al
 * texto fuente en los offsets de ese N. El archivo en disco nunca lleva esos
 * atributos.
 *
 * No es un parser de HTML completo: recorre etiquetas con sus offsets, salta
 * comentarios y el contenido crudo de script/style. Un elemento sin cierre
 * explicito queda marcado `implicit` y las operaciones que necesitan su
 * rango completo lo rechazan en vez de adivinar.
 */

import { maskComments } from './deck-html.mjs';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
export const SRC_ATTR = 'data-sz-src';

/** Fin del tag de apertura que empieza en `start` (indice despues del `>`), respetando comillas. */
function openTagEnd(html, start) {
  let quote = null;
  for (let i = start + 1; i < html.length; i++) {
    const c = html[i];
    if (quote) { if (c === quote) quote = null; } else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i + 1;
  }
  return -1;
}

/**
 * Arbol de elementos dentro de <deck-stage>, en orden de documento.
 * nodes[0] es el propio <deck-stage>. Devuelve null si el HTML no es un deck.
 */
export function parseDeck(html) {
  const masked = maskComments(html);
  // El primer <deck-stage que no este dentro de un <style> o <script>: el CSS
  // y los comentarios de JS del engine tambien lo nombran.
  let stageOpen = null;
  for (const m of masked.matchAll(/<(style|script)\b[\s\S]*?<\/\1\s*>|<deck-stage\b/gi)) {
    if (!m[1]) { stageOpen = m; break; }
  }
  if (!stageOpen) return null;

  const nodes = [];
  const stack = [];
  let i = stageOpen.index;

  const close = (node, at, end, implicit) => {
    node.closeStart = at;
    node.closeEnd = end;
    node.implicit = implicit;
  };

  while (i < html.length) {
    const j = masked.indexOf('<', i);
    if (j === -1) break;
    const next = masked[j + 1];

    if (next === '/') {
      const end = masked.indexOf('>', j);
      if (end === -1) break;
      const name = masked.slice(j + 2, end).trim().toLowerCase();
      const at = stack.map((n) => n.tag).lastIndexOf(name);
      if (at !== -1) {
        // Lo que quedo abierto por encima se cierra aca, sin cierre propio.
        while (stack.length > at + 1) close(stack.pop(), j, j, true);
        close(stack.pop(), j, end + 1, false);
        if (!stack.length) break;   // se cerro <deck-stage>
      }
      i = end + 1;
      continue;
    }

    if (!next || !/[a-zA-Z]/.test(next)) { i = j + 1; continue; }

    const openEnd = openTagEnd(masked, j);
    if (openEnd === -1) break;
    const tag = /^<([a-zA-Z][\w:-]*)/.exec(masked.slice(j, openEnd))[1].toLowerCase();
    const parent = stack[stack.length - 1] || null;
    const node = {
      id: nodes.length, tag, parent, children: [],
      openStart: j, openEnd, closeStart: openEnd, closeEnd: openEnd,
      void: false, raw: RAW.has(tag), implicit: false,
      foreign: tag === 'svg' || tag === 'math' || !!(parent && parent.foreign),
    };
    nodes.push(node);
    if (parent) parent.children.push(node);

    const selfClosed = masked[openEnd - 2] === '/';
    if (VOID.has(tag) || (selfClosed && node.foreign)) {
      node.void = true;
      i = openEnd;
    } else if (node.raw) {
      // Contenido crudo: se busca el cierre en el original, no en el
      // enmascarado (un "<!--" dentro de un script no es un comentario HTML).
      const re = new RegExp(`</${tag}\\s*>`, 'ig');
      re.lastIndex = openEnd;
      const m = re.exec(html);
      if (!m) { close(node, html.length, html.length, true); break; }
      close(node, m.index, m.index + m[0].length, false);
      i = node.closeEnd;
    } else {
      stack.push(node);
      i = openEnd;
    }
  }
  // Fin de archivo con elementos abiertos.
  while (stack.length) close(stack.pop(), html.length, html.length, true);

  return { nodes, stage: nodes[0] };
}

/** Slides: los hijos de <deck-stage> que el engine trata como slide. */
export function slideNodes(tree) {
  return tree.stage.children.filter((n) => !['template', 'script', 'style'].includes(n.tag));
}

/** HTML con data-sz-src="N" en cada elemento del deck (para servir, nunca para guardar). */
export function annotate(html) {
  const tree = parseDeck(html);
  if (!tree) return html;
  let out = html;
  for (let k = tree.nodes.length - 1; k >= 0; k--) {
    const n = tree.nodes[k];
    if (n.raw) continue;
    const at = n.openStart + 1 + n.tag.length;
    out = `${out.slice(0, at)} ${SRC_ATTR}="${n.id}"${out.slice(at)}`;
  }
  return out;
}

/** Inversa de annotate: quita los atributos del editor. */
export function stripAnnotations(html) {
  return html.replace(new RegExp(` ${SRC_ATTR}="\\d+"`, 'g'), '');
}

/* ── Atributos del tag de apertura ──────────────────────────────────────── */

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const encode = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** Atributos de un tag de apertura, con offsets relativos al inicio del tag. */
export function parseAttrs(openTag) {
  const attrs = [];
  const re = /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const nameEnd = /^<[a-zA-Z][\w:-]*/.exec(openTag)[0].length;
  re.lastIndex = nameEnd;
  let m;
  while ((m = re.exec(openTag))) {
    const raw = m[2] ?? m[3] ?? m[4];
    attrs.push({
      name: m[1].toLowerCase(), value: raw === undefined ? '' : decode(raw),
      start: m.index, end: m.index + m[0].length,
    });
  }
  return attrs;
}

export function getAttr(html, node, name) {
  const a = parseAttrs(html.slice(node.openStart, node.openEnd)).find((x) => x.name === name);
  return a ? a.value : null;
}

/** HTML con el atributo puesto (value string) o quitado (value null) en ese nodo. */
export function withAttr(html, node, name, value) {
  const open = html.slice(node.openStart, node.openEnd);
  const a = parseAttrs(open).find((x) => x.name === name);
  let next;
  if (value === null) {
    if (!a) return html;
    next = open.slice(0, a.start) + open.slice(a.end);
  } else {
    const text = ` ${name}="${encode(String(value))}"`;
    if (a) next = open.slice(0, a.start) + text + open.slice(a.end);
    else {
      const at = /\s*\/?>$/.exec(open).index;
      next = open.slice(0, at) + text + open.slice(at);
    }
  }
  return html.slice(0, node.openStart) + next + html.slice(node.openEnd);
}

/* ── style inline ───────────────────────────────────────────────────────── */

/** "a: b; c: url(x;y)" → [[a, b], [c, url(x;y)]] sin partir dentro de parentesis o comillas. */
export function parseStyle(text) {
  const decls = [];
  let depth = 0; let quote = null; let cur = '';
  const flush = () => {
    const k = cur.indexOf(':');
    if (k > 0) decls.push([cur.slice(0, k).trim(), cur.slice(k + 1).trim()]);
    cur = '';
  };
  for (const c of text || '') {
    if (quote) { if (c === quote) quote = null; } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) { flush(); continue; }
    cur += c;
  }
  flush();
  return decls;
}

/**
 * Fusiona props ({nombre: valor | null}) en un style inline. Conserva el
 * orden y el espaciado que ya traia, para que el diff del deck sea minimo.
 */
export function mergeStyle(text, props) {
  const src = text || '';
  const decls = parseStyle(src);
  for (const [name, value] of Object.entries(props)) {
    const at = decls.findIndex(([k]) => k.toLowerCase() === name.toLowerCase());
    if (value === null || value === '') { if (at !== -1) decls.splice(at, 1); }
    else if (at !== -1) decls[at][1] = String(value);
    else decls.push([name, String(value)]);
  }
  const kv = /:\s/.test(src) ? ': ' : ':';
  const sep = /;\s/.test(src) ? '; ' : ';';
  const out = decls.map(([k, v]) => `${k}${kv}${v}`).join(sep);
  return out && /;\s*$/.test(src) ? `${out};` : out;
}
