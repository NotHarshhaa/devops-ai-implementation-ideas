# AI Alert Investigation Assistant — Architecture

> Every alert arrives pre-investigated: enriched with metrics, logs, recent changes, runbooks, and a first hypothesis before a human looks.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An enrichment stage between Alertmanager/PagerDuty and humans: on alert, an agent runs a bounded investigation (30-60 seconds of tool calls over metrics/logs/deploys) and appends a structured context card to the page and incident thread. Feedback buttons tune future quality.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Alert webhook                                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Service resolution (catalog · labels)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Bounded investigation (metrics · logs · deploys)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← 30-60s budget
┌────────────────────────────────────────────────────┐
│ Context card + first hypothesis                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Page + thread (correlated)                         │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Alert ingester | normalizes alerts from multiple sources |
| Enrichment agent | budgeted tool-use loop over observability MCP tools |
| Correlator | groups co-firing alerts by service/dependency |
| Runbook retriever | vector search over runbooks keyed by alert signature |
| Card publisher | attaches enrichment to PagerDuty/Slack |
| Feedback collector | per-rule usefulness tracking |

## 4. Data Flow

1. An alert triggers a bounded investigation.
2. The agent runs parallel read-only checks within a strict time budget.
3. A context card (metrics, logs, changes, hypothesis, runbook) is attached to the page.
4. Related alerts are grouped; feedback is recorded for tuning.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `alert payload and labels`
* `metric snapshots around the window`
* `log patterns`
* `recent deploys and config changes`
* `similar past alerts and resolutions`
* `runbook corpus`

## 7. Human-in-the-Loop & Approval

Enrichment only — the page still goes out. The agent never resolves, silences, or escalates alerts autonomously.

## 8. Security Considerations

* Strict time and call budget per alert to control cost and runaway loops.
* Enrichment is read-only; silence/resolve actions stay human.
* Sensitive environments can be excluded or routed to local models.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [35 · AI Anomaly Investigation Agent](../35-ai-anomaly-investigation-agent/README.md)
