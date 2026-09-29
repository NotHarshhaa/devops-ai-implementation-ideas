# AI Cloud Misconfiguration Analyzer — Architecture

> Turn CSPM findings into explained, prioritized fixes: what's exposed, why it matters, and the exact change that closes it.

*Focus: 🔐 DevSecOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A triage and remediation layer over your CSPM: findings are enriched with catalog/ownership/data context, re-ranked with LLM reasoning, and delivered per team as explained worklists — high-confidence fixes as IaC PRs, judgment calls as decisions with options.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ CSPM findings ingest                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Context enrichment (owner · data · exposure)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Attack-path ranking + narrative                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ IaC fix PRs · decision memos                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Guardrails for recurring patterns                  │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Finding ingester | CSPM integrations |
| Context service | catalog, tagging, data classification |
| Ranking engine | attack-path reasoning (LLM + graph context) |
| Remediation generator | IaC PR drafts |
| Guardrail publisher | policy-as-code/modules for systemic patterns |

## 4. Data Flow

1. Findings flow in from the CSPM on schedule.
2. Enrichment attaches ownership, sensitivity, and exposure context.
3. Ranking produces short, explained per-team worklists.
4. Mechanical fixes become PRs; patterns become guardrails.

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

* `findings and severities`
* `resource purpose and owner`
* `data sensitivity`
* `network exposure`
* `workload dependencies`
* `past suppressions`

## 7. Human-in-the-Loop & Approval

All remediation via review. Suppression requires documented rationale and expiry.

## 8. Security Considerations

* Re-ranking must stay auditable: any demotion of a finding carries rationale and reviewer sign-off.
* Context data (data classification) is sensitive; handle accordingly.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [23 · AI IaC Security Analyzer](../23-ai-iac-security-analyzer/README.md)
- [27 · AI IAM Policy Reviewer](../27-ai-iam-policy-reviewer/README.md)
- [37 · AI Container Vulnerability Explainer](../37-ai-container-vulnerability-explainer/README.md)
