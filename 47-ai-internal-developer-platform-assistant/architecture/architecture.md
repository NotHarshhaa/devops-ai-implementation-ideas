# AI Internal Developer Platform Assistant — Architecture

> Give your IDP a conversational front door: create services, find owners, understand scorecards, and troubleshoot platform issues by asking.

*Focus: 🏢 Platform Engineering · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A platform assistant wired into Backstage (and Slack): it answers catalog questions via retrieval over the catalog and docs, drives scaffolder templates conversationally (still generating the same reviewable PRs), and explains platform policies. Tools are Backstage-API-backed MCP tools with scoped permissions.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Developer question (Backstage · Slack)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Catalog + docs retrieval                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Self-service action (scaffold · request)           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← same PRs as UI
┌────────────────────────────────────────────────────┐
│ Cited answers + IDP links                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Adoption + deflection analytics                    │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Assistant front end | Backstage plugin + Slack app |
| Catalog retriever | software catalog, templates, docs, scorecards indexed |
| Action tools | scaffolder and platform APIs via scoped MCP tools |
| Analytics | question types, deflection, adoption trends |

## 4. Data Flow

1. The developer asks a question or states an intent.
2. Retrieval grounds the answer in catalog and docs.
3. Self-service intents drive the standard platform flows.
4. Analytics show the platform team what's confusing.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "request_id": "idp-scaffold-req-3891",
  "user_intent": "Provision a new Go backend service with PostgreSQL, Kafka consumer, and automatic scorecard compliance.",
  "matched_template": {
    "template_id": "backstage.io/v1beta3/templates/go-standard-backend",
    "template_version": "2.4.0",
    "maintainer": "@platform-engineering"
  },
  "resolved_scaffolder_parameters": {
    "service_name": "payment-reconciliation-worker",
    "owner_team": "billing-eng",
    "database": "postgresql-v16",
    "messaging": "kafka-event-consumer",
    "tier": "tier-1-production"
  },
  "scorecard_preflight": {
    "preflight_status": "PASSED (14/14 Goldengate readiness rules satisfied)",
    "checks": [
      "OpenTelemetry tracing SDK embedded",
      "Health endpoint /healthz enabled",
      "Container security context non-root enforced"
    ]
  },
  "scaffolder_execution_output": {
    "new_repository_url": "https://github.com/org/payment-reconciliation-worker",
    "catalog_entity_url": "https://backstage.corp.internal/catalog/default/component/payment-reconciliation-worker",
    "scaffold_pr_url": "https://github.com/org/payment-reconciliation-worker/pull/1"
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `software catalog entities`
* `templates and docs`
* `scorecard rules`
* `platform policies`
* `org terminology`

## 8. Human-in-the-Loop & Approval

Self-service actions produce the same reviewable artifacts as the UI (PRs, catalog entries); the assistant doesn't bypass any platform governance.

## 9. Security Considerations

* Assistant inherits user permissions (no privilege escalation through the chat layer).
* Scaffold actions are the same governed flows as the UI — no side doors.
* Catalog metadata is org-sensitive: retrieval respects existing access controls.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [48 · AI Golden Path Generator](../../48-ai-golden-path-generator/README.md)
- [49 · AI Service Catalog Assistant](../../49-ai-service-catalog-assistant/README.md)
- [44 · AI Repository Infrastructure Analyzer](../../44-ai-repository-infrastructure-analyzer/README.md)
