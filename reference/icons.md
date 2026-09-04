# SVG Icon Library

Tutte le icone usate nel framework. Stile uniforme: outline, `stroke-width` 1.5-2, `fill: none`, monocromatiche (colore via parent CSS).

**Convenzione di uso:** ogni icona è un blocco `<svg viewBox="0 0 24 24">` (eccetto note specifiche). Inseriscila dentro un container che definisce dimensione e colore (es. `.tool-mini-icon`, `.partner-icon`, `.docs-card-icon`). Il CSS già impostato nel template.html applica `stroke: currentColor`, `fill: none`, `stroke-linecap: round`, `stroke-linejoin: round`.

**Sostituibilità:** qualsiasi icona può essere swap-and-replace tra container compatibili (icon-circle gradient, icon-circle pink, plain stroke).

---

## Strumenti / Canali

### Mail (busta)
```svg
<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
```
**Uso:** rappresentare email, comunicazione asincrona, posta in arrivo.

### Folder / Drive
```svg
<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
```
**Uso:** Google Drive, cartelle, file system, knowledge base.

### Search / Lente
```svg
<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4"/></svg>
```
**Uso:** ricerca web, lookup, browse.

### Chat bubble
```svg
<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
```
**Uso:** chat, messaggistica, conversazione, "vecchie chat".

### Document / File con piega
```svg
<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h4"/></svg>
```
**Uso:** singolo documento, file di contesto, PDF.

### Mini-document (compact, per chaos visualization)
```svg
<svg viewBox="0 0 18 23"><path d="M2 1h10l5 5v15a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M12 1v5h5"/></svg>
```
**Uso:** mini-icona file dentro liste/cluster (action-row, chaos zones).

### Browser tab
```svg
<svg viewBox="0 0 32 19"><rect x="1" y="3" width="30" height="15" rx="2"/><circle cx="4" cy="6" r="0.7" fill="currentColor"/><circle cx="6.5" cy="6" r="0.7" fill="currentColor"/><circle cx="9" cy="6" r="0.7" fill="currentColor"/></svg>
```
**Uso:** finestra browser, tab, sito web.

---

## AI / Agentic

### Robot (per "AI/agent")
```svg
<svg viewBox="0 0 24 24">
  <rect x="5" y="9" width="14" height="11" rx="2"/>
  <rect x="3" y="13" width="2" height="4" rx="1"/>
  <rect x="19" y="13" width="2" height="4" rx="1"/>
  <line x1="9" y1="20" x2="9" y2="22"/>
  <line x1="15" y1="20" x2="15" y2="22"/>
  <circle cx="9.5" cy="14" r="1.2"/>
  <circle cx="14.5" cy="14" r="1.2"/>
  <line x1="12" y1="9" x2="12" y2="6"/>
  <circle cx="12" cy="5" r="1"/>
</svg>
```
**Uso:** rappresentazione generica AI/agent (in `action-robot` con bg gradient circle).

### Lightning bolt (skill / velocità)
```svg
<svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-12h-7z"/></svg>
```
**Uso:** skill, automazione, velocità, energia.

### Info circle (istruzioni)
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v0.01M12 11v5"/></svg>
```
**Uso:** file di istruzioni, README, regole, info importante.

---

## Concetti

### Up arrow (acceleration)
```svg
<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
```
**Uso:** velocizzano, aiutano, accelerazione.

### Radial spread (diffusione)
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M12 4v3"/><path d="M12 17v3"/><path d="M4 12h3"/><path d="M17 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>
```
**Uso:** errori si diffondono, propagazione, broadcast.

### Virus / contamination
```svg
<svg viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="6"/>
  <path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/>
  <circle cx="12" cy="2" r="1.2" fill="currentColor"/>
  <circle cx="12" cy="22" r="1.2" fill="currentColor"/>
  <circle cx="2" cy="12" r="1.2" fill="currentColor"/>
  <circle cx="22" cy="12" r="1.2" fill="currentColor"/>
</svg>
```
**Uso:** infettano il contesto, contaminazione, problema che si propaga.

### Check / verified
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
```
**Uso:** verifica, completato, ok.

---

## Warning / Safety

### Alert triangle
```svg
<svg viewBox="0 0 24 24"><path d="M12 3L2 21h20L12 3z"/><path d="M12 9v6"/><path d="M12 18v.01"/></svg>
```
**Uso:** attenzione, warning, problematica.

### Lock (privacy)
```svg
<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
```
**Uso:** privacy, dati sensibili, chiuso.

### Trash (delete)
```svg
<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
```
**Uso:** eliminazione, rischio cancellazione file.

---

## Navigation / UI

### Frecce
**Right:**
```svg
<svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
```
**Left:**
```svg
<svg viewBox="0 0 24 24"><polyline points="15 6 9 12 15 18"/></svg>
```
**Down:**
```svg
<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
```
**Up:**
```svg
<svg viewBox="0 0 24 24"><polyline points="6 15 12 9 18 15"/></svg>
```

### Plus
```svg
<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
```

### Close (×)
```svg
<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
```

### Fullscreen (corner brackets)
```svg
<svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
```
**Uso:** già pre-inserita nel `#fs-btn` del viewer system.

---

## Container types per icone

Il CSS in `template.html` definisce vari container che adattano un'icona allo stile della slide:

### `.tool-mini-icon` (dentro `.tool-mini`)
Icona accanto al nome di uno strumento. Stroke primary/muted, 38-58px.

### `.action-robot` (slide trasformazione)
Cerchio gradient primary/secondary grande (90-150px). L'icona dentro va in stroke white.

### `.partner-icon` (dentro `.partner-card`)
Cerchio accent tenue (52-78px). Icona stroke primary, dimensione interna 52%.

### `.docs-card-icon` (dentro `.docs-card`)
Icona standalone (no cerchio). Stroke muted, 36-56px.

### `.source-icon` (dentro `.source-card`)
Cerchio bianco. Icona stroke primary, 34-50px.

### `.cycle-svg .arrow-head` (svg markers)
Per le frecce dentro SVG diagrammi. `fill: var(--cs-primary)`.

---

## Aggiungere nuove icone

Quando ne serve una nuova:
1. Disegnala come SVG outline `viewBox="0 0 24 24"` (o aspect ratio diverso se ha senso)
2. `stroke="currentColor"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
3. Stroke width 1.5-2 (verrà sovrascritto dal CSS del container se serve)
4. Aggiungila a questo file con nome + uso + codice
5. Mantieni stile coerente con le esistenti (linee morbide, no pittogrammi pieni)

**Risorse esterne consigliate:** Lucide Icons (lucide.dev), Tabler Icons (tabler-icons.io). Stile compatibile, copia/adatta liberamente.
