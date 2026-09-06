# Changelog

Historial de cambios al engine (`template.html`) y a los scripts de la skill. Cada entrada de versión corresponde al comentario `slizdeck-engine-version` embebido al principio de todo deck generado — `scripts/doctor.mjs <deck.html>` lo lee para avisar si un deck viejo se generó antes de un fix relevante.

Una sola versión gobierna todo el proyecto y vive en cuatro sitios que deben coincidir siempre: `package.json`, el `metadata.version` de `SKILL.md`, el marcador `slizdeck-engine-version` de `template.html`, y la primera entrada de este archivo. `node scripts/check-versions.mjs` lo verifica y falla si alguno se desalinea.

## 1.4.0

Ronda de endurecimiento salida de auditar el propio repo: el engine deja de anunciar validaciones que nadie hacía, y las que hay dejan de tener puntos ciegos.

- **`no_overlapping_text` implementado.** Cada slide declara `data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"`, pero el segundo token no lo verificaba ningún script. Ahora `check-overflow.mjs` detecta dos textos superpuestos midiendo la caja del **texto** (vía `Range`), no la del elemento: un `<div>` block ocupa todo el ancho de la slide aunque su texto sean 80px en una esquina, y compararlo por bounding box daba falsos positivos en cada slide. Acotado a texto-contra-texto; `data-overlap-ok` excluye un solape intencional. Cero falsos positivos en las 15 variantes del smoke-test.
- **Fix: las superficies de card usaban `#fff` literal.** 10 patrones de `components.md` (y las dos cards del deck de ejemplo) fijaban `background: #fff`, que sobrevive al cambio de pack: en `terminal`, donde `--cs-black` es claro, una card blanca dejaba el texto **blanco sobre blanco (1:1)**. Ahora usan `var(--cs-surface)`. La excepción documentada es el QR, que necesita fondo blanco real. Encontrado al validar cada pack sobre contenido real, no sobre el template vacío.
- **El canvas de `<deck-stage>` toma `var(--cs-cream)`** en vez de `#fff`, para no dar un destello blanco al cargar un deck de pack oscuro.
- **`check-style-pack.mjs` explica la consecuencia de `--cs-accent-on`:** cuando un pack declara que su acento vive sobre el primario, ahora dice cuánto daría ese acento sobre el fondo de las slides y para qué no sirve. El mecanismo ya existía y era correcto; lo que faltaba era que el modelo supiera la restricción al componer.
- **`smoke-test.mjs` valida además cada pack sobre contenido real** (el deck de ejemplo, no el template vacío): 20 variantes. La estructura es bloqueante (una regresión de engine se ve ahí); el contraste es informativo, porque cruzar un deck compuesto para un pack con las reglas de otro puede fallar legítimamente.
- **Nuevo: `scripts/check-docs.mjs`**, canario contra el drift docs↔repo: que todo script y toda referencia estén en las tablas, que los links relativos resuelvan, que `DESIGN.md` y `design.json` coincidan, y que ningún pack use una fuente que el propio validador rechaza. Corre en CI.
- **Fix: los recursos remotos se contaban dentro de comentarios.** `make-offline.mjs` avisaba de una dependencia de red que no existía (y `check-reveal`/`check-contrast`/`shoot` culpaban a un script inexistente) porque `template.html` trae el `<script>` de lucide comentado como opt-in. Ahora se enmascaran los comentarios antes de buscar.
- **`check-overflow.mjs` diagnostica como `check-reveal`:** si no termina, nombra los scripts externos del deck como causa probable en vez de mandar a revisar Chrome.

## 1.3.0

- **Fix de accesibilidad: el total del act-marker era ilegible.** El indicador de paso de las slides multi-step (`2 /3`) marcaba el total con un `style="opacity:.4"` inline, que dejaba `--cs-muted` en **1.7:1** sobre blanco — muy por debajo de cualquier umbral WCAG. Ahora es una clase `.act-marker .step-total` con `opacity: .8` (~3.3:1, el mínimo AA para 24px). Un deck ya generado con el inline sigue teniendo el problema: reemplazar `<span style="opacity:.4">` por `<span class="step-total">` y añadir la regla al `<style>`.
- **Nuevo: `scripts/check-contrast.mjs`.** Mide el contraste de cada texto ya renderizado contra su fondo efectivo, que es distinto de lo que valida `check-style-pack.mjs` (pares de tokens en `:root`). Encontró justamente el bug de arriba, invisible para la validación de tokens porque `--cs-muted` sobre blanco sí pasa: lo que fallaba era la opacidad encima. Los textos sobre gradiente o imagen se reportan como no medidos, nunca como aprobados.
- **Nuevo: `tests/validators.test.js`** (`npm test`, solo `node:test`, cero dependencias): mete defectos concretos en el deck de referencia y verifica que cada validador los detecte. Un validador que siempre dice ✓ es peor que no tenerlo. Encontró de paso que `audit.mjs`, `doctor.mjs` y `export-pptx.mjs` escupían un stack trace de Node ante un archivo inexistente, ya corregido.
- **Portabilidad:** `audit.mjs` y `smoke-test.mjs` resolvían su ruta con `new URL(...).pathname`, que deja `%20` en rutas con espacios y devuelve `/C:/...` en Windows. Ahora usan `fileURLToPath`, como el resto.
- **`renumber.mjs` mantiene sincronizados los marcadores `SLIZDECK-ASSET-PENDING: slide NN`**, que tras insertar una slide apuntaban a la equivocada.
- **Índice al principio de `components.md` y `animations.md`**, para saltar al patrón que pide el wireframe en vez de leer 1200 líneas y quedarse con los primeros.
- **Branding heredado:** el placeholder del `<title>` pasa a `Slizdeck · [DECK NAME]` y los tokens dejan de titularse "CLAUDE SLIDES". El `<html lang>` lleva ahora un recordatorio de ajustarlo al idioma del deck.
- **Nuevo: `scripts/shoot.mjs`.** Renderiza cada slide a PNG en su estado final para que el modelo pueda mirar el deck en la fase `audit`, en vez de deducirlo del HTML. Es el único paso que puede juzgar jerarquía, variedad de composición y peso visual.

## 1.2.0

Sin cambios en el engine: un deck generado con 1.1.0 no necesita ninguna corrección. Esta versión son fixes en los scripts de validación y export, todos en la misma dirección — ninguna herramienta debe afirmar algo que no verificó.

- **Fix: `renumber.mjs` saltaba las slides con número provisional no numérico.** `add.md` promete que se puede insertar una slide con "cualquier `data-label`/`<span class="num">` provisional", pero el script exigía `\d+` y trataba un `0X` como "slide sin número de footer", dejándola fuera de la numeración *y* reportando "sin cambios". Ahora renumera cualquier `<span class="num">` no vacío, informa cuántas slides saltó, y enmascara los comentarios HTML antes de buscar (una `<section>` de ejemplo comentada desbalanceaba la cuenta).
- **Fix: `export-pptx.mjs` perdía contenido en silencio.** El export reconoce un set cerrado de patrones; lo que caía fuera desaparecía con exit 0 y un `✓ N slides` que sugería que todo había viajado (en un pitch real se perdieron los nombres de los fundadores). Ahora compara el texto visible del DOM contra el exportado y lista, por slide, cada elemento que no llegó al `.pptx`.
- **Fix: `check-reveal.mjs` culpaba a la máquina por un problema del deck.** Si un deck carga un `<script src>` externo bloqueante, `DOMContentLoaded` nunca dispara y el chequeo se cuelga; el mensaje decía "no es un problema del deck evaluado: revisar que Chrome headless funcione en esta máquina". Ahora detecta los scripts externos y los nombra como causa probable, y solo apunta a la máquina cuando el deck no tiene ninguno.
- **Fix: `make-offline.mjs` prometía "sin red" sin verificarlo.** Solo incrusta fuentes, pero afirmaba que el deck ya no dependía de la red aunque quedaran scripts, hojas de estilo o imágenes remotas. Ahora las detecta y las lista como aviso.
- **Docs:** `PRODUCT.md` y `design.json` estaban congelados en el sistema visual anterior a los style packs (paleta y fuentes que la propia skill prohíbe); el ejemplo de `design-tokens-schema.md` enseñaba justo esas fuentes. Regenerados contra el estado actual. Corregidos además varios claims que atribuían a los validadores comprobaciones que no hacen.
- **Nuevo: `scripts/check-versions.mjs`**, que verifica en CI que los cuatro sitios de versión coincidan.

## 1.1.0

- **Fix: foco de teclado invisible en el chrome del viewer.** `#fs-btn` (botón de fullscreen) y `.btn` (controles del reproductor: anterior/siguiente/reset) sacaban el `outline` del navegador al enfocarse (`:focus { outline: none }`) sin poner ningún reemplazo — un usuario navegando el deck con teclado no veía ningún indicador de foco en esos controles. Encontrado auditando slizdeck contra los criterios de diseño de `impeccable` (`craft-floor.md` → "Browser surfaces" / "States: keyboard focus"). Ahora `:focus-visible` muestra un anillo blanco (`box-shadow`), y `:focus` sin `-visible` (click de mouse) se mantiene sin outline — el patrón estándar para no mostrar el anillo a quien usa mouse pero sí a quien navega con teclado.

## 1.0.0

- **Fix: orden de cascada CSS en `.reveal.is-on`.** `.reveal.is-on { transform: none }` estaba declarada ANTES que las variantes `.reveal.r-rise`/`.r-scale`/`.r-blur`/`.r-left` en el `<style>`. Misma especificidad (dos clases) → en un empate gana la regla declarada después, así que las variantes ganaban la cascada y un elemento revelado se quedaba con el transform/filter de su propia animación aplicado para siempre en la vista en vivo del navegador (nunca en el PDF exportado, porque `@media print` fuerza `!important` aparte). Un deck generado antes de este fix tiene el bug; `scripts/check-reveal.mjs` lo detecta.
- **OKLCH en los gradientes** (`--cs-grad-radial/linear/text`): evita el punto medio "sucio" que da la interpolación RGB por defecto.
- **Primera versión con el marcador `slizdeck-engine-version`** embebido en `template.html` — decks generados antes de esta versión no lo tienen (`scripts/doctor.mjs` lo reporta como hallazgo, no como fallo).
