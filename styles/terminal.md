# Terminal

**Mundo:** la pantalla de fósforo ámbar anterior a la web — VT100, IBM 3270, el terminal como objeto físico. No es "modo oscuro con neón": el ámbar viene de una tradición real, no del cluster de IA de *near-black con un acento neón brillante*.

**Cuándo usarlo:** pitches de infra/AI, charlas técnicas, demos de producto para audiencia dev. Rinde especialmente bien proyectado en sala oscura, donde un fondo claro deslumbra.

**Cuándo no:** decks que se van a imprimir o leer en papel; una sala muy iluminada lava el contraste.

**Estrategia de color:** Restrained — neutros oscuros y el ámbar cargando el acento, por debajo del 10% de la superficie.

```css
:root {
  --cs-primary:     #E8A33D;
  --cs-secondary:   #3D4A52;
  --cs-accent:      #E8433A;
  --cs-cream:       #0B0D0E;
  --cs-cream-2:     #141719;
  --cs-black:       #FFFFFF;
  --cs-body:        #C9D1D5;
  --cs-muted:       #8A9296;
  --cs-white:       #FFFFFF;
  --cs-surface:     #16191B;
  --cs-void:        #000000;
  --cs-border:      rgba(255,255,255,0.10);
  --cs-border-strong: rgba(255,255,255,0.20);
  --cs-scrim:       rgba(255,255,255,0.06);
  --cs-grad-radial: radial-gradient(112% 150% at 0% 100% in oklch, #16191B 0%, #0B0D0E 100%);
  --cs-grad-linear: linear-gradient(135deg in oklch, #E8A33D 0%, #E8433A 100%);
  /* Texto sobre el ambar (cards o barras en primario, grad-linear): el
     blanco ahi queda a 2.2:1. */
  --cs-on-primary:  #0B0D0E;
  --cs-grad-text:   linear-gradient(135deg in oklch, #E8A33D 0%, #E8763B 50%, #E8433A 100%);
  --cs-font-sans:   'Archivo', ui-sans-serif, system-ui, sans-serif;
  --cs-font-heading: 'Archivo', ui-sans-serif, system-ui, sans-serif;
  --cs-font-mono:   'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
```

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap
```

**Alternativas tipográficas:** (mismo mundo, distinta ejecución; elegir una en el flujo de la skill)

### Alt: mono-tech — Chakra Petch + Fragment Mono
Más anguloso, sensación de HUD de interfaz de control en vez de terminal clásica de texto.
```css
--cs-font-sans:    'Chakra Petch', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Chakra Petch', ui-sans-serif, system-ui, sans-serif;
--cs-font-mono:    'Fragment Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```
```
https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Fragment+Mono&display=swap
```

### Alt: quiet-sans — Sora + Overpass Mono
Menos ruido visual que Archivo; para decks donde el texto debe leerse primero y el código después.
```css
--cs-font-sans:    'Sora', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Sora', ui-sans-serif, system-ui, sans-serif;
--cs-font-mono:    'Overpass Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```
```
https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Overpass+Mono:wght@400;600;700&display=swap
```

**Composición:**
- Los eyebrows van en mono (`--cs-font-mono`), no en la sans: es la firma del pack.
- El ámbar solo en eyebrows, cifras y un badge. Nunca como fondo de bloque.
- Las cover usan `--cs-grad-radial`, que aquí es un degradado casi negro: la portada no grita, se oscurece.
- Los títulos van en blanco puro sobre el casi-negro; el cuerpo en `--cs-body`, nunca en blanco puro (fatiga).
