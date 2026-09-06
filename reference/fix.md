# Fase: fix — corregir o mejorar una slide puntual

Se activa cuando el usuario señala una o más slides específicas de un deck ya generado para arreglar, mejorar o rehacer ("la slide 7 se ve genérica, mejórala", "arregla el texto de la 12", "la 20 no combina con las de al lado").

## 0. Si es un deck retomado después de un tiempo

Antes de tocar nada, correr `node scripts/doctor.mjs deck.html` — un deck viejo puede estar generado con una versión del engine anterior a algún fix relevante (ver `CHANGELOG.md`). Es un hallazgo **a decidir** (ver doctrina de severidad en `reference/audit.md`), no bloqueante: revisarlo antes de decidir si el fix puntual pedido también debería incluir ese arreglo de fondo.

## 1. Acotar el alcance

Tocar **solo** la(s) slide(s) señaladas. No aprovechar para tocar otras, aunque se note un problema parecido en una vecina — si el problema es sistémico (afecta a varias slides por igual, ej. un tamaño de fuente mal calibrado en todo un patrón), decirlo explícitamente y preguntar si el fix debe quedarse puntual o si conviene escalarlo a `init` (cambio de design system) o a un ajuste de `reference/design-guidelines.md` / `template.html` (cambio de sistema, no de una slide).

## 2. Diagnosticar antes de tocar

Releer la slide señalada contra:
- `reference/design-guidelines.md`: una idea por slide, elemento visual presente, variedad de layout respecto a sus vecinas, color dominante correcto.
- El tamaño de `.ts-title`/`.ts-title-md`/`.ts-title-sm` correcto para la longitud de su texto, si aplica.
- Las reglas de voz de `SKILL.md` (sin em-dash, sin punto final en títulos, numeración, footer).

Decir en una frase qué está fallando antes de reescribir — igual que un code review: nombrar el problema primero, no solo cambiar código a ciegas.

## 3. Aplicar el fix sin romper lo que el resto del deck espera

**Nunca tocar, aunque parezca más simple:**
- El `data-label` de esa slide (el número no cambia porque se edita el contenido — si hace falta mover la slide de posición, eso es `add`/reordenar, no `fix`).
- El footer y su `<span class="num">` de esa u otras slides.
- `data-steps`/`data-current-step` de otras slides.
- El `:root` de design tokens (un problema de color/tipografía es de `init`, no de `fix`).

**Sí se puede tocar, en la slide señalada nada más:**
- Contenido, patrón de layout, nivel de animación de esa slide puntual, tamaño de `.ts-title` si el texto cambió de longitud, agregar o quitar un `.hl` (máximo uno, y solo si el texto base alrededor no es ya bold del mismo color — ver la limitación documentada en `design-guidelines.md`).

## 4. Verificar

```bash
node scripts/audit.mjs deck.html
node scripts/check-reveal.mjs deck.html
```

Si el fix tocó varias slides seguidas, revisar también que no haya quedado el mismo patrón de layout repetido entre ellas. Correr `check-reveal.mjs` es barato y vale la pena sobre todo si el fix agregó o copió un snippet animado nuevo (`reference/animations.md` trae varios con overrides de `.reveal` a mano, donde es fácil dejar la cascada mal).

**Al terminar esta fase:** la slide señalada quedó corregida, el resto del deck no cambió, y `audit.mjs`/`check-reveal.mjs` siguen en verde.
