# Committed

**Mundo:** el cartel de festival y la identidad de marca que no pide permiso — bloques planos de un solo color saturado, tipografía que ocupa el ancho completo. Es el pack con la audacia de Platzi: energía, no ruido.

**Cuándo usarlo:** el pitch que necesita recordarse, no solo entenderse. Keynotes, lanzamientos, decks de marca. Cuando compites por atención en una sala llena.

**Cuándo no:** análisis financiero denso o documentación — el color a esta escala compite con la lectura detallada.

**Estrategia de color:** Committed — el cobalto carga entre 30% y 60% de la superficie del deck; no es un acento, es el terreno.

```css
:root {
  --cs-primary:     #1B3AF5;
  --cs-secondary:   #0B1B8A;
  --cs-accent:      #C8F135;
  /* El lima solo se usa sobre cobalto, nunca sobre el fondo blanco. */
  --cs-accent-on:   primary;
  /* Resaltado sobre el fondo blanco (graficas, tablas, timeline): el
     marino del pack, porque el lima ahi queda a 1.3:1. */
  --cs-accent-ink:  #0B1B8A;
  --cs-cream:       #FFFFFF;
  --cs-cream-2:     #F0F2FF;
  --cs-black:       #0A0E27;
  --cs-body:        #363B52;
  --cs-muted:       #6A6F85;
  --cs-white:       #FFFFFF;
  --cs-surface:     #F5F6FF;
  --cs-void:        #0A0E27;
  --cs-border:      rgba(10,14,39,0.12);
  --cs-border-strong: rgba(10,14,39,0.22);
  --cs-scrim:       rgba(10,14,39,0.06);
  --cs-grad-radial: radial-gradient(112% 150% at 0% 100% in oklch, #1B3AF5 0%, #0B1B8A 100%);
  --cs-grad-linear: linear-gradient(135deg in oklch, #1B3AF5 0%, #0B1B8A 100%);
  --cs-grad-text:   linear-gradient(135deg in oklch, #1B3AF5 0%, #1430C0 50%, #0B1B8A 100%);
  --cs-font-sans:   'Manrope', ui-sans-serif, system-ui, sans-serif;
  --cs-font-heading: 'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif;
  --cs-font-mono:   ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
}
```

**Google Fonts:**
```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Manrope:wght@300;400;500;600;700;800&display=swap
```

**Alternativas tipográficas:** (mismo mundo, distinta ejecución; elegir una en el flujo de la skill)

### Alt: unbounded — Unbounded + Onest
Display geométrico y macizo, más cartel-de-festival aún que Bricolage; para el pitch que necesita gritar un poco más.
```css
--cs-font-sans:    'Onest', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Unbounded', ui-sans-serif, system-ui, sans-serif;
```
```
https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800;900&family=Onest:wght@400;500;600;700&display=swap
```

### Alt: quiet-bold — Familjen Grotesk + Karla
Igual de contundente en el cobalto pero con trazo más editorial en el titular; para marcas que quieren energía sin sentirse "festival".
```css
--cs-font-sans:    'Karla', ui-sans-serif, system-ui, sans-serif;
--cs-font-heading: 'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif;
```
```
https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Karla:wght@400;500;600;700&display=swap
```

**Composición:**
- Al menos una de cada tres slides va a fondo cobalto completo (`class="grad"`), no solo la portada y el cierre: eso es lo que hace al pack "committed".
- El lima (`--cs-accent`) solo sobre cobalto, nunca sobre blanco — ahí pierde legibilidad.
- Sobre cobalto, el texto siempre blanco puro; nunca texto oscuro sobre el color saturado.
- Bricolage Grotesque es variable por tamaño óptico: dejar que el display use los pesos altos y el cuerpo se quede en Manrope.
