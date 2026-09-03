---
name: Slizdeck — Sistema neutro default
description: Sistema visual base de slizdeck para pitch decks de startup — confiado, contenido, un color domina y el acento se usa con cuentagotas.
colors:
  founders-teal: "#0E7C66"
  founders-teal-mid: "#146E63"
  boardroom-navy: "#1E3A5F"
  signal-ember: "#AD5407"
  paper-cream: "#F7F6F2"
  paper-cream-deep: "#EDECE6"
  ink-black: "#000000"
  ink-body: "#454545"
  ink-muted: "#65696F"
  surface-white: "#FFFFFF"
  stage-void: "#0C0C1A"
  status-green: "#15803D"
  status-red: "#B91C1C"
  status-orange: "#B45309"
typography:
  display:
    fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif"
    fontSize: "168px"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif"
    fontSize: "76px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  subtitle:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "36px"
    fontWeight: 300
    lineHeight: 1.4
  title:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.22em"
  display-md:
    fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif"
    fontSize: "132px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  payoff:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.4
  label-sm:
    fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
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
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.lg}"
    padding: "40px 44px"
  badge-primary:
    backgroundColor: "rgba(14,124,102,0.10)"
    textColor: "{colors.founders-teal}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  badge-green:
    backgroundColor: "rgba(22,163,74,0.12)"
    textColor: "{colors.status-green}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  badge-red:
    backgroundColor: "rgba(220,38,38,0.10)"
    textColor: "{colors.status-red}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  badge-orange:
    backgroundColor: "rgba(217,119,6,0.12)"
    textColor: "{colors.status-orange}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
---

# Design System: Slizdeck — Sistema neutro default

## Overview

**Creative North Star: "El Escenario del Fundador"**

Cada slide es un momento de un pitch en vivo frente a inversores, no una página de documento. El sistema es confiado y contenido: pocos elementos por slide, cada uno con peso deliberado, sin decoración que no sirva al mensaje. El verde azulado (Founder's Teal) domina el peso visual; el azul marino (Boardroom Navy) solo aparece en el gradiente de apertura/cierre; el ámbar quemado (Signal Ember) es la única voz que "grita", y lo hace con cuentagotas — un dato, un badge, nunca un fondo.

Rechazos confirmados: nada de líneas o barras decorativas bajo los títulos, nada de iconografía de stock genérica, nada de bullets como única forma de mostrar información, nada de gradientes decorativos fuera de cover/cierre, nada de la paleta azul/violeta ni de las tipografías (Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk) que `impeccable` marca como los tells más reconocibles de UI generada por IA.

**Key Characteristics:**
- Confiado y contenido, no enérgico ni ruidoso.
- Un color domina cada slide (60-70% del peso visual); el acento aparece en un solo elemento por slide, como máximo.
- Silencioso hasta que importa: todo en reposo es plano y quieto; el ámbar es lo único que reclama atención.
- Canvas fijo 1920×1080, escalado uniformemente al viewport (no es un layout responsive tradicional).
- Un heading serif con carácter editorial (Newsreader) sobre un body sans funcional (IBM Plex Sans) — la jerarquía viene también del contraste serif/sans, no solo de escala.

## Colors

Un dominante frío y confiado (verde azulado), un acompañante aún más frío reservado al gradiente de marca (azul marino), y un acento cálido que corta la paleta a propósito.

### Primary
- **Founder's Teal** (#0E7C66): color dominante. Eyebrows, números destacados, badges primarios, la mitad del gradiente de cover/cierre.

### Secondary
- **Boardroom Navy** (#1E3A5F): solo aparece en el gradiente de marca (`--cs-grad-radial`, `--cs-grad-linear`, `--cs-grad-text`) — cover, cierre, y palabras de énfasis con `.grad-word`. Nunca como color sólido de fondo o texto por sí solo.

### Tertiary
- **Signal Ember** (#AD5407): el acento nítido. Un detalle por slide como máximo — un dato animado, un badge, un ícono puntual. Nunca un fondo, nunca más de un elemento por slide.

El gradiente de marca pasa por un punto medio, **Founder's Teal Mid** (#146E63), que suaviza la transición teal→navy en `--cs-grad-text`. Los colores de estado (`status-green` #15803D, `status-red` #B91C1C, `status-orange` #B45309) existen solo para los badges semánticos: nunca se usan como color de texto, fondo o acento fuera de un badge.

### Neutral
- **Paper Cream** (#F7F6F2): fondo de todas las slides intermedias (no cover/transición).
- **Stage Void** (#0C0C1A): el fondo del navegador fuera del canvas 1920×1080 (letterboxing). No es parte de la slide — es el "cine" alrededor de ella, y por eso es casi negro.
- **Paper Cream Deep** (#EDECE6): variante ligeramente más oscura del fondo crema, para separación sutil entre superficies.
- **Ink Black** (#000000): texto de máximo contraste (títulos sobre crema).
- **Ink Body** (#454545): texto de cuerpo.
- **Ink Muted** (#65696F): texto secundario, eyebrows de card, footer. Calibrado a ≥4.5:1 de contraste sobre blanco y crema (WCAG AA) — el tono heredado original (#9BA1A5) no llegaba a 3:1.
- **Surface White** (#FFFFFF): fondo de cards sobre crema.

### Named Rules
**The One Accent Rule.** Signal Ember aparece en como máximo un elemento por slide. Su escasez es lo que lo hace notar.

**The Gradient-Is-A-Bookend Rule.** El gradiente (teal→navy) vive solo en cover y cierre. Las slides intermedias son crema, sin excepción.

**The No-Slop-Palette Rule.** Nunca volver a un gradiente azul/violeta ni a combinaciones cian-sobre-oscuro como default — son el tell de paleta más reconocible de UI generada por IA (verificado con `impeccable`).

## Typography

**Display Font:** Newsreader (con fallback a `Georgia, 'Times New Roman', serif`)
**Body Font:** IBM Plex Sans (con fallback a `ui-sans-serif, system-ui, -apple-system, sans-serif`)
**Label/Mono Font:** `ui-monospace, 'SF Mono', Menlo, Consolas, monospace` (usado en el act-marker/step indicator)

**Character:** Un serif editorial para los momentos de mayor peso (cover, headlines) contra un sans funcional para todo lo demás — el contraste entre familias hace parte de la jerarquía, no solo la escala. Ninguna de las dos está en la lista de fuentes sobreusadas por IA generativa (Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk).

### Hierarchy
- **Display** (Newsreader 600, 168px, line-height 0.98, letter-spacing -0.02em): títulos de cover y transition — el momento de mayor peso del deck.
- **Display MD** (Newsreader 600, 132px, line-height 1.0, letter-spacing -0.02em): variante de cover para títulos más largos que no respiran a 168px.
- **Headline** (Newsreader 600, 76px, line-height 1.05, letter-spacing -0.015em): título de cada slide de contenido.
- **Subtitle** (IBM Plex Sans 300, 36px, line-height 1.4): subtítulo bajo el título de cover o de transición.
- **Title** (IBM Plex Sans 700, 32px, line-height 1.15, letter-spacing -0.01em): encabezado dentro de una card.
- **Body** (IBM Plex Sans 400, 24px, line-height 1.5): párrafo de card, texto de footer.
- **Label** (IBM Plex Sans 700, 24px, uppercase, letter-spacing 0.22em): eyebrows y card-eyebrows.
- **Label SM** (IBM Plex Sans 700, 20px, uppercase, letter-spacing 0.14em): texto dentro de badges.
- **Payoff** (IBM Plex Sans 600, 30px, line-height 1.4): frase de remate bajo el contenido de una slide.
- **Step Marker** (mono 700, 24px, letter-spacing 0.08em): el indicador de paso "1/2" del act-marker. Único uso de la monoespaciada en el sistema.

### Named Rules
**The One-Line Title Rule.** Los títulos se escriben en una sola línea siempre que sea posible; un `<br>` solo se justifica por equilibrio visual, nunca por longitud del texto.

**The Serif-Sans Contrast Rule.** El heading nunca hereda la fuente del body ni viceversa — el contraste entre Newsreader y IBM Plex Sans es intencional y no debe colapsarse a una sola familia salvo pedido explícito del usuario.

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
- **Background:** Surface White sobre fondo Paper Cream
- **Shadow Strategy:** shadow-2 (ver Elevation & Depth)
- **Border:** 1px `rgba(0,0,0,0.08)`
- **Internal Padding:** 40px 44px

### Badges
- **Style:** fondo translúcido del color semántico (10-12% de opacidad) + texto sólido del mismo color; forma de píldora (999px)
- **Variantes:** primary (teal), green, red, orange, muted — una por estado semántico, nunca decorativas

### Eyebrows / Labels
- **Style:** uppercase, 24px, letter-spacing 0.22em, peso 700, color Founder's Teal sobre crema o blanco translúcido sobre gradiente

### Act Marker (Signature Component)
Indicador de paso ("1/2") en la esquina superior derecha de slides multi-paso, en fuente mono. Es el único elemento de navegación interna visible en pantalla — todo lo demás del viewer chrome (barra de progreso, botón de fullscreen) vive fuera del canvas de la slide. La barra de progreso anima con `transform: scaleX()` (no `width`), para evitar layout thrash.

## Print / PDF

El export a PDF es impresión nativa del navegador (`Cmd/Ctrl+P`), y el estado que se imprime **no** es el estado inicial de la slide sino el final: todos los `.reveal` visibles, todos los contadores en su cifra real, el marcador de paso en su último paso. Cuatro defectos del motor heredado se corrigieron para que esto se cumpla (ver `.impeccable/design.json` → `printPipeline`); si alguna vez un deck exporta slides en blanco, contadores en cero, o el chrome del reproductor encima del contenido, la causa está ahí.

**The Final-State Rule.** Lo que se imprime es la slide terminada, nunca un fotograma intermedio de su animación. Cualquier patrón de animación nuevo que se agregue a `animations.md` debe tener su estado final garantizado bajo `@media print`.

## Do's and Don'ts

### Do:
- **Do** dejar que un solo color domine cada slide (Founder's Teal o el crema neutro) y usar Signal Ember en un solo elemento como máximo.
- **Do** usar Display (168px) solo en cover y transition, nunca en slides de contenido.
- **Do** mantener el gradiente (teal→navy) exclusivamente en cover y cierre.
- **Do** verificar contraste ≥4.5:1 para texto normal y ≥3:1 para texto grande antes de dar por cerrado un color nuevo.

### Don't:
- **Don't** poner líneas o barras decorativas bajo ningún título.
- **Don't** usar iconografía de stock genérica (candados, engranajes, bombillas) cuando hay un ícono más específico disponible.
- **Don't** dejar una slide de contenido sin ningún elemento visual (imagen, gráfica, ícono, número grande) — nunca solo texto/bullets.
- **Don't** mezclar más de 3 colores con peso visual real en una misma slide (dominante + apoyo + acento).
- **Don't** volver a Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans o Space Grotesk como default, ni a paletas azul/violeta con gradiente.
