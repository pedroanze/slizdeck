#!/usr/bin/env node
/**
 * slizdeck · check-reveal
 *
 * Verifica que la cascada CSS de los reveals resuelva bien cuando un
 * elemento queda revelado (`.is-on`) — sin depender del HTML estatico ni
 * del estado finalizado para impresion, que es lo que `audit.mjs` y
 * `smoke-test.mjs` miran. Esos dos habrian dejado pasar el bug real de
 * esta sesion: `.reveal.is-on { transform: none }` y `.reveal.r-left {
 * transform: translateX(-36px) }` tienen la misma especificidad (dos
 * clases), asi que en un empate gana la que se declara despues en el
 * archivo — y `.reveal.is-on` estaba declarada ANTES de las variantes
 * r-*, asi que perdia la cascada. El resultado: en la vista real del
 * navegador (nunca en `@media print`, que fuerza `!important` aparte) el
 * contenido revelado se quedaba con el transform/filter de su propia
 * animacion aplicado para siempre. Nadie lo detecto hasta que un humano
 * lo vio a ojo, navegando el deck de verdad.
 *
 * En vez de simular la secuencia real de teclas (el motor tiene su propia
 * logica de auto-revelar el primer paso al entrar a cada slide, avanzar
 * pasos internos antes de cambiar de slide, etc. — fragil de reproducir
 * fielmente y no es lo que hay que probar aca), este script ataca la
 * causa exacta: marca CADA `.reveal` del documento como `.is-on` de un
 * solo golpe (la condicion CSS que importa) y confirma que su transform y
 * filter computados sean "none", sin importar que variante (r-left,
 * r-rise, r-scale, r-blur...) tenga combinada.
 *
 *   node scripts/check-reveal.mjs deck.html
 *
 * Requiere Google Chrome instalado (macOS: /Applications/Google Chrome.app).
 *
 * El harness espera `DOMContentLoaded`, no `load`: si un deck carga un
 * <script src> externo bloqueante (ej. Lucide sin comentar, en vez del
 * default de template.html) y la red esta caida o lenta, `load` puede
 * no disparar nunca y el chequeo cuelga sin necesidad — la cascada CSS
 * que este script valida no depende de que ese script externo llegue a
 * ejecutarse.
 */

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const file = process.argv[2];
if (!file) {
  console.error('uso: node scripts/check-reveal.mjs <deck.html>');
  process.exit(1);
}

const html = readFileSync(file, 'utf8');

const harness = `
<style>*, *::before, *::after { transition: none !important; }</style>
<script>
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-on'));
    const violations = [];
    document.querySelectorAll('.reveal.is-on').forEach((el) => {
      const cs = getComputedStyle(el);
      const t = cs.transform;
      const f = cs.filter;
      const badT = t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)';
      const badF = f && f !== 'none';
      if (badT || badF) {
        violations.push({
          tag: el.tagName.toLowerCase(),
          classes: el.className,
          text: (el.textContent || '').trim().slice(0, 60),
          transform: badT ? t : undefined,
          filter: badF ? f : undefined,
        });
      }
    });
    document.title = 'DONE::' + JSON.stringify(violations);
  }));
});
</script>
`;

const withHarness = html.replace('</body>', harness + '</body>');
const tmp = path.join(os.tmpdir(), `slizdeck-check-reveal-${Date.now()}.html`);
writeFileSync(tmp, withHarness);

let dom;
try {
  dom = execFileSync(
    CHROME,
    ['--headless', '--disable-gpu', '--dump-dom', '--virtual-time-budget=12000', `file://${tmp}`],
    { stdio: 'pipe', timeout: 30000 },
  ).toString();
} finally {
  rmSync(tmp, { force: true });
}

const m = /<title>DONE::(.*?)<\/title>/s.exec(dom);
if (!m) {
  console.error('No se pudo leer el resultado — el harness no llego a terminar. Chrome headless a veces falla en frio (arranque lento, contencion de recursos); volver a correr el comando suele resolverlo. Si persiste, revisar que Chrome headless funcione en esta maquina.');
  process.exit(1);
}

const unescape = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const violations = JSON.parse(unescape(m[1]));

console.log(`\n${file}\n`);
if (!violations.length) {
  console.log('  ✓ Todo .reveal revelado queda con transform/filter en "none" — la cascada de .is-on gana contra cualquier variante r-*.\n');
  process.exit(0);
}

for (const v of violations) {
  console.log(`  ✗ <${v.tag} class="${v.classes}"> "${v.text}"`);
  if (v.transform) console.log(`      transform: ${v.transform} (deberia ser none)`);
  if (v.filter) console.log(`      filter: ${v.filter} (deberia ser none)`);
}
console.log(`\n✗ ${violations.length} elemento(s) donde .is-on pierde la cascada contra su propia variante r-*\n`);
process.exit(1);
