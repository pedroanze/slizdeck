# Animations

Catálogo de técnicas de animación para decks de slizdeck (`template.html`). Cada técnica incluye solo lo necesario para hacerla funcionar: snippet listo para copiar + los bugs a evitar.

**La lógica de decisión "estática vs animada" está en la fase `build`, ver `reference/build.md`.** Acá solo están las técnicas.

---

## Índice

El modelo de steps, el stagger y los contadores sirven para todos los niveles animados; el resto son técnicas SVG para HEAVY (ver `deck-schema.md`). **Leer únicamente la técnica que vas a usar** — cada una trae sus propios gotchas al final de su sección, y son lo que evita el bug, no la receta.

- Foundation — el modelo de steps
- Reveal stagger — varios elementos, mismo step, delay creciente
- Counter ticking — número que sube hasta un target
- SVG path drawing — la flecha que se dibuja
- SVG marker — punta de flecha
- Pulso disparado por el step actual
- Wrap arrow con bifurcación
- Connector trunk + N branches que se bifurcan
- Popup overlay con backdrop-blur
- SVG packets animados a lo largo de un path (loop continuo)
- Anillos pulsantes (ping concéntrico)
- Magic-move: archivos que vuelan
- Cuidados críticos (transversales)

---

## Foundation — el modelo de steps

Toda la infraestructura está en `template.html`. Solo hay que entender 4 cosas:

1. **En la `<section>`** pon `data-steps="N"` (total de steps) + `data-current-step="0"` (init).
2. **En los elementos** que quieres revelar pon `class="reveal" data-step="K"` (K = step en el que aparecen).
3. **El step controller** (ya está en el template) intercepta `→`/`←`/`Espacio` ANTES que deck-stage. Avanza el step interno si puede, si no lo deja pasar y deck-stage cambia de slide.
4. **Al entrar a la slide**, `resetAndEnter` saca todos los `.is-on`, y vuelve a poner `.is-on` en `data-step <= 1` → el primer reveal se anima al entrar.

**Slide estática**: NO pongas `.reveal`, define `data-steps="1" data-current-step="1"`.

**Slide mínima animada:**

```html
<section data-label="03 Example" data-steps="2" data-current-step="0">
  <div class="pad">
    <div class="act-marker"><span class="step-num">1</span><span style="opacity:.4">/2</span></div>
    <div class="eyebrow reveal" data-step="1">Section</div>
    <h2 class="title reveal" data-step="1" style="--d:80ms">Title</h2>
    <p class="reveal" data-step="2">Body paragraph appears at step 2.</p>
  </div>
  <div class="footer">...</div>
</section>
```

---

## Reveal stagger — varios elementos, mismo step, delay creciente

Para que varias cards aparezcan una tras otra en el mismo step, envolverlas en un contenedor `.stagger`: el template escalona solo a sus hijos `.reveal` (90ms entre cada uno, hasta 12 hijos).

```html
<div class="grid stagger">
  <div class="card reveal" data-step="2">Primera</div>
  <div class="card reveal" data-step="2">Segunda</div>
  <div class="card reveal" data-step="2">Tercera</div>
</div>
```

Para un ritmo distinto, `style="--d:Nms"` en cada elemento fija su retraso a mano (`.reveal` lo lee como `transition-delay`).

---

## Counter ticking — número que sube hasta un target

Built-in en el template (`runCounter`). Marcar un elemento con:

```html
<span class="big-number"
      data-counter="2400"
      data-target-step="3">0<span class="unit">k</span></span>
```

`data-counter` = target final. `data-target-step` = step en el que arranca. Easing ease-out-quint, duración 1400ms. El `.unit` opcional (ej. "k", "%", "€") se preserva durante el tick.

Respeta los decimales que trae (`data-counter="57.5"` → `57,5` en un deck en español) y formatea según el `lang` del deck: separador de miles desde cinco cifras (`125.000`, un año queda `2026`). `data-decimals="N"` fija los decimales; `data-format="compact"` abrevia (`2,4 M`). Ver `media-and-data.md` → "Métrica grande".

---

## SVG path drawing — la flecha que se dibuja

Patrón base de todas las flechas animadas. El path se "dibuja" arrastrando `stroke-dashoffset` de `1` a `0`. Usa `pathLength="1"` para normalizar sin importar la longitud geométrica real.

```html
<svg class="my-svg" viewBox="0 0 1680 600" preserveAspectRatio="none">
  <path class="my-path reveal" data-step="3" pathLength="1"
        d="M 100 100 C 300 100 500 300 700 300"/>
</svg>
```

```css
.my-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.my-path {
  fill: none;
  stroke: var(--cs-primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.my-path.reveal {
  /* CRITICAL: override .reveal default — no translateY on SVG */
  opacity: 0;
  transform: none !important;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition:
    stroke-dashoffset 1100ms cubic-bezier(0.65, 0.05, 0.36, 1),
    opacity 200ms ease;
  transition-delay: var(--d, 0ms);
}
.my-path.reveal.is-on {
  opacity: 1;
  stroke-dashoffset: 0;
}
```

**Gotcha #1 — transform en el SVG.** `.reveal` por default aplica `transform: translateY(16px)` para el fade-in. En un SVG path esto DESPLAZA todo el path 16px hacia abajo → coordenadas desalineadas. Forzá `transform: none !important;`.

**Gotcha #2 — la opacity sigue haciendo falta aunque haya dashoffset.** Sin opacity, un eventual `marker-end` (la punta de flecha) queda visible en el punto geométrico final del path ANTES de que el trazo dibujado llegue ahí. Mantené siempre opacity 0 → 1 en transición.

### Tangentes suaves en los corners

Para evitar ángulos secos entre segmentos (línea vertical → curva horizontal), el control point de la curva tiene que tener la misma dirección que el segmento adyacente.

Ejemplo: línea vertical que termina en `(840, 460)` y después curva hacia la derecha. Para que quede "smooth":

```
L 840 460 C 840 510 950 490 1010 490
       ^      ^
       |      control1 en (840, 510) → tangente vertical-hacia-abajo desde la línea
       |
       fin del segmento vertical
```

Si en cambio pones `C 880 460 950 490 1010 490`, el control1 NO es vertical respecto al segmento anterior → corner seco.

---

## SVG marker — punta de flecha

Define un `<marker>` en el `<defs>` y aplícalo vía `marker-end`:

```html
<svg ...>
  <defs>
    <marker id="my-tip" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill: var(--cs-primary)"/>
    </marker>
  </defs>
  <path ... marker-end="url(#my-tip)"/>
</svg>
```

`refX="9"` → la punta del marker queda 1 unidad más allá del punto final del path. Si quieres que la punta caiga exactamente sobre el target, terminá el path un poco antes.

---

## Pulso disparado por el step actual

Para que un elemento pulse solo cuando la slide está en el step X, usa el selector `data-current-step`:

```css
@keyframes myPulse {
  0%   { box-shadow: 0 8px 24px rgba(37,99,235,0.30); transform: scale(1); }
  50%  { box-shadow: 0 16px 44px rgba(37,99,235,0.55), 0 0 0 3px rgba(37,99,235,0.18); transform: scale(1.02); }
  100% { box-shadow: 0 8px 24px rgba(37,99,235,0.30); transform: scale(1); }
}
section[data-current-step="4"] .my-featured.reveal.is-on {
  animation: myPulse 1500ms cubic-bezier(0.4, 0, 0.2, 1) 250ms 2;
}
```

Cuando `applyStep` setea `data-current-step="4"` en la section, arranca la animación. 2 iteraciones × 1500ms = 3s en total, después vuelve al estado base.

`.reveal.is-on` en el selector garantiza que arranque solo después de que el elemento ya fue revelado.

**Cuidado:** el transform del keyframe (scale) prevalece sobre el `transform: none` de `.reveal.is-on` SOLO durante la animación. Cuando termina, el elemento vuelve al estado `transform: none`. ✓ Es lo esperado.

---

## Wrap arrow con bifurcación

Path SVG continuo que entra por la izquierda, recorre la slide, sale y se bifurca en 2 (o N) destinos.

Arquitectura: 1 trunk + N branches, cada uno un `<path>` separado:

```html
<svg class="flow-svg" viewBox="0 0 1680 600" preserveAspectRatio="none">
  <defs>
    <marker id="flow-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill: var(--cs-primary)"/>
    </marker>
  </defs>
  <!-- Trunk: prompt → top-of-stack → bottom-of-stack → junction -->
  <path class="flow-path flow-trunk reveal" data-step="3" pathLength="1"
        d="M 500 300 C 620 300 840 80 840 135 L 840 460 C 840 510 950 490 1010 490"/>
  <!-- Branch top: junction → target 1 -->
  <path class="flow-path flow-branch reveal" data-step="4" pathLength="1" marker-end="url(#flow-tip)"
        d="M 1010 490 C 1110 490 1190 350 1290 195"/>
  <!-- Branch bot: junction → target 2 -->
  <path class="flow-path flow-branch reveal" data-step="4" pathLength="1" marker-end="url(#flow-tip)" style="--d:80ms"
        d="M 1010 490 C 1110 490 1230 510 1325 510"/>
</svg>
```

```css
.flow-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; overflow: visible; }
.flow-path { fill: none; stroke: var(--cs-primary); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.flow-path.reveal {
  opacity: 0; transform: none !important;
  stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset 1100ms cubic-bezier(0.65, 0.05, 0.36, 1), opacity 200ms ease;
  transition-delay: var(--d, 0ms);
}
.flow-path.reveal.is-on { opacity: 1; stroke-dashoffset: 0; }
.flow-branch.reveal { transition: stroke-dashoffset 800ms cubic-bezier(0.65, 0.05, 0.36, 1), opacity 200ms ease; }
```

**Truco de z-index:** si el trunk pasa "por detrás" de elementos (ej. a través de pills blancas centrales), pon el SVG en `z-index: 1` y los elementos en `z-index: 2`. El path se dibuja pero queda oculto por los fondos blancos de las pills — aparece visualmente solo en los tramos entre una pill y otra.

---

## Connector trunk + N branches que se bifurcan

Versión compacta del wrap arrow para "1 input → N outputs". Pensado para "1 input → N outputs" (workflow box → 3 output cards).

```html
<svg class="conn" viewBox="0 0 600 70" preserveAspectRatio="none">
  <defs>
    <marker id="conn-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill: var(--cs-primary)"/>
    </marker>
  </defs>
  <!-- Trunk: input bottom → junction (vertical short) -->
  <path class="conn-path conn-trunk reveal" data-step="4" pathLength="1" d="M 300 0 L 300 26"/>
  <!-- 3 branches fanning out from junction -->
  <path class="conn-path conn-branch reveal" data-step="4" pathLength="1" marker-end="url(#conn-tip)" style="--d:300ms"
        d="M 300 26 C 240 36 150 52 100 64"/>
  <path class="conn-path conn-branch reveal" data-step="4" pathLength="1" marker-end="url(#conn-tip)" style="--d:300ms"
        d="M 300 26 L 300 64"/>
  <path class="conn-path conn-branch reveal" data-step="4" pathLength="1" marker-end="url(#conn-tip)" style="--d:300ms"
        d="M 300 26 C 360 36 450 52 500 64"/>
</svg>
```

CSS análoga al wrap arrow. El trunk arranca en el step (delay 0), las 3 branches arrancan con delay 300ms (así el trunk termina primero y después las 3 disparan juntas hacia los targets).

El viewBox `0 0 600 70` es arbitrario — el SVG se estira al container con `preserveAspectRatio="none"`. Las coordenadas están en unidades del viewBox (centro=300, targets=100/300/500).

---

## Popup overlay con backdrop-blur

Card centrada que aparece sobre la slide con backdrop blur. Se usa para momentos de payoff final.

```html
<div class="popup-wrap reveal" data-step="5">
  <div class="popup-backdrop"></div>
  <div class="popup-card">
    <h3>That's your <span class="grad-word">real work</span></h3>
  </div>
</div>
```

```css
.popup-wrap {
  position: absolute; inset: 0; z-index: 50;
  pointer-events: none;
}
/* CRITICAL: el wrap NO usa el fade default de .reveal — animamos solo a los hijos */
.popup-wrap.reveal { opacity: 1; transform: none; }

.popup-backdrop {
  position: absolute; inset: 0;
  background: rgba(247, 246, 242, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.popup-card {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%) scale(0.94);
  background: var(--cs-surface);
  border: 1px solid var(--cs-border);
  border-radius: 26px;
  padding: 56px 80px;
  box-shadow: 0 24px 72px rgba(0,0,0,0.20);
  text-align: center;
  max-width: 1100px;
  opacity: 0;
  transition:
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: 80ms;
}
.popup-card h3 {
  font-size: 64px; font-weight: 800;
  color: var(--cs-black);
  margin: 0; line-height: 1.05;
  letter-spacing: -0.025em;
}

.popup-wrap.reveal.is-on { pointer-events: auto; }
.popup-wrap.reveal.is-on .popup-backdrop { opacity: 1; }
.popup-wrap.reveal.is-on .popup-card {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
```

**Cuidado:** el wrap tiene que hacer override de `.reveal { opacity: 0; transform: translateY(16px); }` porque si no todo el overlay (backdrop + card) haría el fade-in en grupo en vez de las dos entradas independientes (backdrop fade + card scale-in con delay). El override `opacity: 1; transform: none` en el wrap delega la animación a los hijos.

---

## SVG packets animados a lo largo de un path (loop continuo)

Paquetes que viajan a lo largo de un path infinitamente, sin JS. Pensado para diagramas de ecosistema (feeds + enriches).

```html
<svg class="eco-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
  <defs>
    <!-- Path invisible referenciado por animateMotion -->
    <path id="feeds-path" d="M 460 540 C 660 540, 660 180, 460 180" />
  </defs>

  <!-- Path visible (renderizado con stroke) -->
  <path class="eco-path reveal" data-step="3" pathLength="1"
        d="M 460 540 C 660 540, 660 180, 460 180"
        marker-end="url(#tip)"/>

  <!-- Packet 1: arranca a los 0s, dura 5s, en loop -->
  <g class="eco-packet">
    <rect x="-30" y="-12" width="60" height="24" rx="4" style="fill: var(--cs-primary)"/>
    <text x="0" y="4" text-anchor="middle" style="fill: var(--cs-on-primary)" font-size="11">Q3 margin</text>
    <animateMotion dur="5s" begin="0s" repeatCount="indefinite">
      <mpath href="#feeds-path"/>
    </animateMotion>
  </g>

  <!-- Packet 2: mismo path, arranca a 1.25s (stagger 25%) -->
  <g class="eco-packet">
    <rect ...>
    <animateMotion dur="5s" begin="1.25s" repeatCount="indefinite">
      <mpath href="#feeds-path"/>
    </animateMotion>
  </g>
</svg>
```

Para `<animateMotion>`:
- `dur` = duración de una vuelta completa del packet sobre el path
- `begin="Xs"` = delay inicial (la primera vez que arranca)
- `repeatCount="indefinite"` = infinito
- `<mpath href="#id">` referencia el path a seguir (tiene que tener `id`)

Stagger de 4 packets sobre un path de 5s: `begin="0s"`, `1.25s`, `2.5s`, `3.75s` → uno pasa cada 1.25s.

---

## Anillos pulsantes (ping concéntrico)

Círculos que pulsan emitiendo ondas al infinito (piensa en Apple AirDrop). Pensado para nodos activos (chat/contexto).

```html
<div class="eco-node">
  <div class="eco-ring reveal" data-step="3" style="--ringDelay:0s"></div>
  <div class="eco-ring reveal" data-step="3" style="--ringDelay:1.3s"></div>
  <div class="eco-ring reveal" data-step="3" style="--ringDelay:2.6s"></div>
  <div class="eco-dot"></div>
</div>
```

```css
.eco-node { position: relative; width: 80px; height: 80px; }
.eco-dot { position: absolute; inset: 0; background: var(--cs-primary); border-radius: 50%; }
.eco-ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 2px solid var(--cs-primary);
  pointer-events: none;
}
@keyframes ecoPing {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0;   }
}
section[data-active="true"] .eco-ring.is-on {
  animation: ecoPing 4s cubic-bezier(0.22, 1, 0.36, 1) var(--ringDelay, 0s) infinite backwards;
}
```

**Cuidado CRÍTICO — `animation-fill-mode: backwards`.** Sin `backwards`, durante el delay (`var(--ringDelay)`) el elemento queda VISIBLE-estático (porque `.is-on` setea `opacity: 1`) pero el keyframe todavía no arrancó. Resultado: anillo lleno e inmóvil durante N segundos antes de empezar a pulsar. `backwards` aplica el keyframe `0%` (que tiene `opacity: 0.6` → se vuelve transparente al 100% durante el delay) → invisible hasta el primer ping.

---

## Magic-move: archivos que vuelan

Archivos dispersos que son "absorbidos" por un agent (translate + scale + fade al disparar un step).

```html
<div class="files-cluster">
  <div class="file-tile reveal" data-step="2" style="--x:-120px; --y:-80px; --rot:rotate(-12deg); --fly-d:0ms">PDF</div>
  <div class="file-tile reveal" data-step="2" style="--x:80px; --y:-100px; --rot:rotate(8deg); --fly-d:80ms">DOC</div>
  <div class="file-tile reveal" data-step="2" style="--x:-60px; --y:60px; --rot:rotate(-5deg); --fly-d:160ms">SHEET</div>
  <!-- ...más archivos con distintos --x, --y, --rot, --fly-d -->
</div>
```

```css
.files-cluster { position: relative; height: 400px; }
.file-tile {
  position: absolute;
  left: 50%; top: 50%;
  width: 80px; height: 100px;
  background: var(--cs-surface);
  border-radius: 8px;
  /* CRITICAL: 4-function transform list, idéntica en TODOS los estados */
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, rotate(0deg)) scale(1);
  transition: opacity 520ms, transform 520ms;
}
/* override del default de .reveal — preserva el 4-function transform aún apagado */
.file-tile.reveal {
  opacity: 0;
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, rotate(0deg)) scale(1);
}
.file-tile.reveal.is-on {
  opacity: 1;
  /* same transform list */
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, rotate(0deg)) scale(1);
}
/* Step 4: los archivos vuelan hacia la derecha + se achican */
section[data-active="true"][data-current-step="4"] .file-tile.reveal.is-on {
  opacity: 0;
  transform:
    translate(-50%, -50%)
    translate(calc(var(--x, 0px) + 280px), calc(var(--y, 0px) - 30px))
    var(--rot, rotate(0deg))
    scale(0.4);
  transition: opacity 800ms, transform 800ms;
  transition-delay: var(--fly-d, 0ms);
}
```

**Cuidado CRÍTICO — normalizar la lista de funciones del transform.** Los 4 estados (`.file-tile`, `.reveal`, `.reveal.is-on`, step-4) TIENEN que tener la misma lista de funciones `translate(...) translate(...) <rotate> scale(...)` en el mismo orden. Si uno solo tiene 3 funciones y los demás 4, el navegador hace matrix decomposition en el primer paint, falla, y los archivos no se ven o parpadean.

---

## Cuidados críticos (transversales)

**`marker-end` de SVG visible aunque el path esté oculto.**
`stroke-dashoffset` oculta el trazo pero el `marker-end` queda visible en el punto geométrico final. Siempre poner opacity 0 → 1 en transición sobre el elemento path.

**Delays de animación en loops infinitos — usar `backwards`.**
Sin `animation-fill-mode: backwards`, el elemento queda visible-estático durante el delay porque el keyframe todavía no arrancó. `backwards` aplica el keyframe `0%` (típicamente opacity 0) durante el delay.

**Specificity wars con `.reveal.is-on { transform: none }`.**
Esta regla del template PISA los transforms de centrado (`translate(-50%, -50%)`, `translateX(-50%)`). Para preservarlos usa especificidad más alta:
```css
.my-centered.reveal.is-on { transform: translate(-50%, -50%); }
```

**Transform function list distinta entre estados → falla la matrix decomposition.**
Si los estados de la transición tienen distinta cantidad de transform functions, el navegador intenta hacer matrix decomposition y suele fallar. Normaliza la lista: mismas funciones, mismo orden, en todos los estados.

**Renumerar slides: siempre con `scripts/renumber.mjs`** (ver `reference/add.md`), nunca con reemplazos de texto encadenados: cada pasada degrada el número recién reemplazado.

**Transform en el SVG por culpa de `.reveal`.**
El default `.reveal { transform: translateY(16px); }` desplaza todo el SVG path 16px hacia abajo. En cualquier elemento SVG con `.reveal`, haz override: `transform: none !important;`.

**Íconos: siempre SVG inline** de `reference/icons.md`. El template no carga ninguna librería de íconos.
