# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Slizdeck is an **Agent Skill** (not an app): `SKILL.md` at the root is the entry point an agent loads. The same repo is also an npm package (`npx slizdeck install`, CLI in `bin/slizdeck.mjs`) and a Claude Code plugin + marketplace (`.claude-plugin/`, hook in `hooks/hooks.json`); a plain `git clone` into `~/.claude/skills/slizdeck` must keep working too. It generates standalone animated HTML slide decks (1920×1080 `<deck-stage>` canvas) from a design system, exportable to PDF (browser print) and editable PPTX. Forked from `marcogalluccio/claude-slides` (see `NOTICE.md`).

The "product" is mostly prose instructions (`SKILL.md`, `reference/*.md`, `styles/*.md`) plus a deck engine (`template.html`) and a set of zero-build Node validators/exporters in `scripts/`.

## Commands

Node 20+ (CI pins 20 — don't use Node 22-only features like `node --test` with `**` globs). Chrome-based scripts need Chrome/Chromium; auto-detected via `scripts/lib/find-chrome.mjs` or `CHROME_PATH`.

```bash
npm install                 # deps only needed for export-pptx (pptxgenjs, jszip; node-html-parser for --legacy)
npm run check               # check-versions + check-docs + npm test (the local pre-PR gate)
npm test                    # node --test tests/*.test.js (no Chrome needed)
node --test --test-name-pattern="<substring>" tests/validators.test.js   # single test
node scripts/smoke-test.mjs # every style pack × font alternative, renders in Chrome
node bin/slizdeck.mjs help  # CLI: install/update/uninstall/where/env + wrappers for every script
claude plugin validate .    # plugin + marketplace manifests
```

Validating a deck (all scripts are run from the repo root, taking a path to the deck):

```bash
node scripts/audit.mjs deck.html           # static: contrast tokens, HTML balance, voice rules, pending assets
node scripts/check-reveal.mjs deck.html    # Chrome: .reveal cascade resolves when .is-on
node scripts/check-overflow.mjs deck.html  # Chrome: text overflow/truncation/overlap
node scripts/check-contrast.mjs deck.html  # Chrome: computed contrast per text node
node scripts/shoot.mjs deck.html --slides=1 --out=/tmp/shots   # PNG per slide, final state
node scripts/doctor.mjs deck.html          # engine version vs CHANGELOG fixes
node scripts/export-pptx.mjs deck.html out.pptx   # geometry export; exits 1 if any text was dropped
node scripts/export-pdf.mjs deck.html out.pdf     # one page per slide, no grain; checks page count
```

Smoke deck the way CI builds it (`audit.mjs` rejects the template's placeholder `<title>`):

```bash
cp template.html /tmp/d.html
node scripts/apply-style-pack.mjs styles/paper-white.md /tmp/d.html /tmp/d-final.html
sed -i '' 's/Slizdeck · \[DECK NAME\]/Test Deck/' /tmp/d-final.html
```

`.github/workflows/ci.yml` is the authoritative list of what must pass (includes validating `examples/pitch-showcase.html`, PPTX/offline export coverage, and `renumber.mjs` idempotence).

## Architecture

- **`template.html` is the engine.** Every generated deck is a copy of it, so a change here is an engine change that affects all future decks and gets a CHANGELOG entry. It contains: design tokens as CSS variables in `:root` (`--cs-*`), the `<deck-stage>` custom element (fixed-aspect scaling, keyboard nav, progress bar, fullscreen), and the step/reveal controller. Each `<section>` is a slide with `data-label`, `data-steps="N"` and `data-current-step`; `.reveal[data-step=k]` elements get `.is-on` when the current step ≥ k. `@media print` + a `beforeprint` handler force every slide to its final state (reveals on, `data-counter` at final value) so PDF export is correct.
- **Style packs (`styles/<pack>.md`)** declare tokens; `apply-style-pack.mjs` **merges** them into the deck's `:root` (never replace the whole `:root`, or structural tokens like padding/radii are lost). Only `:root` is merged, so anything color-dependent outside `:root` must reference tokens (`var(--cs-primary)`, `color-mix(...)`), never literals.
- **Token semantics gotcha:** `--cs-black` means "primary text color" (light in dark packs) and `--cs-white` is literal white. Card/panel backgrounds must use `var(--cs-surface)`, never `#fff`/`--cs-white`, or dark packs render invisible text. `--cs-accent-on` declares which background the accent is validated against.
- **`export-pptx.mjs` exports by geometry, not by class names.** `scripts/lib/measure-deck.mjs` injects a harness, brings every slide to its final state (same `beforeprint` finalization as print), and walks the DOM in paint order emitting: rects (bg/border/radius), text blocks (runs collected through inline descendants, box from `Range` rects), images and SVGs rasterized in-page via canvas (needs `--allow-file-access-from-files`), and SVG `<text>` as native text. Slides whose `<section>` has a background image/pseudo (gradient + grain) get a JPEG background screenshot, deduplicated through slide masters. The exporter then post-processes slide XML because pptxgenjs emits one `<a:pPr>` per run. New layout patterns need no exporter changes; only CSS-generated text (`::before/::after content`) is lost, and it's reported. `--legacy` keeps the old class-based exporter (`scripts/lib/export-pptx-legacy.mjs`) for one version.
- **Visual check of a PPTX without PowerPoint:** Keynote renders every slide (`osascript`: `open` the file, `export front document ... as slide images`, `close ... saving no`). `qlmanage -t` only renders slide 1 and ignores rotation and text alpha. Neither Keynote nor Quick Look draws pptxgenjs native charts, which is why `--charts=native` is opt-in/experimental.
- **Data patterns (2.2)** live in `template.html`: CSS under `.sz-*` plus a runtime (`renderChart`, `enhanceTimelines`) that draws `.sz-chart` from its inline JSON at load. The final/drawn state must be reachable three ways: `.reveal.is-on` ancestor, `.sz-static` (no reveal), and `@media print`; keep all three in sync when adding a chart element. Highlights use `--cs-accent-ink`, never `--cs-accent` directly.
- **Never put a literal `</body>`, `</head>` or `</script>` inside a script or comment in `template.html`**: scripts inject their harness via `scripts/lib/inject.mjs` (last `</body>`), and the HTML parser ends a `<script>` at the first `</script>` even inside a JS comment.
- **`scripts/score-deck.mjs` + `evals/`** measure output quality across versions; run the briefs before a minor that touches design (see `evals/README.md`).
- **Headless Chrome scripts** (`check-contrast`, `check-overflow`, `check-reveal`, `shoot`) render the deck in place (not copied to tmp, so relative image paths resolve) and use `setTimeout(0)` instead of a nested `requestAnimationFrame` — nested rAF hangs in headless `--disable-gpu`. Keep both conventions.
- **Skill flow:** `SKILL.md` routes requests to eight phases, each documented in its own `reference/<phase>.md` (init → brief → assets → build → audit → export, plus standalone `add` and `fix`). The other `reference/` files are catalogs used by those phases.

## Invariants enforced by tooling

- **Version lives in six places that must match:** `package.json`, `SKILL.md` `metadata.version`, the `slizdeck-engine-version` comment at the top of `template.html`, the first `## x.y.z` entry of `CHANGELOG.md`, and `version` in `.claude-plugin/plugin.json` and in the slizdeck entry of `.claude-plugin/marketplace.json`. Verify with `node scripts/check-versions.mjs`. Bump when a change is something existing decks may need to reapply or changes a user-facing script's behavior; not for typos.
- **`check-docs.mjs`:** every file in `scripts/` and `bin/` must be listed in both `SKILL.md` and `CONTRIBUTING.md` ("Cómo está armado el repo") tables; `README.md` is user-facing only (install, usage, screenshots in `docs/img/`), every `reference/*.md` in `SKILL.md`; relative links must resolve; `DESIGN.md` must stay in sync with `design.json`. Adding a script/reference means updating those tables.
- **Validators must never overclaim** (PRODUCT.md principle): if a script can't verify something it says so; a lossy export exits non-zero. `tests/validators.test.js` mutates `examples/pitch-showcase.html` with one defect per test and asserts the validator fails — add a case there when adding a detection.

## Conventions

- All user-facing docs (`SKILL.md`, `reference/`, `styles/`, README) are in **Spanish** by design; keep them that way. Code comments in scripts are mostly Spanish without accents.
- Commit messages: single imperative line in Spanish describing what and why, no `feat:`/`fix:` prefixes.
- Don't modify `examples/demo-deck.html` — it's the unmodified upstream example (preserved per `NOTICE.md`) and is expected to fail contrast checks. `examples/pitch-showcase.html` is the reference deck that must pass everything.
- New style packs: follow `styles/index.md` → "Añadir un pack nuevo", validate with `node scripts/check-style-pack.mjs styles/<pack>.md`, and add to the tables in `styles/index.md` and `README.md`.
- Release: PR with version bump → merge → `git tag vX.Y.Z && git push --tags`; `.github/workflows/release.yml` runs the checks, publishes to npm and creates the GitHub Release.
- Anything a script needs at runtime must be in both `files` (package.json) and `PAYLOAD` (bin/slizdeck.mjs), or it won't reach npm/`npx slizdeck install` users.
