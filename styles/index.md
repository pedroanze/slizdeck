# Style packs

Cada pack es un mundo visual completo: paleta, tipografía y reglas de composición. **Este índice es lo único que hace falta leer para elegir**; el archivo del pack se abre solo cuando ya se decidió cuál usar.

| Pack | Fondo | Tipografía | Para qué deck |
|---|---|---|---|
| [`terminal`](terminal.md) | Casi negro | Archivo + JetBrains Mono | Infra, AI, demos técnicas. Sala oscura con proyector. |
| [`paper-white`](paper-white.md) | Blanco literal | Schibsted Grotesk | Cuando el contenido y las cifras deben cargar todo el peso. |
| [`committed`](committed.md) | Cobalto dominante | Bricolage Grotesque + Manrope | El pitch que necesita recordarse. Keynotes, lanzamientos. |
| [`instrument`](instrument.md) | Neutro frío | Public Sans + Martian Mono | Decks densos en métricas: tracción, unit economics, benchmarks. |
| [`editorial`](editorial.md) | Blanco puro | Young Serif + Chivo | Charlas con tesis y argumento, donde el texto respira. |

**Default si el usuario no elige:** `paper-white`. Es el más neutral y el que peor puede salir mal.

## Tipografía: default o alternativa

Cada pack trae **2 alternativas tipográficas curadas** además de su default (sección "Alternativas tipográficas" dentro del archivo del pack) — mismo mundo visual, distinta ejecución de fuente. No es customización libre: son opciones ya validadas contra la lista de *training-data defaults* de impeccable y contra el mood del pack.

Después de que el usuario elija pack, mostrarle su default más las 2 alternativas (nombre + una línea de cuándo preferirla, ya escritas en cada pack) y dejarlo elegir. Si no elige, se usa el default.

## Cómo se aplica un pack

```bash
node scripts/apply-style-pack.mjs styles/terminal.md deck.html
node scripts/apply-style-pack.mjs styles/terminal.md deck.html --font=mono-tech   # con una alternativa tipográfica
```

Esto **fusiona** los tokens del pack sobre los del deck y sustituye el `<link>` de Google Fonts en un solo paso. `--font=<id>` sustituye además la tipografía por la alternativa indicada; sin el flag se aplica el default del pack.

> No copiar el bloque `:root` a mano. Un pack solo declara sus tokens de color y tipografía; los estructurales —`--cs-pad-*`, `--cs-radius-*`, sombras, easing— no aparecen en él. Reemplazar el bloque entero los borra y el deck pierde el padding sin ningún error visible hasta que se renderiza. El script existe precisamente para eso: preserva lo que el pack no toca.

Después de aplicarlo, seguir las **notas de composición** del pack. No son decorativas: definen dónde va el acento y qué slides van a fondo completo, que es lo que distingue un pack de una simple paleta.

## Verificar un pack

Cualquier pack —incluido uno que arme el usuario con los colores de su marca— se valida con:

```bash
node scripts/check-style-pack.mjs styles/terminal.md
```

Comprueba los contrastes WCAG que exige el sistema, que el primario y el acento sean distinguibles entre sí, y avisa si la combinación cae en una de las zonas atractoras de interfaces generadas por IA o si la tipografía está en la lista de *training-data defaults*.

## Añadir un pack nuevo

Copiar cualquier archivo existente como plantilla, cambiar los tokens, y validarlo con el script. Un pack no se da por bueno hasta que el validador pasa sin fallos. Si el acento del pack solo se usa sobre el color primario y no sobre el fondo, declararlo con `--cs-accent-on: primary;` para que el validador lo compruebe contra la superficie correcta.

Dos convenciones más a seguir:
- Los tres tokens de gradiente interpolan en OKLCH: `linear-gradient(135deg in oklch, ...)` / `radial-gradient(... at ... in oklch, ...)`, nunca en RGB crudo (ver `DESIGN.md` → Motion).
- Sumar una sección **"Alternativas tipográficas"** con 2 opciones (formato `### Alt: <id> — <label>` + una línea de cuándo preferirla + bloque `css` con los tokens que cambian + bloque con la URL de Google Fonts), siguiendo el mismo patrón que los packs existentes. `apply-style-pack.mjs --font=<id>` las lee automáticamente.
