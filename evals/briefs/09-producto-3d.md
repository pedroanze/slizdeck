# 09 · Producto con personaje 3D

**Pedido:**
> Hazme 7 slides para el lanzamiento de Astra, nuestro copiloto de soporte técnico para equipos de producto: resuelve el 68 % de los tickets de nivel 1 sin intervención humana y baja el tiempo de primera respuesta de 4 horas a 45 segundos. En la slide donde presentamos a Astra quiero que aparezca nuestro personaje 3D (`astra.glb`) en reposo, que salude en el segundo step (`Wave`) y se acerque la cámara en el tercero.

**Decisiones:**
- Pack: committed.
- Público: clientes actuales y líderes de producto en el webinar de lanzamiento.
- Assets: para el modelo 3D usar `examples/3d/assets/3d/robot.glb.js` (o el `.glb` de prueba con clips `Idle` y `Wave`); seguir sin capturas adicionales.
- Animación: HEAVY en la slide del personaje 3D (`3d-model`), MEDIUM en las slides de métricas.

**Qué debería aparecer:** una sola figura `.sz-3d` en la slide de presentación de Astra con su `<img class="sz-3d-poster" alt="...">`, el `<script type="importmap">` fijado con SRI en `<head>`, el cambio de clip `Idle` → `Wave` y el ajuste de cámara en `steps`, más las cifras de resolución (68 %) y tiempo de respuesta (4 h → 45 s) con patrones de datos.
