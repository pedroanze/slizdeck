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
- **A faithful, lightweight PDF** (`node scripts/export-pdf.mjs deck.html`, or the browser's native print, `Cmd/Ctrl+P`). It exports the **final state** of each slide: animations resolved, counters at their real value, no player chrome.
- **An editable PPTX** (`node scripts/export-pptx.mjs deck.html`): every text and shape at the real position it has in the deck, measured in Chrome. Native PowerPoint text and shapes, real images, SVG as images with editable labels, speaker notes in the notes field. Editable in PowerPoint or Google Slides.

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

One command, for every agent you have installed (Claude Code, Codex, Gemini CLI, OpenCode):

```bash
npx slizdeck install
```

It detects which agents are on your machine, copies the skill to `<agent>/skills/slizdeck` and installs the export dependencies. Options: `--agent claude,codex` (or `all`), `--project` to install into the current folder only, `--no-deps` to skip `npm install`. `npx slizdeck where` shows where it went; `npx slizdeck env` checks Node, Chrome and dependencies.

**As a Claude Code plugin**, with the automatic verification hook included:

```
/plugin marketplace add pedroanze/slizdeck
/plugin install slizdeck@slizdeck
```

**With [skills.sh](https://skills.sh)**: `npx skills add pedroanze/slizdeck`.

**Manually, with git**, cloning into your tool's skills folder:

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

Installed with git, the first PPTX export needs `npm install` in the skill folder; the script prints the exact command if dependencies are missing.

**Requirements:** Node 20+. The validators that measure in a real browser (`check-reveal.mjs`, `check-overflow.mjs`, `check-contrast.mjs`, `shoot.mjs`, `smoke-test.mjs`) also need Google Chrome or Chromium, auto-detected or set with `CHROME_PATH`.

What's next is on the [roadmap](ROADMAP.md) (Spanish).

## Update and uninstall

```bash
npx slizdeck update                           # installed with npx
/plugin update slizdeck@slizdeck              # installed as a plugin
cd ~/.claude/skills/slizdeck && git pull      # installed with git
```

After updating, `node scripts/doctor.mjs deck.html` tells you whether a deck generated with an older engine version is missing a known fix (it warns, it doesn't repair).

To uninstall: `npx slizdeck uninstall`, `/plugin uninstall slizdeck@slizdeck`, or `rm -rf ~/.claude/skills/slizdeck` if you cloned it. The only thing slizdeck can leave outside that folder is the optional hook from `reference/hooks.md`: if you installed it, remove its `hooks.PostToolUse` block from the project's `.claude/settings.local.json`.

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

- **PPTX: what doesn't travel** (always reported; exits with code 1 if text is lost): text generated by CSS (`content: "…"` in `::before`/`::after`), CSS decorations on pseudo-elements, and box gradients, flattened to their first color. Slide backgrounds with gradients or grain do travel, as a background image.
- **PPTX format trade-offs:** no animations (final state is exported); an HTML table becomes aligned text boxes, not a native PowerPoint table; SVGs travel as images (their `<text>` stays editable).
- **PPTX fonts:** the `.pptx` names the pack's fonts. Without them installed, PowerPoint substitutes and text width can change; `--safe-fonts` uses Arial/Georgia/Consolas instead.
- **`npm install` reports 2 `high` vulnerabilities** in `image-size`, a transitive dependency of `pptxgenjs`. The export doesn't parse images and only processes your own decks, so the real risk is low.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (Spanish). Issues and pull requests in English are welcome.

## Credits and license

Fork/adaptation of [`claude-slides`](https://github.com/marcogalluccio/claude-slides) by Marco Galluccio (MIT). See `NOTICE.md` for what was inherited and what was rewritten.

MIT, see `LICENSE`.
