# Natural Language → Terraform — Architecture

> Describe the infrastructure you need in plain language; get a reviewed, standards-compliant Terraform module using your golden modules.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A self-service assistant (web/CLI/Backstage plugin) that interviews the user briefly, composes Terraform from the org's module registry (retrieved via RAG), runs a speculative plan with cost estimate, and opens a PR with explanations. From-scratch HCL is a last resort behind policy checks.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ User intent (Backstage · CLI · web)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Clarifying questions                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Golden-module composition                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← RAG over registry
┌────────────────────────────────────────────────────┐
│ Sandbox plan + cost estimate                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR → platform review                               │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Conversation front end | Backstage plugin/CLI/web with structured request flow |
| Module registry + retriever | indexed golden modules with usage examples |
| Generator | LLM composing standards-compliant root modules |
| Sandbox planner | isolated plan runs with cost estimation |
| PR publisher | repo PR with explanation and review routing |

## 4. Data Flow

1. The user describes the need; clarifications resolve ambiguities.
2. The generator composes Terraform from retrieved golden modules.
3. A sandbox plan validates the result and attaches cost.
4. A PR is opened for platform review; outcomes improve the library.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `golden module docs and examples`
* `org standards (naming, tagging)`
* `similar past requests`
* `environment constraints`
* `plan output`

## 7. Human-in-the-Loop & Approval

Platform review on every PR (CODEOWNERS). The assistant never applies; it proposes.

## 8. Security Considerations

* Policy-as-code remains the hard gate regardless of how good the LLM output looks.
* Sandbox plans use scoped, expiring credentials; generated code is scanned (secrets/IaC misconfig) before PR.
* Prevent prompt-driven scope creep: the assistant can't request elevated permissions, only standard catalog items.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [48 · AI Golden Path Generator](../48-ai-golden-path-generator/README.md)
