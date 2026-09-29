# AI Terraform Plan Explainer — Architecture

> Before you approve: a plain-language, per-resource explanation of what the plan will do, why, and what could go wrong.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A companion to any plan flow (CI PR check, Atlantis, TFC): parse `terraform show -json`, and produce an explainer — summary block, per-resource table, danger callouts, and a 'why' section traced to source lines or drift. Posted as the PR comment humans actually read before clicking approve.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Plan JSON from CI / TFC / Atlantis                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Action analyzer (replacements · deletions · drift) │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM narrator (per-resource · audience-tuned)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR explainer + danger callouts                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Informed human approval                            │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Plan source | consumes plan JSON from CI artifacts or TFC/Atlantis APIs |
| Analyzer | deterministic extraction of actions, reasons, and unknowns |
| Narrator | LLM explainer with severity emphasis |
| Publisher | PR comments/check runs |

## 4. Data Flow

1. The plan JSON is fetched from the running pipeline.
2. Deterministic analysis extracts every action and its reason code.
3. The narrator writes the explainer, escalating risky actions to the top.
4. The comment is posted where approval happens.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `plan JSON`
* `state diffs for drift tracing`
* `configuration diff`
* `provider version changes`
* `resource criticality tags`

## 7. Human-in-the-Loop & Approval

Pure explanation. Approval remains human; the explainer makes that approval informed.

## 8. Security Considerations

* Plans can expose sensitive attributes: mask before model calls; local model option for sensitive workspaces.
* Keep explainer output free of secret values — it quotes structure, not contents.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [20 · AI Terraform Error Analyzer](../20-ai-terraform-error-analyzer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)
