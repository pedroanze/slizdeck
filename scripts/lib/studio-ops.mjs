/**
 * slizdeck · studio-ops
 *
 * Las ediciones de Studio como funciones puras sobre el HTML fuente:
 * applyOp(html, op) → { html, result }. Cada op localiza su elemento con el
 * mapa de source-map.mjs y toca solo ese rango, para que el diff del deck
 * sea el cambio pedido y nada mas.
 *
 * Una op que no se puede aplicar con seguridad lanza OpError con el motivo;
 * nunca se guarda un resultado a medias.
 */

import { parseDeck, slideNodes, getAttr, withAttr, mergeStyle } from './source-map.mjs';
import { renumberHtml } from './renumber.mjs';

export class OpError extends Error {}

const INLINE = new Set(['a', 'abbr', 'b', 'br', 'cite', 'code', 'del', 'em', 'i', 'ins', 'kbd', 'mark', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'wbr']);
const ATTR_OK = /^(src|alt|href|title|poster|data-[a-z0-9-]+)$/;
const STYLE_OK = /^(--[\w-]+|[a-z-]+)$/;

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function tree(html) {
  const t = parseDeck(html);
  if (!t) throw new OpError('el archivo no tiene <deck-stage>: no es un deck de slizdeck');
  return t;
}

function nodeOf(t, id) {
  const n = t.nodes[id];
  if (!Number.isInteger(id) || !n || n.raw) throw new OpError(`no existe el elemento ${id} en el fuente`);
  if (n === t.stage) throw new OpError('el <deck-stage> no se edita desde Studio');
  return n;
}

function slideOf(t, index) {
  const list = slideNodes(t);
  const n = list[index];
  if (!Number.isInteger(index) || !n) throw new OpError(`no existe la slide ${index + 1}`);
  return { list, node: n };
}

function sectionOf(t, node) {
  let n = node;
  while (n.parent && n.parent !== t.stage) n = n.parent;
  return n;
}

function descendants(node, out = []) {
  for (const c of node.children) { out.push(c); descendants(c, out); }
  return out;
}

/** true si el contenido del nodo es solo texto y etiquetas inline: se puede editar como texto. */
export function isTextNode(node) {
  return !node.void && !node.raw && !node.implicit && !node.foreign
    && descendants(node).every((d) => INLINE.has(d.tag) && !d.implicit);
}

/**
 * innerHTML que llega del navegador → HTML inline seguro para el fuente.
 * Quita lo que agrega el editor o contenteditable (atributos propios,
 * bloques por cada Enter) y cualquier etiqueta que no sea inline.
 */
export function sanitizeInline(input) {
  let s = String(input).replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  let seenContent = false;
  s = s.replace(/<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|[^<]+|</g, (m, slash, name, attrs) => {
    if (!name) {
      if (m === '<') return '&lt;';
      if (m.trim()) seenContent = true;
      return m;
    }
    const tag = name.toLowerCase();
    if (tag === 'div' || tag === 'p') {
      // contenteditable parte en bloques: cada bloque despues del primero es un salto.
      if (slash) return '';
      const br = seenContent ? '<br>' : '';
      return br;
    }
    if (!INLINE.has(tag)) return '';
    seenContent = true;
    if (slash) return tag === 'br' || tag === 'wbr' ? '' : `</${tag}>`;
    const kept = [];
    for (const a of attrs.matchAll(/\s+([^\s"'<>/=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g)) {
      const an = a[1].toLowerCase();
      if (/^on/.test(an) || an === 'contenteditable' || an === 'spellcheck' || an.startsWith('data-sz-')) continue;
      if ((an === 'href' || an === 'src') && /^\s*["']?\s*javascript:/i.test(a[2] || '')) continue;
      kept.push(a[2] === undefined ? an : `${an}=${a[2]}`);
    }
    return `<${tag}${kept.length ? ` ${kept.join(' ')}` : ''}>`;
  });
  // contenteditable deja un <br> de relleno al final.
  return s.replace(/(<br>\s*)+$/, '');
}

/** Rango de la linea completa del elemento si esta solo en ella; si no, el del elemento. */
function lineRange(html, node) {
  const lineStart = html.lastIndexOf('\n', node.openStart - 1) + 1;
  const indent = html.slice(lineStart, node.openStart);
  const alone = /^[ \t]*$/.test(indent);
  let end = node.closeEnd;
  if (alone) {
    const rest = /^[ \t]*\r?\n/.exec(html.slice(end));
    if (rest) end += rest[0].length; else return { start: node.openStart, end, indent: '', alone: false };
  }
  return { start: alone ? lineStart : node.openStart, end, indent: alone ? indent : '', alone };
}

/** Los trozos del stage: cada slide con el espacio y los comentarios que la preceden. */
function slideChunks(html, t) {
  const list = slideNodes(t);
  let from = t.stage.openEnd;
  const chunks = list.map((n) => {
    const text = html.slice(from, n.closeEnd);
    from = n.closeEnd;
    return text;
  });
  return { head: html.slice(0, t.stage.openEnd), chunks, tail: html.slice(from) };
}

function renumbered(html) {
  const r = renumberHtml(html);
  return r.n ? r.html : html;
}

const OPS = {
  setText(html, { id, html: inner }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    if (!isTextNode(n)) throw new OpError('este elemento no es un bloque de texto simple: se edita su contenido interno');
    const clean = sanitizeInline(inner);
    return { html: html.slice(0, n.openEnd) + clean + html.slice(n.closeStart), result: { html: clean } };
  },

  setStyle(html, { id, props }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    for (const [k, v] of Object.entries(props || {})) {
      if (!STYLE_OK.test(k)) throw new OpError(`propiedad de estilo no permitida: ${k}`);
      if (v !== null && /[<>{}]|javascript:|expression\(/i.test(String(v))) throw new OpError(`valor de estilo no permitido en ${k}`);
    }
    const merged = mergeStyle(getAttr(html, n, 'style') || '', props || {});
    return { html: withAttr(html, n, 'style', merged || null), result: { style: merged } };
  },

  setAttr(html, { id, name, value }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    if (!ATTR_OK.test(name) || name.startsWith('data-sz-')) throw new OpError(`atributo no permitido: ${name}`);
    if (value !== null && /^\s*javascript:/i.test(String(value))) throw new OpError('valor no permitido');
    return { html: withAttr(html, n, name, value === null ? null : String(value)), result: {} };
  },

  /* Paso de animacion del elemento: step null lo deja estatico. Sube
     data-steps de la slide si hace falta, nunca lo baja (otros patrones
     —contadores, magic-move, 3D— tambien cuentan pasos). */
  setStep(html, { id, step }) {
    let t = tree(html);
    let n = nodeOf(t, id);
    if (step !== null && (!Number.isInteger(step) || step < 1 || step > 20)) throw new OpError('paso invalido');
    const cls = (getAttr(html, n, 'class') || '').split(/\s+/).filter(Boolean);
    const next = step === null ? cls.filter((c) => c !== 'reveal' && !/^r-[\w-]+$/.test(c)) : (cls.includes('reveal') ? cls : [...cls, 'reveal']);
    let out = withAttr(html, n, 'class', next.length ? next.join(' ') : null);
    n = nodeOf(tree(out), id);
    out = withAttr(out, n, 'data-step', step === null ? null : String(step));
    t = tree(out);
    const sec = sectionOf(t, t.nodes[id]);
    const steps = parseInt(getAttr(out, sec, 'data-steps') || '1', 10) || 1;
    if (step !== null && step > steps) {
      out = withAttr(out, sec, 'data-steps', String(step));
    }
    // Una slide con reveals entra en el paso 0; una estatica vive en el 1.
    t = tree(out);
    const secNow = sectionOf(t, t.nodes[id]);
    const hasReveal = /class="[^"]*\breveal\b/.test(out.slice(secNow.openEnd, secNow.closeStart));
    out = withAttr(out, secNow, 'data-current-step', hasReveal ? '0' : (getAttr(out, secNow, 'data-steps') || '1'));
    return { html: out, result: {} };
  },

  removeEl(html, { id }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    if (n.parent === t.stage) throw new OpError('para borrar una slide se usa removeSlide');
    if (n.implicit) throw new OpError('el elemento no tiene cierre explicito en el fuente');
    const r = lineRange(html, n);
    return { html: html.slice(0, r.start) + html.slice(r.end), result: { structural: true } };
  },

  duplicateEl(html, { id }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    if (n.parent === t.stage) throw new OpError('para duplicar una slide se usa duplicateSlide');
    if (n.implicit) throw new OpError('el elemento no tiene cierre explicito en el fuente');
    const r = lineRange(html, n);
    const copy = html.slice(n.openStart, n.closeEnd);
    const insert = r.alone ? `\n${r.indent}${copy}` : copy;
    return { html: html.slice(0, n.closeEnd) + insert + html.slice(n.closeEnd), result: { structural: true } };
  },

  moveSlide(html, { from, to }) {
    const t = tree(html);
    slideOf(t, from); slideOf(t, to);
    const { head, chunks, tail } = slideChunks(html, t);
    chunks.splice(to, 0, chunks.splice(from, 1)[0]);
    return { html: renumbered(head + chunks.join('') + tail), result: { structural: true } };
  },

  duplicateSlide(html, { index }) {
    const t = tree(html);
    slideOf(t, index);
    const { head, chunks, tail } = slideChunks(html, t);
    const warnings = /\sid="/.test(chunks[index]) ? ['la slide duplicada repite atributos id (figuras 3D, anclas): revisarlos'] : [];
    // La copia no arrastra los comentarios que preceden a la original.
    const lead = /^(?:\s|<!--[\s\S]*?-->)*/.exec(chunks[index])[0];
    const gap = /\s*$/.exec(lead)[0] || '\n';
    chunks.splice(index + 1, 0, gap + chunks[index].slice(lead.length));
    return { html: renumbered(head + chunks.join('') + tail), result: { structural: true, warnings } };
  },

  removeSlide(html, { index }) {
    const t = tree(html);
    const { list } = slideOf(t, index);
    if (list.length < 2) throw new OpError('un deck necesita al menos una slide');
    const { head, chunks, tail } = slideChunks(html, t);
    chunks.splice(index, 1);
    return { html: renumbered(head + chunks.join('') + tail), result: { structural: true } };
  },

  setChartData(html, { id, data }) {
    const t = tree(html);
    const n = nodeOf(t, id);
    const script = n.children.find((c) => c.tag === 'script' && /application\/json/.test(html.slice(c.openStart, c.openEnd)));
    if (!script) throw new OpError('el elemento no es una grafica con datos JSON');
    if (!data || typeof data !== 'object') throw new OpError('datos de grafica invalidos');
    // "</" escapado: un cierre de etiqueta dentro del JSON cortaria el bloque.
    const json = JSON.stringify(data).replace(/<\//g, '<\\/');
    return { html: html.slice(0, script.openEnd) + json + html.slice(script.closeStart), result: { structural: true } };
  },

  setNotes(html, { index, text }) {
    const t = tree(html);
    const { node: sec } = slideOf(t, index);
    const paras = String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const inner = paras.map((p) => `<p>${escapeText(p).replace(/\n/g, '<br>')}</p>`).join('');
    const aside = sec.children.find((c) => c.tag === 'aside' && /\bnotes\b/.test(getAttr(html, c, 'class') || ''));
    if (aside) return { html: html.slice(0, aside.openEnd) + inner + html.slice(aside.closeStart), result: {} };
    if (!inner) return { html, result: {} };
    const lineStart = html.lastIndexOf('\n', sec.closeStart - 1) + 1;
    const indent = html.slice(lineStart, sec.closeStart);
    const block = `<aside class="notes">${inner}</aside>`;
    if (!/^[ \t]*$/.test(indent)) {
      return { html: html.slice(0, sec.closeStart) + block + html.slice(sec.closeStart), result: { structural: true } };
    }
    return { html: `${html.slice(0, lineStart)}${indent}  ${block}\n${html.slice(lineStart)}`, result: { structural: true } };
  },
};

export const OP_TYPES = Object.keys(OPS);

export function applyOp(html, op) {
  const fn = op && OPS[op.type];
  if (!fn) throw new OpError(`operacion desconocida: ${op && op.type}`);
  return fn(html, op);
}

/** Aplica una lista de ops en orden; si una falla no se aplica ninguna. */
export function applyOps(html, ops) {
  const results = [];
  let out = html;
  for (const op of ops) {
    const r = applyOp(out, op);
    out = r.html;
    results.push(r.result);
  }
  return { html: out, results };
}
