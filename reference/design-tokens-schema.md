# Esquema de design system (`design-tokens.json`)

Este archivo es la fuente de verdad de la identidad visual de un deck. Vive en el directorio del proyecto (no dentro de la skill), normalmente como `design-tokens.json`. Todo el sistema de componentes de `template.html`, `components.md` y `animations.md` está parametrizado sobre las CSS custom properties `--cs-*` de `:root` — este esquema es simplemente la forma estructurada de esos mismos valores para que Claude los pueda generar, leer y traducir sin ambigüedad.

## Cómo se obtiene (ver flujo en `SKILL.md`)

1. **El usuario ya tiene tokens** (JSON de un design system existente, variables CSS de su sitio, guía de marca): Claude los lee y los traduce a este esquema.
2. **El usuario no tiene nada definido**: Claude hace preguntas mínimas (color de marca, tipografía o "elige tú", y un "vibe" en una frase) y **genera** el resto — paleta completa, escala tipográfica coherente — sin que el usuario tenga que escribir CSS ni JSON a mano. El usuario puede editar el resultado después si quiere control fino.

## Esquema

```json
{
  "colors": {
    "primary":   "#0E7C66",
    "secondary": "#1E3A5F",
    "accent":    "#AD5407",
    "cream":     "#F7F6F2",
    "creamAlt":  "#EDECE6",
    "black":     "#000000",
    "body":      "#454545",
    "muted":     "#65696F",
    "white":     "#FFFFFF"
  },
  "gradient": {
    "radial": "radial-gradient(112% 150% at 0% 100%, #0E7C66 0%, #1E3A5F 100%)",
    "linear": "linear-gradient(135deg, #0E7C66 0%, #1E3A5F 100%)",
    "text":   "linear-gradient(135deg, #0E7C66 0%, #146E63 50%, #1E3A5F 100%)"
  },
  "typography": {
    "headingFont": "'Newsreader', Georgia, 'Times New Roman', serif",
    "bodyFont":    "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
    "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
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

Todos los campos son opcionales — si falta alguno, se usa el default de `template.html` (la paleta neutra azul/violeta original). No hace falta rellenar el esquema completo si el usuario solo da un color de marca.

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

1. Copiar `template.html` al proyecto.
2. Sustituir los valores en `:root` por los del `design-tokens.json` del proyecto (solo los campos presentes; el resto queda en su default).
3. **Si `typography.headingFont` o `typography.bodyFont` cambian respecto al default** (Newsreader/IBM Plex Sans): actualizar también el `<link href="https://fonts.googleapis.com/...">` en `<head>` con `typography.googleFontsUrl` (o el link correspondiente a la fuente elegida) — si no, la fuente no carga y cae al fallback del sistema. Evitar por default fuentes sobreusadas en UI generada por IA (Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, Space Grotesk) salvo que el usuario las pida explícitamente.
4. Todo lo demás del CSS (componentes de `components.md`, animaciones de `animations.md`) es paramétrico sobre estas variables — no necesita tocarse.

## Colores derivados cuando el usuario da poco input

Si el usuario solo da un color de marca (ej. "verde esmeralda" o `#10B981`), Claude genera el resto de la paleta siguiendo esta lógica (inspirada en la guía de la skill oficial de PPTX de Anthropic — ver `design-guidelines.md`):
- **`primary`** = el color dado.
- **`secondary`** = un tono análogo o complementario que funcione bien en el gradiente (ni demasiado parecido a `primary`, ni en conflicto de temperatura).
- **`accent`** = un color de acento nítido y distinto en matiz de `primary`/`secondary` (ej. si la paleta es fría azul/verde, un acento cálido ámbar/coral) — es el único color "que grita", y se usa en el 5-10% del peso visual del deck, no más.
- **`cream`/`creamAlt`** = neutros cálidos por default (no blanco puro) salvo que el "vibe" pedido sea explícitamente "oscuro" o "tech" — en ese caso invertir a fondo oscuro con texto claro (ver variante dark en `design-guidelines.md`).
