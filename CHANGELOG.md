# Changelog

Historial de cambios al engine (`template.html`) y a los scripts de la skill. Cada entrada de versión corresponde al comentario `slizdeck-engine-version` embebido al principio de todo deck generado — `scripts/doctor.mjs <deck.html>` lo lee para avisar si un deck viejo se generó antes de un fix relevante.

Una sola versión gobierna todo el proyecto y vive en seis sitios que deben coincidir siempre: `package.json`, el `metadata.version` de `SKILL.md`, el marcador `slizdeck-engine-version` de `template.html`, la primera entrada de este archivo, y el `version` de `.claude-plugin/plugin.json` y `.claude-plugin/marketplace.json`. `node scripts/check-versions.mjs` lo verifica y falla si alguno se desalinea.

## 2.3.2

Fix del engine encontrado presentando un deck real: las flechas en pantalla se saltaban los pasos.

- **Fix: las flechas de la barra inferior (`‹` `›`) y las zonas táctiles de los costados cambiaban de slide sin revelar los pasos.** Llamaban directo a `_go()` de `<deck-stage>`, que cambia de slide, y nunca pasaban por el controlador de pasos, que solo escuchaba el teclado. En una slide con `data-steps="3"`, la flecha de la pantalla saltaba a la siguiente dejando dos pasos sin mostrar, y la de volver no retrocedía paso a paso. Ahora las dos (y los toques) despachan la tecla equivalente desde el `<body>` con `_navKey()`, la misma ruta que ya usaba el modo presentador: primero se recorren los pasos, después se cambia de slide. Los decks generados con 2.3.1 o antes necesitan reaplicar el cambio en su `<deck-stage>` (los listeners de `.prev`/`.next`, `_onTapBack`/`_onTapForward` y el método `_navKey`).

## 2.3.1

Salida de la QA con un deck real (Opus 5.5 frente a GPT-6, pack editorial con colores de Anthropic sobre fondo oscuro). El engine no cambia.

- **Fix: el export a PPTX contaba como una sola línea los títulos de dos líneas con interlineado ajustado.** El medidor decidía "línea nueva" cuando un rect no se solapaba verticalmente con el anterior, pero con `line-height` 1.1 la caja de cada línea es más alta que la distancia entre líneas: se solapan. En el PPTX el título salía en una línea con `wrap` apagado y se desbordaba de su card. Ahora cuenta una línea nueva cuando la tapa baja más de media línea.
- **Fix: con interlineado más ajustado que la letra (títulos de portada a `.98`) la caja de texto del PPTX quedaba demasiado arriba** y el título se montaba sobre el eyebrow. La caja ahora baja la diferencia entre interlineado y altura de la letra en vez de ignorarla.
- **`npx slizdeck install` sobre una skill que ya está (clon de git o symlink a uno, el setup de desarrollo) decía "No se instaló nada" y salía con error.** Ahora informa en cada agente que la skill ya está disponible, a qué apunta y qué versión tiene, sale con 0, y sugiere `--force` para reemplazarla por la de npm. Una carpeta ajena (que no es ni clon ni instalación del CLI) sigue bloqueando con error.
- **Los harness de Chrome esperan a que carguen las fuentes web del deck** antes de medir (`document.fonts.load` de cada familia en uso, después del `load`, con tope de 4 s). `document.fonts.ready` solo resolvía de inmediato si la hoja de Google Fonts todavía no había llegado, y `check-overflow` o el export podían medir con la fuente de respaldo.

## 2.3.0

Auditoría completa de la skill: bugs, código muerto, inconsistencias y lo deprecado, fuera.

**Engine (`template.html`)**
- **Fix: el PDF y el PPTX descolocaban los reveals centrados** (`translate(-50%)`): el `@media print` forzaba `transform: none !important`. Ya no: `finalizeForPrint` pone `.is-on` y alcanza.
- **Fix: al imprimir, las slides llegan a su último paso** (`data-current-step`), así los patrones que dependen del paso actual (pulsos, magic-move) salen en su estado final. Y después de un Cmd+P la slide en vivo vuelve al paso en que estaba (antes quedaba todo revelado).
- **Fix: con movimiento reducido, `r-wipe` y `r-mask` se veían antes de su paso** (ocultan con `clip-path`, que el modo reducido anulaba). Ahora pasan a fundido; y el modo reducido ya no fuerza `transform: none`.
- **Fix: la clase global `.hl` se aplicaba a `tr.hl`, `td.hl` y `li.hl`** de los patrones de datos (el hito resaltado del timeline salía entero en negrita). Queda solo para texto en línea. `.hl-accent` usa `--cs-accent-ink`.
- **Fix: rAF anidados en el cambio de slide y en la entrada inicial**, prohibidos por las propias reglas del repo: ahora esperan un frame con temporizador de respaldo.
- **Fix: badges de estado con colores fijos** (`badge-red` quedaba a 1,9:1 en `terminal`): se mezclan con el color de texto del pack.
- **Fix: reabrir el modo presentador tras recargar el deck acumulaba estilos y atajos.**
- **Nuevo token `--cs-on-primary`**: texto sobre un bloque de color primario o `--cs-grad-linear` (blanco; `terminal`, de primario ámbar, lo oscurece). **Nuevo `svg.ic`**: estilo de los íconos de `icons.md` (antes el doc decía que existía y no existía).
- **Fuera:** `.sweep`, Lucide (loader, `createIcons`), los atributos `data-om-validate` / `data-screen-label` / `export-hidden` y el `postMessage` heredados del engine original (nada los leía), y los tokens sin uso `--cs-shadow-1`, `--cs-shadow-3`, `--cs-fg-3`. El ejemplo del template trae notas en `<aside class="notes">`.

**Scripts**
- **Fix: `apply-style-pack` dejaba tokens del pack anterior** al cambiar de pack (pasar de `committed` a `terminal` dejaba el `--cs-accent-ink` marino sobre el fondo negro). Ahora los tokens de pack que el nuevo no declara vuelven al default del template.
- **Fix: `check-contrast` se saltaba en silencio los colores `color-mix()` y `oklch()`** (solo parseaba `rgba()`): un título casi invisible en `color-mix` pasaba con ✓. Ahora normaliza cualquier color pintando un pixel.
- **Fix: `check-overflow` medía los solapes a mitad de la transición** del reveal: ahora sin transiciones.
- **Fix: los reintentos de Chrome no reintentaban**: un timeout de Chrome salía como stack trace. Ahora cuenta como intento fallido y termina con el diagnóstico.
- **Fix: `export-pptx --slides=99` generaba un PPTX vacío y reportaba ✓**; `smoke-test --pack=<typo>` daba "0/0 OK". Los dos fallan con un mensaje.
- **Fix: una captura o un PDF viejo podían pasar por nuevos** (`shoot`, `export-pdf` no borraban la salida anterior). **Fix: archivo inexistente** daba stack trace en seis scripts. **Fix: `make-offline`** no encontraba el `<link>` de fuentes si `href` no era el primer atributo, y en ese caso se saltaba el aviso de recursos remotos.
- **Fuera el exportador PPTX por clases** (`--legacy`, prometido por una versión en 2.1) y su dependencia `node-html-parser`.
- **Código compartido en `scripts/lib/`**: `chrome-run.mjs` (arranque del harness, reintentos, diagnóstico: antes copiado en tres validadores) y `deck-html.mjs` (conteo de slides, `--slides`, palabras por slide: antes copiado en cinco scripts). `check-docs` exige en `SKILL.md` solo los scripts que usa el agente.

**Documentación**
- `SKILL.md` más corto: la tabla de archivos lista solo lo que usa el agente; las herramientas de mantenimiento quedan en `CONTRIBUTING.md` (reescrito).
- `reference/design-tokens-schema.md` pasa a ser la referencia de los tokens `--cs-*` y de cómo inyectar colores de marca: documentaba un `design-tokens.json` que nada leía ni escribía.
- Corregido lo que ya no era cierto: contadores (decimales, formato), PDF por script, notas en `<aside>`, nivel MEDIUM, ruta del hook, lista completa de fuentes prohibidas, regla del gradiente (manda el pack), `--cs-accent-ink` en la inyección de marca.
- Catálogos: colores fijos (`#fff`, `rgba(0,0,0,…)`, `#2563EB`) pasados a tokens para que funcionen en packs oscuros; el velo de la imagen a sangre es un `<div>` (el `::after` no viajaba al PPTX); fuera `counter-bars` (lo cubren `.sz-chart` y `data-counter`); los íconos Lucide de los snippets pasan a SVG en línea.
- **Fuera `examples/demo-deck.html`**, el ejemplo heredado del fork que no pasaba las validaciones. `pitch-showcase.html` se rehízo sobre el engine actual, con notas en cada slide. Las bitácoras de `examples/test-0*` (600 a 1.100 líneas de la corrida 1.4.0, todo ya corregido) quedan en un resumen; la versión completa, en el historial de git.
- README más corto y sin la imagen de portada.

## 2.2.0

Diseño, animación y datos. Cambia el engine: un deck generado antes de 2.2 no trae los patrones de datos ni el modo presentador (`doctor.mjs` lo avisa).

- **Nuevo: gráficas declarativas `.sz-chart`** (`reference/media-and-data.md` → "Datos"). El deck trae los datos en JSON y el runtime dibuja el SVG con el tamaño real de la figura: `bar`, `hbar`, `line`, `area`, escala `log` con exponentes `10²⁵`, `highlight` (`last`/`max`/`min`/índice) en el color de acento, formato de números según el `lang` del deck, prefijo y unidad. Animación de entrada al revelarse: las barras crecen escalonadas, las líneas se dibujan. Las tres pruebas de `examples/test-0*` habían tenido que inventar sus propias gráficas a mano.
- **Nuevo: tabla `table.sz-table` y timeline `ol.sz-timeline`** como patrones de primera clase, con el CSS ya en el template. Los puntos del timeline son elementos reales (no `::before`), para que viajen al PPTX.
- **Nuevo: nivel de animación MEDIUM** (`deck-schema.md`): LIGHT + los datos se animan (gráficas, contadores, barras, timelines). Default para decks densos en datos.
- **Nuevo: modo presentador** (tecla `P`): ventana con las notas de la slide actual, la siguiente, el paso en curso y un cronómetro; las flechas funcionan desde las dos ventanas.
- **Nuevo: notas dentro de cada slide**, `<aside class="notes">`: viajan con la slide al reordenar o insertar (el JSON de `#speaker-notes` va por índice y se desalineaba con `add`). El export a PPTX las lee; el JSON sigue funcionando.
- **Nuevo: transición opcional entre slides**, `<deck-stage transition="fade">` (View Transitions). El default sigue siendo corte directo.
- **Contadores con decimales y formato**: `data-counter="57.5"` → `57,5`; separador de miles según el idioma, sin agrupar años; `data-format="compact"` (`2,4 M`), `data-decimals`.
- **Fix: un contador animándose pisaba la cifra final** que dejaba `finalizeForPrint` (PDF, export, capturas): `shoot.mjs` capturaba `37,4` en vez de `57,5`. Cada animación ahora lleva un id y se corta al finalizar.
- **Movimiento reducido**: los pasos se siguen revelando con un fundido corto en vez de mostrar todo de golpe (el presentador conserva el ritmo). `.stagger` escalona hasta 12 hijos (antes 6).
- **Defaults del template = pack paper-white.** El default anterior (teal + Newsreader + IBM Plex) no pasaba su propio validador: primario y acento a 1,01:1, zona atractora de IA, y dos fuentes de la lista de clichés. `DESIGN.md` ya documentaba paper-white como default.
- **Nuevo token `--cs-accent-ink`**: el acento cuando resalta sobre el fondo. `check-style-pack.mjs` lo exige a 3:1. `committed` lo declara (su lima quedaba a 1,3:1 sobre blanco al resaltar una cifra); la segunda serie de las gráficas usa `--cs-muted`, validado como texto en todos los packs, en vez de `--cs-secondary` (2,1:1 en `terminal`).
- **`audit.mjs` avisa** (sin fallar) de slides con más de 45 palabras en pantalla, emojis y rachas de 3 slides con la misma estructura.
- **Nuevo: evals** (`evals/`): 8 briefs fijos, rúbrica visual y `scripts/score-deck.mjs` (puntaje 0-100). Línea base: los tres decks de prueba dan 65/100, con demasiado texto y sin notas.
- **Export a PPTX**: las notas de `<aside class="notes">`; `--charts=native` (experimental) arma las `.sz-chart` como gráfica nativa de PowerPoint con los datos editables. No es el default porque Keynote y Quick Look no dibujan las gráficas que genera pptxgenjs y todavía no se verificó en PowerPoint real; por default van como imagen con los rótulos editables.
- **Fix: los scripts inyectaban su harness antes del PRIMER `</body>` del deck** (`scripts/lib/inject.mjs`). Un `</body>` dentro de un string de JS (el modo presentador lo tenía) cortaba el script del deck y Chrome headless se colgaba sin error.
- **Fix: los harness de Chrome headless dependian de que llegara un `requestAnimationFrame`.** En Linux sin GPU (el CI) a veces ni el primero llega, y el chequeo abortaba con "Chrome headless no termino" sin ningun problema real en el deck (fallo intermitente de `check-contrast` en el CI del merge de 2.2). Ahora un temporizador de respaldo arranca el harness si el frame no llega, en `check-contrast`, `check-reveal`, `check-overflow`, `shoot`, `export-pdf` y el medidor del export. Reproducido anulando `requestAnimationFrame`: antes fallaba siempre, ahora pasa; el CI lo prueba en cada push.
- **Nuevo: `examples/datos-showcase.html`**, referencia de los patrones de datos; el CI lo valida en los 5 packs y lo exporta. `shoot.mjs --clean` oculta la UI del reproductor para capturas de README.

## 2.1.0

Exports. El engine (`template.html`) no cambia de comportamiento.

- **Nuevo: export a PPTX por geometría** (`scripts/export-pptx.mjs`, reescrito sobre `scripts/lib/measure-deck.mjs`). En vez de reconocer un set cerrado de clases, renderiza cada slide en Chrome en su estado final, mide lo que el navegador dibujó y lo reconstruye en la misma posición: texto nativo con sus tramos de estilo, cajas con fondo/borde/radio como formas nativas, imágenes reales ya recortadas como en el deck (`object-fit`, `border-radius`, filtros), SVG como PNG a 2x con sus `<text>` editables encima (incluida la rotación), y los fondos con degradado o grano como captura JPEG compartida entre slides vía slide master. Sobre los tres decks de `examples/test-0*`, que el exportador anterior dejaba con 30, 116 y 100 textos perdidos: **0 perdidos**, y un patrón nuevo de `components.md` ya no necesita soporte en el script.
- **Speaker notes al campo nativo de PowerPoint** (antes no viajaban).
- **Fuentes del pack en el `.pptx`** en vez de Calibri/Cambria para todo. `--safe-fonts` vuelve a fuentes universales para abrirlo en una máquina sin las fuentes.
- **Lo que no viaja se sigue reportando**: el texto generado por CSS (`::before`/`::after` con `content`) sale como export incompleto con código 1; decoraciones CSS y degradados de cajas aplanados, como aviso.
- **Fix: pptxgenjs repetía `<a:pPr>` delante de cada tramo** de un párrafo con varios estilos (fuera del schema: PowerPoint puede pedir reparar el archivo). El export deja solo el primero. Nueva dependencia declarada: `jszip` (ya venía con pptxgenjs).
- **`--legacy`** conserva el exportador anterior (`scripts/lib/export-pptx-legacy.mjs`) una versión, como red de seguridad. `--slides=` exporta solo algunas slides.
- **Nuevo: `scripts/export-pdf.mjs`** (`slizdeck export pdf`). Una página por slide con Chrome headless, sin el grano rasterizado de los degradados (test-03: de 21 MB a 1,1 MB; `--grain` lo conserva) ni el marcador de pasos del reproductor. Verifica que haya tantas páginas como slides.

## 2.0.1

Parche de la 2.0: la skill se instala liviana. El engine no cambia.

- **Los exports y capturas de `examples/test-0*` salen del repo** (~83 MB de PDF, PPTX y PNG). Viven en el release [`examples`](https://github.com/pedroanze/slizdeck/releases/tag/examples) y las bitácoras los enlazan ahí. El plugin de Claude Code copia el repo entero, así que cada instalación descargaba 93 MB; ahora `examples/` pesa ~0,5 MB. Los decks HTML siguen en el repo.
- **Fix: `slizdeck where` listaba dos veces la misma instalación** cuando se corría desde HOME (la carpeta global y la "de proyecto" coinciden).
- **`repository.url` con el prefijo `git+`** que npm pedía al publicar.
- **`release.yml` soporta trusted publishing de npm** (OIDC, sin token): actualiza npm a 11.5.1+ antes de publicar. Mientras no se configure en npmjs.com, sigue usando `NPM_TOKEN`.

## 2.0.0

Instalación en un comando. El engine (`template.html`) no cambia de comportamiento: sube de major porque cambia cómo se instala y cómo se invocan los scripts.

- **Nuevo: `npx slizdeck install`** (`bin/slizdeck.mjs`). Detecta Claude Code, Codex, Gemini CLI y OpenCode, copia la skill a `<agente>/skills/slizdeck` y deja instaladas las dependencias del export. `--agent`, `--project`, `--no-deps`, `--force`. `update`, `uninstall` y `where` completan el ciclo; no pisan ni borran un clon de git, un symlink o una carpeta que no instaló el CLI sin `--force`.
- **Nuevo: CLI único para los scripts**, desde cualquier carpeta: `slizdeck audit|check|shoot|doctor|renumber|apply-pack|export pptx|export offline|…`. `apply-pack` y `check-style-pack` aceptan el pack por nombre. `slizdeck check` corre los cuatro validadores seguidos. `slizdeck new deck.html --pack=terminal` copia el template y aplica el pack. `slizdeck env` verifica Node, Chrome y dependencias.
- **Nuevo: plugin y marketplace de Claude Code** (`.claude-plugin/`). `/plugin marketplace add pedroanze/slizdeck` + `/plugin install slizdeck@slizdeck`. El hook de `verify-hook.mjs` viaja en `hooks/hooks.json` con `${CLAUDE_PLUGIN_ROOT}`: ya no hay que editar `settings.json` a mano.
- **Paquete npm publicable**: `package.json` deja de ser `private`, declara `bin`, `engines` (Node 20+) y una lista blanca `files` (sin los ejemplos pesados de `examples/test-0*`).
- **Publicación automática**: `.github/workflows/release.yml` publica a npm (con provenance) y crea el Release al hacer push de un tag `vX.Y.Z`.
- **Cambio en la documentación: los scripts se corren desde la carpeta del proyecto**, con la ruta de la skill delante (`node <skill>/scripts/audit.mjs deck.html`), ya no con `cd` a la raíz de la skill. Ver `SKILL.md` → "Dónde se corre cada cosa".
- **Fix: `export-pptx.mjs` sin `npm install` fallaba con un `ERR_MODULE_NOT_FOUND` crudo.** Ahora carga las dependencias con `import()` y, si faltan, imprime el `npm install --prefix …` exacto y sale con código 1.
- **Fix: `node scripts/lib/find-chrome.mjs` no imprimía nada si la ruta tenía espacios o se invocaba por symlink** (comparaba `import.meta.url` contra `file://${argv[1]}` como string). Ahora compara rutas reales.
- **`check-versions.mjs` verifica seis sitios** (suma `plugin.json` y `marketplace.json`), y **`check-docs.mjs`** exige que `bin/` esté documentado y revisa también los links de `README.en.md` y `ROADMAP.md`.

## 1.4.2

CI se rompió al publicar 1.4.1 (push a `main`): https://github.com/pedroanze/slizdeck/actions/runs/34069861451. Dos causas, ambas reproducidas localmente antes de corregir.

- **Fix: `npm test` nunca funcionó bajo Node 20 (el fijado en CI), solo bajo Node 22+.** El script era `node --test "tests/**/*.test.js"` — la cadena queda entre comillas, así que ninguna shell la expande, y Node tiene que resolver el glob `**` él mismo. Ese soporte no existe en Node 18/20 (reproducido localmente con Node 18: `Could not find '.../tests/**/*.test.js'`, el mismo error exacto de CI), solo llegó en una versión más nueva de Node — enmascarado en desarrollo porque este entorno corre Node 22. Cambiado a `node --test tests/*.test.js` (sin comillas): la propia shell expande el glob antes de que Node lo vea, portable a cualquier versión que soporte `node --test`.
- **Fix: `export-pptx.mjs` habría roto el paso de CI que exporta `examples/pitch-showcase.html`.** El fix de 1.4.1 que hace salir con exit 1 ante contenido perdido (ver abajo) era correcto, pero `pitch-showcase.html` — el propio ejemplo de referencia del sistema de packs — tenía dos patrones sin soporte en el export: `.glosa` (la frase bajo la cifra grande de `.metrica`, nunca se extraía) y `.pipe-card`/`.pipe-eyebrow`/`.pipe-name` (patrón `flow-pipeline` de `components.md`, sin ningún soporte). Añadido soporte a los dos — `.pipe-card` entra en el mismo grid que `.pq-card`/`.warn-card` (se pierden las flechas entre pasos, que `findLostText` ya descarta por ser de 1-2 caracteres, no contenido real). `pitch-showcase.html` exporta ahora sin pérdidas, exit 0.

## 1.4.1

Ronda de correcciones salida de tres pruebas end-to-end reales (ver `examples/test-01-astra-basico/`, `test-02-modelos-septiembre-2026/`, `test-03-tesis-frontera/`). Los tres decks se generaron sin tocar ni un archivo de la skill, precisamente para que estos hallazgos fueran del sistema y no del contenido.

- **Fix: `shoot.mjs` capturaba una slide multi-step incompleta, de forma determinística (no aleatoria).** Al navegar a `#N` para capturar una slide puntual, el propio `slidechange` del deck-stage corre `resetAndEnter()`, que quita `.is-on` de esa slide y la vuelve a poner solo hasta el paso 1 — si esa inicialización propia del deck corre después del "forzar todo a `.is-on`" del harness de `shoot.mjs`, gana ella y la captura sale con el resto de los pasos ocultos (no en blanco: el título se ve, el resto no). Reproducido de forma consistente (8/8 corridas) en la slide de series temporales del caso 3. Fix: el harness repite el reveal en una segunda vuelta 150ms después, que gana sin importar el orden real de ambas inicializaciones.
- **Fix: los cuatro scripts que renderizan en Chrome headless copiaban el deck a `os.tmpdir()` antes de medirlo, rompiendo cualquier imagen local con ruta relativa** (`assets/logos/x.svg`, footer, fotos). El `<img>` se resuelve contra la carpeta del archivo que Chrome carga; copiado a `/tmp` esa ruta ya no existe y la imagen no aparece, sin ningún error — Chrome no avisa por un `<img>` que no carga. Encontrado al agregar logos reales de marca a un deck de prueba y verlos desaparecer en `shoot.mjs` pese a cargar bien en el navegador normal. El harness ahora se escribe al lado del deck real (`.slizdeck-shoot-*.html` etc., limpiado igual que antes) en `check-contrast.mjs`, `check-overflow.mjs`, `check-reveal.mjs` y `shoot.mjs`.
- **Fix grave: un `requestAnimationFrame` anidado dentro de otro no llega a dispararse la mayoría de las veces en Chrome headless sin GPU** (medido en esta máquina: ~90% de las corridas se quedan colgadas esperándolo, sin ningún error visible). Este patrón lo usaban `resetAndEnter()` en `template.html` y los cuatro scripts que renderizan en Chrome headless (`check-contrast.mjs`, `check-overflow.mjs`, `check-reveal.mjs`, `shoot.mjs`): en todos, el segundo rAF nunca llegaba, `.reveal` se quedaba sin `.is-on`, y la slide se medía o capturaba en su estado inicial oculto — la causa real de los PNG vacíos y las mediciones inconsistentes reportados en las tres pruebas. Reemplazado por `rAF` + `setTimeout(0)` en los cinco sitios: no depende del compositor, 0 fallos en las corridas de verificación (antes ~90%).
- **Fix: `export-pptx.mjs` mentía con el exit code.** Un export con contenido perdido terminaba con exit 0 y un "✓ N slides" — el único texto que lee un CI o un hook. Ahora sale con código 1 y el símbolo cambia a "⚠ ... EXPORT INCOMPLETO" cuando algo no viajó, consistente con el principio de que ninguna validación de esta skill dice más de lo que comprobó.
- **Fix: byte NUL literal en `export-pptx.mjs`** dejaba el archivo marcado como binario para herramientas como `file`/`grep -c` sin `-a` — cualquiera que buscara texto en el script a ciegas concluía que no estaba ahí.
- **Fix: `export-pptx.mjs` perdía por completo las cards de los patrones `pq-card-2col`/`pq-card-3col` y `card-grid-4col`** (Familia 2 y 3 de `components.md`): el extractor solo buscaba `.card`, y `.pq-card`/`.warn-card` no llevan esa clase. Ahora las reconoce y exporta eyebrow, título, remate (`.pq-consequence`) y cuerpo.
- **Fix: `counter-bars` (`components.md`) nunca llenaba la barra.** La regla `section[data-active="true"] .tk-fill.is-on` exigía `.is-on` en el propio `.tk-fill`, que nunca la recibe (el step controller la pone en el `.reveal` ancestro). Ahora usa el mismo patrón ascendente que ya funciona en `.prop` (`media-and-data.md`): `.reveal.is-on .tk-fill`.
- **Fix: `check-style-pack.mjs` y `check-contrast.mjs` exigían umbrales distintos para el mismo texto atenuado** (3.5:1 vs 4.5:1) — un pack podía pasar uno y fallar el otro sobre el mismo token. Unificado a 4.5:1 (el umbral AA de texto normal; `--cs-muted` no tiene un tamaño garantizado grande). El pack `instrument` quedaba justo debajo (4.495:1): oscurecido a `#546878` (5.29:1).
- **Fix: `check-contrast.mjs` medía el fondo del padre, no el del propio elemento** (`effectiveBg(el.parentElement || el)`). Dos consecuencias: falso positivo en cualquier patrón donde el texto vive en el mismo nodo que su fondo (ej. `.seg.a` de `.barras`, `media-and-data.md`), y el falso negativo simétrico — texto oscuro sobre card oscura, el caso que el script dice explícitamente querer atrapar. Ahora mide `effectiveBg(el)`.
- **Fix: `check-contrast.mjs` no medía el color de texto SVG.** Leía siempre `color`, y un `<text>`/`<tspan>` pinta con `fill` — un fill casi invisible sobre su fondo pasaba como si tuviera el contraste del negro heredado del documento. Ahora usa `fill` para nodos SVG.
- **Fix: `.grad-word` (resaltado con degradado) quedaba invisible sobre `class="grad"`.** El degradado de texto (`--cs-grad-text`) es casi el mismo que el de fondo de `.grad` (`--cs-grad-radial`), así que la palabra "resaltada" desaparecía contra su propio fondo — invisible para todo el pipeline automático porque `check-contrast.mjs` salta a propósito el texto con `background-clip:text`. Ahora degrada a blanco sólido sobre `.grad`, en vivo y en print.
- **Fix: `.badge-primary` quedaba con el teal original tras cambiar de pack.** Usaba un `rgba(14,124,102,0.10)` fijo fuera de `:root`, y `apply-style-pack.mjs` solo fusiona el bloque `:root`. Pasado a `color-mix(in srgb, var(--cs-primary) 10%, transparent)`, el mismo patrón que ya usan otros 5 sitios de `components.md`.
- **Nuevo token `--cs-weight-heading`** (default 600). El pack `editorial` pedía "no pedir bold en los títulos" porque Young Serif solo trae peso 400, pero el template forzaba `font-weight:600` en los 8 selectores de título grande sin excepción — negrita sintética en un display serif que el propio pack decía evitar. Ahora `editorial` declara `--cs-weight-heading: 400` (600 en su alternativa Spectral, que sí lo tiene; 700 en Libre Caslon Text).
- **Fix: `.stat-source` y `.glosa` existían en `export-pptx.mjs`/`SKILL.md` sin ningún patrón real que los produjera** (junto con dos selectores más, `.stat-caption` y `.ask-line`, que no correspondían a nada en ningún archivo). Cada deck de prueba necesitó una cita de fuente bajo una cifra y tuvo que inventar su propia clase, que el export no reconocía. Ahora `.stat-source` es una clase real (`template.html`), documentada en el patrón `Métrica grande` de `media-and-data.md`. `.stat-caption`/`.ask-line` se retiraron del export por no tener productor.
- **Docs: `README.md` y `reference/audit.md` afirmaban que `check-overflow.mjs` no detecta solapes de texto** — lo hace desde 1.4.0 (`no_overlapping_text`), y fue el único chequeo bloqueante real en una de las tres pruebas. Corregido, con nota sobre el falso positivo conocido de fuentes serif de descenso grande.
- **Docs: `reference/deck-schema.md` se contradecía sobre HEAVY** — la tabla decía "menos de 10 slides", las reglas fijas decían "nunca en más de 18 slides sin pedido explícito", sin resolver el rango 10-18. Reescrito como una sola política graduada.

## 1.4.0

Ronda de endurecimiento salida de auditar el propio repo: el engine deja de anunciar validaciones que nadie hacía, y las que hay dejan de tener puntos ciegos.

- **`no_overlapping_text` implementado.** Cada slide declara `data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"`, pero el segundo token no lo verificaba ningún script. Ahora `check-overflow.mjs` detecta dos textos superpuestos midiendo la caja del **texto** (vía `Range`), no la del elemento: un `<div>` block ocupa todo el ancho de la slide aunque su texto sean 80px en una esquina, y compararlo por bounding box daba falsos positivos en cada slide. Acotado a texto-contra-texto; `data-overlap-ok` excluye un solape intencional. Cero falsos positivos en las 15 variantes del smoke-test.
- **Fix: las superficies de card usaban `#fff` literal.** 10 patrones de `components.md` (y las dos cards del deck de ejemplo) fijaban `background: #fff`, que sobrevive al cambio de pack: en `terminal`, donde `--cs-black` es claro, una card blanca dejaba el texto **blanco sobre blanco (1:1)**. Ahora usan `var(--cs-surface)`. La excepción documentada es el QR, que necesita fondo blanco real. Encontrado al validar cada pack sobre contenido real, no sobre el template vacío.
- **El canvas de `<deck-stage>` toma `var(--cs-cream)`** en vez de `#fff`, para no dar un destello blanco al cargar un deck de pack oscuro.
- **`check-style-pack.mjs` explica la consecuencia de `--cs-accent-on`:** cuando un pack declara que su acento vive sobre el primario, ahora dice cuánto daría ese acento sobre el fondo de las slides y para qué no sirve. El mecanismo ya existía y era correcto; lo que faltaba era que el modelo supiera la restricción al componer.
- **`smoke-test.mjs` valida además cada pack sobre contenido real** (el deck de ejemplo, no el template vacío): 20 variantes. La estructura es bloqueante (una regresión de engine se ve ahí); el contraste es informativo, porque cruzar un deck compuesto para un pack con las reglas de otro puede fallar legítimamente.
- **Nuevo: `scripts/check-docs.mjs`**, canario contra el drift docs↔repo: que todo script y toda referencia estén en las tablas, que los links relativos resuelvan, que `DESIGN.md` y `design.json` coincidan, y que ningún pack use una fuente que el propio validador rechaza. Corre en CI.
- **Fix: los recursos remotos se contaban dentro de comentarios.** `make-offline.mjs` avisaba de una dependencia de red que no existía (y `check-reveal`/`check-contrast`/`shoot` culpaban a un script inexistente) porque `template.html` trae el `<script>` de lucide comentado como opt-in. Ahora se enmascaran los comentarios antes de buscar.
- **`check-overflow.mjs` diagnostica como `check-reveal`:** si no termina, nombra los scripts externos del deck como causa probable en vez de mandar a revisar Chrome.

## 1.3.0

- **Fix de accesibilidad: el total del act-marker era ilegible.** El indicador de paso de las slides multi-step (`2 /3`) marcaba el total con un `style="opacity:.4"` inline, que dejaba `--cs-muted` en **1.7:1** sobre blanco — muy por debajo de cualquier umbral WCAG. Ahora es una clase `.act-marker .step-total` con `opacity: .8` (~3.3:1, el mínimo AA para 24px). Un deck ya generado con el inline sigue teniendo el problema: reemplazar `<span style="opacity:.4">` por `<span class="step-total">` y añadir la regla al `<style>`.
- **Nuevo: `scripts/check-contrast.mjs`.** Mide el contraste de cada texto ya renderizado contra su fondo efectivo, que es distinto de lo que valida `check-style-pack.mjs` (pares de tokens en `:root`). Encontró justamente el bug de arriba, invisible para la validación de tokens porque `--cs-muted` sobre blanco sí pasa: lo que fallaba era la opacidad encima. Los textos sobre gradiente o imagen se reportan como no medidos, nunca como aprobados.
- **Nuevo: `tests/validators.test.js`** (`npm test`, solo `node:test`, cero dependencias): mete defectos concretos en el deck de referencia y verifica que cada validador los detecte. Un validador que siempre dice ✓ es peor que no tenerlo. Encontró de paso que `audit.mjs`, `doctor.mjs` y `export-pptx.mjs` escupían un stack trace de Node ante un archivo inexistente, ya corregido.
- **Portabilidad:** `audit.mjs` y `smoke-test.mjs` resolvían su ruta con `new URL(...).pathname`, que deja `%20` en rutas con espacios y devuelve `/C:/...` en Windows. Ahora usan `fileURLToPath`, como el resto.
- **`renumber.mjs` mantiene sincronizados los marcadores `SLIZDECK-ASSET-PENDING: slide NN`**, que tras insertar una slide apuntaban a la equivocada.
- **Índice al principio de `components.md` y `animations.md`**, para saltar al patrón que pide el wireframe en vez de leer 1200 líneas y quedarse con los primeros.
- **Branding heredado:** el placeholder del `<title>` pasa a `Slizdeck · [DECK NAME]` y los tokens dejan de titularse "CLAUDE SLIDES". El `<html lang>` lleva ahora un recordatorio de ajustarlo al idioma del deck.
- **Nuevo: `scripts/shoot.mjs`.** Renderiza cada slide a PNG en su estado final para que el modelo pueda mirar el deck en la fase `audit`, en vez de deducirlo del HTML. Es el único paso que puede juzgar jerarquía, variedad de composición y peso visual.

## 1.2.0

Sin cambios en el engine: un deck generado con 1.1.0 no necesita ninguna corrección. Esta versión son fixes en los scripts de validación y export, todos en la misma dirección — ninguna herramienta debe afirmar algo que no verificó.

- **Fix: `renumber.mjs` saltaba las slides con número provisional no numérico.** `add.md` promete que se puede insertar una slide con "cualquier `data-label`/`<span class="num">` provisional", pero el script exigía `\d+` y trataba un `0X` como "slide sin número de footer", dejándola fuera de la numeración *y* reportando "sin cambios". Ahora renumera cualquier `<span class="num">` no vacío, informa cuántas slides saltó, y enmascara los comentarios HTML antes de buscar (una `<section>` de ejemplo comentada desbalanceaba la cuenta).
- **Fix: `export-pptx.mjs` perdía contenido en silencio.** El export reconoce un set cerrado de patrones; lo que caía fuera desaparecía con exit 0 y un `✓ N slides` que sugería que todo había viajado (en un pitch real se perdieron los nombres de los fundadores). Ahora compara el texto visible del DOM contra el exportado y lista, por slide, cada elemento que no llegó al `.pptx`.
- **Fix: `check-reveal.mjs` culpaba a la máquina por un problema del deck.** Si un deck carga un `<script src>` externo bloqueante, `DOMContentLoaded` nunca dispara y el chequeo se cuelga; el mensaje decía "no es un problema del deck evaluado: revisar que Chrome headless funcione en esta máquina". Ahora detecta los scripts externos y los nombra como causa probable, y solo apunta a la máquina cuando el deck no tiene ninguno.
- **Fix: `make-offline.mjs` prometía "sin red" sin verificarlo.** Solo incrusta fuentes, pero afirmaba que el deck ya no dependía de la red aunque quedaran scripts, hojas de estilo o imágenes remotas. Ahora las detecta y las lista como aviso.
- **Docs:** `PRODUCT.md` y `design.json` estaban congelados en el sistema visual anterior a los style packs (paleta y fuentes que la propia skill prohíbe); el ejemplo de `design-tokens-schema.md` enseñaba justo esas fuentes. Regenerados contra el estado actual. Corregidos además varios claims que atribuían a los validadores comprobaciones que no hacen.
- **Nuevo: `scripts/check-versions.mjs`**, que verifica en CI que los cuatro sitios de versión coincidan.

## 1.1.0

- **Fix: foco de teclado invisible en el chrome del viewer.** `#fs-btn` (botón de fullscreen) y `.btn` (controles del reproductor: anterior/siguiente/reset) sacaban el `outline` del navegador al enfocarse (`:focus { outline: none }`) sin poner ningún reemplazo — un usuario navegando el deck con teclado no veía ningún indicador de foco en esos controles. Encontrado auditando slizdeck contra los criterios de diseño de `impeccable` (`craft-floor.md` → "Browser surfaces" / "States: keyboard focus"). Ahora `:focus-visible` muestra un anillo blanco (`box-shadow`), y `:focus` sin `-visible` (click de mouse) se mantiene sin outline — el patrón estándar para no mostrar el anillo a quien usa mouse pero sí a quien navega con teclado.

## 1.0.0

- **Fix: orden de cascada CSS en `.reveal.is-on`.** `.reveal.is-on { transform: none }` estaba declarada ANTES que las variantes `.reveal.r-rise`/`.r-scale`/`.r-blur`/`.r-left` en el `<style>`. Misma especificidad (dos clases) → en un empate gana la regla declarada después, así que las variantes ganaban la cascada y un elemento revelado se quedaba con el transform/filter de su propia animación aplicado para siempre en la vista en vivo del navegador (nunca en el PDF exportado, porque `@media print` fuerza `!important` aparte). Un deck generado antes de este fix tiene el bug; `scripts/check-reveal.mjs` lo detecta.
- **OKLCH en los gradientes** (`--cs-grad-radial/linear/text`): evita el punto medio "sucio" que da la interpolación RGB por defecto.
- **Primera versión con el marcador `slizdeck-engine-version`** embebido en `template.html` — decks generados antes de esta versión no lo tienen (`scripts/doctor.mjs` lo reporta como hallazgo, no como fallo).
