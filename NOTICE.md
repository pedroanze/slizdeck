# Aviso de origen

`slizdeck` es un fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) de Marco Galluccio, distribuida bajo licencia MIT (ver `LICENSE`).

Se conservan casi sin cambios:
- `template.html` — el motor `<deck-stage>` (navegación por teclado, fullscreen, paginación de impresión, controlador de pasos/reveal), extendido con el esquema de design tokens de `slizdeck`.
- `reference/components.md`, `reference/animations.md`, `reference/icons.md` — catálogos de patrones, heredados tal cual del original.
- `examples/demo-deck.html` — ejemplo de referencia del original.

Se reescriben para `slizdeck`:
- `SKILL.md` — flujo adaptado (frontmatter portable multi-herramienta, definición guiada de design system, research explícito, foco en pitch decks de startup).
- `reference/design-tokens-schema.md`, `reference/design-guidelines.md`, `reference/deck-schema.md` — nuevos.
