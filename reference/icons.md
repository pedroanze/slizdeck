# SVG Icon Library

Todos los íconos usados en el framework. Estilo uniforme: outline, `stroke-width` 1.5-2, `fill: none`, monocromáticos (color vía CSS del parent).

**Convención de uso:** cada ícono es un bloque `<svg viewBox="0 0 24 24">` (excepto notas específicas). Insertalo dentro de un container que define tamaño y color (ej. `.tool-mini-icon`, `.partner-icon`, `.docs-card-icon`). El CSS ya configurado en `template.html` aplica `stroke: currentColor`, `fill: none`, `stroke-linecap: round`, `stroke-linejoin: round`.

**Sustituibilidad:** cualquier ícono puede swap-and-replace entre containers compatibles (icon-circle gradient, icon-circle pink, plain stroke).

---

## Herramientas / Canales

### Mail (sobre)
```svg
<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
```
**Uso:** representar email, comunicación asíncrona, bandeja de entrada.

### Folder / Drive
```svg
<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
```
**Uso:** Google Drive, carpetas, file system, knowledge base.

### Search / Lupa
```svg
<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4"/></svg>
```
**Uso:** búsqueda web, lookup, browse.

### Chat bubble
```svg
<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
```
**Uso:** chat, mensajería, conversación, "chats viejas".

### Document / Archivo con doblez
```svg
<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h4"/></svg>
```
**Uso:** documento individual, archivo de contexto, PDF.

### Mini-document (compacto, para visualizaciones de caos)
```svg
<svg viewBox="0 0 18 23"><path d="M2 1h10l5 5v15a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1z"/><path d="M12 1v5h5"/></svg>
```
**Uso:** mini-ícono de archivo dentro de listas/clusters (action-row, chaos zones).

### Browser tab
```svg
<svg viewBox="0 0 32 19"><rect x="1" y="3" width="30" height="15" rx="2"/><circle cx="4" cy="6" r="0.7" fill="currentColor"/><circle cx="6.5" cy="6" r="0.7" fill="currentColor"/><circle cx="9" cy="6" r="0.7" fill="currentColor"/></svg>
```
**Uso:** ventana de browser, tab, sitio web.

---

## AI / Agentic

### Robot (para "AI/agent")
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
**Uso:** representación genérica AI/agent (en `action-robot` con bg gradient circle).

### Lightning bolt (skill / velocidad)
```svg
<svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-12h-7z"/></svg>
```
**Uso:** skill, automatización, velocidad, energía.

### Info circle (instrucciones)
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v0.01M12 11v5"/></svg>
```
**Uso:** archivo de instrucciones, README, reglas, info importante.

---

## Conceptos

### Up arrow (aceleración)
```svg
<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
```
**Uso:** aceleran, ayudan, aceleración.

### Radial spread (difusión)
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M12 4v3"/><path d="M12 17v3"/><path d="M4 12h3"/><path d="M17 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>
```
**Uso:** los errores se difunden, propagación, broadcast.

### Virus / contaminación
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
**Uso:** infectan el contexto, contaminación, problema que se propaga.

### Check / verified
```svg
<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
```
**Uso:** verificación, completado, ok.

---

## Warning / Safety

### Alert triangle
```svg
<svg viewBox="0 0 24 24"><path d="M12 3L2 21h20L12 3z"/><path d="M12 9v6"/><path d="M12 18v.01"/></svg>
```
**Uso:** atención, warning, problema.

### Lock (privacidad)
```svg
<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
```
**Uso:** privacidad, datos sensibles, cerrado.

### Trash (delete)
```svg
<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
```
**Uso:** eliminación, riesgo de borrado de archivos.

---

## Navigation / UI

### Flechas
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
**Uso:** ya pre-insertado en el `#fs-btn` del viewer system.

---

## Tipos de container para íconos

El CSS en `template.html` define varios containers que adaptan un ícono al estilo de la slide:

### `.tool-mini-icon` (dentro de `.tool-mini`)
Ícono al lado del nombre de una herramienta. Stroke primary/muted, 38-58px.

### `.action-robot` (slide de transformación)
Círculo gradient primary/secondary grande (90-150px). El ícono adentro va en stroke white.

### `.partner-icon` (dentro de `.partner-card`)
Círculo accent tenue (52-78px). Ícono stroke primary, tamaño interno 52%.

### `.docs-card-icon` (dentro de `.docs-card`)
Ícono standalone (sin círculo). Stroke muted, 36-56px.

### `.source-icon` (dentro de `.source-card`)
Círculo blanco. Ícono stroke primary, 34-50px.

### `.cycle-svg .arrow-head` (SVG markers)
Para las flechas dentro de diagramas SVG. `fill: var(--cs-primary)`.

---

## Agregar íconos nuevos

Cuando hace falta uno nuevo:
1. Dibujalo como SVG outline `viewBox="0 0 24 24"` (u otro aspect ratio si tiene sentido)
2. `stroke="currentColor"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
3. Stroke width 1.5-2 (se sobreescribe con el CSS del container si hace falta)
4. Agregalo a este archivo con nombre + uso + código
5. Mantené el estilo coherente con los existentes (líneas suaves, sin pictogramas rellenos)

**Recursos externos recomendados:** Lucide Icons (lucide.dev), Tabler Icons (tabler-icons.io). Estilo compatible, copiá/adaptá libremente.
