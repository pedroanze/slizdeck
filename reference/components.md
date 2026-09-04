# Layout Components

Catalogo dei layout pattern compatibili con `template.html` (deck-stage 1920×1080). Per ogni pattern: quando usarlo, wireframe ASCII, HTML+CSS pronti da copiare.

**Convenzioni di tutti i pattern:**
- Ogni slide è una `<section>` dentro `<deck-stage>` con `data-label="NN Title"` e step model (`data-steps`/`data-current-step`)
- Frame standard: `<div class="pad">` (padding 96/120, contenuto top-aligned) o `<div class="pad center">` (centered, per cover/transition)
- Footer sempre in fondo: `<div class="footer">...<span class="num">NN</span></div>`
- CSS base (typography, footer, .reveal, .act-marker, viewer chrome) **già in template.html** — non serve riportarli
- Per le animazioni (popup, SVG path drawing, magic-move, packets) vedi **`animations.md`**

---

## Famiglia 1 — Cover & Transition

### `cover-gradient`

**Quando:** prima slide (titolo + autore + data) o ultima slide (call-to-action / "Ora vediamolo dal vivo"). Statica.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│                                          │
│   EYEBROW                                │
│                                          │
│   Titolo grande                          │
│   bianco                                 │
│                                          │
│   Sottotitolo opzionale                  │
│                                          │
└──────────────────────────────────────────┘
   bg gradient primary→secondary
```

**HTML:**
```html
<section class="grad" data-label="01 Cover" data-steps="1" data-current-step="1">
  <div class="pad center">
    <div class="eyebrow">Workshop · DATE · ORG</div>
    <h1 class="cover">Deck Title Here</h1>
    <div class="subtitle">Optional one-sentence subtitle that frames what this is about</div>
  </div>
  <div class="footer">
    <div class="left"><img src="assets/logos/logo-white.png" alt="Logo"></div>
    <div>Speaker · Org · <span class="num">01</span></div>
  </div>
</section>
```

**Variante più piccola** (es. demo cover finale): usa `<h1 class="cover-md">` (132px invece di 168px) e niente subtitle.

---

### `transition-cream`

**Quando:** stacco narrativo a metà deck (es. "The shift", "The big picture", "Now what"). Cream bg, titolo grande centrato con ultima parola in gradient. Statica.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│         The big picture                  │
│              ^^^^^^^ in gradient         │
│                                          │
│         Pulling it together              │
│            ^ tagline opzionale, sotto    │
│                                          │
└──────────────────────────────────────────┘
   bg cream
```

**HTML:**
```html
<section data-label="07 Transition" data-steps="1" data-current-step="1">
  <div class="pad center">
    <h1 class="ts-title">The <span class="grad-word">shift</span></h1>
    <div class="ts-tagline">Optional subtitle (toglie se preferisci solo titolo)</div>
  </div>
  <div class="footer">
    <div class="left"></div>
    <div>Speaker · Org · <span class="num">07</span></div>
  </div>
</section>
```

---

## Famiglia 2 — Comparison cards (`.pq-card`)

Pattern signature. Card bianca con eyebrow piccolo + h3 huge + riga "→ CONSEQUENCE" accent mono + body p. Forte impatto, perfetto per Productivity/Quality, Before/Now, Problema/Soluzione, Risk/Help/Protect.

### `pq-card-2col`

**Quando:** comparazione tra 2 concetti (Productivity vs Quality, Before vs Now). 2 cards full-size.

**Wireframe:**
```
[eyebrow]
Slide title

┌──────────────────────────┐  ┌──────────────────────────┐
│                          │  │                          │
│ EYEBROW SMALL            │  │ EYEBROW SMALL            │
│ H3 HUGE 64px             │  │ H3 HUGE 64px             │
│ → CONSEQUENCE ACCENT MONO│  │ → CONSEQUENCE ACCENT MONO│
│ Body paragraph here      │  │ Body paragraph here      │
│                          │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

**HTML:**
```html
<div class="pq-grid">
  <div class="pq-card reveal" data-step="2">
    <div class="pq-eyebrow">Productivity</div>
    <h3>Faster</h3>
    <div class="pq-consequence">→ From hours to minutes</div>
    <p>Body paragraph that explains the consequence in one sentence.</p>
  </div>
  <div class="pq-card reveal" data-step="3">
    <div class="pq-eyebrow">Quality</div>
    <h3>Sharper</h3>
    <div class="pq-consequence">→ Zero generic answers</div>
    <p>Output in your tone, on your sources, by your rules.</p>
  </div>
</div>
```

**CSS** (aggiungere allo `<style>` della slide o a un blocco condiviso):
```css
.pq-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  margin-top: 8px;
}
.pq-card {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 26px;
  padding: 60px 56px;
  box-shadow: var(--cs-shadow-2);
  min-height: 440px;
  display: flex; flex-direction: column;
  justify-content: center;
}
.pq-card .pq-eyebrow {
  font-size: 18px; letter-spacing: 0.18em;
  text-transform: uppercase; font-weight: 700;
  color: var(--cs-primary); margin-bottom: 20px;
}
.pq-card h3 {
  font-size: 64px; font-weight: 800;
  color: var(--cs-black); margin: 0 0 24px;
  line-height: 1.0;
  letter-spacing: -0.025em;
}
.pq-card .pq-consequence {
  font-family: var(--cs-font-mono);
  font-size: 22px; font-weight: 700;
  color: var(--cs-primary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 32px;
}
.pq-card p {
  font-size: 24px; line-height: 1.5;
  color: var(--cs-body); margin: 0;
}
```

**Note:** se preferisci payoff positivo (e.g. una "soluzione"), niente "→" — sostituisci con simbolo neutro o emoji-free phrase.

---

### `pq-card-3col` — variant compact 3-col

**Quando:** 3 facets di uno stesso concetto (Help / Risk / Protect, oppure Past / Present / Future). Stesso pattern ma cards più piccole per stare in 3 colonne.

**HTML:**
```html
<div class="pq-grid-3">
  <div class="pq-card reveal" data-step="2">
    <div class="pq-eyebrow">What they do</div>
    <h3>They help</h3>
    <div class="pq-consequence">→ Not replace</div>
    <p>Agents speed up your capabilities. They don't replace your judgment.</p>
  </div>
  <div class="pq-card reveal" data-step="3">...</div>
  <div class="pq-card reveal" data-step="4">...</div>
</div>
```

**CSS aggiuntivo** (oltre a `.pq-card` base):
```css
.pq-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 8px;
}
.pq-grid-3 .pq-card {
  padding: 36px 38px;
  min-height: 320px;
}
.pq-grid-3 .pq-card h3 { font-size: 44px; margin: 0 0 18px; }
.pq-grid-3 .pq-card .pq-consequence { font-size: 18px; margin: 0 0 22px; }
.pq-grid-3 .pq-card p { font-size: 20px; }
```

---

## Famiglia 3 — Card grids generiche

### `card-grid-3col-numbered`

**Quando:** 3 modes/options/fasi numerate (es. tre modi di usare l'AI). Card bianca con numero accent + titolo + body + badge stato opzionale.

**HTML:**
```html
<div class="num-grid">
  <div class="num-card reveal" data-step="2">
    <div class="num-card-num">01</div>
    <h3>Single chat</h3>
    <p>One question, one answer. Tomorrow it starts from zero.</p>
    <span class="badge badge-red">No memory</span>
  </div>
  <!-- repeat 02, 03 with appropriate data-step -->
</div>
```

**CSS:**
```css
.num-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 8px;
}
.num-card {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 22px;
  padding: 36px 38px;
  box-shadow: var(--cs-shadow-2);
  display: flex; flex-direction: column; gap: 12px;
}
.num-card-num {
  font-family: var(--cs-font-mono);
  font-size: 28px; font-weight: 800;
  color: var(--cs-primary);
  line-height: 1;
}
.num-card h3 {
  font-size: 32px; font-weight: 700;
  color: var(--cs-black); margin: 0;
  line-height: 1.15;
}
.num-card p {
  font-size: 20px; line-height: 1.5;
  color: var(--cs-body); margin: 0;
}
```

---

### `card-grid-4col`

**Quando:** 4 punti correlati (warnings, principles, rules). Cards più piccole, 2×2 grid o riga unica.

**HTML:**
```html
<div class="warn-grid">
  <div class="warn-card reveal" data-step="2">
    <div class="warn-num-row">
      <span class="warn-num">01</span>
      <span class="warn-icon"><i data-lucide="alert-triangle"></i></span>
    </div>
    <h3>Errors and hallucinations</h3>
    <p>Less frequent with clean context, but always possible. Verify important outputs.</p>
  </div>
  <!-- repeat 02 (data-step=3), 03 (=4), 04 (=5) for one-by-one reveal -->
</div>
```

**CSS:**
```css
.warn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 30px;
  margin-top: 16px;
}
.warn-card {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 26px;
  padding: 38px 44px;
  box-shadow: var(--cs-shadow-2);
  display: flex; flex-direction: column;
  justify-content: center;
}
.warn-num-row {
  display: flex; align-items: center; gap: 18px; margin-bottom: 20px;
}
.warn-num {
  font-family: var(--cs-font-mono);
  font-size: 34px; font-weight: 800;
  color: var(--cs-primary);
  line-height: 1;
}
.warn-icon {
  width: 54px; height: 54px;
  border-radius: 14px;
  background: rgba(37,99,235,0.10);
  color: var(--cs-primary);
  display: grid; place-items: center;
}
.warn-icon i { width: 28px; height: 28px; }
.warn-card h3 {
  font-size: 34px; font-weight: 700;
  color: var(--cs-black); margin: 0 0 16px;
  line-height: 1.1;
  letter-spacing: -0.015em;
}
.warn-card p {
  font-size: 22px; line-height: 1.5;
  color: var(--cs-body); margin: 0;
}
```

**Variante 1×4 (riga unica)**: cambia `grid-template-columns: repeat(4, 1fr)` e droppa `grid-template-rows`. Cards più strette.

---

## Famiglia 4 — Mockups

Per fare meta-references (mostrare il deck stesso, l'app del cliente, un documento di esempio). Tutti basati su contenitore + chrome stilizzato + contenuto astratto/reale.

### `file-mockup` — PDF / DOC / PPT cards

**Quando:** mostrare visivamente file "umani" (PDF formattato, DOC, presentazione 16:9). Card bianca con tab colorato in alto + righe astratte come placeholder testo.

**HTML:**
```html
<div class="file-cluster">
  <div class="file-mockup file-pdf">
    <div class="file-tab">PDF</div>
    <div class="file-lines">
      <div class="ln"></div><div class="ln s"></div><div class="ln"></div>
      <div class="ln xs"></div><div class="ln m"></div>
    </div>
  </div>
  <div class="file-mockup file-doc">
    <div class="file-tab">DOC</div>
    <div class="file-lines">...</div>
  </div>
  <div class="file-mockup file-ppt">
    <div class="file-tab">PPT</div>
    <div class="file-lines">...</div>
  </div>
</div>
```

**CSS:**
```css
.file-cluster {
  position: relative;
  display: flex; gap: 24px;
  align-items: center; justify-content: center;
}
.file-mockup {
  width: 130px; height: 170px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
  padding: 12px;
  display: flex; flex-direction: column; gap: 14px;
  position: relative;
}
.file-mockup.file-ppt { width: 250px; height: 140px; }  /* 16:9 ratio */
.file-mockup.file-pdf { transform: rotate(-10deg); }
.file-mockup.file-doc { transform: rotate(8deg); }
.file-mockup.file-ppt { transform: rotate(-3deg); }
.file-tab {
  font-family: var(--cs-font-mono);
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.10em;
  color: #fff;
  background: var(--cs-primary);
  padding: 4px 10px; border-radius: 4px;
  align-self: flex-start;
}
.file-doc .file-tab { background: #2563eb; }
.file-ppt .file-tab { background: #ea580c; }
.file-lines { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.file-lines .ln {
  height: 4px; border-radius: 2px;
  background: rgba(0,0,0,0.10);
}
.file-lines .ln.s { width: 75%; }
.file-lines .ln.xs { width: 50%; }
.file-lines .ln.m { width: 88%; }
```

---

### `terminal-dark` — markdown terminal mockup (variante scura)

**Quando:** mostrare un file `.md` come terminal scuro con traffic light dots + filename + body syntax-highlighted. Forte segnale "questo è un file per agent".

**HTML:**
```html
<div class="term term-dark">
  <div class="term-bar">
    <span class="dot r"></span><span class="dot a"></span><span class="dot g"></span>
    <span class="fn">CLAUDE.md</span>
  </div>
  <div class="term-body">
    <div class="mh"># Team</div>
    <div class="mp">Ada · CEO</div>
    <div class="mp">Sam · Ops</div>
    <div class="mh"># Do</div>
    <div class="mi">- Always cross-check dates</div>
    <div class="mi">- IT for outputs, EN for internal</div>
  </div>
</div>
```

**CSS:**
```css
.term {
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0,0,0,0.28);
}
.term .term-bar {
  background: #2a2a3e;
  padding: 10px 14px;
  display: flex; align-items: center; gap: 7px;
}
.term .term-bar .dot { width: 11px; height: 11px; border-radius: 50%; }
.term .term-bar .dot.r { background: #ff5f56; }
.term .term-bar .dot.a { background: #ffbd2e; }
.term .term-bar .dot.g { background: #27c93f; }
.term .term-bar .fn {
  color: rgba(255,255,255,0.55);
  font-size: 13px;
  font-family: var(--cs-font-mono);
  margin-left: 8px;
}
.term .term-body {
  padding: 18px 22px;
  font-family: var(--cs-font-mono);
  font-size: 14px; line-height: 1.65;
}
.term .term-body .mh { color: #8FB8FF; font-weight: 700; }   /* heading accent */
.term .term-body .mp { color: #d4d4d4; }                      /* paragraph */
.term .term-body .mp strong { color: #fff; font-weight: 700; }
.term .term-body .mi { color: #88c0d0; }                      /* list item blue */
```

---

### `terminal-light` — variant chiara dentro card bianca

**Quando:** miniatura `.md` dentro una card (es. preview di file types in una row di 3 cards). Più sobrio di terminal-dark, integrato visivamente con cream/white.

**HTML:**
```html
<div class="card">
  <h3>Reusable workflows</h3>
  <p>Saved prompts as files. Auto-discovered.</p>
  <div class="mini-term">
    <div class="ml"># Trigger</div>
    <div class="ml"># Inputs</div>
    <div class="ml"># Steps</div>
    <div class="ml"># Outputs</div>
  </div>
</div>
```

**CSS:**
```css
.mini-term {
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 14px 18px;
  margin-top: auto;  /* push to bottom of card */
  font-family: var(--cs-font-mono);
  display: flex; flex-direction: column; gap: 8px;
}
.mini-term .ml {
  color: var(--cs-primary);
  font-weight: 700;
  font-size: 14px;
}
```

---

### `mobile-mockup` — phone shell (es. app screenshot)

**Quando:** mostrare un'app mobile come parte di una composizione (es. "il prompt produce questa app").

**HTML (struttura base):**
```html
<div class="phone-shell">
  <div class="phone-content">
    <img class="ph-logo" src="assets/logos/your-logo.png" alt="">
    <div class="ph-greet">
      <div class="ph-date">DATE LABEL</div>
      <div class="ph-hello">Hello, <span class="ph-name">User</span></div>
    </div>
    <div class="ph-card">[main feature card]</div>
    <div class="ph-actions-grid">
      <div class="ph-action-big"></div>
      <div class="ph-action-col">
        <div class="ph-action-mini"></div>
        <div class="ph-action-mini"></div>
      </div>
    </div>
  </div>
</div>
```

**CSS minima** (adatta dimensioni e contenuti al tuo caso):
```css
.phone-shell {
  width: 200px; height: 380px;
  border-radius: 28px;
  background: var(--cs-cream);
  border: 7px solid #1a1a1a;
  box-shadow: 0 18px 36px rgba(0,0,0,0.20);
  overflow: hidden;
}
.phone-content {
  padding: 14px 12px 12px;
  display: flex; flex-direction: column; gap: 10px;
  height: 100%; box-sizing: border-box;
}
.ph-logo { height: 18px; align-self: flex-start; }
.ph-hello {
  font-size: 22px; font-weight: 800; color: var(--cs-black);
  letter-spacing: -0.02em;
}
.ph-hello .ph-name {
  background: var(--cs-grad-text);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ph-actions-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 7px; flex: 1;
}
.ph-action-big {
  background: var(--cs-grad-linear);
  border-radius: 11px;
  box-shadow: 0 4px 12px rgba(37,99,235,0.25);
}
.ph-action-mini {
  background: #fff;
  border-radius: 11px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.04);
}
```

**Note:** il phone è ~200×380. Per slide più piccole/grandi proporziona di conseguenza (mantieni aspect ~1:2).

---

### `deck-cover-replica` — mini deck 16:9

**Quando:** mostrare il deck come un thumbnail (meta-reference, es. "this slide deck is the result of this flow").

**HTML:**
```html
<div class="deck-shell">
  <div class="deck-content">
    <div class="deck-eyebrow">Workshop · DATE</div>
    <div class="deck-title">Deck Title</div>
    <div class="deck-subtitle">One-line subtitle that frames the deck</div>
  </div>
</div>
```

**CSS:**
```css
.deck-shell {
  width: 320px; height: 180px;  /* 16:9 */
  border-radius: 14px;
  background: var(--cs-grad-radial);
  box-shadow: 0 14px 32px rgba(0,0,0,0.20);
  overflow: hidden;
  position: relative;
  color: #fff;
}
.deck-content {
  position: relative; z-index: 1;
  padding: 18px 22px;
  height: 100%; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: center;
}
.deck-eyebrow {
  font-size: 8px; letter-spacing: 0.20em;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 8px; opacity: 0.90;
}
.deck-title {
  font-size: 30px; font-weight: 800;
  line-height: 1.0; letter-spacing: -0.02em;
}
.deck-subtitle {
  margin-top: 8px;
  font-size: 9px; line-height: 1.35;
  opacity: 0.75;
  font-weight: 300;
}
```

---

## Famiglia 5 — Diagrammi e flussi

### `bubble-cloud` — bubbles attorno a sources centrali

**Quando:** mostrare frammenti di contesto distribuiti attorno a sorgenti centrali (es. "il contesto è già vostro: emails, drive, web"). Alcune bubbles possono essere "stale" (greyed + line-through).

**Wireframe:**
```
     [bubble]   [bubble]   [bubble]
          ╲        │        ╱
            ┌──────────┐
            │  DRIVE   │
            │   MAIL   │
            │   WEB    │
            └──────────┘
          ╱        │        ╲
     [bubble]   [bubble~old~]   [bubble]
```

**HTML:**
```html
<div class="bubble-wrap">
  <div class="bubbles bubbles-top">
    <span class="bubble" style="--x:5%; --y:10%">Q3 margins</span>
    <span class="bubble" style="--x:35%; --y:25%">Customer NPS Q2</span>
    <span class="bubble stale" style="--x:65%; --y:5%">Old plan 2024</span>
  </div>
  <div class="sources">
    <div class="src">Drive</div>
    <div class="src">Mail</div>
    <div class="src">Web</div>
  </div>
  <div class="bubbles bubbles-bot">
    <span class="bubble" style="--x:10%; --y:60%">DACH market</span>
    <span class="bubble" style="--x:50%; --y:80%">Atlas brief</span>
    <span class="bubble stale" style="--x:80%; --y:65%">Legacy report</span>
  </div>
</div>
```

**CSS:**
```css
.bubble-wrap { position: relative; height: 100%; }
.bubbles {
  position: absolute; left: 0; right: 0;
  height: 50%;
  pointer-events: none;
}
.bubbles-top { top: 0; }
.bubbles-bot { bottom: 0; }
.bubble {
  position: absolute;
  left: var(--x, 50%); top: var(--y, 50%);
  background: rgba(37,99,235,0.10);
  color: var(--cs-primary);
  font-family: var(--cs-font-mono);
  font-size: 18px;
  padding: 8px 16px;
  border-radius: 999px;
}
.bubble.stale {
  background: rgba(0,0,0,0.05);
  color: var(--cs-muted);
  text-decoration: line-through;
}
.sources {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  display: flex; gap: 24px;
}
.src {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 18px;
  padding: 28px 36px;
  font-size: 28px; font-weight: 700;
  color: var(--cs-black);
  box-shadow: var(--cs-shadow-2);
}
```

**Note:** se metti `.sources` reveal centrato, override `transform: translate(-50%, -50%)` su `.is-on` (vedi specificity wars in `animations.md`).

---

### `mini-diagram-in-card` — visual al fondo della card

**Quando:** card con titolo + body + diagrammino visivo che mostra il "limite" o il "concetto" della card.

**Idea:** ogni card ha un'area diag in basso con SVG/HTML stilizzato (3 chat box separate, freccette converging, snowflake icon, ecc).

**HTML (esempio: chat isolate):**
```html
<div class="way-card">
  <div class="way-num">01</div>
  <h3>Single chat</h3>
  <p>One question, one answer. Tomorrow it starts from zero.</p>
  <div class="diag diag-isolated">
    <div class="chat-mini active"><span class="q">Q</span><span class="a">→</span></div>
    <div class="chat-mini"><span class="q">Q</span><span class="a">→</span></div>
    <div class="chat-mini"><span class="q">Q</span><span class="a">→</span></div>
  </div>
</div>
```

**CSS pattern (variante 1):**
```css
.way-card { display: flex; flex-direction: column; ... }
.way-card .diag { margin-top: auto; padding-top: 24px; }
.diag-isolated { display: flex; gap: 12px; justify-content: center; }
.chat-mini {
  width: 50px; height: 36px;
  background: rgba(0,0,0,0.04);
  border-radius: 6px;
  display: grid; grid-template-columns: 1fr 1fr;
  font-size: 11px; color: var(--cs-muted);
  place-items: center;
}
.chat-mini.active { background: rgba(37,99,235,0.10); color: var(--cs-primary); }
```

**Gotcha:** `.way-card .diag` NON deve settare `display` direttamente — i variant (`.diag-isolated` flex / `.diag-merge` grid) si gestiscono il display. Vedi `animations.md` gotchas.

---

### `tools-split` — left tools list + right problem card

**Quando:** elencare strumenti/elementi a sinistra (mini-cards icon + name) e i loro limiti/conseguenze a destra in una card più grande.

**HTML:**
```html
<div class="ts-grid">
  <div class="ts-tools">
    <div class="ts-tool">
      <div class="ts-tool-ic"><i data-lucide="mail"></i></div>
      <div class="ts-tool-name">Mail</div>
    </div>
    <div class="ts-tool">
      <div class="ts-tool-ic"><i data-lucide="folder"></i></div>
      <div class="ts-tool-name">Drive</div>
    </div>
    <div class="ts-tool">
      <div class="ts-tool-ic"><i data-lucide="search"></i></div>
      <div class="ts-tool-name">Web search</div>
    </div>
  </div>
  <div class="ts-problem card">
    <h3>The problem</h3>
    <ul>
      <li>No memory between sessions</li>
      <li>You repeat context every time</li>
      <li>Generic, contextless answers</li>
    </ul>
  </div>
</div>
```

**CSS:**
```css
.ts-grid {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: 56px;
  align-items: stretch;
  margin-top: 8px;
}
.ts-tools { display: flex; flex-direction: column; gap: 18px; height: 100%; }
.ts-tool {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 22px;
  padding: 22px 32px;
  display: flex; align-items: center; gap: 24px;
  box-shadow: var(--cs-shadow-2);
  flex: 1;
}
.ts-tool-ic {
  width: 64px; height: 64px;
  border-radius: 18px;
  background: var(--cs-grad-linear);
  color: #fff;
  display: grid; place-items: center;
  flex-shrink: 0;
}
.ts-tool-ic i { width: 30px; height: 30px; }
.ts-tool-name { font-size: 30px; font-weight: 700; color: var(--cs-black); }
.ts-problem ul { padding-left: 24px; margin: 16px 0 0; }
.ts-problem li {
  font-size: 24px; line-height: 1.5;
  color: var(--cs-body);
  margin-bottom: 8px;
}
```

---

### `counter-bars` — bars + counter ticking

**Quando:** mostrare degradazione progressiva (es. token compression: 100% → 75% → 25%). Bar che si riempie + counter che sale. Pattern animato — vedi `animations.md` per il counter.

**HTML:**
```html
<div class="tk-rows">
  <div class="tk-row reveal" data-step="2">
    <div class="tk-label">Inizio chat</div>
    <div class="tk-bar"><div class="tk-fill" style="--w:100%"></div></div>
    <div class="tk-state badge badge-green">Piena precisione</div>
  </div>
  <div class="tk-row reveal" data-step="3">
    <div class="tk-label">Chat lunga</div>
    <div class="tk-bar"><div class="tk-fill" style="--w:60%"></div></div>
    <div class="tk-state badge badge-orange">Compressione</div>
  </div>
  <div class="tk-row reveal" data-step="4">
    <div class="tk-label">Chat piena</div>
    <div class="tk-bar"><div class="tk-fill" style="--w:25%"></div></div>
    <div class="tk-state badge badge-red">Dettagli persi</div>
  </div>
</div>
<!-- Counter counterpart on its own (optional) -->
<div class="tk-counter mono"
     data-counter="200000"
     data-target-step="4">0<span class="unit"> tokens</span></div>
```

**CSS:**
```css
.tk-rows { display: grid; gap: 32px; margin-top: 24px; }
.tk-row {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  align-items: center; gap: 28px;
}
.tk-label, .tk-state {
  font-size: 20px; font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tk-bar {
  height: 18px;
  background: rgba(0,0,0,0.06);
  border-radius: 9px;
  overflow: hidden;
}
.tk-fill {
  height: 100%; width: 0%;
  background: var(--cs-grad-linear);
  border-radius: 9px;
  transition: width 1400ms cubic-bezier(0.22, 1, 0.36, 1) var(--bd, 0ms);
}
section[data-active="true"] .tk-fill.is-on { width: var(--w, 0%); }
.tk-counter {
  font-size: 64px; font-weight: 800;
  color: var(--cs-black);
  margin-top: 32px; text-align: center;
}
```

**Note:** il counter usa il `runCounter` del template (vedi `animations.md`).

---

### `flow-pipeline` — input → process → output

**Quando:** flusso lineare orizzontale di N step con frecce (es. agent flow: Prompt → CLAUDE.md → context.md → skill.md → Result). Versione statica del wrap arrow.

**HTML (statico):**
```html
<div class="pipeline">
  <div class="pipe-card">
    <div class="pipe-eyebrow">Input</div>
    <div class="pipe-name">Prompt</div>
  </div>
  <div class="pipe-arrow">→</div>
  <div class="pipe-card">
    <div class="pipe-eyebrow">Files</div>
    <div class="pipe-name mono">CLAUDE.md</div>
  </div>
  <div class="pipe-arrow">→</div>
  <div class="pipe-card">
    <div class="pipe-eyebrow">Output</div>
    <div class="pipe-name">Result</div>
  </div>
</div>
```

**CSS:**
```css
.pipeline {
  display: flex; align-items: center; justify-content: center;
  gap: 24px; margin-top: 56px;
}
.pipe-card {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 18px;
  padding: 28px 32px;
  text-align: center;
  box-shadow: var(--cs-shadow-2);
  min-width: 200px;
}
.pipe-eyebrow {
  font-family: var(--cs-font-mono);
  font-size: 14px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--cs-muted);
  margin-bottom: 10px;
}
.pipe-name {
  font-size: 22px; font-weight: 700;
  color: var(--cs-black);
  letter-spacing: -0.01em;
}
.pipe-arrow {
  font-size: 36px; color: var(--cs-muted);
  flex-shrink: 0;
}
```

**Variante animata:** sostituisci le frecce testuali con SVG path drawn-on (vedi `animations.md` "Wrap arrow").

---

## Famiglia 6 — Special

### `kb-tree` — folder tree mono

**Quando:** mostrare struttura cartella/KB stilizzata.

**HTML:**
```html
<div class="kb-tree mono">
my-kb/<br>
├── <span class="kb-vert">contenuti/</span><br>
│&nbsp;&nbsp;&nbsp;└── <span class="kb-meta">9 esempi · 1 skill</span><br>
└── <span class="kb-vert">normativa-legale/</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;└── <span class="kb-meta">istruzioni · 2 skill</span>
</div>
```

**CSS:**
```css
.kb-tree {
  font-size: 22px; line-height: 1.7;
  color: var(--cs-body);
  background: rgba(0,0,0,0.04);
  border-radius: 12px;
  padding: 32px 40px;
}
.kb-vert { color: var(--cs-primary); font-weight: 700; }
.kb-meta { color: var(--cs-muted); font-size: 18px; }
```

---

### `skill-list-with-workflow` — skill list + workflow box

**Quando:** elencare skill disponibili a sinistra + aprire un workflow dettagliato a destra (1 input → N output coerenti).

**HTML schematica:**
```html
<div class="sk-grid">
  <div class="skill-list">
    <div class="skill-row featured reveal" data-step="2">market-report-distill<span class="tag">Thematic</span></div>
    <div class="skill-row reveal" data-step="2" style="--d:60ms">competitor-positioning-brief<span class="tag">Thematic</span></div>
    <!-- more skills -->
  </div>
  <div class="workflow-box reveal" data-step="3">
    <div class="wf-eyebrow">Strategy analyst workflow</div>
    <h3>skill <span class="grad-word">market-report-distill</span></h3>
    <div class="wf-input">Input: Industry market report (PDF)</div>
    <!-- SVG connector trunk + 3 branches — see animations.md -->
    <div class="wf-outputs">
      <div class="output-card">Executive summary</div>
      <div class="output-card">Slide deck</div>
      <div class="output-card">Internal memo</div>
    </div>
    <div class="wf-footer">1 input · <strong>3 coherent outputs</strong></div>
  </div>
</div>
```

**CSS** (parziale, completa in base al contenuto):
```css
.sk-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 36px; margin-top: 8px; }
.skill-list { display: flex; flex-direction: column; gap: 14px; }
.skill-row {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 14px;
  padding: 18px 22px;
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--cs-font-mono);
  font-size: 20px; font-weight: 600;
  color: var(--cs-black);
}
.skill-row.featured {
  background: var(--cs-grad-linear);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 24px rgba(37,99,235,0.30);
}
.skill-row .tag {
  font-size: 14px; letter-spacing: 0.12em;
  text-transform: uppercase; font-weight: 700;
  color: var(--cs-muted);
  background: rgba(0,0,0,0.04);
  padding: 4px 10px; border-radius: 6px;
}
.skill-row.featured .tag { background: rgba(255,255,255,0.18); color: #fff; }
.workflow-box {
  background: #fff;
  border: 1px solid var(--cs-border);
  border-radius: 22px;
  padding: 28px 32px;
  box-shadow: var(--cs-shadow-2);
}
/* + wf-eyebrow, wf-input, wf-outputs, output-card */
```

**Animation companion:** la freccia bifurcating dall'input ai 3 output usa il pattern "Connector trunk + N branches" — vedi `animations.md`.

---

## Famiglia 7 — Intro / About (speakers + organization)

### `speaker-card` — speaker con foto + ruolo + LinkedIn QR

**Quando:** slide intro che presenta i speaker/team del workshop. Vertical-stack con foto round in cerchio gradient + nome + ruolo + LinkedIn icon "in" affiancato al QR.

**Layout consigliato:** grid 2-col (2 speakers) o 3-col (3 speakers). Per 4+, valutare horizontal compact.

**Pre-step QR:** generare i QR LinkedIn con `qrencode` (`brew install qrencode` se non installato):
```bash
qrencode -o assets/qr/alex.png -s 20 -m 2 -l H "https://www.linkedin.com/in/your-handle/"
```

**HTML schematica:**
```html
<div class="speakers-grid">
  <div class="speaker-card reveal" data-step="2">
    <div class="speaker-photo"><img src="assets/people/alex.jpeg" alt="Alex Rivera"></div>
    <h3 class="speaker-name">Alex Rivera</h3>
    <div class="speaker-role">Co-founder · AI Consultant</div>
    <div class="speaker-qr-row">
      <svg class="speaker-li-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
      <div class="speaker-qr"><img src="assets/qr/alex.png" alt="LinkedIn QR · Alex Rivera"></div>
    </div>
  </div>
  <!-- repeat for each speaker, increment data-step -->
</div>
```

**CSS:**
```css
.speakers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 140px;
  align-items: start;
  justify-items: center;
  margin-top: auto;       /* center vertically in remaining .pad space */
  margin-bottom: auto;
}
.speaker-card {
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  gap: 22px;
}
.speaker-photo {
  width: 280px; height: 280px;
  border-radius: 50%;
  padding: 5px;
  background: linear-gradient(135deg, var(--cs-primary), #7C3AED);
  box-shadow: 0 12px 48px rgba(37,99,235,0.18);
  box-sizing: border-box;
}
.speaker-photo img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.speaker-name {
  font-size: 56px; font-weight: 700;
  color: var(--cs-black);
  margin: 14px 0 0;
  letter-spacing: -0.02em;
  line-height: 1;
}
.speaker-role {
  font-size: 24px; color: var(--cs-muted);
  font-weight: 500; line-height: 1.4;
  margin: 0;
  white-space: nowrap;       /* role su 1 riga; per ruoli lunghi rimuovere e usare max-width */
}
.speaker-qr-row {
  display: flex; align-items: center;
  justify-content: center; gap: 18px;
  margin-top: 26px;
}
.speaker-li-icon {
  width: 68px; height: 68px;
  color: var(--cs-black);
  flex-shrink: 0; display: block;
}
.speaker-qr {
  background: #fff;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  width: 130px;
}
.speaker-qr img { width: 100%; height: auto; display: block; }
```

**Note critiche:**
- Il logo "in" LinkedIn è SVG inline (path nel codice), NON `<i data-lucide="linkedin">`. Lucide non rilancia createIcons() automaticamente su elementi aggiunti dopo render iniziale — vedi gotcha in `animations.md`.
- Il logo "in" è ~52% del QR (68px su 130px). Mantenere questa proporzione per leggibilità.
- Eyebrow + h2 sopra il grid (es. "WORKSHOP HOSTS" + "Your team for today") con `.reveal data-step="1"`. Speakers a step 2, 3, …

**Animation:** 1 step per ogni card (titoli step 1, ogni speaker 1 step). Per N speakers → `data-steps="N+1"`.

---

### `org-hero` — organization intro con logo + tagline + payoff + stats

**Quando:** slide intro per presentare un'organizzazione/venue. Pattern org-as-cover (no eyebrow/h2): logo grande centrato, tagline, sub, payoff italic, riga stats con dividers verticali.

**Adatto a:** "About us", "Where you are today", venue pitch, sponsor showcase. Funziona come 3° "moment cover" del trittico Cover → Speakers → About.

**HTML schematica:**
```html
<section data-label="03 About" data-steps="2" data-current-step="0">
  <div class="sweep"></div>
  <div class="pad center">
    <img class="org-hero-logo reveal" data-step="1" src="assets/logos/logo-black.png" alt="Org">
    <div class="org-tagline reveal" data-step="1" style="--d:80ms">Applied AI Studio</div>
    <div class="org-sub reveal" data-step="1" style="--d:160ms">Berlin · Since 2021</div>
    <div class="org-payoff reveal" data-step="2">Where teams learn to ship with AI agents</div>
    <div class="org-stats-grid reveal" data-step="2" style="--d:120ms">
      <div class="org-stat"><div class="org-stat-num">40</div><div class="org-stat-label">workshops run</div></div>
      <div class="org-stat"><div class="org-stat-num">60+</div><div class="org-stat-label">clients</div></div>
      <div class="org-stat"><div class="org-stat-num">50+</div><div class="org-stat-label">events / year</div></div>
      <div class="org-stat"><div class="org-stat-num">1000+</div><div class="org-stat-label">people trained</div></div>
    </div>
  </div>
  <div class="footer">...</div>
</section>
```

**CSS:**
```css
.org-hero-logo {
  display: block; margin: 0 auto;
  height: 160px; width: auto; max-width: 1000px;
}
.org-tagline {
  font-size: 72px; font-weight: 700;
  letter-spacing: -0.022em;
  color: var(--cs-black);
  text-align: center;
  margin: 56px 0 0; line-height: 1;
}
.org-tagline .grad-word {
  background: var(--cs-grad-text);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.org-sub {
  font-size: 24px; color: var(--cs-muted);
  font-weight: 500; letter-spacing: 0.08em;
  text-align: center;
  margin: 20px 0 0;
  text-transform: uppercase;
}
.org-payoff {
  font-size: 30px; font-weight: 400; font-style: italic;
  color: var(--cs-body);
  text-align: center;
  margin: 56px auto 0;
  max-width: 1200px; line-height: 1.4;
}
.org-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: 80px;
  align-items: center;
}
.org-stat {
  text-align: center;
  padding: 0 32px;
}
.org-stat:not(:first-child) {
  border-left: 1px solid rgba(0,0,0,0.12);
}
.org-stat-num {
  font-size: 88px; font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
  background: var(--cs-grad-text);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.org-stat-label {
  font-size: 22px; color: var(--cs-muted);
  font-weight: 600; letter-spacing: 0.02em;
  margin-top: 22px; line-height: 1.3;
}
```

**Variazioni:**
- 3 stats invece di 4: `grid-template-columns: repeat(3, 1fr)`
- Senza payoff (più minimal): rimuovi `.org-payoff` e accorpa numeri al data-step="1"
- Per altre organizzazioni: sostituisci logo + tagline + numeri (resto invariato)

**Animation:** 2-step ottimale. Step 1 logo+tagline+sub (identità). Step 2 payoff + numeri insieme con `--d` delay sui numeri per evitare reveal piatto simultaneo.

---

## Riepilogo — pattern per messaggio

| Messaggio | Pattern |
|---|---|
| Apertura/chiusura | `cover-gradient` |
| Stacco narrativo | `transition-cream` |
| 2 concetti contrapposti | `pq-card-2col` |
| 3 facets di uno stesso concetto | `pq-card-3col` |
| 3 modes/options numerate | `card-grid-3col-numbered` |
| 4 warnings/principles | `card-grid-4col` |
| File "umani" PDF/DOC/PPT | `file-mockup` |
| Mostra un .md file (impatto forte) | `terminal-dark` |
| Mostra un .md file (in card row) | `terminal-light` |
| App mobile screenshot | `mobile-mockup` |
| Mini deck preview (meta) | `deck-cover-replica` |
| Frammenti contesto + sources | `bubble-cloud` |
| Card con visual al fondo | `mini-diagram-in-card` |
| Tools + loro problemi | `tools-split` |
| Degradazione progressiva | `counter-bars` |
| Pipeline lineare | `flow-pipeline` (statico) o wrap arrow animato |
| Struttura cartella | `kb-tree` |
| Skill list + workflow esempio | `skill-list-with-workflow` |
| Speakers / team intro (foto + QR LinkedIn) | `speaker-card` |
| Org / venue intro (logo + stats) | `org-hero` |

Per le animazioni associate (popup overlay, SVG path drawing, packets, magic-move): **`animations.md`**.

Per un esempio end-to-end vedi `examples/demo-deck.html` (demo di 6 slide, animation level LIGHT).
