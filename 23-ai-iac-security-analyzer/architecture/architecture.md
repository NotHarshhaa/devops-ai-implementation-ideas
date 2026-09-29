# AI IaC Security Analyzer — Architecture

> Triage IaC security findings with context: which of these 40 scanner alerts actually matter, and what's the fix?

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

On PRs and scheduled scans, run tfsec/Checkov/KICS as usual, then let an LLM triage: merge duplicates, re-rank with resource context, explain attack paths in plain language, and suggest precise fixes. Findings become a small, honest list instead of a wall.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Scanners (tfsec · Checkov · KICS)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Resource context enrichment                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← catalog · tags
┌────────────────────────────────────────────────────┐
│ LLM triage (dedupe · re-rank · explain)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Inline fixes on PR                                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Suppression audit (monthly)                        │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Scan orchestrator | multi-scanner execution and result normalization |
| Context service | resource metadata from catalog, tags, and network posture |
| Triage engine | LLM re-ranking with documented rationale per finding |
| Fix generator | HCL suggestions validated by re-scan |
| Suppression auditor | ongoing review of ignore directives |

## 4. Data Flow

1. Scanners produce normalized findings on PRs and schedules.
2. Context enrichment attaches exposure and data-sensitivity data.
3. The triage engine produces a short, ranked, explained list.
4. Fixes appear inline; suppression hygiene is reviewed periodically.

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

* `scanner findings`
* `resource configuration`
* `network exposure`
* `environment and data classification`
* `existing suppressions`
* `past incident history for the service`

## 7. Human-in-the-Loop & Approval

Security engineers set triage policy; PR findings are advisory until teams opt into gates on the top severity class.

## 8. Security Considerations

* The LLM's re-ranking must never auto-dismiss findings silently — dismissals are recorded with rationale and reviewable.
* Policy-as-code stays the enforcement layer; this system advises humans who then set policy.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [38 · AI Kubernetes Security Analyzer](../38-ai-kubernetes-security-analyzer/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
