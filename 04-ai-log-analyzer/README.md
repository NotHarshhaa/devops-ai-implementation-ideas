# 04 · AI Log Analyzer

> Ask questions of your logs in plain language and get explained, evidence-linked answers instead of query gymnastics.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Grafana Loki · Elasticsearch / OpenSearch · CloudWatch Logs · Azure Monitor · Google Cloud Logging · Grafana |

---

## 📌 Problem

Logs hold the answer to almost every operational question, but extracting it requires query-language fluency, knowledge of log structure per service, and patience for volume.

* Each team's logs have different shapes, fields, and quality; cross-service investigation means learning several query dialects (LogQL, Lucene, SQL).
* During incidents, engineers drown in volume and miss the few lines that matter.
* Recurring error patterns are never summarized, so the same noisy log lines get re-read every week.
* Dashboards show counts, not causes.

**Why it matters:** Log investigation is the first or second step of nearly every incident and support escalation; shaving 15 minutes off each lookup compounds across the whole org.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Natural-language querying | translates 'why are checkout payments failing since 10am?' into LogQL/Lucene/SQL with the right time range and filters |
| Pattern clustering | groups raw lines into templates (drain-style parsing) so the model reasons over patterns, not millions of lines |
| Anomaly explanation | compares the query window against baseline to say what changed — new error, new volume, new field values |
| Evidence-linked summarization | returns a short narrative with links to representative log entries and a reusable query |
| Cross-service correlation | joins related log streams by trace ID or request ID when investigating multi-service flows |

## 💡 Proposed Solution

A log analysis service sits between engineers (or the alert pipeline) and the log store. It first narrows scope — service, time window, template clustering — then retrieves a compact, representative sample and metadata, and lets an LLM answer the question with an generated query, a summary, and deep links. The generated query is always shown so humans can verify and rerun it themselves.

### Workflow

1. **Receive question** — Slack thread, Grafana panel drill-down, or alert annotation
2. **Scope** — resolve services, time window, and index/label constraints from the question and catalog metadata
3. **Reduce** — template-cluster the matching logs; keep representative samples and per-pattern counts
4. **Query** — generate a store-native query (LogQL/Lucene/SQL), execute it, attach results
5. **Answer** — LLM writes the explanation with evidence links and the query used
6. **Verify** — human can rerun/adjust the query; thumbs-up/down feeds evals

**Human-in-the-loop:** Pure read-and-explain. Generated queries are displayed before execution in interactive mode, and the service has read-only credentials to the log stores.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Question (Slack · Grafana · alert)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Scope resolver (service · time · labels)           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Template clustering / sampling                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← volume reduction
┌────────────────────────────────────────────────────┐
│ Query generator → log store                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-only creds
┌────────────────────────────────────────────────────┐
│ LLM analysis (patterns · anomalies)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Answer + evidence links + query                    │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Grafana Loki | LogQL generation and execution |
| Elasticsearch / OpenSearch | DSL queries and index scoping |
| CloudWatch Logs · Azure Monitor · Google Cloud Logging | managed log backends |
| Grafana | drill-down panel and Explore deep links |
| Slack / Teams | ask-in-thread interface |
| OpenTelemetry Collector | optional pre-processing/tagging of log records |

## 📥 Context & Data Sources

* `service catalog metadata (owners, labels, indices)`
* `representative log samples`
* `template counts per window`
* `baseline comparison window`
* `related trace IDs`
* `recent deploys`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Log store query APIs (read-only)
* Service catalog lookup

## ✅ Expected Benefits

* Operational questions answered in one sentence instead of a query-building session.
* Volume-safe: the model sees patterns and samples, never the firehose — cheaper and less noisy.
* Every answer ships with a reusable query, so the team's query literacy grows.
* Recurring patterns become documented knowledge instead of folklore.

## 🔒 Safety & Guardrails

* Log lines may contain PII or tokens: redact at the reducer boundary, and restrict which indices the service can read.
* Read-only credentials with index-level scoping; deny-list sensitive services or route them to local models.
* Persist questions and answers only in systems with the same access policy as the logs themselves.

## 🚀 Future Implementation

* Auto-generated per-service 'log digest' bots (daily/weekly summaries of new error patterns).
* Trace-aware mode: jump from a log line to its trace and summarize the full request path.
* Index optimization advisor: suggest labels/fields and retention changes based on real query patterns.

## 🔗 Related Ideas

- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [33 · AI Prometheus Query Generator](../33-ai-prometheus-query-generator/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
