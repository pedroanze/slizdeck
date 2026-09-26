# Contribuir a slizdeck

## Idioma

Toda la documentación de esta skill está en español, por decisión de alcance (audiencia hispanohablante) — ver "Limitaciones conocidas" en `README.md`. Un PR que toque `SKILL.md`, `reference/*.md` o `styles/*.md` debería mantener ese idioma. El contenido de ejemplo dentro de snippets (placeholders tipo `"Deck Title Here"`) puede seguir en inglés, coherente con el resto de la skill.

## Antes de proponer un cambio

Si el cambio toca `template.html`, algún `scripts/*.mjs`, o `styles/*.md`:

1. Generar un deck de prueba con el pack que corresponda y confirmar que sigue pasando limpio (`audit.mjs` exige un `<title>` distinto del placeholder del template, por eso el `sed`):
   ```bash
   cp template.html /tmp/test-deck.html
   node scripts/apply-style-pack.mjs styles/paper-white.md /tmp/test-deck.html /tmp/test-deck-final.html
   sed -i '' 's/Slizdeck · \[DECK NAME\]/Test Deck/' /tmp/test-deck-final.html   # en Linux: sed -i sin el '' extra
   node scripts/audit.mjs /tmp/test-deck-final.html
   node scripts/check-reveal.mjs /tmp/test-deck-final.html
   ```
2. Correr la regresión completa de packs × tipografías:
   ```bash
   node scripts/smoke-test.mjs
   ```
   Tiene que seguir dando 15/15. Si tocaste `template.html` y una sola variante falla, es una regresión real — no un problema del pack.
3. Si el cambio amerita subir de versión (ver la nota del final sobre cuándo), la versión vive en **seis sitios que deben coincidir siempre**: `package.json`, el `metadata.version` de `SKILL.md`, el marcador `slizdeck-engine-version` de `template.html`, la primera entrada de `CHANGELOG.md`, y el `version` de `.claude-plugin/plugin.json` y de la entrada de `.claude-plugin/marketplace.json`. Tocarlos todos, y verificar con:

   ```bash
   node scripts/check-versions.mjs
   ```

   Se agregó justamente porque los cuatro se desalinearon en silencio una vez. Corre en CI, y en el push de un tag exige además que el tag (`vX.Y.Z`) coincida.

4. Para publicar: PR con el bump → merge → `git tag vX.Y.Z && git push --tags`. `.github/workflows/release.yml` hace el resto: corre los checks, publica a npm con provenance y crea el Release en GitHub. Necesita el secret `NPM_TOKEN` en el repo.

`.github/workflows/ci.yml` corre estos mismos pasos (más la coherencia de versiones y la cobertura de export) en cada push/PR contra un deck de humo generado en el momento — no hace falta correrlo todo a mano si ya vas a abrir el PR, pero sí antes de pedir revisión si el ciclo de CI es lento.

## Agregar un style pack nuevo

La guía completa ya está en `styles/index.md` → sección "Añadir un pack nuevo": copiar un pack existente como plantilla, cambiar los tokens, validar con `check-style-pack.mjs`, y seguir las dos convenciones que ahí se detallan (gradientes en OKLCH, sección de alternativas tipográficas). No la repito acá para no tener dos copias que se puedan desincronizar — esa es la fuente de verdad.

Un pack nuevo se suma también a la tabla de `styles/index.md` y a la de `README.md` (`## Diseño`) para que sea descubrible.

## Agregar un patrón de layout o una técnica de animación

`reference/components.md` (layouts) y `reference/animations.md` (animación) documentan el formato esperado — wireframe ASCII cuando aplica, HTML+CSS listo para copiar, cuándo usarlo y cuándo no. Seguir la misma estructura que los patrones existentes de la misma familia.

## Convención de commits

El historial de este repo no sigue Conventional Commits estricto — es una sola línea en modo imperativo, en español, describiendo qué cambia y por qué en vez de listar archivos:

```
Arreglar orden de cascada CSS en .reveal.is-on
Traducir animations.md al español
Agregar hook de verificación automática post-edición
```

No hace falta más que eso: sin prefijos tipo `feat:`/`fix:`, sin body extenso salvo que el cambio necesite contexto que el diff no explique por sí solo.

## Cómo está armado el repo

| Archivo | Rol |
|---|---|
| `SKILL.md` | Punto de entrada: qué dispara la skill y la tabla de fases con su ruteo. |
| `template.html` | Motor del deck: canvas `<deck-stage>`, navegación, sistema de reveals, tokens CSS. |
| `reference/init.md` | Fase init — pack, colores de marca, tipografía. |
| `reference/brief.md` | Fase brief — tema, público, tamaño, research, arco, wireframe. |
| `reference/assets.md` | Fase assets — checklist bloqueante de imágenes/logos/datos. |
| `reference/build.md` | Fase build — nivel de animación y generación del HTML. |
| `reference/audit.md` | Fase audit — qué valida `scripts/audit.mjs` y qué queda a criterio del modelo. |
| `reference/export.md` | Fase export — PDF, PPTX, deck sin red, speaker notes. |
| `reference/add.md` | Fase add — agregar slides a un deck existente sin romper la numeración. |
| `reference/fix.md` | Fase fix — corregir o mejorar una slide puntual sin romper el resto. |
| `reference/hooks.md` | Hook opcional de Claude Code: audita un deck automáticamente después de cada edición. |
| `CHANGELOG.md` | Historial de versiones del engine (`template.html`) — lo que lee `scripts/doctor.mjs`. |
| `CONTRIBUTING.md` | Cómo agregar un style pack/patrón nuevo, correr los tests locales, convención de commits. |
| `.github/workflows/ci.yml` | CI en cada push/PR: `check-versions.mjs`, el smoke-test de packs, y la validación completa (`audit`/`check-reveal`/`check-overflow`/`doctor`) sobre un deck generado al vuelo y sobre `examples/pitch-showcase.html`. |
| `reference/design-tokens-schema.md` | Esquema del design system y su mapeo a variables CSS. |
| `reference/design-guidelines.md` | Principios visuales y lista de anti-clichés. |
| `reference/deck-schema.md` | Formato del wireframe, arcos narrativos, niveles de animación. |
| `reference/components.md` | Catálogo de patrones de layout. |
| `reference/media-and-data.md` | Patrones de imagen, métricas, barras y pantalla de inicio (y qué de esto sobrevive al export a PPTX). |
| `reference/animations.md` | Recetas de animación CSS y sus gotchas — solo para nivel HEAVY. |
| `reference/icons.md` | Librería de íconos SVG. |
| `DESIGN.md` · `design.json` | El contrato del sistema visual (roles de color, escala tipográfica, movimiento) en prosa y su espejo estructurado, en formato [DESIGN.md](https://github.com/google-labs-code/design.md). |
| `styles/` | Cinco style packs (terminal, paper-white, committed, instrument, editorial) + su índice. |
| `bin/slizdeck.mjs` | CLI: instalador multi-agente (`install`/`update`/`uninstall`/`where`/`env`) y atajo a todos los scripts desde cualquier carpeta (`slizdeck audit deck.html`, `slizdeck export pptx deck.html`). |
| `.claude-plugin/` · `hooks/hooks.json` | Manifiestos del plugin y marketplace de Claude Code, y el hook de verificación que viaja con el plugin. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck fusionando tokens (y su alternativa tipográfica, con `--font=<id>`). |
| `scripts/check-style-pack.mjs` | Valida contrastes y avisa de clichés visuales de IA. |
| `scripts/audit.mjs` | Valida un deck ya generado: contraste, balance HTML, reglas de voz, assets pendientes. |
| `scripts/check-reveal.mjs` | Verifica en Chrome headless que la cascada CSS de `.reveal` resuelva bien al revelarse (`.is-on` gana contra cualquier `r-*`) — atrapa bugs de orden de cascada invisibles en el HTML estático. |
| `scripts/shoot.mjs` | Renderiza cada slide a PNG (estado final) para revisar el deck mirándolo, no leyendo el HTML. `--clean` oculta la UI del reproductor (así se generan las capturas de `docs/img/`). |
| `scripts/check-contrast.mjs` | Mide en Chrome headless el contraste de cada texto contra su fondo real; los textos sobre gradiente los reporta como no medidos. |
| `scripts/check-overflow.mjs` | Verifica en Chrome headless que ningún texto desborde el canvas 1920×1080 ni se trunque en una línea que no cabe. |
| `scripts/doctor.mjs` | Compara la versión de engine embebida en un deck contra `CHANGELOG.md` y avisa (sin reparar) si le falta algún fix conocido. |
| `scripts/verify-hook.mjs` | Hook opcional de Claude Code que corre `audit.mjs` automáticamente después de editar un deck — ver `reference/hooks.md`. |
| `scripts/export-pptx.mjs` | Exporta un deck a `.pptx` editable por geometría: mide cada slide en Chrome (`scripts/lib/measure-deck.mjs`) y reconstruye texto, formas, imágenes y SVG en su posición real. `--safe-fonts`, `--slides=`, `--legacy`. |
| `scripts/export-pdf.mjs` | Exporta un deck a PDF con Chrome headless (una página por slide, estado final), sin el grano de los degradados que infla el archivo; verifica el número de páginas. `--grain` lo conserva. |
| `scripts/make-offline.mjs` | Incrusta las fuentes como `data:` URI para presentar sin depender de red. |
| `scripts/check-docs.mjs` | Verifica que la documentación siga alineada con el repo: scripts y referencias listados, links que resuelven, DESIGN.md ≡ design.json. |
| `scripts/check-versions.mjs` | Verifica que la versión coincida en los seis sitios donde se declara (`package.json`, `SKILL.md`, `template.html`, `CHANGELOG.md`, `.claude-plugin/plugin.json` y `marketplace.json`). |
| `scripts/renumber.mjs` | Recalcula `data-label` y `<span class="num">` de todas las slides en orden de documento — usar después de insertar una slide en medio del deck. |
| `tests/validators.test.js` · `tests/cli.test.js` | Suites `node:test` (cero deps): que los validadores distingan un deck bueno de uno roto, y que el instalador instale, respete y desinstale bien. `npm test`. |
| `scripts/smoke-test.mjs` | Test de regresión: ejercita cada pack con cada alternativa tipográfica. |
| `examples/demo-deck.html` | Deck de ejemplo heredado del fork original, sin modificar (ver `NOTICE.md`). |
| `docs/img/` | Capturas del README, generadas con `shoot.mjs --clean` sobre los decks del smoke-test y de `examples/`. |
| `examples/pitch-showcase.html` | Deck de ejemplo propio de slizdeck (7 slides, pack Paper White) — pasa limpio `audit.mjs` + `check-style-pack.mjs` + `check-reveal.mjs`, referencia de la calidad actual del output. |

## Notas técnicas

- **Los cuatro scripts que renderizan en Chrome headless (`check-contrast.mjs`, `check-overflow.mjs`, `check-reveal.mjs`, `shoot.mjs`) usaban un rAF anidado dentro de otro para esperar a que el layout se asiente.** En Chrome headless sin GPU (`--disable-gpu`, el modo en el que corren todos), un segundo `requestAnimationFrame` encadenado no llega a dispararse la gran mayoría de las veces (medido en esta máquina: ~90% de las corridas se quedan colgadas esperándolo, sin ningún error) — el harness nunca llegaba a marcar `.is-on`, y la slide se medía o capturaba en su estado inicial (oculto). Corregido reemplazando el segundo `rAF` por un `setTimeout(0)`, que no depende del compositor. `check-reveal.mjs` y `check-overflow.mjs` además reintentan automáticamente hasta 2 veces la invocación completa de Chrome, como segunda red de seguridad ante una contención de recursos real (otro proceso pesado compitiendo en la máquina), no como parche del bug de arriba.
- **`check-overflow.mjs` mide el solape de texto por la caja real del texto (`Range`), no por la del elemento contenedor** — un `<div>` block ocupa todo el ancho de la slide aunque su texto sean 80px en una esquina, y comparar por bounding box daba falsos positivos en cada slide antes de este fix (v1.4.0). Un solape intencional (ej. un badge sobre una esquina) se marca con `data-overlap-ok` en el contenedor para excluirlo.
- **`examples/demo-deck.html` no pasa `check-style-pack.mjs`.** Es el ejemplo heredado del fork original (ver `NOTICE.md`), preservado sin modificar — no usa el sistema de style packs de slizdeck, así que su paleta original no pasa la validación de contraste que sí aplica a un deck generado con esta skill. `examples/pitch-showcase.html` es el ejemplo que sí usa el sistema de packs actual y pasa todo limpio.
- **`npm install` reporta 2 vulnerabilidades `high`** en `image-size`, una dependencia transitiva de `pptxgenjs` (DoS parseando imágenes malformadas). No hay fix sin downgrade breaking del export. El riesgo real acá es bajo: las imágenes que viajan al `.pptx` ya llegan rasterizadas por Chrome, y el export solo procesa decks del propio usuario. Las deps además solo hacen falta para exportar a PPTX.

## Qué NO tocar sin pensarlo dos veces

- **`examples/demo-deck.html`** — protegido por `NOTICE.md`/licencia, heredado del fork original sin modificar. Si necesitás un ejemplo que sí pase la validación de contraste con el sistema de packs actual, es un archivo nuevo, no una edición de este.
- **`template.html`** — lo usa todo deck generado. Un cambio acá es un cambio de *engine*, no de una slide puntual: pasa por el checklist de arriba completo, no solo `audit.mjs`.
- **La numeración de versión** — sube cuando el cambio es algo que un deck ya generado podría necesitar reaplicar, o cuando cambia el comportamiento de un script que la gente corre (ver punto 3 de arriba). Un typo en un comentario no amerita bump. Cuando sube, suben los seis sitios a la vez: `check-versions.mjs` no deja publicar de otra forma.
