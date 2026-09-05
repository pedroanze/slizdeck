---
name: Slizdeck
description: Sistema visual de slizdeck. Lo invariante vive aquí; la paleta y la tipografía las aporta el style pack elegido.
colors:
  ink-strong: "#0A0B0C"
  ink-body: "#3A4046"
  ink-muted: "#6B7278"
  bg: "#FFFFFF"
  surface: "#FAFBFB"
  primary: "#16181A"
  accent: "#E23D1E"
  stage-void: "#0A0B0C"
  status-green: "#15803D"
  status-red: "#B91C1C"
  status-orange: "#B45309"
typography:
  display:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "168px"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  display-md:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "132px"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "76px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  subtitle:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 300
    lineHeight: 1.4
  title:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.22em"
  label-sm:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
  payoff:
    fontFamily: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.4
  step-marker:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "12px"
  md: "20px"
  lg: "26px"
  pill: "999px"
spacing:
  padTop: "96px"
  padX: "120px"
  padBottom: "120px"
components:
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.lg}"
    padding: "40px 44px"
  badge-primary:
    backgroundColor: "rgba(22,24,26,0.08)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
---

# Design System: Slizdeck

## Overview

**Creative North Star: "El Escenario del Fundador"**

Cada slide es un momento de una presentación en vivo, no una página de documento. El sistema es confiado y contenido: pocos elementos por slide, cada uno con peso deliberado, sin decoración que no sirva al mensaje.

**Este documento describe lo invariante del sistema** — el contrato de tokens, el lienzo, la elevación, el movimiento y las reglas de composición. **La paleta y la tipografía concretas las aporta el style pack elegido** (`styles/index.md`): slizdeck tiene cinco, y cambiarlos es una sustitución deliberada, no una desviación.

Los valores del frontmatter son los del pack por defecto, `paper-white`, y están ahí como referencia legible por herramientas. Un deck construido con `terminal`, `committed`, `instrument` o `editorial` tendrá otros colores y otras fuentes **a propósito**: un detector que compare ese deck contra este archivo reportará diferencias que no son defectos. La validación real de un deck se hace con su propio pack:

```bash
node scripts/check-style-pack.mjs <deck>.html
```

Rechazos confirmados, válidos para cualquier pack: nada de líneas o barras decorativas bajo los títulos, nada de iconografía de stock genérica, nada de bullets como única forma de mostrar información, nada de gradientes decorativos fuera de cover y cierre.

**Key Characteristics:**
- Confiado y contenido, no enérgico ni ruidoso.
- Un color domina cada slide (60-70% del peso visual); el acento aparece en un solo elemento por slide, como máximo.
- Silencioso hasta que importa: todo en reposo es plano y quieto.
- Canvas fijo 1920×1080, escalado uniformemente al viewport (no es un layout responsive tradicional).

## Colors

El sistema define **roles**, no colores. Cada pack los rellena con su propia paleta.

| Rol | Token | Qué es |
|---|---|---|
| Fondo | `--cs-cream` | El fondo de las slides de contenido. Blanco puro o casi negro salvo mood ambiental. |
| Superficie | `--cs-surface` | Cards y paneles sobre el fondo. |
| Ink fuerte | `--cs-black` | Títulos. Contraste ≥7:1 sobre el fondo. |
| Ink cuerpo | `--cs-body` | Texto de párrafo. Contraste ≥7:1. |
| Ink atenuado | `--cs-muted` | Texto secundario y footer. Contraste ≥3.5:1. |
| Primario | `--cs-primary` | Eyebrows, cifras, badges. El color que domina. |
| Acento | `--cs-accent` | Un detalle por slide. Debe distinguirse del primario (≥1.7:1). |
| Void | `--cs-void` | El fondo del navegador fuera del lienzo. No es parte de la slide. |

Los colores de estado (`status-green`, `status-red`, `status-orange`) existen solo para badges semánticos y son iguales en todos los packs.

### Named Rules
**The One Accent Rule.** El acento aparece en como máximo un elemento por slide. Su escasez es lo que lo hace notar.

**The Gradient-Is-A-Bookend Rule.** El gradiente vive solo en cover y cierre. Las slides intermedias son fondo plano, sin excepción.

**The No-Slop-Palette Rule.** Nunca un gradiente azul/violeta ni cian-sobre-oscuro como default, ni las fuentes de la lista de *training-data defaults* (Inter, Roboto, Fraunces, Newsreader, IBM Plex, Space Grotesk, Geist, DM Sans, Plus Jakarta Sans, Instrument Sans). Verificado con `check-style-pack.mjs`.

## Typography

Cada pack define su pareja de fuentes. Lo invariante es **la escala y los roles**, no las familias:

- **Display** (168px) — cover y transition. El momento de mayor peso.
- **Display MD** (132px) — variante para títulos largos.
- **Headline** (76px) — título de slide de contenido.
- **Subtitle** (36px, peso ligero) — bajo el título de cover o transición.
- **Title** (32px) — encabezado dentro de una card.
- **Body** (24px) — párrafo y footer.
- **Label** (24px, uppercase, tracking 0.22em) — eyebrows.
- **Label SM** (20px, uppercase, tracking 0.14em) — badges.
- **Payoff** (30px) — frase de remate.
- **Step marker** (24px, mono) — el indicador "1/2". Único uso de la monoespaciada.

La proporción display/headline es de 2.2×, y esa escala extrema es parte de la jerarquía: aplanarla desdibuja el sistema.

Cada pack trae su tipografía default más **2 alternativas curadas** (mismo mundo visual, distinta ejecución de fuente), documentadas en el propio archivo del pack y aplicables con `apply-style-pack.mjs --font=<id>`. No es personalización libre: las tres opciones de cada pack ya están validadas contra la lista de *training-data defaults*.

### Named Rules
**The One-Line Title Rule.** Los títulos en una sola línea siempre que se pueda; un `<br>` solo se justifica por equilibrio visual, nunca por longitud.

## Motion

El movimiento es opt-in por pasos (`.reveal` + `data-step`), y **la entrada varía según el elemento**: revelar todo con el mismo fade-up es lo que hace que un deck se sienta mecánico.

| Variante | Para |
|---|---|
| `r-rise` | Títulos |
| `r-fade` | Texto largo, eyebrows |
| `r-scale` | Cifras y datos |
| `r-blur` | Imágenes y citas |
| `r-left` | Listas y pasos |
| `r-wipe` | Barras y reglas |
| `r-mask` | Remates |

Un contenedor con `.stagger` escalona sus hijos automáticamente. Las superficies con gradiente llevan grano (`--cs-grain`), sin `mix-blend-mode`: `overlay` es invisible sobre fondos oscuros.

Los tres tokens de gradiente (`--cs-grad-radial`, `--cs-grad-linear`, `--cs-grad-text`) interpolan en **OKLCH** (`linear-gradient(135deg in oklch, ...)`), no en RGB: dos colores de matiz distinto (ej. cobalto → navy) mezclados en RGB pasan por un punto medio grisáceo y apagado; en OKLCH el color se mantiene vivo en todo el recorrido. Requiere Chrome 111+/Safari 16.4+/Firefox 128+ — ya asumido por el resto del sistema (el pipeline de PDF usa Chrome headless). Un pack nuevo debe declarar sus gradientes con `in oklch` desde el inicio.

## Layout

Canvas de diseño fijo en 1920×1080px (`<deck-stage>`), escalado uniformemente (`transform: scale()`) para caber en cualquier viewport, con letterboxing — no es un grid responsive con breakpoints. El frame estándar de cada slide (`.pad`) usa 96px de padding superior, 120px horizontal, 120px inferior. No hay columnas ni grid definido a nivel de sistema: cada patrón de `components.md` define su propia composición interna (dos columnas, grid de cards, imagen a sangre) dentro de ese frame.

## Elevation & Depth

Ambiental y sutil, nunca estructural. Las sombras dan a las cards una separación suave del fondo crema; no simulan botones "presionables" ni jerarquía dura entre capas. El sistema es mayormente plano — el peso visual viene del color y la tipografía, no de la profundidad.

### Shadow Vocabulary
- **shadow-1** (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03)`): separación mínima, casi imperceptible.
- **shadow-2** (`box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)`): la que usan las cards por default.
- **shadow-3** (`box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.05)`): reservada para elementos que necesiten destacar más (mockups, elementos flotantes en nivel de animación HEAVY).

### Named Rules
**The Ambient-Only Rule.** Las sombras separan, no dramatizan. Si una sombra se nota antes que el contenido, es demasiado fuerte.

## Shapes

Esquinas suaves y consistentes en toda la escala: `sm` (12px) para elementos pequeños, `md` (20px) para componentes intermedios, `lg` (26px) para cards, `pill` (999px) para badges. Sin bordes duros ni esquinas a 90° salvo el canvas mismo de la slide.

**Nota sobre el viewer chrome.** Los controles del reproductor (overlay de navegación, botón de fullscreen, barra de progreso) viven dentro del shadow DOM de `<deck-stage>` y usan su propia escala pequeña (10-12px, radio 4px, fuente del sistema). **No forman parte de este design system** y no deben alinearse a él: son UI de navegador, no de slide. Un detector que los reporte como drift está señalando un falso positivo.

## Components

Slizdeck no tiene botones ni inputs (no es una app interactiva) — sus componentes son los que aparecen dentro de una slide y los del viewer chrome.

### Cards
- **Corner Style:** 26px (`--cs-radius-lg`)
- **Background:** `--cs-surface` sobre `--cs-cream`
- **Shadow Strategy:** shadow-2 (ver Elevation & Depth)
- **Border:** 1px `rgba(0,0,0,0.08)`
- **Internal Padding:** 40px 44px

### Badges
- **Style:** fondo translúcido del color semántico (10-12% de opacidad) + texto sólido del mismo color; forma de píldora (999px)
- **Variantes:** primary, green, red, orange, muted — una por estado semántico, nunca decorativas

### Eyebrows / Labels
- **Style:** uppercase, 24px, letter-spacing 0.22em, peso 700, color `--cs-primary` sobre `--cs-cream` o blanco translúcido sobre gradiente

### Act Marker (Signature Component)
Indicador de paso ("1/2") en la esquina superior derecha de slides multi-paso, en fuente mono. Es el único elemento de navegación interna visible en pantalla — todo lo demás del viewer chrome (barra de progreso, botón de fullscreen) vive fuera del canvas de la slide. La barra de progreso anima con `transform: scaleX()` (no `width`), para evitar layout thrash.

## Print / PDF

El export a PDF es impresión nativa del navegador (`Cmd/Ctrl+P`), y el estado que se imprime **no** es el estado inicial de la slide sino el final: todos los `.reveal` visibles, todos los contadores en su cifra real, el marcador de paso en su último paso. Cuatro defectos del motor heredado se corrigieron para que esto se cumpla (ver `.impeccable/design.json` → `printPipeline`); si alguna vez un deck exporta slides en blanco, contadores en cero, o el chrome del reproductor encima del contenido, la causa está ahí.

**The Final-State Rule.** Lo que se imprime es la slide terminada, nunca un fotograma intermedio de su animación. Cualquier patrón de animación nuevo que se agregue a `animations.md` debe tener su estado final garantizado bajo `@media print`.

## Do's and Don'ts

### Do:
- **Do** dejar que un solo color domine cada slide (`--cs-primary` o el fondo neutro) y usar `--cs-accent` en un solo elemento como máximo.
- **Do** usar Display (168px) solo en cover y transition, nunca en slides de contenido.
- **Do** mantener el gradiente del pack exclusivamente en cover y cierre.
- **Do** verificar contraste ≥4.5:1 para texto normal y ≥3:1 para texto grande antes de dar por cerrado un color nuevo (ver umbrales reales en `check-style-pack.mjs`, más estrictos que WCAG mínimo).

### Don't:
- **Don't** poner líneas o barras decorativas bajo ningún título.
- **Don't** usar iconografía de stock genérica (candados, engranajes, bombillas) cuando hay un ícono más específico disponible.
- **Don't** dejar una slide de contenido sin ningún elemento visual (imagen, gráfica, ícono, número grande) — nunca solo texto/bullets.
- **Don't** mezclar más de 3 colores con peso visual real en una misma slide (dominante + apoyo + acento).
- **Don't** volver a las fuentes o paletas de la lista de *training-data defaults* (ver The No-Slop-Palette Rule) como default de ningún pack nuevo.
