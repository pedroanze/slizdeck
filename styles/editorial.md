# Editorial

**Mundo:** el ensayo largo bien tipografiado y el programa de conferencia impreso — no la "revista con fondo crema" que todo generador produce por defecto. El fondo es blanco puro y el peso lo carga la serif, que es donde debe estar.

**Cuándo usarlo:** charlas de conferencia, keynotes narrativas, decks con tesis y argumento donde el texto tiene que respirar.

**Cuándo no:** pitches de métricas o demos de producto — para eso están Instrument y Terminal.

**Estrategia de color:** Restrained — negro sobre blanco, con un verde de prensa en eyebrows y un claret oscuro para el énfasis.

> Este pack reemplaza al default original de slizdeck, que combinaba fondo crema + display serif + acento terracota: exactamente el cluster de paleta y tipografía que más rápido delata una interfaz generada por IA. El mundo editorial se conserva; la ejecución se rehízo.

```css
:root {
  --cs-primary:     #2D7A52;
  --cs-secondary:   #2B2622;
  --cs-accent:      #7B2233;
  --cs-cream:       #FFFFFF;
  --cs-cream-2:     #F3F2F0;
  --cs-black:       #14110F;
  --cs-body:        #3D3833;
  --cs-muted:       #6E655D;
  --cs-white:       #FFFFFF;
  --cs-surface:     #FAF9F8;
  --cs-void:        #14110F;
  --cs-border:      rgba(20,17,15,0.12);
  --cs-border-strong: rgba(20,17,15,0.22);
  --cs-scrim:       rgba(20,17,15,0.05);
  --cs-grad-radial: radial-gradient(112% 150% at 0% 100% in oklch, #2D7A52 0%, #14110F 100%);
  --cs-grad-linear: linear-gradient(135deg in oklch, #2D7A52 0%, #14110F 100%);
  --cs-grad-text:   linear-gradient(135deg in oklch, #2D7A52 0%, #24402F 50%, #14110F 100%);
  --cs-font-sans:   'Chivo', ui-sans-serif, system-ui, sans-serif;
  --cs-font-heading: 'Young Serif', Georgia, 'Times New Roman', serif;
  --cs-font-mono:   ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
```

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Young+Serif&family=Chivo:wght@300;400;500;600;700;800&display=swap
```

**Alternativas tipográficas:** (mismo mundo, distinta ejecución; elegir una en el flujo de la skill)

### Alt: spectral — Spectral + Work Sans
Serif de texto clásica en vez de Young Serif (que es display de un solo peso): permite jerarquía por grosor además de por escala.
```css
--cs-font-sans:    'Work Sans', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Spectral', Georgia, 'Times New Roman', serif;
```
```
https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;600;700&family=Work+Sans:wght@300;400;500;600;700;800&display=swap
```

### Alt: caslon — Libre Caslon Text + Karla
Serif de libro, más formal y menos contemporánea que Young Serif; para conferencias con tono académico o institucional.
```css
--cs-font-sans:    'Karla', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Libre Caslon Text', Georgia, 'Times New Roman', serif;
```
```
https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Karla:wght@400;500;600;700&display=swap
```

**Composición:**
- Young Serif solo tiene un peso (400): la jerarquía sale de la escala, no del grosor. No pedir bold en los títulos.
- El cuerpo en Chivo, nunca en la serif: el contraste serif/sans es la estructura del pack.
- Medida de línea corta en los párrafos (`max-width` ~1100px): es un pack de lectura.
- El verde en eyebrows; el claret únicamente en una palabra de énfasis o una cifra, jamás en ambos a la vez.
