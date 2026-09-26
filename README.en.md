<div align="center">
  <img src="SlizDeck.png" alt="SlizDeck" width="240">

  <p><strong>Ask your agent for a pitch deck. Get an animated, researched deck ready to present.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/slizdeck"><img src="https://img.shields.io/npm/v/slizdeck?color=0B5CFF&label=npm" alt="npm"></a>
    <a href="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml"><img src="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT"></a>
  </p>

  <p><strong>English</strong> · <a href="README.md">Español</a></p>
</div>

<p align="center">
  <img src="docs/img/pack-committed.jpg" alt="Deck cover with the committed pack" width="820">
</p>

Slizdeck is an [Agent Skill](https://agentskills.io) for **Claude Code, Codex, Gemini CLI and OpenCode**. Ask *"make me an 8-slide pitch deck about my startup"* and the agent researches the topic, proposes a structure, asks you for the missing images and data, and builds the deck: little text, hard data, and a design that doesn't look AI-generated.

## Install

```bash
npx slizdeck install
```

It detects which agents you have and sets the skill up in all of them. That's it.

<details>
<summary>Other ways to install</summary>

**Claude Code plugin** (includes the automatic audit after each edit):

```
/plugin marketplace add pedroanze/slizdeck
/plugin install slizdeck@slizdeck
```

**[skills.sh](https://skills.sh)**:

```bash
npx skills add pedroanze/slizdeck
```

**Only one agent, or only this project:**

```bash
npx slizdeck install --agent claude,codex
npx slizdeck install --project
```

**With git**, cloning into your agent's skills folder:

```bash
git clone https://github.com/pedroanze/slizdeck ~/.claude/skills/slizdeck
```

</details>

**Requirements:** Node 20+ and Google Chrome (for exports and visual checks). `npx slizdeck env` checks everything.

## How to use it

Talk to your agent like you'd talk to a designer:

> *"Make an investor pitch deck for Nimbus, an async standups app"*
> *"Prepare a 15-minute talk on the state of AI models"*
> *"Add a traction slide after slide 4"*
> *"Slide 7 looks generic, improve it"*
> *"Export it to PDF and PowerPoint"*

For a new deck the skill walks through these steps, checking with you at each one:

1. **Style**: pick one of five packs, or give it your brand colors.
2. **Brief**: topic, audience and length. The agent researches the web and proposes a slide-by-slide wireframe.
3. **Assets**: it asks you for the real images, logos and figures it needs. No made-up data.
4. **Build**: it generates the deck at the animation level you choose.
5. **Audit**: it checks contrast, overflow and text before handing it over, and looks at every rendered slide.

Afterwards you can ask for targeted changes ("switch to the terminal pack", "fix the text on slide 12") without redoing anything.

The skill's own instructions are written in Spanish; agents follow them fine, and your deck comes out in whatever language you ask for.

## What you get

| | |
|---|---|
| **A standalone `.html`** | Open it in a browser and present: 1920×1080, arrow keys, fullscreen. Nothing to install. |
| **PDF** | One page per slide, lightweight, animations resolved. |
| **Editable PowerPoint** | Every text and shape in place, editable in PowerPoint or Google Slides, with images and speaker notes. |

```bash
npx slizdeck export pdf deck.html
npx slizdeck export pptx deck.html
```

## Five styles

Each pack is a complete visual world (palette, typography and composition rules), validated against WCAG contrast and against the visual clichés of AI-generated interfaces.

<table>
  <tr>
    <td width="50%"><img src="docs/img/pack-terminal.jpg" alt="terminal pack"><br><strong>terminal</strong>: near black, for infra, AI and technical demos in a dark room.</td>
    <td width="50%"><img src="docs/img/pack-paper-white.jpg" alt="paper-white pack"><br><strong>paper-white</strong>: literal white; content and figures carry all the weight.</td>
  </tr>
  <tr>
    <td><img src="docs/img/pack-committed.jpg" alt="committed pack"><br><strong>committed</strong>: one dominant color, for the pitch that has to be remembered.</td>
    <td><img src="docs/img/pack-instrument.jpg" alt="instrument pack"><br><strong>instrument</strong>: cool neutral, for metric-dense decks.</td>
  </tr>
  <tr>
    <td><img src="docs/img/pack-editorial.jpg" alt="editorial pack"><br><strong>editorial</strong>: serif and space, for thesis-driven talks.</td>
    <td>Have brand colors? Give them to the agent and it adapts them to the pack you choose, checking contrast.</td>
  </tr>
</table>

## Made with slizdeck

Slides from decks generated end to end by the skill, untouched:

<p align="center">
  <img src="docs/img/ejemplo-grafica.jpg" alt="Slide with a training compute chart" width="820">
</p>
<table>
  <tr>
    <td width="50%"><img src="docs/img/ejemplo-tabla.jpg" alt="Slide with a price comparison table"></td>
    <td width="50%"><img src="docs/img/ejemplo-diagrama.jpg" alt="Slide with a flow diagram"></td>
  </tr>
</table>

The full decks, with a log of each test run, are in [`examples/`](examples/).

## Update and uninstall

```bash
npx slizdeck update        # or /plugin update slizdeck@slizdeck
npx slizdeck uninstall
npx slizdeck where         # where it's installed and which version
```

## Good to know

- **Thoroughly tested in Claude Code.** In Codex, Gemini CLI and OpenCode it installs and should work per the Agent Skills standard, but hasn't been tested end to end yet.
- **The PowerPoint uses the style's fonts.** Without them installed, the viewer gets a substitute; for that case there's `npx slizdeck export pptx deck.html --safe-fonts`.
- **The PowerPoint has no animations**: each slide is in its final state.

## More

- [Roadmap](ROADMAP.md) (Spanish).
- [Contributing](CONTRIBUTING.md) (Spanish): repo layout, adding a style or a pattern, tests. Issues and PRs in English are welcome.
- [Changelog](CHANGELOG.md).
- A deck came out wrong or you have an idea? [Open an issue](https://github.com/pedroanze/slizdeck/issues/new/choose).

Fork/adaptation of [`claude-slides`](https://github.com/marcogalluccio/claude-slides) by Marco Galluccio (MIT), see [`NOTICE.md`](NOTICE.md). MIT license.
