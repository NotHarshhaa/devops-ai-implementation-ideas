# AI Test Failure Analyzer — Architecture

> Classify test failures as bug, flake, or environment in seconds — with evidence, retry policy, and the owning team.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

The analyzer consumes JUnit/pytest/jest results from CI (or a test-reporting service), enriches each failure with its history and the triggering diff, and posts a classification card: cause, evidence, suggested action (fix, retry policy, quarantine with expiry, revert). Feeds dashboards for flake trends and per-team failure debt.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ CI test results (JUnit · TRX · JSON)               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ History & diff enrichment                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Classifier (LLM + heuristics)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← bug · flake · env · debt
┌────────────────────────────────────────────────────┐
│ PR card · issue routing                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Quarantine (expiring) · dashboards                 │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Result ingester | parses test reports from CI artifacts or services like BuildPulse-style trackers |
| History store | per-test pass/fail timeline and variance |
| Classifier | hybrid: deterministic history stats + LLM reading of stack traces and diffs |
| Router | ownership mapping (test file → team) and issue integration |
| Quarantine manager | time-boxed exclusions with expiry and review reminders |

## 4. Data Flow

1. CI publishes test results to the analyzer.
2. Enrichment attaches each failure's history and the triggering change.
3. The classifier labels each failure with evidence and a recommended action.
4. PRs get a card; owners get issues; flaky candidates enter expiry-based quarantine.
5. Accuracy is tracked against human overrides to improve prompts and thresholds.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "test_suite": "e2e-checkout-tests",
  "test_name": "test_checkout_with_discount_coupon",
  "classification": "FLAKY",
  "confidence": 0.89,
  "classification_reasons": [
    "Failed 3 times in last 10 master builds without code changes to coupon module",
    "Failure occurs on async element polling timeout (3000ms threshold)"
  ],
  "root_cause_analysis": "Race condition: Playwright test asserts coupon badge visibility before the background API response completes rendering.",
  "recommended_action": {
    "policy": "temporary_quarantine",
    "quarantine_expiry_days": 7,
    "suggested_fix": "Use await page.waitForResponse(url) before asserting coupon element visibility",
    "assigned_team": "frontend-checkout-squad"
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `stack traces and assertion diffs`
* `per-test failure history`
* `triggering commit/diff`
* `runner environment info`
* `test ownership map`

## 8. Human-in-the-Loop & Approval

Classifications are advisory; auto-quarantine only after a team opts in and always with expiry and owner.

## 9. Security Considerations

* Test output can embed fixtures/secrets: redact before model calls.
* Quarantine must not become a black hole: expiries and owner reviews are mandatory.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [01 · AI Pipeline Failure Analyzer](../../01-ai-pipeline-failure-analyzer/README.md)
- [07 · AI GitHub Actions Debugger](../../07-ai-github-actions-debugger/README.md)
- [35 · AI Anomaly Investigation Agent](../../35-ai-anomaly-investigation-agent/README.md)
