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

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "leak_detection_id": "sec-leak-8491",
  "repository": "org/payment-service",
  "file_path": "src/services/stripe_client.py",
  "commit_sha": "3a4b5c6d7e8f",
  "secret_classification": {
    "secret_type": "STRIPE_LIVE_RESTRICTED_KEY",
    "redacted_token": "rk_live_...9f2a",
    "is_real_credential": true,
    "confidence": 0.99
  },
  "blast_radius_analysis": {
    "affected_provider": "Stripe",
    "granted_capabilities": [
      "charges:write",
      "customers:read",
      "refunds:write"
    ],
    "maximum_damage_scenario": "Unauthorized initiation of customer refunds and exfiltration of customer cardholder metadata."
  },
  "audit_log_verification": {
    "audit_checked": true,
    "log_source": "Stripe API Audit Logs",
    "unauthorized_api_calls_detected": 0,
    "time_window_evaluated": "Last 72 hours"
  },
  "emergency_rotation_runbook": [
    {
      "step": 1,
      "action": "Generate new replacement restricted key in Stripe Dashboard with identical scopes.",
      "urgency": "IMMEDIATE"
    },
    {
      "step": 2,
      "action": "Update AWS Secrets Manager secret 'prod/payment/stripe_key' with new value.",
      "urgency": "IMMEDIATE"
    },
    {
      "step": 3,
      "action": "Revoke leaked key 'rk_live_...9f2a' in Stripe Dashboard.",
      "urgency": "IMMEDIATE"
    },
    {
      "step": 4,
      "action": "Purge leaked commit 3a4b5c6d7e8f from git history using git-filter-repo.",
      "urgency": "POST_MITIGATION"
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

* `finding location and context`
* `credential type/pattern`
* `provider metadata`
* `usage/audit logs`
* `repo history state`

## 8. Human-in-the-Loop & Approval

The assistant never touches credentials or revokes anything. Live validation (e.g., a get-caller-identity call) only runs under policy with human trigger.

## 9. Security Considerations

* Never send the secret value itself to the model — only type, prefix, and metadata.
* Live validation is destructive-adjacent: policy-gated, logged, human-triggered only.
* The runbook itself should avoid embedding current credential values.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../../40-ai-cloud-misconfiguration-analyzer/README.md)
- [41 · AI Security Incident Assistant](../../41-ai-security-incident-assistant/README.md)
- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
