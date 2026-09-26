# Roadmap

Hacia dónde va slizdeck. Es un plan vivo, medido en días de trabajo: se ajusta con el feedback de quienes lo usan. Para proponer algo, abre un issue con la plantilla "Propuesta".

## Principios que no cambian

- **Un archivo HTML autónomo** como salida, sin build step.
- **Ninguna validación miente**: si un script no puede comprobar algo, lo dice; si un export pierde contenido, lo reporta y sale con error.
- **Portable entre agentes** (Claude Code, Codex, Gemini CLI, OpenCode), escrito contra el estándar abierto de Agent Skills.

## 1.5 · Higiene y base comunitaria — día 1

- [x] Documentación coherente entre fases (política de HEAVY, reporte de export incompleto, ruta del hook)
- [x] Plantillas de issues: bug, "mi deck salió mal", propuesta de pack o patrón
- [x] README en inglés (`README.en.md`)
- [ ] GitHub Discussions activado

## 2.0 · Instalación en un comando — días 2 a 3

- [ ] `npx slizdeck install` detecta los agentes instalados y deja la skill lista, con dependencias
- [ ] CLI único para todos los scripts, desde cualquier carpeta: `npx slizdeck audit|shoot|export|doctor …`
- [ ] Plugin de Claude Code: `/plugin marketplace add pedroanze/slizdeck`, con el hook de verificación incluido
- [ ] Compatible con `npx skills add pedroanze/slizdeck`
- [ ] Publicación automática a npm al etiquetar una versión
- [ ] Probado de verdad en Codex, Gemini CLI y OpenCode

## 2.1 · Exports — días 4 a 5

- [ ] PPTX por geometría: cada texto y forma en su posición real medida en Chrome, imágenes reales, notas en el campo de PowerPoint
- [ ] `slizdeck export pdf` con PDF liviano (sin el grano rasterizado ni el marcador de pasos)

## 2.2 · Diseño y animación — días 6 a 8

- [ ] Evals: briefs fijos y una rúbrica para medir la calidad del output entre versiones (se corren antes de cada cambio de diseño)
- [ ] Patrones de datos: tabla, gráficas con ejes, timeline, serie temporal, con animación de entrada y gráficas nativas en PPTX
- [ ] Fuentes por defecto del template fuera de la lista prohibida
- [ ] Nivel de animación MEDIUM, transiciones opcionales entre slides, contadores con decimales
- [ ] Modo presentador con speaker notes, slide siguiente y timer

## 3.0 · Slizdeck Studio — días 9 a 12

- [ ] Editor visual local (`npx slizdeck studio deck.html`): editar texto sobre la slide y dejar comentarios
- [ ] Los comentarios llegan al agente (servidor MCP o ejecución headless de Claude/Codex) y se aplican con la fase `fix`

## Continuo · Comunidad

- [ ] Style packs de la comunidad instalables y validados automáticamente
- [ ] Galería pública de decks de ejemplo en GitHub Pages
