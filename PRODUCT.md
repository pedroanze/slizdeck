# Product

## Platform

web

## Stack

Estático: HTML/CSS/JS vanilla, sin frameworks ni build tools. Sin librerías de animación externas (no Motion/Framer Motion) — animaciones vía CSS y Web Animations API, para que cada deck generado sea un único archivo `.html` autónomo, abrible en cualquier navegador sin paso de compilación.

## Users

Pedro (fundador/creador de contenido), único usuario por ahora. Genera pitch decks para inversores y charlas/presentaciones para conferencias, que él mismo presenta en vivo desde el navegador.

## Product Purpose

Slizdeck es una skill de Claude Code (no una app) que genera decks de slides en HTML animado a partir de un design system propio, con contenido investigado en internet. Existe para que armar un pitch deck o una charla completos —de marca coherente, visualmente pulidos, con research real— no tome más que una conversación.

## Positioning

A diferencia de PowerPoint/Google Slides, Slidev o generadores de slides basados en frameworks, Slizdeck produce un único archivo HTML autónomo (sin paso de build, sin dependencias de un toolchain) que se presenta directo en el navegador. A diferencia de otras skills de generación de slides con IA, aplica una guía de diseño anti-genérico explícita (nunca gradientes/bullets/iconografía de stock por default) y nunca requiere que el usuario escriba CSS o JSON de tokens a mano: el design system se define por conversación guiada.

## Operating Context

Cada deck se genera dentro de la carpeta de un proyecto específico (no dentro de la skill). Flujo típico: definir o detectar el design system → brief + research en internet → arco narrativo → wireframe aprobado por el usuario → generación del HTML → iteración en conversación normal → exportar a PDF (impresión nativa del navegador). El presentador usa navegación por teclado (←/→/space) en vivo, frente a audiencia de inversores o asistentes a una conferencia.

## Capabilities and Constraints

- Salida: un archivo `.html` por deck (canvas 1920×1080, navegación por teclado, fullscreen, barra de progreso), exportable a PDF vía impresión nativa del navegador.
- Export a PPTX: pendiente (Fase 3 del plan del proyecto); se delegará a la skill oficial `document-skills@anthropic-agent-skills` de Anthropic en vez de reimplementarse.
- Fork/adaptación de `claude-slides` (MIT) — debe conservar el aviso de licencia (`LICENSE`, `NOTICE.md`).
- Debe mantenerse instalable en Claude Code, Gemini CLI, Codex y OpenCode (estándar abierto Agent Skills) — el frontmatter de `SKILL.md` se mantiene al subconjunto portable del spec.
- Un solo estilo visual calibrado por ahora (Fase 1); el catálogo de múltiples estilos ("style packs") queda pendiente de referencias visuales del usuario (Fase 2).

## Brand Commitments

Sin marca propia definida para slizdeck-la-herramienta. El design system se define por deck (por proyecto/marca del usuario), no es fijo.

## Evidence on Hand

Sin testimonios, datos de clientes ni casos de estudio: es una herramienta interna/personal, no un producto con evidencia de mercado propia.

## Product Principles

1. Nunca pedirle al usuario que escriba CSS/JSON a mano — el design system se define por conversación guiada o detectando tokens existentes.
2. Un archivo HTML autónomo, sin build step, siempre presentable con solo abrirlo en el navegador.
3. Diseño anti-genérico por default: un color domina, un acento con cuentagotas, cada slide con elemento visual, nunca solo texto/bullets.
4. No reinventar lo que ya existe con calidad de producción (PPTX se delega a la skill oficial de Anthropic en vez de reimplementarse).
5. Portabilidad multi-herramienta como restricción de diseño desde el día uno, no como afterthought.

## Accessibility & Inclusion

Sin requisito específico definido aún más allá de lo que ya cubre el motor heredado de `claude-slides` (`prefers-reduced-motion`, navegación por teclado).
