/**
 * slizdeck · deck-html
 *
 * Lectura estatica del HTML de un deck, compartida por los scripts que no
 * necesitan Chrome (audit, score-deck) y por los que tienen que contar
 * slides antes de levantarlo (shoot, export-pdf, export-pptx).
 */

/** Comentarios reemplazados por espacios: mismos offsets, sin su contenido. */
export const maskComments = (html) => html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));

/** Cantidad de <section> dentro de <deck-stage>, o 0 si no es un deck. */
export function countSlides(html) {
  const stage = /<deck-stage[^>]*>([\s\S]*?)<\/deck-stage>/.exec(maskComments(html));
  return stage ? [...stage[1].matchAll(/<section\b/g)].length : 0;
}

/**
 * "--slides=1,3-5" → [1,3,4,5]. Sin spec, todas. Un formato que no entiende
 * o un numero fuera del deck termina el proceso con un error: nunca se
 * exporta o captura "nada" y se reporta exito.
 */
export function parseSlideRange(spec, max) {
  if (!spec) return Array.from({ length: max }, (_, i) => i + 1);
  const out = new Set();
  for (const part of spec.split(',').map((p) => p.trim())) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) {
      console.error(`--slides: no entiendo "${part}" (formatos: 3, 3-5, 1,4,7-9)`);
      process.exit(1);
    }
    for (let i = Number(m[1]); i <= Number(m[2] || m[1]); i++) out.add(i);
  }
  const picked = [...out].sort((a, b) => a - b);
  const fuera = picked.filter((n) => n < 1 || n > max);
  if (fuera.length) {
    console.error(`--slides: el deck tiene ${max} slides, no existe ${fuera.join(', ')}`);
    process.exit(1);
  }
  return picked;
}

/* Clases de estructura comun a casi toda slide: no cuentan para decidir si
   dos slides tienen el mismo layout. */
const COMMON = /^(reveal|r-\w+|is-on|eyebrow|title|subtitle|footer|num|left|pad|center|act-marker|step-num|step-total|stagger|grad|grad-word|unit|cover|cover-md|ts-title|ts-tagline|payoff|lead|sub|hl)$/;
const VISUAL = /<(img|svg|figure|table|canvas)\b|data-counter=|class="[^"]*\b(sz-chart|sz-timeline|card|pq-card|metrica|metricas|barras|prop|split|bleed|pipe-card)\b/;

/**
 * Cada slide con lo que ve la audiencia: palabras en pantalla (sin footer,
 * notas, tablas ni graficas, que son datos y no discurso), firma de
 * estructura, si tiene elemento visual, si tiene notas.
 */
export function slides(html) {
  const visible = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, (m) => (/speaker-notes/.test(m) ? m : ''))
    .replace(/<style[\s\S]*?<\/style>/g, '');
  let jsonNotes = [];
  try { jsonNotes = JSON.parse(/<script[^>]*id="speaker-notes"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] || '[]'); } catch (e) { jsonNotes = []; }
  const body = /<deck-stage[^>]*>([\s\S]*)<\/deck-stage>/.exec(visible)?.[1] || '';
  return [...body.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map((m, i) => {
    const [, attrs, inner] = m;
    const label = /data-label="([^"]*)"/.exec(attrs)?.[1] || `slide ${i + 1}`;
    const onScreen = inner.replace(/<aside class="notes"[\s\S]*?<\/aside>/g, ' ')
      .replace(/<div class="footer"[\s\S]*?<\/div>\s*<\/div>/g, ' ');
    const text = onScreen.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<table[\s\S]*?<\/table>/g, ' ')
      .replace(/<figure[\s\S]*?<\/figure>/g, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;|&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
    const classes = new Set();
    for (const c of inner.matchAll(/class="([^"]*)"/g)) for (const t of c[1].split(/\s+/)) if (t && !COMMON.test(t)) classes.add(t);
    const isStatic = /data-steps="1"/.test(attrs);
    return {
      label, text, words,
      sig: [...classes].sort().join(' '),
      visual: VISUAL.test(onScreen),
      notes: /<aside class="notes"[^>]*>[\s\S]*?\S[\s\S]*?<\/aside>/.test(inner) || (typeof jsonNotes[i] === 'string' && jsonNotes[i].trim().length > 0),
      reveals: (inner.match(/class="[^"]*\breveal\b/g) || []).length,
      // Portada, transiciones y standby: no son slides de contenido.
      special: (/\bclass="[^"]*\bgrad\b/.test(attrs) && /h1 class="cover/.test(inner))
        || (isStatic && /class="ts-title/.test(inner))
        || /\bstandby\b/.test(inner) || /standby/i.test(label),
    };
  });
}
