# AI Resource Optimization Advisor — Architecture

> Right-size requests and limits continuously using real usage data — explained, safe, and reviewable as GitOps PRs.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A scheduled advisor consumes Prometheus/metrics-server history per workload, computes robust statistics, and drafts right-sizing PRs against the manifests repo — annotations explain the math, changes roll out via normal GitOps review. VPA in recommendation mode and commercial ML optimizers (StormForge-style) are cited as build-vs-buy baselines.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Prometheus usage history                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Workload profiler (P95 · spikes · periodic)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Headroom policy engine                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← SLO-tier aware
┌────────────────────────────────────────────────────┐
│ GitOps PRs with rationale                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human review
┌────────────────────────────────────────────────────┐
│ Post-change monitor (OOM · throttle)               │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Metrics collector | PromQL queries for usage windows across all workloads |
| Profiler | percentile/statistical feature extraction, cron detection |
| Policy engine | headroom rules by tier, variance-aware limits |
| PR generator | manifest patching with annotation rationale, batched per team |
| Safety monitor | post-rollout OOM/throttle detection with auto-escalation |

## 4. Data Flow

1. A scheduled job profiles every workload from metrics history.
2. Workloads are classified and policy computes safe requests/limits.
3. PRs are opened with charts and rationale in descriptions.
4. GitOps review deploys changes; the monitor watches for OOM/throttle regressions and reports back.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `container usage percentiles`
* `workload type and cron patterns`
* `SLO tier`
* `OOM/throttle event history`
* `current requests/limits`

## 7. Human-in-the-Loop & Approval

Every change is a PR. Teams review their own workloads; the advisor never edits live specs.

## 8. Security Considerations

* Never downsize stateful or latency-critical tiers without owner sign-off.
* PRs are batched small to keep blast radius low and reviews fast.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [18 · AI HPA Recommendation Assistant](../18-ai-hpa-recommendation-assistant/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)
