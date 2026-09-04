# Instrument

**Mundo:** el panel de instrumentos y la terminal financiera — Bloomberg, un cuadro de mandos de vuelo, una tabla de datos densa hecha con criterio. El tinte frío del fondo es deliberado: aquí la superficie *sí* es parte del mundo (una pantalla de instrumentación), que es la excepción que justifica salirse del blanco puro.

**Cuándo usarlo:** decks cargados de métricas — tracción, unit economics, benchmarks, resultados. Cuando hay muchas cifras y necesitan leerse comparadas.

**Cuándo no:** una charla narrativa o un pitch emocional: la densidad trabaja en contra.

**Estrategia de color:** Restrained — neutros fríos con un azul de precisión, y el ámbar reservado para señalar excepciones en los datos.

```css
:root {
  --cs-primary:     #0F5FD6;
  --cs-secondary:   #35506B;
  --cs-accent:      #7A1F12;
  --cs-cream:       #F2F5F7;
  --cs-cream-2:     #E6EBEF;
  --cs-black:       #0D1B26;
  --cs-body:        #38505F;
  --cs-muted:       #5F7383;
  --cs-white:       #FFFFFF;
  --cs-surface:     #FFFFFF;
  --cs-void:        #0D1B26;
  --cs-border:      rgba(13,27,38,0.12);
  --cs-border-strong: rgba(13,27,38,0.24);
  --cs-scrim:       rgba(13,27,38,0.06);
  --cs-grad-radial: radial-gradient(112% 150% at 0% 100%, #0F5FD6 0%, #0D1B26 100%);
  --cs-grad-linear: linear-gradient(135deg, #0F5FD6 0%, #0D1B26 100%);
  --cs-grad-text:   linear-gradient(135deg, #0F5FD6 0%, #17435E 50%, #0D1B26 100%);
  --cs-font-sans:   'Public Sans', ui-sans-serif, system-ui, sans-serif;
  --cs-font-heading: 'Public Sans', ui-sans-serif, system-ui, sans-serif;
  --cs-font-mono:   'Martian Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --cs-radius-sm:   4px;
  --cs-radius-md:   6px;
  --cs-radius-lg:   8px;
}
```

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&family=Martian+Mono:wght@400;500;700&display=swap
```

**Composición:**
- **Toda cifra va en `--cs-font-mono`** con `font-variant-numeric: tabular-nums`: las columnas de números deben alinearse verticalmente.
- Radios cortos (4-8px, ya sobreescritos arriba): la geometría es de instrumento, no de app de consumo.
- El ámbar marca la excepción — el dato que rompe la tendencia — nunca decora.
- Las cards pueden ir pegadas en grid sin gap, separadas solo por `--cs-border`, como celdas de una tabla.
