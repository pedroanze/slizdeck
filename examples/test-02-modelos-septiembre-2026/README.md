# Prueba end-to-end de slizdeck · CASO 2 (intermedio)

Bitácora de una ejecución completa de la skill `slizdeck` sobre un caso real, con un
agente haciendo a la vez de **operador de la skill** y de **usuario simulado** (decide en
cada punto donde la skill se bloquea esperando confirmación humana).

- **Fecha de la prueba:** 2026-09-06
- **Versión de la skill:** 1.4.0 (`SKILL.md` / `template.html` / `CHANGELOG.md`)
- **Deck generado:** [`frontier-septiembre-2026.html`](frontier-septiembre-2026.html)
- **Exports:** [`frontier-septiembre-2026.pdf`](https://github.com/pedroanze/slizdeck/releases/download/examples/frontier-septiembre-2026.pdf) (14 págs, 16,1 MB) ·
  [`frontier-septiembre-2026.pptx`](https://github.com/pedroanze/slizdeck/releases/download/examples/frontier-septiembre-2026.pptx) (14 slides, 178 KB), en el [release `examples`](https://github.com/pedroanze/slizdeck/releases/tag/examples), fuera del repo por peso
- **Capturas de la fase audit:** [`test-02-modelos-septiembre-2026-shots.zip`](https://github.com/pedroanze/slizdeck/releases/download/examples/test-02-modelos-septiembre-2026-shots.zip) (14 PNG 1920×1080)

---

## 1. Caso y perfil

| | |
|---|---|
| **Tema** | Los modelos de IA de frontera lanzados en la primera semana de septiembre de 2026: GPT-6 Astra (OpenAI), Claude Fable 5.1 / Mythos 5.1 (Anthropic) y los modelos chinos (Kimi K3, Qwen3.8-Max, DeepSeek V4-Pro) |
| **Público** | Audiencia técnica de conferencia / equipo de producto técnico |
| **Tipo** | Talk de 20-25 min |
| **Tamaño** | 13 slides numeradas + 1 pantalla de espera (standby) = 14 `<section>` |
| **Style pack** | `instrument` (asignado por el encargo) |
| **Nivel de animación** | LIGHT |

**Qué se estaba probando en concreto.** Este es el punto intermedio de la batería: un deck
que **sí** lleva gráficas, tablas comparativas, benchmarks y precios lado a lado. Es
exactamente el terreno para el que existe el pack `instrument` ("decks cargados de
métricas […] cuando hay muchas cifras y necesitan leerse comparadas", `styles/instrument.md`).
La pregunta de la prueba es si la skill sostiene ese caso de punta a punta: si el catálogo
de componentes lo cubre, si los validadores lo aprueban, y si los exports lo conservan.

**Restricción dura autoimpuesta:** cero cifras inventadas. Cada número que aparece en una
slide está trazado a una URL en la sección [Fuentes](#4-fuentes). Donde no había dato
publicado se usó el placeholder explícito que manda `reference/assets.md`
(`[DATO PENDIENTE]`), nunca un número plausible.

---

## 2. Bitácora por fase

### Ruteo previo (SKILL.md → "Paso 0")

`SKILL.md` pide, antes de asumir "deck nuevo", buscar decks existentes en el directorio:

```bash
grep -l "data-steps=" *.html 2>/dev/null
```

En la raíz de la skill eso devuelve `examples/demo-deck.html` y `examples/pitch-showcase.html`.
**Decisión del usuario simulado:** son los ejemplos que la propia skill documenta como
referencia, no decks del usuario, así que el pedido es un deck nuevo. Se arranca en `init`.

> **Fricción 1 (menor).** El paso 0 está escrito para "el directorio actual" del proyecto del
> usuario. Cuando el deck se va a generar *dentro* del repo de la skill (que es lo que pide un
> escenario de prueba, y lo que hace `examples/`), el grep engancha los ejemplos propios de la
> skill y el chequeo se vuelve ruido. No es bloqueante, pero el paso 0 no distingue "deck del
> usuario" de "deck de ejemplo de la skill".

---

### Fase `init` — estilo y design system

**Lo que pidió la skill** (`reference/init.md`):
1. Camino (a) design system propio, (b) elegir pack del catálogo, (c) paleta a medida.
2. Con el pack elegido, mostrar sus **2 alternativas tipográficas** y dejar elegir.
3. `init` **decide, no aplica**: el archivo del deck todavía no existe.

**Decisiones del usuario simulado:**

| Decisión | Elección | Por qué |
|---|---|---|
| Camino | (b) pack del catálogo | No hay `design-tokens.json` en el directorio ni colores de marca. |
| Pack | `instrument` | Asignado por el encargo, y es el correcto: el deck es una comparativa de precios y benchmarks. Su nota de composición ("toda cifra en `--cs-font-mono` con `tabular-nums`") es justo lo que una tabla de precios necesita para que las columnas de números se alineen. |
| Tipografía | **Default** (Public Sans + Martian Mono) | Se evaluaron las dos alternativas que trae el pack: `red-hat` (Red Hat Display + Red Hat Mono, "más sistemático") y `commissioner` (Commissioner + Spline Sans Mono, "para dashboards que además tienen que convencer"). Se descartaron: Martian Mono tiene el ancho de dígito más marcado de las tres, y este deck vive de columnas de cifras alineadas. La charla informa, no vende, así que el "trazo más cálido" de `commissioner` no aporta. |
| Colores de marca | Ninguno | No hay marca. El pack se usa tal cual. |

Se comprobó también, como manda `init.md` para el camino (c), si estaba la herramienta
externa opcional de paletas:

```bash
test -f ~/.claude/skills/impeccable/scripts/palette.mjs && echo disponible || echo "no instalada"
```

No se llegó a necesitar (camino b), pero se dejó constancia de que el chequeo está documentado.

> **Fricción 2 (documentación).** `init.md` dice, en su lista de "reglas que no se negocian":
> *"El fondo es blanco puro o casi negro salvo que el mood sea explícitamente ambiental […]
> Un fondo crema 'porque se ve cálido' es el cliché que hay que evitar"*. El pack `instrument`
> usa `--cs-cream: #F2F5F7`, un gris azulado, y su propio archivo se anticipa a la objeción
> ("el tinte frío del fondo es deliberado […] que es la excepción que justifica salirse del
> blanco puro"). La regla y la excepción están en archivos distintos y hay que leer los dos
> para no creer que el pack viola su propia guía. No es un bug, pero es una lectura que cuesta.

---

### Fase `brief` — contenido, tamaño y arco

**Lo que pidió la skill** (`reference/brief.md`): recoger tema/público/tipo/duración,
investigar en internet, proponer 1-3 arcos, presentar el wireframe y **esperar aprobación
explícita**.

**Research.** Se hicieron 8 búsquedas web y 8 `WebFetch` sobre fuentes primarias y
secundarias. Detalle completo en [Fuentes](#4-fuentes). Tres hallazgos de investigación
que cambiaron el brief de partida:

1. El brief decía *"Fable 5.1 ~25 % más barato que Fable 5"*. La realidad publicada es más
   precisa y más interesante: **el precio de lista no se movió** ($10/$50); lo que baja es
   la lectura de caché, de $1,00 a $0,25 por MTok, y el "~25 %" es la estimación de ahorro
   de Anthropic *para cargas típicas*. Eso se convirtió en la slide 04, que es el eje
   argumental del deck.
2. El brief mencionaba **DeepSeek-V3.2-Exp**, que es de septiembre de **2025**. A
   septiembre de 2026 el modelo de frontera de DeepSeek es **V4-Pro** (GA 13-ago-2026).
   Se sustituyó, con fuente.
3. El brief decía **Qwen3-Max**; el flagship vigente es **Qwen3.8-Max** (2,4 T, 3-ago-2026)
   con snapshot **-0902** del 2-sep-2026, que cae dentro de la semana del deck y por tanto
   entró al timeline.

**Arco.** `reference/deck-schema.md` da para "Talk / charla": *historia → giro → insight →
invitación*, 8-12 slides. Se propusieron dos variantes:

- **A (cronológica):** la semana día a día → precios → benchmarks → chinos → qué hacer.
- **B (por eje de decisión):** precio → capacidad → acceso → alternativas abiertas.

**Decisión del usuario simulado: A, con el giro en el medio.** Razón: el público de una
charla de 20 min necesita primero el mapa ("qué pasó esta semana") antes de poder juzgar
comparativas; B arranca con una tabla y pierde a quien no siguió los lanzamientos. Se
respetó el arco de talk poniendo el "giro" en la slide 05 (transición *Ahora, los números*)
y la "invitación" en la 12.

**Wireframe aprobado** (formato de `deck-schema.md`, `SLIDE NN · título · patrón`):

```
SLIDE 00 · Standby · standby (media-and-data.md)        ← sin número de footer
   Pantalla de espera mientras la sala se llena

SLIDE 01 · Cover · cover-gradient
   "Cinco días de frontera" + subtítulo + fecha

SLIDE 02 · La semana · timeline horizontal (PATRÓN NUEVO)
   3 nodos: 01 SEP Anthropic · 02 SEP Alibaba · 03 SEP OpenAI + payoff con el contexto de julio/agosto

SLIDE 03 · Precio de lista · tabla comparativa (PATRÓN NUEVO)
   5 modelos × input / output / contexto / pesos abiertos

SLIDE 04 · Coste efectivo · métrica grande + barras comparativas (media-and-data.md)
   75 % de bajada en lectura de caché + 4 barras de precio de caché

SLIDE 05 · Transition · transición sobre .grad
   "Ahora, los números"

SLIDE 06 · Terminal-Bench 4.0 · gráfica de barras SVG nativa (PATRÓN NUEVO)
   6 modelos, ámbar sobre el que no se puede comprar

SLIDE 07 · Dónde gana cada uno · tabla comparativa (PATRÓN NUEVO)
   5 benchmarks × Astra / Fable 5.1 / Opus 5

SLIDE 08 · Fable y Mythos · pq-card-2col (components.md)
   Un modelo, dos niveles de salvaguardas

SLIDE 09 · Transition · transición sobre .grad
   "El frente abierto"

SLIDE 10 · Pesos abiertos · card grid 3col con .card del template
   Kimi K3 / Qwen3.8-Max / DeepSeek V4-Pro + ficha técnica

SLIDE 11 · Diferencial de precio · métrica grande + progreso/proporción (media-and-data.md)
   57x + 4 barras de precio de salida

SLIDE 12 · Qué hacer · card-grid-4col (components.md)
   Cuatro decisiones concretas

SLIDE 13 · Cierre · cover-gradient
   "El lunes, medí tu caché"
```

**Aprobación:** el usuario simulado aprueba el wireframe. Razón de las dos correcciones que
se hicieron sobre el borrador antes de aprobarlo:
- Se eliminó una slide de "fila de métricas de apertura" (3 cifras sueltas) porque duplicaba
  el mensaje del timeline; `design-guidelines.md` pide una idea por slide.
- Se movió el diferencial de precio (57x) **después** del bloque de pesos abiertos, para que
  la cifra aterrice sobre modelos que el público ya conoce y no como dato suelto.

> **Fricción 3 (real, sobre el catálogo).** El wireframe necesita **tres patrones que no
> existen en la skill**: un timeline horizontal, una tabla comparativa y una gráfica de barras.
> `reference/components.md` tiene 23 patrones y **ninguno es una tabla**, pese a que el pack
> `instrument` está descrito literalmente como el de "benchmarks" y "cifras que necesitan
> leerse comparadas". El índice de `components.md` remite a `media-and-data.md` para "métricas,
> barras comparativas, imágenes a sangre y pantalla de standby", y `media-and-data.md` tampoco
> tiene tabla ni gráfica de ejes. Para el caso de uso central del pack denso en datos hay que
> inventar el patrón desde cero. Detalle en [Hallazgos](#6-hallazgos), H-4.

---

### Fase `assets` — imágenes, logos y datos

**Lo que pidió la skill** (`reference/assets.md`): recorrer el wireframe, clasificar cada
slide, pedir todo en un solo mensaje, y **bloquear hasta tener una respuesta explícita por
ítem** (resuelto / seguir sin él / cambiar el wireframe).

**Petición generada (un solo mensaje, formato del §2 de `assets.md`):**

| # | Slide | Qué debería mostrar | Proporción |
|---|---|---|---|
| A1 | 00 Standby | Imagen de fondo a sangre para la pantalla de espera | 1920×1080 |
| A2 | Footer (todas) | Logo del presentador/org | recuadro, ~22 px de alto |
| A3 | 02 La semana | Logos de OpenAI, Anthropic y Alibaba, uno por nodo del timeline | recuadro, SVG o PNG transparente |
| A4 | 10 Pesos abiertos | Logos de Moonshot AI, Alibaba y DeepSeek, uno por card | recuadro, SVG o PNG transparente |
| D1 | 03 Precio de lista | ¿Los pesos de Qwen3.8-Max están publicados? | dato |
| D2 | 07 Dónde gana | Puntuaciones de Mythos 5.1 fuera de Terminal-Bench 4.0 | dato |

**Resolución explícita de cada ítem (usuario simulado):**

| # | Resolución | Por qué |
|---|---|---|
| A1 | **Seguir sin él** | Una foto de stock en la pantalla de espera es exactamente la iconografía genérica que `design-guidelines.md` prohíbe. El gradiente del pack ya da peso visual. |
| A2 | **Seguir sin él** | El presentador no tiene logo. `.footer .left` queda vacío, que es lo que hace el propio `cover-gradient` cuando no hay logo. |
| A3 | **Seguir sin ellos** | No hay archivos de logo reales en el proyecto, y **hotlinkear el logo de un tercero rompe la autonomía del HTML** (el deck deja de funcionar sin red, justo lo que `make-offline.mjs` intenta evitar). Fabricar una ruta `assets/logos/openai.svg` que no existe sería peor: el deck se rompería en silencio. |
| A4 | **Seguir sin ellos** | Igual que A3. |
| D1 | **Placeholder explícito** | Alibaba anunció la intención de abrir un modelo de la familia Max, pero **no hay publicación de pesos verificable**. La celda va con `[DATO PENDIENTE]`, no con "No" (que sería una afirmación sin fuente) ni con "Sí" (que sería falso). |
| D2 | **Cambiar el wireframe** | Solo hay una cifra pública de Mythos 5.1 (Terminal-Bench 4.0 = 60,9 %). Una columna "Mythos" con cuatro celdas pendientes de cinco no informa. **Se ajustó el wireframe**: la tabla de la slide 07 pasó a comparar Astra / Fable 5.1 / Opus 5 (los tres con las cinco filas completas y trazadas), y Mythos entró en la gráfica de la slide 06 y en la card de la slide 08, que es donde su único dato tiene sentido narrativo. |

Los cuatro ítems "seguir sin él" se materializaron como comentarios `SLIZDECK-ASSET-PENDING`
justo antes de la `<section>` afectada, como manda `assets.md` §3.2, y `audit.mjs` los
reporta después como aviso (no como fallo). Se verificó que así fue.

> **Nota positiva.** Esta fase hizo su trabajo: sin ella el deck habría salido con logos
> hotlinkeados o con rutas de imagen inventadas. La opción 3 ("cambiar el wireframe") es la
> que más valor dio, y es la que un flujo sin fase `assets` nunca habría planteado.

---

### Fase `build` — animación y generación

**Nivel de animación.** `reference/deck-schema.md`: LIGHT es el default para decks de 10
slides o más. **Decisión: LIGHT.** Razón: 13 slides numeradas, y el contenido son tablas y
gráficas; HEAVY sobre una tabla de precios sería decoración que compite con la lectura de
las cifras. Cover, cierre y las dos transiciones quedan estáticas (regla no negociable).

Se usaron las variantes de reveal que `build.md` §1 pide variar por tipo de elemento:
`r-rise` en títulos, `r-scale` en cifras y cards de dato, `r-left` en los nodos del
timeline, `r-wipe` en filas de tabla, barras y la gráfica, `r-mask` en los remates
(`.payoff`), `r-fade` en las notas de fuente. Contenedores con `.stagger` donde el
escalonado era automático.

**Generación:**

```bash
cp template.html examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html
node scripts/apply-style-pack.mjs styles/instrument.md examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html
node scripts/check-style-pack.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html
```

```
✓ Instrument aplicado a examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html
  23 tokens sustituidos
  Google Fonts: sustituido
  Tokens estructurales preservados: 4/4
```

El pack se aplicó con el script, **nunca copiando el `:root` a mano** (los 4 tokens
estructurales `--cs-pad-*` se preservaron, que es exactamente lo que `styles/index.md`
avisa que se pierde si se reemplaza el bloque entero).

Después: `<html lang="es">`, `<title>` real, 14 `<section>` insertadas donde decía
`INSERT SLIDES HERE`, CSS de slide en el bloque `INSERT SLIDE-SPECIFIC CSS BELOW`, footers
`Pedro Anze · Sesión técnica · NN`.

**Patrones nuevos que hubo que escribir** (ver H-4):

- `.tl` — timeline horizontal de 3 nodos sobre una regla, con el nodo del día marcado en ámbar.
- `.dtable` — tabla comparativa **hecha con CSS grid, no con `<table>`**. Decisión técnica
  deliberada: `.reveal` sobre un `<tr>` (`display: table-row`) no acepta `transform` de forma
  fiable en todos los motores, así que las filas de una tabla animada no se pueden revelar.
  Con grid, cada `.trow` es un `div` y `r-wipe` funciona. Queda anotado en el CSS del deck.
- `.chart` — gráfica de barras verticales en **SVG inline**, sin librería ni CDN: `<rect>`
  para las barras, `<line>` para las guías y la base, `<text>` para valores y etiquetas, con
  `aria-label` describiendo la serie completa. El deck sigue siendo autónomo.
- `.kv` — filas clave/valor dentro de las cards de pesos abiertos.

---

### Fase `audit` — validación

Se corrieron los seis validadores + `shoot.mjs`. **Salidas verbatim en
[§5 Salidas de validación](#5-salidas-de-validación).**

**Primera pasada: `check-contrast.mjs` falló con 13 textos por debajo de WCAG AA.**
Dos causas distintas:

1. **11 de los 13** eran `--cs-muted` (#5F7383) sobre `--cs-cream` (#F2F5F7) en texto
   pequeño: cabeceras de tabla (18 px), `.pend`, `.stat-source` (20 px). El ratio real es
   **4,4953:1**, por debajo del 4,5 de AA. Es una propiedad del **pack**, no del deck:
   `check-style-pack.mjs` aprueba ese mismo par con "✓ texto atenuado vs fondo 4.50:1
   (min 3.5)". Los dos validadores se contradicen. Ver H-1.
   **Corrección aplicada al deck:** esos tres usos pasaron de `--cs-muted` a `--cs-body`
   (#38505F, 7,73:1). Se dejaron en `--cs-muted` los usos que sí pasan por ser "texto grande"
   según WCAG (≥18,66 px en bold): `.tl .lab`, `.etiqueta`, `.kv-k`, `.card-eyebrow`.

2. **1 falso positivo:** `<div.seg.a> "$0.25"` reportado como *blanco sobre `rgb(242,245,247)`*,
   1,09:1. El elemento tiene su **propio** fondo `--cs-primary` (#0F5FD6); blanco sobre ese
   azul da 5,79:1 y pasa de sobra. El script mide contra el fondo del **padre**, ignorando el
   background del propio elemento. Ver H-2.
   **Workaround aplicado al deck** (no se tocó el script): envolver el texto en un `<span>`
   dentro de `.seg`, para que el nodo de texto tenga como `parentElement` el elemento que sí
   lleva el fondo.

**Segunda pasada: mirar las 14 capturas de `shoot.mjs`** (leídas una por una como imagen,
que es lo que `audit.md` exige). Dos hallazgos que ningún script vio:

1. **Bug visual grave: `.grad-word` es ilegible sobre `class="grad"`.** Las dos transiciones
   ("Ahora, los **números**" / "El frente **abierto**") tenían la última palabra en
   `--cs-grad-text`, que en `instrument` va de #0F5FD6 a #0D1B26 — el **mismo** degradado que
   el fondo `.grad` de la slide. La palabra se desvanece hasta desaparecer: en la captura de
   la slide 09 se lee "El frente abie___". Y `check-contrast.mjs` **no puede verlo**: salta
   por diseño todo lo que tenga `background-clip: text` (los reporta como "22 textos no
   medidos, revisar a ojo"). Ver H-3.
   **Corrección aplicada al deck:** se quitó el `.grad-word` de las dos transiciones.
2. **Tercio inferior vacío** en 6 slides de contenido: `.pad` alinea arriba y el contenido
   ocupaba ~700 de los 864 px útiles, dejando el conjunto colgando. **Corrección:** `.pad mid`
   (centrado vertical conservando alineación a la izquierda) en las slides 02, 06, 07, 08,
   10 y 12. Se volvió a capturar y a mirar: resuelto.

Una sola ronda de correcciones en un batch, como pide `audit.md` ("una tanda de capturas →
mirarlas todas y anotar → un batch de correcciones"). Segunda tanda solo para verificar.

**Checklist de criterio (lo que ningún script revisa), juzgado sobre las capturas:**

- [x] Un mensaje por slide, ninguna cae en párrafo.
- [x] Variedad de layout entre consecutivas: timeline → tabla → métrica+barras → transición →
      gráfica → tabla → cards → transición → cards → métrica+proporción → cards. Las dos
      tablas (03 y 07) están separadas por tres slides.
- [x] Elemento visual específico en todas: ninguna es texto/bullets.
- [x] Un color domina (azul de precisión); el ámbar aparece **una sola vez por slide** y
      siempre marcando la excepción, que es lo que pide `styles/instrument.md`: el nodo del
      día en el timeline, el precio de salida de DeepSeek, la barra de Mythos, la celda donde
      Fable gana a Astra, el "Pendiente" de los pesos de Qwen.
- [x] Notas de composición del pack aplicadas, no solo la paleta: todas las cifras en
      `--cs-font-mono` con `tabular-nums`, radios cortos (4-8 px, los del pack), cards de
      tabla pegadas separadas solo por `--cs-border`.
- [x] Sin barras decorativas bajo títulos, sin iconografía de stock (los 4 SVG de la slide 12
      salen de `reference/icons.md`), sin cards anidadas, sin texto centrado fuera de
      cover/transiciones.
- [x] Títulos en una línea en las 11 slides donde cabía.

---

### Fase `export` — PDF y PPTX

**PDF** (Chrome headless, comando literal de `reference/export.md`):

```bash
"$(node scripts/lib/find-chrome.mjs)" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.pdf" \
  --virtual-time-budget=8000 "file://$PWD/examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html"
```

Resultado: **14 páginas, MediaBox 1440×810 (16:9 exacto), 16,1 MB.** Se abrieron y miraron
las páginas 4-7. El estado final se imprime correcto: reveals visibles, `data-counter` en su
cifra real (75 %, 57x), tablas completas, gráfica SVG intacta, transición con el texto ya
corregido. **El PDF es fiel al HTML.** Dos observaciones en H-6 y H-7.

**PPTX:**

```bash
node scripts/export-pptx.mjs \
  examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html \
  examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.pptx
```

```
✓ …/frontier-septiembre-2026.pptx · 14 slides · Calibri/Calibri
  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).

⚠ 116 elemento(s) de texto no viajaron al .pptx, en 10 slide(s).
```

**Verificación independiente descomprimiendo el `.pptx`** (`ppt/slides/slideN.xml`):

| Cifra buscada | De dónde | ¿Llegó al PPTX? |
|---|---|---|
| `10.00`, `50.00`, `0.435`, `[DATO PENDIENTE]` | Tabla de precios (slide 03) | **NO** |
| `57,7`, `64,6`, `97,6`, `65,0` | Tabla de benchmarks (slide 07) | **NO** |
| `60,9` (etiqueta de la gráfica) | Gráfica SVG (slide 06) | **NO** (`60,9` solo aparece en el `.payoff` de la slide 08) |
| `$0.25` | Barras `.barras` (slide 04) | **SÍ** |
| `$50.00`, `$0.87` | Proporción `.prop` (slide 11) | **SÍ** |
| `75%`, `57x` | Contadores `[data-counter]` | **SÍ** |
| `2,8 T` | `.payoff` de la slide 02 | **SÍ** (el texto de las `.kv` de la slide 10, no) |
| Títulos `h3` de las 4 cards de la slide 12 | `card-grid-4col` | **NO** (solo sobreviven los `<p>`) |
| `Fable 5.1` / `Mythos 5.1` (`h3` de `.pq-card`) | `pq-card-2col` | **NO** (solo sobreviven los `<p>`) |
| `.glosa` de las dos métricas grandes | `media-and-data.md` | **NO** |
| `.marca` y `.cuando` del standby | `media-and-data.md` | **NO** |

**Respuesta directa a la pregunta del encargo: sí, el export a PPTX pierde las dos tablas
comparativas y la gráfica por completo.** Lo que sí sobrevive de la parte de datos son las
barras (`.barras`), la proporción (`.prop`) y los contadores. Las tablas y la gráfica son
patrones nuevos, así que su pérdida está dentro de lo documentado (`export.md`: "si el
wireframe usa un patrón de layout nuevo […] ese contenido no aparece en el `.pptx`"). Lo
que **no** está dentro de lo documentado es que se pierdan los `h3` de `pq-card-2col` y de
`card-grid-4col` (patrones de `components.md`) y la `.glosa` y el standby de
`media-and-data.md`, cuyo propio archivo afirma cobertura total. Ver H-5.

**Nota positiva importante:** el aviso de 116 elementos perdidos es exactamente el
comportamiento que hay que tener. El script no dice "✓ 14 slides" y calla; enumera lo que
dejó fuera con tag, clase y texto. Sin ese listado esta prueba no habría podido cuantificar
nada.

**Deck sin red.** No se corrió `make-offline.mjs`: no era necesario para la prueba y el
propio `export.md` avisa de que descarga las fuentes en el momento. Se deja anotado como no
ejecutado, no como pasado.

**Speaker notes.** No se generaron: `export.md` las condiciona a que el usuario las pida.

---

## 3. Decisiones del usuario simulado, en una tabla

| # | Punto de bloqueo | Decisión | Por qué |
|---|---|---|---|
| 1 | Paso 0: hay `.html` con `data-steps=` en el directorio | Deck nuevo | Los `.html` encontrados son los ejemplos de la propia skill, no decks del usuario |
| 2 | `init`: alternativa tipográfica | Default (Public Sans + Martian Mono) | El deck vive de columnas de cifras; Martian Mono es la más tabular de las tres |
| 3 | `brief`: arco narrativo | Cronológico con giro al medio | El público necesita el mapa antes de la comparativa |
| 4 | `brief`: aprobar wireframe | Aprobado con 2 ajustes | Quitar una slide redundante de métricas; mover el 57x después de presentar los modelos |
| 5 | `assets` A1-A4: imágenes y logos | Seguir sin ellos, con marcador | Hotlinkear logos rompe la autonomía del HTML; inventar rutas rompe el deck en silencio |
| 6 | `assets` D1: pesos de Qwen3.8-Max | `[DATO PENDIENTE]` | Hay anuncio de intención, no hay publicación verificable |
| 7 | `assets` D2: benchmarks de Mythos 5.1 | Cambiar el wireframe | 4 de 5 celdas pendientes no informan; se rediseñó la tabla en torno a datos completos |
| 8 | `build`: nivel de animación | LIGHT | 13 slides; HEAVY sobre tablas compite con la lectura de las cifras |
| 9 | `audit`: 11 fallos de `--cs-muted` | Corregir el deck a `--cs-body`, reportar el pack | El deck no puede entregarse con AA fallando; el pack no se toca (regla de la prueba) |
| 10 | `audit`: falso positivo de `.seg.a` | Workaround en el deck, bug reportado | El script mide mal, pero no se edita el detector "a ciegas" (`audit.md`, doctrina "a decidir") |
| 11 | `audit`: `.grad-word` ilegible | Quitar el realce de las 2 transiciones | Prioridad absoluta a la legibilidad; el bug se reporta |
| 12 | `export`: 116 elementos perdidos en PPTX | Aceptar y documentar | El HTML es el entregable; el PPTX se entrega con el inventario de lo que falta |

---

## 4. Fuentes

Toda cifra que aparece en una slide está en esta lista. Ninguna celda de las dos tablas
comparativas carece de fuente.

### GPT-6 Astra (OpenAI)

| Dato usado | Slide | Fuente |
|---|---|---|
| Anunciado 3-sep-2026; despliegue a planes de pago, API y AWS los días siguientes | 02 | [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/gpt-6-astra-pricing-confirms-125442006.html) ("Release date: September 3, 2026") · [DataCamp](https://www.datacamp.com/blog/gpt-6-astra) ("rolling out to a limited set of organizations first, then to all ChatGPT Plus, Pro, Business, and Enterprise users over the coming days, plus the OpenAI API and AWS") · [llm-stats](https://llm-stats.com/models/gpt-6-astra) ("Released on Sep 4, 2026") |
| $10,00 input / $50,00 output por MTok | 03, 04, 11 | [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/gpt-6-astra-pricing-confirms-125442006.html) · [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| $1,00 lectura de caché por MTok | 04 | [llm-stats](https://llm-stats.com/models/gpt-6-astra) ("Cached input: $1.00") |
| Contexto 1M | 03 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) ("a 1M-token context model") |
| Terminal-Bench 4.0 = 57,7 | 06, 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Terminal-Bench Science = 64,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| AutomationBench = 41,4 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| FrontierMath Tier 4 = 97,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Humanity's Last Exam con tools = 57,2 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |

### Claude Fable 5.1 / Mythos 5.1 (Anthropic)

| Dato usado | Slide | Fuente |
|---|---|---|
| Lanzados 1-sep-2026 | 02 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) · [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| $10,00 / $50,00 por MTok (sin cambio respecto a Fable 5) | 03 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) |
| Caché: $0,25 (Fable 5.1) frente a $1,00 (Fable 5); bajada del 75 % | 04 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) (tabla "Fable 5.1 $10 / $0.25 / $50" vs "Fable 5 $10 / $1.00 / $50") |
| Contexto 1M, salida máx. 128K | 03 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| Disponible como `claude-fable-5-1` en API de Anthropic, Amazon Bedrock, Google Cloud y Microsoft Foundry | 08 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| Mythos 5.1 = mismo modelo, salvaguardas distintas, acceso restringido a ciberseguridad y ciencias de la vida | 08 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) |
| Terminal-Bench 4.0: Fable 5.1 = 55,8 · Mythos 5.1 = 60,9 | 06, 07, 08 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) · corroborado por [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) para Fable 5.1 |
| Terminal-Bench Science 0.1: Fable 5.1 = 52,6 · Opus 5 = 29,0 · Fable 5 = 24,7 · Sol = 22,4 | 07 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| AutomationBench: Fable 5.1 = 31,4 · Opus 5 = 26,9 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) · Fable 5.1 corroborado en [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| FrontierMath Tier 4: Fable 5.1 = 87,8 · Opus 5 = 73,2 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| HLE con tools: Fable 5.1 = 65,0 · Opus 5 = 63,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Terminal-Bench 4.0: Opus 5 = 52,3 · Fable 5 = 42,0 · GPT-5.6 Sol = 37,3 | 06 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |

### Kimi K3 (Moonshot AI)

| Dato usado | Slide | Fuente |
|---|---|---|
| 2,8 T de parámetros totales, 104 B activos por token | 02, 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("2.8 trillion parameter mixture of experts model", "104 billion active parameters per token") |
| Contexto 1M (1.048.576 tokens) | 03 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) |
| Pesos abiertos el 26-jul-2026 | 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("Release Date: July 26, 2026") |
| Licencia `kimi-k3`: condiciona el uso comercial de inferencia por encima de 20 M USD/año | 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("gates commercial inference use above $20 million a year in revenue") |
| $3,00 input / $15,00 output; $0,30 en cache hit | 03, 04, 11 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("$3 per million input tokens on a cache miss and $15 per million output tokens, with a much cheaper $0.30 per million tokens on a cache hit") |

### Qwen3.8-Max (Alibaba)

| Dato usado | Slide | Fuente |
|---|---|---|
| 2,4 T de parámetros, 95 B activos, contexto 1M | 10 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("2.4-trillion-parameter mixture-of-experts (MoE) model with 95B active parameters", "1M-token context window") |
| Release 3-ago-2026; snapshot **-0902** el 2-sep-2026 | 02 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) · [MarkTechPost](https://www.marktechpost.com/2026/07/19/alibaba-previews-qwen3-8-max-a-2-4-trillion-parameter-multimodal-model-days-after-moonshots-kimi-k3-open-weight-launch/) |
| Code Arena WebDev = 1691 puntos (versión -0902), primer puesto | 02 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("ranks first on Code Arena WebDev with 1,691 points") |
| $2,00 input / $6,00 output por MTok | 03, 11 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("$2/$6 per million input/output tokens") |
| Pesos abiertos: **`[DATO PENDIENTE]`** | 03, 10 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) dice "the first time Qwen **plans** to open-source a Max-class model": hay intención anunciada, no publicación verificable. Por eso el placeholder. |

### DeepSeek V4-Pro

| Dato usado | Slide | Fuente |
|---|---|---|
| 1,6 T de parámetros totales, 49 B activos, contexto 1M | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) ("1.6T total parameters, 49B active", "1M token context window") |
| GA el 13-ago-2026 (checkpoint V4-Pro-0813) | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) |
| $0,435 input / $0,87 output por MTok | 03, 11 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) ("$0.435 / 1M input and $0.87 / 1M output") |
| SWE-bench Verified = 80,6 frente a 80,8 de Claude Opus 4.7; LiveCodeBench = 93,5 | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) |

### Cifras derivadas (aritmética sobre datos con fuente, no dato publicado)

| Cifra | Slide | Cálculo |
|---|---|---|
| **57x** | 11 | $50,00 (Astra output) ÷ $0,87 (V4-Pro output) = 57,47 → se muestra 57x |
| Barras de proporción de la slide 11 (`--v` = 1 / 0,30 / 0,12 / 0,017) | 11 | Cada precio de salida dividido por $50,00 |
| Barras de caché de la slide 04 (100 % / 100 % / 30 % / 25 %) | 04 | Cada precio de caché dividido por $1,00 |

### Conflictos entre fuentes, resueltos y anotados

Se documentan porque afectan a la confianza en las cifras, no porque cambien el deck:

1. **Fecha de release de GPT-6 Astra:** Yahoo Finance dice 3-sep; llm-stats dice 4-sep.
   Coherente con "anuncio el 3, disponibilidad el 4" (que es lo que dice el brief de partida
   y lo que corrobora DataCamp con su "over the coming days"). El deck redacta las dos fechas
   explícitamente: *"Anunciado el 3 y desplegado desde el 4"*.
2. **Parámetros activos de Kimi K3:** roo.beehiiv dice **104 B activos**; el
   [blog de Hugging Face](https://huggingface.co/blog/ResterChed/kimi-k3-model-overview-mxfp4-quantization-open-wei)
   dice "~50B equivalent (16/896 experts)". Se usó 104 B (fuente más explícita y coherente
   con Tom's Hardware); el conflicto queda anotado aquí.
3. **Fecha de pesos abiertos de Kimi K3:** 26-jul (roo.beehiiv) vs 27-jul (Hugging Face).
   Se usó 26-jul.
4. **SWE-bench Verified de DeepSeek V4-Pro:** Codersera da 80,6 (vs Opus 4.7 = 80,8); una
   búsqueda devolvió una cifra de 96,40 % "en el harness neutral de Vals" contra Opus 5.
   **Son escalas distintas y no se pueden mezclar en la misma frase.** El deck usa solo la
   pareja de Codersera, con el modelo de comparación nombrado explícitamente
   ("Empatado con Claude Opus 4.7 en SWE-bench Verified, 80,6 contra 80,8"), y no menciona
   la otra. Esto es exactamente el tipo de celda que habría invalidado la tabla si se
   hubiera puesto sin nombrar el harness.

### Fuentes consultadas que no aportaron dato al deck

- `https://openai.com/index/gpt-6-astra/` — **HTTP 403** vía WebFetch. La fuente primaria no
  es accesible desde la herramienta; todo lo de Astra viene de secundarias.
- `https://www.tomshardware.com/tech-industry/artificial-intelligence/moonshot-releases-2-8-trillion-parameter-kimi-k3` —
  el fetch devolvió navegación y promoción de suscripción, no el cuerpo del artículo.
- `https://llm-stats.com/models/gpt-6-astra` — útil solo para precio de caché y contexto; la
  página lista nombres de benchmark sin puntuaciones.

---

## 5. Salidas de validación

Todas desde la raíz de la skill, con la ruta al deck. **Estado final, después de las dos
correcciones de la fase audit.**

### `apply-style-pack.mjs` — pasa

```
$ node scripts/apply-style-pack.mjs styles/instrument.md examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

✓ Instrument aplicado a examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html
  23 tokens sustituidos
  Google Fonts: sustituido
  Tokens estructurales preservados: 4/4
```

### `audit.mjs` — pasa (1 aviso esperado)

```
$ node scripts/audit.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ contraste y paleta (check-style-pack.mjs)
  ✓ balance de <section> (14/14)
  ✓ balance de <div> (266/266)
  ✓ sin em-dash en el contenido
  ✓ sin punto final en h1/h2/h3/.subtitle
  ✓ footers numerados 01..13 sin huecos ni duplicados
  ✓ slides estáticas (data-steps="1") sin .reveal adentro
  ✓ <title> actualizado ("Cinco días de frontera · Modelos de IA, primera semana de septiembre 2026")
  ⚠ 4 asset(s) pendiente(s), aceptados explícitamente en la fase assets
      slide 00 — imagen de fondo a sangre para la pantalla de espera, sigue sin ella
      slide 01 — logo del presentador para el footer de todo el deck, sigue sin el
      slide 02 — logos de OpenAI, Anthropic y Alibaba para los nodos del timeline, sigue sin ellos
      slide 10 — logos de Moonshot AI, Alibaba y DeepSeek para las cards, sigue sin ellos

✓ audit OK · 1 aviso(s)
```

Nota: la slide 00 (standby) **no lleva número de footer**, como manda `media-and-data.md`.
`audit.mjs` la gestionó bien: numeró 01..13 sin quejarse del hueco. Bien resuelto.

### `check-style-pack.mjs` — pasa

```
$ node scripts/check-style-pack.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ ink de cuerpo vs fondo   7.73:1  (min 7)
  ✓ titulo vs fondo          15.96:1  (min 7)
  ✓ texto atenuado vs fondo  4.50:1  (min 3.5)
  ✓ primario vs fondo        5.29:1  (min 3)
  ✓ acento vs fondo          9.44:1  (min 3)
  ✓ ink de cuerpo vs card    8.46:1  (min 7)
  ✓ primario vs acento       1.79:1  (min 1.7)

✓ contraste OK
```

### `check-reveal.mjs` — pasa

```
$ node scripts/check-reveal.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ Todo .reveal revelado queda con transform/filter en "none" — la cascada de .is-on gana contra cualquier variante r-*.
```

### `check-contrast.mjs` — **FALLÓ en la primera pasada**, pasa tras corregir

Salida verbatim del **primer** run (13 fallos):

```
$ node scripts/check-contrast.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✗ 03 Precio de lista
      <div>  "Modelo"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Input $/MTok"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Output $/MTok"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Contexto"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Pesos abiertos"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div.pend>  "[DATO PENDIENTE]"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 19px
      <div.stat-source.reveal.r-fade.is-on>  "Tarifas estándar publicadas al 06 de septiembre de"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 20px

  ✗ 04 Cache
      <div.seg.a>  "$0.25"
      1.09:1 sobre 3:1 requerido · rgb(255, 255, 255) sobre rgb(242, 245, 247) · 24px

  ✗ 06 Terminal-Bench
      <div.stat-source.reveal.r-fade.is-on>  "Porcentaje de tareas resueltas en Terminal-Bench 4"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 20px

  ✗ 07 Donde gana cada uno
      <div>  "Benchmark"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "GPT-6 Astra"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Claude Fable 5.1"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px
      <div>  "Claude Opus 5"
      4.5:1 sobre 4.5:1 requerido · rgb(95, 115, 131) sobre rgb(242, 245, 247) · 18px

✗ 13 texto(s) por debajo del umbral WCAG AA (de 228 medidos).
  Subir el contraste del token que use ese texto, o cambiarle el fondo.

  ⚠ 24 texto(s) sobre gradiente, imagen o background-clip NO se midieron:
    su fondo no es un color plano, asi que un solo ratio no lo describiria.
    Revisarlos a ojo (tipicamente el cover y el cierre).
```

Salida del run **final**:

```
$ node scripts/check-contrast.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ los 228 textos medidos pasan el umbral WCAG AA sobre su fondo real.

  ⚠ 22 texto(s) sobre gradiente, imagen o background-clip NO se midieron:
    su fondo no es un color plano, asi que un solo ratio no lo describiria.
    Revisarlos a ojo (tipicamente el cover y el cierre).
```

### `check-overflow.mjs` — pasa

```
$ node scripts/check-overflow.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ Nada desborda el canvas, se trunca en una línea, ni se superpone con otro texto.
```

Vale la pena remarcarlo: pasó con una gráfica SVG de 1680×470, dos tablas de 4-5 columnas y
barras con `white-space: nowrap` dentro. No hubo un solo falso positivo.

### `doctor.mjs` — pasa

```
$ node scripts/doctor.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

  ✓ generado con la versión 1.4.0, al día con el engine actual (1.4.0).
```

### `shoot.mjs` — pasa

```
$ node scripts/shoot.mjs examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html

examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.html — 14 de 14 slide(s) a …/.slizdeck-shots

  ✓ slide 01 → frontier-septiembre-2026-01.png
  ✓ slide 02 → frontier-septiembre-2026-02.png
  … (14 en total)

✓ 14 PNG en …/.slizdeck-shots
```

Las 14 capturas se abrieron y se miraron una por una (no solo se comprobó que existieran).
Fue lo que detectó el bug de `.grad-word` y el desequilibrio vertical.

### PDF (Chrome headless) — pasa

```
$ "$(node scripts/lib/find-chrome.mjs)" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="…/frontier-septiembre-2026.pdf" --virtual-time-budget=8000 "file://…/frontier-septiembre-2026.html"

[5200:752481:0906/184727.741870:ERROR:google_apis/gcm/engine/registration_request.cc:291] Registration response error message: PHONE_REGISTRATION_ERROR
[5200:752481:0906/184727.805132:ERROR:google_apis/gcm/engine/mcs_client.cc:702]   Error code: 401  Error message: Authentication Failed: wrong_secret
[5200:752481:0906/184727.805139:ERROR:google_apis/gcm/engine/mcs_client.cc:704] Failed to log in to GCM, resetting connection.
16069821 bytes written to file examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.pdf
```

Los `ERROR:` de GCM son ruido de Chrome (intento de registro en Google Cloud Messaging), no
del export: el PDF sale correcto. Aun así, un usuario que vea tres líneas rojas va a pensar
que falló. Ver H-7.

### `export-pptx.mjs` — genera, con 116 elementos perdidos

```
$ node scripts/export-pptx.mjs …/frontier-septiembre-2026.html …/frontier-septiembre-2026.pptx

✓ examples/test-02-modelos-septiembre-2026/frontier-septiembre-2026.pptx · 14 slides · Calibri/Calibri
  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).

⚠ 116 elemento(s) de texto no viajaron al .pptx, en 10 slide(s).
  Son patrones de layout fuera del set que el export reconoce (ver cabecera de este script).

  slide 01 — 2 elemento(s):
    <div.marca>  "Sesión técnica · Septiembre 2026"
    <div.cuando.senal>  "Empezamos en unos minutos"

  slide 03 — 11 elemento(s):
    <div.fecha>  "01 SEP"
    <div.lab>  "Anthropic"
    <div.nota>  "Mismo modelo base, dos niveles de salvaguardas. "
    <div.fecha>  "02 SEP"
    <div.lab>  "Alibaba"
    <div.modelo>  "Qwen3.8-Max-0902"
    … y 5 mas

  slide 04 — 26 elemento(s):
    <div>  "Modelo"
    <div>  "Input $/MTok"
    <div>  "Output $/MTok"
    <div>  "Contexto"
    <div>  "Pesos abiertos"
    <div.k>  "GPT-6 Astra"
    … y 20 mas

  slide 05 — 1 elemento(s):
    <div.glosa>  "Lo que baja la lectura de caché en Fable 5.1 fre"

  slide 07 — 17 elemento(s):
    <text.val>  "60,9"
    <text.val>  "57,7"
    <text.val>  "55,8"
    <text.val>  "52,3"
    <text.val>  "42,0"
    <text.val>  "37,3"
    … y 11 mas

  slide 08 — 24 elemento(s):
    <div>  "Benchmark"
    <div>  "GPT-6 Astra"
    <div>  "Claude Fable 5.1"
    <div>  "Claude Opus 5"
    <div.k>  "Terminal-Bench 4.0"
    <div.v.top>  "57,7"
    … y 18 mas

  slide 09 — 6 elemento(s):
    <div.pq-eyebrow>  "Disponible en general"
    <h3>  "Fable 5.1"
    <div.pq-consequence>  "claude-fable-5-1"
    <div.pq-eyebrow>  "Acceso restringido"
    <h3>  "Mythos 5.1"
    <div.pq-consequence>  "Solo organizaciones verificadas"

  slide 11 — 24 elemento(s):
    <span.kv-k>  "Parámetros"
    <span.kv-v>  "2,8 T"
    <span.kv-k>  "Activos"
    <span.kv-v>  "104 B"
    <span.kv-k>  "Pesos"
    <span.kv-v>  "26 jul 2026"
    … y 18 mas

  slide 12 — 1 elemento(s):
    <div.glosa>  "Lo que cuesta un millón de tokens de salida en G"

  slide 13 — 4 elemento(s):
    <h3>  "Medir la factura, no la tarifa"
    <h3>  "Separar el eje agéntico del académico"
    <h3>  "Poner los pesos abiertos en el camino barato"
    <h3>  "Leer el modelo, no el nombre"

  Opciones: reescribir esas slides con un patron soportado, sumar soporte al script,
  o completar el contenido a mano en PowerPoint despues de exportar.
```

Comprobación independiente (descomprimiendo el `.pptx` y buscando cifras concretas en
`ppt/slides/slideN.xml`) en la tabla de la fase [export](#fase-export--pdf-y-pptx).

### No ejecutados

- `make-offline.mjs` — no necesario para la prueba; se deja anotado como no probado.
- `verify-hook.mjs` — hook opcional, fuera del alcance.
- `renumber.mjs`, `add`, `fix` — no aplican a un deck generado de una vez.

---

## 6. Hallazgos

Ordenados por severidad. **Ninguno se corrigió en la skill**: la regla de la prueba era
reportar, no arreglar.

### H-1 · `--cs-muted` del pack `instrument` no llega a WCAG AA, y los dos validadores se contradicen — **Alta**

`styles/instrument.md` declara `--cs-muted: #5F7383` sobre `--cs-cream: #F2F5F7`. El ratio
real es **4,4953:1**, por debajo del 4,5 que exige WCAG AA para texto normal.

- `scripts/check-style-pack.mjs:66` valida ese par con umbral **3,5**:
  `['texto atenuado vs fondo', 'muted', 'cream', 3.5]` → **aprueba** ("✓ 4.50:1 (min 3.5)").
- `scripts/check-contrast.mjs` mide lo mismo ya renderizado con umbral **4,5** → **falla**.

Consecuencia práctica: cualquier deck que use el pack `instrument` con texto atenuado en
tamaño normal (cabeceras de tabla, pies de fuente, captions: justo lo que un deck denso en
datos necesita) queda **bloqueado por `audit`** aunque el pack se haya aprobado. El pack
sale de fábrica sin poder pasar su propio pipeline de validación. Es especialmente irónico
en el pack cuya razón de ser son las tablas.

Se salva por los pelos el texto atenuado en negrita ≥18,66 px, que WCAG considera "texto
grande" (umbral 3:1); por eso `.card-eyebrow` (24 px) y `.tl .lab` (19 px, 700) pasan y las
cabeceras de tabla (18 px, 700) no. La frontera está exactamente entre 18 y 19 px, lo cual
hace el fallo desconcertante para quien lo encuentra.

**Sugerencia:** o subir `--cs-muted` del pack a un valor ≥4,5:1 sobre su `--cs-cream`, o
alinear el umbral de `check-style-pack.mjs` con AA para que el problema se detecte al validar
el pack y no tres fases después.

**Bonus de presentación:** `check-contrast.mjs` imprime `Math.round(got * 100) / 100`, así
que 4,4953 sale como `4.5:1 sobre 4.5:1 requerido`. Leído literalmente parece un bug del
comparador. Con dos decimales fijos (`4.50` / `4.4953`) el mensaje se entendería solo.

### H-2 · `check-contrast.mjs` ignora el `background-color` del propio elemento — **Alta**

`scripts/check-contrast.mjs:142`:

```js
const bg = effectiveBg(el.parentElement || el);
```

`effectiveBg` recorre ancestros apilando fondos, pero **arranca en el padre**, no en el
elemento. Un elemento que lleva texto *y* su propio fondo se mide contra el fondo de detrás.

Reproducido con el patrón `.barras` documentado en `reference/media-and-data.md`:

```html
<div class="barra"><div class="seg a" style="width:25%">$0.25</div></div>
```

`.seg.a` tiene `background: var(--cs-primary)` (#0F5FD6) y `color: #fff` → **5,79:1**, pasa.
El script reportó:

```
<div.seg.a>  "$0.25"
1.09:1 sobre 3:1 requerido · rgb(255, 255, 255) sobre rgb(242, 245, 247) · 24px
```

Es decir: midió blanco contra el `--cs-cream` de la slide. **Falso positivo**, y el patrón que
lo dispara es el que la propia documentación de la skill manda copiar.

Peor que el falso positivo es el **falso negativo simétrico**: texto oscuro sobre una card
con fondo oscuro propio pasaría el chequeo comparándose contra el fondo claro del padre. El
caso que el propio encabezado del script dice querer atrapar ("un `--cs-muted` que pasa sobre
`--cs-cream` puede ser ilegible dentro de una card de fondo oscuro") es justo el que se le
escapa cuando el fondo está en el mismo elemento que el texto.

**Fix aparente:** `effectiveBg(el)` en vez de `effectiveBg(el.parentElement || el)`; la
función ya empieza con `for (let n = el; …)`, así que incluir el propio elemento es el
comportamiento natural.

**Workaround usado en este deck** (dentro de mi carpeta, sin tocar el script): envolver el
texto en un `<span>` para que su `parentElement` sea el elemento con fondo.

### H-3 · `.grad-word` sobre `class="grad"` es ilegible, y ningún validador puede verlo — **Alta**

`template.html` tiene reglas para blanquear el texto de las transiciones sobre gradiente:

```css
.grad .ts-title, .grad .ts-tagline { color: #fff; }
```

pero **no tiene ninguna regla para `.grad .grad-word`**. `.grad-word` usa
`--cs-grad-text`, que en `instrument` es
`linear-gradient(135deg in oklch, #0F5FD6 0%, #17435E 50%, #0D1B26 100%)` — prácticamente el
mismo degradado que `--cs-grad-linear`, que es el fondo de `.grad`. Resultado: la palabra
resaltada se funde con el fondo y desaparece a media palabra.

Verificado en las capturas `.slizdeck-shots/frontier-septiembre-2026-06.png` ("Ahora, los
nú**meros**" se pierde) y `-10.png` ("El frente a**bierto**" se pierde).

Lo que hace este bug peligroso es que **es invisible para todo el pipeline**:
- `check-style-pack.mjs` valida tokens, no combinaciones.
- `check-contrast.mjs` **salta explícitamente** todo lo que tenga `background-clip: text`
  (los reporta como "22 textos no medidos, revisarlos a ojo").
- `audit.mjs` solo mira el HTML.

Solo `shoot.mjs` + mirar las imágenes lo atrapa. La fase audit funcionó, pero solo porque el
paso manual se hizo de verdad.

**Origen documental del choque:** `reference/components.md` (`transition-cream`, línea ~71)
usa `.grad-word` sobre fondo **cream**, donde el degradado oscuro sí contrasta.
`reference/design-guidelines.md` dice que *"un separador de sección usa el mismo tamaño de
`.ts-title` que una frase sola, pero sobre `class="grad"`"*. Al combinar las dos
instrucciones —que es lo que hace cualquiera que siga la guía de diseño— sale una slide
ilegible. Falta o bien una regla `.grad .grad-word { … }` en `template.html`, o bien una
advertencia explícita de que `.grad-word` y `.grad` no se combinan.

### H-4 · No hay patrón de tabla ni de gráfica, justo en el pack que existe para eso — **Alta (producto)**

`styles/instrument.md`: *"decks cargados de métricas […] cuando hay muchas cifras y
necesitan leerse comparadas"*, *"las cards pueden ir pegadas en grid sin gap, separadas solo
por `--cs-border`, **como celdas de una tabla**"*.

Pero:
- `reference/components.md` tiene 23 patrones en 7 familias. **Ninguno es una tabla.** El
  más cercano es `pq-card-2col` (dos conceptos, no N filas × M columnas).
- `reference/media-and-data.md` cubre imagen a sangre, split, métrica grande, fila de
  métricas, barras comparativas, progreso/proporción y standby. **No hay gráfica con ejes**
  (la barra de `.barras` es un stack de segmentos porcentuales, no una serie con escala) ni
  tabla.
- El "Resumen — patrón por mensaje" del final de `components.md` no tiene fila para
  "comparar N cosas en M dimensiones", que es el mensaje central de este caso de uso.

Para el caso 2 hubo que escribir tres patrones desde cero (`.dtable`, `.chart`, `.tl`). Salen
bien y pasan todos los validadores, pero es trabajo que el catálogo debería ahorrar, y el
resultado no es reproducible entre decks. `SKILL.md` dice *"si hace falta un layout nuevo,
agregarlo a `reference/components.md` después de crearlo"* — lo cual, cumplido por cada
usuario, produce divergencia en vez de sistema.

**Sugerencia concreta:** añadir a `media-and-data.md` (a) un patrón `data-table` en CSS grid
con la convención de mono + `tabular-nums` + resalte de fila/celda, y (b) un patrón
`bar-chart` en SVG inline con eje y guías. Ambos son exactamente lo que un pack "denso en
datos" necesita, y ambos deberían entrar además en el set reconocido de `export-pptx.mjs`.

### H-5 · `media-and-data.md` promete cobertura total en PPTX y no la tiene — **Media**

`reference/media-and-data.md`, párrafo 2:

> **Soporte en export a PPTX** (`scripts/export-pptx.mjs`): **todos** los patrones de este
> archivo se reconocen y se exportan como texto/formas nativas — imagen a sangre/split, fila
> de métricas, barras comparativas y progreso/proporción.

La frase se contradice a sí misma (dice "todos" y luego enumera cuatro de siete), y la
enumeración es la correcta. Comprobado en esta prueba:

| Patrón de `media-and-data.md` | ¿Exporta? |
|---|---|
| Barras comparativas (`.barras`) | Sí |
| Progreso / proporción (`.prop`) | Sí |
| Fila de métricas (`.metricas`) | Sí (no usado aquí, pero está en el código) |
| **Métrica grande (`.metrica`)** | **Parcial**: la cifra `[data-counter]` sí, la `.glosa` **no** |
| **Pantalla de inicio (`.standby`)** | **No**: `.marca` y `.cuando` se pierden |

Además, dos patrones de `reference/components.md` pierden su información principal:

- `pq-card-2col` (patrón descrito como "signature" en su propia familia): se pierden
  `.pq-eyebrow`, el `h3` (que es el titular de 64 px) y `.pq-consequence`. Solo sobrevive el
  `<p>`. En el `.pptx` la slide 08 queda con dos párrafos anónimos.
- `card-grid-4col`: se pierden los cuatro `h3`. La slide 12 queda con cuatro párrafos sin
  título, que es literalmente lo contrario de lo que la slide dice.

Causa raíz visible en `scripts/export-pptx.mjs`: `extractSlide()` recoge cards con
`section.querySelectorAll('.card')` y de cada una lee `.card-num` / `.card-eyebrow` / `h3` /
`p`. `.pq-card` y `.warn-card` **no llevan la clase `.card`**, así que no entran por ahí; sus
`<p>` sí entran por el barrido genérico de párrafos y sus `h3` no entran por ningún lado.

`export.md` avisa de que el set es cerrado, así que esto está "documentado" en general, pero
la promesa de `media-and-data.md` es explícitamente falsa y los patrones de `components.md`
que pierden su titular son los dos más usados del catálogo.

### H-6 · `counter-bars` de `components.md` está roto: la barra nunca se llena — **Media** (confirmado por lectura de código)

No lo usé en este deck (usé `.barras` y `.prop`, que sí funcionan), pero lo confirmo de forma
independiente porque otra prueba en paralelo lo reportó.

`reference/components.md:894`:

```css
section[data-active="true"] .tk-fill.is-on { width: var(--w, 0%); }
```

`template.html:943-948` es el único sitio donde se asigna `.is-on`:

```js
slide.querySelectorAll('.reveal').forEach((el) => {
  …
  el.classList.toggle('is-on', elStep <= step);
});
```

`.is-on` **solo se pone sobre elementos que llevan `.reveal`**. En el HTML del patrón,
`.reveal` está en `.tk-row` (el padre) y `.tk-fill` es un hijo sin `.reveal`, así que
`.tk-fill` nunca recibe `.is-on` y su `width` se queda en el `0%` del estado base. La barra
no se llena nunca, ni en pantalla ni en PDF.

El contraste con el patrón hermano lo deja claro: `.prop` de `media-and-data.md` lo resuelve
bien usando selectores de descendencia desde el ancestro revelado —
`.reveal.is-on .prop .fill, .prop.is-on .fill` — y en este deck funcionó (verificado en
`.slizdeck-shots/frontier-septiembre-2026-12.png` y en la página 12 del PDF). `counter-bars`
es el que está mal, no el sistema.

**Fix aparente:** `section[data-active="true"] .reveal.is-on .tk-fill { width: var(--w, 0%); }`.

### H-7 · Fricciones menores

**H-7a · `scripts/export-pptx.mjs` contiene un byte NUL y `grep` lo trata como binario.**
En la línea 244:

```js
const joined = [...exported].join(' \0 ');
```

El separador está escrito como un byte NUL literal en el archivo (offset 11731). Consecuencia:
`file` reporta *"a /usr/bin/env node script executable (binary data)"* y **`grep` no devuelve
ninguna coincidencia** sobre ese archivo sin `-a`. Cualquier agente o persona que intente
`grep -n "extractSlide" scripts/export-pptx.mjs` obtiene silencio y concluye que el símbolo
no existe. Escribirlo como `' '` (escape, no byte crudo) elimina el problema sin cambiar
el comportamiento.

**H-7b · La numeración de `shoot.mjs` no coincide con la de los footers cuando hay standby.**
`shoot.mjs` numera por orden de documento (01..14); los footers van 01..13 porque la pantalla
de standby no lleva número, tal como manda `media-and-data.md`. Así que
`frontier-septiembre-2026-07.png` es la slide con footer **06**. Al anotar hallazgos sobre las
capturas hay que traducir constantemente. Bastaría con que el PNG se nombrara por el
`data-label` de la slide, que ya existe y es único.

**H-7c · El indicador de pasos (`.act-marker`) se imprime en el PDF.**
En las 9 slides animadas aparece un "3 / 3" en la esquina superior derecha de cada página del
PDF. `export.md` dice que el PDF sale "sin el chrome del reproductor"; el `.act-marker` es un
indicador de navegación en vivo, así que discutiblemente debería estar en el
`@media print { display: none }` junto con el resto. Es a decidir, no un fallo: puede ser
intencional para que el lector del PDF sepa que esa slide tenía pasos.

**H-7d · El PDF pesa 16,1 MB para 14 slides.**
Se debe a que el `--cs-grain` del template se materializa como una textura que Chrome
rasteriza por página. No es un fallo, pero conviene saberlo si el deck se va a enviar por
correo: 1,15 MB por slide es mucho para 14 slides de texto y vectores.

**H-7e · `.slizdeck-shots/` no está en `.gitignore`.**
`shoot.mjs` escribe un directorio de capturas junto al deck. En el repo de la skill,
`.gitignore` cubre `node_modules/`, `.smoke-test-out/`, `.claude/settings.local.json` y
`.DS_Store`, pero no `.slizdeck-shots/`. Al generar decks dentro de `examples/` (como pide
el CI y como hace esta prueba) las capturas quedan como archivos sin trackear.

**H-7f · El paso 0 de `SKILL.md` engancha los ejemplos de la propia skill.**
Ya descrito en la bitácora (Fricción 1).

**H-7g · Ruido de Chrome en el export a PDF.**
El comando documentado en `export.md` emite tres líneas `ERROR:` de GCM
(`PHONE_REGISTRATION_ERROR`, `Authentication Failed: wrong_secret`) antes del mensaje de
éxito. No afectan al PDF, pero parecen un fallo. `--disable-features=...` o un
`2>/dev/null` con captura del código de salida lo dejaría limpio.

### Lo que funcionó bien (y merece quedar escrito)

- **`apply-style-pack.mjs` hace exactamente lo que promete.** "Tokens estructurales
  preservados: 4/4" es la línea que confirma que el `:root` no se destruyó, y es justo el
  fallo silencioso contra el que `styles/index.md` advierte.
- **`check-overflow.mjs` es sólido.** Cero falsos positivos sobre una gráfica SVG de 1680 px,
  dos tablas de grid y cuatro barras con `nowrap`. Y mide los `[data-counter]` en su valor
  final, que es la única forma de que sirva.
- **La fase `assets` justifica su existencia.** La opción "cambiar el wireframe" convirtió una
  tabla con cuatro celdas pendientes en una tabla completa y una slide narrativa aparte. Un
  flujo sin esa fase habría entregado la tabla mala.
- **El aviso de elementos perdidos de `export-pptx.mjs` es ejemplar.** Enumera tag, clase y
  texto de cada elemento que se quedó fuera. Sin ese listado no se podría auditar el export.
- **`audit.mjs` gestionó bien el standby sin número de footer.** Numeró 01..13 sin quejarse
  del hueco, que era el riesgo obvio.
- **La doctrina de severidad de `audit.md`** (bloqueante / aviso / a decidir) resultó
  directamente aplicable: los 11 fallos de contraste fueron bloqueantes, los 4 assets
  pendientes fueron avisos, y el falso positivo de `.seg.a` fue "a decidir" — y la
  instrucción explícita de *no* silenciar el detector editándolo es la que evitó que se
  tocara un archivo compartido.
- **El PDF es fiel.** Reveals en estado final, contadores en su cifra real, gráfica SVG y
  tablas intactas, 16:9 exacto. Para presentar y para archivar, el PDF es el export bueno.
