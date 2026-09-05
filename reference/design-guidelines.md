# Principios de diseño — estilo pitch deck de startup

Estas reglas gobiernan tanto el **contenido** (qué tanto texto, qué se muestra) como el **acabado visual** (color, jerarquía, layout) de cada slide. Se aplican al construir el wireframe (fase `brief`, ver `reference/brief.md`) y otra vez al generar el HTML final (fase `build`). Están adaptadas de la guía de diseño anti-genérico que usa la skill oficial de PPTX de Anthropic, y ajustadas al estilo de pitch deck de startup (minimalista, denso en imagen, ligero en texto).

## Contenido: poco texto, un mensaje por slide

- **Una idea por slide.** Si necesitas "y" para describir de qué trata una slide, son dos slides.
- **Título corto, sin punto final.** El título es el mensaje, no una oración completa. El cuerpo (si existe) lo explica en una frase, no un párrafo.
- **Nada de párrafos largos en pantalla.** Si el contenido necesita más de 2-3 líneas cortas, es candidato a: (a) volverse una gráfica/número, (b) dividirse en varias slides, o (c) pasar a las speaker notes (el discurso completo va ahí, no en la slide).
- **Números > adjetivos.** "3x más rápido" gana siempre a "mucho más rápido". Si hay un dato, se muestra como cifra grande (ver componente `[data-counter]` en `template.html`), no como texto corrido.
- **Cada slide necesita un elemento visual.** Imagen, gráfica, ícono, mockup, diagrama o número grande — nunca una slide de solo texto/bullets. Si el contenido no tiene un visual natural, buscar uno (ícono de `icons.md`, patrón de `components.md`) antes de dejarla en texto puro.

## Color: un dominante, no un arcoíris

- **Un color domina el 60-70% del peso visual** de cada slide (`--cs-primary` o el fondo `--cs-cream`/`--cs-black` según el tipo de slide).
- **1-2 tonos de apoyo** (`--cs-secondary` y los neutros) para jerarquía y separación.
- **`--cs-accent` es un acento nítido, no un color más.** Se usa en detalles puntuales — un badge, un número, un ícono — nunca como fondo grande ni en más de un elemento por slide.
- **Nunca mezclar más de 3 colores con peso visual real** en una sola slide (dominante + apoyo + acento). Los neutros (`cream`, `black`, `body`, `muted`) no cuentan para este límite.

## Anti-clichés — nunca hacer esto

Directamente prohibido, sin importar qué tan "de diseño" parezca:

- Líneas o barras decorativas debajo de los títulos (el subrayado-de-acento genérico).
- Fondos beige/crema aplicados sin razón a cada slide por default — el `--cs-cream` del template es intencional y ya está calibrado; no añadir más decoración encima.
- Iconografía genérica de stock (candados, engranajes, bombillas) cuando hay un ícono más específico disponible en `icons.md` o un mockup/diagrama real en `components.md`.
- Bullets como única forma de presentar información — ver "Contenido" arriba.
- Texto centrado en slides de contenido (solo cover y transition van centradas — ver `SKILL.md`, regla de voz #9).
- Gradientes decorativos en elementos que no sean el fondo de cover/transition o `--cs-grad-text` en una palabra de énfasis.
- **Fuentes sobreusadas en UI generada por IA**: Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk. El default de `template.html` usa Newsreader (heading) + IBM Plex Sans (body) — si el usuario no pide una tipografía específica, no volver a Inter por comodidad.
- **Paletas azul/violeta con gradiente y combinaciones cian-sobre-oscuro**: son el tell más reconocible de "hecho por IA". El default de `template.html` usa verde azulado + azul marino + ámbar quemado precisamente para evitar este patrón.

Estas dos reglas están verificadas con la skill `impeccable` (`node ~/.claude/skills/impeccable/scripts/detect.mjs --json <archivo>`), que las marca automáticamente como `overused-font` y `ai-color-palette`. Correr el detector sobre un deck terminado es una buena forma de auditar esto sin depender solo del ojo.

## Layout: variar, no repetir la misma composición

- No usar el mismo patrón de `components.md` en slides consecutivas. Si dos slides seguidas son "card-grid", alternar con un layout de imagen a sangre, un mockup, o un diagrama.
- Preferir composiciones asimétricas (imagen a un lado, texto al otro; card grid con una card destacada) sobre todo-centrado-todo-igual.
- Alinear el texto de cuerpo a la izquierda. Solo centrar títulos de cover/transition.
- Respetar los márgenes de `.pad` (`--cs-pad-top/x/bottom`) — no apretar el contenido contra los bordes del canvas 1920×1080.

## Jerarquía y ritmo del deck completo

- **Cover fuerte, cierre fuerte.** El primer y último slide son gradiente/alto contraste (`.grad`); las intermedias respiran en `--cs-cream`.
- **Alternar densidad.** Después de una slide con mucha data/mockup, una slide de transición (`.ts-title`, estática, gran tipografía) para que el público respire.
- **La narrativa manda el orden**, no la plantilla. Usar los arcos narrativos de `SKILL.md` (hook → problema → solución → tracción → ask, para pitch) como columna vertebral del wireframe.

## Fase 1 (MVP): un solo estilo, bien calibrado

En esta fase no hay catálogo de múltiples estilos — el objetivo es que el estilo neutro azul/violeta de `template.html` (o su variante con los colores de marca del usuario, vía `design-tokens.json`) se sienta consistentemente "pro" y de startup, no genérico. El catálogo de varios "style packs" (minimalista editorial, bold/gradiente, oscuro tech, corporativo limpio) llega en la Fase 2, calibrado con las referencias visuales del usuario.
