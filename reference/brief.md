# Fase: brief — contenido, tamaño y arco

Se activa después de `init`, o directamente si el usuario ya trae el estilo resuelto ("usa el pack terminal para..."). También se activa suelta cuando el usuario quiere rehacer el contenido de un deck que ya existe sin tocar su diseño ("cambia el tema", "hazlo más corto", "agrega una sección de tracción").

## 1. Brief

Recoger en una ronda, sin re-preguntar lo que el usuario ya dio:

| Input | Ejemplo | Cuándo preguntar |
|---|---|---|
| **Tema/producto** | "Plataforma de gestión de inventario para restaurantes" | Siempre |
| **Público** | "Inversores seed", "audiencia técnica de una conferencia" | Siempre |
| **Tipo** | pitch deck (default) / talk / demo / recap de evento / workshop | Si no es obvio |
| **Duración/tamaño** | "5 min pitch" → ~8 slides; "charla de 30 min" → ~12 slides | Siempre |
| **Contexto existente** | "la info está en `docs/pitch-notes.md`" o una URL | Si el usuario lo menciona, leerlo antes de seguir |

## 2. Research

**Investigar en internet** lo necesario para que el contenido sea sólido y actual: datos de mercado, competidores, cifras del sector, validación de afirmaciones. No inventar números — si no se encuentra un dato real, dejarlo como placeholder explícito y avisar al usuario.

## 3. Arco narrativo

Proponer 1-3 arcos posibles según el tipo (tabla completa en `reference/deck-schema.md`). Para pitch deck de startup, el default es: **hook → problema → solución → cómo funciona → tracción/data → equipo → ask**. Presentar conciso, esperar elección o ajuste del usuario.

## 4. Wireframe

Con el arco elegido, presentar el wireframe slide-por-slide (formato en `reference/deck-schema.md`): número, título corto, patrón de `components.md`, una línea de descripción. Aplicar `reference/design-guidelines.md` al proponerlo — un mensaje por slide, elemento visual siempre presente, números en vez de adjetivos donde haya datos.

**Esperar aprobación explícita** antes de pasar a la siguiente fase. Ajustar cuantas veces haga falta.

**Al terminar esta fase:** hay un wireframe aprobado, slide por slide, con el patrón de layout y el mensaje de cada una decididos. Sigue `assets` — **nunca saltar directo a `build`**, porque el wireframe recién aprobado es exactamente lo que `assets` necesita para saber qué imágenes y datos pedir.
