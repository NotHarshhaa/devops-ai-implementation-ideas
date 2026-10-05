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

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "query_id": "promql-gen-7491",
  "user_intent": "Calculate P95 HTTP request duration for checkout-service partitioned by endpoint handler, excluding client 4xx errors.",
  "target_engine": "Prometheus / Thanos",
  "discovered_metadata": {
    "matched_metric": "http_request_duration_seconds_bucket",
    "verified_labels": [
      "service",
      "handler",
      "status_code",
      "le"
    ],
    "sample_series_count": 48
  },
  "generated_promql": "histogram_quantile(0.95, sum by (le, handler) (rate(http_request_duration_seconds_bucket{service="checkout-service", status_code!~"4.."}[5m])))",
  "semantics_breakdown": [
    {
      "operator": "histogram_quantile(0.95, ...)",
      "explanation": "Calculates the 95th percentile latency from histogram buckets."
    },
    {
      "operator": "rate(...[5m])",
      "explanation": "Calculates per-second rate over a 5-minute window to smooth bursty traffic."
    },
    {
      "operator": "sum by (le, handler)",
      "explanation": "Preserves 'le' bucket boundary label required by histogram_quantile while grouping by 'handler'."
    },
    {
      "operator": "status_code!~"4.."",
      "explanation": "Regex exclusion of client 4xx errors (bad requests, not found)."
    }
  ],
  "execution_validation": {
    "executed": true,
    "execution_time_ms": 32,
    "returned_series_count": 4,
    "sample_output": [
      {
        "handler": "/v1/checkout/pay",
        "value_seconds": 0.428
      },
      {
        "handler": "/v1/checkout/validate",
        "value_seconds": 0.084
      }
    ]
  },
  "packaged_rules": {
    "recording_rule_yaml": "record: job:checkout_http_request_duration:p95_5m
expr: histogram_quantile(0.95, sum by (le, handler) (rate(http_request_duration_seconds_bucket{service="checkout-service", status_code!~"4.."}[5m])))
",
    "alert_rule_yaml": "alert: CheckoutLatencyP95Exceeded
expr: job:checkout_http_request_duration:p95_5m > 1.5
for: 3m
labels:
  severity: critical
annotations:
  summary: "P95 checkout latency above 1.5s for handler {{ $labels.handler }}"
"
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `live metric/label inventory`
* `recording-rule catalog`
* `dashboard conventions`
* `service SLOs`
* `the user's question and context`

## 8. Human-in-the-Loop & Approval

The assistant executes read-only queries and shows results; humans decide what becomes a dashboard or alert.

## 9. Security Considerations

* Query results can expose business data: respect Grafana/datasource permissions; the assistant runs under the user's access.
* Cap query cost/time to protect the TSDB.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [34 · AI Grafana Dashboard Assistant](../../34-ai-grafana-dashboard-assistant/README.md)
- [04 · AI Log Analyzer](../../04-ai-log-analyzer/README.md)
- [30 · AI Alert Investigation Assistant](../../30-ai-alert-investigation-assistant/README.md)
