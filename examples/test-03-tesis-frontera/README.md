# Prueba end-to-end de slizdeck · CASO 3 "avanzado"

Bitácora de una ejecución completa de la Agent Skill `slizdeck` (v1.4.0) sobre un caso real y
exigente, hecha por un agente que además hace de usuario simulado en los puntos donde el flujo
se bloquea esperando confirmación humana.

**Entregables** (el PDF, el PPTX y las capturas viven en el [release `examples`](https://github.com/pedroanze/slizdeck/releases/tag/examples), fuera del repo por peso)

| Archivo | Qué es |
|---|---|
| `tesis-frontera-modelos.html` | El deck. 18 `<section>` (1 standby + 17 numeradas), autónomo, sin dependencias externas |
| [`tesis-frontera-modelos.pdf`](https://github.com/pedroanze/slizdeck/releases/download/examples/tesis-frontera-modelos.pdf) | Export PDF por impresión nativa de Chrome headless, 18 páginas |
| [`tesis-frontera-modelos.pptx`](https://github.com/pedroanze/slizdeck/releases/download/examples/tesis-frontera-modelos.pptx) | Export PPTX editable, 18 slides (con pérdidas importantes, ver fase export) |
| [`test-03-tesis-frontera-shots.zip`](https://github.com/pedroanze/slizdeck/releases/download/examples/test-03-tesis-frontera-shots.zip) | 18 PNG 1920×1080 generados por `shoot.mjs` para la revisión visual |
| `README.md` | Este documento |

---

> Esta prueba se hizo con el engine **1.4.0**. Todos sus hallazgos se corrigieron entre 1.4.1 y 2.2 (ver `CHANGELOG.md`). La bitácora completa (fase por fase, salidas de validación y hallazgos) está en el historial de git, en `examples/test-03-tesis-frontera/README.md` hasta el commit `21fca69`.

## Caso y perfil

| | |
|---|---|
| **Tema** | Una tesis propia sobre los modelos de frontera y cómo evoluciona la IA en los próximos años |
| **Tipo** | Charla de tesis, 35-40 min |
| **Público** | Audiencia sofisticada: investigadores, inversores técnicos, líderes de producto |
| **Tamaño pedido** | 16-18 slides |
| **Style pack asignado** | `editorial` (obligatorio por el encargo) |
| **Fecha simulada** | 2026-09-06 |

**Qué se estaba probando, y por qué este caso.** Es el caso diseñado para estresar tres cosas
que los casos fáciles no tocan:

1. **`reference/deck-schema.md` con un arco que no está en su tabla.** Los arcos documentados
   son para pitch, demo, recap, workshop y "talk" de 8-12 slides. Una charla de tesis de 40 min
   con 17 slides no encaja en ninguno.
2. **Gráficas de serie temporal y curvas.** El encargo pedía explícitamente comprobar si
   `components.md` y `media-and-data.md` traen un patrón para esto. **No lo traen** (ver
   hallazgo H-01), así que el deck lleva cinco SVG construidos a mano sobre los tokens del
   design system.
3. **Citas atribuidas a personas reales y cifras con fuente.** El riesgo principal del caso: una
   sola cita inventada invalida la prueba. Se trató con paranoia deliberada (ver §4).

Además: nivel de animación **HEAVY** en el límite exacto que permite la regla fija del schema
(18 secciones), para ver si `reference/animations.md` sostiene la técnica de dibujo de path.

---

## Qué protege hoy

El deck queda en el repo sin retocar, como caso real generado de punta a punta por la skill. El CI lo exporta en cada push: con el exportador por clases de 1.4 perdía 100 textos en el PPTX, y hoy tiene que exportar a PPTX y PDF sin perder ninguno. También forma parte de la línea base de los evals (`evals/results/2.1.0-ejemplos.json`).

## Fuentes

Cada cifra del deck y **cada cita entrecomillada atribuida a una persona** sale de una de estas
URL, todas consultadas y leídas durante la fase brief. Las dos citas atribuidas se verificaron
contra la publicación original del propio autor / del entrevistador, no contra un resumen.

### 4.1 Citas atribuidas (el riesgo principal del caso)

| Cita (verbatim, sin traducir) | Persona | Fuente primaria | Dónde se usa |
|---|---|---|---|
| *"In 2024, the idea of using reinforcement learning (RL) to train models to generate chains of thought has become a new focus of scaling."* | Dario Amodei, CEO de Anthropic | <https://darioamodei.com/post/on-deepseek-and-export-controls> · post "On DeepSeek and Export Controls", enero de 2025. **Sitio propio del autor** | Slide 08 |
| *"So it's back to the age of research again, just with big computers."* | Ilya Sutskever, cofundador de Safe Superintelligence | <https://www.dwarkesh.com/p/ilya-sutskever-2> · entrevista con Dwarkesh Patel, 25 nov 2025, sección "What are we scaling?" (~00:18:49). **Transcripción del entrevistador** | Slide 08 |

Ambas se muestran en su idioma original y sin editar. Se descartaron varias formulaciones que
circulan atribuidas a estas mismas personas ("the age of scaling is over") porque son títulos de
artículos de terceros, no palabras textuales verificables en el original.

### 4.2 Cifras

| # | URL | Qué dato salió de aquí |
|---|---|---|
| 1 | <https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year> | Cómputo de entrenamiento: modelos notables 4,1x/año (IC 90%: 3,7x-4,6x), frontera 5,3x/año (IC 90%: 4,9x-5,7x), 2010 a may 2024. Valores FLOP: GPT-3 = 3e23, GPT-4 = 2e25, Gemini Ultra = 5e25. Pub. 28 may 2024 → **slide 04** |
| 2 | <https://epoch.ai/data-insights/llm-inference-price-trends> | Precio para igualar un nivel fijo en MMLU. Nivel GPT-3: 60,00 USD/M (nov 2021) → 20,00 (sep 2022) → 0,07 (Gemini 1.5 Flash-8B, oct 2024). Nivel GPT-4: 37,50 USD/M (GPT-4-0314, mar 2023) → 0,18 (Gemini 2.0 Flash, feb 2025). Rango de caída 9x-900x/año. Pub. 12 mar 2025 → **slides 05 y 14** |
| 3 | <https://epoch.ai/data-insights/ai-capabilities-progress-has-sped-up> | Quiebre de pendiente del ECI: 8,3 → 15,5 puntos/año, breakpoint 8 abr 2024, factor 1,85x, R² = 0,9653, IC 90% del factor 1,3x-3,1x, regresión de dos segmentos sobre 17 puntos (dic 2021-dic 2025). Pub. 23 dic 2025 → **slide 07 (pivote de la tesis)** |
| 4 | <https://epoch.ai/data-insights/eci-frontier-trend> | 14 puntos ECI/año en la era de razonamiento vs 6 antes; o1-preview/o1-mini (sep 2024) como frontera de era; **Claude Fable 5 = 162,48 ECI**. Pub. 1 sep 2026, por Alexander Barry → **slide 07 (ancla absoluta de las rectas)** |
| 5 | <https://epoch.ai/data-insights/open-closed-eci-gap> | Brecha abierto/cerrado desde ene 2026: 4 meses, *"The average ECI gap was 8 points, similar to the gap between GPT-5 and GPT-5.5"*. Valores: GPT-5.5 Pro 159,35 · Gemini 3.5 Flash 156,31 · Claude Opus 4.7 156,18 · Kimi K2.6 151,60 · Qwen 3.6 Max Preview 150,16 · GLM-5.1 149,94. Pub. 29 may 2026 → **slide 15** |
| 6 | <https://epoch.ai/blog/power-demands-of-frontier-ai-training> | *"The largest individual frontier training runs in 2030 will likely draw 4-16 gigawatts (GW)"*; crecimiento 2,2x-2,9x/año; runs actuales "exceeding 100 MW"; >100 GW mundo y >50 GW EE.UU. en 2030, ~5% de su capacidad de generación. Pub. 11 ago 2025 → **slides 10 y 11** |
| 7 | <https://arxiv.org/abs/2211.04325> | Villalobos, Ho, Sevilla, Besiroglu, Heim, Hobbhahn: *"models will be trained on datasets roughly equal in size to the available stock of public human text data between 2026 and 2032"*. Rev. 4 jun 2024 → **slide 10** |
| 8 | <https://futurumgroup.com/insights/ai-capex-2026-the-690b-infrastructure-sprint/> | *"The five largest US cloud and AI infrastructure providers… between $660 billion and $690 billion on capital expenditure in 2026, nearly doubling 2025 levels"*. Desglose: Amazon 200, Alphabet 175-185, Microsoft 120+, Meta 115-135, Oracle 50; ~380 en 2025. Pub. 12 feb 2026 → **slides 10 y 12** |
| 9 | <https://www.anthropic.com/claude-fable-and-mythos-5-1> | Fable 5.1 / Mythos 5.1, sep 2026: 10 USD entrada, 50 USD salida, 0,25 USD lectura de caché (−75%), ahorro *"around 25%"* en cargas típicas y *"up to around 45%"* en agénticas. **Fuente del fabricante** → **slide 14** |
| 10 | <https://www.cloudzero.com/blog/gpt-6-pricing/> | GPT-6 Astra, 3 sep 2026: 10/50 USD, caché 1 USD, escritura de caché 12,50 USD, ventana ~1M tokens. GPT-5.6 Sol: 4/20 USD (tarifa promocional hasta 21 nov 2026). Astra = 2,5x Sol → **slide 14** |
| 11 | <https://huggingface.co/blog/ResterChed/kimi-k3-model-overview-mxfp4-quantization-open-wei> | Kimi K3 (Moonshot): 2,8 T parámetros totales, ~50 mil millones activos por token (16 de 896 expertos), API 16 jul 2026, **pesos 27 jul 2026**, ventana 1M tokens → **slide 15 (nota al pie)** |
| 12 | <https://spectrum.ieee.org/state-of-ai-index-2026> | Stanford AI Index 2026 (pub. 13 abr 2026): capacidad mundial de cómputo de IA >3x/año desde 2022, 30x desde 2021; inversión global 581 mil M USD en 2025 vs 253 en 2024. Contexto de research, no llegó a ninguna cifra en pantalla |

**Anclas del encargo, contrastadas y no contradichas.** GPT-6 Astra (3 sep 2026, 10/50 USD),
Fable 5.1 / Mythos 5.1 (Anthropic, ~25% más barato) y Kimi K3 (2,8T, pesos abiertos, jul 2026) se
verificaron contra fuentes primarias y se ampliaron; ninguna se contradice. Precisión que sí se
añadió: el "~25% más barato" de Fable 5.1 **no es una bajada de precio de lista** (sigue en 10/50
USD) sino un recorte del 75% en la lectura de caché que se traduce en ~25% menos coste típico.
Esa distinción es material para el corolario 01 de la tesis y está explicada en la slide 14.

**Placeholders `[DATO PENDIENTE: ...]` usados: ninguno.** Todos los datos del wireframe
encontraron fuente. Los dos pendientes del deck son de imagen, no de dato.

---
