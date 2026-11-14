/**
 * slizdeck · renumber (lib)
 *
 * Recalcula data-label="NN ..." y <span class="num">NN</span> de todas las
 * slides, en el orden en que aparecen. Funcion pura sobre el HTML: la usan
 * scripts/renumber.mjs (CLI) y Studio despues de reordenar, duplicar o
 * borrar una slide.
 *
 * Las slides sin numero de footer (sin <span class="num"> o con el span
 * vacio, ej. la pantalla de standby) se saltan por completo. Un provisional
 * no numerico (`0X`, `NN`, `??`) SI se renumera.
 */

export function renumberHtml(html) {
  // Los comentarios HTML se enmascaran con espacios (misma longitud, asi que
  // los indices siguen valiendo sobre el original) antes de buscar nada. Un
  // deck puede traer una <section> de ejemplo comentada — el template la trae —
  // y sin enmascarar, su data-label o su </section> desbalancean la cuenta o
  // se renumeran en su lugar los de una slide real.
  const masked = html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length));

  let n = 0;
  const renamed = [];
  let skipped = 0;
  let assetsFixed = 0;
  const edits = [];   // { start, end, text } sobre indices del original

  for (const sec of masked.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)) {
    const body = sec[0];
    const base = sec.index;

    const num = /<span class="num">([^<]*)<\/span>/.exec(body);
    if (!num || !num[1].trim()) {
      if (/^<section\b[^>]*data-label=/.test(body)) skipped++;
      continue;
    }
    n++;
    const nn = String(n).padStart(2, '0');
    const beforeNum = num[1].trim();

    // data-label solo en el tag de apertura de esta section, nunca en su interior.
    const open = /^<section\b[^>]*>/.exec(body)[0];
    const label = /data-label="([^"\s]+)(\s)/.exec(open);
    let beforeLabel;
    if (label) {
      beforeLabel = label[1];
      edits.push({ start: base + label.index, end: base + label.index + label[0].length, text: `data-label="${nn}${label[2]}` });
    }

    edits.push({ start: base + num.index, end: base + num.index + num[0].length, text: `<span class="num">${nn}</span>` });

    // Los marcadores de la fase assets llevan el numero de slide en el texto
    // ("SLIZDECK-ASSET-PENDING: slide 04 - foto del equipo"). Si no se
    // actualizan, despues de insertar una slide apuntan a la equivocada y
    // audit.mjs reporta un pendiente sobre una slide que no es. Se busca en
    // el HTML original, no en el enmascarado: aca el comentario si importa.
    const original = html.slice(base, base + body.length);
    const pend = /(SLIZDECK-ASSET-PENDING:\s*slide\s+)(\d+)/i.exec(original);
    if (pend && pend[2] !== nn) {
      edits.push({
        start: base + pend.index,
        end: base + pend.index + pend[0].length,
        text: `${pend[1]}${nn}`,
      });
      assetsFixed++;
    }

    if (beforeLabel !== nn || beforeNum !== nn) {
      renamed.push(`${beforeNum}${beforeLabel && beforeLabel !== beforeNum ? ` (label ${beforeLabel})` : ''} → ${nn}`);
    }
  }

  let out = html;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return { html: out, n, renamed, skipped, assetsFixed };
}
