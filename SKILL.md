---
name: slizdeck
description: |
  Genera decks de slides HTML animados a partir de un design system propio — enfocado en pitch decks de startup (minimalista, poco texto, mucha imagen/gráfica), pero también sirve para charlas, demos y recaps de evento. Arquitectura deck-stage 1920×1080 con navegación por teclado, pensado para presentar en vivo. Trae cinco style packs listos (terminal oscuro, blanco puro, color dominante, denso en datos, editorial), cada uno con paleta, tipografía y reglas de composición validadas contra contraste WCAG y clichés visuales de IA. El design system se define de forma guiada —elegir un pack, inyectar los colores de la marca del usuario, o generar una paleta a medida— y nunca requiere que el usuario escriba CSS/JSON a mano. El contenido se construye investigando en internet antes de proponer un wireframe que el usuario aprueba. Salida: archivo HTML autónomo (sin build step), exportable a PDF con impresión nativa del navegador y a PPTX editable (texto y formas nativas de PowerPoint, no imágenes).

  DISPARADORES: crea un pitch deck, hazme un deck, presentación para X, slides para X, deck de startup, prepara una presentación, build slides, crea slides.
license: MIT
compatibility: Requiere un agente con capacidad de ejecutar comandos de shell (crear/copiar archivos, abrir el navegador) y búsqueda web. Probado en Claude Code; compatible con cualquier cliente del estándar Agent Skills (agentskills.io).
metadata:
  version: "1.0.0"
allowed-tools: Bash Read Write Edit WebSearch WebFetch
---

# Slizdeck

Genera un deck HTML: canvas 1920×1080 controlado por teclado, autónomo (sin dependencias externas de build), con navegación, barra de progreso, fullscreen, y export a PDF por impresión nativa del navegador.

Fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) (MIT) — ver `NOTICE.md`.

## Archivos de la skill

| Archivo | Uso |
|---|---|
| `template.html` | Boilerplate del deck-stage (motor de navegación + tokens de diseño + reveal system). Punto de partida de todo deck nuevo. |
| `reference/init.md` | Fase init: elegir/cambiar pack, colores de marca, tipografía. |
| `reference/brief.md` | Fase brief: tema, público, tipo, tamaño, research, arco narrativo, wireframe. |
| `reference/assets.md` | Fase assets: checklist obligatorio de imágenes, logos y datos por slide. |
| `reference/build.md` | Fase build: nivel de animación y generación del HTML. |
| `reference/audit.md` | Fase audit: qué valida `scripts/audit.mjs` y qué queda a criterio del modelo. |
| `reference/export.md` | Fase export: PDF, PPTX, deck sin red, speaker notes. |
| `reference/add.md` | Fase add: agregar slides a un deck existente sin romper la numeración. |
| `reference/fix.md` | Fase fix: corregir o mejorar una slide puntual sin romper el resto del deck. |
| `reference/hooks.md` | Hook opcional de Claude Code que audita un deck automáticamente después de cada edición — ver `scripts/verify-hook.mjs`. |
| `CHANGELOG.md` | Historial de versiones del engine (`template.html`) — lo que lee `scripts/doctor.mjs` para detectar drift. |
| `CONTRIBUTING.md` | Cómo agregar un style pack/patrón nuevo, correr los tests locales, convención de commits. |
| `.github/workflows/ci.yml` | CI: corre `smoke-test.mjs`, `audit.mjs` y `check-reveal.mjs` en cada push/PR sobre un deck de humo generado en el momento. |
| `reference/design-tokens-schema.md` | Esquema del design system (`design-tokens.json`) y cómo se mapea a las CSS variables del template. |
| `reference/design-guidelines.md` | Principios de diseño: poco texto, un color dominante, anti-clichés, variedad de layout. Aplicar al construir el wireframe y al generar el HTML. |
| `reference/deck-schema.md` | Formato del wireframe, arcos narrativos por tipo de deck, niveles de animación, estructura de cada `<section>`. |
| `reference/components.md` | Catálogo de patrones de layout (cards, grids, mockups, diagramas) con HTML+CSS listos para copiar. |
| `reference/media-and-data.md` | Patrones HTML/CSS de imágenes, métricas, barras y pantalla de inicio (usados desde la fase `build`). |
| `reference/animations.md` | Catálogo de técnicas de animación (reveal por pasos, dibujo de SVG, popups) y gotchas conocidos — solo para nivel HEAVY. |
| `reference/icons.md` | Librería de íconos SVG con estilo coherente. |
| `examples/demo-deck.html` | Deck de ejemplo de 6 slides, referencia end-to-end. |
| `styles/index.md` | Catálogo de style packs. **Lo único que hay que leer para elegir estilo.** |
| `styles/<pack>.md` | Un mundo visual completo: tokens, tipografía y reglas de composición. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck fusionando tokens (no reemplaza el `:root`). |
| `scripts/check-style-pack.mjs` | Valida contrastes, distinción primario/acento y clichés de IA. |
| `scripts/audit.mjs` | Valida un deck generado: contraste, balance HTML, reglas de voz, assets pendientes. |
| `scripts/check-reveal.mjs` | Verifica que la cascada CSS de `.reveal` resuelva bien al revelarse (`.is-on` debe ganar contra cualquier variante `r-*`) — detecta bugs de orden de cascada que `audit.mjs` no puede ver porque solo mira el HTML estático. |
| `scripts/doctor.mjs` | Compara la versión de engine embebida en un deck contra `CHANGELOG.md` y avisa (sin reparar) si le falta algún fix conocido — ver `reference/audit.md`. |
| `scripts/verify-hook.mjs` | Hook opcional de Claude Code: corre `audit.mjs` automáticamente después de editar un deck — ver `reference/hooks.md`. |
| `scripts/export-pptx.mjs` | Exporta un deck HTML a `.pptx` editable (texto y formas nativas). |
| `scripts/make-offline.mjs` | Incrusta las fuentes como `data:` URI para presentar sin red. |
| `scripts/renumber.mjs` | Recalcula `data-label` y `<span class="num">` de todas las slides en orden de documento — usar siempre después de insertar una slide en medio del deck. |

## Cuándo activar esta skill

Cuando el usuario pide slides o una presentación de cualquier tipo. Si no especifica el tipo, asumir **pitch deck de startup** (el caso de uso principal) y confirmarlo en el brief. No activar si el usuario está editando un deliverable existente que no sea HTML (PowerPoint que ya tiene, Canva, Google Slides ya creado) — ahí no aplica esta skill.

## Fases

El flujo completo es multi-turno: una vez cargada esta skill, sigue vigente en toda la conversación hasta cerrar el deck. Pero no es una sola cadena rígida — son ocho fases independientes, cada una con su propio archivo. Las primeras seis arman un deck nuevo de punta a punta; `add` y `fix` se activan sueltas sobre un deck que ya existe.

| Fase | Se activa con | Qué hace | Referencia |
|---|---|---|---|
| **init** | Disparador inicial, o "cambia la paleta/el pack/la tipografía" | Elegir o cambiar pack, colores de marca, tipografía | [reference/init.md](reference/init.md) |
| **brief** | Después de init, o "cambia el tema/tamaño/contenido" | Tema, público, tipo, tamaño, research, arco narrativo, wireframe | [reference/brief.md](reference/brief.md) |
| **assets** | Después de aprobar el wireframe, o "¿qué imágenes necesito?" | Checklist obligatorio y bloqueante de imágenes, logos y datos por slide | [reference/assets.md](reference/assets.md) |
| **build** | Después de resolver assets, o "sube el nivel de animación de la slide 3" | Nivel de animación y generación del HTML | [reference/build.md](reference/build.md) |
| **audit** | Antes de entregar, o "audita el deck" | Validación automática (`scripts/audit.mjs`) + checklist de criterio | [reference/audit.md](reference/audit.md) |
| **export** | "pásalo a PDF/PPTX", "dame las notas" | PDF nativo, PPTX editable, deck sin red, speaker notes | [reference/export.md](reference/export.md) |
| **add** | "agrega una slide sobre X", "mete 2 slides entre la 9 y la 10" | Agregar slides a un deck existente, renumerando todo con `scripts/renumber.mjs` | [reference/add.md](reference/add.md) |
| **fix** | "la slide 7 se ve genérica, mejórala", "arregla el texto de la 12" | Corregir o mejorar una o más slides puntuales sin tocar el resto del deck | [reference/fix.md](reference/fix.md) |

**Ruteo:**
- **Paso 0, antes de asumir nada:** si el pedido no nombra un archivo concreto, chequear el directorio actual antes de decidir que es un deck nuevo — `grep -l "data-steps=" *.html 2>/dev/null` (o buscar `<deck-stage`). Si aparece uno o más `.html` con esa firma, no asumir "deck nuevo, sin más contexto": confirmar primero si el pedido es sobre alguno de esos decks existentes. Este chequeo es lo que evita, por ejemplo, arrancar `init`→`brief` desde cero cuando el usuario en realidad quería decir "agregale una slide" sobre un deck que ya está en la carpeta.
- **Deck nuevo, sin más contexto (confirmado por el paso 0):** recorrer `init` → `brief` → `assets` → `build` → `audit` → `export` en orden, una por una, esperando la confirmación que cada archivo de referencia pide antes de avanzar a la siguiente. No saltarse `assets` nunca, aunque el usuario no lo mencione — es la fase que existe precisamente porque se saltaba antes.
- **Petición puntual sobre un deck que ya existe** ("cambia la paleta a X", "agrega una slide de tracción", "arregla la slide 12", "audita esto", "pásalo a PDF"): identificar qué fase la cubre por su columna "Se activa con", cargar solo esa referencia, y resolver sin repetir las fases anteriores. `add` y `fix` terminan siempre corriendo `audit` antes de darse por cerradas — ver sus propios archivos.
- **Ambiguo entre dos fases:** preguntar una vez cuál corresponde, en vez de adivinar.

Al reconocer el disparador inicial: *"Te armo el deck. Antes, defino tu design system y el brief."*

## Reglas de voz — aplicar siempre

1. **Sintético en pantalla, el presentador habla.** Nada de párrafos largos en la slide — el discurso completo va en las speaker notes.
2. **Sin punto final** en títulos (h1/h2/h3), subtítulos, eyebrows y payoffs de título. Sí llevan punto los párrafos de cuerpo, quotes y captions.
3. **Títulos en una sola línea** cuando sea posible.
4. **Numeración 01/02/03**, no A/B/C.
5. **Sin em-dash** (— o --). Usar comas, dos puntos, punto y aparte, o paréntesis.
6. **Sin emojis en las slides** (salvo pedido explícito) — usar SVG de `reference/icons.md`.
7. **Puente entre slides** lo dice el presentador — las slides son marco, no discurso completo.
8. **Cover y cierre en gradiente** (`class="grad"`); slides intermedias en `--cs-cream`.
9. **Cover y transition siempre estáticas** (`data-steps="1" data-current-step="1"`, sin `.reveal`).
10. **Corte directo entre slides** (ya está en el template, 120ms). Sin sweep/gradiente al entrar.
11. **Footer siempre presente**: logo (si hay) + nombre/org + número de slide.

Estas reglas son las que `scripts/audit.mjs` verifica automáticamente en la fase `audit` — ver [reference/audit.md](reference/audit.md) para la checklist completa y qué queda a criterio del modelo.

## Notas finales

- **El template es punto de partida, no dogma.** Si hace falta un layout nuevo, agregarlo a `reference/components.md` después de crearlo.
- **`reference/animations.md` tiene los gotchas** de cada técnica — leerlos antes de usar nivel HEAVY.
- **Probar siempre en el navegador.** Abrir, verificar que el mensaje pasa, iterar.
- **Animar cuesta tokens.** Respetar el nivel elegido; si el usuario pide "esta slide debe ser WOW", subir de nivel solo esa slide, no todo el deck.
