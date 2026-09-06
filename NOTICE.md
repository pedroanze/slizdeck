# Aviso de origen

`slizdeck` es un fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) de Marco Galluccio, distribuida bajo licencia MIT (ver `LICENSE`).

Se conservan del original (estructura y patrones, aunque con extensiones propias de `slizdeck` encima):
- `template.html` — el motor `<deck-stage>` (navegación por teclado, fullscreen, paginación de impresión, controlador de pasos/reveal). Extendido con el esquema de design tokens de `slizdeck`, gradientes OKLCH, el sistema de style packs, tiers de tamaño para `.ts-title`, y versionado propio (`slizdeck-engine-version`, ver `CHANGELOG.md`).
- `reference/components.md`, `reference/animations.md`, `reference/icons.md` — catálogo de patrones y técnicas heredado del original; el contenido se tradujo entero al español para `slizdeck` (estaba en italiano), pero los patrones, snippets de HTML/CSS y la organización en familias son los del original.
- `examples/demo-deck.html` — ejemplo de referencia del original, sin modificar.

Son 100% de `slizdeck`, sin equivalente en el original:
- `SKILL.md` — flujo adaptado (frontmatter portable multi-herramienta, definición guiada de design system, research explícito, foco en pitch decks de startup).
- `reference/design-tokens-schema.md`, `reference/design-guidelines.md`, `reference/deck-schema.md`, `reference/init.md`, `reference/brief.md`, `reference/assets.md`, `reference/build.md`, `reference/audit.md`, `reference/export.md`, `reference/add.md`, `reference/fix.md`, `reference/hooks.md`, `reference/media-and-data.md`.
- Los cinco `styles/*.md` (style packs) y su índice.
- Todos los scripts en `scripts/` (aplicar/validar packs, auditoría, export a PPTX, verificación de reveals, versionado/drift, hook de Claude Code, etc.).
- `CHANGELOG.md`, `DESIGN.md`, `PRODUCT.md`, la CI (`.github/workflows/`).
