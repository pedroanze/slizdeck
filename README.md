<div align="center">
  <img src="SlizDeck.png" alt="SlizDeck" width="200">

  <p><strong>Pídele a tu agente un pitch deck. Recibe un deck animado, investigado y listo para presentar.</strong></p>

  <a href="https://www.npmjs.com/package/slizdeck"><img src="https://img.shields.io/npm/v/slizdeck?color=0B5CFF&label=npm" alt="npm"></a>
  <a href="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml"><img src="https://github.com/pedroanze/slizdeck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT-lightgrey" alt="MIT"></a>

  <p><a href="README.en.md">English</a> · <strong>Español</strong></p>
</div>

Una [Agent Skill](https://agentskills.io) para Claude Code, Codex, Gemini CLI y OpenCode. El agente investiga el tema, te propone la estructura, te pide los datos que faltan y genera el deck: poco texto, dato duro y un diseño que no parece hecho por IA.

## Instalación

```bash
npx slizdeck install
```

Detecta tus agentes y deja la skill lista en todos. También como plugin de Claude Code (`/plugin marketplace add pedroanze/slizdeck`) o con `npx skills add pedroanze/slizdeck`. Requiere Node 20+ y Chrome.

## Uso

Háblale a tu agente:

> *"Hazme un pitch deck de 10 slides para inversores sobre mi startup"*
> *"Agrégale una slide de tracción después de la 4"*
> *"Pásalo a PDF y a PowerPoint"*

Te consulta el estilo, el público y los datos antes de generar, y valida contraste, desbordes y texto antes de entregar.

**Recibes** un `.html` que se presenta en cualquier navegador (con modo presentador: tecla `P`), un PDF liviano y un PowerPoint editable.

## Cinco estilos

<table>
  <tr>
    <td><img src="docs/img/pack-terminal.jpg" alt="terminal"><br><sub><b>terminal</b> · demos técnicas</sub></td>
    <td><img src="docs/img/pack-paper-white.jpg" alt="paper-white"><br><sub><b>paper-white</b> · cifras al frente</sub></td>
    <td><img src="docs/img/pack-committed.jpg" alt="committed"><br><sub><b>committed</b> · pitch memorable</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/pack-instrument.jpg" alt="instrument"><br><sub><b>instrument</b> · decks de métricas</sub></td>
    <td><img src="docs/img/pack-editorial.jpg" alt="editorial"><br><sub><b>editorial</b> · charlas con tesis</sub></td>
    <td><img src="docs/img/ejemplo-grafica.jpg" alt="Slide con una gráfica"><br><sub>Gráficas, tablas y timelines animados</sub></td>
  </tr>
</table>

¿Tienes colores de marca? Dáselos al agente y los adapta al estilo que elijas.

## Más

`npx slizdeck update` · `npx slizdeck uninstall` · [Roadmap](ROADMAP.md) · [Contribuir](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [Reportar un problema](https://github.com/pedroanze/slizdeck/issues/new/choose)

Probada a fondo en Claude Code; en los otros agentes se instala y debería funcionar por el estándar, pero falta probarla de punta a punta. Fork de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) (MIT), ver [`NOTICE.md`](NOTICE.md).
