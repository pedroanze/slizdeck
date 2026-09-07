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
 * Requiere Google Chrome/Chromium instalado. Se detecta automáticamente
 * (macOS, Linux, Windows) vía scripts/lib/find-chrome.mjs; si no está en una
 * ruta típica, setear la variable de entorno CHROME_PATH con la ruta
 * completa al ejecutable.
 *
 * El harness espera `DOMContentLoaded`, no `load`, para no depender de que
 * carguen imagenes o iframes. OJO: eso NO evita el cuelgue por un <script
 * src> externo bloqueante (ej. Lucide sin comentar, en vez del default de
 * template.html), porque `DOMContentLoaded` tambien espera a los scripts
 * sincronos. Por eso, si el chequeo no termina, primero se reporta si el
 * deck tiene scripts externos: esa es la causa mucho mas probable que un
 * problema de Chrome en la maquina.
 *
 * Reintenta hasta 2 veces si Chrome headless no llega a terminar (arranque
 * en frio, contencion de recursos — confirmado no relacionado con el deck
 * evaluado). NO reintenta si el harness si termino y encontro violaciones:
 * eso es un resultado real y deterministico, nunca se oculta.
 */

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findChrome } from './lib/find-chrome.mjs';

let CHROME;
try {
  CHROME = findChrome();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

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
  // Un solo rAF + setTimeout, no un rAF anidado en otro: en Chrome headless
  // con --disable-gpu el segundo rAF de una cadena no llega a dispararse la
  // mayoria de las veces (medido: 9 de 10 corridas se cuelgan esperandolo,
  // sin ningun error). El harness nunca llegaba a marcar .is-on, y el
  // resultado dependia de la suerte de esa corrida en particular.
  requestAnimationFrame(() => { setTimeout(() => {
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
  }, 0); });
});
</script>
`;

const withHarness = html.replace('</body>', harness + '</body>');
// Al lado del deck real, no en os.tmpdir(): ver el comentario equivalente
// en check-overflow.mjs — rutas relativas a assets locales se rompen si el
// harness se copia a otra carpeta.
const tmp = path.join(path.dirname(path.resolve(file)), `.slizdeck-check-reveal-${Date.now()}.html`);
writeFileSync(tmp, withHarness);

const MAX_ATTEMPTS = 2;
let m = null;
try {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !m; attempt++) {
    const dom = execFileSync(
      CHROME,
      ['--headless', '--disable-gpu', '--no-sandbox', '--dump-dom', '--virtual-time-budget=12000', `file://${tmp}`],
      { stdio: 'pipe', timeout: 30000 },
    ).toString();
    m = /<title>DONE::(.*?)<\/title>/s.exec(dom);
    if (!m && attempt < MAX_ATTEMPTS) {
      console.error(`(intento ${attempt}/${MAX_ATTEMPTS}: Chrome headless no termino a tiempo, reintentando...)`);
    }
  }
} finally {
  rmSync(tmp, { force: true });
}

if (!m) {
  console.error(`No se pudo leer el resultado tras ${MAX_ATTEMPTS} intentos — Chrome headless no termino.`);
  const externos = [...html.replace(/<!--[\s\S]*?-->/g, (c) => ' '.repeat(c.length)).matchAll(/<script\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)].map((x) => x[1]);
  if (externos.length) {
    console.error(`\n  Causa mas probable: el deck carga ${externos.length} script(s) externo(s) bloqueante(s):`);
    for (const u of externos) console.error(`    ${u}`);
    console.error('  DOMContentLoaded espera a los scripts sincronos, asi que si esa URL no responde el chequeo nunca termina.');
    console.error('  Fix: comentar o quitar ese <script src> del deck (template.html lo trae comentado por default).');
  } else {
    console.error('  El deck no tiene scripts externos, asi que probablemente sea la maquina: revisar que Chrome headless funcione aca.');
  }
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
