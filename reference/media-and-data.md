# Imágenes, métricas y gráficos

Índice: [imágenes](#imagen-a-sangre-completa) · [métricas](#métrica-grande) · [barras y proporción](#barras-comparativas) · [pantalla de inicio](#pantalla-de-inicio) · **[datos: gráficas, tabla y timeline](#datos-gráficas-tabla-y-timeline)**

Patrones listos para las slides que llevan algo más que texto. Todo en CSS y SVG inline: **ninguno requiere librería externa ni build step**, y todos sobreviven al export a PDF.

Copiar el CSS al bloque de la slide y el HTML dentro del `.pad`.

**Soporte en export a PPTX** (`scripts/export-pptx.mjs`): desde 2.1 el export mide cada slide en Chrome y reconstruye lo que ve, así que todos los patrones de este archivo viajan sin soporte específico: imágenes ya recortadas como en el deck, métricas y barras como texto y formas nativas en su posición real. Lo único que no viaja es texto o decoración generados por CSS en `::before`/`::after`; el script lo reporta.

**Un filtro CSS decorativo (`grayscale`, `sepia`, etc.) en una imagen nunca va en el mismo elemento que lleva `.reveal`.** El pipeline de impresión resetea `filter: none !important` sobre cualquier `.reveal` para quitar el `blur(14px)` de la animación al finalizar (ver `template.html` → `@media print`) — y como es el mismo shorthand, se lleva puesto cualquier otro filtro que el elemento tuviera, incluido uno que nada tenga que ver con la animación. Si una imagen necesita `.reveal` (para que aparezca en su paso) y además un filtro permanente, separarlos en dos elementos: el filtro va en el `<img>`, `.reveal`/`.r-blur` va en un `<div>` que lo envuelve.

```html
<div class="reveal r-blur" data-step="2" style="width:100%">
  <img src="assets/img/foto.jpg" alt="..." style="filter:grayscale(1);display:block;width:100%">
</div>
```

---

## Cuándo pedirle imágenes al usuario

Antes de generar, revisar el wireframe y **pedir explícitamente** los assets de las slides que los necesiten. Es preferible una slide vacía esperando una foto real que una slide rellena de texto que sustituye a la imagen que debería estar ahí.

Pedir imagen cuando la slide:
- Muestra un producto, una pantalla o un resultado visible.
- Presenta personas (equipo, speakers, testimonios).
- Abre o cierra el deck y necesita peso visual.
- Es una pantalla de espera antes de empezar (ver `## Pantalla de inicio`).

Formato de la petición: decir **qué slide**, **qué debería mostrar** y **en qué proporción** (a sangre completa: 1920×1080; media pantalla: 960×1080; recuadro: libre). Ofrecer seguir sin ella y dejar el hueco marcado si el usuario no la tiene a mano.

Guardar en `assets/` dentro del proyecto: `assets/img/`, `assets/people/`, `assets/logos/`.

---

## Imagen a sangre completa

Ocupa la slide entera, con el texto encima sobre un velo que garantiza legibilidad.

```css
.bleed { position: absolute; inset: 0; overflow: hidden; }
.bleed img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* El velo no es decoración: sin él, el texto blanco es ilegible sobre
   las zonas claras de cualquier foto. */
.bleed::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.72) 100%);
}
.bleed-txt { position: relative; z-index: 2; color: #fff; }
```

```html
<section class="grad" data-label="NN Titulo" data-steps="1" data-current-step="1">
  <div class="bleed"><img src="assets/img/foto.jpg" alt="Descripción real de la foto"></div>
  <div class="pad center bleed-txt">
    <h1 class="cover-md">Título encima de la imagen</h1>
  </div>
  <div class="footer"><div class="left"></div><div>Autor · <span class="num">NN</span></div></div>
</section>
```

---

## Imagen y texto, media pantalla

```css
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
.split-img {
  width: 100%; aspect-ratio: 4 / 3; object-fit: cover;
  border-radius: var(--cs-radius-lg); display: block;
}
```

```html
<div class="split">
  <img class="split-img reveal r-blur" data-step="2" src="assets/img/pantalla.png" alt="...">
  <div class="reveal r-left" data-step="2">
    <h3 style="font-size:44px;margin:0 0 20px">Lo que se ve</h3>
    <p style="font-size:28px;line-height:1.5;color:var(--cs-body);margin:0">Una frase, no un párrafo.</p>
  </div>
</div>
```

---

## Métrica grande

Para el dato que carga la slide. Usa el contador animado del template: el número sube al llegar a su paso, y en PDF se imprime ya en su cifra final.

```css
.metrica { display: flex; flex-direction: column; gap: 12px; }
.metrica .cifra {
  font-family: var(--cs-font-heading);
  font-size: 220px; line-height: .9; letter-spacing: -.03em;
  color: var(--cs-accent); font-variant-numeric: tabular-nums;
}
.metrica .cifra .unit { font-size: .5em; }
.metrica .glosa { font-size: 32px; line-height: 1.4; color: var(--cs-body); max-width: 760px; }
/* .stat-source (definida en template.html) va debajo del .glosa cuando la
   cifra necesita atribuirse a una fuente externa — benchmarks, precios,
   cualquier numero que no sea propio. Opcional: una cifra propia no la
   necesita. */
```

```html
<div class="metrica reveal r-scale" data-step="2">
  <div class="cifra" data-counter="23" data-target-step="2">0<span class="unit">%</span></div>
  <div class="glosa">Qué significa esa cifra, en una frase.</div>
  <div class="stat-source">Fuente: Artificial Analysis, benchmarks GPT-6 Astra.</div>
</div>
```

`data-counter` acepta decimales y respeta los que trae (`data-counter="57.5"` → `57,5` en un deck en español). Formatea según el `lang` del `<html>`: separador de miles desde cinco cifras (`125.000`, pero un año queda `2026`). Opciones: `data-decimals="1"` fija los decimales, `data-format="compact"` abrevia (`2,4 M`, `120 k`). La unidad va en `<span class="unit">` y no se anima.

---

## Fila de métricas

Tres o cuatro cifras comparables. Más de cuatro y dejan de leerse.

```css
.metricas { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 56px; }
.metricas .m { border-top: 1px solid var(--cs-border); padding-top: 24px; }
.metricas .n {
  font-family: var(--cs-font-heading); font-size: 96px; line-height: 1;
  color: var(--cs-black); font-variant-numeric: tabular-nums;
}
.metricas .l { font-size: 24px; color: var(--cs-muted); margin-top: 14px; }
```

```html
<div class="metricas stagger">
  <div class="m reveal r-scale" data-step="2"><div class="n" data-counter="150" data-target-step="2">0</div><div class="l">Asistentes</div></div>
  <div class="m reveal r-scale" data-step="2"><div class="n" data-counter="3" data-target-step="2">0</div><div class="l">Semanas</div></div>
  <div class="m reveal r-scale" data-step="2"><div class="n" data-counter="1" data-target-step="2">0</div><div class="l">Dev</div></div>
</div>
```

---

## Barras comparativas

Para dos o tres magnitudes donde **el ancho es el argumento**. El `r-wipe` las descubre de izquierda a derecha, que es la dirección en que se leen.

```css
.barras { display: flex; flex-direction: column; gap: 40px; }
.barra-fila .etiqueta {
  font-size: 24px; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 700; color: var(--cs-muted); margin-bottom: 16px;
}
.barra { display: flex; height: 88px; width: 100%; }
.seg { display: flex; align-items: center; padding: 0 24px; font-size: 24px; font-weight: 600; }
.seg.a { background: var(--cs-primary); color: #fff; }
.seg.b { background: var(--cs-cream-2); color: var(--cs-body); }
.seg.c { background: var(--cs-surface); color: var(--cs-muted); border: 1px solid var(--cs-border); }
```

```html
<div class="barra-fila reveal r-wipe" data-step="2">
  <div class="etiqueta">Antes</div>
  <div class="barra">
    <div class="seg a" style="width:14%">Decidir</div>
    <div class="seg b" style="width:72%">Escribir</div>
    <div class="seg c" style="width:14%">Revisar</div>
  </div>
</div>
```

---

## Progreso / proporción

Una sola magnitud sobre su total. Más honesto que un donut cuando solo hay un dato.

```css
.prop { display: flex; flex-direction: column; gap: 18px; }
.prop .track { height: 20px; background: var(--cs-cream-2); border-radius: 999px; overflow: hidden; }
.prop .fill {
  height: 100%; background: var(--cs-primary); border-radius: 999px;
  transform-origin: left; transform: scaleX(0);
  transition: transform 900ms var(--cs-ease-std); transition-delay: var(--d, 0ms);
}
.reveal.is-on .prop .fill, .prop.is-on .fill { transform: scaleX(var(--v, 1)); }
.prop .lbl { display: flex; justify-content: space-between; font-size: 26px; color: var(--cs-body); }
```

```html
<div class="prop reveal" data-step="2">
  <div class="lbl"><span>Registro completado</span><span>68%</span></div>
  <div class="track"><div class="fill" style="--v:.68"></div></div>
</div>
```

---

## Pantalla de inicio

La que se proyecta **antes** de empezar, mientras la sala se llena. No es la portada: la portada abre la charla, esta espera. Va primera y se salta de un `→` cuando arranca.

```css
.standby { position: relative; height: 100%; }
.standby .marca {
  font-size: 26px; letter-spacing: .2em; text-transform: uppercase;
  font-weight: 700; color: rgba(255,255,255,.75);
}
.standby .cuando { margin-top: auto; font-size: 30px; color: rgba(255,255,255,.7); }
/* Latido lento: indica que la proyección está viva, no congelada */
@keyframes respira { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
.standby .senal { animation: respira 3.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .standby .senal { animation: none } }
```

```html
<section class="grad" data-label="00 Standby" data-steps="1" data-current-step="1">
  <!-- Opcional: imagen de fondo a sangre. Pedirla al usuario. -->
  <div class="pad standby">
    <div class="marca">Nombre del evento</div>
    <div style="margin:auto 0">
      <h1 class="cover-md">Título de la charla</h1>
      <div class="subtitle">Autor</div>
    </div>
    <div class="cuando senal">Empezamos en unos minutos</div>
  </div>
  <div class="footer"><div class="left"></div><div></div></div>
</section>
```

Esta slide **no lleva número de footer**: no cuenta como parte de la charla.

---

## Datos: gráficas, tabla y timeline

Tres patrones de primera clase: su CSS ya viene en `template.html` (clases `sz-*`), así que **no hay que copiar estilos**, solo el HTML. Usan los tokens del pack elegido y se exportan a PDF y PPTX sin nada extra. Usarlos en lugar de armar tablas o gráficas a mano: las tres pruebas de `examples/test-0*` inventaron cada una su propia versión, y ninguna se reutilizaba ni se exportaba bien.

### Gráfica (`.sz-chart`)

Declarativa: el deck trae **los datos en JSON** y el runtime del template dibuja el SVG con el tamaño real de la figura (ejes, grilla, etiquetas, formato de números según el idioma del deck). Nunca calcular coordenadas a mano.

```html
<figure class="sz-chart reveal" data-step="2" style="height:600px">
  <script type="application/json">
    {
      "type": "bar",
      "labels": ["T1 25", "T2 25", "T3 25", "T4 25", "T1 26", "T2 26"],
      "series": [{ "name": "ARR", "values": [0.8, 1.1, 1.5, 1.9, 2.6, 3.4] }],
      "prefix": "$", "unit": " M",
      "highlight": "last"
    }
  </script>
</figure>
```

| Campo | Valores | Para qué |
|---|---|---|
| `type` | `bar` · `hbar` · `line` · `area` | `bar` para comparar periodos, `hbar` para rankings con etiquetas largas, `line`/`area` para tendencias y series temporales |
| `labels` | lista de textos | Eje de categorías (periodos, nombres). Con más de 12 se muestran salteadas |
| `series` | `[{ "name", "values" }]` | Una o varias series. Con varias: leyenda en barras, nombre al final de cada línea |
| `highlight` | índice, `"last"`, `"max"`, `"min"` | El punto o barra que carga el mensaje, en el color de acento del pack. Uno solo |
| `prefix` / `unit` | texto | `"$"`, `" M"`, `"%"`: se aplican a ejes y etiquetas |
| `decimals` | número | Fija los decimales; si no, cada cifra usa los que trae en el JSON |
| `scale` | `"log"` | Para órdenes de magnitud (cómputo, costos que caen 100x): ejes en `10²⁵`, etiquetas en notación científica |
| `min` / `max` | número | Fija el rango del eje de valores |
| `title` | texto | Descripción para lectores de pantalla |

**Animación:** si la figura (o un contenedor) es `.reveal`, al revelarse las barras crecen escalonadas, las líneas se dibujan y las etiquetas aparecen al final. Fuera de un `.reveal` se dibuja en su estado final. Es el nivel MEDIUM de `deck-schema.md`.

**Tamaño:** el alto va en `style` (default 520px); el ancho es el del contenedor. Si se cambia el tamaño de la figura, el runtime la vuelve a dibujar al recargar.

**Reglas:** una gráfica por slide, con el título de la slide diciendo la conclusión ("ARR se triplicó en un año"), no el tema ("Evolución del ARR"). Sin leyenda si hay una sola serie. Las cifras de terceros llevan `.stat-source` debajo.

**En PPTX:** por default va como imagen fiel, con los rótulos y ejes como texto editable encima. `--charts=native` la arma como gráfica nativa de PowerPoint con los datos editables (experimental: Keynote y Quick Look no las dibujan).

### Tabla (`table.sz-table`)

```html
<table class="sz-table reveal" data-step="2">
  <thead><tr><th>Modelo</th><th class="num">Input $/Mtok</th><th class="num">Output $/Mtok</th><th>Pesos</th></tr></thead>
  <tbody>
    <tr><td class="lead">GPT-6 Astra<span class="sub">OpenAI</span></td><td class="num">10.00</td><td class="num">50.00</td><td>Cerrados</td></tr>
    <tr class="hl"><td class="lead">DeepSeek V4-Pro<span class="sub">DeepSeek</span></td><td class="num">0.435</td><td class="num hl">0.87</td><td>Abiertos</td></tr>
  </tbody>
</table>
```

- `th.num` / `td.num`: cifras alineadas a la derecha, en mono con cifras tabulares.
- `td.lead` con `<span class="sub">`: nombre en negrita y una línea secundaria.
- `tr.hl`: la fila que importa, con fondo suave. `td.hl`: la celda que importa, en color de acento.
- Máximo 6 filas y 5 columnas: si hace falta más, la tabla va a un anexo o a las notas.
- Para revelar fila por fila: `.reveal` y `data-step` en cada `<tr>`.

### Timeline (`ol.sz-timeline`)

```html
<ol class="sz-timeline stagger">
  <li class="reveal" data-step="2"><span class="when">2023</span><h3>Primer piloto</h3><p>Tres equipos, una integración con Slack.</p></li>
  <li class="reveal" data-step="2"><span class="when">2024</span><h3>Seed</h3><p>USD 2,1 M para salir de beta.</p></li>
  <li class="reveal hl" data-step="2"><span class="when">2026</span><h3>Serie A</h3><p>Lo que venimos a pedir hoy.</p></li>
</ol>
```

Horizontal, de 3 a 6 hitos. `li.hl` marca el hito que importa (normalmente el último: el que se viene a pedir). Los puntos los inserta el runtime como elementos reales, así que viajan al PPTX. Con `.stagger` entran uno tras otro.

