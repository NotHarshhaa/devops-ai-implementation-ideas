# AI Postmortem Generator — Architecture

> Draft the postmortem from real evidence — timeline, causal chain, contributing factors, action items — so humans edit instead of excavate.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

After incident resolution, the generator assembles the evidence package (from the investigator's bundle), drafts a complete postmortem in the org template, and opens it as a doc PR for human editing. It tracks action items afterward and reports on their status.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Incident resolved → evidence package               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Timeline + causal reconstruction                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Draft postmortem (org template)                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc PR · human edits                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Action items tracked · patterns reported           │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Evidence assembler | channel logs, incident platform data, telemetry snapshots |
| Draft engine | template-aware LLM composition |
| Review integration | doc/PR workflow with comments |
| Action tracker | item sync and status reporting |
| Corpus analyzer | cross-incident pattern detection |

## 4. Data Flow

1. On resolution, the evidence package is assembled.
2. The draft is generated following the org template and blameless conventions.
3. A doc PR goes to the incident commander and owners for editing.
4. Action items are tracked; recurring patterns surface across incidents.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `incident timeline and comms`
* `alert and mitigation history`
* `metrics around the window`
* `deploy/config changes`
* `past related postmortems`

## 7. Human-in-the-Loop & Approval

Drafts only. Humans own the narrative, the judgment, and the blamelessness review before anything is published.

## 8. Security Considerations

* Postmortems are sensitive: drafts stay in access-controlled systems; external sharing requires explicit sanitization.
* Blameless language enforced by template and prompt; personal data minimized.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [32 · AI Root Cause Analysis Assistant](../32-ai-root-cause-analysis-assistant/README.md)
- [31 · AI Incident Summarizer](../31-ai-incident-summarizer/README.md)
