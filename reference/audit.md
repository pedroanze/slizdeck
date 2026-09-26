# Fase: audit — validación antes de entregar

Se activa antes de dar un deck por terminado, y siempre que el usuario pida explícitamente "audita el deck" o "revisa que esté bien" sobre uno ya generado.

## Doctrina de severidad

Todo hallazgo de esta skill —de `audit.mjs`, `check-contrast.mjs`, `check-reveal.mjs`, `check-overflow.mjs` o `doctor.mjs`— cae en uno de tres niveles. `reference/fix.md` y `reference/add.md` usan estos mismos tres nombres en vez de reinventar su propia forma de describir qué bloquea y qué no:

- **Bloqueante** (✗): hay que corregirlo antes de entregar, sin excepción. Contraste, balance de HTML, footers mal numerados, bugs de cascada CSS.
- **Aviso** (⚠): se informa al usuario pero no bloquea la entrega — típicamente assets pendientes ya aceptados, o un caso donde el script no tiene contexto suficiente para decidir.
- **A decidir**: no es ni bloqueante ni un simple aviso — el script encontró algo real pero la acción correcta depende de una decisión del usuario, no hay un "correcto" único. Ejemplos: un hallazgo de `doctor.mjs` (¿le aplica este fix viejo a mi deck ya customizado?), o un falso positivo de `audit.mjs` (un título de dos oraciones con punto, deliberado como remate retórico). En estos casos: decírselo al usuario con el hallazgo concreto y que él confirme el curso de acción, nunca decidir en su nombre ni silenciarlo editando el detector a ciegas.

## Correr el script

```bash
node scripts/audit.mjs deck.html
node scripts/check-contrast.mjs deck.html
node scripts/check-reveal.mjs deck.html
node scripts/check-overflow.mjs deck.html
```

Los cuatro se corren desde la carpeta del proyecto con la ruta de la skill delante (ver `SKILL.md` → "Dónde se corre cada cosa"). Después viene el paso que ningún script puede hacer: **mirar el deck** (`shoot.mjs`, más abajo).

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
| Texto en pantalla | Aviso si una slide pasa de 45 palabras (sin contar footer, notas, tablas ni gráficas): ese discurso va a `<aside class="notes">` |
| Emojis | Aviso si hay emojis en pantalla (regla de voz 6) |
| Variedad de layout | Aviso si 3 o más slides seguidas tienen la misma estructura |

Los tres últimos son **avisos**: no hacen fallar el script, pero cada uno se resuelve o se justifica antes de entregar (una cita larga puede justificar las 45 palabras; un deck que pidió emojis, los emojis).

Un fallo (✗) hay que corregirlo antes de entregar. Un aviso (⚠) se reporta al usuario pero no bloquea — típicamente son los assets pendientes o casos donde el script no tiene suficiente contexto para decidir (ej. un deck sin ninguna slide de contenido numerada).

`check-reveal.mjs` es un chequeo aparte, en Chrome headless: `audit.mjs` solo mira el HTML estático, así que nunca puede detectar bugs de la cascada CSS que solo aparecen cuando un `.reveal` se revela de verdad en el navegador (por ejemplo, `.reveal.is-on` perdiendo contra `.reveal.r-left`/`.r-rise`/`.r-scale`/`.r-blur` por orden de declaración — mismo nivel de especificidad, gana el que está después en el archivo). Un fallo aquí también se corrige antes de entregar: se ve navegando el deck en vivo aunque el PDF salga bien.

**Si el script marca un falso positivo** (por ejemplo, un título de dos líneas donde cada línea es su propia oración con punto, como remate retórico deliberado) es un hallazgo **a decidir**, no lo silencies editando el regex a ciegas: decírselo al usuario y que confirme si es una excepción válida para ese deck en concreto.

## `check-overflow.mjs` — texto que no cabe

```bash
node scripts/check-overflow.mjs deck.html
```

Otro chequeo aparte en Chrome headless, en el mismo espíritu que `check-reveal.mjs`: detecta (1) contenido más ancho o alto que el canvas 1920×1080 del `<deck-stage>`, (2) cualquier elemento con `white-space: nowrap` cuyo texto real sea más ancho que su caja (se trunca sin verse a simple vista en el HTML), y (3) dos bloques de texto que se solapan más de un 25% del área del más chico, midiendo la caja real del texto vía `Range` (no la del elemento contenedor, que suele ser más grande que el texto y da falsos positivos). Los `[data-counter]` se miden con su valor final, no el "0" inicial. Un solape intencional (ej. un badge sobre una esquina) se marca con `data-overlap-ok` en el contenedor para excluirlo del chequeo. Un fallo acá es **bloqueante** — texto truncado, que se sale del canvas, o que se pisa con otro texto, nunca se lee, tanto en vivo como en el PDF exportado.

**Nota sobre fuentes serif de descenso grande:** una serif display a `line-height` ajustado (ej. Young Serif en el pack `editorial`) puede sobresalir varias decenas de px de su caja de `Range` por las propias métricas de la fuente — un falso positivo de solape con separación real de más de 30px medida a ojo. Si `shoot.mjs` no muestra ningún pisado real, tratar el hallazgo como sospechoso antes de reescribir la slide.

## `check-contrast.mjs` — contraste real, no el de los tokens

```bash
node scripts/check-contrast.mjs deck.html
```

Mide el color computado de cada texto contra el fondo que le queda detrás, ya renderizado. Es distinto de lo que hace `check-style-pack.mjs`, que valida los pares de tokens declarados en `:root`: un `--cs-muted` que pasa sobre `--cs-cream` puede ser ilegible dentro de una card de fondo oscuro, o quedar por debajo del umbral porque encima lleva un `opacity`. Esa combinación solo existe en el render. Un fallo acá es **bloqueante**.

Los textos sobre gradiente, imagen de fondo o `background-clip: text` (el cover, el cierre, `.grad-word`) **no se miden**: su fondo no es un color plano, así que un solo ratio no lo describiría. El script los cuenta y los reporta aparte, para revisarlos a ojo — nunca los da por aprobados.

## `shoot.mjs` — mirar el deck, no deducirlo del HTML

```bash
node scripts/shoot.mjs deck.html            # todas las slides
node scripts/shoot.mjs deck.html --slides=3,7-9
```

Renderiza cada slide a un PNG 1920×1080 en su estado final (reveals aplicados, contadores en su cifra real). **Después hay que abrir esas imágenes y mirarlas** — leerlas como imagen, no solo comprobar que el archivo existe.

Es el único paso del flujo que puede juzgar lo que ninguna regex ni ninguna medición puntual alcanza: si la jerarquía se lee de un vistazo, si tres slides seguidas comparten la misma composición, si una imagen pelea con el título, si el peso de color está desbalanceado, si la slide respira o está toda apelotonada en el tercio superior. Es la lista de "lo que el script no puede revisar" de más abajo.

**Una sola ronda, acotada.** Generar el deck completo → una tanda de capturas → mirarlas todas y anotar → un batch de correcciones → como mucho una segunda vuelta. Un loop abierto de screenshot-y-retoque consume el presupuesto del usuario sin converger; si a la segunda ronda algo sigue sin cerrar, se le reporta a él en vez de seguir iterando.

## `doctor.mjs` — deck generado con una versión vieja del engine

```bash
node scripts/doctor.mjs deck.html
```

Compara el `slizdeck-engine-version` embebido al principio del deck contra la versión actual de `template.html`, y si es anterior, imprime las entradas de `CHANGELOG.md` entre esas versiones — por ejemplo, el fix de cascada CSS de `.reveal.is-on`. Es puramente informativo (**a decidir**, no bloqueante): los decks están fuertemente customizados a mano, así que no hay auto-fix seguro. Recomendado especialmente al retomar un deck viejo con `add`/`fix`, para saber si le falta algún fix de engine antes de seguir editándolo. Un deck sin la marca de versión (generado antes de que existiera) es en sí mismo un hallazgo, no un error del script.

## Lo que el script no puede revisar

Esto sigue siendo criterio del modelo, no de una regex. Se juzga **sobre las capturas de `shoot.mjs`**, no sobre el HTML — aplicar `reference/design-guidelines.md` al mirarlas:

- Que el mensaje de cada slide aterrice en una idea, no en un párrafo.
- Que haya variedad real de layout entre slides consecutivas (no la misma composición 5 veces seguidas).
- Que el elemento visual de cada slide sea específico al contenido, no un ícono de stock genérico.
- Que las notas de composición del pack elegido se hayan aplicado, no solo su paleta (ver `styles/<pack>.md`).
- Que el nivel de animación sea coherente con el tamaño del deck.

## Checklist completa (script + criterio)

- [ ] `node scripts/audit.mjs <deck>.html` pasa sin fallos
- [ ] `node scripts/check-contrast.mjs <deck>.html` pasa sin fallos (y los textos sobre gradiente se revisaron a ojo)
- [ ] `node scripts/check-reveal.mjs <deck>.html` pasa sin fallos
- [ ] `node scripts/check-overflow.mjs <deck>.html` pasa sin fallos
- [ ] `node scripts/shoot.mjs <deck>.html` y **las capturas se miraron una por una**
- [ ] Títulos en una línea donde tiene sentido
- [ ] Cada slide tiene un elemento visual, no es solo texto/bullets
- [ ] Un color domina cada slide, el acento se usa con cuentagotas
- [ ] Variedad de layout entre slides consecutivas
- [ ] Las notas de composición del pack elegido se aplicaron

**Al terminar esta fase:** el deck pasa los scripts sin fallos y el modelo miró las capturas y confirmó los puntos de criterio. Sigue `export` si el usuario necesita PDF o PPTX; si no, el deck ya está listo para presentarse desde el navegador.
