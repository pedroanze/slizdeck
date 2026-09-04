---
name: slizdeck
description: |
  Genera decks de slides HTML animados a partir de un design system propio — enfocado en pitch decks de startup (minimalista, poco texto, mucha imagen/gráfica), pero también sirve para charlas, demos y recaps de evento. Arquitectura deck-stage 1920×1080 con navegación por teclado, pensado para presentar en vivo. El design system se define de forma guiada (preguntas simples o detectando tokens existentes), nunca requiere que el usuario escriba CSS/JSON a mano. El contenido se construye investigando en internet antes de proponer un wireframe que el usuario aprueba. Salida: archivo HTML autónomo (sin build step) exportable a PDF con impresión nativa del navegador.

  DISPARADORES: crea un pitch deck, hazme un deck, presentación para X, slides para X, deck de startup, prepara una presentación, build slides, crea slides.
license: MIT
compatibility: Requiere un agente con capacidad de ejecutar comandos de shell (crear/copiar archivos, abrir el navegador) y búsqueda web. Probado en Claude Code; compatible con cualquier cliente del estándar Agent Skills (agentskills.io).
---

# Slizdeck

Genera un deck HTML: canvas 1920×1080 controlado por teclado, autónomo (sin dependencias externas de build), con navegación, barra de progreso, fullscreen, y export a PDF por impresión nativa del navegador.

Fork/adaptación de [`claude-slides`](https://github.com/marcogalluccio/claude-slides) (MIT) — ver `NOTICE.md`.

## Archivos de la skill

| Archivo | Uso |
|---|---|
| `template.html` | Boilerplate del deck-stage (motor de navegación + tokens de diseño + reveal system). Punto de partida de todo deck nuevo. |
| `reference/design-tokens-schema.md` | Esquema del design system (`design-tokens.json`) y cómo se mapea a las CSS variables del template. |
| `reference/design-guidelines.md` | Principios de diseño: poco texto, un color dominante, anti-clichés, variedad de layout. Aplicar al construir el wireframe y al generar el HTML. |
| `reference/deck-schema.md` | Formato del wireframe, arcos narrativos por tipo de deck, niveles de animación, estructura de cada `<section>`. |
| `reference/components.md` | Catálogo de patrones de layout (cards, grids, mockups, diagramas) con HTML+CSS listos para copiar. |
| `reference/animations.md` | Catálogo de técnicas de animación (reveal por pasos, dibujo de SVG, popups) y gotchas conocidos — solo para nivel HEAVY. |
| `reference/icons.md` | Librería de íconos SVG con estilo coherente. |
| `examples/demo-deck.html` | Deck de ejemplo de 6 slides, referencia end-to-end. |

## Cuándo activar esta skill

Cuando el usuario pide slides o una presentación de cualquier tipo. Si no especifica el tipo, asumir **pitch deck de startup** (el caso de uso principal) y confirmarlo en el brief. No activar si el usuario está editando un deliverable existente que no sea HTML (PowerPoint que ya tiene, Canva, Google Slides ya creado) — ahí no aplica esta skill.

## Flujo

Este flujo es multi-turno: una vez cargado el contenido de esta skill, sigue vigente en toda la conversación — no hace falta releerlo en cada mensaje, pero sí seguir sus pasos como estado permanente hasta cerrar el deck.

### 1. Confirmar

Al reconocer el disparador: *"Te armo el deck. Antes, defino tu design system y el brief."*

### 2. Design system

Buscar `design-tokens.json` en el directorio de trabajo actual.

- **Si existe**: leerlo y usarlo directamente (validar contra `reference/design-tokens-schema.md`).
- **Si el usuario menciona un design system existente** (tokens de su sitio, guía de marca, CSS de otro proyecto): leerlo y traducirlo al esquema.
- **Si no hay nada**: hacer como máximo 3 preguntas simples, en un solo mensaje:
  1. Color de marca (un hex, o una descripción como "verde esmeralda" — o "elige tú").
  2. Tipografía preferida, o "elige tú".
  3. El "vibe" del deck en una frase (ej. "minimalista y serio", "bold y energético", "oscuro y tech").

  Con esas respuestas, generar automáticamente `design-tokens.json` completo (paleta, tipografía, radios, spacing) siguiendo la lógica de derivación de colores en `reference/design-tokens-schema.md`. El usuario nunca tiene que escribir JSON/CSS a mano; puede pedir ajustes después ("más oscuro", "cambia el acento a coral") y se regenera el archivo.

Guardar `design-tokens.json` en el directorio del proyecto (no dentro de la skill) para poder reutilizarlo en futuros decks del mismo usuario/marca.

### 3. Brief + research

Recoger en una ronda, sin re-preguntar lo que el usuario ya dio:

| Input | Ejemplo | Cuándo preguntar |
|---|---|---|
| **Tema/producto** | "Plataforma de gestión de inventario para restaurantes" | Siempre |
| **Público** | "Inversores seed", "audiencia técnica de una conferencia" | Siempre |
| **Tipo** | pitch deck (default) / talk / demo / recap de evento / workshop | Si no es obvio |
| **Duración/tamaño** | "5 min pitch" → ~8 slides; "charla de 30 min" → ~12 slides | Siempre |
| **Contexto existente** | "la info está en `docs/pitch-notes.md`" o una URL | Si el usuario lo menciona, leerlo antes de seguir |

**Investigar en internet** lo necesario para que el contenido sea sólido y actual: datos de mercado, competidores, cifras del sector, validación de afirmaciones. No inventar números — si no se encuentra un dato real, dejarlo como placeholder explícito y avisar al usuario.

### 4. Arco narrativo

Proponer 1-3 arcos posibles según el tipo (tabla completa en `reference/deck-schema.md`). Para pitch deck de startup, el default es: **hook → problema → solución → cómo funciona → tracción/data → equipo → ask**. Presentar conciso, esperar elección o ajuste del usuario.

### 5. Wireframe

Con el arco elegido, presentar el wireframe slide-por-slide (formato en `reference/deck-schema.md`): número, título corto, patrón de `components.md`, una línea de descripción. Aplicar `reference/design-guidelines.md` al proponerlo — un mensaje por slide, elemento visual siempre presente, números en vez de adjetivos donde haya datos.

**Esperar aprobación explícita** antes de generar nada. Ajustar cuantas veces haga falta.

### 6. Nivel de animación

Una vez aprobado el wireframe, proponer un nivel (NONE/LIGHT/HEAVY, tabla y defaults en `reference/deck-schema.md`) y pedir confirmación. Reglas fijas: cover y transition siempre estáticas; nunca HEAVY en decks de más de 18 slides salvo pedido explícito.

### 7. Generar el deck

1. **Assets si hacen falta**: fotos (pedir rutas/URLs, copiar a `assets/people/`), logos (`assets/logos/`), QR codes si el deck tiene slide de contacto (`qrencode -o assets/qr/[nombre].png -s 20 -m 2 -l H "URL"`, requiere `brew install qrencode` una vez).
2. Copiar `template.html` al directorio del proyecto con nombre basado en el tema (ej. `pitch-acme.html`).
3. Sustituir las CSS variables de `:root` con los valores de `design-tokens.json` (mapeo completo en `reference/design-tokens-schema.md`). Si la tipografía cambia de Inter, actualizar también el `<link>` de Google Fonts en `<head>`.
4. Por cada slide del wireframe: copiar el patrón elegido de `reference/components.md`, poblarlo con el contenido real; si el nivel es LIGHT o HEAVY, agregar `class="reveal" data-step="N"` a los elementos a revelar progresivamente y `data-steps="N"` en la `<section>`; si es HEAVY en esa slide, agregar la técnica de `reference/animations.md`.
5. Insertar todas las `<section>` donde dice `INSERT SLIDES HERE`.
6. Actualizar `<title>` y los footers (`Speaker · Org · NN`, numeración sin huecos ni duplicados).
7. Aplicar `reference/design-guidelines.md` en cada slide (colores, jerarquía, variedad de layout, anti-clichés) antes de dar por cerrada la generación.

### 8. Abrir e iterar

Abrir el archivo generado en el navegador. El usuario revisa y pide ajustes en conversación normal (*"cambia la slide 3"*, *"elimina la 5"*, *"aplica X a todo el deck"*). Después de cada edit, el usuario recarga el navegador — no hace falta reabrir el archivo.

### 9. Exportar a PDF

El export a PDF es nativo del navegador: `Cmd/Ctrl+P` → guardar como PDF. El template ya incluye las reglas `@media print` necesarias (tamaño de página = 1920×1080, un salto de página por slide). Si el resultado no tiene suficiente fidelidad visual, evaluar como paso posterior una alternativa vía Playwright (fuera del alcance de la Fase 1 de esta skill).

### 10. Speaker notes (solo si el usuario las pide)

Generar `[nombre-deck]-notes.md`: un bloque `## Slide NN — Título` por slide, con el discurso completo en párrafos (lo que el presentador dice, no bullets).

## Reglas de voz — aplicar siempre

1. **Sintético en pantalla, el presentador habla.** Nada de párrafos largos en la slide — el discurso completo va en las speaker notes.
2. **Sin punto final** en títulos (h1/h2/h3), subtítulos, eyebrows y payoffs de título. Sí llevan punto los párrafos de cuerpo, quotes y captions.
3. **Títulos en una sola línea** cuando sea posible.
4. **Numeración 01/02/03**, no A/B/C.
5. **Sin em-dash** (— o --). Usar comas, dos puntos, punto y aparte, o paréntesis.
6. **Sin emojis en las slides** (salvo pedido explícito) — usar SVG de `reference/icons.md`.
7. **Puente entre slides** lo dice el presentador — las slides son marco, no discurso completo.
8. **Cover y cierre en gradiente** (`class="grad"`); slides intermedias en `--cs-cream`.
9. **Cover y transition siempre estáticas** (`data-steps="1" data-current-step="1"`, sin `.reveal`).
10. **Corte directo entre slides** (ya está en el template, 120ms). Sin sweep/gradiente al entrar.
11. **Footer siempre presente**: logo (si hay) + nombre/org + número de slide.

## Checklist de calidad (aplicar antes de entregar)

- [ ] Sin em-dash en ninguna slide
- [ ] Sin punto final en h1/h2/h3/subtítulos
- [ ] Títulos en una línea donde tiene sentido
- [ ] Footers numerados sin huecos ni duplicados
- [ ] `<title>` actualizado con el nombre del deck
- [ ] Cover y transition estáticas
- [ ] CSS variables de `:root` reflejan `design-tokens.json` (o el default neutro si no hay uno)
- [ ] Nivel de animación coherente con el tamaño del deck (nunca HEAVY en >18 slides)
- [ ] Cada slide tiene un elemento visual, no es solo texto/bullets
- [ ] Un color domina cada slide, el acento se usa con cuentagotas (ver `reference/design-guidelines.md`)
- [ ] HTML balanceado: `<section>` y `<div>` abiertos = cerrados

## Notas finales

- **El template es punto de partida, no dogma.** Si hace falta un layout nuevo, agregarlo a `reference/components.md` después de crearlo.
- **`reference/animations.md` tiene los gotchas** de cada técnica — leerlos antes de usar nivel HEAVY.
- **Probar siempre en el navegador.** Abrir, verificar que el mensaje pasa, iterar.
- **Animar cuesta tokens.** Respetar el nivel elegido; si el usuario pide "esta slide debe ser WOW", subir de nivel solo esa slide, no todo el deck.
- **Fase 1 de `slizdeck`**: un solo estilo visual bien calibrado (el neutro azul/violeta o los colores de marca del usuario). El catálogo de varios "style packs" y el export a PPTX llegan en fases posteriores — ver el plan del proyecto.
