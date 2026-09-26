# Product

## Platform

web

## Stack

Estático: HTML/CSS/JS vanilla, sin frameworks ni build tools. Sin librerías de animación externas (no Motion/Framer Motion) — animaciones vía CSS y Web Animations API, para que cada deck generado sea un único archivo `.html` autónomo, abrible en cualquier navegador sin paso de compilación.

## Users

Fundadores y creadores de contenido técnico que generan pitch decks para inversores y charlas para conferencias, y los presentan en vivo desde el navegador. Público inicial: hispanohablante (la documentación está solo en español, por decisión de alcance).

## Product Purpose

Slizdeck es una Agent Skill (no una app) que genera decks de slides en HTML animado a partir de un design system propio, con contenido investigado en internet. Existe para que armar un pitch deck o una charla completos, de marca coherente, visualmente pulidos y con research real, no tome más que una conversación.

## Positioning

A diferencia de PowerPoint/Google Slides, Slidev o generadores de slides basados en frameworks, Slizdeck produce un único archivo HTML autónomo (sin paso de build, sin dependencias de un toolchain) que se presenta directo en el navegador. A diferencia de otras skills de generación de slides con IA, aplica una guía de diseño anti-genérico explícita (nunca gradientes/bullets/iconografía de stock por default) y nunca requiere que el usuario escriba CSS o JSON de tokens a mano: el design system se define por conversación guiada.

## Operating Context

Cada deck se genera dentro de la carpeta de un proyecto específico (no dentro de la skill); los scripts de validación y export se corren desde la carpeta del proyecto, con la ruta de la skill delante. Flujo típico: ocho fases (`init` → `brief` → `assets` → `build` → `audit` → `export`, más `add` y `fix` sueltas sobre un deck existente). El presentador usa navegación por teclado (←/→/space) en vivo, frente a audiencia de inversores o asistentes a una conferencia.

## Capabilities and Constraints

- Salida: un archivo `.html` por deck (canvas 1920×1080, navegación por teclado, fullscreen, barra de progreso), exportable a PDF vía impresión nativa del navegador.
- Export a PPTX propio (`scripts/export-pptx.mjs`), por geometría: mide cada slide en Chrome y reconstruye texto y formas nativas de PowerPoint en su posición real, con imágenes reales y speaker notes. Lo que no viaja (texto generado por CSS) se reporta, no se pierde en silencio. Export a PDF liviano (`scripts/export-pdf.mjs`).
- Cinco style packs calibrados (terminal, paper-white, committed, instrument, editorial), cada uno con 2 alternativas tipográficas, validados contra contraste WCAG y clichés visuales de IA.
- Versionado de engine: cada deck lleva embebida la versión de `template.html`; `scripts/doctor.mjs` detecta drift contra `CHANGELOG.md` en decks generados meses atrás.
- Fork/adaptación de `claude-slides` (MIT) — debe conservar el aviso de licencia (`LICENSE`, `NOTICE.md`).
- Escrita contra el subconjunto portable del estándar Agent Skills, para no atarse a un solo cliente. Verificada en Claude Code; el resto de clientes debería funcionar por el estándar, pero no está probado.

## Brand Commitments

El design system se define por deck (por proyecto/marca del usuario), no es fijo: slizdeck no impone una identidad propia sobre el deck generado. La marca de la herramienta vive solo en su repo y su README.

## Evidence on Hand

Sin testimonios ni casos de estudio de terceros todavía. La evidencia disponible es la del propio repo: `examples/pitch-showcase.html` como referencia end-to-end del sistema de packs, y la batería de validación en CI (smoke-test de 5 packs × 3 tipografías, audit, reveal, overflow, doctor). No inventar métricas de adopción ni testimonios.

## Product Principles

1. Nunca pedirle al usuario que escriba CSS/JSON a mano — el design system se define por conversación guiada o detectando tokens existentes.
2. Un archivo HTML autónomo, sin build step, siempre presentable con solo abrirlo en el navegador.
3. Diseño anti-genérico por default: un color domina, un acento con cuentagotas, cada slide con elemento visual, nunca solo texto/bullets.
4. Ninguna validación miente: si un script no puede verificar algo, lo dice; si un export deja contenido afuera, lo reporta. Nunca un ✓ que sugiera más de lo comprobado.
5. Portabilidad multi-herramienta como restricción de diseño desde el día uno, no como afterthought.

## Accessibility & Inclusion

El motor cubre `prefers-reduced-motion`, navegación por teclado y foco visible en los controles del viewer. Todo pack debe pasar el umbral de contraste WCAG que valida `scripts/check-style-pack.mjs` — es requisito, no aspiración: un deck proyectado en una sala grande falla antes que una pantalla de escritorio.
