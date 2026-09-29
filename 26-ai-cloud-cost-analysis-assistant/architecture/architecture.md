# AI Cloud Cost Analysis Assistant — Architecture

> Explain your cloud bill: what changed, why it changed, who owns it, and what to do about it — in plain language.

*Focus: ☁️ Cloud · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A cost-analysis service on top of billing exports plus usage metrics: scheduled anomaly detection flags changes, the LLM investigates likely causes (correlating deploys, config changes, usage patterns), and posts an explained digest per team with prioritized actions. Chat mode answers 'why did our bill go up?' interactively.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Billing export + usage metrics                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Anomaly detection (service · team · region)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Cause correlation (deploys · config · usage)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explained digest per team                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat drill-down ('why the increase?')              │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Billing pipeline | CUR/export ingestion into warehouse (Athena/BigQuery/Synapse) |
| Anomaly detector | statistical baselines per dimension |
| Cause correlator | joins cost anomalies with deploy/config/usage events |
| Digest publisher | Slack/email per team with explained findings |
| Chat analyst | interactive drill-down over the warehouse |

## 4. Data Flow

1. Daily billing and usage data lands in the warehouse.
2. Anomalies are detected across dimensions.
3. Each anomaly is correlated with operational events to draft a cause hypothesis.
4. Explained digests reach owning teams; chat answers follow-up questions from the same data.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `billing line items`
* `usage metrics`
* `deploy and config-change timeline`
* `tagging/catalog ownership`
* `savings-plan/RI coverage`

## 7. Human-in-the-Loop & Approval

Read-only analysis; recommendations are actions for engineering teams, not automated changes.

## 8. Security Considerations

* Billing data is sensitive: warehouse-level access control; model calls receive aggregates, not raw account detail.
* Avoid tagging PII into cost metadata.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [15 · AI Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [08 · AI Deployment Risk Analyzer](../08-ai-deployment-risk-analyzer/README.md)
