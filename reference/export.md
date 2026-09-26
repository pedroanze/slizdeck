# Fase: export — PDF, PPTX y speaker notes

Se activa cuando el usuario pide un formato distinto al HTML, en cualquier momento ("pásalo a PDF", "necesito el PPTX para editarlo", "dame las notas del presentador").

El HTML ya es el entregable principal (se presenta en vivo desde el navegador). Además hay dos exports y un extra opcional:

## PDF

Impresión nativa del navegador: `Cmd/Ctrl+P` → guardar como PDF. El template ya trae las reglas `@media print` que garantizan el **estado final** de cada slide: reveals visibles, contadores en su cifra real, sin el chrome del reproductor. No hace falta avanzar las animaciones a mano antes de imprimir.

Para generarlo sin abrir el navegador (útil para verificar un cambio):

```bash
"$(node scripts/lib/find-chrome.mjs)" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="deck.pdf" --virtual-time-budget=5000 "file://$PWD/deck.html"
```

`find-chrome.mjs` detecta Chrome/Chromium automáticamente en macOS, Linux y Windows; si no está en una ruta típica, setear `CHROME_PATH` con la ruta completa al ejecutable.

## PPTX editable

Para quien necesite el deck en PowerPoint o Google Slides:

```bash
node scripts/export-pptx.mjs deck.html deck.pptx
```

Reconstruye cada slide con cajas de texto y formas nativas (no imágenes), leyendo los design tokens del propio HTML. Si las dependencias no están instaladas, el script lo avisa e imprime el `npm install --prefix …` exacto a correr (una sola vez).

Advertir al usuario de las degradaciones inherentes al formato, que no son fallos del export:
- **Sin animaciones**: PPTX no reproduce el sistema de reveals; se exporta el estado final.
- **Fuentes sustituidas**: las fuentes web se mapean a fuentes seguras de Office (serif → Cambria, sans → Calibri) porque una fuente no instalada en la máquina del lector se sustituye sola y rompe el layout.
- **Gradientes aplanados**: los fondos de cover/cierre se exportan en el color primario sólido.
- **Imágenes como placeholder**: ninguna imagen real se incrusta (coherente con "cero imágenes, todo editable"); sale una forma con el alt como etiqueta.

Una limitación real que sigue existiendo, no una degradación aceptada: `export-pptx.mjs` reconoce un set cerrado de clases (ver el comentario de cabecera del script y `reference/media-and-data.md` para lo que sí cubre). Si el wireframe usa un patrón de layout nuevo de `reference/components.md` sin extender antes el script, ese contenido **no aparece en el `.pptx`**. El script lo detecta: lista cada texto que no viajó, marca el resultado como "EXPORT INCOMPLETO" y sale con código 1. Si el usuario va a necesitar el export a PPTX, avisar antes de generar si el deck usa algo fuera de lo documentado como soportado.

Si el usuario necesita fidelidad visual exacta, el PDF es el formato correcto; el PPTX es para cuando necesita **editar**.

## Deck sin red (opcional)

Si el deck se va a presentar sin garantía de wifi (la mayoría de las charlas en sala), incrustar las fuentes como `data:` URI para que no dependa de Google Fonts en el momento de presentar:

```bash
node scripts/make-offline.mjs deck.html
```

Corre esto **con anticipación**, no el mismo día del evento: descarga las fuentes en el momento de ejecutarlo, así que necesita red entonces aunque el deck final no la necesite después.

## Speaker notes (solo si el usuario las pide)

Generar `[nombre-deck]-notes.md`: un bloque `## Slide NN — Título` por slide, con el discurso completo en párrafos (lo que el presentador dice, no bullets).
