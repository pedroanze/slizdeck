# Tokens del design system

El design system de un deck son las variables `--cs-*` del `:root` de su propio HTML. No hay un archivo aparte: el pack elegido en `init` las escribe con `apply-style-pack.mjs`, y los colores de marca del usuario se inyectan editando esas mismas variables en el deck. Todo el CSS del template, de `components.md` y de `animations.md` está escrito sobre ellas, así que no hace falta tocar nada más.

## Qué hace cada token

| Token | Para qué |
|---|---|
| `--cs-primary` | Color dominante: barras de datos, cifras clave, eyebrows, bordes de acento |
| `--cs-secondary` | Segundo color del degradado de cover/cierre y de apoyo |
| `--cs-accent` | El único color "que grita": un detalle por slide, nunca dominante (ver `design-guidelines.md`) |
| `--cs-accent-ink` | El acento cuando resalta **sobre el fondo**: la barra o cifra `highlight` de una gráfica, `td.hl`, `li.hl`, `.hl-accent`, `.metrica .cifra`. Default: el propio acento. Obligatorio declararlo si el acento no se lee sobre el fondo (el validador exige 3:1) |
| `--cs-accent-on` | `primary` si el acento del pack solo va sobre el color primario (el lima de `committed`); el validador lo mide contra esa superficie |
| `--cs-on-primary` | Texto sobre un bloque de `--cs-primary` o `--cs-grad-linear`. Default blanco; un pack de primario claro lo oscurece (`terminal`) |
| `--cs-cream` / `--cs-cream-2` | Fondo de las slides y fondo alternativo (filas resaltadas, zonas suaves). Pese al nombre: blanco puro o casi negro |
| `--cs-surface` | Fondo de cards y paneles. Nunca `#fff` literal: en un pack oscuro deja texto claro sobre blanco |
| `--cs-black` / `--cs-body` / `--cs-muted` | Texto: principal (títulos), cuerpo, secundario. `--cs-black` es "el color de texto más fuerte", claro en packs oscuros |
| `--cs-white` | Blanco literal (texto sobre `.grad`). No usarlo como superficie |
| `--cs-void` | Fondo del letterbox alrededor del canvas |
| `--cs-border` / `--cs-border-strong` / `--cs-scrim` | Bordes suaves y fuertes, y relleno tenue de zonas (en vez de `rgba(0,0,0,…)`, que desaparece en packs oscuros) |
| `--cs-grad-radial` / `--cs-grad-linear` / `--cs-grad-text` | Degradados de cover/cierre, de elementos y de la palabra `.grad-word`. Siempre `in oklch` |
| `--cs-grain` | Intensidad del grano sobre `.grad` (0 lo apaga) |
| `--cs-font-heading` / `--cs-font-sans` / `--cs-font-mono` | Tipografías de títulos, cuerpo y cifras/código |
| `--cs-weight-heading` | Peso de los títulos grandes. 400 si la fuente de títulos solo trae ese peso |
| `--cs-radius-sm/md/lg` · `--cs-pad-x/top/bottom` · `--cs-shadow-2` · `--cs-ease-std` | Estructura: radios, márgenes del `.pad`, sombra de cards, curva de animación. El pack rara vez los toca |

## Inyectar los colores de marca del usuario

El orden importa: primero el pack, después la marca por encima.

1. Crear el deck con el pack: `node <skill>/bin/slizdeck.mjs new deck.html --pack=<pack>` (con `--font=<id>` si se eligió una alternativa).
2. En el `:root` del deck, sustituir solo lo que el usuario dio, normalmente `--cs-primary`, `--cs-secondary`, `--cs-accent`, y los tres degradados rehechos con esos colores (`in oklch`).
3. Revisar los dos tokens que dependen de esos colores:
   - `--cs-accent-ink`: si el acento de marca es claro (amarillo, lima, cian) no se lee sobre fondo blanco; declarar un tono de la marca que sí (≥ 3:1).
   - `--cs-on-primary`: si el primario es claro, el texto sobre él va oscuro.
4. Si la marca trae tipografía propia, cambiar `--cs-font-*` y el `<link>` de Google Fonts del `<head>`, o la fuente no carga. Evitar las fuentes de la lista de clichés salvo pedido explícito (la lista completa está en `scripts/check-style-pack.mjs`, que la verifica).
5. `node <skill>/scripts/check-style-pack.mjs deck.html` tiene que pasar sin fallos con los colores combinados: validar el pack solo no alcanza.

## Colores derivados cuando el usuario da poco

Si el usuario solo da un color de marca (ej. `#10B981`):
- **`--cs-primary`** = el color dado.
- **`--cs-secondary`** = un tono análogo que funcione en el degradado, ni demasiado parecido ni en conflicto de temperatura.
- **`--cs-accent`** = nítido y distinto en matiz (paleta fría → acento cálido), en el 5-10 % del peso visual como máximo.
- **`--cs-cream`** = **blanco puro o casi negro**, nunca un crema intermedio (regla de `init.md`, la verifica `check-style-pack.mjs`). Claro: `#FFFFFF` (ver `styles/paper-white.md`); oscuro o "tech": fondo casi negro con texto claro (ver `styles/terminal.md`).
