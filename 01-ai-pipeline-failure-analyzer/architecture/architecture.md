# AI Pipeline Failure Analyzer — Architecture

> Turn every failed CI/CD job into an instant, context-rich diagnosis: what broke, why, and how to fix it.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A webhook-driven analyzer listens for pipeline failure events, collects the failed job's logs plus repo context (commit diff, changed files, dependency state), and sends a compact, structured package to an LLM. The model returns a structured diagnosis — failure type, root cause, evidence, suggested fix — which is posted as a PR comment and Slack message with links back to the exact log lines.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ CI/CD system (Actions · Jenkins · GitLab)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← failure webhook
┌────────────────────────────────────────────────────┐
│ Pipeline failure event                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Log & metadata collector                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← redaction applied
┌────────────────────────────────────────────────────┐
│ Context builder (diff · deps · history)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ AI model / agent                                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← structured output schema
┌────────────────────────────────────────────────────┐
│ Root cause + suggested fix                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR comment · Slack · dashboard                     │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Webhook listener | receives failure events from GitHub Actions, Jenkins, GitLab CI, or CircleCI and normalizes them |
| Log collector | fetches failed-step logs and truncates around error signatures; redacts secrets before anything leaves the cluster |
| Context builder | assembles commit diff, file contents at the failed commit, dependency changes, and build history |
| Retrieval store | vector DB of past failures and resolutions for similarity lookup |
| LLM runtime | structured-output call returning failure type, root cause, evidence, and fix suggestion |
| Reporter | posts to PR checks/comments and Slack; links every claim to source log lines |
| Feedback store | records whether humans accepted the diagnosis; powers evals and dedup |

## 4. Data Flow

1. CI/CD posts a failure webhook to the analyzer service.
2. Collector pulls logs for the failed jobs and applies secret redaction and size caps.
3. Context builder enriches with the commit diff, changed files, lockfile, and similar past failures from the vector store.
4. The LLM returns a schema-validated JSON diagnosis; validation failures trigger one retry with a cheaper fallback model.
5. The reporter publishes the diagnosis to the PR and Slack, with deep links to the exact evidence lines.
6. Human feedback (helpful / wrong / flaky) is written back to the store for evals and future retrieval.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "failure_type": "build | test | dependency | infrastructure | timeout | flaky",
  "root_cause": "Detailed explanation of why the failure occurred in this specific run",
  "evidence": [
    {
      "step": "build-container",
      "line_number": 412,
      "log_snippet": "error TS2322: Type 'string' is not assignable to type 'number'"
    }
  ],
  "correlated_diff": {
    "file": "src/types/api.ts",
    "commit": "a1b2c3d",
    "change_summary": "Changed paymentId field definition from number to string"
  },
  "suggested_fix": {
    "action": "code_change",
    "description": "Cast paymentId or update caller contract in src/services/checkout.ts line 45",
    "command_or_snippet": "const id = Number(data.paymentId);"
  },
  "confidence_score": 0.95
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `failed job logs`
* `step timings and exit codes`
* `commit diff and message`
* `dependency lockfile changes`
* `build environment and runner metadata`
* `past similar failures`
* `flaky-test registry`

## 8. Human-in-the-Loop & Approval

Read-only by design: the analyzer never retries pipelines or edits files. It suggests; the engineer decides whether to re-run, revert, or fix.

## 9. Security Considerations

* Redact secrets, tokens, and internal hostnames from logs before any model call; prefer a local model for the most sensitive repos.
* Use a read-only, least-privilege GitHub token; the analyzer can never trigger rebuilds or edit code.
* Allowlist which repositories enable analysis; keep an audit log of every model call with repo, SHA, and cost.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Volume equals your failure rate — typically tens to a few hundred events per day organization-wide. Mini/flash-class models handle triage for well under a cent per event; reserve the frontier model for the initial deep-analysis pass or complex repos only.

## 13. Related Ideas

- [10 · AI Test Failure Analyzer](../../10-ai-test-failure-analyzer/README.md)
- [07 · AI GitHub Actions Debugger](../../07-ai-github-actions-debugger/README.md)
- [04 · AI Log Analyzer](../../04-ai-log-analyzer/README.md)
