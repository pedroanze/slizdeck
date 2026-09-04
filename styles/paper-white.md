# Paper White

**Mundo:** la documentación técnica bien hecha y el papel de laboratorio — Vercel, Stripe docs, un paper de arXiv maquetado con cuidado. Blanco literal `#FFFFFF`, sin crema, sin off-white: la contención es el punto.

**Cuándo usarlo:** cuando el contenido o las cifras deben cargar todo el peso y cualquier decoración estorba. Pitches de producto donde la claridad es el argumento.

**Cuándo no:** si el deck necesita energía o memorabilidad emocional — ahí va Committed.

**Estrategia de color:** Restrained llevado al extremo — casi monocromo, un solo acento vermellón por debajo del 5% de la superficie.

```css
:root {
  --cs-primary:     #16181A;
  --cs-secondary:   #5A6169;
  --cs-accent:      #E23D1E;
  --cs-cream:       #FFFFFF;
  --cs-cream-2:     #F4F5F6;
  --cs-black:       #0A0B0C;
  --cs-body:        #3A4046;
  --cs-muted:       #6B7278;
  --cs-white:       #FFFFFF;
  --cs-surface:     #FAFBFB;
  --cs-void:        #0A0B0C;
  --cs-border:      rgba(0,0,0,0.10);
  --cs-border-strong: rgba(0,0,0,0.18);
  --cs-scrim:       rgba(0,0,0,0.05);
  --cs-grad-radial: radial-gradient(112% 150% at 0% 100%, #16181A 0%, #000000 100%);
  --cs-grad-linear: linear-gradient(135deg, #16181A 0%, #000000 100%);
  --cs-grad-text:   linear-gradient(135deg, #16181A 0%, #3A4046 50%, #16181A 100%);
  --cs-font-sans:   'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif;
  --cs-font-heading: 'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif;
  --cs-font-mono:   ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
```

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&display=swap
```

**Composición:**
- Una sola familia en todo el deck; la jerarquía sale del peso y la escala, nunca de mezclar tipografías.
- Las cover son negras con texto blanco: el contraste entre portada y contenido es el único "efecto" del pack.
- El vermellón aparece como máximo una vez por slide, casi siempre en una cifra.
- Sin sombras: las cards se separan por el borde de 1px, no por elevación.
