# Fase: studio — que el usuario edite a mano

Se activa cuando el usuario quiere tocar el deck él mismo, como en PowerPoint ("quiero mover esto yo", "déjame editar los textos", "¿puedo cambiar la imagen a mano?", "abre el editor"), o cuando pide un ajuste fino de posición o tamaño que se resuelve antes mirando que describiendo.

Studio es un editor visual local. Abre cualquier deck de slizdeck en el navegador y guarda cada cambio directo en el `.html`, sin exportar ni convertir nada. Sirve para decks ya generados, también con engines viejos o hechos con `export offline`.

## 1. Abrirlo

```bash
node scripts/studio.mjs deck.html            # abre el navegador
node scripts/studio.mjs deck.html --no-open  # solo imprime la URL
node scripts/studio.mjs deck.html --port=4400
```

El servidor queda corriendo hasta cortarlo: **lanzarlo en segundo plano** y pasarle al usuario la URL que imprime (trae un token; sin él responde 403). Escucha solo en `127.0.0.1` y sirve únicamente la carpeta del deck.

Qué decirle al usuario al abrirlo, en una línea: *"Clic selecciona, doble clic edita el texto, arrastra para mover. Todo se guarda solo; ⌘Z deshace."*

## 2. Qué puede hacer el usuario

| Acción | Cómo | Qué queda en el HTML |
|---|---|---|
| Editar texto | Doble clic (o `Enter`) sobre el texto; `Esc` o clic afuera confirma | El contenido del elemento. Solo se conserva formato en línea (`b`, `strong`, `em`, `i`, `span`, `br`, `a`) |
| Mover | Arrastrar; flechas 1 px, `Shift` 10 px; `Alt` apaga las guías | `translate: Xpx Ypx` en el `style` del elemento. El layout no cambia: es un desplazamiento sobre su lugar |
| Redimensionar | Tiradores. Laterales: ancho. Esquinas de un texto: tamaño de fuente. Inferior: alto | `width`, `font-size`, `height` o `min-height` en línea |
| Reemplazar imagen | Botón "Reemplazar" o soltar un archivo sobre la imagen | El archivo se copia a `assets/` junto al deck y cambia el `src` |
| Tipografía y color | Panel: tamaño, peso, alineación, color | Colores siempre como `var(--cs-*)`, así cambiar de pack sigue funcionando |
| Paso de animación | Panel: "Aparece en el paso N" | `.reveal` + `data-step`, y `data-steps` de la slide |
| Contadores y gráficas | Panel: valor del contador, tabla de datos de `.sz-chart` | `data-counter` y el JSON en línea de la gráfica |
| Notas del presentador | Panel de la slide | `<aside class="notes">` |
| Slides | Rail izquierdo: arrastrar para reordenar, duplicar, borrar | Renumera `data-label` y footers igual que `scripts/renumber.mjs` |
| Duplicar o borrar un elemento | `⌘D`, `Supr` | — |
| Deshacer y rehacer | `⌘Z`, `⇧⌘Z` (hasta 100 pasos por sesión) | — |
| Revisar | Botón "Revisar" | Corre `audit.mjs` y, si hay Chrome, `check-overflow.mjs` |
| Vista previa | Botón "Vista previa" | Abre el deck real, con sus animaciones |

Mientras se edita, cada slide se muestra en su **estado final**: todos los pasos revelados, contadores en su cifra, 3D en póster, sin animaciones. Lo que se ve es lo que sale en el PDF y el PPTX.

## 3. Lo que Studio no hace (decirlo, no prometerlo)

- **Texto generado por CSS** (`::before`/`::after`, por ejemplo el número de un `act-marker`) no se edita en línea: no existe en el HTML.
- **El interior de un SVG, de una gráfica o de una escena 3D** no se edita: se selecciona la figura entera, que sí se mueve y se redimensiona. Los datos de la gráfica van por el panel.
- **Una escena 3D movida o redimensionada necesita póster nuevo:** `node scripts/poster-3d.mjs deck.html`.
- **No crea elementos nuevos** (un cuadro de texto, una forma, una slide en blanco). Duplicar sí. Agregar contenido es de las fases `add` y `fix`.
- **No cambia el pack ni los tokens.** Eso es `init`.
- **Mover no reacomoda el resto.** Un elemento arrastrado puede quedar encima de otro o salirse de la slide: por eso existe "Revisar", y por eso se corre `check-overflow.mjs` al terminar (paso 5).
- Deshacer un reemplazo de imagen devuelve el `src` anterior, pero el archivo subido queda en `assets/`.

## 4. Convivir con el agente

El usuario y el agente pueden editar el mismo deck:

- Si el agente modifica el `.html` mientras Studio está abierto, el editor se recarga solo. Un cambio del usuario hecho sobre una versión vieja se rechaza y el editor recarga, sin pisar nada.
- La primera vez que Studio escribe en una sesión deja una copia del deck original en `.slizdeck/studio/` junto al deck.
- **El HTML en disco nunca lleva marcas del editor.** Studio aplica parches al texto fuente; no guarda el DOM del navegador. El diff de una edición es lo que se editó y nada más.

### Comentarios del usuario al agente

Para lo que el usuario no puede o no quiere hacer a mano ("este gráfico debería ser de barras", "reescribe este párrafo más corto"), selecciona el elemento, escribe un comentario en el panel y pulsa **Enviar al agente**. Los comentarios viven en `<deck>.comments.json`, junto al deck.

```bash
node scripts/studio.mjs comments deck.html --wait     # se queda esperando hasta que el usuario envíe
node scripts/studio.mjs comments deck.html            # lista los que siguen abiertos
node scripts/studio.mjs comments deck.html --json     # lo mismo, para leer por programa
node scripts/studio.mjs comments deck.html --resolve <id|all>
```

Flujo cuando el usuario va a revisar el deck en Studio:

1. Lanzar Studio en segundo plano y, también en segundo plano, `comments deck.html --wait`.
2. Cuando `--wait` termina, imprime los comentarios enviados: slide, etiqueta, el texto del usuario y el elemento señalado (etiqueta, clases y un extracto).
3. Aplicar cada uno con la fase [`fix`](fix.md), con su mismo alcance: solo lo señalado.
4. Marcar cada comentario aplicado con `--resolve <id>`. El editor se recarga solo y el comentario desaparece de la lista del usuario.
5. Volver a lanzar `--wait` si el usuario sigue revisando.

Un comentario que no se puede aplicar tal cual (ambiguo, o que pide algo de otra fase) no se resuelve en silencio: se le pregunta al usuario.

## 5. Al cerrar

Las ediciones a mano no pasan por las reglas de diseño, así que antes de exportar o dar el deck por terminado:

```bash
node scripts/audit.mjs deck.html
node scripts/check-reveal.mjs deck.html
node scripts/check-overflow.mjs deck.html
```

`check-overflow.mjs` es el que importa acá: detecta el texto que quedó encima de otro o fuera de la slide después de mover y redimensionar. Los hallazgos se le muestran al usuario; no se "arreglan" deshaciendo lo que hizo a mano sin preguntarle.

`<deck>.comments.json` y `.slizdeck/` son archivos de trabajo: no hace falta entregarlos ni versionarlos.
