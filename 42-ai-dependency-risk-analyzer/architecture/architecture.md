# AI Dependency Risk Analyzer — Architecture

> Decide on dependency alerts fast: is this vulnerable dependency actually used, what's the upgrade path, and what breaks?

*Focus: 🔐 DevSecOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A triage layer over dependency alerts: each alert is evaluated against the repo's actual code usage, upgrade feasibility is assessed (changelog/diff summaries), and teams receive a short, explained queue — trivial bumps as auto-prepared PRs, risky ones as scoped proposals with migration notes.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Dependency alerts ingest (Dependabot · Renovate)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Repo usage analysis                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Upgrade path + breaking-change summary             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explained queue · tiered PRs                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ CI feedback loop                                   │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Alert ingester | Dependabot/Renovate/Snyk integration |
| Usage analyzer | code search + import graph for reachability |
| Upgrade planner | changelog/diff summarization |
| Queue publisher | per-team explained lists and tiered PRs |
| Feedback loop | CI outcomes and merge decisions recorded |

## 4. Data Flow

1. Alerts and dependency PRs arrive continuously.
2. Usage analysis separates reachable risk from theoretical.
3. Upgrade paths are pre-analyzed with breaking-change notes.
4. Teams get a short explained queue with tiered, pre-worked PRs.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `alert details and CVEs`
* `repo code usage of affected APIs`
* `changelogs and diffs`
* `build/test status`
* `dependency maintenance signals`

## 7. Human-in-the-Loop & Approval

Humans merge everything. The system's contribution is ranked, explained, pre-worked queue items.

## 8. Security Considerations

* Supply-chain caution: generated upgrade PRs are still code from outside — CI, signing, and review rules apply fully.
* Pinned versions and lockfile integrity checks remain mandatory.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [37 · AI Container Vulnerability Explainer](../37-ai-container-vulnerability-explainer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)
- [07 · AI GitHub Actions Debugger](../07-ai-github-actions-debugger/README.md)
