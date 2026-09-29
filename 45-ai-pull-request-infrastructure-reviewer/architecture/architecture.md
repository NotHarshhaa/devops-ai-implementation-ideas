# AI Pull Request Infrastructure Reviewer — Architecture

> Infra-aware PR review: catches the deployment, config, and dependency consequences of code changes before merge.

*Focus: 🧑‍💻 Developer Experience · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A PR reviewer specialized for infrastructure awareness: it reads the diff plus deployment configs, env inventories, and org conventions, then comments on deployment consequences. Complements generic AI reviewers (CodeRabbit/Greptile/Qodo — use those for general code review) with deployment-topology knowledge they don't have.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ PR opened / updated                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Diff classifier (config · deps · endpoints)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deployment context enrichment                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← envs · manifests · catalog
┌────────────────────────────────────────────────────┐
│ Consequence review + inline comments               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human review · merge                               │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Diff classifier | identifies infrastructure-relevant change classes |
| Context service | env configs, manifests, catalog |
| Reviewer | LLM with deployment knowledge + org conventions |
| Comment publisher | inline annotations |
| Feedback loop | reviewer-accuracy tracking |

## 4. Data Flow

1. A PR webhook triggers diff classification.
2. Deployment context is gathered for the affected service.
3. Consequence analysis produces targeted comments.
4. Outcomes calibrate future review quality.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `PR diff`
* `deployment manifests`
* `environment variable inventories`
* `dependency manifests`
* `service catalog entry`
* `org conventions`

## 7. Human-in-the-Loop & Approval

Comments only; merge gates stay human and policy-driven.

## 8. Security Considerations

* Env inventories must be metadata-only (names/types, never values).
* Reviewer comments are public to the repo: no sensitive data in explanations.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [42 · AI Dependency Risk Analyzer](../42-ai-dependency-risk-analyzer/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)
