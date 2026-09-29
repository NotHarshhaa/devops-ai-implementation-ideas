# AI IAM Policy Reviewer — Architecture

> Review IAM policies and roles for least privilege: over-grants explained, unused permissions identified, tighter policies drafted.

*Focus: ☁️ Cloud · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A policy review service that ingests policies, trust relationships, access-analyzer findings, and usage logs; produces a per-role report (over-grants, unused, escalations, external exposure); and drafts tightened policies as PRs against the IaC repo, with a canary-and-rollback plan attached.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ IAM state + usage logs (read-only)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Granted-vs-used analyzer                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM risk narrative per role                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Tightened policy PRs                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← annotations + rollback plan
┌────────────────────────────────────────────────────┐
│ AccessDenied monitor post-merge                    │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| IAM collector | policies, roles, analyzers, usage events from cloud APIs |
| Usage analyzer | deterministic granted-vs-used comparison |
| Risk narrator | LLM explanations and escalation-path analysis |
| Policy drafter | generated least-privilege policies with rationale |
| Rollout monitor | post-change denial tracking |

## 4. Data Flow

1. Scheduled collection snapshots IAM state and usage.
2. Deterministic analysis separates granted from used permissions.
3. The model explains each role's real risk and drafts tighter policies.
4. PRs are reviewed and merged; monitoring catches over-tightening with a rollback path.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `policies and trust relationships`
* `90-day usage logs`
* `access-analyzer findings`
* `resource sensitivity classifications`
* `org role conventions`

## 7. Human-in-the-Loop & Approval

All tightening via PR review; security and service owners co-approve. Analyzer never edits IAM directly.

## 8. Security Considerations

* The reviewer has read-only access; generated policies go through full human review — an automated IAM change is its own incident class.
* Usage logs may contain sensitive resource identifiers: redact before model calls.
* Beware learned over-fitting: deny recommendations must consider break-glass and seasonal patterns.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [41 · AI Security Incident Assistant](../41-ai-security-incident-assistant/README.md)
- [25 · AI Cloud Troubleshooting Assistant](../25-ai-cloud-troubleshooting-assistant/README.md)
