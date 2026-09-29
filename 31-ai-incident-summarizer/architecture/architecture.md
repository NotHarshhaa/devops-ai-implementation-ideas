# AI Incident Summarizer — Architecture

> Live incident summaries for every audience: exec updates, channel newcomers' briefings, and stakeholder comms drafted from the real timeline.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A summarizer bot watching the incident channel and timeline data: it drafts audience-specific updates on demand ('/brief execs') or on schedule, always posted as drafts for IC approval before sending. Nothing goes out unreviewed.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Incident channel + timeline ingest                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Summary drafter (per audience)                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ IC review thread                                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Approved distribution                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Comms archive → postmortem                         │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Channel listener | reads incident threads (with access controls) |
| Timeline integration | incident platform events |
| Summary engine | audience templates + LLM drafting |
| Approval flow | IC review interactions |
| Archive | comms log for review and training |

## 4. Data Flow

1. During an incident, the listener maintains a rolling view of events and messages.
2. Drafts for each audience are generated on schedule or demand.
3. The IC edits and approves; approved text is distributed.
4. The full communication log is archived for the postmortem.

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

* `incident channel messages`
* `timeline events`
* `severity and status`
* `impacted services`
* `past incident comms style`

## 7. Human-in-the-Loop & Approval

Every external update requires IC approval; the bot drafts, humans speak.

## 8. Security Considerations

* Incident channels contain sensitive info: summaries respect channel boundaries; no cross-posting secrets.
* Drafts-only default prevents the bot from ever speaking unapproved to execs/customers.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
- [50 · AI On-Call Copilot](../50-ai-on-call-copilot/README.md)
