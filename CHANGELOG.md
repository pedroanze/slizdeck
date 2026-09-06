# Changelog

Historial de cambios al engine (`template.html`) y a los scripts de la skill. Cada entrada de versión corresponde al comentario `slizdeck-engine-version` embebido al principio de todo deck generado — `scripts/doctor.mjs <deck.html>` lo lee para avisar si un deck viejo se generó antes de un fix relevante.

No sigue un versionado semántico estricto todavía (proyecto de un solo mantenedor, sin releases públicos aún) — cada entrada nueva simplemente sube el número cuando cambia algo en `template.html` que pueda afectar un deck ya generado.

## 1.0.0

- **Fix: orden de cascada CSS en `.reveal.is-on`.** `.reveal.is-on { transform: none }` estaba declarada ANTES que las variantes `.reveal.r-rise`/`.r-scale`/`.r-blur`/`.r-left` en el `<style>`. Misma especificidad (dos clases) → en un empate gana la regla declarada después, así que las variantes ganaban la cascada y un elemento revelado se quedaba con el transform/filter de su propia animación aplicado para siempre en la vista en vivo del navegador (nunca en el PDF exportado, porque `@media print` fuerza `!important` aparte). Un deck generado antes de este fix tiene el bug; `scripts/check-reveal.mjs` lo detecta.
- **OKLCH en los gradientes** (`--cs-grad-radial/linear/text`): evita el punto medio "sucio" que da la interpolación RGB por defecto.
- **Primera versión con el marcador `slizdeck-engine-version`** embebido en `template.html` — decks generados antes de esta versión no lo tienen (`scripts/doctor.mjs` lo reporta como hallazgo, no como fallo).
