# Fase: add — agregar slides a un deck existente

Se activa cuando el usuario pide agregar una o más slides a un deck ya generado ("agrega una slide sobre X", "mete 2 slides de tracción entre la 9 y la 10", "suma un cierre con FAQ al final").

## 1. Ubicar dónde va

Si no es obvio, preguntar en una ronda: después de qué slide va (o si va al final), cuántas se agregan, y de qué trata cada una.

## 2. Assets si hace falta

Si la nueva slide necesita imagen, logo o un dato real, aplicar el mismo criterio bloqueante de `reference/assets.md` — pero solo para esa slide nueva, no repetir el checklist de todo el deck.

## 3. Escribir la slide con las convenciones ya resueltas

- Usar los tokens de diseño y el pack ya aplicados en el deck — no reinyectar ni tocar `:root`.
- Elegir un patrón de `reference/components.md` / `reference/media-and-data.md` que no repita el de la slide inmediatamente anterior o siguiente (variedad de layout, ver `reference/design-guidelines.md`).
- Si es una slide de frase sola, elegir el tamaño de `.ts-title` por longitud del texto (tabla en `reference/design-guidelines.md`) — no usar el default a ciegas.
- Aplicar las reglas de voz de `SKILL.md` igual que en cualquier slide nueva.
- Insertar el `<section>` en la posición elegida del HTML, con cualquier `data-label`/`<span class="num">` provisional — el número real lo pone el paso siguiente, no a mano.

## 4. Renumerar (nunca a mano)

Insertar en medio de un deck rompe la numeración de todo lo que viene después — es exactamente el tipo de cuenta mecánica donde es fácil dejar un hueco o un duplicado editando slide por slide. Correr siempre:

```bash
node scripts/renumber.mjs deck.html
```

Recalcula `data-label="NN ..."` y `<span class="num">NN</span>` de todas las slides en el orden real del documento, saltando las que no llevan número de footer (ej. la pantalla de standby de `media-and-data.md`, que documentadamente no cuenta). Es la única forma segura de insertar en medio de un deck.

## 5. Verificar

```bash
node scripts/audit.mjs deck.html
```

Debe quedar en verde. Si la slide nueva no tiene elemento visual, repite el patrón de una vecina, o el nivel de animación no calza con el resto, corregirlo antes de cerrar esta fase.

**Al terminar esta fase:** la(s) slide(s) nueva(s) existen, todo el deck quedó renumerado sin huecos ni duplicados, y `audit.mjs` pasa. Sigue `export` si hace falta regenerar PDF/PPTX con el contenido nuevo.
