# Test 01 · "básico" — GPT-6 Astra (charla relámpago)

Bitácora de una ejecución end-to-end de la skill `slizdeck` sobre un caso real, hecha
por un agente que además hace de usuario simulado. Todo lo que aquí se llama "decisión"
es una decisión que la skill le pide a un humano y que tomé yo, anotando el porqué.

- **Deck:** [`astra-flash.html`](astra-flash.html)
- **Exports:** [`astra-flash.pdf`](astra-flash.pdf) · [`astra-flash.pptx`](astra-flash.pptx)
- **Capturas de la fase audit:** `.slizdeck-shots/` (7 PNG). La de la slide 02 se
  reemplazó por la de una corrida buena: la primera salió vacía por el Hallazgo 3,
  no por un defecto del deck.
- **Fecha de la prueba:** 2026-09-06 · **Engine:** slizdeck 1.4.0

---

## 1. Caso y perfil

| | |
|---|---|
| **Tema** | ChatGPT / GPT-6 Astra, el nuevo modelo de OpenAI |
| **Perfil probado** | La presentación **más simple posible**: charla relámpago, poco texto, sin gráficas complejas |
| **Público** | General / tech-curioso |
| **Tipo** | Talk corta (5 min) |
| **Tamaño** | 6-7 slides |
| **Style pack** | `paper-white` (el default de la skill) |

Qué se estaba probando: **el camino por defecto**. Un deck chico, sin marca del usuario,
sin design system previo, sin imágenes propias y sin animación pesada. Es el escenario
que la skill promete resolver sin fricción, así que cualquier tropiezo aquí es un
tropiezo del camino feliz, no de un caso raro.

---

## 2. Bitácora por fase

### Paso 0 — ruteo

`SKILL.md` (líneas 92-96) manda chequear el directorio antes de asumir "deck nuevo".
Hecho: `grep -l "data-steps=" *.html` en la carpeta de trabajo → sin resultados
(carpeta vacía). Confirmado deck nuevo → recorrido completo `init → brief → assets →
build → audit → export`.

### init

**Qué pide la skill** (`reference/init.md`): elegir uno de los tres caminos (a: el usuario
ya tiene design system / b: no tiene y elige un pack / c: paleta a medida), después elegir
tipografía entre el default del pack y sus 2 alternativas curadas, y preguntar si hay un
color de marca para inyectar.

**Decisiones como usuario:**

| Pregunta | Decisión | Por qué |
|---|---|---|
| Camino a/b/c | **b** — sin design system, elijo pack | Es una charla personal, no hay marca. Es el camino que la skill declara default. |
| Pack | **`paper-white`** | Asignado por el diseño de esta prueba, y coincide con el default de `styles/index.md`. Encaja: el contenido son cifras de benchmarks y precios, y el pack existe justamente para "cuando las cifras deben cargar todo el peso". |
| Tipografía | **default (Schibsted Grotesk)**, no `hanken` ni `figtree` | El objetivo del caso es probar el camino por defecto de punta a punta. Cambiar la fuente habría probado `--font=<id>`, que es otro camino. |
| Color de marca | **ninguno** | Sin marca que inyectar. El pack se usa tal cual, como permite `init.md`. |
| `design-tokens.json` | **no lo generé** | `init.md` dice "guardar `design-tokens.json` en el directorio del proyecto para reutilizarlo", pero ningún script lo escribe ni lo lee (ver Hallazgo 5). Escribirlo a mano habría sido inventar un artefacto que nada consume. |

`init.md` también sugiere comprobar si existe el generador de paletas externo
(`~/.claude/skills/impeccable/scripts/palette.mjs`). No aplica: es solo para el camino (c).

**Nota importante y correcta de la doc:** `init.md` aclara que *esta fase decide, no aplica*
— el archivo del deck todavía no existe. Se cumplió: `apply-style-pack.mjs` recién corrió
en `build`. Esta aclaración evita el error obvio de intentar aplicar un pack sobre un
archivo inexistente; está bien puesta.

### brief

**Qué pide la skill** (`reference/brief.md`): brief en una ronda, research en internet,
1-3 arcos narrativos propuestos, wireframe slide por slide, y **esperar aprobación
explícita**.

**Decisiones como usuario:**

| Pregunta | Decisión | Por qué |
|---|---|---|
| Tipo de deck | **talk**, no pitch deck | `SKILL.md` dice asumir pitch deck si no se especifica; acá el perfil de la prueba especifica "charla corta". El arco de pitch (problema → solución → tracción → ask) no aplica a explicar el lanzamiento de un modelo. |
| Arco | **Historia → giro → insight → invitación** (el de "Talk" en `deck-schema.md`), instanciado como: qué pasó → qué cambia de verdad → el asterisco → qué cuesta → qué hacer | Es el arco que la propia tabla de `deck-schema.md` asigna a "Talk / charla". El "giro" es el que hace honesta la charla: Astra gana en computer use pero pierde en los índices generales. |
| Tamaño | **7 slides** | `deck-schema.md` orienta 8-12 para talk; bajé a 7 porque el perfil pide 5 minutos. Decisión consciente de salirme del rango orientativo. |
| Idioma | **español** (`<html lang="es">`) | El público de la prueba. |

**Research:** hecho con WebSearch/WebFetch, 6 fuentes reales (ver sección 3). Cero cifras
inventadas: cada número en pantalla tiene URL. Dos fuentes primarias devolvieron **HTTP 403**
a WebFetch (`openai.com/index/gpt-6-astra/` y `axios.com`), así que los benchmarks se
tomaron de agregadores que sí responden (Vellum, MindStudio, llm-stats) y se citan como
tales en la propia slide.

**Wireframe aprobado (por mí, como usuario):**

```
SLIDE 01 · Cover · cover-gradient (estática)
   GPT-6 Astra + una línea de qué es + fecha

SLIDE 02 · Qué pasó · timeline (variante de flow-pipeline, alineada a la izquierda)
   03 sep preview limitada → 04 sep usuarios de pago

SLIDE 03 · El salto · barras comparativas (derivado de counter-bars)
   OSWorld 2.0 y ScreenSpot-Pro: Astra vs GPT-5.6 Sol

SLIDE 04 · Transición · transition-cream (estática)
   "Con asteriscos"

SLIDE 05 · El asterisco · filas de comparación cabeza a cabeza
   Intelligence Index / Coding Agent Index / HLE: Astra vs Claude Fable 5.1

SLIDE 06 · La cuenta · fila de métricas (media-and-data.md)
   $10 in · $50 out · 1M de contexto

SLIDE 07 · Cierre · cover-gradient (estática)
   Qué hacer el lunes
```

Chequeo contra `design-guidelines.md`: un mensaje por slide ✓, elemento visual en todas ✓,
números en vez de adjetivos ✓, sin dos slides consecutivas con el mismo patrón ✓,
cover y cierre en gradiente con las intermedias en blanco ✓.

### assets

**Qué pide la skill** (`reference/assets.md`): recorrer el wireframe, clasificar cada slide
(¿imagen? ¿logo? ¿dato?), pedir todo en un solo mensaje y **bloquear hasta tener una de
tres respuestas explícitas por ítem**. Es la fase que el brief de la prueba prohíbe saltar,
y también la que la propia doc marca como "nunca se salta".

**Checklist generado y resuelto:**

| # | Slide | Ítem | Proporción pedida | Respuesta (usuario simulado) | Por qué |
|---|---|---|---|---|---|
| 1 | 01 Cover | ¿Imagen a sangre de fondo? | 1920×1080 | **Cambiar el wireframe** (opción 3): cover solo con gradiente | El pack `paper-white` dice literalmente "las cover son negras con texto blanco: el contraste entre portada y contenido es el único efecto del pack". Meter una foto contradice el pack. |
| 2 | 03 El salto | Captura real de Astra manejando un navegador | media pantalla (960×1080) | **Seguir sin ella** (opción 2) → marcador insertado | Es el ítem que más aportaría, pero no tengo acceso a Astra para capturarla y el brief prohíbe hotlinkear o inventar rutas. Es exactamente el caso que la opción 2 existe para cubrir. |
| 3 | Todas | Logo de OpenAI (footer o slide) | libre | **Cambiar el wireframe** (opción 3): sin logos de terceros | Un logo ajeno hay que bajarlo de algún lado; la regla de la prueba prohíbe hotlinkear y no hay archivo local. El footer queda con nombre + evento + número, que es lo mínimo que exige la regla de voz 11. |
| 4 | Todas | Logo del presentador | footer | **Seguir sin él** | No hay marca. `template.html` ya trae el `<img>` del logo comentado, así que el footer queda válido sin tocarlo. |
| 5 | 02, 03, 05, 06 | Datos reales de cada cifra | — | **Resuelto**: 12 cifras, todas con fuente | Ver sección 3. Ningún `[DATO PENDIENTE]`. |

El marcador del ítem 2 quedó en el HTML tal como manda `assets.md`, justo antes del
`<section>` afectado:

```html
<!-- SLIZDECK-ASSET-PENDING: slide 03 — captura real de Astra manejando un navegador, sigue con placeholder -->
```

y `audit.mjs` lo reporta después como **aviso**, no como fallo. Ese circuito
(assets marca → build inserta → audit reporta) funciona exactamente como está escrito.

**Sobre imágenes:** el deck final no tiene ni una etiqueta `<img>`. Todo lo visual es
nativo (CSS + tipografía + barras). Para un deck de este perfil eso no es una carencia:
`design-guidelines.md` pide "un elemento visual por slide", no "una foto por slide", y
las barras/cifras cumplen ese rol.

### build

**Qué pide la skill** (`reference/build.md`): proponer nivel de animación y pedir
confirmación; copiar `template.html`; correr `apply-style-pack.mjs` y confirmar con
`check-style-pack.mjs`; poblar los patrones; insertar las `<section>`; actualizar
`<title>`, `lang` y footers; aplicar `design-guidelines.md`.

**Decisiones como usuario:**

| Pregunta | Decisión | Por qué |
|---|---|---|
| Nivel de animación | **LIGHT** | Tensión real con la doc: `deck-schema.md` asigna HEAVY como opción para "pitch decks cortos (menos de 10 slides) donde cada slide cuenta", y este deck tiene 7. Pero el perfil de la prueba pide la presentación más simple posible, y HEAVY exige animaciones SVG signature de `animations.md`. Elegí LIGHT y lo anoto como divergencia consciente. |
| Variantes de entrada | `r-rise` títulos, `r-left` listas/pasos, `r-wipe` barras, `r-scale` cifras, `r-mask` remates, `r-fade` texto largo | `build.md` §1 lo pide explícitamente ("revelar todo con el mismo fade-up es lo que hace que un deck se sienta mecánico"). Es un buen consejo y es accionable porque el template ya trae las clases. |
| `.hl` para énfasis | **descartado** | `design-guidelines.md` avisa que `.hl` es invisible cuando `--cs-primary` casi coincide con `--cs-black`. En `paper-white` son `#16181A` vs `#0A0B0C`: exactamente ese caso. La advertencia de la doc me ahorró poner un énfasis que no se vería. |
| Acento vermellón | 1 sola vez en todo el deck (el `$50` de la slide 06) | El pack dice "máximo una vez por slide, casi siempre en una cifra". Mi primera versión lo usaba 2 veces en la 03 y 2 en la 06; lo corregí en la ronda de audit. El precio de salida es el que mueve la factura de verdad, así que es la cifra que se gana el acento. |

Comandos, verbatim:

```
$ cp template.html examples/test-01-astra-basico/astra-flash.html
$ node scripts/apply-style-pack.mjs styles/paper-white.md examples/test-01-astra-basico/astra-flash.html
✓ Paper White aplicado a examples/test-01-astra-basico/astra-flash.html
  21 tokens sustituidos
  Google Fonts: sustituido
  Tokens estructurales preservados: 4/4
```

La línea "Tokens estructurales preservados: 4/4" es exactamente la garantía que
`styles/index.md` promete cuando prohíbe copiar el `:root` a mano. Se cumple y se ve.

### audit

**Qué pide la skill** (`reference/audit.md`): correr `audit.mjs`, `check-contrast.mjs`,
`check-reveal.mjs` y `check-overflow.mjs`; después `shoot.mjs` y **mirar los PNG**;
`doctor.mjs` como informativo. Una sola ronda de correcciones, acotada.

Los cuatro validadores pasaron a la primera. **Los tres defectos reales del deck los
encontré mirando las capturas, no con los scripts** — que es literalmente lo que
`audit.md` dice que va a pasar. La fase `shoot` se ganó su lugar en esta prueba.

Ronda única de correcciones (5 cambios en un batch, como manda la doc):

1. Barras de la slide 03 vacías: `.cb-bar` era hijo de un `<span>` no-grid, así que quedaba
   `display:inline` y `width` no aplicaba. **Bug mío, no de la skill.**
2. Mismo elemento: quité el gate `section[data-active="true"]` que copié de `counter-bars`
   (`components.md`). **Bug de la skill** — ver Hallazgo 1.
3. Acento vermellón usado 2 veces en la 03 y 2 en la 06 → 1 sola vez en todo el deck.
4. El `$` a `0.42em` sobre la línea base se leía como subíndice ("s10") → `vertical-align`.
5. La cabecera "Claude Fable 5.1" de la slide 05 se partía en dos líneas → columna 240→320px.

Después de las correcciones, los 5 validadores vuelven a pasar (salidas en la sección 4).

**Lo que miré y decidí no cambiar:** las slides 02, 05 y 06 dejan el tercio inferior
bastante vacío. `design-guidelines.md` lo trata como defecto ("alinear arriba deja el
tercio inferior vacío") y ofrece `.pad.mid`. No lo apliqué: en un deck de blanco literal
la respiración *es* el pack, y centrar solo algunas slides habría movido el título a
alturas distintas entre slides consecutivas, que se nota más al pasar de una a otra que
el hueco de abajo. Decisión discutible, anotada a propósito.

### export

**Qué pide la skill** (`reference/export.md`): PDF por impresión nativa, PPTX editable,
y avisar de las degradaciones del formato antes de generar.

- **PDF**: 7 páginas, estado final correcto en todas (reveals visibles, barras rellenas,
  contadores en su cifra real, sin chrome del reproductor). El camino
  `find-chrome.mjs` + `--print-to-pdf` funcionó sin configurar nada. Único reparo:
  **6,3 MB para 7 slides sin una sola imagen** (el grain del fondo se rasteriza).
- **PPTX**: se genera y abre, pero **30 elementos de texto en 4 de las 7 slides no viajan**
  — ver Hallazgo 2. La doc lo advierte de antemano; la severidad práctica es otra cosa.
- **`make-offline.mjs`**: no corrido (opcional, y el deck de prueba no se presenta en sala).
- **Speaker notes**: no pedidas por el usuario simulado, y `export.md` dice "solo si el
  usuario las pide". No generadas, a propósito.

---

## 3. Fuentes

Todas verificadas con WebSearch/WebFetch durante la prueba. **Cada cifra que aparece en
una slide sale de esta lista**; el deck además imprime la fuente al pie de cada slide con
datos.

| URL | Qué dato salió de acá | Dónde se usa |
|---|---|---|
| https://en.wikipedia.org/wiki/GPT-6_Astra | Preview limitada **3 sep 2026**; release público estable **4 sep 2026**; "state of the art in coding, math, and navigating computers and web browsers"; capacidades de ciberseguridad limitadas a "a group of testers"; Brockman y la afirmación de AGI | Slide 02 |
| https://9to5mac.com/2026/09/04/openai-releasing-major-upgrade-to-chatgpt-and-codex-with-gpt-6-astra-details-here/ | Rollout a **ChatGPT Plus, Pro, Business y Enterprise**; computer use "nearly 2x faster"; FrontierMath Tier 4 98%, ARC-AGI-3 99.9%, ExploitBench 100% | Slide 02 (rollout) |
| https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained | **OSWorld 2.0: Astra 72.6% / Sol 65.7%**; **ScreenSpot-Pro: 92.7% / 76.9%**; **Humanity's Last Exam: Astra 57.2% / Fable 5.1 65.0%**; contexto "1M-token"; **$10 in / $50 out** | Slides 03, 05, 06 |
| https://www.mindstudio.ai/blog/gpt-6-astra-benchmarks-analysis | **Artificial Analysis Intelligence Index: Astra 61 / Fable 5.1 66**; **Coding Agent Index: 67 / 70**; áreas donde Astra pierde (GDPval, tool-use bancario, long-context) | Slide 05 |
| https://llm-stats.com/models/gpt-6-astra | **$10 input / $1 cached / $50 output** por millón; contexto 1.1M; max output 128K; knowledge cutoff abril 2026; released 4 sep 2026 | Slide 06 |
| https://www.cloudzero.com/blog/gpt-6-pricing/ | Corroboración de $10/$50, batch/flex a 50%, fast mode 2x, recargo por encima de 272K tokens de input, y el "2.5x GPT-5.6 Sol" | Slide 06 (el "2.5x" del título) |
| https://www.aljazeera.com/economy/2026/9/4/openai-unveils-gpt-6-astra-amid-rising-scrutiny-and-safety | Contexto de escrutinio: incidente de Hugging Face de julio 2026, críticas de Sanders / Walsh / Yampolskiy, valuación de $852 mil millones | **No usado en slides** (research de contexto para el arco) |

**Fuentes que NO se pudieron leer** (documentado en vez de omitido):

- `https://openai.com/index/gpt-6-astra/` → **HTTP 403 Forbidden** a WebFetch. Es la fuente
  primaria; no pude citarla de primera mano.
- `https://www.axios.com/2026/09/03/openai-astra-gpt-6-agi-brockman` → **HTTP 403 Forbidden**.

**Discrepancias entre fuentes, resueltas a la vista:**

- **Contexto: 1M vs 1.1M.** Vellum dice "1M-token context model", llm-stats dice "1.1M".
  En la slide 06 puse **1M**, que es la cifra redonda con la que el ecosistema se refiere
  al modelo. Si esto fuera un deck real de producción, la nota al pie debería decir "≈1M".
- **FrontierMath Tier 4: 97.6% (Vellum) vs 98% (9to5Mac).** No lo puse en ninguna slide
  precisamente porque no se pudo reconciliar contra la fuente primaria.

---

## 4. Salidas de validación (verbatim)

Estado final del deck, después de la ronda de correcciones.

### `apply-style-pack.mjs`
```
✓ Paper White aplicado a examples/test-01-astra-basico/astra-flash.html
  21 tokens sustituidos
  Google Fonts: sustituido
  Tokens estructurales preservados: 4/4
```

### `check-style-pack.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ ink de cuerpo vs fondo   10.49:1  (min 7)
  ✓ titulo vs fondo          19.70:1  (min 7)
  ✓ texto atenuado vs fondo  4.88:1  (min 3.5)
  ✓ primario vs fondo        17.80:1  (min 3)
  ✓ acento vs fondo          4.27:1  (min 3)
  ✓ ink de cuerpo vs card    10.12:1  (min 7)
  ✓ primario vs acento       4.17:1  (min 1.7)

✓ contraste OK
```

### `audit.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ contraste y paleta (check-style-pack.mjs)
  ✓ balance de <section> (7/7)
  ✓ balance de <div> (84/84)
  ✓ sin em-dash en el contenido
  ✓ sin punto final en h1/h2/h3/.subtitle
  ✓ footers numerados 01..07 sin huecos ni duplicados
  ✓ slides estáticas (data-steps="1") sin .reveal adentro
  ✓ <title> actualizado ("GPT-6 Astra en 5 minutos")
  ⚠ 1 asset(s) pendiente(s), aceptados explícitamente en la fase assets
      slide 03 — captura real de Astra manejando un navegador, sigue con placeholder

✓ audit OK · 1 aviso(s)
```

### `check-reveal.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ Todo .reveal revelado queda con transform/filter en "none" — la cascada de .is-on gana contra cualquier variante r-*.
```

### `check-overflow.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ Nada desborda el canvas, se trunca en una línea, ni se superpone con otro texto.
```

### `check-contrast.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ los 77 textos medidos pasan el umbral WCAG AA sobre su fondo real.

  ⚠ 11 texto(s) sobre gradiente, imagen o background-clip NO se midieron:
    su fondo no es un color plano, asi que un solo ratio no lo describiria.
    Revisarlos a ojo (tipicamente el cover y el cierre).
```

### `doctor.mjs`
```
examples/test-01-astra-basico/astra-flash.html

  ✓ generado con la versión 1.4.0, al día con el engine actual (1.4.0).
```

### `shoot.mjs`
```
examples/test-01-astra-basico/astra-flash.html — 7 de 7 slide(s) a .../.slizdeck-shots

  ✓ slide 01 → astra-flash-01.png
  ✓ slide 02 → astra-flash-02.png
  ✓ slide 03 → astra-flash-03.png
  ✓ slide 04 → astra-flash-04.png
  ✓ slide 05 → astra-flash-05.png
  ✓ slide 06 → astra-flash-06.png
  ✓ slide 07 → astra-flash-07.png

✓ 7 PNG en .../.slizdeck-shots
```

Exit code 0, pero **la captura de la slide 02 salió vacía** en esa corrida (solo el título,
indicador de paso en "1 /3"). Corridas posteriores sobre el mismo deck sin tocar nada la
renderizaron correcta. Ver Hallazgo 3, que incluye la tabla de reproducción.

### Export PDF (Chrome headless)
```
$ "$(node scripts/lib/find-chrome.mjs)" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf=".../astra-flash.pdf" --virtual-time-budget=5000 "file://.../astra-flash.html"

[ERROR:ui/display/mac/cv_display_link_mac.mm:195] CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670
[ERROR:ui/display/mac/cv_display_link_mac.mm:195] CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670
[ERROR:ui/display/mac/cv_display_link_mac.mm:195] CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670
[ERROR:ui/display/mac/cv_display_link_mac.mm:195] CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670
6283952 bytes written to file .../astra-flash.pdf
```
Exit 0. Los `CVDisplayLink` son ruido conocido de Chrome headless en macOS, no afectan al
PDF. Las 7 páginas se verificaron a ojo: correctas.

### Export PPTX
```
$ node scripts/export-pptx.mjs examples/test-01-astra-basico/astra-flash.html examples/test-01-astra-basico/astra-flash.pptx

✓ examples/test-01-astra-basico/astra-flash.pptx · 7 slides · Calibri/Calibri
  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).

⚠ 30 elemento(s) de texto no viajaron al .pptx, en 4 slide(s).
  Son patrones de layout fuera del set que el export reconoce (ver cabecera de este script).

  slide 02 — 7 elemento(s):
    <div.tl-when>  "03 sep 2026"
    <div.tl-what>  "Preview limitada"
    <div.tl-who>  "Solo un grupo cerrado de organizaciones de confi"
    <div.tl-when>  "04 sep 2026"
    <div.tl-what>  "Usuarios de pago"
    <div.tl-who>  "Plus, Pro, Business y Enterprise, en ese orden."
    … y 1 mas

  slide 03 — 13 elemento(s):
    <div.cb-name>  "OSWorld 2.0"
    <div.cb-note>  "Tareas reales en un escritorio, de principio a f"
    <span.cb-model>  "Astra"
    <span.cb-val>  "72,6%"
    <span.cb-model>  "GPT-5.6 Sol"
    <span.cb-val>  "65,7%"
    … y 7 mas

  slide 05 — 9 elemento(s):
    <span>  "Medición"
    <span>  "Astra"
    <span>  "Claude Fable 5.1"
    <span.vs-sub>  "Artificial Analysis, índice general"
    <span.vs-sub>  "Artificial Analysis, agentes de código"
    <span.vs-sub>  "Con herramientas"
    … y 3 mas

  slide 06 — 1 elemento(s):
    <div.fuente.reveal.r-fade>  "Fuentes: CloudZero, precios GPT-6 Astra · llm-st"

  Opciones: reescribir esas slides con un patron soportado, sumar soporte al script,
  o completar el contenido a mano en PowerPoint despues de exportar.
```
Exit code **0**. Comprobado sobre el `.pptx` generado: `ppt/slides/slide3.xml` contiene
el título "Lo nuevo es que usa la computadora" pero **ninguna** de las cadenas "OSWorld"
ni "72,6%". El archivo se abre; la slide está vacía de datos.

### `check-docs.mjs` (canario de drift del repo, corrido de paso)
```
  ✓ los 15 scripts estan en SKILL.md y README.md
  ✓ los 16 archivos de reference/ estan en la tabla de SKILL.md
  ✓ los links relativos de 29 documentos resuelven
  ✓ DESIGN.md y design.json coinciden en los colores clave
  ✓ los 5 style packs evitan las fuentes que check-style-pack.mjs rechaza

✓ la documentacion sigue alineada con el repo
```

---

## 5. Hallazgos

Ordenados por severidad. Ninguno se corrigió en archivos de la skill (regla de la prueba);
todo lo que sigue es reporte.

### 🔴 1. El patrón `counter-bars` de `components.md` produce barras vacías en el PDF

`reference/components.md`, sección `### counter-bars` (líneas ~839-905). El CSS del patrón es:

```css
section[data-active="true"] .tk-fill.is-on { width: var(--w, 0%); }
```

Dos problemas independientes en una sola línea:

1. **`.tk-fill` nunca recibe `.is-on`.** En el HTML del propio patrón, `.reveal` está en
   `.tk-row`, no en `.tk-fill`, y tanto `applyStep()` como `finalizeForPrint()`
   (`template.html` ~1026-1036) agregan `.is-on` **solo a elementos `.reveal`**. El
   selector no matchea nunca: la barra se queda en `width: 0%` siempre, también en vivo.
   El patrón `Progreso / proporción` de `media-and-data.md` lo hace bien
   (`.reveal.is-on .prop .fill`), así que hay dos patrones vecinos con criterios opuestos.
2. **El gate `section[data-active="true"]` rompe el PDF.** `data-active` lo pone
   `syncActive()` **solo en la slide activa**, mientras que al imprimir se revelan *todas*.
   Resultado: en el PDF, cualquier relleno gateado así queda vacío en 6 de 7 páginas.

**Reproducido en esta prueba.** Restauré el gate sobre mi propia barra y reimprimí:
las etiquetas y los porcentajes salen, las barras salen vacías. Es una pérdida silenciosa
de información — la slide sigue "pareciendo bien" y ningún validador lo marca
(`check-overflow` mide texto, `check-contrast` mide texto, `audit` lee HTML estático).

**Sugerencia:** cambiar el selector del patrón a `.reveal.is-on .tk-fill { width: var(--w) }`
y quitar el gate de `data-active` de todos los patrones cuyo objetivo sea una propiedad que
tenga que sobrevivir a la impresión. Ningún deck de `examples/` usa `counter-bars`
(`grep -c tk-fill` da 0 en los dos), así que el bug no está cubierto por el CI.

### 🔴 2. `export-pptx.mjs` sale con exit 0 aunque pierda el 100% de los datos de una slide

Con un deck de 7 slides, **30 elementos de texto en 4 slides** no viajaron. En la slide 03
el `.pptx` conserva solo el título: los dos benchmarks, los cuatro modelos y los cuatro
porcentajes desaparecieron. Es la slide entera.

`reference/export.md` lo documenta ("si el wireframe usa un patrón de layout nuevo... ese
contenido no aparece en el `.pptx`, sin aviso") y el script sí avisa bien y en detalle,
así que no es un fallo oculto. Lo que sí llama la atención es la **severidad frente al
exit code**: el script termina en 0 y dice "✓ ... Editable en PowerPoint y Google Slides",
lo cual, en un pipeline automatizado o para un modelo que solo lee el exit code, se lee
como éxito.

Además, el set de clases reconocidas es **más estrecho de lo que sugiere el flujo**: mi
slide 06 usa `.metricas` (fila de métricas de `media-and-data.md`, explícitamente listada
como soportada en la cabecera de `export.md`) y aun así perdió el `.fuente`; las slides 02
y 03 usan patrones que derivé de `components.md`, que es justo lo que `SKILL.md` invita a
hacer ("El template es punto de partida, no dogma").

**Sugerencia:** exit code distinto de 0 (o un flag `--strict`) cuando la pérdida supere
un umbral, y bajar el "✓" a "⚠" en el resumen cuando haya elementos caídos.

### 🟠 3. `shoot.mjs` es no determinista: una slide puede salir vacía

En la corrida completa de las 7 slides, `astra-flash-02.png` salió con solo el título y el
indicador de paso en `1 /3`. Corridas posteriores sobre el mismo deck, **sin tocar un solo
byte del HTML**, la renderizaron completa con el indicador en `3 /3`.

Reproducción medida (el PNG vacío pesa 38.060 bytes, el completo 89.562 — el tamaño sirve
de oráculo barato):

| Corrida | Slides pedidas | Resultado slide 02 |
|---|---|---|
| 1 | `1..7` (todas) | **vacía** (38.060 B) |
| 2 | `--slides=2` | completa (89.562 B) |
| 3 | `--slides=2` | completa |
| 4 | `--slides=2,4,7` | **vacía** (38.060 B) |
| 5-8 | `--slides=2` ×4 | completa ×4 |
| 9 | `--slides=1,2,3` | completa |
| 10-12 | `--slides=2,4,7` ×3 | completa ×3 |

**2 fallos en 12 corridas del mismo archivo sin modificar.** No depende del set de slides
pedido ni de la posición en el batch: es una carrera, sensible a la carga de la máquina.

Causa aparente: carrera entre dos caminos que hacen cosas opuestas, ambos en doble
`requestAnimationFrame`:

- el harness de `shoot.mjs` (líneas ~108-118) dispara `beforeprint` → `finalizeForPrint()`
  agrega `.is-on` a todos los `.reveal`;
- la navegación por hash (`file://...#2`) dispara el cambio de slide del template →
  `resetAndEnter()` (`template.html` ~960-966) **quita** todos los `.is-on` y vuelve al
  paso 1, también tras un doble `rAF`.

Si `resetAndEnter` gana, la captura sale en el paso 1 en vez del final.

**Por qué importa más de lo que parece:** `shoot.mjs` es, por diseño de la propia skill, el
único paso que juzga el deck con criterio. Una captura vacía le dice al modelo "esta slide
está rota" cuando no lo está. En esta prueba estuve a punto de reescribir una slide sana:
me salvó comprobar la reproducibilidad antes de tocar nada. Un agente con menos paciencia
"arregla" lo que no está roto.

**Sugerencia:** en vez de disparar `beforeprint` y confiar en el orden, esperar a que el
deck termine de entrar en la slide (por ejemplo, reejecutar `finalizeForPrint` después de
que se estabilice `data-current-step`, o disparar la finalización desde un `setTimeout`
posterior al `hashchange` en vez de desde `DOMContentLoaded`). El flag
`data-slizdeck-shot="ready"` ya existe pero Chrome no lo espera: usa
`--virtual-time-budget` a ciegas.

### 🟡 4. `SKILL.md` cita dos clases CSS que no existen en ningún lado

`SKILL.md` línea 112 (regla de voz 2):

> **Sí llevan punto** los párrafos de cuerpo (`<p>`), las quotes y los captions
> (`.stat-caption`, `.stat-source`).

`grep -rn "stat-caption\|stat-source"` sobre `template.html`, `reference/`, `styles/`,
`scripts/`, `SKILL.md` y `README.md` devuelve **una sola línea: esa misma**. Las clases no
están definidas en el template ni aparecen en `components.md` ni en `media-and-data.md`.

Consecuencia concreta: yo necesitaba una línea de fuente al pie de las slides con cifras
(literalmente el caso de uso que `.stat-source` sugiere), fui a buscar la clase, no existe,
y tuve que inventar `.fuente` en mi propio deck. Eso significa que cada deck se inventa su
propia clase de caption y ni `export-pptx.mjs` ni ningún validador pueden reconocerla como
un patrón conocido — que es exactamente lo que pasó (Hallazgo 2, slide 06).

Dado que el deck es la unidad de citación de datos y `assets.md` insiste en no inventar
cifras, **una clase de "fuente/caption" en el template parece que debería existir**, no
solo mencionarse.

### 🟡 5. `init.md` manda guardar un `design-tokens.json` que nada lee ni escribe

`reference/init.md`, último párrafo antes del cierre:

> Guardar `design-tokens.json` en el directorio del proyecto (no dentro de la skill) para
> reutilizarlo en futuros decks de la misma marca.

Pero ningún script lo escribe (`apply-style-pack.mjs` edita el HTML directamente) ni lo lee
(`grep -rn "design-tokens.json" scripts/` solo aparece dentro de un comentario de
`doctor.mjs`, y para decir que un deck **no** es un artefacto estructurado). Existe
`reference/design-tokens-schema.md` describiendo su forma, así que hay documentación de un
formato sin productor ni consumidor.

Como usuario simulado decidí no escribirlo: habría creado un archivo que ninguna fase
posterior mira. Si la intención es que el agente lo genere a mano al terminar `init`,
convendría decirlo así ("escribí este JSON con los tokens elegidos") y que `build` lo lea;
si es solo para el camino (a), convendría acotarlo a ese caso.

### 🟡 6. `data-counter` no acepta decimales, y muchos benchmarks lo son

`reference/media-and-data.md` lo dice ("`data-counter` acepta enteros"), así que es una
limitación documentada, no un bug. Pero muerde en el caso más común de un deck de datos:
de las 12 cifras del deck, **8 tienen decimal** (72,6% · 65,7% · 92,7% · 76,9% · 57,2% ·
65,0% ...) y ninguna pudo usar el contador animado. El deck termina con contador solo en
`$10` y `$50`, o sea el sistema de animación de cifras del template quedó al 17% de uso
en un deck cuyo argumento entero son cifras.

No es bloqueante y hay workaround (texto plano). Vale como señal de producto.

### 🟢 7. Tensión entre `deck-schema.md` y el perfil "deck corto"

`deck-schema.md` asigna HEAVY a "pitch decks cortos (menos de 10 slides) donde cada slide
cuenta". Un deck de 7 slides para una charla relámpago de 5 minutos cumple esa condición
al pie de la letra, pero HEAVY es exactamente lo contrario de lo que un flash talk necesita.
La regla está redactada en función del **número de slides**, cuando la variable real es el
tiempo de exposición por slide. Sugerencia menor de redacción: acotar HEAVY a "pitch decks
cortos y de alto impacto", no a cualquier deck corto.

### 🟢 8. Fricción menor: el default del template no es el default de la skill

`template.html` viene con la paleta verde/azul y con **Newsreader + IBM Plex Sans**, dos
fuentes que están en la lista negra de `init.md` ("Nunca usar ... IBM Plex ... Newsreader").
No es un bug (el flujo obliga a correr `apply-style-pack.mjs` inmediatamente después de
copiar, y ahí desaparecen), pero significa que un deck copiado del template y no procesado
falla la propia regla de la skill. Un `git grep` desprevenido o un agente que se salte el
paso 2.1 de `build.md` hereda fuentes prohibidas.

---

## 6. Lo que funcionó bien

Sin esto el informe sería deshonesto: la mayor parte del flujo se sostuvo.

- **La fase `assets` justifica su existencia.** Obligar a resolver cada ítem con una de tres
  respuestas explícitas me hizo tomar tres decisiones de diseño (sin foto en la cover, sin
  logos de terceros, placeholder aceptado en la 03) que de otro modo habría dejado implícitas.
  Y el circuito completo `assets` marca → `build` inserta el comentario → `audit` lo reporta
  como aviso (no como fallo) funciona **exacto** como está escrito.
- **`apply-style-pack.mjs` cumple la promesa que la doc usa para prohibir el copy-paste.**
  "Tokens estructurales preservados: 4/4" es verificable y visible.
- **`audit.md` predice correctamente sus propios límites.** Dice que los defectos de
  jerarquía, peso de color y composición solo se ven mirando las capturas — y en esta
  prueba los tres defectos reales del deck salieron de mirar los PNG, con los cinco
  validadores en verde. Es raro y valioso que una doc sea tan precisa sobre lo que su
  herramienta *no* puede hacer.
- **Los avisos de `design-guidelines.md` son accionables, no genéricos.** El de `.hl`
  invisible cuando `--cs-primary ≈ --cs-black` me ahorró poner un énfasis que no se vería
  en `paper-white`, y la tabla de longitud→clase para `.ts-title` me hizo elegir una frase
  de 14 caracteres en vez de una de 30 que se habría partido en dos líneas.
- **`check-contrast.mjs` no miente sobre lo que no puede medir.** Reporta 11 textos sobre
  gradiente/`background-clip` como *no medidos* en vez de darlos por buenos. Correcto.
- **`export-pptx.mjs` avisa con nombre y clase de cada elemento perdido.** El problema es
  la severidad y el exit code (Hallazgo 2), no la transparencia: el reporte es detallado.
- **El PDF salió perfecto**, incluidos los estados finales, sin configurar Chrome a mano.
- **La paleta pasó todos los umbrales sin ajustes.** Cero iteraciones de contraste en un
  deck con acento vermellón sobre blanco.
