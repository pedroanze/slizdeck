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
- **Fuentes y paletas sobreusadas en UI generada por IA**: ver la lista completa y las zonas atractoras en `reference/init.md` y `styles/index.md` (`check-style-pack.mjs` las detecta automáticamente). No hay un único default que evitarlas por sí solo — cada style pack ya está calibrado contra esta lista.

`check-style-pack.mjs` (bundleado con slizdeck, siempre disponible) ya detecta estas dos reglas automáticamente. Si además está instalada la skill externa **opcional** `impeccable` (`https://github.com/pbakaus/impeccable`), su detector da una segunda opinión más granular (`node ~/.claude/skills/impeccable/scripts/detect.mjs --json <archivo>`, marca los hallazgos como `overused-font` y `ai-color-palette`) — pero no es necesaria para que esta validación funcione; si no está instalada, `check-style-pack.mjs` solo ya alcanza.

## Layout: variar, no repetir la misma composición

- No usar el mismo patrón de `components.md` en slides consecutivas. Si dos slides seguidas son "card-grid", alternar con un layout de imagen a sangre, un mockup, o un diagrama.
- Preferir composiciones asimétricas (imagen a un lado, texto al otro; card grid con una card destacada) sobre todo-centrado-todo-igual.
- Alinear el texto de cuerpo a la izquierda. Solo centrar títulos de cover/transition.
- Respetar los márgenes de `.pad` (`--cs-pad-top/x/bottom`) — no apretar el contenido contra los bordes del canvas 1920×1080.

## Jerarquía y ritmo del deck completo

- **Cover fuerte, cierre fuerte.** El primer y último slide son gradiente/alto contraste (`.grad`); las intermedias respiran en `--cs-cream`.
- **Alternar densidad.** Después de una slide con mucha data/mockup, una slide de transición (`.ts-title`, estática, gran tipografía) para que el público respire.
- **La narrativa manda el orden**, no la plantilla. Usar los arcos narrativos de `SKILL.md` (hook → problema → solución → tracción → ask, para pitch) como columna vertebral del wireframe.

## Frase sola / transition: elegir el tamaño por longitud, nunca el default a ciegas

`.ts-title` (168px) es el tamaño de una portada, no de cualquier frase. Usado sin criterio en una oración larga, la parte en 3-4 líneas y dejar de leerse como remate — es exactamente el efecto que hay que evitar. Elegir la clase por longitud del texto:

| Longitud del texto | Clase | Líneas esperadas |
|---|---|---|
| < 45 caracteres | `.ts-title` (168px) | 1 |
| 45-80 caracteres | `.ts-title-md` (96px) | 1-2 |
| 80-120 caracteres | `.ts-title-sm` (64px) | 2-3 |
| > 120 caracteres | — | No usar este patrón: acortar la frase o pasarla a una slide de contenido con cuerpo de texto (`h2.title` + `<p>`), nunca forzarla en `.ts-title` a cualquier tamaño. |

Un separador de sección usa el mismo tamaño de `.ts-title` que una frase sola, pero sobre `class="grad"` (el mismo fondo invertido de cover/cierre) en vez de `--cs-cream` — la diferenciación es el fondo, no el texto. Un número de capítulo grande y tenue de fondo se probó primero y se descartó: a los tamaños de `.ts-title` los dígitos chocan visualmente contra las letras del título. `.grad .ts-title` y `.grad .ts-tagline` pasan a blanco automáticamente (ver `template.html`), igual que ya hace `.eyebrow`. Son narrativamente distintos de una frase sola de contenido (uno marca un capítulo, el otro remata una idea) y deben distinguirse a simple vista.

## Énfasis dentro del texto

Para resaltar una palabra o frase sin cambiar el fondo a gradiente: `<span class="hl">frase clave</span>` (negrita + color primario) en cualquier `h1`/`h2`/`p`/`.ts-tagline`. Mismo cupo que el acento: **máximo un `.hl` por slide**. No es intercambiable con `.grad-word` (ese va sobre fondo con gradiente y usa el degradado de texto del pack; `.hl` es para slides en `--cs-cream` que quieren un remate sin cambiar de fondo).

**No sirve de nada dentro de un elemento que ya es bold del mismo color.** `.ts-title`/`.ts-title-md`/`.ts-title-sm` ya son `font-weight:600` en `--cs-black` — meter un `.hl` (700, `--cs-primary`) ahí es invisible si el pack usa negro puro como primario (el caso de cualquier sistema casi monocromo, como un pack de marca sin color de acento real). Antes de usarlo, comprobar que el texto base alrededor sea más liviano (`.ts-tagline`, `<p>` de cuerpo, `.subtitle`) o que `--cs-primary` sea un color realmente distinto de `--cs-black`/`--cs-body` — si no, no se va a ver y hay que descartarlo, no dejarlo puesto "por si acaso".
