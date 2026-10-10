/**
 * slizdeck · tests estaticos del engine (template.html)
 *
 * Regresiones del <deck-stage> que se pueden comprobar leyendo el HTML, sin
 * Chrome. Corren sobre el template y sobre los decks de referencia, que son
 * copias del engine y tienen que llevar los mismos fixes.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINES = ['template.html', 'examples/pitch-showcase.html', 'examples/datos-showcase.html'];

for (const file of ENGINES) {
  const html = readFileSync(path.join(ROOT, file), 'utf8');

  test(`${file}: las flechas en pantalla y las zonas tactiles pasan por el controlador de pasos`, () => {
    // Antes llamaban a _go() directo y saltaban de slide sin revelar los pasos (2.3.2)
    assert.doesNotMatch(html, /this\._go\(this\._index [+-] 1, '(click|tap)'\)/);
    assert.match(html, /querySelector\('\.prev'\)\.addEventListener\('click', \(\) => this\._navKey\('ArrowLeft'\)\)/);
    assert.match(html, /querySelector\('\.next'\)\.addEventListener\('click', \(\) => this\._navKey\('ArrowRight'\)\)/);
    assert.match(html, /_onTapBack\(e\) \{ e\.preventDefault\(\); this\._navKey\('ArrowLeft'\); \}/);
    assert.match(html, /_onTapForward\(e\) \{ e\.preventDefault\(\); this\._navKey\('ArrowRight'\); \}/);
  });

  test(`${file}: _navKey despacha la tecla desde el body, no desde window`, () => {
    // Desde window, deck-stage cambiaba de slide antes de que corriera el
    // controlador de pasos (los dos quedaban "at target" en orden de registro).
    const m = html.match(/_navKey\(key\) \{([\s\S]*?)\n\s*\}/);
    assert.ok(m, 'falta el metodo _navKey en <deck-stage>');
    assert.match(m[1], /document\.body\.dispatchEvent\(new KeyboardEvent\('keydown'/);
  });
}
