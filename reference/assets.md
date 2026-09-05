# Fase: assets — imágenes, logos y datos obligatorios

**Se activa siempre entre `brief` y `build`, nunca se salta.** La mayoría de los decks reales llevan imágenes en más de la mitad de sus slides — un wireframe aprobado sin resolver esto todavía es un wireframe a medio hacer, no uno listo para generar. Esta fase existe porque antes vivía como un sub-paso fácil de pasar por alto dentro de la generación; ahora es un punto de control explícito con su propia pregunta y su propia respuesta antes de que se escriba una sola línea de HTML.

También se activa suelta cuando el usuario pregunta directamente "¿qué imágenes necesito?" sobre un wireframe ya aprobado, o cuando pide agregar una imagen a una slide de un deck ya generado.

## 1. Recorrer el wireframe y clasificar cada slide

Por cada slide, decidir si necesita algo más que texto:

**Necesita imagen** cuando la slide:
- Muestra un producto, una pantalla o un resultado visible.
- Presenta personas (equipo, speakers, testimonios).
- Abre o cierra el deck y necesita peso visual.
- Es la pantalla de espera antes de empezar.

**Necesita logo** cuando el deck menciona marcas de terceros (clientes, partners, stack tecnológico) o cuando el footer/portada lleva el logo del propio presentador/org.

**Necesita dato real** cuando el wireframe tiene una cifra. Un placeholder marcado (`[DATO PENDIENTE: ...]`) es preferible a un número inventado, siempre.

Las slides de puro texto/argumento (sin producto, sin persona, sin cifra) no necesitan nada — no forzar una imagen donde no aporta.

## 2. Pedir todo en un solo mensaje

Para cada ítem de la lista, decir explícitamente:
- **Qué slide** (número y título corto).
- **Qué debería mostrar** ("captura del dashboard principal", "foto del equipo en la oficina", "logo de Acme en SVG o PNG con fondo transparente").
- **En qué proporción**: a sangre completa (1920×1080), media pantalla (960×1080), o recuadro (libre).
- Para logos: dónde va (footer de todas las slides, una slide de "clientes", ambas).
- Para datos: qué cifra falta y de qué slide.

## 3. Bloquear hasta tener una respuesta explícita por ítem

**No se pasa a `build` con ítems sin resolver.** Cada ítem de la lista necesita una de estas tres respuestas, explícitas:

1. **Resuelto** — el usuario da una ruta, una URL, o dice "usa el logo que está en `assets/logos/acme.svg`". Usar ese archivo/URL directamente en `build`.
2. **Seguir sin él, a sabiendas** — el usuario dice explícitamente "sigue sin esa foto" o "no la tengo, continúa". En este caso `build` debe insertar un marcador en el HTML generado, inmediatamente antes del `<section>` afectado:
   ```html
   <!-- SLIZDECK-ASSET-PENDING: slide 04 — foto del equipo, sigue con placeholder -->
   ```
   Esto es lo que la fase `audit` reporta después como aviso (no como fallo: ya fue una decisión informada del usuario, no un descuido).
3. **Cambiar el wireframe** — el usuario prefiere quitar o rehacer esa slide para no depender del asset. Volver brevemente a `brief` para ese ajuste puntual, sin repetir toda la fase.

Si el usuario no responde a un ítem (lo ignora, cambia de tema), **volver a preguntar por ese ítem específico** antes de generar — no asumir "seguir sin él" por silencio. El usuario tiene que elegir activamente una de las tres opciones.

## 4. Guardar los archivos

`assets/img/` para fotos y capturas, `assets/people/` para personas, `assets/logos/` para marcas, `assets/qr/` para códigos QR (`qrencode -o assets/qr/[nombre].png -s 20 -m 2 -l H "URL"`, requiere `brew install qrencode` una vez).

Ver `reference/media-and-data.md` para los patrones HTML/CSS de cada tipo de slide con imagen o dato.

**Al terminar esta fase:** cada ítem del wireframe tiene una resolución explícita — un archivo real, un marcador de pendiente aceptado, o un wireframe ajustado para no necesitarlo. Sigue `build`.
