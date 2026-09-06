# Esquema de design system (`design-tokens.json`)

Este archivo es la fuente de verdad de la identidad visual de un deck. Vive en el directorio del proyecto (no dentro de la skill), normalmente como `design-tokens.json`. Todo el sistema de componentes de `template.html`, `components.md` y `animations.md` está parametrizado sobre las CSS custom properties `--cs-*` de `:root` — este esquema es simplemente la forma estructurada de esos mismos valores para que Claude los pueda generar, leer y traducir sin ambigüedad.

## Cómo se obtiene (ver flujo en `SKILL.md`)

1. **El usuario ya tiene tokens** (JSON de un design system existente, variables CSS de su sitio, guía de marca): Claude los lee y los traduce a este esquema.
2. **El usuario no tiene nada definido**: Claude hace preguntas mínimas (color de marca, tipografía o "elige tú", y un "vibe" en una frase) y **genera** el resto — paleta completa, escala tipográfica coherente — sin que el usuario tenga que escribir CSS ni JSON a mano. El usuario puede editar el resultado después si quiere control fino.

## Esquema

Este ejemplo son los valores reales del pack `paper-white` (ver `styles/paper-white.md`), para que copiarlo tal cual produzca un deck que pasa la validación. Dos detalles que el ejemplo enseña a propósito: los gradientes llevan `in oklch` (interpolación sin zona muerta grisácea a mitad de camino), y las fuentes están fuera de la lista de *training-data defaults* del final de este archivo.

```json
{
  "colors": {
    "primary":   "#16181A",
    "secondary": "#5A6169",
    "accent":    "#E23D1E",
    "cream":     "#FFFFFF",
    "creamAlt":  "#F4F5F6",
    "black":     "#0A0B0C",
    "body":      "#3A4046",
    "muted":     "#6B7278",
    "white":     "#FFFFFF"
  },
  "gradient": {
    "radial": "radial-gradient(112% 150% at 0% 100% in oklch, #16181A 0%, #000000 100%)",
    "linear": "linear-gradient(135deg in oklch, #16181A 0%, #000000 100%)",
    "text":   "linear-gradient(135deg in oklch, #16181A 0%, #3A4046 50%, #16181A 100%)"
  },
  "typography": {
    "headingFont": "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif",
    "bodyFont":    "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif",
    "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&display=swap"
  },
  "radius": {
    "sm": "12px",
    "md": "20px",
    "lg": "26px"
  },
  "spacing": {
    "padTop":    "96px",
    "padX":      "120px",
    "padBottom": "120px"
  },
  "logo": {
    "lightPath": "assets/logos/logo-white.png",
    "darkPath":  "assets/logos/logo-black.png"
  }
}
```

Todos los campos son opcionales — si falta alguno, se usa el default del **style pack elegido en `init`** (ver `styles/index.md`), no un default propio de `template.html`. `design-tokens.json` existe para los colores/tipografía de marca del usuario; todo lo que no cubre (composición, radios, spacing salvo que se pise explícitamente) lo aporta el pack. No hace falta rellenar el esquema completo si el usuario solo da un color de marca.

## Mapeo a CSS custom properties

| Campo del JSON | Variable CSS en `template.html` `:root` |
|---|---|
| `colors.primary` | `--cs-primary` |
| `colors.secondary` | `--cs-secondary` |
| `colors.accent` | `--cs-accent` — **usar con cuentagotas**: badges, contadores, un solo detalle por slide. Nunca como color dominante (ver `design-guidelines.md`) |
| `colors.cream` / `colors.creamAlt` | `--cs-cream` / `--cs-cream-2` |
| `colors.black` / `colors.body` / `colors.muted` / `colors.white` | `--cs-black` / `--cs-body` / `--cs-muted` / `--cs-white` |
| `gradient.radial` / `gradient.linear` / `gradient.text` | `--cs-grad-radial` / `--cs-grad-linear` / `--cs-grad-text` |
| `typography.headingFont` | `--cs-font-heading` |
| `typography.bodyFont` | `--cs-font-sans` (nombre heredado del original — controla el body y cualquier elemento sin `--cs-font-heading` explícito) |
| `radius.sm` / `.md` / `.lg` | `--cs-radius-sm` / `--cs-radius-md` / `--cs-radius-lg` |
| `spacing.padTop` / `.padX` / `.padBottom` | `--cs-pad-top` / `--cs-pad-x` / `--cs-pad-bottom` — controlan `.pad`, el frame estándar de cada slide |
| `logo.lightPath` / `.darkPath` | se insertan directamente en `<img src="...">` dentro de `.footer .left` (versión clara del logo para slides `.grad`, oscura para slides `.cream`) |

## Aplicar el design system a un deck nuevo

El orden importa: primero el pack, después los tokens de marca por encima.

1. Copiar `template.html` al proyecto.
2. Aplicar el style pack elegido en `init` con `node scripts/apply-style-pack.mjs styles/<pack>.md deck.html` (con `--font=<id>` si se eligió una alternativa tipográfica). Esto fusiona los tokens del pack sin tocar los estructurales (`--cs-pad-*`, `--cs-radius-*`, sombras, easing) — ver la nota de `styles/index.md`.
3. Si el proyecto tiene `design-tokens.json` propio (marca del usuario), sustituir en `:root` solo los campos presentes ahí por encima de lo que dejó el pack — normalmente `colors.*` y `gradient.*`; rara vez `radius`/`spacing`, que el pack ya calibró.
4. **Si `typography.headingFont` o `typography.bodyFont` en `design-tokens.json` difieren de los del pack**: actualizar también el `<link href="https://fonts.googleapis.com/...">` en `<head>` con `typography.googleFontsUrl` (o el link correspondiente a la fuente elegida) — si no, la fuente no carga y cae al fallback del sistema. Evitar por default fuentes sobreusadas en UI generada por IA (Inter, Roboto, Fraunces, Newsreader, IBM Plex, Geist, Plus Jakarta Sans, Space Grotesk, DM Sans, Instrument Sans) salvo que el usuario las pida explícitamente.
5. Correr `node scripts/check-style-pack.mjs deck.html` para validar el resultado final (pack + tokens de marca combinados) contra contraste WCAG y clichés de IA — no alcanza con haber validado el pack solo.
6. Todo lo demás del CSS (componentes de `components.md`, animaciones de `animations.md`) es paramétrico sobre estas variables — no necesita tocarse.

## Colores derivados cuando el usuario da poco input

Si el usuario solo da un color de marca (ej. "verde esmeralda" o `#10B981`), Claude genera el resto de la paleta siguiendo esta lógica (inspirada en la guía de la skill oficial de PPTX de Anthropic — ver `design-guidelines.md`):
- **`primary`** = el color dado.
- **`secondary`** = un tono análogo o complementario que funcione bien en el gradiente (ni demasiado parecido a `primary`, ni en conflicto de temperatura).
- **`accent`** = un color de acento nítido y distinto en matiz de `primary`/`secondary` (ej. si la paleta es fría azul/verde, un acento cálido ámbar/coral) — es el único color "que grita", y se usa en el 5-10% del peso visual del deck, no más.
- **`cream`/`creamAlt`** = **blanco puro o casi negro, nunca un crema cálido intermedio.** Es la regla no negociable de `init.md` y `check-style-pack.mjs` la verifica: el fondo beige "porque se ve cálido" es justo el cliché de IA que hay que evitar. Si el vibe es claro, `#FFFFFF` (ver `styles/paper-white.md`); si es oscuro o "tech", invertir a fondo casi negro con texto claro (ver `styles/terminal.md`). El nombre `cream` es heredado del fork original y hoy significa solo "fondo de las slides intermedias", no un color cálido.
