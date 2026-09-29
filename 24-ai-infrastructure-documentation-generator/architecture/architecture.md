# AI Infrastructure Documentation Generator — Architecture

> Keep infrastructure docs alive: auto-generate and refresh module docs, diagrams, and examples from the code itself.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A scheduled/push-based generator walks IaC repos, extracts structure (via terraform-docs-style parsing plus LLM enrichment), and maintains docs as PRs — never direct writes. Diagrams regenerate on structural change; narrative sections update only with human review to preserve voice.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ IaC repo scan (scheduled · push)                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Structure extraction (modules · vars · outputs)    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Generator (docs · Mermaid · examples)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Drift diff → refresh PRs                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human review · auto-merge label                    │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Repo walker | detects modules, workspaces, and doc targets |
| Extractor | schema-level parsing of IaC code |
| Generator | LLM + deterministic templates for docs and diagrams |
| Drift detector | docs-vs-code comparison |
| PR publisher | refresh PRs with labels |

## 4. Data Flow

1. A push or schedule triggers repo scanning.
2. Structure is extracted; docs and diagrams are regenerated.
3. Diffs become refresh PRs; drift summary is reported.
4. Reviews keep narrative quality; mechanical updates can auto-merge.

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

* `module code and schemas`
* `examples and tests`
* `commit history and ADRs`
* `existing docs`
* `module registry metadata`

## 7. Human-in-the-Loop & Approval

Doc PRs reviewed like code; mechanical regeneration can auto-merge under label policy.

## 8. Security Considerations

* Never render secret values in docs; schema-only extraction with redaction tests in CI.
* Public-repo publishing needs an explicit allowlist per module.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [22 · Natural Language → Terraform](../22-natural-language-to-terraform/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
