# AI Repository Infrastructure Analyzer — Architecture

> Point it at a repo and get the full infrastructure story: what it runs on, how it deploys, what it depends on, and what's missing.

*Focus: 🧑‍💻 Developer Experience · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An analyzer that reads a repo end-to-end (CI configs, manifests, Dockerfiles, IaC, dependency files), produces a structured infrastructure profile with an explanation narrative, and — across repos — aggregates fleet views. Feeds onboarding docs (idea 43), platform dashboards, and migration planning.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Repo scan (CI · IaC · manifests)                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Structured infrastructure profile                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deployment-story narrative                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Gap analysis vs. standards                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Fleet aggregation dashboard                        │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Repo scanner | file/config enumeration and parsing |
| Profile builder | structured extraction with confidence labels |
| Narrator | LLM explanation of the deployment story |
| Standards engine | org-convention gap analysis |
| Fleet aggregator | cross-repo analytics |

## 4. Data Flow

1. A repo (or org) is scanned on demand or schedule.
2. Profiles are extracted with structured confidence.
3. Each repo gets a narrative and gap report.
4. Fleet views reveal patterns, risks, and migration scope.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `CI configs`
* `Dockerfiles/manifests/IaC`
* `dependency manifests`
* `scripts`
* `existing docs`
* `org standards`

## 7. Human-in-the-Loop & Approval

Read-only analysis and reporting.

## 8. Security Considerations

* Repo contents are sensitive: restrict to approved providers/local models; respect access permissions strictly.
* Aggregate views must not leak one team's code details to another.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [47 · AI Internal Developer Platform Assistant](../47-ai-internal-developer-platform-assistant/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)
