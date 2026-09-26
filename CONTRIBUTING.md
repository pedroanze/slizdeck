# Contribuir a slizdeck

## Idioma

La documentación de la skill (`SKILL.md`, `reference/`, `styles/`) está en español, y un PR que la toque la mantiene así. Los placeholders dentro de snippets (`"Deck Title Here"`) pueden ir en inglés. Issues y PRs en inglés son bienvenidos.

## Antes de abrir un PR

```bash
npm install
npm run check                 # versiones + docs + tests (sin Chrome)
node scripts/smoke-test.mjs   # los 5 packs × sus tipografías, en Chrome
```

Si el cambio toca `template.html`, un script o un pack, además validar un deck real:

```bash
node bin/slizdeck.mjs new /tmp/d.html --pack=paper-white
sed -i '' 's/Slizdeck · \[DECK NAME\]/Test/' /tmp/d.html     # audit rechaza el <title> placeholder; en Linux, sed -i sin ''
node bin/slizdeck.mjs check /tmp/d.html                      # audit + check-reveal + check-overflow + check-contrast
```

`.github/workflows/ci.yml` corre todo esto y más en cada push/PR (los ejemplos en los 5 packs, los exports, la instalación con `npx`), así que el CI es la lista autoritativa de lo que tiene que pasar.

Un cambio en el diseño o en las instrucciones de las fases se mide con los evals antes de publicarse: ver [`evals/README.md`](evals/README.md).

## Versión y publicación

La versión vive en **seis sitios que coinciden siempre**: `package.json`, `metadata.version` de `SKILL.md`, el comentario `slizdeck-engine-version` de `template.html`, la primera entrada de `CHANGELOG.md`, y el `version` de `.claude-plugin/plugin.json` y de la entrada de `.claude-plugin/marketplace.json`. `node scripts/check-versions.mjs` lo verifica (corre en CI y, en el push de un tag, exige que el tag coincida).

Sube cuando un deck ya generado podría necesitar reaplicar el cambio o cuando cambia el comportamiento de un script; un typo no.

Para publicar: PR con el bump, merge, y después `git tag vX.Y.Z && git push --tags`. **Mergear no publica: publica el tag.** `.github/workflows/release.yml` corre los checks, publica a npm con provenance (trusted publishing, o el secret `NPM_TOKEN` mientras no esté configurado) y crea el Release con la entrada del CHANGELOG.

## Agregar un style pack, un patrón o una animación

- **Pack**: la guía está en `styles/index.md` → "Añadir un pack nuevo" (tokens, OKLCH, alternativas tipográficas, `--cs-accent-ink` y `--cs-on-primary` si hacen falta). Sumarlo a la tabla de `styles/index.md` y a la galería del README.
- **Patrón de layout**: `reference/components.md`, con la misma estructura que los de su familia. Colores siempre con tokens (`--cs-surface`, `--cs-scrim`, `--cs-border`, `--cs-on-primary`), nunca `#fff` ni `rgba(0,0,0,…)` literales, y nada de texto en `::before`/`::after` (no viaja al PPTX).
- **Técnica de animación**: `reference/animations.md`, con sus gotchas al final de la sección.

## Convención de commits

Una línea en imperativo, en español, que diga qué cambia y por qué: `Arreglar orden de cascada CSS en .reveal.is-on`. Sin prefijos `feat:`/`fix:`; body solo si el diff no se explica solo.

## Cómo está armado el repo

| Archivo | Rol |
|---|---|
| `SKILL.md` · `reference/` · `styles/` | Lo que lee el agente: fases, catálogos, packs. |
| `template.html` | El engine: `<deck-stage>`, pasos, tokens, patrones de datos (`.sz-*`), modo presentador. Todo deck es una copia. |
| `bin/slizdeck.mjs` | CLI: `install`/`update`/`uninstall`/`where`/`env`, `new`, y atajos a todos los scripts. |
| `.claude-plugin/` · `hooks/hooks.json` | Plugin y marketplace de Claude Code, y el hook que viaja con el plugin. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck fusionando tokens; al cambiar de pack devuelve al default los del anterior. |
| `scripts/check-style-pack.mjs` | Contrastes de los tokens, primario vs acento, acento resaltado vs fondo, clichés de IA. |
| `scripts/audit.mjs` | Validación estática del deck y avisos de criterio (texto, emojis, layout). |
| `scripts/check-reveal.mjs` · `scripts/check-overflow.mjs` · `scripts/check-contrast.mjs` | Validación en Chrome headless (cascada de `.reveal`, desbordes y solapes, contraste medido). |
| `scripts/shoot.mjs` | PNG por slide en estado final. `--clean` sin la UI del reproductor (así se generan `docs/img/`). |
| `scripts/doctor.mjs` | Fixes del engine que le faltan a un deck viejo (lee `CHANGELOG.md`). |
| `scripts/renumber.mjs` | Renumera `data-label` y footers. |
| `scripts/export-pptx.mjs` | PPTX por geometría sobre `scripts/lib/measure-deck.mjs`. |
| `scripts/export-pdf.mjs` · `scripts/make-offline.mjs` | PDF liviano; fuentes incrustadas para presentar sin red. |
| `scripts/verify-hook.mjs` | Hook `PostToolUse` que corre `audit.mjs` tras cada edición. |
| `scripts/check-docs.mjs` · `scripts/check-versions.mjs` | Canarios de drift: docs vs repo, versión en los seis sitios. |
| `scripts/smoke-test.mjs` | Regresión de todos los packs × tipografías. |
| `scripts/score-deck.mjs` · `evals/` | Puntaje 0-100 y briefs fijos para medir la calidad entre versiones. |
| `scripts/lib/` | Compartido: `chrome-run` (harness, reintentos), `deck-html` (parseo estático), `inject`, `find-chrome`, `measure-deck`. |
| `tests/` | `node:test`: los validadores distinguen un deck bueno de uno roto; el instalador instala, respeta y desinstala. |
| `examples/pitch-showcase.html` · `examples/datos-showcase.html` | Decks de referencia; el CI los valida y exporta, y los tests mutan `pitch-showcase`. |
| `examples/test-0*/` | Tres decks generados de punta a punta por la skill; el CI exige que exporten sin pérdidas. |

## Notas técnicas

- **Chrome headless sin GPU** (CI, validadores): un `requestAnimationFrame` puede no llegar nunca. Todo lo que espera un frame lleva un `setTimeout` de respaldo (`START` en `scripts/lib/chrome-run.mjs`, `afterFrame` en el template). Nunca rAF anidados.
- **El harness se inyecta antes del último `</body>`** (`scripts/lib/inject.mjs`), y la copia se escribe al lado del deck para que las rutas relativas de las imágenes resuelvan.
- **`check-overflow` mide solapes por la caja del texto** (`Range`), no por la del elemento; un solape intencional se marca con `data-overlap-ok`.
- **`npm install` reporta 2 vulnerabilidades en `image-size`**, dependencia transitiva de `pptxgenjs`. El export no le pasa imágenes arbitrarias (llegan rasterizadas por Chrome) y solo procesa decks propios; no hay fix sin romper el export.
