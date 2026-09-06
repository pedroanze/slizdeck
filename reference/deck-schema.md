# Esquema del deck: wireframe y estructura de slide

## El wireframe (fase `brief`, ver `reference/brief.md`)

Antes de generar HTML, se presenta un wireframe compacto, una línea por slide, y se espera aprobación del usuario:

```
SLIDE 01 · Cover · grad-cover
   [Nombre de la startup + una frase que resume qué hace]

SLIDE 02 · El problema · ts-title o card simple
   [El dolor concreto que sufre el usuario, con un número si existe]

SLIDE 03 · La solución · imagen-a-sangre + texto
   [Screenshot/mockup del producto + 1 frase de cómo resuelve el problema]
```

Formato: `SLIDE NN · título corto · patrón de components.md` en la primera línea, descripción de una línea debajo. Para slides complejas o patrones nuevos, expandir a un ASCII layout de 15-20 líneas.

## Arcos narrativos por tipo de deck

| Tipo | Arco | Núm. de slides orientativo |
|---|---|---|
| **Pitch deck de startup** (uso principal) | Hook → problema → solución → cómo funciona → tracción/data → equipo → ask | 8-12 |
| Talk / charla | Historia → giro → insight → invitación | 8-12 |
| Demo de producto | Contexto → qué hace → cómo funciona → ejemplo → cómo adoptarlo | 6-10 |
| Recap de evento | Números → momentos clave → voces → next steps | 6-10 |
| Workshop | Setup → problema → solución → aplicación → transición | 15-20 |

El pitch deck de startup es el caso de uso principal de `slizdeck` — cuando el usuario no especifica tipo, asumir pitch deck y confirmar.

## Estructura de cada `<section>` (slide)

Cada slide en `template.html` es un `<section>` con estas convenciones (ver ejemplos ya presentes en el template):

| Atributo/clase | Uso |
|---|---|
| `data-label="NN Título"` | Etiqueta usada por la navegación del viewer |
| `data-steps="N" data-current-step="0"` | Slide animada — N pasos de reveal |
| `data-steps="1" data-current-step="1"` | Slide estática — todo visible de entrada (obligatorio en cover y transition, ver `SKILL.md`) |
| `class="grad"` | Fondo degradado (cover, cierre) |
| (sin `class`, fondo default `--cs-cream`) | Slides de contenido intermedias |
| `<div class="pad">` | Frame estándar con el padding del design system |
| `<div class="pad center">` | Frame centrado (transitions) |
| `<div class="footer">` | Logo + nombre/org + número de slide — presente siempre |

## Niveles de animación (elegir uno por deck, fase `build`, ver `reference/build.md`)

| Nivel | Qué incluye | Cuándo |
|---|---|---|
| **NONE** | Todo estático, sin `.reveal` | Decks que se van a compartir async, sin presentador en vivo |
| **LIGHT** | Reveal por pasos (`.reveal`, fade-in escalonado) en cards/elementos, sin animaciones SVG grandes | Default para pitch decks largos (10 slides o más) y para presentar en vivo sin sobrecargar |
| **HEAVY** | LIGHT + animaciones SVG "signature" de `animations.md` (dibujo de paths, popups, pulsos) | Pitch decks cortos (menos de 10 slides) donde cada slide cuenta — máximo 1-2 slides HEAVY por deck, nunca todo el deck |

Reglas fijas (no negociables): cover y transition **siempre** estáticas (`data-steps="1" data-current-step="1"`, sin `.reveal`); nunca HEAVY en más de 18 slides sin pedido explícito del usuario.

## Layouts disponibles

Ver `reference/components.md` para el catálogo completo (cards, grids, mockups, terminales, diagramas) e `reference/icons.md` para la librería de íconos SVG. Ambos son referencia, no obligación — se puede mezclar y adaptar, y agregar un patrón nuevo a `components.md` si hace falta uno que no existe.
