# Evals

Cómo saber si una versión de slizdeck genera **mejores** decks que la anterior, y no solo distintos. Se corre antes de cada versión minor que toque diseño, animación o las instrucciones de las fases.

## Qué hay acá

| | |
|---|---|
| [`briefs/`](briefs/) | 8 pedidos fijos que cubren los tipos de deck de la skill. No se editan entre versiones: si cambian, los puntajes dejan de ser comparables. |
| [`rubric.md`](rubric.md) | Rúbrica visual (6 criterios, 1 a 5) para revisar las capturas de cada deck. |
| `scripts/score-deck.mjs` | Puntaje automático de 0 a 100: validaciones, texto en pantalla, variedad de layout, slides con elemento visual, notas del presentador. |
| [`results/`](results/) | Un JSON por versión con los puntajes automáticos y la rúbrica. |

## Cómo se corre

1. Instalar la versión a evaluar (`npx slizdeck@X.Y.Z install --project` en una carpeta vacía, o el repo local).
2. Para cada brief, en una sesión nueva del agente (sin contexto previo), pegar el **Pedido** del brief. Donde la skill pide una decisión, responder con lo que dice **Decisiones** del brief, sin improvisar. Guardar el deck como `evals/runs/X.Y.Z/<nombre-del-brief>.html`.
3. Puntaje automático de todos:
   ```bash
   node scripts/score-deck.mjs --all evals/runs/X.Y.Z --out=evals/results/X.Y.Z.json
   ```
4. Capturas y rúbrica:
   ```bash
   node scripts/shoot.mjs evals/runs/X.Y.Z/<brief>.html --clean --out=evals/runs/X.Y.Z/shots
   ```
   Puntuar cada deck con `rubric.md` mirando las capturas, y agregar el resultado al JSON de `results/` en `"rubric"`.
5. Comparar contra la versión anterior. Una versión que baja el promedio automático o el de la rúbrica en más de 5 puntos no se publica sin entender por qué.

`evals/runs/` no se versiona (está en `.gitignore`): los decks pesan y se regeneran. Lo que queda en git son los puntajes.

## Línea base

[`results/2.1.0-ejemplos.json`](results/2.1.0-ejemplos.json): los tres decks de `examples/test-0*`, generados de punta a punta por la skill (engine 1.4.0) y puntuados con el script de 2.2. No son corridas de estos briefs, pero sirven de referencia: **65 de 100 en promedio**, con dos debilidades claras que la 2.2 ataca: demasiado texto en pantalla (52 a 125 palabras por slide) y ninguna nota del presentador.
