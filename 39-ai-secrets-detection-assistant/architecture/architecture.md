# AI Secrets Detection Assistant — Architecture

> Triage secrets findings fast: is this credential real, what does it access, how urgent is rotation, and has it been used?

*Focus: 🔐 DevSecOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A triage assistant layered on Gitleaks/TruffleHog findings: each finding gets classified, prioritized, and — if real — attached to a concrete response runbook with the exact commands for that credential type. Push-protection and pre-commit stay the prevention layer; this handles the findings that slip through.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Secrets findings (Gitleaks · TruffleHog)           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Validity classifier (real · test · stale)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Blast-radius + usage assessment                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Tailored rotation runbook                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Response tracking to closure                       │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Finding ingester | scanner integrations |
| Classifier | credential-type knowledge + provider metadata |
| Usage checker | read-only audit-log interpretation where policy allows |
| Runbook generator | provider-specific response steps |
| Tracker | status workflow per finding |

## 4. Data Flow

1. Findings arrive from scanning sources.
2. Classification separates real credentials from noise with reasoning shown.
3. Real ones get blast-radius notes, usage evidence, and a tailored runbook.
4. Response is tracked to closure with the audit trail.

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

* `finding location and context`
* `credential type/pattern`
* `provider metadata`
* `usage/audit logs`
* `repo history state`

## 7. Human-in-the-Loop & Approval

The assistant never touches credentials or revokes anything. Live validation (e.g., a get-caller-identity call) only runs under policy with human trigger.

## 8. Security Considerations

* Never send the secret value itself to the model — only type, prefix, and metadata.
* Live validation is destructive-adjacent: policy-gated, logged, human-triggered only.
* The runbook itself should avoid embedding current credential values.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [41 · AI Security Incident Assistant](../41-ai-security-incident-assistant/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
