# AI Prometheus Query Generator — Architecture

> Describe the question; get correct PromQL/LogQL with your actual metric names, labels, and conventions — not hallucinated ones.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A query assistant embedded in Grafana/CLI/chat that always fetches available metrics and label values before generating. Results include the executed query, a short explanation, and the data returned — so the human verifies meaning, not just syntax.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Metadata service | metrics/label inventory (including custom recording rules) |
| Generator | LLM constrained to discovered names |
| Executor | read-only query client |
| Packager | dashboard/alert rule drafts |

## 4. Data Flow

1. The user asks a data question.
2. The assistant discovers the real metrics and labels available.
3. It generates, executes, and if needed iterates the query.
4. The verified query plus explanation is returned, ready to save.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `live metric/label inventory`
* `recording-rule catalog`
* `dashboard conventions`
* `service SLOs`
* `the user's question and context`

## 7. Human-in-the-Loop & Approval

The assistant executes read-only queries and shows results; humans decide what becomes a dashboard or alert.

## 8. Security Considerations

* Query results can expose business data: respect Grafana/datasource permissions; the assistant runs under the user's access.
* Cap query cost/time to protect the TSDB.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [34 · AI Grafana Dashboard Assistant](../34-ai-grafana-dashboard-assistant/README.md)
- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
