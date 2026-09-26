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

// Las dos dependencias de la skill solo las usa este script. Se cargan con
// import() para que una instalacion sin `npm install` falle con un mensaje
// que dice que hacer, no con un ERR_MODULE_NOT_FOUND crudo.
import { fileURLToPath } from 'node:url';

let parse, PptxGenJS;
try {
  ({ parse } = await import('node-html-parser'));
  ({ default: PptxGenJS } = await import('pptxgenjs'));
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  const root = fileURLToPath(new URL('..', import.meta.url));
  console.error('✗ faltan las dependencias del export a PPTX (node-html-parser, pptxgenjs).');
  console.error(`  Instálalas con: npm install --prefix "${root}"`);
  console.error('  (o reinstala la skill con: npx slizdeck install)');
  process.exit(1);
}
import { readFileSync, existsSync } from 'node:fs';
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
    cream2: hex('cs-cream-2', '#EDECE6'),
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
  const out = { isGrad, centered, blocks: [], footer: '', cards: [], metrics: [], bars: [], props: [] };

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

  // Frase que interpreta la cifra grande (patron .metrica de
  // media-and-data.md) y cita de fuente. Sin esto, .glosa se perdia del
  // todo: el unico <p> suelto de mas abajo no la agarraba porque no es un
  // <p>, es un <div>.
  push('body', clean(section.querySelector('.metrica .glosa')));
  push('caption', clean(section.querySelector('.stat-source')));

  // Parrafos sueltos (ej. la mitad de texto de un patron .split) que no
  // esten ya cubiertos por el body de una .card/.pq-card/.warn-card.
  for (const p of section.querySelectorAll('p')) {
    const enCard = ['card', 'pq-card', 'warn-card', 'pipe-card'].some((c) => hasAncestorClass(p, c));
    if (!enCard) push('body', clean(p));
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

  // .pq-card (Familia 2, components.md) y .warn-card (card-grid-4col) son
  // variantes del mismo patron con otros nombres de clase — antes solo se
  // buscaba `.card` a secas y las dos caian afuera enteras salvo el <p>
  // suelto (que si lo agarraba el fallback de "parrafos sueltos" de mas
  // abajo). `.pq-consequence` es el remate del patron ("→ De horas a
  // minutos"): perderlo es perder el punto de la card.
  // .pipe-card (flow-pipeline, Familia 5 de components.md) es una tercera
  // variante: sin h3 ni <p>, solo eyebrow + nombre. Entra en el mismo grid
  // de cards que pq-card/warn-card — se pierden las flechas entre pasos
  // (".pipe-arrow", puro conector visual, no contenido: findLostText ya
  // descarta texto de 1-2 caracteres), pero el contenido real de cada paso
  // viaja completo.
  for (const card of section.querySelectorAll('.card, .pq-card, .warn-card, .pipe-card')) {
    const consequence = clean(card.querySelector('.pq-consequence'));
    const body = clean(card.querySelector('p'));
    out.cards.push({
      num: clean(card.querySelector('.card-num, .warn-num')),
      eyebrow: clean(card.querySelector('.card-eyebrow, .pq-eyebrow, .pipe-eyebrow')),
      title: clean(card.querySelector('h3, .pipe-name')),
      body: [consequence, body].filter(Boolean).join('\n'),
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

  // Barras comparativas (patron .barra-fila dentro de .barras,
  // media-and-data.md): una etiqueta de fila + N segmentos con su propio
  // ancho porcentual (inline style="width:X%") y variante de color (a/b/c).
  for (const fila of section.querySelectorAll('.barra-fila')) {
    const etiqueta = clean(fila.querySelector('.etiqueta'));
    const segs = [...fila.querySelectorAll('.barra .seg')].map((seg) => {
      const style = seg.getAttribute('style') || '';
      const widthMatch = /width:\s*([\d.]+)%/.exec(style);
      const cls = (seg.getAttribute('class') || '').split(/\s+/);
      const variant = ['a', 'b', 'c'].find((v) => cls.includes(v)) || 'a';
      return { text: clean(seg), pct: widthMatch ? parseFloat(widthMatch[1]) : 0, variant };
    }).filter((s) => s.pct > 0);
    if (segs.length) out.bars.push({ etiqueta, segs });
  }

  // Progreso/proporcion (patron .prop, media-and-data.md): .lbl trae dos
  // spans (etiqueta izquierda, valor derecha) y .fill guarda la proporcion
  // en la custom property --v (0..1) que el CSS lee para el scaleX.
  for (const prop of section.querySelectorAll('.prop')) {
    const spans = [...prop.querySelectorAll('.lbl span')].map(clean);
    const fill = prop.querySelector('.fill');
    const style = fill ? (fill.getAttribute('style') || '') : '';
    const vMatch = /--v:\s*([\d.]+)/.exec(style);
    const ratio = vMatch ? Math.min(1, Math.max(0, parseFloat(vMatch[1]))) : 0;
    if (spans.length || ratio) {
      out.props.push({ label: spans[0] || '', value: spans[1] || '', ratio });
    }
  }

  out.footer = clean(section.querySelector('.footer'));
  out.lost = findLostText(section, out);
  return out;
}

// El export reconoce un set cerrado de patrones (ver arriba). Un layout que
// no este en ese set no se exporta — y antes desaparecia en silencio, con
// exit 0 y un "✓ N slides" que sugeria que todo habia viajado. Este pase
// compara el texto visible del DOM contra el texto realmente exportado y
// devuelve lo que se quedo afuera, para poder avisarlo.
function findLostText(section, out) {
  const exported = new Set();
  const add = (t) => { if (t) exported.add(norm(t)); };
  for (const b of out.blocks) {
    add(b.text);
    for (const i of b.items || []) add(i.text);
  }
  for (const c of out.cards) { add(c.num); add(c.eyebrow); add(c.title); add(c.body); }
  for (const m of out.metrics) { add(m.n); add(m.l); }
  for (const b of out.bars) { add(b.etiqueta); for (const s of b.segs) add(s.text); }
  for (const p of out.props) { add(p.label); add(p.value); }
  add(out.footer);

  const joined = [...exported].join('   ');
  const lost = [];
  for (const el of section.querySelectorAll('*')) {
    if (el.querySelectorAll('*').length) continue;        // solo hojas de texto
    if (hasAncestorClass(el, 'footer')) continue;
    if (el.getAttribute?.('data-counter') !== undefined && el.getAttribute('data-counter') !== null) continue;
    const text = norm(clean(el));
    if (text.length < 3) continue;                        // ruido: simbolos, digitos sueltos
    if (joined.includes(text)) continue;
    lost.push({
      tag: el.tagName ? el.tagName.toLowerCase() : '?',
      cls: (el.getAttribute?.('class') || '').trim(),
      text: text.slice(0, 48),
    });
  }
  return lost;
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

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

  // Barras comparativas: una fila por comparacion, segmentos apilados
  // horizontalmente proporcionales a su ancho original en %.
  if (data.bars.length) {
    const BAR_VARIANT_FILL = { a: t.primary, b: t.cream2, c: 'FFFFFF' };
    const BAR_VARIANT_TEXT = { a: t.white, b: t.body, c: t.muted };
    const barH = 44;
    for (const fila of data.bars) {
      if (fila.etiqueta) {
        slide.addText(fila.etiqueta.toUpperCase(), {
          x: px(t.padX), y: px(y), w: px(contentW), h: px(24),
          fontSize: pt(24), bold: true, color: t.muted, fontFace: t.fontBody, charSpacing: 3,
        });
        y += 30;
      }
      let segX = t.padX;
      for (const seg of fila.segs) {
        const segW = (contentW * seg.pct) / 100;
        slide.addShape(pptx.ShapeType.rect, {
          x: px(segX), y: px(y), w: px(segW), h: px(barH),
          fill: { color: BAR_VARIANT_FILL[seg.variant] },
          line: seg.variant === 'c' ? { color: 'E6E6E6', width: 1 } : { type: 'none' },
        });
        if (seg.text) {
          slide.addText(seg.text, {
            x: px(segX + 10), y: px(y), w: px(Math.max(segW - 20, 0)), h: px(barH),
            fontSize: pt(22), bold: true, color: BAR_VARIANT_TEXT[seg.variant],
            fontFace: t.fontBody, valign: 'middle', fit: 'shrink',
          });
        }
        segX += segW;
      }
      y += barH + 30;
    }
    y += 10;
  }

  // Progreso/proporcion: etiqueta + valor arriba, track + fill escalado abajo.
  if (data.props.length) {
    const trackH = 10;
    for (const prop of data.props) {
      if (prop.label || prop.value) {
        slide.addText(prop.label, {
          x: px(t.padX), y: px(y), w: px(contentW / 2), h: px(30),
          fontSize: pt(26), color: t.body, fontFace: t.fontBody,
        });
        slide.addText(prop.value, {
          x: px(t.padX + contentW / 2), y: px(y), w: px(contentW / 2), h: px(30),
          fontSize: pt(26), color: t.body, fontFace: t.fontBody, align: 'right',
        });
        y += 36;
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: px(t.padX), y: px(y), w: px(contentW), h: px(trackH),
        fill: { color: t.cream2 }, line: { type: 'none' }, rectRadius: 0.5,
      });
      if (prop.ratio > 0) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: px(t.padX), y: px(y), w: px(contentW * prop.ratio), h: px(trackH),
          fill: { color: t.primary }, line: { type: 'none' }, rectRadius: 0.5,
        });
      }
      y += trackH + 26;
    }
    y += 10;
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

  if (!existsSync(input)) {
    console.error(`no existe el archivo: ${input}`);
    process.exit(1);
  }
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

  const perdidas = [];
  sections.forEach((section, i) => {
    const data = extractSlide(section);
    renderSlide(pptx, data, tokens);
    if (data.lost.length) perdidas.push({ n: String(i + 1).padStart(2, '0'), lost: data.lost });
  });

  await pptx.writeFile({ fileName: out });

  // El simbolo y el exit code tienen que contar la misma historia: un
  // export con contenido perdido no es un "✓" con un aviso al lado, es un
  // export incompleto. Antes salia con exit 0 pase lo que pase, que es
  // exactamente lo unico que lee un hook o un CI — el aviso detallado de
  // abajo era invisible para cualquiera que no leyera stdout a mano.
  if (perdidas.length) {
    const total = perdidas.reduce((s, p) => s + p.lost.length, 0);
    console.log(`⚠ ${out} · ${sections.length} slides · ${tokens.fontHeading}/${tokens.fontBody} — EXPORT INCOMPLETO`);
    console.log(`  ${total} elemento(s) de texto no viajaron al .pptx, en ${perdidas.length} slide(s).`);
    console.log('  Son patrones de layout fuera del set que el export reconoce (ver cabecera de este script).');
    for (const { n, lost } of perdidas) {
      console.log(`\n  slide ${n} — ${lost.length} elemento(s):`);
      for (const l of lost.slice(0, 6)) {
        const cls = l.cls ? `.${l.cls.split(/\s+/).join('.')}` : '';
        console.log(`    <${l.tag}${cls}>  "${l.text}"`);
      }
      if (lost.length > 6) console.log(`    … y ${lost.length - 6} mas`);
    }
    console.log('\n  Opciones: reescribir esas slides con un patron soportado, sumar soporte al script,');
    console.log('  o completar el contenido a mano en PowerPoint despues de exportar.');
    process.exitCode = 1;
    return;
  }

  console.log(`✓ ${out} · ${sections.length} slides · ${tokens.fontHeading}/${tokens.fontBody}`);
  console.log('  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).');
}

main().catch((err) => {
  // Un stack trace de Node no le dice nada a quien solo queria exportar.
  console.error(`fallo el export: ${err.message}`);
  if (process.env.SLIZDECK_DEBUG) console.error(err);
  process.exit(1);
});
