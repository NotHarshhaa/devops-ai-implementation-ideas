# AI Terraform Error Analyzer — Architecture

> Translate cryptic Terraform failures — state locks, provider API errors, drift conflicts — into cause and fix.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

Wrap Terraform failure points (CI apply jobs, Atlantis, Terraform Cloud runs) with an analyzer that captures stderr, state metadata, and provider config, then returns a diagnosis with the safe remediation path and rationale. Delivered as a CI annotation plus Slack card.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Failed plan / apply (CI · TFC · Atlantis)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Error capture + state/provider context             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis (error taxonomy)                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Safe fix path + warnings                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ CI annotation · Slack card                         │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Failure hook | CI/TFC/Atlantis failure events |
| Context collector | stderr, run metadata, provider versions, redacted state snippets |
| Knowledge retriever | provider release notes and known-issues index |
| Diagnosis engine | error taxonomy + LLM reasoning |
| Reporter | annotations and Slack cards |

## 4. Data Flow

1. A failed run triggers capture of the error output and run metadata.
2. Enrichment adds provider context and similar past errors.
3. The model classifies the error and drafts the safe remediation.
4. The fix appears where the engineer is already looking: CI and Slack.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "diagnostic_id": "TF-ERR-7192",
  "execution_context": {
    "workspace": "networking-production",
    "phase": "terraform_apply",
    "terraform_version": "1.8.5",
    "provider": "hashicorp/aws v5.42.0"
  },
  "error_classification": {
    "error_type": "STATE_LOCK_HELD",
    "severity": "CRITICAL_DEPLOYMENT_BLOCKED",
    "confidence_score": 0.99
  },
  "raw_error_extract": "Error: Error acquiring the state lock: ConditionalCheckFailedException: The conditional request failed
Lock Info:
  ID:        b7d34c89-21a4-8f0a-6e5a-9b8417c8d901
  Path:      production-tf-state/networking.tfstate
  Operation: OperationTypeApply
  Who:       runner@gh-runner-pod-8b9f
  Version:   1.8.5
  Created:   2026-10-05 21:14:02.19 UTC",
  "root_cause_analysis": {
    "summary": "State file is locked by a previous GitHub Actions workflow run (ID: 984124) that timed out without running clean-up hooks.",
    "is_lock_stale": true,
    "lock_holder_status": "GitHub Actions job exited 42 minutes ago with status 'cancelled'"
  },
  "remediation": {
    "sanctioned_action": "FORCE_UNLOCK",
    "is_state_surgery": false,
    "command": "terraform force-unlock b7d34c89-21a4-8f0a-6e5a-9b8417c8d901",
    "pre_requisite_safety_checklist": [
      "Verified GitHub Actions workflow run #984124 is completely stopped",
      "Confirmed no other team member is actively running local terraform apply",
      "Created an automated S3 state snapshot backup before unlocking"
    ],
    "unsafe_actions_to_avoid": [
      "Do NOT manually delete DynamoDB lock table entries via AWS console.",
      "Do NOT run with '-lock=false' as this risks concurrent state corruption."
    ]
  }
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

* `error output`
* `run/workspace metadata`
* `provider versions`
* `redacted state snippets`
* `recent runs touching the same resources`
* `provider changelogs`

## 8. Human-in-the-Loop & Approval

Advisory. State surgery is explicitly flagged as human-expert territory with a checklist, never automated.

## 9. Security Considerations

* State may contain sensitive values: redact rigorously; prefer local models for state-adjacent context.
* Analyzer credentials are read-only; it cannot unlock, edit state, or apply.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
- [21 · AI Terraform Plan Explainer](../../21-ai-terraform-plan-explainer/README.md)
- [23 · AI IaC Security Analyzer](../../23-ai-iac-security-analyzer/README.md)
