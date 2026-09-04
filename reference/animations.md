# Claude Slides — Animations

Catalog di tecniche di animazione per deck con `template.html`. Ogni tecnica include solo quello che serve per farla funzionare: snippet copia-incolla + i bug da evitare.

**La decision logic "static vs animated" sta in `SKILL.md` Phase 4.5.** Qui ci sono solo le tecniche.

---

## Foundation — il modello a step

Tutta l'infrastruttura sta in `template.html`. Devi solo capire 4 cose:

1. **Sulla `<section>`** metti `data-steps="N"` (totale step) + `data-current-step="0"` (init).
2. **Sugli elementi** che vuoi rivelare metti `class="reveal" data-step="K"` (K = step in cui appaiono).
3. **Il step controller** (già nel template) intercetta `→`/`←`/`Spazio` PRIMA di deck-stage. Avanza lo step interno se possibile, altrimenti lascia passare e deck-stage cambia slide.
4. **Quando arrivi sulla slide**, `resetAndEnter` rimuove tutti gli `.is-on`, poi rimette `.is-on` su data-step <= 1 → la prima reveal animate sull'entrata.

**Slide statica**: NON metti `.reveal`, setti `data-steps="1" data-current-step="1"`.

**Slide minima animata:**

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

## Reveal stagger — più elementi, stesso step, ritardo crescente

Per fare apparire più cards una dopo l'altra al medesimo step, usa `style="--d:Nms"`:

```html
<div class="card reveal" data-step="2">First, no delay</div>
<div class="card reveal" data-step="2" style="--d:120ms">Second</div>
<div class="card reveal" data-step="2" style="--d:240ms">Third</div>
```

`--d` è già letto da `.reveal { transition-delay: var(--d, 0ms); }` nel template.

---

## Counter ticking — numero che sale a target

Built-in nel template (`runCounter`). Marca un elemento con:

```html
<span class="big-number"
      data-counter="2400"
      data-target-step="3">0<span class="unit">k</span></span>
```

`data-counter` = target finale. `data-target-step` = step in cui parte. Easing ease-out-quint, durata 1400ms. Il `.unit` opzionale (es. "k", "%", "€") viene preservato durante il tick.

Sotto i 1000 il numero è int (`123`), tra 1k e 100k formatta come `2.4k`, sopra 100k come `240k`.

---

## SVG path drawing — la freccia che si disegna

Pattern base di tutte le frecce animate. Il path viene "disegnato" trascinando `stroke-dashoffset` da `1` a `0`. Usa `pathLength="1"` per normalizzare a prescindere dalla lunghezza geometrica reale.

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

**Gotcha #1 — transform sull'SVG.** `.reveal` di default applica `transform: translateY(16px)` per il fade-in. Su un SVG path questo SHIFTA tutto il path 16px in basso → coordinate sballate. Forza `transform: none !important;`.

**Gotcha #2 — opacity necessaria anche col dashoffset.** Senza opacity, l'eventuale `marker-end` (la freccia) resta visibile al punto geometrico finale del path PRIMA che il tratto disegnato lo raggiunga. Tieni sempre opacity 0 → 1 in transizione.

### Tangenti smooth ai corner

Per evitare angoli secchi tra segmenti (linea verticale → curva orizzontale), il control point della curva deve avere la stessa direzione del segmento adiacente.

Esempio: linea verticale che termina a `(840, 460)` poi curva verso destra. Per restare "smooth":

```
L 840 460 C 840 510 950 490 1010 490
       ^      ^
       |      control1 a (840, 510) → tangente verticale-giù dalla linea
       |
       end of vertical segment
```

Se invece metti `C 880 460 950 490 1010 490`, il control1 NON è verticale rispetto al segmento precedente → corner secco.

---

## SVG marker arrow tip

Definisci un `<marker>` nel `<defs>` e applicalo via `marker-end`:

```html
<svg ...>
  <defs>
    <marker id="my-tip" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#2563EB"/>
    </marker>
  </defs>
  <path ... marker-end="url(#my-tip)"/>
</svg>
```

`refX="9"` → la punta del marker è 1 unità oltre il punto finale del path. Se vuoi che la punta cada esattamente sul target, end the path slightly before.

---

## Pulse triggered by current step

Per far pulsare un elemento solo quando la slide è a step X, usa il selettore `data-current-step`:

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

Quando `applyStep` setta `data-current-step="4"` sulla section, l'animazione parte. 2 iterazioni × 1500ms = 3s totale, poi torna allo stato base.

`.reveal.is-on` nel selettore garantisce che parta solo dopo che l'elemento è stato rivelato.

**Gotcha:** il transform della keyframe (scale) prevale sul `transform: none` di `.reveal.is-on` SOLO durante l'animazione. Quando finisce, l'elemento torna allo stato `transform: none`. ✓ Voluto.

---

## Wrap arrow con biforcation

Path SVG continuo che entra dal sx, percorre la slide, esce e si biforca in 2 (o N) destinazioni.

Architettura: 1 trunk + N branches, ognuno è un `<path>` separato:

```html
<svg class="flow-svg" viewBox="0 0 1680 600" preserveAspectRatio="none">
  <defs>
    <marker id="flow-tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#2563EB"/>
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

**Trick z-index:** se il trunk passa "dietro" elementi (es. attraverso pills bianche centrali), metti SVG `z-index: 1` e gli elementi `z-index: 2`. Il path è disegnato ma nascosto dai background bianchi delle pill — appare visivamente solo nei tratti tra una pill e l'altra.

---

## Connector trunk + N branches biforking

Versione compatta del wrap arrow per "1 input → N outputs". Pensato per "1 input → N output" (workflow box → 3 output cards).

```html
<svg class="conn" viewBox="0 0 600 70" preserveAspectRatio="none">
  <defs>
    <marker id="conn-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#2563EB"/>
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

CSS analoga al wrap arrow. Il trunk parte allo step (delay 0), le 3 branches partono con delay 300ms (così trunk completa prima e poi le 3 sparano insieme verso i target).

ViewBox `0 0 600 70` è arbitrario — l'SVG si stretcha al container con `preserveAspectRatio="none"`. Le coordinate sono in viewBox-units (centro=300, target=100/300/500).

---

## Popup overlay con backdrop-blur

Card centrata che appare sopra la slide con backdrop blur. Usato per momenti di payoff finale.

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
/* CRITICAL: il wrap NON usa il fade default di .reveal — animiamo solo i figli */
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
  background: #fff;
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

**Gotcha:** il wrap deve override-are `.reveal { opacity: 0; transform: translateY(16px); }` perché altrimenti l'intero overlay (backdrop + card) farebbe il fade-in di gruppo invece dei due ingressi indipendenti (backdrop fade + card scale-in con delay). L'override `opacity: 1; transform: none` sul wrap delega l'animazione ai figli.

---

## Animated SVG packets along path (continuous loop)

Pacchetti che viaggiano lungo un path infinitamente, no JS. Pensato per diagrammi ecosystem (feeds + enriches).

```html
<svg class="eco-svg" viewBox="0 0 800 600" preserveAspectRatio="none">
  <defs>
    <!-- Path invisibile riferito da animateMotion -->
    <path id="feeds-path" d="M 460 540 C 660 540, 660 180, 460 180" />
  </defs>

  <!-- Path visibile (renderizzato con stroke) -->
  <path class="eco-path reveal" data-step="3" pathLength="1"
        d="M 460 540 C 660 540, 660 180, 460 180"
        marker-end="url(#tip)"/>

  <!-- Packet 1: parte a 0s, durata 5s, looped -->
  <g class="eco-packet">
    <rect x="-30" y="-12" width="60" height="24" rx="4" fill="#2563EB"/>
    <text x="0" y="4" text-anchor="middle" fill="#fff" font-size="11">Q3 margin</text>
    <animateMotion dur="5s" begin="0s" repeatCount="indefinite">
      <mpath href="#feeds-path"/>
    </animateMotion>
  </g>

  <!-- Packet 2: stesso path, parte a 1.25s (stagger 25%) -->
  <g class="eco-packet">
    <rect ...>
    <animateMotion dur="5s" begin="1.25s" repeatCount="indefinite">
      <mpath href="#feeds-path"/>
    </animateMotion>
  </g>
</svg>
```

Per `<animateMotion>`:
- `dur` = durata di un giro completo del packet sul path
- `begin="Xs"` = ritardo iniziale (prima volta che parte)
- `repeatCount="indefinite"` = infinito
- `<mpath href="#id">` riferisce il path da seguire (deve avere `id`)

Stagger di 4 packets su path da 5s: `begin="0s"`, `1.25s`, `2.5s`, `3.75s` → uno passa ogni 1.25s.

---

## Pulsing rings (concentric ping)

Cerchi che pulsano emettendo onde all'infinito (think Apple AirDrop). Pensato per nodi attivi (chat/context).

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

**Gotcha CRITICO — `animation-fill-mode: backwards`.** Senza `backwards`, durante il delay (`var(--ringDelay)`) l'elemento è VISIBILE-statico (perché `.is-on` setta opacity: 1) ma la keyframe non è ancora partita. Risultato: ring pieno e immobile per N secondi prima di iniziare a pulsare. `backwards` applica il keyframe `0%` (che ha `opacity: 0.6` → diventa transparent al 100% durante il delay) → invisibile fino al primo ping.

---

## Magic-move file fly-away

Files sparpagliati che vengono "assorbiti" da un agent (translate + scale + fade su step trigger).

```html
<div class="files-cluster">
  <div class="file-tile reveal" data-step="2" style="--x:-120px; --y:-80px; --rot:rotate(-12deg); --fly-d:0ms">PDF</div>
  <div class="file-tile reveal" data-step="2" style="--x:80px; --y:-100px; --rot:rotate(8deg); --fly-d:80ms">DOC</div>
  <div class="file-tile reveal" data-step="2" style="--x:-60px; --y:60px; --rot:rotate(-5deg); --fly-d:160ms">SHEET</div>
  <!-- ...più file con varie --x, --y, --rot, --fly-d -->
</div>
```

```css
.files-cluster { position: relative; height: 400px; }
.file-tile {
  position: absolute;
  left: 50%; top: 50%;
  width: 80px; height: 100px;
  background: #fff;
  border-radius: 8px;
  /* CRITICAL: 4-function transform list, identico in TUTTI gli stati */
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, none) scale(1);
  transition: opacity 520ms, transform 520ms;
}
/* .reveal default override — preserva il 4-function transform anche da spento */
.file-tile.reveal {
  opacity: 0;
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, none) scale(1);
}
.file-tile.reveal.is-on {
  opacity: 1;
  /* same transform list */
  transform: translate(-50%, -50%) translate(var(--x, 0px), var(--y, 0px)) var(--rot, none) scale(1);
}
/* Step 4: i file volano via verso destra + shrinkano */
section[data-active="true"][data-current-step="4"] .file-tile.reveal.is-on {
  opacity: 0;
  transform:
    translate(-50%, -50%)
    translate(calc(var(--x, 0px) + 280px), calc(var(--y, 0px) - 30px))
    var(--rot, none)
    scale(0.4);
  transition: opacity 800ms, transform 800ms;
  transition-delay: var(--fly-d, 0ms);
}
```

**Gotcha CRITICO — normalizzare la transform function list.** Tutti i 4 stati (`.file-tile`, `.reveal`, `.reveal.is-on`, step-4) DEVONO avere la stessa lista di funzioni `translate(...) translate(...) <rotate> scale(...)` in stesso ordine. Se uno solo ha 3 funzioni e gli altri 4, il browser fa matrix decomposition al primo paint, fallisce, e i file non si vedono o sfarfallano.

---

## Critical gotchas (cross-cutting)

**SVG `marker-end` visibile a path nascosto.**
Stroke-dashoffset nasconde il tratto ma il marker-end resta visibile al punto geometrico finale. Sempre opacity 0 → 1 in transizione sull'elemento path.

**Animation delays su loop infinite — usa `backwards`.**
Senza `animation-fill-mode: backwards`, l'elemento è visible-static durante il delay perché la keyframe non è ancora partita. `backwards` applica il keyframe `0%` (tipicamente opacity 0) durante il delay.

**Specificity wars con `.reveal.is-on { transform: none }`.**
Questa regola del template OVERRIDA i transform di centramento (`translate(-50%, -50%)`, `translateX(-50%)`). Per preservarli usa specificity alzata:
```css
.my-centered.reveal.is-on { transform: translate(-50%, -50%); }
```

**Transform function list mismatch su matrix decomposition.**
Se gli stati di transizione hanno numero diverso di transform functions, il browser tenta matrix decomposition e spesso fallisce. Normalizza la lista: stesse funzioni stesso ordine in tutti gli stati.

**Sed cascade in renumerazione slide.**
NON usare `sed -e 's/19/18/' -e 's/18/17/' ...` per renumerare slide N → N-1. Ogni pass demota anche il numero appena rimpiazzato. Usa Python con counter sequenziale:
```python
import re
counter = [0]
def replace(_):
    counter[0] += 1
    return f'<span class="num">{counter[0]:02d}</span>'
re.sub(r'<span class="num">\d+</span>', replace, content)
```

**Transform sull'SVG da `.reveal`.**
Il default `.reveal { transform: translateY(16px); }` shifta tutto l'SVG path 16px in basso. Su qualsiasi elemento SVG con `.reveal`, override: `transform: none !important;`.

**Lucide `createIcons()` non rilancia su elementi nuovi.**
`lucide.createIcons()` è chiamato una volta a load. Se aggiungi un `<i data-lucide="X">` mid-document (es. dopo render iniziale, o copiando un componente da `components.md`), lucide non lo sostituisce automaticamente con SVG — l'icona resta invisibile.

Workaround consigliato: usa **SVG inline** invece di lucide per icone "fissate" nel deck (logo brand, social icons, decorazioni). Lucide va bene per icon-set decisi al momento dell'authoring iniziale; per qualunque cosa aggiunta dopo, inline.

```html
<!-- ❌ rischio non-render se aggiunto dopo load -->
<i data-lucide="linkedin"></i>

<!-- ✅ inline, sempre visibile -->
<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="..."/>
</svg>
```

Oppure, se serve davvero lucide post-load, rilancia manualmente: `lucide.createIcons();` dopo l'inserimento.
