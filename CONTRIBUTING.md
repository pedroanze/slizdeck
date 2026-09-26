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

## Qué NO tocar sin pensarlo dos veces

- **`examples/demo-deck.html`** — protegido por `NOTICE.md`/licencia, heredado del fork original sin modificar. Si necesitás un ejemplo que sí pase la validación de contraste con el sistema de packs actual, es un archivo nuevo, no una edición de este.
- **`template.html`** — lo usa todo deck generado. Un cambio acá es un cambio de *engine*, no de una slide puntual: pasa por el checklist de arriba completo, no solo `audit.mjs`.
- **La numeración de versión** — sube cuando el cambio es algo que un deck ya generado podría necesitar reaplicar, o cuando cambia el comportamiento de un script que la gente corre (ver punto 3 de arriba). Un typo en un comentario no amerita bump. Cuando sube, suben los seis sitios a la vez: `check-versions.mjs` no deja publicar de otra forma.
