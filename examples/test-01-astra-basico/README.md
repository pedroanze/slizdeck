# Test 01 · "básico" — GPT-6 Astra (charla relámpago)

Bitácora de una ejecución end-to-end de la skill `slizdeck` sobre un caso real, hecha
por un agente que además hace de usuario simulado. Todo lo que aquí se llama "decisión"
es una decisión que la skill le pide a un humano y que tomé yo, anotando el porqué.

- **Deck:** [`astra-flash.html`](astra-flash.html)
- **Exports:** [`astra-flash.pdf`](https://github.com/pedroanze/slizdeck/releases/download/examples/astra-flash.pdf) · [`astra-flash.pptx`](https://github.com/pedroanze/slizdeck/releases/download/examples/astra-flash.pptx) (en el [release `examples`](https://github.com/pedroanze/slizdeck/releases/tag/examples), fuera del repo por peso)
- **Capturas de la fase audit:** [`test-01-astra-basico-shots.zip`](https://github.com/pedroanze/slizdeck/releases/download/examples/test-01-astra-basico-shots.zip) (7 PNG). La de la slide 02 se
  reemplazó por la de una corrida buena: la primera salió vacía por el Hallazgo 3,
  no por un defecto del deck.
- **Fecha de la prueba:** 2026-09-06 · **Engine:** slizdeck 1.4.0

---

> Esta prueba se hizo con el engine **1.4.0**. Todos sus hallazgos se corrigieron entre 1.4.1 y 2.2 (ver `CHANGELOG.md`). La bitácora completa (fase por fase, salidas de validación y hallazgos) está en el historial de git, en `examples/test-01-astra-basico/README.md` hasta el commit `21fca69`.

## Caso y perfil

| | |
|---|---|
| **Tema** | ChatGPT / GPT-6 Astra, el nuevo modelo de OpenAI |
| **Perfil probado** | La presentación **más simple posible**: charla relámpago, poco texto, sin gráficas complejas |
| **Público** | General / tech-curioso |
| **Tipo** | Talk corta (5 min) |
| **Tamaño** | 6-7 slides |
| **Style pack** | `paper-white` (el default de la skill) |

Qué se estaba probando: **el camino por defecto**. Un deck chico, sin marca del usuario,
sin design system previo, sin imágenes propias y sin animación pesada. Es el escenario
que la skill promete resolver sin fricción, así que cualquier tropiezo aquí es un
tropiezo del camino feliz, no de un caso raro.

---

## Qué protege hoy

El deck queda en el repo sin retocar, como caso real generado de punta a punta por la skill. El CI lo exporta en cada push: con el exportador por clases de 1.4 perdía 30 textos en el PPTX, y hoy tiene que exportar a PPTX y PDF sin perder ninguno. También forma parte de la línea base de los evals (`evals/results/2.1.0-ejemplos.json`).

## Fuentes

Todas verificadas con WebSearch/WebFetch durante la prueba. **Cada cifra que aparece en
una slide sale de esta lista**; el deck además imprime la fuente al pie de cada slide con
datos.

| URL | Qué dato salió de acá | Dónde se usa |
|---|---|---|
| https://en.wikipedia.org/wiki/GPT-6_Astra | Preview limitada **3 sep 2026**; release público estable **4 sep 2026**; "state of the art in coding, math, and navigating computers and web browsers"; capacidades de ciberseguridad limitadas a "a group of testers"; Brockman y la afirmación de AGI | Slide 02 |
| https://9to5mac.com/2026/09/04/openai-releasing-major-upgrade-to-chatgpt-and-codex-with-gpt-6-astra-details-here/ | Rollout a **ChatGPT Plus, Pro, Business y Enterprise**; computer use "nearly 2x faster"; FrontierMath Tier 4 98%, ARC-AGI-3 99.9%, ExploitBench 100% | Slide 02 (rollout) |
| https://www.vellum.ai/blog/gpt-6-astra-benchmarks-explained | **OSWorld 2.0: Astra 72.6% / Sol 65.7%**; **ScreenSpot-Pro: 92.7% / 76.9%**; **Humanity's Last Exam: Astra 57.2% / Fable 5.1 65.0%**; contexto "1M-token"; **$10 in / $50 out** | Slides 03, 05, 06 |
| https://www.mindstudio.ai/blog/gpt-6-astra-benchmarks-analysis | **Artificial Analysis Intelligence Index: Astra 61 / Fable 5.1 66**; **Coding Agent Index: 67 / 70**; áreas donde Astra pierde (GDPval, tool-use bancario, long-context) | Slide 05 |
| https://llm-stats.com/models/gpt-6-astra | **$10 input / $1 cached / $50 output** por millón; contexto 1.1M; max output 128K; knowledge cutoff abril 2026; released 4 sep 2026 | Slide 06 |
| https://www.cloudzero.com/blog/gpt-6-pricing/ | Corroboración de $10/$50, batch/flex a 50%, fast mode 2x, recargo por encima de 272K tokens de input, y el "2.5x GPT-5.6 Sol" | Slide 06 (el "2.5x" del título) |
| https://www.aljazeera.com/economy/2026/9/4/openai-unveils-gpt-6-astra-amid-rising-scrutiny-and-safety | Contexto de escrutinio: incidente de Hugging Face de julio 2026, críticas de Sanders / Walsh / Yampolskiy, valuación de $852 mil millones | **No usado en slides** (research de contexto para el arco) |

**Fuentes que NO se pudieron leer** (documentado en vez de omitido):

- `https://openai.com/index/gpt-6-astra/` → **HTTP 403 Forbidden** a WebFetch. Es la fuente
  primaria; no pude citarla de primera mano.
- `https://www.axios.com/2026/09/03/openai-astra-gpt-6-agi-brockman` → **HTTP 403 Forbidden**.

**Discrepancias entre fuentes, resueltas a la vista:**

- **Contexto: 1M vs 1.1M.** Vellum dice "1M-token context model", llm-stats dice "1.1M".
  En la slide 06 puse **1M**, que es la cifra redonda con la que el ecosistema se refiere
  al modelo. Si esto fuera un deck real de producción, la nota al pie debería decir "≈1M".
- **FrontierMath Tier 4: 97.6% (Vellum) vs 98% (9to5Mac).** No lo puse en ninguna slide
  precisamente porque no se pudo reconciliar contra la fuente primaria.

---
