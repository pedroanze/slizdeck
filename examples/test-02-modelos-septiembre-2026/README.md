# Prueba end-to-end de slizdeck · CASO 2 (intermedio)

Bitácora de una ejecución completa de la skill `slizdeck` sobre un caso real, con un
agente haciendo a la vez de **operador de la skill** y de **usuario simulado** (decide en
cada punto donde la skill se bloquea esperando confirmación humana).

- **Fecha de la prueba:** 2026-09-06
- **Versión de la skill:** 1.4.0 (`SKILL.md` / `template.html` / `CHANGELOG.md`)
- **Deck generado:** [`frontier-septiembre-2026.html`](frontier-septiembre-2026.html)
- **Exports:** [`frontier-septiembre-2026.pdf`](https://github.com/pedroanze/slizdeck/releases/download/examples/frontier-septiembre-2026.pdf) (14 págs, 16,1 MB) ·
  [`frontier-septiembre-2026.pptx`](https://github.com/pedroanze/slizdeck/releases/download/examples/frontier-septiembre-2026.pptx) (14 slides, 178 KB), en el [release `examples`](https://github.com/pedroanze/slizdeck/releases/tag/examples), fuera del repo por peso
- **Capturas de la fase audit:** [`test-02-modelos-septiembre-2026-shots.zip`](https://github.com/pedroanze/slizdeck/releases/download/examples/test-02-modelos-septiembre-2026-shots.zip) (14 PNG 1920×1080)

---

> Esta prueba se hizo con el engine **1.4.0**. Todos sus hallazgos se corrigieron entre 1.4.1 y 2.2 (ver `CHANGELOG.md`). La bitácora completa (fase por fase, salidas de validación y hallazgos) está en el historial de git, en `examples/test-02-modelos-septiembre-2026/README.md` hasta el commit `21fca69`.

## Caso y perfil

| | |
|---|---|
| **Tema** | Los modelos de IA de frontera lanzados en la primera semana de septiembre de 2026: GPT-6 Astra (OpenAI), Claude Fable 5.1 / Mythos 5.1 (Anthropic) y los modelos chinos (Kimi K3, Qwen3.8-Max, DeepSeek V4-Pro) |
| **Público** | Audiencia técnica de conferencia / equipo de producto técnico |
| **Tipo** | Talk de 20-25 min |
| **Tamaño** | 13 slides numeradas + 1 pantalla de espera (standby) = 14 `<section>` |
| **Style pack** | `instrument` (asignado por el encargo) |
| **Nivel de animación** | LIGHT |

**Qué se estaba probando en concreto.** Este es el punto intermedio de la batería: un deck
que **sí** lleva gráficas, tablas comparativas, benchmarks y precios lado a lado. Es
exactamente el terreno para el que existe el pack `instrument` ("decks cargados de
métricas […] cuando hay muchas cifras y necesitan leerse comparadas", `styles/instrument.md`).
La pregunta de la prueba es si la skill sostiene ese caso de punta a punta: si el catálogo
de componentes lo cubre, si los validadores lo aprueban, y si los exports lo conservan.

**Restricción dura autoimpuesta:** cero cifras inventadas. Cada número que aparece en una
slide está trazado a una URL en la sección [Fuentes](#4-fuentes). Donde no había dato
publicado se usó el placeholder explícito que manda `reference/assets.md`
(`[DATO PENDIENTE]`), nunca un número plausible.

---

## Qué protege hoy

El deck queda en el repo sin retocar, como caso real generado de punta a punta por la skill. El CI lo exporta en cada push: con el exportador por clases de 1.4 perdía 116 textos en el PPTX, y hoy tiene que exportar a PPTX y PDF sin perder ninguno. También forma parte de la línea base de los evals (`evals/results/2.1.0-ejemplos.json`).

## Fuentes

Toda cifra que aparece en una slide está en esta lista. Ninguna celda de las dos tablas
comparativas carece de fuente.

### GPT-6 Astra (OpenAI)

| Dato usado | Slide | Fuente |
|---|---|---|
| Anunciado 3-sep-2026; despliegue a planes de pago, API y AWS los días siguientes | 02 | [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/gpt-6-astra-pricing-confirms-125442006.html) ("Release date: September 3, 2026") · [DataCamp](https://www.datacamp.com/blog/gpt-6-astra) ("rolling out to a limited set of organizations first, then to all ChatGPT Plus, Pro, Business, and Enterprise users over the coming days, plus the OpenAI API and AWS") · [llm-stats](https://llm-stats.com/models/gpt-6-astra) ("Released on Sep 4, 2026") |
| $10,00 input / $50,00 output por MTok | 03, 04, 11 | [Yahoo Finance](https://finance.yahoo.com/technology/ai/articles/gpt-6-astra-pricing-confirms-125442006.html) · [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| $1,00 lectura de caché por MTok | 04 | [llm-stats](https://llm-stats.com/models/gpt-6-astra) ("Cached input: $1.00") |
| Contexto 1M | 03 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) ("a 1M-token context model") |
| Terminal-Bench 4.0 = 57,7 | 06, 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Terminal-Bench Science = 64,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| AutomationBench = 41,4 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| FrontierMath Tier 4 = 97,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Humanity's Last Exam con tools = 57,2 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |

### Claude Fable 5.1 / Mythos 5.1 (Anthropic)

| Dato usado | Slide | Fuente |
|---|---|---|
| Lanzados 1-sep-2026 | 02 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) · [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| $10,00 / $50,00 por MTok (sin cambio respecto a Fable 5) | 03 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) |
| Caché: $0,25 (Fable 5.1) frente a $1,00 (Fable 5); bajada del 75 % | 04 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) (tabla "Fable 5.1 $10 / $0.25 / $50" vs "Fable 5 $10 / $1.00 / $50") |
| Contexto 1M, salida máx. 128K | 03 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| Disponible como `claude-fable-5-1` en API de Anthropic, Amazon Bedrock, Google Cloud y Microsoft Foundry | 08 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| Mythos 5.1 = mismo modelo, salvaguardas distintas, acceso restringido a ciberseguridad y ciencias de la vida | 08 | [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) |
| Terminal-Bench 4.0: Fable 5.1 = 55,8 · Mythos 5.1 = 60,9 | 06, 07, 08 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) · corroborado por [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) para Fable 5.1 |
| Terminal-Bench Science 0.1: Fable 5.1 = 52,6 · Opus 5 = 29,0 · Fable 5 = 24,7 · Sol = 22,4 | 07 | [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| AutomationBench: Fable 5.1 = 31,4 · Opus 5 = 26,9 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) · Fable 5.1 corroborado en [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) |
| FrontierMath Tier 4: Fable 5.1 = 87,8 · Opus 5 = 73,2 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| HLE con tools: Fable 5.1 = 65,0 · Opus 5 = 63,6 | 07 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |
| Terminal-Bench 4.0: Opus 5 = 52,3 · Fable 5 = 42,0 · GPT-5.6 Sol = 37,3 | 06 | [Vellum](https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained) |

### Kimi K3 (Moonshot AI)

| Dato usado | Slide | Fuente |
|---|---|---|
| 2,8 T de parámetros totales, 104 B activos por token | 02, 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("2.8 trillion parameter mixture of experts model", "104 billion active parameters per token") |
| Contexto 1M (1.048.576 tokens) | 03 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) |
| Pesos abiertos el 26-jul-2026 | 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("Release Date: July 26, 2026") |
| Licencia `kimi-k3`: condiciona el uso comercial de inferencia por encima de 20 M USD/año | 10 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("gates commercial inference use above $20 million a year in revenue") |
| $3,00 input / $15,00 output; $0,30 en cache hit | 03, 04, 11 | [roo.beehiiv](https://roo.beehiiv.com/p/kimi-k3-open-weights-license-benchmarks) ("$3 per million input tokens on a cache miss and $15 per million output tokens, with a much cheaper $0.30 per million tokens on a cache hit") |

### Qwen3.8-Max (Alibaba)

| Dato usado | Slide | Fuente |
|---|---|---|
| 2,4 T de parámetros, 95 B activos, contexto 1M | 10 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("2.4-trillion-parameter mixture-of-experts (MoE) model with 95B active parameters", "1M-token context window") |
| Release 3-ago-2026; snapshot **-0902** el 2-sep-2026 | 02 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) · [MarkTechPost](https://www.marktechpost.com/2026/07/19/alibaba-previews-qwen3-8-max-a-2-4-trillion-parameter-multimodal-model-days-after-moonshots-kimi-k3-open-weight-launch/) |
| Code Arena WebDev = 1691 puntos (versión -0902), primer puesto | 02 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("ranks first on Code Arena WebDev with 1,691 points") |
| $2,00 input / $6,00 output por MTok | 03, 11 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) ("$2/$6 per million input/output tokens") |
| Pesos abiertos: **`[DATO PENDIENTE]`** | 03, 10 | [DataCamp](https://www.datacamp.com/blog/qwen3-8-max) dice "the first time Qwen **plans** to open-source a Max-class model": hay intención anunciada, no publicación verificable. Por eso el placeholder. |

### DeepSeek V4-Pro

| Dato usado | Slide | Fuente |
|---|---|---|
| 1,6 T de parámetros totales, 49 B activos, contexto 1M | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) ("1.6T total parameters, 49B active", "1M token context window") |
| GA el 13-ago-2026 (checkpoint V4-Pro-0813) | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) |
| $0,435 input / $0,87 output por MTok | 03, 11 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) ("$0.435 / 1M input and $0.87 / 1M output") |
| SWE-bench Verified = 80,6 frente a 80,8 de Claude Opus 4.7; LiveCodeBench = 93,5 | 10 | [Codersera](https://codersera.com/blog/deepseek-v4-complete-guide-2026/) |

### Cifras derivadas (aritmética sobre datos con fuente, no dato publicado)

| Cifra | Slide | Cálculo |
|---|---|---|
| **57x** | 11 | $50,00 (Astra output) ÷ $0,87 (V4-Pro output) = 57,47 → se muestra 57x |
| Barras de proporción de la slide 11 (`--v` = 1 / 0,30 / 0,12 / 0,017) | 11 | Cada precio de salida dividido por $50,00 |
| Barras de caché de la slide 04 (100 % / 100 % / 30 % / 25 %) | 04 | Cada precio de caché dividido por $1,00 |

### Conflictos entre fuentes, resueltos y anotados

Se documentan porque afectan a la confianza en las cifras, no porque cambien el deck:

1. **Fecha de release de GPT-6 Astra:** Yahoo Finance dice 3-sep; llm-stats dice 4-sep.
   Coherente con "anuncio el 3, disponibilidad el 4" (que es lo que dice el brief de partida
   y lo que corrobora DataCamp con su "over the coming days"). El deck redacta las dos fechas
   explícitamente: *"Anunciado el 3 y desplegado desde el 4"*.
2. **Parámetros activos de Kimi K3:** roo.beehiiv dice **104 B activos**; el
   [blog de Hugging Face](https://huggingface.co/blog/ResterChed/kimi-k3-model-overview-mxfp4-quantization-open-wei)
   dice "~50B equivalent (16/896 experts)". Se usó 104 B (fuente más explícita y coherente
   con Tom's Hardware); el conflicto queda anotado aquí.
3. **Fecha de pesos abiertos de Kimi K3:** 26-jul (roo.beehiiv) vs 27-jul (Hugging Face).
   Se usó 26-jul.
4. **SWE-bench Verified de DeepSeek V4-Pro:** Codersera da 80,6 (vs Opus 4.7 = 80,8); una
   búsqueda devolvió una cifra de 96,40 % "en el harness neutral de Vals" contra Opus 5.
   **Son escalas distintas y no se pueden mezclar en la misma frase.** El deck usa solo la
   pareja de Codersera, con el modelo de comparación nombrado explícitamente
   ("Empatado con Claude Opus 4.7 en SWE-bench Verified, 80,6 contra 80,8"), y no menciona
   la otra. Esto es exactamente el tipo de celda que habría invalidado la tabla si se
   hubiera puesto sin nombrar el harness.

### Fuentes consultadas que no aportaron dato al deck

- `https://openai.com/index/gpt-6-astra/` — **HTTP 403** vía WebFetch. La fuente primaria no
  es accesible desde la herramienta; todo lo de Astra viene de secundarias.
- `https://www.tomshardware.com/tech-industry/artificial-intelligence/moonshot-releases-2-8-trillion-parameter-kimi-k3` —
  el fetch devolvió navegación y promoción de suscripción, no el cuerpo del artículo.
- `https://llm-stats.com/models/gpt-6-astra` — útil solo para precio de caché y contexto; la
  página lista nombres de benchmark sin puntuaciones.

---
