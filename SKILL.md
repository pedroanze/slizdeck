---
name: slizdeck
description: |
  Genera decks de slides HTML animados a partir de un design system propio — enfocado en pitch decks de startup (minimalista, poco texto, mucha imagen/gráfica), pero también sirve para charlas, demos y recaps de evento. Arquitectura deck-stage 1920×1080 con navegación por teclado, pensado para presentar en vivo. Trae cinco style packs listos (terminal oscuro, blanco puro, color dominante, denso en datos, editorial), cada uno con paleta, tipografía y reglas de composición validadas contra contraste WCAG y clichés visuales de IA. El design system se define de forma guiada —elegir un pack, inyectar los colores de la marca del usuario, o generar una paleta a medida— y nunca requiere que el usuario escriba CSS/JSON a mano. El contenido se construye investigando en internet antes de proponer un wireframe que el usuario aprueba. Salida: archivo HTML autónomo (sin build step), exportable a PDF con impresión nativa del navegador y a PPTX editable (texto y formas nativas de PowerPoint, no imágenes).

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
| `reference/media-and-data.md` | Imágenes, métricas, barras y pantalla de inicio. **Y cuándo pedirle assets al usuario.** |
| `reference/animations.md` | Catálogo de técnicas de animación (reveal por pasos, dibujo de SVG, popups) y gotchas conocidos — solo para nivel HEAVY. |
| `reference/icons.md` | Librería de íconos SVG con estilo coherente. |
| `examples/demo-deck.html` | Deck de ejemplo de 6 slides, referencia end-to-end. |
| `styles/index.md` | Catálogo de style packs. **Lo único que hay que leer para elegir estilo.** |
| `styles/<pack>.md` | Un mundo visual completo: tokens, tipografía y reglas de composición. |
| `scripts/apply-style-pack.mjs` | Aplica un pack a un deck fusionando tokens (no reemplaza el `:root`). |
| `scripts/check-style-pack.mjs` | Valida contrastes, distinción primario/acento y clichés de IA. |
| `scripts/export-pptx.mjs` | Exporta un deck HTML a `.pptx` editable (texto y formas nativas). |

## Cuándo activar esta skill

Cuando el usuario pide slides o una presentación de cualquier tipo. Si no especifica el tipo, asumir **pitch deck de startup** (el caso de uso principal) y confirmarlo en el brief. No activar si el usuario está editando un deliverable existente que no sea HTML (PowerPoint que ya tiene, Canva, Google Slides ya creado) — ahí no aplica esta skill.

## Flujo

Este flujo es multi-turno: una vez cargado el contenido de esta skill, sigue vigente en toda la conversación — no hace falta releerlo en cada mensaje, pero sí seguir sus pasos como estado permanente hasta cerrar el deck.

### 1. Confirmar

Al reconocer el disparador: *"Te armo el deck. Antes, defino tu design system y el brief."*

### 2. Estilo y design system

Tres caminos, en este orden. El objetivo es que el usuario nunca escriba CSS ni JSON a mano.

**a) El usuario ya tiene design system.** Buscar `design-tokens.json` en el directorio actual, o leer los tokens que el usuario señale (CSS de su sitio, guía de marca, variables de otro proyecto). Sus colores mandan. Aun así hay que elegir un pack de `styles/index.md`, porque el pack aporta lo que un archivo de tokens casi nunca trae: tipografía, composición y reglas de uso del color. Aplicar el pack y después sobreescribir sus colores con los de la marca:

```bash
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html
node scripts/check-style-pack.mjs deck.html    # confirmar que la marca no rompe contrastes
```

Si al inyectar los colores de marca el validador falla, **decirlo y proponer el ajuste mínimo** (normalmente oscurecer el texto atenuado o separar acento de primario), nunca entregar un deck que no pasa.

**b) El usuario no tiene design system.** Mostrar la tabla de `styles/index.md` —solo esa tabla, son cinco líneas— y pedirle que elija. Si no elige, `paper-white`. Preguntar si tiene un color de marca para inyectar; si no lo tiene, el pack se usa tal cual.

Con el pack elegido, mostrar también sus **2 alternativas tipográficas** (nombre + la línea de "cuándo preferirla" que trae el propio pack) y dejar elegir entre esas y el default. No es personalización libre — son 2-3 opciones curadas por pack, ya validadas contra clichés de IA — pero sí le da al usuario una decisión real sobre cómo se ve su tipografía. Si no elige, se usa el default del pack. Aplicar con:

```bash
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html --font=<id>   # si eligió una alternativa
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html               # si se queda con el default
```

**c) El usuario no tiene nada y quiere algo hecho a medida.** Generar una semilla con la skill de diseño `impeccable`:

```bash
node ~/.claude/skills/impeccable/scripts/palette.mjs --from "<tema del deck>"
```

Devuelve un color ancla en OKLCH y el mood que evoca. Componer los cinco roles (fondo, superficie, ink, acento, atenuado) siguiendo las reglas que el propio script imprime, tomando como base el pack cuya estructura mejor calce, y validar con `check-style-pack.mjs`. Presentar el resultado como propuesta, no como hecho consumado.

**Reglas que no se negocian, vengan los colores de donde vengan:**
- El fondo es blanco puro o casi negro salvo que el mood sea explícitamente ambiental (un panel de instrumentos, una pantalla de terminal). Un fondo crema "porque se ve cálido" es el cliché que hay que evitar: la calidez va en los colores de marca y en la tipografía, no en la superficie.
- Nunca usar Inter, Roboto, Fraunces, Newsreader, IBM Plex, Space Grotesk, Geist, DM Sans, Plus Jakarta Sans ni Instrument Sans salvo que el usuario las pida por nombre. Están en la lista de fuentes que delatan una interfaz generada por IA.
- El deck no se da por terminado hasta que `check-style-pack.mjs` pasa sin fallos.

Guardar `design-tokens.json` en el directorio del proyecto (no dentro de la skill) para reutilizarlo en futuros decks de la misma marca.

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

### 5.5. Pedir los assets que faltan

Con el wireframe aprobado, **antes de generar**, revisar qué slides necesitan una imagen, un gráfico o un dato real y **pedírselos al usuario en un solo mensaje**. Una slide rellena de texto que sustituye a la imagen que debería estar ahí es una slide peor, no una slide resuelta.

Pedir imagen cuando la slide muestra un producto o una pantalla, presenta personas, abre o cierra el deck, o es la pantalla de espera. Decir siempre **qué slide, qué debería mostrar y en qué proporción** (a sangre: 1920×1080; media pantalla: 960×1080; recuadro: libre).

Pedir el dato real cuando el wireframe tenga una cifra: es preferible un placeholder marcado a un número inventado.

Ofrecer continuar sin los assets, dejando el hueco marcado en el deck para reemplazarlo después. Nunca bloquear la generación esperando una foto.

Ver `reference/media-and-data.md` para los patrones y para dónde guardar los archivos.

### 6. Nivel de animación

Una vez aprobado el wireframe, proponer un nivel (NONE/LIGHT/HEAVY, tabla y defaults en `reference/deck-schema.md`) y pedir confirmación. Reglas fijas: cover y transition siempre estáticas; nunca HEAVY en decks de más de 18 slides salvo pedido explícito.

**Variar la entrada según el elemento.** Revelar todo el deck con el mismo `fade-up` es lo que hace que un deck animado se sienta mecánico. El template trae variantes que se combinan con `.reveal`: `r-rise` para títulos, `r-scale` para cifras, `r-blur` para imágenes y citas, `r-left` para listas y pasos, `r-wipe` para barras y reglas, `r-mask` para remates, `r-fade` para texto largo. Un contenedor con `.stagger` escalona sus hijos automáticamente sin escribir `--d` a mano.

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

### 9. Exportar

El HTML ya es el entregable principal (se presenta en vivo desde el navegador). Además hay dos exports:

**PDF** — impresión nativa del navegador: `Cmd/Ctrl+P` → guardar como PDF. El template ya trae las reglas `@media print` que garantizan el **estado final** de cada slide: reveals visibles, contadores en su cifra real, sin el chrome del reproductor. No hace falta avanzar las animaciones a mano antes de imprimir.

Para generarlo sin abrir el navegador (útil para verificar un cambio):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="deck.pdf" --virtual-time-budget=5000 "file://$PWD/deck.html"
```

**PPTX editable** — para quien necesite el deck en PowerPoint o Google Slides:

```bash
node scripts/export-pptx.mjs deck.html deck.pptx
```

Reconstruye cada slide con cajas de texto y formas nativas (no imágenes), leyendo los design tokens del propio HTML. La primera vez requiere `npm install` en la raíz de la skill.

Advertir al usuario de las tres degradaciones inherentes al formato, que no son fallos del export:
- **Sin animaciones**: PPTX no reproduce el sistema de reveals; se exporta el estado final.
- **Fuentes sustituidas**: las fuentes web se mapean a fuentes seguras de Office (serif → Cambria, sans → Calibri) porque una fuente no instalada en la máquina del lector se sustituye sola y rompe el layout.
- **Gradientes aplanados**: los fondos de cover/cierre se exportan en el color primario sólido.

Si el usuario necesita fidelidad visual exacta, el PDF es el formato correcto; el PPTX es para cuando necesita **editar**.

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
- [ ] `node scripts/check-style-pack.mjs <deck>.html` pasa sin fallos
- [ ] Las notas de composición del pack elegido se aplicaron (no solo su paleta)
- [ ] HTML balanceado: `<section>` y `<div>` abiertos = cerrados

## Notas finales

- **El template es punto de partida, no dogma.** Si hace falta un layout nuevo, agregarlo a `reference/components.md` después de crearlo.
- **`reference/animations.md` tiene los gotchas** de cada técnica — leerlos antes de usar nivel HEAVY.
- **Probar siempre en el navegador.** Abrir, verificar que el mensaje pasa, iterar.
- **Animar cuesta tokens.** Respetar el nivel elegido; si el usuario pide "esta slide debe ser WOW", subir de nivel solo esa slide, no todo el deck.
