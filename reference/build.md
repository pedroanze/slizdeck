# Fase: build — animación y generación

Se activa cuando `assets` ya resolvió cada ítem del wireframe (o el usuario pide regenerar/ajustar un deck existente: "agrega más animación a la slide 3", "regenera con el wireframe actualizado").

## 1. Nivel de animación

Proponer un nivel (NONE/LIGHT/HEAVY, tabla y defaults en `reference/deck-schema.md`) y pedir confirmación. Reglas fijas: cover y transition siempre estáticas; nunca HEAVY en decks de más de 18 slides salvo pedido explícito.

**Variar la entrada según el elemento.** Revelar todo el deck con el mismo `fade-up` es lo que hace que un deck animado se sienta mecánico. El template trae variantes que se combinan con `.reveal`: `r-rise` para títulos, `r-scale` para cifras, `r-blur` para imágenes y citas, `r-left` para listas y pasos, `r-wipe` para barras y reglas, `r-mask` para remates, `r-fade` para texto largo. Un contenedor con `.stagger` escalona sus hijos automáticamente sin escribir `--d` a mano.

## 2. Generar el deck

1. Copiar `template.html` al directorio del proyecto con nombre basado en el tema (ej. `pitch-acme.html`). Este es el primer momento en que el archivo del deck existe — todo lo decidido en `init` (pack, alternativa tipográfica, colores de marca) se aplica recién aquí, sobre este archivo:
   ```bash
   node scripts/apply-style-pack.mjs styles/<pack>.md pitch-acme.html               # o con --font=<id> si se eligió una alternativa
   node scripts/check-style-pack.mjs pitch-acme.html                                # confirmar que pasa antes de seguir
   ```
   Si `init` inyectó colores de marca sobre el pack, sobreescribirlos después de aplicar el pack y volver a validar.
2. **Assets**: usar los archivos resueltos en la fase `assets`; para los ítems marcados "seguir sin él", insertar el comentario `<!-- SLIZDECK-ASSET-PENDING: ... -->` justo antes del `<section>` afectado (ver `reference/assets.md`).
3. Por cada slide del wireframe: copiar el patrón elegido de `reference/components.md`, poblarlo con el contenido real; si el nivel es LIGHT o HEAVY, agregar `class="reveal" data-step="N"` a los elementos a revelar progresivamente y `data-steps="N"` en la `<section>`; si es HEAVY en esa slide, agregar la técnica de `reference/animations.md`.
4. Insertar todas las `<section>` donde dice `INSERT SLIDES HERE`.
5. Actualizar `<title>` y los footers (`Speaker · Org · NN`, numeración sin huecos ni duplicados).
6. Aplicar `reference/design-guidelines.md` en cada slide (colores, jerarquía, variedad de layout, anti-clichés) antes de dar por cerrada la generación.

## 3. Abrir e iterar

Abrir el archivo generado en el navegador. El usuario revisa y pide ajustes en conversación normal (*"cambia la slide 3"*, *"elimina la 5"*, *"aplica X a todo el deck"*). Después de cada edit, el usuario recarga el navegador — no hace falta reabrir el archivo.

**Al terminar esta fase:** el deck existe como HTML y el usuario lo aprobó viéndolo en el navegador. Sigue `audit` antes de darlo por entregado, y `export` si necesita PDF o PPTX.
