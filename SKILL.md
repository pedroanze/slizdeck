---
name: slizdeck
description: |
  Genera decks de slides HTML animados a partir de un design system propio — enfocado en pitch decks de startup (minimalista, poco texto, mucha imagen/gráfica), pero también sirve para charlas, demos y recaps de evento. Arquitectura deck-stage 1920×1080 con navegación por teclado, pensado para presentar en vivo. Trae cinco style packs listos (terminal oscuro, blanco puro, color dominante, denso en datos, editorial), cada uno con paleta, tipografía y reglas de composición validadas contra contraste WCAG y clichés visuales de IA. El design system se define de forma guiada —elegir un pack, inyectar los colores de la marca del usuario, o generar una paleta a medida— y nunca requiere que el usuario escriba CSS/JSON a mano. El contenido se construye investigando en internet antes de proponer un wireframe que el usuario aprueba. Salida: archivo HTML autónomo (sin build step) con modo presentador, exportable a PDF liviano y a PPTX editable (texto y formas nativas de PowerPoint; imágenes, SVG y fondos degradados como imagen).

  DISPARADORES: crea un pitch deck, hazme un deck, presentación para X, slides para X, deck de startup, prepara una presentación, build slides, crea slides.
license: MIT
compatibility: Requiere un agente con capacidad de ejecutar comandos de shell (crear/copiar archivos, abrir el navegador) y búsqueda web. Probado en Claude Code; compatible con cualquier cliente del estándar Agent Skills (agentskills.io).
metadata:
  version: "2.3.1"
allowed-tools: Bash, Read, Write, Edit, WebSearch, WebFetch
# user-invocable / argument-hint: extensiones de Claude Code (tab-completion de /slizdeck).
user-invocable: true
argument-hint: "[init|brief|assets|build|audit|export|add|fix] [detalle o deck.html]"
---

# Slizdeck

Genera un deck HTML: canvas 1920×1080 controlado por teclado, autónomo (sin build step), con barra de progreso, pantalla completa y modo presentador (tecla `P`), exportable a PDF y PPTX.

Fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) (MIT) — ver `NOTICE.md`.

## Archivos de la skill

`<skill>` es la carpeta de la que se cargó este `SKILL.md` (ver "Dónde se corre cada cosa").

| Archivo | Uso |
|---|---|
| `template.html` | El engine: canvas, navegación, pasos, tokens, patrones de datos, modo presentador. Punto de partida de todo deck. |
| `reference/init.md` · `brief.md` · `assets.md` · `build.md` · `audit.md` · `export.md` · `add.md` · `fix.md` | Una fase cada uno (tabla de fases abajo). |
| `reference/deck-schema.md` | Formato del wireframe, arcos narrativos, niveles de animación, estructura de cada `<section>`. |
| `reference/design-guidelines.md` | Principios de diseño y anti-clichés. Aplicar en el wireframe y al generar. |
| `reference/components.md` | Catálogo de layouts (cards, grids, mockups, diagramas). **Ir directo al patrón que pide el wireframe.** |
| `reference/media-and-data.md` | Imágenes, métricas y **datos**: gráficas `.sz-chart`, tabla `.sz-table`, timeline `.sz-timeline`, contadores. |
| `reference/animations.md` | Modelo de pasos, stagger, contadores y técnicas SVG para HEAVY, con sus gotchas. |
| `reference/icons.md` | Íconos SVG en línea (`svg.ic`). |
| `reference/design-tokens-schema.md` | Qué hace cada token `--cs-*` (para inyectar colores de marca). |
| `reference/hooks.md` | Hook opcional de Claude Code que audita el deck después de cada edición (`scripts/verify-hook.mjs`). |
| `styles/index.md` | Catálogo de los 5 style packs: **lo único que hay que leer para elegir estilo.** `styles/<pack>.md` trae los tokens y reglas de uno. |
| `examples/pitch-showcase.html` · `examples/datos-showcase.html` | Decks de referencia: un pitch completo y los patrones de datos. |
| `bin/slizdeck.mjs` | Atajo a todos los scripts; acepta packs por nombre. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck (fusiona tokens; al cambiar de pack devuelve al default los del anterior). |
| `scripts/check-style-pack.mjs` | Contrastes de los tokens, distinción primario/acento, clichés de IA. |
| `scripts/audit.mjs` | Validación estática: contraste, balance HTML, reglas de voz, assets pendientes, texto de más, emojis, layouts repetidos. |
| `scripts/check-reveal.mjs` · `scripts/check-overflow.mjs` · `scripts/check-contrast.mjs` | Validación en Chrome: cascada de `.reveal`, texto que desborda o se superpone, contraste medido sobre el fondo real. |
| `scripts/shoot.mjs` | PNG de cada slide en su estado final, para **mirar** el deck en `audit`. |
| `scripts/doctor.mjs` | Avisa si un deck se generó con un engine anterior a algún fix (lee `CHANGELOG.md`). |
| `scripts/renumber.mjs` | Renumera `data-label` y footers en orden de documento. Siempre después de insertar una slide. |
| `scripts/export-pdf.mjs` · `scripts/export-pptx.mjs` · `scripts/make-offline.mjs` | PDF liviano, PPTX editable, deck con las fuentes incrustadas para presentar sin red. |
| `scripts/verify-hook.mjs` | El hook de `reference/hooks.md`. |

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
- **Invocación sin argumento ni pedido claro** (ej. `/slizdeck` a secas, o "¿qué puede hacer esta skill?"): no adivinar ni arrancar `init` a ciegas. Mostrar la tabla de fases de arriba como menú — es la lista completa de lo que se puede pedir — y preguntar cuál corresponde. Si el paso 0 de abajo encuentra un deck existente en el directorio, mencionarlo también como opción ("ya hay un deck.html acá, ¿seguimos con ese o arrancamos uno nuevo?").
- **Paso 0, antes de asumir nada:** si el pedido no nombra un archivo concreto, chequear el directorio actual antes de decidir que es un deck nuevo — `grep -l "data-steps=" *.html 2>/dev/null` (o buscar `<deck-stage`). Si aparece uno o más `.html` con esa firma, no asumir "deck nuevo, sin más contexto": confirmar primero si el pedido es sobre alguno de esos decks existentes. Este chequeo es lo que evita, por ejemplo, arrancar `init`→`brief` desde cero cuando el usuario en realidad quería decir "agregale una slide" sobre un deck que ya está en la carpeta.
- **Deck nuevo, sin más contexto (confirmado por el paso 0):** recorrer `init` → `brief` → `assets` → `build` → `audit` → `export` en orden, una por una, esperando la confirmación que cada archivo de referencia pide antes de avanzar a la siguiente. No saltarse `assets` nunca, aunque el usuario no lo mencione — es la fase que existe precisamente porque se saltaba antes.
- **Petición puntual sobre un deck que ya existe** ("cambia la paleta a X", "agrega una slide de tracción", "arregla la slide 12", "audita esto", "pásalo a PDF"): identificar qué fase la cubre por su columna "Se activa con", cargar solo esa referencia, y resolver sin repetir las fases anteriores. `add` y `fix` terminan siempre corriendo `audit` antes de darse por cerradas — ver sus propios archivos.
- **Ambiguo entre dos fases:** preguntar una vez cuál corresponde, en vez de adivinar.

Al reconocer el disparador inicial: *"Te armo el deck. Antes, defino tu design system y el brief."*

## Dónde se corre cada cosa

El deck vive en la carpeta del proyecto del usuario; los scripts viven en la skill. `<skill>` es la carpeta de la que se cargó este `SKILL.md`: la ruta absoluta que el agente usó para leerlo (`~/.claude/skills/slizdeck`, la caché de un plugin de Claude Code, `~/.codex/skills/slizdeck`…).

**Todo se corre desde la carpeta del proyecto, sin `cd`.** Cada `node scripts/X.mjs` de esta documentación significa `node <skill>/scripts/X.mjs`, y cada `styles/<pack>.md` significa `<skill>/styles/<pack>.md`. Los scripts encuentran sus propios archivos solos; las rutas al deck se resuelven contra la carpeta actual:

```bash
node <skill>/scripts/audit.mjs deck.html
node <skill>/scripts/apply-style-pack.mjs <skill>/styles/terminal.md deck.html
```

`<skill>/bin/slizdeck.mjs` es un atajo equivalente que además acepta packs por nombre: `… new deck.html --pack=terminal` copia el template y aplica el pack en un paso, `… apply-pack terminal deck.html` cambia el pack, `… check deck.html` corre los cuatro validadores. Usar siempre los scripts de `<skill>`, no `npx slizdeck`: `npx` baja la última versión publicada, que puede no coincidir con la skill instalada.

Si `export-pptx.mjs` avisa que faltan dependencias, correr el `npm install --prefix …` exacto que imprime.

## Reglas de voz — aplicar siempre

1. **Sintético en pantalla, el presentador habla.** Nada de párrafos largos en la slide: el discurso completo va en `<aside class="notes">` de cada slide.
2. **Sin punto final** en `h1`/`h2`/`h3`, `.subtitle`, `.ts-tagline`, `.eyebrow` y `.payoff` — son rótulos, no oraciones. **Sí llevan punto** los párrafos de cuerpo (`<p>`), las quotes y los captions (`.glosa`, `.stat-source`). `audit.mjs` solo verifica los cuatro primeros; el resto es criterio del modelo.
3. **Títulos en una sola línea** cuando sea posible.
4. **Numeración 01/02/03**, no A/B/C.
5. **Sin em-dash** (— o --). Usar comas, dos puntos, punto y aparte, o paréntesis.
6. **Sin emojis en las slides** (salvo pedido explícito): usar SVG de `reference/icons.md`.
7. **Puente entre slides** lo dice el presentador — las slides son marco, no discurso completo.
8. **Cover y cierre en gradiente** (`class="grad"`); slides intermedias en `--cs-cream`. Es el default del sistema: si el style pack elegido pide otra cosa (committed manda una de cada tres slides a gradiente), manda el pack.
9. **Cover y transition siempre estáticas** (`data-steps="1" data-current-step="1"`, sin `.reveal`).
10. **Corte directo entre slides** (ya está en el template). Un fundido (`<deck-stage transition="fade">`) solo si el usuario lo pide.
11. **Footer siempre presente**: logo (si hay) + nombre/org + número de slide.

`scripts/audit.mjs` verifica em-dash (5), punto final en `h1/h2/h3/.subtitle` (2), numeración de footers (4, 11) y estáticas sin `.reveal` (9), y **avisa** de slides con más de 45 palabras en pantalla (1) y de emojis (6). Los títulos de una línea, el puente entre slides y el gradiente de cover/cierre quedan a criterio del modelo: ver [reference/audit.md](reference/audit.md).

## Notas finales

- **El template es punto de partida, no dogma.** Si hace falta un layout nuevo, agregarlo a `reference/components.md` después de crearlo.
- **`reference/animations.md` tiene los gotchas** de cada técnica: leerlos antes de usar nivel HEAVY.
- **Probar siempre en el navegador.** Abrir, verificar que el mensaje pasa, iterar.
- **Animar cuesta tokens.** Respetar el nivel elegido; si el usuario pide "esta slide debe ser WOW", subir de nivel solo esa slide, no todo el deck.
