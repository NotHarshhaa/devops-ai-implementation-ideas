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

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "report_id": "finops-anomaly-2026-10-W1",
  "billing_period": "2026-10-01 to 2026-10-05",
  "total_month_to_date_spend_usd": 48290.00,
  "projected_eom_spend_usd": 312000.00,
  "budget_forecast_variance_pct": 24.5,
  "cost_anomalies_detected": [
    {
      "service": "AWS NAT Gateway",
      "region": "us-east-1",
      "daily_spend_baseline_usd": 18.50,
      "daily_spend_current_usd": 492.30,
      "increase_factor": "26.6x",
      "root_cause_attribution": "EKS node group in private subnet pulling large 8GB ML container images directly from public Docker Hub via NAT Gateway instead of local ECR pull-through cache.",
      "correlated_deployment": "Commit c4d3e2f (deploy customer-churn-ml-worker) at 2026-10-02 14:22 UTC"
    }
  ],
  "prioritized_savings_actions": [
    {
      "priority": 1,
      "action_title": "Configure ECR pull-through cache and VPC Gateway Endpoint for S3",
      "service": "NAT Gateway / S3",
      "monthly_savings_usd": 14200.00,
      "implementation_effort": "LOW (2 hours)",
      "target_file": "modules/networking/vpc_endpoints.tf",
      "patch_snippet": "resource "aws_vpc_endpoint" "s3" {
  vpc_id          = module.vpc.vpc_id
  service_name    = "com.amazonaws.us-east-1.s3"
  route_table_ids = module.vpc.private_route_table_ids
}"
    }
  ]
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `billing line items`
* `usage metrics`
* `deploy and config-change timeline`
* `tagging/catalog ownership`
* `savings-plan/RI coverage`

## 8. Human-in-the-Loop & Approval

Read-only analysis; recommendations are actions for engineering teams, not automated changes.

## 9. Security Considerations

* Billing data is sensitive: warehouse-level access control; model calls receive aggregates, not raw account detail.
* Avoid tagging PII into cost metadata.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [15 · AI Kubernetes Resource Optimization Advisor](../../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../../29-ai-cloud-resource-optimization-assistant/README.md)
- [08 · AI Deployment Risk Analyzer](../../08-ai-deployment-risk-analyzer/README.md)
