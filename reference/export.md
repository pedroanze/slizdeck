# Fase: export — PDF, PPTX y speaker notes

Se activa cuando el usuario pide un formato distinto al HTML, en cualquier momento ("pásalo a PDF", "necesito el PPTX para editarlo", "dame las notas del presentador").

El HTML ya es el entregable principal (se presenta en vivo desde el navegador). Además hay dos exports y un extra opcional:

## PDF

Impresión nativa del navegador: `Cmd/Ctrl+P` → guardar como PDF. El template ya trae las reglas `@media print` que garantizan el **estado final** de cada slide: reveals visibles, contadores en su cifra real, sin el chrome del reproductor. No hace falta avanzar las animaciones a mano antes de imprimir.

Para generarlo sin abrir el navegador (útil para verificar un cambio):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="deck.pdf" --virtual-time-budget=5000 "file://$PWD/deck.html"
```

## PPTX editable

Para quien necesite el deck en PowerPoint o Google Slides:

```bash
node scripts/export-pptx.mjs deck.html deck.pptx
```

Reconstruye cada slide con cajas de texto y formas nativas (no imágenes), leyendo los design tokens del propio HTML. La primera vez requiere `npm install` en la raíz de la skill.

Advertir al usuario de las degradaciones inherentes al formato, que no son fallos del export:
- **Sin animaciones**: PPTX no reproduce el sistema de reveals; se exporta el estado final.
- **Fuentes sustituidas**: las fuentes web se mapean a fuentes seguras de Office (serif → Cambria, sans → Calibri) porque una fuente no instalada en la máquina del lector se sustituye sola y rompe el layout.
- **Gradientes aplanados**: los fondos de cover/cierre se exportan en el color primario sólido.
- **Imágenes como placeholder**: ninguna imagen real se incrusta (coherente con "cero imágenes, todo editable"); sale una forma con el alt como etiqueta.

Y una limitación real, no una degradación aceptada: `export-pptx.mjs` solo reconoce un set cerrado de clases (ver el comentario de cabecera del script). Si el wireframe usa `.barras` o `.prop` de `reference/media-and-data.md`, ese contenido **no aparece en el `.pptx`**, sin aviso. Si el usuario va a necesitar el export a PPTX, evitar esos dos patrones o avisar explícitamente del hueco antes de generar.

Si el usuario necesita fidelidad visual exacta, el PDF es el formato correcto; el PPTX es para cuando necesita **editar**.

## Deck sin red (opcional)

Si el deck se va a presentar sin garantía de wifi (la mayoría de las charlas en sala), incrustar las fuentes como `data:` URI para que no dependa de Google Fonts en el momento de presentar:

```bash
node scripts/make-offline.mjs deck.html
```

Corre esto **con anticipación**, no el mismo día del evento: descarga las fuentes en el momento de ejecutarlo, así que necesita red entonces aunque el deck final no la necesite después.

## Speaker notes (solo si el usuario las pide)

Generar `[nombre-deck]-notes.md`: un bloque `## Slide NN — Título` por slide, con el discurso completo en párrafos (lo que el presentador dice, no bullets).
