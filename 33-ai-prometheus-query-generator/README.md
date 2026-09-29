# 33 · AI Prometheus Query Generator

> Describe the question; get correct PromQL/LogQL with your actual metric names, labels, and conventions — not hallucinated ones.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Prometheus / Thanos / Mimir · Loki / Elasticsearch · Grafana · Grafana Assistant / mcp-grafana |

---

## 📌 Problem

PromQL is powerful and unforgiving: correct-looking queries return wrong numbers, and the metric/label zoo per org makes even experts guess names.

* Metric names and label conventions vary per org; generic LLM answers hallucinate them.
* Subtle semantics (rate vs. irate, sum by, histogram_quantile, absent()) produce silent errors.
* Dashboards and alerts need the same query in several variations; humans hand-edit and drift.
* Newcomers can't self-serve even for simple questions.

**Why it matters:** Query generation is the gateway skill for observability self-service; getting it right (with real metadata) unlocks everything downstream.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Metadata-grounded generation | queries the metrics API/catalog first, then writes PromQL against real names and labels |
| Correctness guardrails | explain semantics (rate windows, joins, quantiles) and flag common mistakes |
| Variations | same question as instant query, range query, recording rule, and alert rule |
| Validation loop | executes the query and iterates on empty/error results |

## 💡 Proposed Solution

A query assistant embedded in Grafana/CLI/chat that always fetches available metrics and label values before generating. Results include the executed query, a short explanation, and the data returned — so the human verifies meaning, not just syntax.

### Workflow

1. **Discover** — list matching metrics/labels from the live API (no guessing)
2. **Generate** — PromQL/LogQL tailored to the question and metadata
3. **Execute** — run against the data source; iterate on errors/empty sets
4. **Explain** — semantics summary and caveats
5. **Package** — offer as panel/recording-rule/alert snippet

**Human-in-the-loop:** The assistant executes read-only queries and shows results; humans decide what becomes a dashboard or alert.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Question in natural language                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Metric/label discovery (live API)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← no hallucination
┌────────────────────────────────────────────────────┐
│ Query generation + execution loop                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explanation + caveats                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Panel · recording rule · alert snippet             │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Prometheus / Thanos / Mimir | query APIs and metadata |
| Loki / Elasticsearch | log queries |
| Grafana | panel creation and Explore links |
| Grafana Assistant / mcp-grafana | build-on option |

## 📥 Context & Data Sources

* `live metric/label inventory`
* `recording-rule catalog`
* `dashboard conventions`
* `service SLOs`
* `the user's question and context`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Prometheus/Loki query APIs (read-only)

## ✅ Expected Benefits

* Correct queries from day one; metadata grounding kills hallucinated metric names.
* Faster dashboard and alert authoring.
* Team-wide query literacy improvement.

## 🔒 Safety & Guardrails

* Query results can expose business data: respect Grafana/datasource permissions; the assistant runs under the user's access.
* Cap query cost/time to protect the TSDB.

## 🚀 Future Implementation

* SLO copilot: draft SLO definitions and burn-rate alerts from service descriptions.
* Query review bot for PRs touching dashboards/alerts.

## 🔗 Related Ideas

- [34 · AI Grafana Dashboard Assistant](../34-ai-grafana-dashboard-assistant/README.md)
- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
