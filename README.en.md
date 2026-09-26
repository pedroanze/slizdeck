<div align="center">
  <img src="SlizDeck.png" alt="SlizDeck" width="200">

  <p><strong>Ask your agent for a pitch deck. Get an animated, researched deck ready to present.</strong></p>

  <a href="https://www.npmjs.com/package/slizdeck"><img src="https://img.shields.io/npm/v/slizdeck?color=0B5CFF&label=npm" alt="npm"></a>
  <a href="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml"><img src="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT"></a>

  <p><strong>English</strong> · <a href="README.md">Español</a></p>
</div>

An [Agent Skill](https://agentskills.io) for Claude Code, Codex, Gemini CLI and OpenCode. The agent researches the topic, proposes a structure, asks you for the data it's missing, and builds the deck: little text, hard data, and a design that doesn't look AI-generated.

## Install

```bash
npx slizdeck install
```

It detects your agents and sets the skill up in all of them. Also available as a Claude Code plugin (`/plugin marketplace add pedroanze/slizdeck`) or with `npx skills add pedroanze/slizdeck`. Requires Node 20+ and Chrome.

## Use

Talk to your agent:

> *"Make me a 10-slide investor pitch deck about my startup"*
> *"Add a traction slide after slide 4"*
> *"Export it to PDF and PowerPoint"*

It checks style, audience and data with you before building, and validates contrast, overflow and text before handing it over. The skill's instructions are in Spanish; your deck comes out in whatever language you ask for.

**You get** an `.html` you present from any browser (with presenter mode: press `P`), a lightweight PDF and an editable PowerPoint.

## Five styles

<table>
  <tr>
    <td><img src="docs/img/pack-terminal.jpg" alt="terminal"><br><sub><b>terminal</b> · technical demos</sub></td>
    <td><img src="docs/img/pack-paper-white.jpg" alt="paper-white"><br><sub><b>paper-white</b> · figures first</sub></td>
    <td><img src="docs/img/pack-committed.jpg" alt="committed"><br><sub><b>committed</b> · memorable pitch</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/pack-instrument.jpg" alt="instrument"><br><sub><b>instrument</b> · metric-heavy decks</sub></td>
    <td><img src="docs/img/pack-editorial.jpg" alt="editorial"><br><sub><b>editorial</b> · thesis-driven talks</sub></td>
    <td><img src="docs/img/ejemplo-grafica.jpg" alt="Slide with a chart"><br><sub>Animated charts, tables and timelines</sub></td>
  </tr>
</table>

Have brand colors? Give them to the agent and it adapts them to the style you pick.

## More

`npx slizdeck update` · `npx slizdeck uninstall` · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Report an issue](https://github.com/pedroanze/slizdeck/issues/new/choose)

Thoroughly tested in Claude Code; the other agents install it and should work per the standard, but haven't been tested end to end yet. Fork of [`claude-slides`](https://github.com/marcogalluccio/claude-slides) (MIT), see [`NOTICE.md`](NOTICE.md).
