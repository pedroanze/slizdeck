# Prueba end-to-end de slizdeck · CASO 3 "avanzado"

Bitácora de una ejecución completa de la Agent Skill `slizdeck` (v1.4.0) sobre un caso real y
exigente, hecha por un agente que además hace de usuario simulado en los puntos donde el flujo
se bloquea esperando confirmación humana.

**Entregables de esta carpeta**

| Archivo | Qué es |
|---|---|
| `tesis-frontera-modelos.html` | El deck. 18 `<section>` (1 standby + 17 numeradas), autónomo, sin dependencias externas |
| `tesis-frontera-modelos.pdf` | Export PDF por impresión nativa de Chrome headless, 18 páginas |
| `tesis-frontera-modelos.pptx` | Export PPTX editable, 18 slides (con pérdidas importantes, ver fase export) |
| `.slizdeck-shots/` | 18 PNG 1920×1080 generados por `shoot.mjs` para la revisión visual |
| `README.md` | Este documento |

---

## 1. Caso y perfil

| | |
|---|---|
| **Tema** | Una tesis propia sobre los modelos de frontera y cómo evoluciona la IA en los próximos años |
| **Tipo** | Charla de tesis, 35-40 min |
| **Público** | Audiencia sofisticada: investigadores, inversores técnicos, líderes de producto |
| **Tamaño pedido** | 16-18 slides |
| **Style pack asignado** | `editorial` (obligatorio por el encargo) |
| **Fecha simulada** | 2026-09-06 |

**Qué se estaba probando, y por qué este caso.** Es el caso diseñado para estresar tres cosas
que los casos fáciles no tocan:

1. **`reference/deck-schema.md` con un arco que no está en su tabla.** Los arcos documentados
   son para pitch, demo, recap, workshop y "talk" de 8-12 slides. Una charla de tesis de 40 min
   con 17 slides no encaja en ninguno.
2. **Gráficas de serie temporal y curvas.** El encargo pedía explícitamente comprobar si
   `components.md` y `media-and-data.md` traen un patrón para esto. **No lo traen** (ver
   hallazgo H-01), así que el deck lleva cinco SVG construidos a mano sobre los tokens del
   design system.
3. **Citas atribuidas a personas reales y cifras con fuente.** El riesgo principal del caso: una
   sola cita inventada invalida la prueba. Se trató con paranoia deliberada (ver §4).

Además: nivel de animación **HEAVY** en el límite exacto que permite la regla fija del schema
(18 secciones), para ver si `reference/animations.md` sostiene la técnica de dibujo de path.

---

## 2. La tesis defendida

> ### La frontera cambió de moneda
>
> Entre 2020 y 2024 la capacidad se compraba con **cómputo de pre-entrenamiento**. Desde abril de
> 2024 la curva de capacidad **se acelera** justo cuando datos, energía y capex se vuelven
> restricciones vinculantes. Esa aceleración no sale del pre-entrenamiento: sale del razonamiento,
> que es **cómputo de inferencia**.

Tres corolarios, cada uno con evidencia:

| # | Corolario | Evidencia que lo sostiene |
|---|---|---|
| 01 | El precio de una capacidad fija se desploma mientras el precio de la frontera del día sube. No es contradicción: son dos mercados distintos. | Nivel GPT-4 en MMLU: 37,50 USD/M (mar 2023) → 0,18 USD/M (feb 2025). En paralelo, el buque insignia de OpenAI pasó de 4/20 USD (GPT-5.6 Sol) a 10/50 USD (GPT-6 Astra), 2,5x en una generación |
| 02 | La ventaja de los pesos cerrados se comprimió a meses, no a años. Un foso de capex no protege una frontera que se gana en inferencia. | Desde ene 2026 los open-weight van 4 meses / 8 puntos ECI por detrás de la frontera cerrada (Epoch AI) |
| 03 | Hacia 2030 el límite que muerde primero es la red eléctrica, no el corpus de texto. | El mayor entrenamiento individual de 2030 consumiría 4-16 GW (Epoch AI); el stock de texto público humano se agota en la ventana 2026-2032, con datos sintéticos y eficiencia como salidas (Villalobos et al.) |

**El pivote empírico de la tesis** es el quiebre de pendiente del Epoch Capabilities Index: de
**8,3 a 15,5 puntos/año**, con breakpoint el **8 de abril de 2024** (R² = 0,9653). Eso es lo que
convierte "el escalado se está encareciendo" en un argumento y no en una queja: la capacidad
aceleró *justo cuando* el pre-entrenamiento dejó de ser la palanca barata. Las dos citas
atribuidas (Amodei y Sutskever, §4) fechan el cambio de objeto de escalado en el mismo momento,
desde dentro de los laboratorios.

**Predicciones falsables** (slide 16), para que la tesis sea defendible y no retórica:
falsa si en 2030 el límite operativo declarado sigue siendo la disponibilidad de datos; falsa si
la brecha ECI abierta/cerrada supera de forma sostenida los 8 meses; falsa en cuanto un modelo de
frontera se lance por debajo de 10 USD/M de entrada sin tarifa promocional.

---

## 3. Bitácora por fase

Entré por `SKILL.md` y de ahí a los archivos de `reference/` que indica cada fase, en el orden
que manda el ruteo para "deck nuevo, sin más contexto": init → brief → assets → build → audit →
export. Las decisiones marcadas **[USUARIO SIMULADO]** son puntos donde el flujo real se
bloquearía esperando a una persona.

### 3.1 init (`reference/init.md`)

`init.md` plantea tres caminos. No hay `design-tokens.json` en el directorio y el pack venía
impuesto por el encargo, así que aplica el camino **(b)**: elegir de la tabla de `styles/index.md`.

- **Pack: `editorial`.** Coincide además con lo que la propia tabla recomienda: *"Charlas con
  tesis y argumento, donde el texto respira"*.
- **[USUARIO SIMULADO] Tipografía: el default del pack (Young Serif + Chivo)**, no las dos
  alternativas curadas (`spectral`, `caslon`). Motivo: en este deck la jerarquía la cargan las
  cifras y las gráficas, no los grosores del titular; y Chivo trae pesos 300-800, que es lo que
  hace falta para etiquetas de eje, valores y notas al pie densas. Young Serif de un solo peso
  fuerza jerarquía por escala, que es exactamente lo que pide el pack.
- **Sin colores de marca.** No hay marca: es una charla personal. El pack se usa tal cual.

`init.md` es explícito en que esta fase **decide, no aplica** (el archivo del deck todavía no
existe). Se respetó: el pack se aplicó en `build`.

### 3.2 brief (`reference/brief.md`)

Brief recogido en una ronda (tema, público, tipo, duración) porque el encargo ya lo traía todo.

**Research.** Investigación real en internet antes de proponer nada, como manda el paso 2. Se
buscaron y se leyeron fuentes primarias (Epoch AI, arXiv, anthropic.com, darioamodei.com,
dwarkesh.com) en vez de quedarse con el resumen del buscador: los resúmenes de búsqueda mezclaban
cifras de varias fuentes y en un par de casos contradecían al primario. Detalle completo en §4.

**Arco narrativo.** Aquí aparece el primer roce con la doc (hallazgo **H-02**). La tabla de
`reference/deck-schema.md` ofrece para "Talk / charla" el arco *Historia → giro → insight →
invitación*, con 8-12 slides orientativas. Ese arco es de charla narrativa, no de charla de
tesis: no tiene sitio donde poner la evidencia, ni las objeciones, ni las condiciones de
falsación. Y el tamaño pedido (16-18) queda fuera del rango.

**[USUARIO SIMULADO] Decisión:** usar un arco de tesis en cuatro capítulos, declarado como
extensión del arco "talk", no como uno de los de la tabla:

```
tesis enunciada → 01 la moneda vieja → 02 el quiebre → 03 la factura → 04 la evidencia → predicciones falsables → invitación
```

**Porqué:** una charla de tesis se sostiene si el público puede *desmentirla*. El arco de la tabla
llega al insight y se va; este llega al insight, lo somete a sus tres límites (capítulo 03), lo
contrasta con lo que ya se ve en el mercado (capítulo 04) y cierra con predicciones falsables. La
tesis se enuncia en la slide 02, no se guarda para el final: con público sofisticado, esconder la
conclusión durante 30 minutos es una falta de respeto al tiempo de la sala.

**Wireframe aprobado (18 secciones, 17 numeradas):**

```
SLIDE 00 · Standby · pantalla-de-inicio            (grad, sin número de footer)
SLIDE 01 · Portada · cover-gradient                (grad, estática)
SLIDE 02 · La tesis · titulo + lead + claims numeradas
SLIDE 03 · CAP 01 "La moneda vieja" · transition   (grad, estática)
SLIDE 04 · Cómputo 4-5x/año · SVG serie temporal log        [PATRÓN NUEVO]
SLIDE 05 · Precio por capacidad fija · SVG doble serie log  [PATRÓN NUEVO]
SLIDE 06 · CAP 02 "El quiebre" · transition        (grad, estática)
SLIDE 07 · La aceleración ECI · SVG regresión 2 segmentos   [PATRÓN NUEVO · HEAVY]
SLIDE 08 · Las dos citas · quote-2col                       [PATRÓN NUEVO]
SLIDE 09 · CAP 03 "La factura" · transition        (grad, estática)
SLIDE 10 · Tres relojes · card-grid-3col-numbered
SLIDE 11 · Energía · SVG cono de proyección log             [PATRÓN NUEVO · HEAVY]
SLIDE 12 · Capex 2026 · barras con rango + counter          [PATRÓN NUEVO]
SLIDE 13 · CAP 04 "La evidencia" · transition      (grad, estática)
SLIDE 14 · El precio se dio vuelta · pq-card-2col
SLIDE 15 · Brecha abierto/cerrado · lollipop ECI            [PATRÓN NUEVO]
SLIDE 16 · Tres predicciones falsables · card-grid-3col-numbered
SLIDE 17 · Cierre · cover-gradient                 (grad, estática)
```

Siete de diecisiete slides usan un patrón que **no existe** en `components.md` ni en
`media-and-data.md`. Ese es el hallazgo H-01 y condiciona todo lo demás, incluido el export a
PPTX.

**[USUARIO SIMULADO] Incluir la pantalla de standby** (documentada en `media-and-data.md` →
"Pantalla de inicio"), aunque complique la numeración. Motivo: es lo que hace una charla de
conferencia real, y de paso prueba la convención de "esta slide no lleva número de footer" contra
el validador de numeración de `audit.mjs`. Resultado: `audit.mjs` la maneja bien (cuenta
`<span class="num">`, no `<section>`), footers 01..17 sin huecos.

### 3.3 assets (`reference/assets.md`)

Fase que el encargo prohibía saltar. Recorrido el wireframe slide por slide con los criterios del
paso 1:

| Slide | ¿Necesita algo? | Resolución |
|---|---|---|
| 00 Standby | Imagen a sangre 1920×1080 (abre el deck, necesita peso visual) | **[USUARIO SIMULADO] Opción 2: seguir sin ella** |
| 01 Portada | Podría llevar imagen; el pack editorial no la pide | Sin imagen: el gradiente + Young Serif a 168px ya carga el peso |
| 08 Citas | Retratos de Sutskever y Amodei (presenta personas) | **[USUARIO SIMULADO] Opción 2: seguir sin ellos** |
| 04,05,07,11,12,15 | **Dato real** en cada cifra | Resueltas todas con fuente primaria, cero placeholders (§4) |
| 02,03,06,09,10,13,14,16,17 | Nada: texto/argumento, o el visual ya es la propia gráfica | Sin pedido |
| Logo | El deck no tiene marca ni organización | Footer sin logo, solo `Tesis de frontera · sep 2026 · NN` |

**Porqué de las dos decisiones de "seguir sin él":** la regla 6 del encargo prohíbe hotlinkear
fotos e inventar rutas. Un retrato de una persona real exige un archivo con licencia que aquí no
existe, y una foto de stock de "un datacenter" sería justo el cliché que
`design-guidelines.md` prohíbe. Ambas se marcaron con la convención de la skill, inmediatamente
antes del `<section>` afectado:

```html
<!-- SLIZDECK-ASSET-PENDING: slide 08 — retratos de Ilya Sutskever y Dario Amodei (recuadro, 1:1).
     Decision del usuario simulado: seguir sin ellos. No se hotlinkean fotos de terceros y la
     slide se sostiene solo con tipografia, que es lo que el pack editorial hace bien. -->
```

`audit.mjs` los reporta después como aviso (⚠), no como fallo, que es exactamente el
comportamiento documentado. **Nota de calidad:** la slide 08 se diseñó para que se sostenga sin
los retratos (dos citas grandes en Young Serif con filete verde), no para dejar un hueco.

**Nombre del presentador.** El encargo no daba uno. **[USUARIO SIMULADO]** decidí **no inventar
una persona**: el footer usa `Tesis de frontera · sep 2026 · NN`. Inventar un ponente en un deck
lleno de citas atribuidas a personas reales habría sido justo el tipo de contaminación que la
regla 4 quiere evitar.

### 3.4 build (`reference/build.md`)

**Nivel de animación: HEAVY, con 2 slides HEAVY reales (07 y 11).** Y aquí está el hallazgo
**H-03**: `reference/deck-schema.md` se contradice consigo mismo en la misma tabla.

- La columna "Cuándo" del nivel HEAVY dice: *"Pitch decks cortos (menos de 10 slides)"*.
- Dos líneas más abajo, las "Reglas fijas (no negociables)" dicen: *"nunca HEAVY en más de 18
  slides sin pedido explícito del usuario"*.

Para un deck de 17 slides numeradas la primera lo prohíbe y la segunda lo permite.
**[USUARIO SIMULADO] Decisión: HEAVY.** Porqué: la regla marcada explícitamente como "fija" y "no
negociable" tiene que ganarle a una orientación de la columna descriptiva, y la propia regla acota
el riesgo con la otra restricción que sí se respetó (*"máximo 1-2 slides HEAVY por deck, nunca
todo el deck"*): solo las slides 07 y 11 llevan técnica de `animations.md`; el resto es LIGHT.

Leí `reference/animations.md` antes de tocar HEAVY, y en concreto *SVG path drawing* y *Cuidados
críticos*. Los dos gotchas documentados eran reales y me habrían costado el bug:

- **Gotcha #1 (`transform: none !important` en SVG).** Sin él, el `translateY(16px)` de `.reveal`
  desplaza el path entero y las coordenadas del gráfico dejan de coincidir con los ejes.
- **Gotcha de specificity wars.** Reproducido en la práctica: mi regla `.draw.reveal { opacity: 0 }`
  se declara *después* de `.reveal.is-on { opacity: 1 }` del template, misma especificidad → gana la
  mía y el path nunca aparece. Hizo falta declarar `.draw.reveal.is-on` (tres clases). Es
  exactamente el bug que `check-reveal.mjs` está hecho para cazar, y con la regla puesta pasa limpio.
- **Gotcha adicional aplicado por mi cuenta:** `.reveal.is-on { transform: none }` pisa cualquier
  `translate(-50%,-50%)` de centrado. En el lollipop de la slide 15 los puntos se centran con
  `margin-left/-top` en vez de `transform`, para no depender de una guerra de especificidad.

**Generación.** El pack se aplicó con el script, nunca copiando el `:root`:

```
$ node scripts/apply-style-pack.mjs styles/editorial.md examples/test-03-tesis-frontera/tesis-frontera-modelos.html
✓ Editorial aplicado a examples/test-03-tesis-frontera/tesis-frontera-modelos.html
  20 tokens sustituidos
  Google Fonts: sustituido
  Tokens estructurales preservados: 4/4
```

**Variedad de entrada aplicada** (`build.md` §1): `r-rise` en titulares, `r-fade` en texto largo
y bandas SVG, `r-left` en listas y cards, `r-scale` en cifras, `r-wipe` en las barras de capex,
`r-blur` en las citas. Ninguna slide revela todo con el mismo `fade-up`.

**Dos overrides de CSS que hubo que escribir en el deck** (documentados en el propio archivo, y
reportados como hallazgos H-04 y H-05):

```css
/* H-04: Young Serif solo trae el peso 400 y styles/editorial.md pide no forzar bold
   en los titulos. El template los declara en 600 → bold sintetico. */
h1.cover, h1.cover-md, h2.title, .ts-title, .ts-title-md, .ts-title-sm { font-weight: 400; }

/* H-05: .badge-primary sigue hardcodeado al teal del template original
   (rgba(14,124,102,...)) y apply-style-pack.mjs no lo toca. */
.badge-primary { background: rgba(45,122,82,0.10); color: var(--cs-primary); }
```

**Las gráficas.** Cinco SVG inline, cero librerías, cero CDN, todo sobre tokens del design system
(`--cs-primary`, `--cs-accent`, `--cs-border`, `--cs-font-sans`). Se construyó un idioma mínimo y
reutilizable de ejes (`.ax`, `.grid`, `.grid-dash`, `text.tick`, `text.lbl`, `.band`, `.ln`,
`.dot`) que no existía en `components.md`. Detalle en el hallazgo H-01.

**Honestidad de las gráficas.** Donde la fuente publica una pendiente pero no la serie completa,
el pie de la slide lo dice literalmente en vez de fingir que hay datos punto a punto:

- Slide 04: *"La banda dibujada está anclada en el valor citado de GPT-4 (2e25 FLOP, mar 2023);
  los tres puntos son los valores publicados por Epoch, no una serie completa."*
- Slide 07: *"Las dos rectas se reconstruyen con las pendientes publicadas, ancladas en el único
  valor absoluto publicado."*
- Slide 11: *"El cono dibujado une el punto de partida citado con el rango publicado para 2030."*

### 3.5 audit (`reference/audit.md`)

Se corrieron los seis scripts. Salidas verbatim en §5.

**Primera pasada: dos fallos reales y una pila de problemas de composición.**

`check-overflow.mjs` (bloqueante) devolvió 5 pares de texto superpuesto:

```
  ✗ [04 Computo 4-5x] dos textos superpuestos (49% del más chico)
        <text>  "GPT-3 · 3e23 FLOP"
        <text>  "Banda 4x a 5x por año"
  ✗ [07 La aceleracion] dos textos superpuestos (54% del más chico)
        <p.src.reveal.r-fade.is-on>  "Fuentes: Epoch AI, "AI capabilities prog"
        <div>  "Tesis de frontera · sep 2026 · 07"
  ✗ [15 Brecha abierto cerrado] dos textos superpuestos (33% del más chico)  ×3
        <h2.title.tight.reveal.r-rise.is-on>  "Ocho puntos de índice separan lo abierto"
        <span.mk>  "152" / "156" / "160"
```

Los dos primeros eran **defectos reales míos**: una etiqueta de gráfica mal colocada y un pie de
fuente demasiado largo pisando el footer. El tercero resultó ser un **falso positivo del script**
(hallazgo H-07): midiendo con `getBoundingClientRect` no hay solape (h2 termina en y=291,5; los
marcadores empiezan en y=328,3), pero `check-overflow` mide con `Range.getClientRects`, que
devuelve la caja de las métricas de la fuente. Young Serif a `line-height: 1.05` tiene un descenso
que sobresale ~43px de su caja de línea, y ese sobrante es lo que "solapa".

**[USUARIO SIMULADO] Decisión sobre el falso positivo:** `audit.md` clasifica un falso positivo
como hallazgo **"a decidir"** y prohíbe silenciar el detector. El script ofrece `data-overlap-ok`
para solapes intencionales; **decidí no usarlo** y en su lugar añadir separación real
(`margin-top: 28px` en `.eci-scale`). Porqué: `data-overlap-ok` desarma el detector para toda esa
slide, y en una slide con seis filas de datos superpuestas sobre una escala común eso es
justamente donde más lo quiero armado. El coste fueron 28px; el beneficio, que el próximo cambio
en esa slide sí se detecte.

**Segunda pasada: `shoot.mjs` y mirar el deck.** Se generaron los 18 PNG y se miraron uno a uno.
Lo que solo se ve mirando (ninguna regex lo detecta):

| Slide | Problema visto en el PNG | Corrección |
|---|---|---|
| 02, 04, 05, 07, 11, 12, 15 | Titulares partidos en 2 líneas con una palabra huérfana ("año", "ganarse", "entera", "cerrado") | Titulares reescritos a una línea en 02, 04, 05, 11, 15 |
| 04 | La etiqueta rotada de la banda cruzaba el label de GPT-3 | Reubicada al tramo vacío inferior izquierdo |
| 11 | "Más de 100 MW hoy" se comía las dos líneas del cono | Movida al hueco bajo el cono |
| 12 | Barras desordenadas (Meta 115 antes que Microsoft 120) y "120 o mas" sin tilde | Reordenadas por magnitud, tilde corregida |
| 15 | La escala 148/152/156/160 iba a ancho completo y no coincidía con la columna de las pistas | `.eci-scale` pasó a la misma grid de 3 columnas que `.eci-row` |
| 14 | "penso" y "cache" sin tilde en el cuerpo | Corregidas |

Tras un único batch de correcciones, los seis scripts pasan y `check-overflow` queda en verde.

**Mirar los PNG también destapó el hallazgo más serio de toda la prueba (H-06):** varias capturas
salían **falsamente vacías**, con el marcador de paso congelado en `1/3` en vez de `3/3`. No es un
problema del deck: es una carrera no determinista en `shoot.mjs`. Confirmado con 5 corridas del
mismo archivo sin tocar nada:

```
run 1 size= 173906   ← correcta
run 2 size=  57393   ← FALSAMENTE VACÍA
run 3 size= 166000   ← correcta
run 4 size= 173906   ← correcta
run 5 size= 166000   ← correcta
```

Esto **coincide con lo que reportó la prueba en paralelo** (2 de 12 corridas). Detalle y causa
raíz en H-06.

**Checklist de criterio (lo que ningún script revisa), verificado sobre los PNG:**

- [x] Un mensaje por slide, ninguna slide es un párrafo
- [x] Ninguna slide es solo texto: las 17 llevan gráfica, cifra grande, cards o cita tipográfica
- [x] Un color domina; el claret (`--cs-accent`) se usa con cuentagotas y nunca junto a un `.hl` verde en la misma slide
- [x] Variedad de layout: no hay dos slides consecutivas con la misma composición (las transiciones en gradiente además cortan el ritmo cada 3-4 slides)
- [x] Notas de composición del pack aplicadas: serif solo en titulares y cifras, cuerpo siempre en Chivo, medida de línea corta (`max-width: 1100px` en `.lead`), verde en eyebrows
- [x] Cover y cierre en gradiente, intermedias en blanco
- [x] Cover y transitions estáticas, sin `.reveal`

### 3.6 export (`reference/export.md`)

**PDF.** Chrome headless con el comando exacto de `export.md`. **18 páginas, correctas.** Se
verificaron páginas a ojo: las series temporales, las curvas y el cono se imprimen como vectores
nítidos, los `.reveal` salen revelados, el `r-wipe` de las barras de capex resuelto al 100% y el
`[data-counter]` impreso en **675**, no en 0. El pipeline de `@media print` + `finalizeForPrint`
hace su trabajo.

Un aviso que `export.md` no menciona (hallazgo **H-08**): el PDF pesa **21,95 MB**. La causa es el
grano `feTurbulence` de `.grad::before`, que Chrome rasteriza en cada una de las 6 slides con
gradiente. Medido poniendo `--cs-grain: 0` en una copia:

```
CON grano (--cs-grain: .09): 21,95 MB · 30 XObject /Image
SIN grano (--cs-grain: 0)  :  1,18 MB · 16 XObject /Image
```

**18,6x de diferencia** en un deck que no tiene ni una sola imagen real.

**PPTX.** Aquí es donde este deck se rompe, y el script es honesto al respecto:

```
✓ examples/test-03-tesis-frontera/tesis-frontera-modelos.pptx · 18 slides · Cambria/Calibri
⚠ 100 elemento(s) de texto no viajaron al .pptx, en 13 slide(s).
```

Descomprimí el `.pptx` y verifiqué contra `ppt/slides/slideN.xml` en vez de fiarme del resumen.
**Lo peor: las dos citas atribuidas desaparecen enteras.**

```
  [back to the age of research] -> AUSENTE
  [reinforcement learning]      -> AUSENTE
  [159,35] -> AUSENTE      [4-16 GW]   -> AUSENTE
  [2026-2032] -> AUSENTE   [8,3 puntos]-> AUSENTE
```

En las slides de gráfica y de cita sobreviven exactamente cuatro cadenas: eyebrow, titular, pie de
fuente y footer. Todo el cuerpo se pierde:

```
--- slide9.xml (deck 08, las dos citas) · 4 run(s) de texto ---
   · LO DICEN LOS QUE LO ESTÁN CONSTRUYENDO
   · Lo que se escala cambió antes que la curva
   · Citas verbatim en su idioma original, sin traducir, para no alterar la formulación. Amodei…
   · Tesis de frontera · sep 2026 · 08
```

Es decir: **una slide titulada "las dos citas" que en PowerPoint no tiene ninguna cita.** Curioso
efecto secundario: los nombres "Sutskever" y "Amodei" sí aparecen en el XML, pero solo porque los
menciona mi nota al pie, no como atribución de nada.

Caso aparte, `card-grid-3col-numbered` (slide 16) exporta los `<p>` de las cards pero **tira los
`<h3>`**, así que quedan tres párrafos descabezados. Ese patrón sí está en `components.md`
(hallazgo H-09).

`export.md` avisa de esto en abstracto (*"si el wireframe usa un patrón de layout nuevo… ese
contenido no aparece en el `.pptx`, sin aviso"*), y el script lo lista elemento por elemento, que
es mejor de lo prometido. Pero para un deck como este el veredicto práctico es: **el PPTX no es un
entregable, es un esqueleto.** El PDF sí.

**[USUARIO SIMULADO] Decisión:** se entregan los tres formatos, con el PPTX marcado
explícitamente como no apto para distribuir tal cual.

**No se corrió `make-offline.mjs`**: no aporta señal de prueba nueva y `export.md` lo marca como
opcional. Tampoco se pidieron speaker notes.

---

## 4. Fuentes

Cada cifra del deck y **cada cita entrecomillada atribuida a una persona** sale de una de estas
URL, todas consultadas y leídas durante la fase brief. Las dos citas atribuidas se verificaron
contra la publicación original del propio autor / del entrevistador, no contra un resumen.

### 4.1 Citas atribuidas (el riesgo principal del caso)

| Cita (verbatim, sin traducir) | Persona | Fuente primaria | Dónde se usa |
|---|---|---|---|
| *"In 2024, the idea of using reinforcement learning (RL) to train models to generate chains of thought has become a new focus of scaling."* | Dario Amodei, CEO de Anthropic | <https://darioamodei.com/post/on-deepseek-and-export-controls> · post "On DeepSeek and Export Controls", enero de 2025. **Sitio propio del autor** | Slide 08 |
| *"So it's back to the age of research again, just with big computers."* | Ilya Sutskever, cofundador de Safe Superintelligence | <https://www.dwarkesh.com/p/ilya-sutskever-2> · entrevista con Dwarkesh Patel, 25 nov 2025, sección "What are we scaling?" (~00:18:49). **Transcripción del entrevistador** | Slide 08 |

Ambas se muestran en su idioma original y sin editar. Se descartaron varias formulaciones que
circulan atribuidas a estas mismas personas ("the age of scaling is over") porque son títulos de
artículos de terceros, no palabras textuales verificables en el original.

### 4.2 Cifras

| # | URL | Qué dato salió de aquí |
|---|---|---|
| 1 | <https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year> | Cómputo de entrenamiento: modelos notables 4,1x/año (IC 90%: 3,7x-4,6x), frontera 5,3x/año (IC 90%: 4,9x-5,7x), 2010 a may 2024. Valores FLOP: GPT-3 = 3e23, GPT-4 = 2e25, Gemini Ultra = 5e25. Pub. 28 may 2024 → **slide 04** |
| 2 | <https://epoch.ai/data-insights/llm-inference-price-trends> | Precio para igualar un nivel fijo en MMLU. Nivel GPT-3: 60,00 USD/M (nov 2021) → 20,00 (sep 2022) → 0,07 (Gemini 1.5 Flash-8B, oct 2024). Nivel GPT-4: 37,50 USD/M (GPT-4-0314, mar 2023) → 0,18 (Gemini 2.0 Flash, feb 2025). Rango de caída 9x-900x/año. Pub. 12 mar 2025 → **slides 05 y 14** |
| 3 | <https://epoch.ai/data-insights/ai-capabilities-progress-has-sped-up> | Quiebre de pendiente del ECI: 8,3 → 15,5 puntos/año, breakpoint 8 abr 2024, factor 1,85x, R² = 0,9653, IC 90% del factor 1,3x-3,1x, regresión de dos segmentos sobre 17 puntos (dic 2021-dic 2025). Pub. 23 dic 2025 → **slide 07 (pivote de la tesis)** |
| 4 | <https://epoch.ai/data-insights/eci-frontier-trend> | 14 puntos ECI/año en la era de razonamiento vs 6 antes; o1-preview/o1-mini (sep 2024) como frontera de era; **Claude Fable 5 = 162,48 ECI**. Pub. 1 sep 2026, por Alexander Barry → **slide 07 (ancla absoluta de las rectas)** |
| 5 | <https://epoch.ai/data-insights/open-closed-eci-gap> | Brecha abierto/cerrado desde ene 2026: 4 meses, *"The average ECI gap was 8 points, similar to the gap between GPT-5 and GPT-5.5"*. Valores: GPT-5.5 Pro 159,35 · Gemini 3.5 Flash 156,31 · Claude Opus 4.7 156,18 · Kimi K2.6 151,60 · Qwen 3.6 Max Preview 150,16 · GLM-5.1 149,94. Pub. 29 may 2026 → **slide 15** |
| 6 | <https://epoch.ai/blog/power-demands-of-frontier-ai-training> | *"The largest individual frontier training runs in 2030 will likely draw 4-16 gigawatts (GW)"*; crecimiento 2,2x-2,9x/año; runs actuales "exceeding 100 MW"; >100 GW mundo y >50 GW EE.UU. en 2030, ~5% de su capacidad de generación. Pub. 11 ago 2025 → **slides 10 y 11** |
| 7 | <https://arxiv.org/abs/2211.04325> | Villalobos, Ho, Sevilla, Besiroglu, Heim, Hobbhahn: *"models will be trained on datasets roughly equal in size to the available stock of public human text data between 2026 and 2032"*. Rev. 4 jun 2024 → **slide 10** |
| 8 | <https://futurumgroup.com/insights/ai-capex-2026-the-690b-infrastructure-sprint/> | *"The five largest US cloud and AI infrastructure providers… between $660 billion and $690 billion on capital expenditure in 2026, nearly doubling 2025 levels"*. Desglose: Amazon 200, Alphabet 175-185, Microsoft 120+, Meta 115-135, Oracle 50; ~380 en 2025. Pub. 12 feb 2026 → **slides 10 y 12** |
| 9 | <https://www.anthropic.com/claude-fable-and-mythos-5-1> | Fable 5.1 / Mythos 5.1, sep 2026: 10 USD entrada, 50 USD salida, 0,25 USD lectura de caché (−75%), ahorro *"around 25%"* en cargas típicas y *"up to around 45%"* en agénticas. **Fuente del fabricante** → **slide 14** |
| 10 | <https://www.cloudzero.com/blog/gpt-6-pricing/> | GPT-6 Astra, 3 sep 2026: 10/50 USD, caché 1 USD, escritura de caché 12,50 USD, ventana ~1M tokens. GPT-5.6 Sol: 4/20 USD (tarifa promocional hasta 21 nov 2026). Astra = 2,5x Sol → **slide 14** |
| 11 | <https://huggingface.co/blog/ResterChed/kimi-k3-model-overview-mxfp4-quantization-open-wei> | Kimi K3 (Moonshot): 2,8 T parámetros totales, ~50 mil millones activos por token (16 de 896 expertos), API 16 jul 2026, **pesos 27 jul 2026**, ventana 1M tokens → **slide 15 (nota al pie)** |
| 12 | <https://spectrum.ieee.org/state-of-ai-index-2026> | Stanford AI Index 2026 (pub. 13 abr 2026): capacidad mundial de cómputo de IA >3x/año desde 2022, 30x desde 2021; inversión global 581 mil M USD en 2025 vs 253 en 2024. Contexto de research, no llegó a ninguna cifra en pantalla |

**Anclas del encargo, contrastadas y no contradichas.** GPT-6 Astra (3 sep 2026, 10/50 USD),
Fable 5.1 / Mythos 5.1 (Anthropic, ~25% más barato) y Kimi K3 (2,8T, pesos abiertos, jul 2026) se
verificaron contra fuentes primarias y se ampliaron; ninguna se contradice. Precisión que sí se
añadió: el "~25% más barato" de Fable 5.1 **no es una bajada de precio de lista** (sigue en 10/50
USD) sino un recorte del 75% en la lectura de caché que se traduce en ~25% menos coste típico.
Esa distinción es material para el corolario 01 de la tesis y está explicada en la slide 14.

**Placeholders `[DATO PENDIENTE: ...]` usados: ninguno.** Todos los datos del wireframe
encontraron fuente. Los dos pendientes del deck son de imagen, no de dato.

---

## 5. Salidas de validación

Todos los scripts corridos desde la raíz de la skill contra
`examples/test-03-tesis-frontera/tesis-frontera-modelos.html`.

### 5.1 Estado final: los seis en verde

```
########## node scripts/check-style-pack.mjs
  ✓ ink de cuerpo vs fondo   11.59:1  (min 7)
  ✓ titulo vs fondo          18.80:1  (min 7)
  ✓ texto atenuado vs fondo  5.70:1  (min 3.5)
  ✓ primario vs fondo        5.23:1  (min 3)
  ✓ acento vs fondo          9.91:1  (min 3)
  ✓ ink de cuerpo vs card    11.02:1  (min 7)
  ✓ primario vs acento       1.90:1  (min 1.7)
✓ contraste OK
EXIT=0

########## node scripts/audit.mjs
  ✓ contraste y paleta (check-style-pack.mjs)
  ✓ balance de <section> (18/18)
  ✓ balance de <div> (232/232)
  ✓ sin em-dash en el contenido
  ✓ sin punto final en h1/h2/h3/.subtitle
  ✓ footers numerados 01..17 sin huecos ni duplicados
  ✓ slides estáticas (data-steps="1") sin .reveal adentro
  ✓ <title> actualizado ("La frontera cambió de moneda · tesis sobre modelos de frontera")
  ⚠ 2 asset(s) pendiente(s), aceptados explícitamente en la fase assets
      standby — imagen de fondo a sangre (1920x1080) del auditorio o de un datacenter; …
      slide 08 — retratos de Ilya Sutskever y Dario Amodei (recuadro, 1:1). …
✓ audit OK · 1 aviso(s)
EXIT=0

########## node scripts/check-reveal.mjs
  ✓ Todo .reveal revelado queda con transform/filter en "none" — la cascada de .is-on gana
    contra cualquier variante r-*.
EXIT=0

########## node scripts/check-contrast.mjs
  ✓ los 220 textos medidos pasan el umbral WCAG AA sobre su fondo real.
  ⚠ 32 texto(s) sobre gradiente, imagen o background-clip NO se midieron:
    su fondo no es un color plano, asi que un solo ratio no lo describiria.
    Revisarlos a ojo (tipicamente el cover y el cierre).
EXIT=0

########## node scripts/check-overflow.mjs
  ✓ Nada desborda el canvas, se trunca en una línea, ni se superpone con otro texto.
EXIT=0

########## node scripts/doctor.mjs
  ✓ generado con la versión 1.4.0, al día con el engine actual (1.4.0).
EXIT=0
```

### 5.2 Lo que falló por el camino

`check-overflow.mjs`, primera pasada (**EXIT=1**, bloqueante). Salida verbatim en §3.5. Dos
defectos reales (etiqueta de gráfica mal colocada en la 04, pie de fuente pisando el footer en la
07) y un falso positivo por métricas de Young Serif (la 15, ×3 marcadores).

`shoot.mjs`: nunca devolvió un código de error, pero produjo PNG falsamente vacíos de forma no
determinista (§3.5, H-06).

### 5.3 Export

```
########## chrome --headless --print-to-pdf
18 páginas · 21.947.465 bytes · 30 XObject /Image
Verificado a ojo: series temporales, cono de proyección y regresión de dos segmentos
salen como vectores; barras al 100%; [data-counter] impreso en 675.

########## node scripts/export-pptx.mjs
✓ …tesis-frontera-modelos.pptx · 18 slides · Cambria/Calibri
  Editable en PowerPoint y Google Slides. Sin animaciones (estado final de cada slide).
⚠ 100 elemento(s) de texto no viajaron al .pptx, en 13 slide(s).
  Son patrones de layout fuera del set que el export reconoce.
EXIT=0
```

Verificación independiente sobre `ppt/slides/*.xml` (grep de mis propias cifras y citas):

```
  [back to the age of research] -> AUSENTE      [162,48] -> slide8.xml
  [reinforcement learning]      -> AUSENTE      [37,50]  -> slide6.xml
  [159,35]    -> AUSENTE                        [675]    -> slide13.xml
  [4-16 GW]   -> AUSENTE                        [Kimi]   -> slide16.xml
  [2026-2032] -> AUSENTE
  [8,3 puntos]-> AUSENTE
```

---

## 6. Hallazgos

Ordenados por severidad. Ninguno se arregló: la regla del encargo era reportar, no tocar la skill.

### H-01 · No hay ningún patrón de serie temporal ni de curva `[alta]`

`reference/components.md` y `reference/media-and-data.md` no traen ni una gráfica con eje
temporal. El catálogo de datos completo es: `counter-bars` (barras + contador), "Barras
comparativas" y "Progreso / proporción". Las tres son de **una sola dimensión**: comparan
magnitudes, no muestran evolución.

Cualquier deck que argumente sobre una tendencia (que es la mitad de las charlas de tesis, y
también los slides de tracción de un pitch, que es el caso de uso *principal* de la skill) se
queda sin patrón. Aquí hubo que construir a mano cinco gráficas y, con ellas, un idioma de ejes
que no existía: `.ax`, `.grid`, `.grid-dash`, `text.tick`, `text.lbl`, `.band`, `.ln`, `.dot`,
más las conversiones a escala logarítmica.

Coste real: fue la parte más cara de la generación, y todo ese trabajo es **invisible para el
export a PPTX** (H-09) y para `check-contrast.mjs` (H-10).

**Sugerencia:** una familia `time-series` en `components.md` con tres variantes (línea simple,
doble serie, banda/cono de proyección), en escala lineal y logarítmica, siguiendo la convención
que ya usa el resto del catálogo. `SKILL.md` línea 127 dice *"si hace falta un layout nuevo,
agregarlo a `components.md` después de crearlo"*: este es el caso.

### H-02 · `deck-schema.md` no tiene arco para una charla de tesis `[media]`

`reference/deck-schema.md`, tabla "Arcos narrativos por tipo de deck". La única fila para charla
es *Historia → giro → insight → invitación*, 8-12 slides. Es un arco narrativo, no argumentativo:
no tiene sitio para la evidencia, ni para los límites de la propia tesis, ni para las condiciones
de falsación. Y una charla de conferencia de 35-40 min son 16-18 slides, fuera del rango
orientado.

El modelo se queda sin guía justo en el tipo de deck donde más la necesita. Tuve que inventar el
arco y declararlo (§3.2).

**Sugerencia:** añadir una fila "Charla de tesis / keynote argumentativa" con algo del estilo
*tesis → evidencia → objeciones/límites → implicaciones → predicciones falsables*, 14-18 slides.

### H-03 · `deck-schema.md` se contradice sobre cuándo se puede usar HEAVY `[media]`

En la misma tabla de "Niveles de animación":

- Columna "Cuándo" de HEAVY: *"Pitch decks cortos (menos de 10 slides)"*.
- "Reglas fijas (no negociables)", dos líneas después: *"nunca HEAVY en más de 18 slides sin
  pedido explícito del usuario"*.

Entre 10 y 18 slides, una lo prohíbe y la otra lo permite. Un modelo que lea solo la tabla no usará
HEAVY nunca en un deck de 12 slides; uno que lea solo las reglas fijas lo usará sin dudar. Además
las dos reglas miden cosas distintas sin decirlo: "menos de 10" es sobre el deck, mientras que
*"máximo 1-2 slides HEAVY por deck"* es sobre las slides.

**Sugerencia:** unificar en una sola frase, del estilo *"HEAVY en 1-2 slides puntuales de
cualquier deck de hasta 18 slides; nunca el deck entero"*.

### H-04 · El pack `editorial` pide no usar bold en titulares y el template lo fuerza `[media]`

`styles/editorial.md`, sección Composición: *"Young Serif solo tiene un peso (400): la jerarquía
sale de la escala, no del grosor. **No pedir bold en los títulos.**"*

Pero `template.html` declara `font-weight: 600` en `h1.cover` (línea 154), `h1.cover-md` (160),
`h2.title` (167), `.payoff` (181), `.ts-title` (202), `.ts-title-md` (228) y `.ts-title-sm` (235).
Y Google Fonts solo sirve Young Serif en el peso 400. Resultado: **bold sintético del navegador** en todos los titulares del pack `editorial`, que
es exactamente lo que el pack dice que no hay que hacer.

`apply-style-pack.mjs` no puede arreglarlo porque solo fusiona tokens de `:root`, y `font-weight`
no es un token. Se detecta a ojo o no se detecta: ningún validador lo mira.

**Sugerencia:** o el template usa `font-weight: var(--cs-weight-heading, 600)` y cada pack declara
el suyo, o `editorial.md` documenta el override que hay que escribir en el deck (que es lo que
tuve que hacer).

### H-05 · `apply-style-pack.mjs` deja `.badge-primary` con el color del template original `[baja]`

`template.html` línea 310:

```css
.badge-primary { background: rgba(14,124,102,0.10); color: var(--cs-primary); }
```

Ese `rgba(14,124,102,…)` es el teal `--cs-primary` del template por defecto, **hardcodeado**.
Tras aplicar el pack `editorial`, el texto del badge es el verde de prensa `#2D7A52` pero el fondo
sigue siendo un tinte teal. Mismo problema en `.badge-green/red/orange`, aunque esos son
semánticos y se defienden mejor.

`apply-style-pack.mjs` reporta "20 tokens sustituidos · Tokens estructurales preservados: 4/4" y
no lo ve, porque solo toca el bloque `:root`. No es visualmente escandaloso (dos verdes cercanos)
pero con un pack de otra familia cromática sería un badge roto.

**Sugerencia:** `background: color-mix(in oklch, var(--cs-primary) 10%, transparent)`.

### H-06 · `shoot.mjs` produce capturas falsamente vacías, de forma no determinista `[alta]`

**Confirmo el hallazgo de la prueba en paralelo.** Cinco corridas del mismo archivo, sin cambios:
una de las cinco salió vacía (57 KB vs 166-174 KB). En la tanda completa de 18, dos slides
distintas salieron vacías en dos tandas distintas.

**Síntoma:** el PNG muestra solo el eyebrow y el titular (los `data-step="1"`), con el marcador de
paso en `1/3` en vez de `3/3`. Sin error, sin código de salida distinto de 0, sin aviso.

**Causa raíz.** El harness de `shoot.mjs` (líneas 111-118) hace, en `DOMContentLoaded` + doble
`requestAnimationFrame`: disparar `beforeprint` y luego marcar todos los `.reveal` con `.is-on`.
Pero `template.html` tiene su propio `enterInitialSlide()` (línea 1009) que también corre en
`requestAnimationFrame` y **se reintenta a sí mismo** hasta que `<deck-stage>` tenga una sección
activa. Cuando el upgrade del custom element llega tarde, `enterInitialSlide` gana la carrera,
llama a `resetAndEnter(slide)`, **quita todos los `.is-on`** y deja solo los del paso 1.

**Por qué importa mucho.** `reference/audit.md` presenta `shoot.mjs` como *"el único paso del flujo
que puede juzgar lo que ninguna regex alcanza"*, y pide expresamente una sola ronda acotada de
inspección. Si el modelo mira un PNG falsamente vacío en esa única ronda, la conclusión razonable
es "la slide está rota" y se pone a arreglar un deck que está bien; o, peor, la ronda se da por
buena creyendo que la slide está vacía a propósito. Es un fallo silencioso en el paso que existe
precisamente para no fiarse del HTML.

**Sugerencia:** en vez de un doble `rAF`, esperar a que exista `section[data-deck-active]` y
aplicar el estado final *después* (poll con timeout), y/o hacer que `shoot.mjs` verifique que
`.act-marker .step-num` coincide con `data-steps` antes de dar la captura por buena.

### H-07 · `check-overflow.mjs`: falso positivo de solape con fuentes de `line-height` comprimido `[media]`

`check-overflow.mjs` mide las cajas de texto con `Range.getClientRects()` (líneas ~138-152), con
un comentario que explica bien por qué no usa la caja del elemento. El efecto secundario no
documentado es que `Range` devuelve la caja de las **métricas de la fuente**, no la caja de línea
del CSS. Con `h2.title { font-size: 76px; line-height: 1.05 }` y Young Serif, la caja de la fuente
sobresale **~43px** por debajo de la caja del elemento:

```
h2  getBoundingClientRect: top=218,2  bottom=291,5
mk  getBoundingClientRect: top=328,3  bottom=348,5    ← 37px de separación real
check-overflow: "dos textos superpuestos (33% del más chico)"
```

Visualmente no hay ningún solape (se comprobó en el PNG). Como es un fallo **bloqueante**, obliga a
una decisión que no debería hacer falta. Afecta a cualquier pack con serif de descenso grande y a
todo el sistema `.ts-title*`, que usa `line-height: 0.98`.

Es un compromiso razonable del script (prefiere falsos positivos a falsos negativos), pero debería
estar **documentado** en `reference/audit.md` junto al resto, para que el modelo sepa reconocerlo
en vez de perseguir un fantasma. Ahora mismo `audit.md` solo menciona el falso positivo del punto
final en los títulos.

### H-08 · Nadie avisa de que el grano multiplica por 18 el peso del PDF `[media]`

`reference/export.md` enumera las degradaciones del PPTX con detalle pero no dice nada del tamaño
del PDF. Medido en este deck:

| | Tamaño | XObject `/Image` |
|---|---|---|
| `--cs-grain: .09` (default) | **21,95 MB** | 30 |
| `--cs-grain: 0` | **1,18 MB** | 16 |

El grano de `.grad::before` es un `feTurbulence` inline (buena decisión para la autonomía del
deck), pero Chrome lo rasteriza al imprimir, en cada slide con gradiente. En un deck con 6 slides
en gradiente eso son 20 MB de ruido, para un deck que no tiene ni una imagen real. Un PDF de 22 MB
no pasa por correo y tarda en abrir en el portátil de la sala.

**Sugerencia:** una línea en `export.md` (*"si el PDF va a circular por correo, `--cs-grain: 0`
antes de imprimir: el grano se rasteriza y multiplica el peso por ~18"*), o que el propio
`@media print` del template ponga `--cs-grain: 0`.

### H-09 · El export a PPTX tira `<h3>` de un patrón que sí está documentado `[media]`

Que las gráficas SVG hechas a mano no viajen al PPTX está avisado y es esperable. Lo que no
esperaba es que `card-grid-3col-numbered` — un patrón **documentado en `components.md`** (línea
233) — exporte los `<p>` de las cards pero **deje fuera los `<h3>` y el `.num-card-num`**:

```
--- slide17.xml (deck 16) ---
   · CÓMO SABER SI ESTA TESIS ES FALSA
   · Tres predicciones que se pueden desmentir
   · El mayor entrenamiento individual de 2030 caerá entre 4 y 16 GW…
   · El retraso de los pesos abiertos se queda por debajo de seis meses…
   · El siguiente buque insignia de cualquier laboratorio grande no baja de 10 dólares…
   · Tesis de frontera · sep 2026 · 16
```

Faltan los tres titulares ("El techo es la red, no el corpus", etc.). Quedan tres párrafos
descabezados. `export.md` dice que el problema son *"los patrones de layout nuevos"*, pero este no
lo es.

Aparte, el veredicto de conjunto para un deck denso: **100 elementos de texto perdidos en 13 de 18
slides**. En las slides de gráfica y de cita sobreviven exactamente cuatro cadenas (eyebrow,
titular, pie de fuente, footer). La slide de las dos citas atribuidas **no contiene ninguna cita
en el PPTX**. Merecería una frase más dura en `export.md`: para decks de datos, el PPTX es un
esqueleto para rellenar a mano, no un entregable.

### H-10 · `check-contrast.mjs` no mide el color real del texto SVG `[media]`

`check-contrast.mjs` recorre `section.querySelectorAll('*')` (línea 122), así que **sí visita** los
`<text>` de las gráficas, pero lee el color con `parseColor(cs.color)` (**línea 140**). El texto
SVG se pinta con `fill`, no con `color`: lo que mide es el `color` heredado del ancestro, no el
color con el que se dibuja el glifo.

Comprobado: poniendo `fill: #EFEFEF` en `text.tick` (contraste ~1,1:1 sobre blanco,
completamente ilegible), el script sigue diciendo:

```
  ✓ los 220 textos medidos pasan el umbral WCAG AA sobre su fondo real.
```

No es que los ignore: los cuenta como aprobados. Es un **falso verde**, peor que no mirarlos, y no
aparece en el aviso de "32 textos no medidos". Con H-01 empujando a construir gráficas SVG a mano,
esta es la zona del deck con más texto sin cobertura real.

**Sugerencia:** para elementos en el namespace SVG, usar `cs.fill` (y considerar `stroke`) en vez
de `cs.color`; si no se puede resolver, sumarlos al contador de "no medidos" en lugar de darlos por
buenos. Nota: `check-overflow.mjs` **sí** cubre bien el texto SVG (fue quien detectó el solape de
etiquetas de la slide 04).

### H-11 · `counter-bars` está roto en `components.md` `[media]` — confirmado

**Confirmo el hallazgo de la prueba en paralelo**, por inspección de código. `components.md` línea
894:

```css
section[data-active="true"] .tk-fill.is-on { width: var(--w, 0%); }
```

El `data-active="true"` **sí** funciona (el template lo espeja desde `data-deck-active`,
`template.html` líneas 892-898). El problema es `.tk-fill.is-on`: en el HTML documentado del propio
patrón (`components.md`, patrón que empieza en la línea 839) `.tk-fill` no lleva la clase `.reveal`, y el step
controller solo pone `.is-on` en elementos `.reveal`. `.tk-fill` **nunca** recibe `.is-on`, así que
la barra se queda en `width: 0%` para siempre.

El contraste está en el propio repo: `media-and-data.md` → "Progreso / proporción" hace lo correcto
apuntando al ancestro que sí recibe la clase (`media-and-data.md` línea 177):

```css
.reveal.is-on .prop .fill, .prop.is-on .fill { transform: scaleX(var(--v, 1)); }
```

`counter-bars` debería ser `section[data-active="true"] .reveal.is-on .tk-fill`. (En mis barras de
capex evité el patrón: uso `r-wipe` sobre la fila, que sí funciona.)

### H-12 · Dos documentos dicen que `check-overflow` no detecta solapes, y sí los detecta `[media]`

`reference/audit.md` **línea 49**:

> *"No detecta superposición entre elementos (`no_overlapping_text`) — ver la nota en `README.md`
> → Limitaciones conocidas."*

Y el `README.md` de la raíz **línea 168** repite la misma afirmación como limitación conocida:

> *"**`check-overflow.mjs` no detecta superposición entre elementos** (`no_overlapping_text`), solo
> desborde de canvas y truncamiento de una línea — generalizar la detección de superposición sin
> falsos positivos… queda fuera del alcance actual."*

Pero el script sí lo implementa, y su propia cabecera lo dice (`check-overflow.mjs` líneas 34-42,
que describen el umbral del 25% y el escape `data-overlap-ok`, y el comentario de cierre: *"Con
esto quedan cubiertos los tres tokens que cada slide declara en `data-om-validate`"*). De hecho el
solape fue **el único fallo bloqueante de toda esta prueba** (§3.5 y §5.2).

La feature se implementó y ninguno de los dos documentos se actualizó. Un modelo que confíe en
`audit.md` no esperará ese fallo y puede leerlo como un bug del script en vez de un defecto del
deck. Y `check-docs.mjs`, que existe como canario de drift docs↔repo, pasa limpio: valida
cobertura de scripts en las tablas y que los links resuelvan, pero no la veracidad de lo que
afirman los documentos.

```
$ node scripts/check-docs.mjs
  ✓ los 15 scripts estan en SKILL.md y README.md
  ✓ los 16 archivos de reference/ estan en la tabla de SKILL.md
  ✓ los links relativos de 29 documentos resuelven
✓ la documentacion sigue alineada con el repo
```

### H-13 · Puntos ambiguos menores `[baja]`

- **La slide de standby y el conteo de slides.** `media-and-data.md` dice que la pantalla de inicio
  "no cuenta como parte de la charla" y no lleva número de footer. Pero entonces un deck con
  standby + 17 slides son 18 `<section>`, y no queda claro contra cuál de los dos números se
  aplican los límites de `deck-schema.md` ("nunca HEAVY en más de 18 slides"). Lo interpreté como
  slides numeradas y lo anoté.
- **`SKILL.md` regla 2 vs `.src`.** La regla de "sin punto final" cubre `h1/h2/h3`, `.subtitle`,
  `.ts-tagline`, `.eyebrow` y `.payoff`, y `audit.mjs` solo verifica los cuatro primeros. En un
  deck con un pie de fuente en cada slide, tuve que decidir a ojo que los `.src` son párrafos de
  cuerpo (llevan punto). Está bien resuelto en la doc, pero es un caso que aparece en cuanto el
  deck es serio con las fuentes y no está ejemplificado.

---

## 7. Lo que funcionó bien

No todo son roces. Vale la pena dejar constancia de lo que sostuvo el peso de este caso:

- **`reference/animations.md` es la mejor pieza de documentación de la skill.** Los dos gotchas de
  *SVG path drawing* (`transform: none !important` y "la opacity sigue haciendo falta") y el de
  *specificity wars* con `.reveal.is-on` **son exactamente los bugs que me habrían costado media
  hora cada uno**. Están escritos como "esto es lo que evita el bug, no la receta", y es verdad.
- **`check-reveal.mjs` cubre justo el punto ciego que dice cubrir.** Es un bug que el PDF tapa
  (`@media print` fuerza `transform: none !important`) y que solo se ve navegando en vivo. Tener un
  script que lo cace vale mucho.
- **`check-overflow.mjs` es el validador con mejor relación señal/ruido de todos.** Encontró dos
  defectos reales que yo no había visto y que en una charla proyectada serían texto ilegible.
- **`export-pptx.mjs` es honesto.** No finge que exportó bien: lista los 100 elementos perdidos,
  slide por slide, con clase y contenido. Eso es infinitamente mejor que un `.pptx` silenciosamente
  incompleto, y me permitió verificar el daño exacto.
- **`apply-style-pack.mjs` cumple lo que promete.** "Tokens estructurales preservados: 4/4" es
  justo el fallo que la doc advierte que ocurre al copiar el `:root` a mano.
- **La disciplina de fases funcionó.** `assets` como punto de control bloqueante obligó a decidir
  las dos imágenes *antes* de escribir HTML, en vez de descubrir el hueco al final. Y `audit.md`
  distinguiendo bloqueante / aviso / a decidir me dio un criterio claro para el falso positivo de
  la slide 15 en vez de una decisión arbitraria.
- **El pack `editorial` es coherente y aguanta densidad.** Un deck con 17 slides, 5 gráficas y un
  pie de fuente en cada una sigue leyéndose. El contraste sale holgado (11,59:1 el cuerpo, 18,80:1
  los titulares) y la advertencia del pack sobre "el fondo blanco puro, no crema" evita el cliché
  que menciona.
