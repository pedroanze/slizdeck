# Slizdeck

Genera decks de slides **HTML animados** a partir de tu propio design system, con el contenido investigado en internet. Pensado para pitch decks de startup: minimalista, poco texto, mucha imagen y dato duro.

Es una [Agent Skill](https://agentskills.io) — funciona en Claude Code, Gemini CLI, Codex, OpenCode y cualquier cliente que soporte el estándar abierto.

## Qué produce

- **Un archivo `.html` autónomo.** Sin build step, sin dependencias de toolchain. Lo abres en cualquier navegador y presentas: canvas 1920×1080, navegación por teclado (←/→/espacio), fullscreen, barra de progreso.
- **Un PDF fiel**, vía impresión nativa del navegador (`Cmd/Ctrl+P`). El PDF exporta el **estado final** de cada slide: animaciones resueltas, contadores en su cifra real, sin el chrome del reproductor.
- **Un PPTX editable** (`node scripts/export-pptx.mjs deck.html`), con texto y formas nativas de PowerPoint — no imágenes incrustadas. Se edita en PowerPoint o Google Slides.

## Cómo funciona

Invocas la skill y ella conduce el flujo:

1. **Design system** — Si no tienes uno, te hace 3 preguntas simples (color de marca, tipografía, "vibe") y genera la paleta completa. Nunca te pide escribir CSS ni JSON a mano. Si ya tienes tokens, los detecta y traduce.
2. **Brief + research** — Le das el tema; investiga en internet para que el contenido tenga datos reales, no inventados.
3. **Wireframe** — Propone la narrativa slide por slide y **espera tu aprobación** antes de generar nada.
4. **Generación** — Escribe el HTML aplicando la guía de diseño anti-genérico.
5. **Iteración** — Ajustas en conversación normal ("cambia la slide 3", "elimina la 5").

## Instalación

Clona el repo directo en la carpeta de skills de tu herramienta:

```bash
# Claude Code
git clone https://github.com/<tu-usuario>/slizdeck ~/.claude/skills/slizdeck

# Gemini CLI
git clone https://github.com/<tu-usuario>/slizdeck ~/.gemini/skills/slizdeck

# Codex
git clone https://github.com/<tu-usuario>/slizdeck ~/.codex/skills/slizdeck

# OpenCode
git clone https://github.com/<tu-usuario>/slizdeck ~/.opencode/skills/slizdeck
```

Luego pídele a tu agente algo como *"hazme un pitch deck de 8 slides sobre mi startup"*.

Para trabajar en la skill sin duplicarla, clona donde prefieras y enlaza:

```bash
git clone https://github.com/<tu-usuario>/slizdeck ~/proyectos/slizdeck
ln -s ~/proyectos/slizdeck ~/.claude/skills/slizdeck
```

## Estructura

| Archivo | Rol |
|---|---|
| `SKILL.md` | El flujo que sigue el agente. Punto de entrada. |
| `template.html` | Motor del deck: canvas `<deck-stage>`, navegación, sistema de reveals, tokens CSS. |
| `reference/design-tokens-schema.md` | Esquema del design system y su mapeo a variables CSS. |
| `reference/design-guidelines.md` | Principios visuales y lista de anti-clichés. |
| `reference/deck-schema.md` | Formato del wireframe, arcos narrativos, niveles de animación. |
| `reference/components.md` | Catálogo de patrones de layout. |
| `reference/animations.md` | Recetas de animación CSS y sus gotchas. |
| `reference/icons.md` | Librería de íconos SVG. |
| `DESIGN.md` · `.impeccable/design.json` | El design system del estilo default, documentado en formato [DESIGN.md](https://github.com/google-labs-code/design.md). |
| `styles/` | Cinco style packs (terminal, paper-white, committed, instrument, editorial) + su índice. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck fusionando tokens. |
| `scripts/check-style-pack.mjs` | Valida contrastes y avisa de clichés visuales de IA. |
| `scripts/export-pptx.mjs` | Exporta un deck a `.pptx` editable (texto y formas nativas, no imágenes). |
| `demo/` | Deck de ejemplo (`pitch-demo.html`) con su PDF y PPTX exportados. |

## Diseño

Slizdeck trae **cinco style packs**, cada uno un mundo visual completo (paleta, tipografía y reglas de composición), derivados del entorno visual real de la audiencia — documentación técnica, terminales, paneles de datos, prensa — y no de "minimalista" en abstracto:

| Pack | Para qué |
|---|---|
| `terminal` | Infra, AI, demos técnicas. Sala oscura con proyector. |
| `paper-white` | Cuando el contenido y las cifras deben cargar todo el peso. |
| `committed` | El pitch que necesita recordarse. Keynotes, lanzamientos. |
| `instrument` | Decks densos en métricas: tracción, unit economics. |
| `editorial` | Charlas con tesis, donde el texto respira. |

Ninguno usa las tipografías ni las combinaciones de color que delatan una interfaz generada por IA, y todos pasan un validador de contrastes:

```bash
node scripts/check-style-pack.mjs styles/terminal.md
```

Comprueba los contrastes WCAG, que primario y acento sean distinguibles entre sí, y avisa si la paleta cae en una zona atractora conocida o si la tipografía está en la lista de *training-data defaults*. Sirve igual para un pack propio armado con los colores de tu marca.

Las reglas están en `reference/design-guidelines.md` y son verificables mecánicamente con el detector de [impeccable](https://github.com/pbakaus/impeccable):

```bash
node ~/.claude/skills/impeccable/scripts/detect.mjs --json tu-deck.html
```

## Verificar cambios visuales

Sin abrir el navegador a mano:

```bash
# Exportar a PDF
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="deck.pdf" --virtual-time-budget=5000 \
  "file://$PWD/tu-deck.html"

# Ver cada página como imagen
pdftoppm -png -r 72 deck.pdf pagina
```

## Créditos y licencia

Fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) de Marco Galluccio (MIT). El motor `<deck-stage>` y los catálogos de componentes/animaciones/íconos vienen de ahí; ver `NOTICE.md` para el detalle de qué se heredó y qué se reescribió.

MIT — ver `LICENSE`.
