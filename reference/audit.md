# Fase: audit — validación antes de entregar

Se activa antes de dar un deck por terminado, y siempre que el usuario pida explícitamente "audita el deck" o "revisa que esté bien" sobre uno ya generado.

## Correr el script

```bash
node scripts/audit.mjs deck.html
node scripts/check-reveal.mjs deck.html
```

`audit.mjs` verifica automáticamente lo que **sí** se puede confirmar con una regex sobre el HTML final:

| Categoría | Qué revisa |
|---|---|
| Contraste y paleta | Delega en `check-style-pack.mjs`: WCAG, distinción primario/acento, zonas atractoras de IA, fuentes de la lista de clichés |
| Balance de HTML | `<section>` y `<div>` abiertos = cerrados (ignorando comentarios) |
| Em-dash | Ninguno en el contenido visible (fuera de comentarios y bloques `<script>`/`<style>`) |
| Puntuación de títulos | Sin punto final en `h1`/`h2`/`h3`/`.subtitle` |
| Footers | Numeración `01, 02, 03...` sin huecos ni duplicados |
| Cover/transition estáticas | Ninguna `<section data-steps="1">` tiene `.reveal` adentro |
| `<title>` | Actualizado, no el placeholder del template |
| Assets pendientes | Lista los `<!-- SLIZDECK-ASSET-PENDING: ... -->` que quedaron de la fase `assets` — es un aviso, no un fallo: ya fue una decisión informada del usuario |

Un fallo (✗) hay que corregirlo antes de entregar. Un aviso (⚠) se reporta al usuario pero no bloquea — típicamente son los assets pendientes o casos donde el script no tiene suficiente contexto para decidir (ej. un deck sin ninguna slide de contenido numerada).

`check-reveal.mjs` es un chequeo aparte, en Chrome headless: `audit.mjs` solo mira el HTML estático, así que nunca puede detectar bugs de la cascada CSS que solo aparecen cuando un `.reveal` se revela de verdad en el navegador (por ejemplo, `.reveal.is-on` perdiendo contra `.reveal.r-left`/`.r-rise`/`.r-scale`/`.r-blur` por orden de declaración — mismo nivel de especificidad, gana el que está después en el archivo). Un fallo acá también hay que corregirlo antes de entregar: es exactamente la clase de bug que se ve a ojo navegando el deck en vivo pero nunca aparece en el PDF exportado (`@media print` fuerza los transforms/filters a `none` con `!important` y lo tapa).

**Si el script marca un falso positivo** (por ejemplo, un título de dos líneas donde cada línea es su propia oración con punto, como remate retórico deliberado), no lo silencies editando el regex a ciegas: decírselo al usuario y que confirme si es una excepción válida para ese deck en concreto.

## Lo que el script no puede revisar

Esto sigue siendo criterio del modelo, no de una regex — aplicar `reference/design-guidelines.md` al leerlo de nuevo:

- Que el mensaje de cada slide aterrice en una idea, no en un párrafo.
- Que haya variedad real de layout entre slides consecutivas (no la misma composición 5 veces seguidas).
- Que el elemento visual de cada slide sea específico al contenido, no un ícono de stock genérico.
- Que las notas de composición del pack elegido se hayan aplicado, no solo su paleta (ver `styles/<pack>.md`).
- Que el nivel de animación sea coherente con el tamaño del deck.

## Checklist completa (script + criterio)

- [ ] `node scripts/audit.mjs <deck>.html` pasa sin fallos
- [ ] `node scripts/check-reveal.mjs <deck>.html` pasa sin fallos
- [ ] Títulos en una línea donde tiene sentido
- [ ] Cada slide tiene un elemento visual, no es solo texto/bullets
- [ ] Un color domina cada slide, el acento se usa con cuentagotas
- [ ] Variedad de layout entre slides consecutivas
- [ ] Las notas de composición del pack elegido se aplicaron

**Al terminar esta fase:** el deck pasa el script sin fallos y el modelo confirmó los puntos de criterio. Sigue `export` si el usuario necesita PDF o PPTX; si no, el deck ya está listo para presentarse desde el navegador.
