# AI GitHub Actions Debugger — Architecture

> Deep-dive GitHub Actions failures — matrix jobs, annotations, runner issues — with fixes as ready-to-apply suggestions.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

On workflow failure, a GitHub App fetches the run's jobs, steps, annotations, and logs via the API, reduces them, and runs an Actions-specialized analysis. Output: a run summary with root cause, classification, and — for workflow-file issues — a one-click 'apply suggestion' patch. Pairs naturally with the managed reviewers (CodeRabbit/Qodo) for the code-side review layer.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ workflow_run failure event                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ GitHub API (jobs · logs · annotations)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Reducer + matrix grouping                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis (workflow YAML aware)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Run summary + YAML patch suggestion                │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| GitHub App | webhooks, checks/reporting, suggestion comments |
| Actions API client | jobs, steps, logs, annotations, runner metadata |
| Reducer | log windowing per job/step, matrix leg grouping |
| Analysis engine | LLM with the workflow file, run metadata, and org conventions |
| Suggestion publisher | summary + inline YAML suggestions with apply buttons |

## 4. Data Flow

1. A failed workflow run triggers the GitHub App webhook.
2. The client pulls job/step results, logs, annotations, and the workflow YAML.
3. Reduction groups failures across matrix legs and extracts error windows.
4. The model classifies and explains the failure, referencing exact steps.
5. A summary is published to the run and a patch suggestion as a PR review comment when applicable.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `workflow YAML`
* `job/step logs`
* `annotations`
* `runner labels and metadata`
* `matrix combinations`
* `triggering PR diff`

## 7. Human-in-the-Loop & Approval

Advisory comments and review suggestions only; humans click 'commit suggestion' or fix manually.

## 8. Security Considerations

* GitHub App with minimal permissions (actions: read, checks: write, pull_requests: write for suggestions).
* Redact masked-secret echoes and third-party log noise; keep private-repo analysis within approved providers.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [01 · AI Pipeline Failure Analyzer](../01-ai-pipeline-failure-analyzer/README.md)
- [10 · AI Test Failure Analyzer](../10-ai-test-failure-analyzer/README.md)
- [11 · AI Build Optimization Assistant](../11-ai-build-optimization-assistant/README.md)
