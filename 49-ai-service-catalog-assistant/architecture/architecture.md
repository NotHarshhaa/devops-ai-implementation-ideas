# AI Service Catalog Assistant — Architecture

> Keep the service catalog true: auto-enrich entities, detect ownership gaps and drift, and answer 'who owns X?' instantly.

*Focus: 🏢 Platform Engineering · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A catalog-maintenance service: scheduled analysis compares catalog entities against reality (repos, activity, deploys, cloud), proposes enrichment PRs, and flags drift for owner confirmation. Chat Q&A makes the catalog useful in Slack where people actually ask.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Catalog vs. reality comparison                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Enrichment PRs + drift flags                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← confidence-labeled
┌────────────────────────────────────────────────────┐
│ Owner confirmation campaigns                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat Q&A with citations                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Catalog health reporting                           │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Reality checker | repo activity, deploys, cloud tags, on-call data |
| Enrichment proposer | metadata inference with evidence |
| Campaign manager | targeted confirmation requests |
| Q&A engine | chat answers grounded in the catalog |
| Health dashboard | completeness/freshness metrics |

## 4. Data Flow

1. Scheduled comparison finds gaps and drift.
2. Enrichment proposals carry evidence and confidence labels.
3. Owners confirm via targeted requests.
4. The verified catalog powers Q&A and downstream tooling.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "catalog_audit_id": "cat-audit-2026-10-06",
  "entity_name": "checkout-order-fulfillment",
  "entity_kind": "Component",
  "drift_status": "OWNERSHIP_DRIFT_CONFIRMED",
  "ownership_investigation": {
    "recorded_owner_group": "group:legacy-logistics-team",
    "inferred_active_owner": "group:checkout-core-squad",
    "confidence_score": 0.98,
    "corroborating_evidence": [
      "100% of the last 45 commits to org/checkout-order-fulfillment authored by @checkout-core-squad members.",
      "Primary on-call pager escalations routed to checkout-core PagerDuty escalation policy."
    ]
  },
  "metadata_enrichment_proposal": {
    "target_catalog_file": "catalog-info.yaml",
    "suggested_patch": "spec:
  owner: group:checkout-core-squad
  system: ecommerce-checkout
  tier: tier-1
  lifecycle: production
",
    "review_assigned_to": "@checkout-core-lead"
  },
  "service_dependency_graph": {
    "upstream_services": [
      "payment-gateway",
      "inventory-service"
    ],
    "downstream_datastores": [
      "postgres-fulfillment-replica"
    ]
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `catalog entities and metadata`
* `repo activity and CODEOWNERS`
* `deploy history`
* `on-call schedules`
* `cloud resource tags`

## 8. Human-in-the-Loop & Approval

Ownership and critical metadata always require owner confirmation; inferred data is labeled as inferred.

## 9. Security Considerations

* Inferred ownership must never auto-replace confirmed owners — confirmation flows are mandatory.
* Catalog Q&A respects existing access permissions.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [47 · AI Internal Developer Platform Assistant](../../47-ai-internal-developer-platform-assistant/README.md)
- [48 · AI Golden Path Generator](../../48-ai-golden-path-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../../44-ai-repository-infrastructure-analyzer/README.md)
