# AI Grafana Dashboard Assistant — Architecture

> Generate, clean up, and standardize Grafana dashboards from a description — consistent with your org's panel conventions.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A dashboard assistant operating via the Grafana API: generate new dashboards from natural language + metadata discovery, refactor existing ones to conventions, and report hygiene issues. All writes go through a review PR (exported JSON) or Grafana folder permissions — humans approve before dashboards land.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Service description + metric discovery             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Draft dashboard (golden signals)                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat iteration + preview                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Approved publish (API · PR)                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hygiene report (unused · broken)                   │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Metric discovery | inventory of available metrics per service |
| Generator | dashboard JSON synthesis with org templates |
| Review flow | preview and iteration loop |
| Publisher | Grafana API or dashboard-as-code PR |
| Hygiene scanner | usage/query-health analysis across folders |

## 4. Data Flow

1. The user describes the dashboard need.
2. Discovery grounds the draft in real metrics.
3. The draft iterates in chat until approved.
4. Publication goes through the approved path; hygiene reports run on schedule.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "dashboard_id": "grafana-dash-gen-5520",
  "title": "Checkout Service — Golden Signals & Saturation",
  "folder_name": "Tier-1 Services",
  "uid": "checkout-golden-signals",
  "dashboard_spec": {
    "schema_version": 38,
    "time_range": {
      "from": "now-6h",
      "to": "now"
    },
    "refresh_rate": "30s",
    "template_variables": [
      {
        "name": "environment",
        "type": "query",
        "query": "label_values(up, env)"
      },
      {
        "name": "instance",
        "type": "query",
        "query": "label_values(http_requests_total{env="$environment"}, instance)"
      }
    ],
    "panel_rows": [
      {
        "title": "Golden Signals (Rate, Errors, Duration)",
        "panels_count": 4,
        "types": [
          "timeseries",
          "timeseries",
          "stat",
          "heatmap"
        ]
      },
      {
        "title": "Resource Saturation (CPU, Memory, Goroutines)",
        "panels_count": 3,
        "types": [
          "timeseries",
          "timeseries",
          "gauge"
        ]
      }
    ]
  },
  "hygiene_audit_summary": {
    "duplicate_panels_detected": 0,
    "deprecated_queries_fixed": 1,
    "note": "Replaced deprecated 'sum(rate(container_cpu_usage_seconds_total[1m]))' with 5m window conforming to SRE dashboard standard."
  },
  "gitops_pull_request": {
    "repository": "org/observability-dashboards",
    "file_path": "dashboards/tier1/checkout-service.json",
    "pr_title": "feat(dashboards): standardize checkout-service golden signals dashboard"
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

* `available metrics per service`
* `org dashboard conventions`
* `existing dashboards`
* `SLO definitions`
* `incident learnings`

## 8. Human-in-the-Loop & Approval

Generation is interactive; publishing requires explicit approval. Hygiene suggestions are reports, not deletions.

## 9. Security Considerations

* Dashboards can expose business metrics: respect Grafana permissions and folder scoping.
* Prevent query-heavy dashboards from hammering datasources (row limits, time bounds).

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [33 · AI Prometheus Query Generator](../../33-ai-prometheus-query-generator/README.md)
- [30 · AI Alert Investigation Assistant](../../30-ai-alert-investigation-assistant/README.md)
- [36 · AI Postmortem Generator](../../36-ai-postmortem-generator/README.md)
