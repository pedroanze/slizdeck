# Fase: init — estilo y design system

Se activa al empezar un deck desde cero, o cuando el usuario pide cambiar de paleta, pack o tipografía sobre un deck que ya existe ("aplica un pack distinto", "prueba con terminal", "sube el contraste del acento").

Tres caminos, en este orden. El objetivo es que el usuario nunca escriba CSS ni JSON a mano.

**a) El usuario ya tiene design system.** Buscar `design-tokens.json` en el directorio actual, o leer los tokens que el usuario señale (CSS de su sitio, guía de marca, variables de otro proyecto). Sus colores mandan. Aun así hay que elegir un pack de `styles/index.md`, porque el pack aporta lo que un archivo de tokens casi nunca trae: tipografía, composición y reglas de uso del color. Aplicar el pack y después sobreescribir sus colores con los de la marca:

```bash
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html
node scripts/check-style-pack.mjs deck.html    # confirmar que la marca no rompe contrastes
```

Si al inyectar los colores de marca el validador falla, **decirlo y proponer el ajuste mínimo** (normalmente oscurecer el texto atenuado o separar acento de primario), nunca entregar un deck que no pasa.

**b) El usuario no tiene design system.** Mostrar la tabla de `styles/index.md` —solo esa tabla, son cinco líneas— y pedirle que elija. Si no elige, `paper-white`. Preguntar si tiene un color de marca para inyectar; si no lo tiene, el pack se usa tal cual.

Con el pack elegido, mostrar también sus **2 alternativas tipográficas** (nombre + la línea de "cuándo preferirla" que trae el propio pack) y dejar elegir entre esas y el default. No es personalización libre — son 2-3 opciones curadas por pack, ya validadas contra clichés de IA — pero sí le da al usuario una decisión real sobre cómo se ve su tipografía. Si no elige, se usa el default del pack. Aplicar con:

```bash
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html --font=<id>   # si eligió una alternativa
node scripts/apply-style-pack.mjs styles/<pack>.md deck.html               # si se queda con el default
```

**c) El usuario no tiene nada y quiere algo hecho a medida.** Generar una semilla con la skill de diseño `impeccable`:

```bash
node ~/.claude/skills/impeccable/scripts/palette.mjs --from "<tema del deck>"
```

Devuelve un color ancla en OKLCH y el mood que evoca. Componer los cinco roles (fondo, superficie, ink, acento, atenuado) siguiendo las reglas que el propio script imprime, tomando como base el pack cuya estructura mejor calce, y validar con `check-style-pack.mjs`. Presentar el resultado como propuesta, no como hecho consumado.

**Reglas que no se negocian, vengan los colores de donde vengan:**
- El fondo es blanco puro o casi negro salvo que el mood sea explícitamente ambiental (un panel de instrumentos, una pantalla de terminal). Un fondo crema "porque se ve cálido" es el cliché que hay que evitar: la calidez va en los colores de marca y en la tipografía, no en la superficie.
- Nunca usar Inter, Roboto, Fraunces, Newsreader, IBM Plex, Space Grotesk, Geist, DM Sans, Plus Jakarta Sans ni Instrument Sans salvo que el usuario las pida por nombre. Están en la lista de fuentes que delatan una interfaz generada por IA.
- El deck no se da por terminado hasta que `check-style-pack.mjs` pasa sin fallos.

Guardar `design-tokens.json` en el directorio del proyecto (no dentro de la skill) para reutilizarlo en futuros decks de la misma marca.

**Al terminar esta fase:** el deck tiene pack, colores y tipografía resueltos. Sigue `brief` si es un deck nuevo, o queda listo tal cual si el usuario solo pidió cambiar el estilo de uno existente.
