#!/usr/bin/env node
/**
 * slizdeck · export-pptx
 *
 * Convierte un deck HTML de slizdeck en un .pptx EDITABLE: cada slide se
 * reconstruye con cajas de texto y formas nativas de PowerPoint, no como
 * imagen. Se puede abrir y editar en PowerPoint o Google Slides.
 *
 * Lee los design tokens del :root del propio HTML, asi el .pptx sale con la
 * paleta y jerarquia tipografica del deck sin configurar nada aparte.
 *
 *   node scripts/export-pptx.mjs deck.html [salida.pptx]
 *
 * Limitaciones inherentes a PPTX (documentadas, no bugs):
 *  - Las animaciones no se trasladan: se exporta el estado final de cada slide.
 *  - Las fuentes web se mapean a fuentes seguras de Office (ver FONT_FALLBACK):
 *    una fuente no instalada en la maquina del lector se sustituye sola y
 *    rompe el layout, asi que se prefiere uniformidad a fidelidad exacta.
 *  - Los gradientes de fondo se aplanan al color dominante.
 *  - Las imagenes (patron .split/.bleed) no se embeben como archivo — sale
 *    una forma placeholder con el alt como etiqueta, para mantener el
 *    principio de cero imagenes incrustadas (ppt/media/ vacio).
 *
 * extractSlide() reconoce un set cerrado de clases (ver reference/deck-
 * schema.md y media-and-data.md). Si se agrega un patron nuevo a esos
 * catalogos con una clase que no esta aqui, su contenido se pierde en
 * silencio al exportar — no hay warning. Extenderlo es la forma correcta
 * de agregar soporte, no un post-proceso sobre el .pptx ya generado.
 */

import { parse } from 'node-html-parser';
import PptxGenJS from 'pptxgenjs';
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

/* ── Lienzo ──────────────────────────────────────────────────────────────
   El deck se disena sobre 1920x1080 px; PPTX 16:9 mide 13.333 x 7.5 in.
   1 px = 13.333/1920 in, y como 1 pt = 1/72 in, 1 px = 0.5 pt.            */
const DESIGN_W = 1920, DESIGN_H = 1080;
const SLIDE_W = 13.333, SLIDE_H = 7.5;
const PX_TO_IN = SLIDE_W / DESIGN_W;
const px = (v) => +(v * PX_TO_IN).toFixed(4);
const pt = (v) => Math.round(v * 0.5);

/* Fuentes web -> fuentes que Office tiene garantizadas. Conserva el
   contraste serif/sans, que es parte del sistema visual. */
const FONT_FALLBACK = [
  [/mono|consolas|menlo/i, 'Consolas'],
  // 'sans-serif' contiene 'serif': la sans se evalua primero y el patron
  // serif exige que no venga precedido de 'sans-'.
  [/ibm plex sans|inter|helvetica|arial|sans-serif/i, 'Calibri'],
  [/newsreader|georgia|times|(?<!sans-)serif/i, 'Cambria'],
];
const safeFont = (stack = '') => {
  for (const [re, font] of FONT_FALLBACK) if (re.test(stack)) return font;
  return 'Calibri';
};

/* ── Tokens ──────────────────────────────────────────────────────────── */
function readTokens(html) {
  const root = /:root\s*\{([\s\S]*?)\}/.exec(html)?.[1] ?? '';
  const val = (name, fallback) => {
    const m = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(root);
    return m ? m[1].trim() : fallback;
  };
  const hex = (name, fallback) => {
    const raw = val(name, fallback);
    const m = /#([0-9a-f]{6})/i.exec(raw);
    return m ? m[1].toUpperCase() : fallback.replace('#', '').toUpperCase();
  };
  return {
    primary: hex('cs-primary', '#0E7C66'),
    secondary: hex('cs-secondary', '#1E3A5F'),
    accent: hex('cs-accent', '#AD5407'),
    cream: hex('cs-cream', '#F7F6F2'),
    black: hex('cs-black', '#000000'),
    body: hex('cs-body', '#454545'),
    muted: hex('cs-muted', '#65696F'),
    white: hex('cs-white', '#FFFFFF'),
    fontHeading: safeFont(val('cs-font-heading', 'serif')),
    fontBody: safeFont(val('cs-font-sans', 'sans-serif')),
    padX: parseInt(val('cs-pad-x', '120px'), 10),
    padTop: parseInt(val('cs-pad-top', '96px'), 10),
    padBottom: parseInt(val('cs-pad-bottom', '120px'), 10),
  };
}

/* ── Extraccion de contenido ─────────────────────────────────────────────
   Se apoya en las convenciones de clase del propio template de slizdeck
   (ver reference/deck-schema.md), no en heuristicas fragiles.            */
const clean = (el) => el?.textContent.replace(/\s+/g, ' ').trim() || '';

function counterText(el) {
  // En el HTML el contador arranca en 0 y JS lo anima hasta data-counter.
  // El .pptx es estatico: se escribe directamente la cifra final.
  const target = parseInt(el.getAttribute('data-counter'), 10);
  const unit = clean(el.querySelector('.unit'));
  if (!Number.isFinite(target)) return clean(el);
  const n = target >= 100000 ? `${(target / 1000).toFixed(0)}k`
          : target >= 1000   ? `${(target / 1000).toFixed(1)}k`
          : String(target);
  return n + unit;
}

// El propio deck-schema documenta .card como el unico contenedor con html
// de clase abierta; todo lo demas (ej. el texto de un patron .split) vive
// en tags sueltos (h3/p) que hay que reconocer por ancestro, no por clase.
const hasAncestorClass = (el, cls) => {
  for (let n = el?.parentNode; n; n = n.parentNode) {
    if ((n.getAttribute?.('class') || '').split(/\s+/).includes(cls)) return true;
  }
  return false;
};

function extractSlide(section) {
  const isGrad = (section.getAttribute('class') || '').includes('grad');
  const centered = !!section.querySelector('.pad.center');
  const out = { isGrad, centered, blocks: [], footer: '', cards: [], metrics: [] };

  const push = (role, text, extra = {}) => {
    if (text) out.blocks.push({ role, text, ...extra });
  };

  push('eyebrow', clean(section.querySelector('.eyebrow')));
  // Los tres tamanos de display del sistema se conservan tal cual: la escala
  // extrema (168 vs 76 px) es parte de la jerarquia, no un detalle.
  push('display', clean(section.querySelector('h1.cover')), { size: 168 });
  push('display', clean(section.querySelector('h1.cover-md')), { size: 132 });
  push('display', clean(section.querySelector('.ts-title')), { size: 168 });
  push('headline', clean(section.querySelector('h2.title')));
  push('subtitle', clean(section.querySelector('.subtitle')));
  push('subtitle', clean(section.querySelector('.ts-tagline')));
  push('payoff', clean(section.querySelector('.payoff')));

  // Imagen suelta en la slide (patron .split/.bleed, o un <img> de ancho
  // completo fuera de cualquier contenedor con clase): no se embebe el
  // archivo (principio "cero imagenes" del export, ppt/media/ queda
  // vacio), se deja una forma placeholder con el alt como etiqueta. No
  // acotar el selector a .split/.bleed — cualquier <img> que no dependa de
  // esas clases especificas (ej. una imagen de ancho completo sola en
  // .pad) se perdia en silencio antes de este fix.
  const img = [...section.querySelectorAll('img')].find(
    (el) => !hasAncestorClass(el, 'card') && !hasAncestorClass(el, 'footer'),
  );
  if (img) push('image', img.getAttribute('alt') || 'Imagen');

  const counter = section.querySelector('[data-counter]');
  if (counter && !hasAncestorClass(counter, 'metricas')) push('stat', counterText(counter));

  // Texto suelto de apoyo que no cae en ninguna clase conocida
  for (const sel of ['.stat-caption', '.ask-line', '.stat-source']) {
    push(sel === '.stat-source' ? 'caption' : 'body', clean(section.querySelector(sel)));
  }

  // Parrafos sueltos (ej. la mitad de texto de un patron .split) que no
  // esten ya cubiertos por el body de una .card.
  for (const p of section.querySelectorAll('p')) {
    if (!hasAncestorClass(p, 'card')) push('body', clean(p));
  }

  // Listas sueltas (ej. .list-strike u otra <ul>/<ol> ad-hoc que no este
  // documentada como patron fijo): cada <li> es una linea, .out se marca
  // tachado en vez de perderse.
  for (const list of section.querySelectorAll('ul, ol')) {
    if (hasAncestorClass(list, 'card')) continue;
    const items = [...list.querySelectorAll('li')].map((li) => ({
      text: clean(li),
      out: (li.getAttribute('class') || '').split(/\s+/).includes('out'),
    })).filter((i) => i.text);
    if (items.length) out.blocks.push({ role: 'list', text: '', items });
  }

  for (const card of section.querySelectorAll('.card')) {
    out.cards.push({
      num: clean(card.querySelector('.card-num')),
      eyebrow: clean(card.querySelector('.card-eyebrow')),
      title: clean(card.querySelector('h3')),
      body: clean(card.querySelector('p')),
    });
  }

  // Fila de metricas (patron .metricas de media-and-data.md): cada .m trae
  // una cifra (.n, texto o [data-counter]) y una etiqueta (.l).
  for (const m of section.querySelectorAll('.metricas .m')) {
    const nEl = m.querySelector('.n');
    const n = nEl ? (nEl.getAttribute('data-counter') ? counterText(nEl) : clean(nEl)) : '';
    const l = clean(m.querySelector('.l'));
    if (n || l) out.metrics.push({ n, l });
  }

  out.footer = clean(section.querySelector('.footer'));
  return out;
}

/* ── Composicion de la slide en PPTX ─────────────────────────────────── */
const STYLE = {
  eyebrow:  { size: 24, bold: true,  charSpacing: 4, upper: true, font: 'body' },
  display:  { size: 168, bold: false, font: 'heading' },
  headline: { size: 76, bold: false, font: 'heading' },
  subtitle: { size: 36, bold: false, font: 'body' },
  payoff:   { size: 30, bold: true,  font: 'body' },
  stat:     { size: 140, bold: false, font: 'heading' },
  body:     { size: 30, bold: false, font: 'body' },
  caption:  { size: 20, bold: false, font: 'body' },
};

function renderSlide(pptx, data, t) {
  const slide = pptx.addSlide();
  // PPTX no hace gradientes de forma portable: se aplana al color dominante.
  slide.background = { color: data.isGrad ? t.primary : t.cream };

  const onDark = data.isGrad;
  const contentW = DESIGN_W - t.padX * 2;
  let y = t.padTop;

  const colorFor = (role) => {
    if (onDark) return role === 'eyebrow' ? t.white : t.white;
    if (role === 'eyebrow') return t.primary;
    if (role === 'stat') return t.accent;
    if (role === 'caption') return t.muted;
    if (role === 'headline' || role === 'display' || role === 'payoff') return t.black;
    return t.body;
  };

  // Bloques de texto apilados verticalmente (mas la forma placeholder de imagen)
  for (const b of data.blocks) {
    if (b.role === 'list') {
      const rowH = 52;
      const h = b.items.length * rowH;
      slide.addText(
        b.items.map((it) => ({
          text: it.text,
          options: { strike: it.out, color: it.out ? t.muted : t.body, breakLine: true },
        })),
        {
          x: px(t.padX), y: px(y), w: px(contentW), h: px(h),
          fontSize: pt(28), fontFace: t.fontBody, color: t.body,
          bullet: { code: '2022' }, lineSpacingMultiple: 1.3, valign: 'top',
        },
      );
      y += h + 34;
      continue;
    }
    if (b.role === 'image') {
      const h = 280;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px(t.padX), y: px(y), w: px(contentW), h: px(h),
        fill: { color: onDark ? 'FFFFFF' : t.cream === 'FFFFFF' ? 'F4F5F6' : t.white },
        line: { color: 'E6E6E6', width: 1 }, rectRadius: 0.1,
      });
      slide.addText(`[Imagen: ${b.text}]`, {
        x: px(t.padX), y: px(y), w: px(contentW), h: px(h),
        fontSize: pt(22), color: t.muted, fontFace: t.fontBody,
        align: 'center', valign: 'middle', italic: true,
      });
      y += h + 34;
      continue;
    }
    const base = STYLE[b.role] ?? STYLE.body;
    const s = { ...base, size: b.size ?? base.size };
    const lineH = s.size * 1.25;
    const est = Math.max(lineH, Math.ceil(b.text.length / (contentW / (s.size * 0.52))) * lineH);
    slide.addText(s.upper ? b.text.toUpperCase() : b.text, {
      x: px(t.padX), y: px(y), w: px(contentW), h: px(est),
      fontSize: pt(s.size),
      bold: s.bold,
      color: colorFor(b.role),
      fontFace: s.font === 'heading' ? t.fontHeading : t.fontBody,
      align: data.centered ? 'center' : 'left',
      valign: 'top',
      charSpacing: s.charSpacing,
      lineSpacingMultiple: 1.15,
      fit: 'shrink',
    });
    y += est + (b.role === 'eyebrow' ? 18 : 34);
  }

  // Fila de metricas: cifra grande + etiqueta, separadas por un filete superior
  if (data.metrics.length) {
    const gap = 56;
    const n = data.metrics.length;
    const colW = (contentW - gap * (n - 1)) / n;
    data.metrics.forEach((m, i) => {
      const mx = t.padX + i * (colW + gap);
      slide.addShape(pptx.ShapeType.rect, {
        x: px(mx), y: px(y), w: px(colW), h: px(2),
        fill: { color: 'D9D9D9' },
      });
      slide.addText(m.n, {
        x: px(mx), y: px(y + 20), w: px(colW), h: px(70),
        fontSize: pt(56), bold: false, color: t.black, fontFace: t.fontHeading, fit: 'shrink',
      });
      slide.addText(m.l, {
        x: px(mx), y: px(y + 96), w: px(colW), h: px(34),
        fontSize: pt(24), color: t.muted, fontFace: t.fontBody,
      });
    });
    y += 150;
  }

  // Grid de cards: se reparten el ancho disponible
  if (data.cards.length) {
    const gap = 32;
    const n = data.cards.length;
    const cardW = (contentW - gap * (n - 1)) / n;
    const cardH = 300;
    data.cards.forEach((c, i) => {
      const cx = t.padX + i * (cardW + gap);
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px(cx), y: px(y), w: px(cardW), h: px(cardH),
        fill: { color: t.white },
        line: { color: 'E6E6E6', width: 1 },
        rectRadius: 0.12,
      });
      const label = c.num || c.eyebrow;
      let cy = y + 34;
      if (label) {
        slide.addText(label.toUpperCase(), {
          x: px(cx + 30), y: px(cy), w: px(cardW - 60), h: px(30),
          fontSize: pt(22), bold: true, color: label === c.num ? t.primary : t.muted,
          fontFace: t.fontBody, charSpacing: 3,
        });
        cy += 44;
      }
      if (c.title) {
        slide.addText(c.title, {
          x: px(cx + 30), y: px(cy), w: px(cardW - 60), h: px(46),
          fontSize: pt(32), bold: true, color: t.black, fontFace: t.fontBody,
        });
        cy += 56;
      }
      if (c.body) {
        slide.addText(c.body, {
          x: px(cx + 30), y: px(cy), w: px(cardW - 60), h: px(cardH - (cy - y) - 30),
          fontSize: pt(24), color: t.body, fontFace: t.fontBody,
          valign: 'top', lineSpacingMultiple: 1.25,
        });
      }
    });
    y += cardH + 34;
  }

  if (data.footer) {
    slide.addText(data.footer, {
      x: px(t.padX), y: px(DESIGN_H - t.padBottom + 24), w: px(contentW), h: px(34),
      fontSize: pt(24), color: onDark ? t.white : t.muted,
      fontFace: t.fontBody, align: 'right', valign: 'middle',
      transparency: onDark ? 30 : 0,
    });
  }
  return slide;
}

/* ── Entrada ─────────────────────────────────────────────────────────── */
async function main() {
  const [input, outArg] = process.argv.slice(2);
  if (!input) {
    console.error('uso: node scripts/export-pptx.mjs <deck.html> [salida.pptx]');
    process.exit(1);
  }
  const out = outArg || basename(input, extname(input)) + '.pptx';

  const html = readFileSync(input, 'utf8');
  const tokens = readTokens(html);
  const doc = parse(html);
  const sections = doc.querySelectorAll('deck-stage > section');

  if (!sections.length) {
    console.error('No se encontraron slides (<deck-stage> > <section>). ¿Es un deck de slizdeck?');
    process.exit(1);
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'slizdeck';
  const title = clean(doc.querySelector('title')) || basename(out, '.pptx');
  pptx.title = title;

  for (const section of sections) renderSlide(pptx, extractSlide(section), tokens);

  await pptx.writeFile({ fileName: out });
  console.log(`✓ ${out} · ${sections.length} slides · ${tokens.fontHeading}/${tokens.fontBody}`);
  console.log('  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).');
}

main().catch((err) => { console.error(err); process.exit(1); });
