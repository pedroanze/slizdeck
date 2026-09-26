# Fase: build — animación y generación

Se activa cuando `assets` ya resolvió cada ítem del wireframe (o el usuario pide regenerar el deck, o subir/bajar el nivel de animación de una slide existente: "sube el nivel de animación de la slide 3", "regenera con el wireframe actualizado"). Para agregar slides nuevas al deck, ver `reference/add.md`; para corregir el contenido de una slide puntual sin tocar su animación, ver `reference/fix.md`.

## 1. Nivel de animación

Proponer un nivel (NONE/LIGHT/MEDIUM/HEAVY, tabla y defaults en `reference/deck-schema.md`) y pedir confirmación. Si el deck es denso en datos, proponer MEDIUM. Reglas fijas: cover y transition siempre estáticas; HEAVY es ideal en decks de menos de 10 slides, entre 10 y 18 solo con pedido explícito, y nunca en más de 18 (ni con pedido explícito) — la política completa está en `reference/deck-schema.md`.

**Variar la entrada según el elemento.** Revelar todo el deck con el mismo `fade-up` es lo que hace que un deck animado se sienta mecánico. El template trae variantes que se combinan con `.reveal`: `r-rise` para títulos, `r-scale` para cifras, `r-blur` para imágenes y citas, `r-left` para listas y pasos, `r-wipe` para barras y reglas, `r-mask` para remates, `r-fade` para texto largo. Un contenedor con `.stagger` escalona sus hijos automáticamente sin escribir `--d` a mano.

## 2. Generar el deck

1. Copiar `template.html` al directorio del proyecto con nombre basado en el tema (ej. `pitch-acme.html`). Este es el primer momento en que el archivo del deck existe — todo lo decidido en `init` (pack, alternativa tipográfica, colores de marca) se aplica recién aquí, sobre este archivo:
   ```bash
   node scripts/apply-style-pack.mjs styles/<pack>.md pitch-acme.html               # o con --font=<id> si se eligió una alternativa
   node scripts/check-style-pack.mjs pitch-acme.html                                # confirmar que pasa antes de seguir
   ```
   Si `init` inyectó colores de marca sobre el pack, sobreescribirlos después de aplicar el pack y volver a validar.
2. **Assets**: usar los archivos resueltos en la fase `assets`; para los ítems marcados "seguir sin él", insertar el comentario `<!-- SLIZDECK-ASSET-PENDING: ... -->` justo antes del `<section>` afectado (ver `reference/assets.md`).
3. Por cada slide del wireframe: copiar el patrón elegido de `reference/components.md`, poblarlo con el contenido real; si el nivel es LIGHT, MEDIUM o HEAVY, agregar `class="reveal" data-step="N"` a los elementos a revelar progresivamente y `data-steps="N"` en la `<section>`; si es HEAVY en esa slide, agregar la técnica de `reference/animations.md`. **Cifras, comparaciones y series van con los patrones de datos** (`.sz-chart`, `table.sz-table`, `ol.sz-timeline`, `data-counter`, ver `reference/media-and-data.md` → "Datos"), nunca con tablas o gráficas armadas a mano.
   - **Notas del presentador**: el discurso de cada slide va en `<aside class="notes"><p>…</p></aside>` dentro de la propia `<section>` (no se ve en el deck). Viaja con la slide al reordenar o insertar, lo muestra el modo presentador (tecla `P`) y el export lo pone en el campo de notas de PowerPoint.
4. Insertar todas las `<section>` donde dice `INSERT SLIDES HERE`.
5. Actualizar `<title>` y el `lang` de `<html>` y los footers (`Speaker · Org · NN`, numeración sin huecos ni duplicados).
6. Aplicar `reference/design-guidelines.md` en cada slide (colores, jerarquía, variedad de layout, anti-clichés) antes de dar por cerrada la generación.

## 3. Abrir e iterar

Abrir el archivo generado en el navegador. El usuario revisa y pide ajustes en conversación normal (*"cambia la slide 3"*, *"elimina la 5"*, *"aplica X a todo el deck"*). Después de cada edit, el usuario recarga el navegador — no hace falta reabrir el archivo.

**Al terminar esta fase:** el deck existe como HTML y el usuario lo aprobó viéndolo en el navegador. Sigue `audit` antes de darlo por entregado, y `export` si necesita PDF o PPTX.
