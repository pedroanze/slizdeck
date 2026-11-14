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

- [x] `npx slizdeck install` detecta los agentes instalados y deja la skill lista, con dependencias
- [x] CLI único para todos los scripts, desde cualquier carpeta: `npx slizdeck audit|shoot|export|doctor …`
- [x] Plugin de Claude Code: `/plugin marketplace add pedroanze/slizdeck`, con el hook de verificación incluido
- [x] Compatible con `npx skills add pedroanze/slizdeck`
- [x] Publicación automática a npm al etiquetar una versión
- [ ] Probado de verdad en Codex, Gemini CLI y OpenCode

## 2.1 · Exports — días 4 a 5

- [x] PPTX por geometría: cada texto y forma en su posición real medida en Chrome, imágenes reales, notas en el campo de PowerPoint
- [x] `slizdeck export pdf` con PDF liviano (sin el grano rasterizado ni el marcador de pasos)

## 2.2 · Diseño y animación — días 6 a 8

- [x] Evals: briefs fijos y una rúbrica para medir la calidad del output entre versiones (se corren antes de cada cambio de diseño)
- [x] Patrones de datos: tabla, gráficas con ejes, timeline, serie temporal, con animación de entrada
- [ ] Gráficas nativas en PPTX por default (hoy experimental, `--charts=native`: falta verificarlas en PowerPoint real)
- [x] Fuentes por defecto del template fuera de la lista prohibida
- [x] Nivel de animación MEDIUM, transiciones opcionales entre slides, contadores con decimales
- [x] Modo presentador con speaker notes, slide siguiente y timer

## 2.4 · Escenas 3D opcionales con three.js

- [x] Componente `.sz-3d` opt-in con `three.js` fijado por versión y SRI (`sha384`), evento `stepchange` y ciclo de vida perezoso de contextos WebGL
- [x] Modelos `.glb` empaquetados como sidecar JS clásico (`3d add`), más presets `logo` (SVG extruido) y `particles`
- [x] Pósters PNG automáticos (`3d poster`) para degradación sin red/WebGL y exportación a PDF y PPTX
- [x] Verificación en Chrome con SwiftShader (`3d check`) y modo autónomo sin red (`export offline`)
- [ ] Modelos 3D nativos en PPTX cuando `pptxgenjs` lo soporte

## 2.5 · Slizdeck Studio

El pedido más repetido de quienes usan slizdeck: hacer a mano los ajustes simples, como en PowerPoint, sin pedírselos al agente. Por eso se adelantó desde la 3.0.

- [x] Editor visual local (`npx slizdeck studio deck.html`), sin dependencias, sobre cualquier deck ya generado
- [x] Editar texto sobre la slide, mover con guías, redimensionar y reemplazar imágenes, con deshacer y guardado directo en el HTML
- [x] Slides (reordenar, duplicar, borrar), tipografía y color desde los tokens, paso de animación, datos de gráficas, contadores y notas
- [x] Comentarios al agente (`studio comments --wait`) que se aplican con la fase `fix`
- [ ] Crear elementos nuevos: cuadro de texto, imagen, slide desde un patrón del catálogo
- [ ] Selección múltiple, alinear y distribuir
- [ ] Entrega de comentarios sin `--wait` (servidor MCP o ejecución headless de Claude/Codex)

## 2.6 · 3D sin techo

El 3D deja de ser un adorno de 1 o 2 slides: sirve para mascotas, para ilustrar un producto o un sistema, y para animaciones. Lo motivó el ejemplo `examples/orca/` (Ori), que mostró los límites de la 2.4.

- [ ] Renderer compartido: un solo contexto WebGL para todo el deck, sin tope de escenas (`audit` avisa por costo real: figuras por slide, MB y triángulos)
- [ ] Control de animación: `loop` (`once`, `pingpong`), `then` (volver a otro clip), `speed`, `layers` (clips simultáneos) y morph targets
- [ ] Póster elegible (`poster: {step, clip, time}`) en vez del frame fijo
- [ ] Ilustración de producto: operaciones por step sobre nodos del GLB (vista explosionada, ocultar, rayos X, resaltar), materiales con los tokens del pack y estilo `toon`
- [ ] Etiquetas 3D ancladas a piezas, horneadas en el póster como texto editable en PDF y PPTX
- [ ] Layer persistente de deck: el mismo objeto 3D vive entre slides (guía en una esquina o fondo a pantalla completa), con póster por slide
- [ ] `slizdeck 3d nodes` para listar nodos, morph targets y clips sin cargar el modelo en contexto
- [ ] Ori actualizada: layer en vivo, saludo de una vez que vuelve a `Idle`, parpadeo y gestos

## 2.7 · 3D a medida

- [ ] Preset `shapes`: escena declarativa con primitivas (cajas, esferas, cilindros, flechas, planos, texto) para diagramas y conceptos sin modelo
- [ ] Preset `globe`: puntos y arcos desde datos; `logo` se generaliza a `extrude` para cualquier SVG
- [ ] Escenas a medida con código (`assets/3d/<id>.scene.js`) para lo que nada de lo anterior cubra, con lint bloqueante en `audit` (sin red, sin `eval`)
- [ ] `"interactive": "orbit"`: arrastrar para rotar en vivo, con `OrbitControls` fijado con SRI
- [ ] Showcase 3D ampliado: vista explosionada con etiquetas, globo y escena a medida

## Próximo · Subir el puntaje de los evals

- [ ] Correr los 8 briefs de `evals/` con 2.2 y publicar el primer resultado completo
- [ ] Atacar lo que marcan: texto en pantalla (hoy 52 a 125 palabras por slide) y notas del presentador en todas las slides

## Continuo · Comunidad

- [ ] Style packs de la comunidad instalables y validados automáticamente
- [ ] Galería pública de decks de ejemplo en GitHub Pages
