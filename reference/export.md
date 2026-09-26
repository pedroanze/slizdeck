# Fase: export — PDF, PPTX y speaker notes

Se activa cuando el usuario pide un formato distinto al HTML, en cualquier momento ("pásalo a PDF", "necesito el PPTX para editarlo", "dame las notas del presentador").

El HTML ya es el entregable principal (se presenta en vivo desde el navegador). Además hay dos exports y un extra opcional:

## PDF

```bash
node scripts/export-pdf.mjs deck.html deck.pdf
```

Una página por slide, en su **estado final** (reveals visibles, contadores en su cifra real, sin el chrome del reproductor), con Chrome headless. Dos diferencias deliberadas con imprimir a mano desde el navegador:

- **Sin el grano de los fondos degradados.** Chrome lo rasteriza al imprimir y un deck de 18 slides pasaba de ~1 MB a 22 MB. `--grain` lo conserva si el usuario lo pide.
- **Sin el marcador de pasos** (`3 / 3`), que es UI del reproductor en vivo.

El script verifica que el PDF tenga tantas páginas como slides el deck (sale con código 1 si no) y avisa si pesa más de 10 MB. La impresión nativa (`Cmd/Ctrl+P` → guardar como PDF) sigue funcionando para el usuario que prefiera hacerlo a mano.

## PPTX editable

Para quien necesite el deck en PowerPoint o Google Slides:

```bash
node scripts/export-pptx.mjs deck.html deck.pptx
```

Exporta **por geometría**: renderiza cada slide en Chrome en su estado final, mide lo que el navegador dibujó y lo reconstruye en PowerPoint en la misma posición. No depende de qué patrón de `components.md` use la slide: un layout nuevo se exporta igual.

- **Texto**: cajas de texto nativas, con sus tramos de estilo (color, tamaño, peso, itálica, tracking), editables.
- **Cards, barras, reglas, bordes**: formas nativas con su radio de borde.
- **Imágenes**: embebidas de verdad, ya recortadas como las muestra el deck (`object-fit`, `border-radius`, filtros CSS).
- **SVG** (íconos, diagramas, charts hechos a mano): imagen PNG a 2x; sus `<text>` (rótulos, ejes) viajan como texto editable encima.
- **Fondos con degradado o grano** (cover, cierre, transiciones): una captura del fondo sin su contenido, como imagen de fondo.
- **Speaker notes** (`<aside class="notes">` de cada slide, o el JSON de `<script id="speaker-notes">`): al campo nativo de notas de PowerPoint.
- **Gráficas `.sz-chart`**: imagen fiel con sus rótulos y ejes editables. `--charts=native` las arma como gráfica nativa de PowerPoint con los datos editables (experimental: Keynote y Quick Look no las dibujan).

Opciones: `--safe-fonts` (Arial/Georgia/Consolas en vez de las fuentes del pack), `--slides=1,3-5` (solo esas slides).

Advertir al usuario de lo que el formato no puede llevar:
- **Sin animaciones**: se exporta el estado final de cada slide.
- **Fuentes**: el `.pptx` nombra las fuentes del pack. Si quien lo abre no las tiene instaladas (Google Fonts), PowerPoint pone una sustituta y los textos pueden cambiar de ancho. Si el `.pptx` va a circular, ofrecer `--safe-fonts`.
- **Tablas HTML**: salen como cajas de texto alineadas, no como tabla nativa.

Lo que no viaja se reporta siempre, nunca en silencio: el **texto generado por CSS** (`content: "…"` en `::before`/`::after`) no existe en el DOM y no se puede exportar; el script lo lista y sale con código 1. Si es contenido real, moverlo al HTML. Las decoraciones CSS en pseudo-elementos y los degradados de cajas (aplanados a su primer color) se avisan sin fallar.

Si el usuario necesita fidelidad visual exacta, el PDF es el formato correcto; el PPTX es para cuando necesita **editar**.

## Deck sin red (opcional)

Si el deck se va a presentar sin garantía de wifi (la mayoría de las charlas en sala), incrustar las fuentes como `data:` URI para que no dependa de Google Fonts en el momento de presentar:

```bash
node scripts/make-offline.mjs deck.html
```

Corre esto **con anticipación**, no el mismo día del evento: descarga las fuentes en el momento de ejecutarlo, así que necesita red entonces aunque el deck final no la necesite después.

## Speaker notes y modo presentador

Las notas viven dentro de cada slide, en `<aside class="notes">` (ver `reference/build.md`); el JSON de `<script id="speaker-notes">` por índice sigue funcionando en decks anteriores a 2.2. Con notas en el deck:

- **Modo presentador**: con el deck abierto, la tecla `P` abre una ventana con las notas de la slide actual, el título de la siguiente, el paso en curso y un cronómetro (`R` lo reinicia). Las flechas funcionan desde cualquiera de las dos ventanas: la del presentador va en la laptop, el deck en el proyector.
- **PPTX**: `export-pptx.mjs` las pone en el campo nativo de notas de PowerPoint.
- **Documento aparte** (solo si el usuario lo pide): generar `[nombre-deck]-notes.md` con un bloque `## Slide NN — Título` por slide y el discurso completo en párrafos (lo que el presentador dice, no bullets).
