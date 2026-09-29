# AI DevOps Documentation Generator — Architecture

> Generate and maintain the DevOps documentation nobody has time to write: pipeline guides, environment docs, operational how-tos — from the actual repo and infra.

*Focus: 🧑‍💻 Developer Experience · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A doc service that watches infrastructure-relevant repos: on meaningful changes it regenerates affected docs and opens refresh PRs; on demand it answers questions with citations. Focus on the high-traffic pages: local setup, deploy guide, environment/variables, and operations how-tos.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Repo + CI config indexing                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc-dependency mapping                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Regeneration on change → PRs                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat Q&A with citations                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc-gap tickets from questions                     │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Repo indexer | config/manifest parsing and dependency mapping |
| Generator | template + LLM doc synthesis per page type |
| PR publisher | refresh PRs with clear scope |
| Q&A engine | RAG over repo and docs |
| Gap tracker | unanswered questions → tickets |

## 4. Data Flow

1. Repos are indexed and doc dependencies mapped.
2. Config changes trigger regeneration of affected pages as PRs.
3. Engineers ask questions in chat and get cited answers.
4. Question patterns reveal and fill documentation gaps.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `CI pipeline definitions`
* `Dockerfiles and manifests`
* `scripts and Makefiles`
* `existing docs`
* `git history for 'why' context`

## 7. Human-in-the-Loop & Approval

Doc PRs are reviewed; auto-merge only for purely mechanical sections under label policy.

## 8. Security Considerations

* Never document secrets (even internal-only pages should reference the secret manager).
* Q&A respects repo access permissions; no cross-repo leakage.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)
- [22 · Natural Language → Terraform](../22-natural-language-to-terraform/README.md)
