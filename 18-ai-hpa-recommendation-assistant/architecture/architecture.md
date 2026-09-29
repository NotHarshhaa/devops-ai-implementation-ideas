# AI HPA Recommendation Assistant — Architecture

> Design and tune autoscaling policies (HPA, KEDA, VPA) from real traffic patterns instead of YAML folklore.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An advisor that studies each workload's traffic and scaling behavior, then drafts concrete HPA/KEDA configuration PRs with rationale: metric choice, target, min/max, stabilization and scale-down windows — plus what to watch after rollout.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Traffic & scaling history (Prometheus)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Pattern analyzer (seasonality · bursts)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Policy designer (HPA · KEDA · schedule)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Config PR + rationale + watch plan                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Post-rollout verification                          │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Traffic analyzer | metric extraction and pattern classification |
| Scaling observer | current HPA/KEDA behavior reconstruction |
| Policy designer | LLM drafting mechanism + parameters with evidence |
| PR generator | manifest edits with annotation rationale |
| Verifier | post-rollout scaling-action review |

## 4. Data Flow

1. Scheduled analysis profiles workload load and current scaling behavior.
2. Problems are diagnosed (flapping, lag, wrong metric).
3. A concrete policy is drafted against the measured pattern, with monitoring suggestions.
4. The PR is reviewed and rolled out via GitOps; the verifier reports how it behaved.

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

* `request/queue metrics with seasonality`
* `current HPA/KEDA config and action history`
* `pod start/warmup times`
* `resource usage`
* `SLOs and latency targets`

## 7. Human-in-the-Loop & Approval

All changes as reviewable PRs; owners approve for their services.

## 8. Security Considerations

* Scale-to-zero proposals need owner opt-in per service.
* Avoid metrics endpoints that leak sensitive business data into shared dashboards without review.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [15 · AI Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [13 · AI Pod Crash Analyzer](../13-ai-pod-crash-analyzer/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
