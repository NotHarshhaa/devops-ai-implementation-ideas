# AI Log Analyzer — Architecture

> Ask questions of your logs in plain language and get explained, evidence-linked answers instead of query gymnastics.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A log analysis service sits between engineers (or the alert pipeline) and the log store. It first narrows scope — service, time window, template clustering — then retrieves a compact, representative sample and metadata, and lets an LLM answer the question with an generated query, a summary, and deep links. The generated query is always shown so humans can verify and rerun it themselves.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Query front end | Slack bot, CLI, and Grafana data-source panel integration |
| Scope resolver | maps fuzzy service names to indices/labels via the service catalog |
| Reducer | log template clustering (drain3-style), sampling, and count aggregation to fit context limits |
| Query executor | read-only client for Loki, Elasticsearch/OpenSearch, CloudWatch Logs, or Azure Monitor |
| LLM analyzer | pattern/anomaly reasoning with strict 'cite log IDs' grounding |
| Citation layer | deep links to the exact log entries in Grafana/Kibana |

## 4. Data Flow

1. A question arrives with an implicit or explicit time window.
2. The resolver maps services to log sources and labels using catalog metadata.
3. The reducer collapses raw volume into templates and representative samples.
4. A generated query pulls the precise window; results are summarized with per-pattern counts and anomalies.
5. The answer is posted with evidence links and the reusable query.
6. Feedback and query outcomes are logged for eval sets.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `service catalog metadata (owners, labels, indices)`
* `representative log samples`
* `template counts per window`
* `baseline comparison window`
* `related trace IDs`
* `recent deploys`

## 7. Human-in-the-Loop & Approval

Pure read-and-explain. Generated queries are displayed before execution in interactive mode, and the service has read-only credentials to the log stores.

## 8. Security Considerations

* Log lines may contain PII or tokens: redact at the reducer boundary, and restrict which indices the service can read.
* Read-only credentials with index-level scoping; deny-list sensitive services or route them to local models.
* Persist questions and answers only in systems with the same access policy as the logs themselves.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Alternative Approaches

* Batch mode instead of chat: scheduled digest of top new log patterns per service.
* Alert-attached mode: every Alertmanager notification includes a pre-computed log summary.
* Build on existing product AI (Datadog Bits AI, New Relic AI, Elastic AI Assistant, Grafana Assistant) when already licensed; custom only for the glue and org context.

## 13. Related Ideas

- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [33 · AI Prometheus Query Generator](../33-ai-prometheus-query-generator/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
