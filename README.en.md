<div align="center">
  <img src="SlizDeck.png" alt="SlizDeck" width="280">
</div>

# Slizdeck

[![CI](https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml/badge.svg)](https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml)

**English** · [Español](README.md)

Generates **animated HTML slide decks** from your own design system, with content researched on the web. Built for startup pitch decks (minimal, little text, lots of imagery and hard data), and also works for talks, demos and event recaps.

It's an [Agent Skill](https://agentskills.io), written against the portable subset of the open standard. Verified in Claude Code; Gemini CLI, Codex and OpenCode should work per the standard but aren't tested yet.

> The skill's own instructions (`SKILL.md`, `reference/`, `styles/`) are written in Spanish. Agents follow them fine in any language, and the decks it produces are in whatever language you ask for.

## What it produces

- **A standalone `.html` file.** No build step, no toolchain. Open it in any browser and present: 1920×1080 canvas, keyboard navigation (←/→/space), fullscreen, progress bar.
- **A faithful PDF** through the browser's native print (`Cmd/Ctrl+P`). It exports the **final state** of each slide: animations resolved, counters at their real value, no player chrome.
- **An editable PPTX** (`node scripts/export-pptx.mjs deck.html`) with native PowerPoint text and shapes, not embedded images. Editable in PowerPoint or Google Slides.

## How to use it

Ask for something like *"make me an 8-slide pitch deck about my startup"* and the skill drives the rest of the conversation. It isn't one rigid chain: there are **eight phases**, each with its own trigger. The first six build a new deck end to end; `add` and `fix` run on their own against an existing deck.

| Phase | Triggered by | What it does |
|---|---|---|
| **init** | The initial request, or "change the palette/pack/typeface" | Pick or change the visual pack, brand colors, typography |
| **brief** | After init, or "change the topic/length/content" | Topic, audience, deck type, length, web research, narrative arc, a wireframe you approve |
| **assets** | After the wireframe is approved | Mandatory, blocking checklist of images, logos and real data per slide |
| **build** | After assets are resolved | Animation level and final HTML generation |
| **audit** | Before delivery, or "audit the deck" | Automated validation: contrast, HTML balance, voice rules, pending assets |
| **export** | "export to PDF/PPTX", "give me the notes" | Native PDF, editable PPTX, offline deck, speaker notes |
| **add** | "add a slide about X" | Insert slides into an existing deck, renumbering everything automatically |
| **fix** | "slide 7 looks generic, improve it" | Fix or improve specific slides without touching the rest |

## Install

Clone the repo straight into your tool's skills folder:

```bash
# Claude Code
git clone https://github.com/pedroanze/slizdeck ~/.claude/skills/slizdeck

# Gemini CLI
git clone https://github.com/pedroanze/slizdeck ~/.gemini/skills/slizdeck

# Codex
git clone https://github.com/pedroanze/slizdeck ~/.codex/skills/slizdeck

# OpenCode
git clone https://github.com/pedroanze/slizdeck ~/.opencode/skills/slizdeck
```

The first time you export to PPTX, install dependencies in the skill root:

```bash
npm install
```

**Requirements:** Node 20+. The validators that measure in a real browser (`check-reveal.mjs`, `check-overflow.mjs`, `check-contrast.mjs`, `shoot.mjs`, `smoke-test.mjs`) also need Google Chrome or Chromium, auto-detected or set with `CHROME_PATH`.

A one-command install (`npx slizdeck install`) and a Claude Code plugin are next on the [roadmap](ROADMAP.md).

## Update and uninstall

```bash
cd ~/.claude/skills/slizdeck && git pull
```

After updating, `node scripts/doctor.mjs deck.html` tells you whether a deck generated with an older engine version is missing a known fix (it warns, it doesn't repair).

To uninstall, `rm -rf ~/.claude/skills/slizdeck`. The only thing slizdeck can leave outside that folder is the optional hook from `reference/hooks.md`: if you installed it, remove its `hooks.PostToolUse` block from the project's `.claude/settings.local.json`.

## Design

Five **style packs**, each a complete visual world (palette, typography and composition rules), each with 2 curated alternative typefaces:

| Pack | Background | Typography | For |
|---|---|---|---|
| `terminal` | Near black | Archivo + JetBrains Mono | Infra, AI, technical demos. Dark room with a projector. |
| `paper-white` | Literal white | Schibsted Grotesk | When content and figures must carry all the weight. |
| `committed` | Dominant cobalt | Bricolage Grotesque + Manrope | The pitch that needs to be remembered. Keynotes, launches. |
| `instrument` | Cool neutral | Public Sans + Martian Mono | Metric-dense decks: traction, unit economics. |
| `editorial` | Pure white | Young Serif + Chivo | Thesis-driven talks where text breathes. |

None uses the fonts or color combinations that give away AI-generated interfaces, and all pass a contrast validator:

```bash
node scripts/check-style-pack.mjs styles/terminal.md
```

## Known limitations

- **PPTX supports a closed set of recognized patterns.** A layout pattern the export script doesn't know is left out of the `.pptx`; the script lists the missing text and exits with code 1. A geometry-based export that removes this limit is on the roadmap.
- **PPTX format trade-offs:** no animations (final state is exported), fonts mapped to safe Office equivalents, cover/closing gradients flattened to a solid color, images replaced by a shape labeled with the `alt` text.
- **Speaker notes go to a separate `.md`**, not PowerPoint's native notes field.
- **`npm install` reports 2 `high` vulnerabilities** in `image-size`, a transitive dependency of `pptxgenjs`. The export doesn't parse images and only processes your own decks, so the real risk is low.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (Spanish). Issues and pull requests in English are welcome.

## Credits and license

Fork/adaptation of [`claude-slides`](https://github.com/marcogalluccio/claude-slides) by Marco Galluccio (MIT). See `NOTICE.md` for what was inherited and what was rewritten.

MIT, see `LICENSE`.
