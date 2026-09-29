# AI Jenkins Log Analyzer — Architecture

> Decode sprawling Jenkins console logs and plugin errors into a one-paragraph diagnosis with the fix.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A Jenkins plugin/CLI companion fetches the failed build's console log (and stage results via the Jenkins API), applies the same redaction and windowing used in idea 01, and asks the model for a Jenkins-specific diagnosis posted back as a build description/comment and Slack message. Dedicated pipeline stages can call it inline for immediate feedback.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Jenkins build failure                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Jenkins API (log · stages · node)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Log reducer + redaction                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis (Jenkins-aware)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← shared-library RAG
┌────────────────────────────────────────────────────┐
│ Build page comment · Slack                         │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Failure hook | webhook listener or reusable pipeline library step |
| Jenkins API client | console log, stage graph, node/agent status, plugin list |
| Log reducer | stage-aware windowing and secret redaction |
| Analysis engine | LLM with Jenkins knowledge + org-specific notes (shared libs, agent labels) |
| Reporter | build description/comment and Slack card |

## 4. Data Flow

1. A failed build triggers the hook with the job URL and build number.
2. The client fetches console log and stage metadata via the Jenkins API.
3. Reduction keeps per-stage error windows and redacts secret output.
4. The model returns failure class, root cause, and fix snippet.
5. Results are attached to the build and posted to Slack.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `console log (windowed)`
* `stage/step graph`
* `node and agent status`
* `plugin versions`
* `Jenkinsfile (if pipeline)`
* `triggering commit`

## 7. Human-in-the-Loop & Approval

Advisory only. Retry/build decisions stay with the engineer or existing retry policies.

## 8. Security Considerations

* Console logs frequently echo secrets despite masking: redact aggressively and cap what leaves the network; use local models for sensitive controllers.
* Read-only Jenkins API user; never expose credentials or apply rights to the analyzer.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [01 · AI Pipeline Failure Analyzer](../01-ai-pipeline-failure-analyzer/README.md)
- [07 · AI GitHub Actions Debugger](../07-ai-github-actions-debugger/README.md)
- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
