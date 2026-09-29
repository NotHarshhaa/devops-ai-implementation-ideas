# AI Deployment Risk Analyzer — Architecture

> Score every deployment's risk before it ships by reading the change, its history, and the system's incident past.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

Before deployment, a risk service ingests the release candidate's metadata — commits, diffs, linked tickets, author history, component SLO criticality, and recent incident data — and produces an explainable risk card consumed by the CD pipeline: informational badge, auto-approved canary policy, or mandatory extra review. The LLM's job is explanation and recommendation over ML/statistical features, not magic scoring.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Release candidate (commits · diff)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Feature extractor (size · history · timing)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Incident & deploy history lookup                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← RAG
┌────────────────────────────────────────────────────┐
│ LLM risk narrative + recommendations               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Risk card → CD policy (badge · canary · review)    │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Metadata collector | VCS, ticketing, deploy history, incident store |
| Feature extractor | deterministic statistical features (kept explainable and auditable) |
| History retriever | past deploys/incidents per component from the RAG store |
| Risk explainer | LLM producing narrative, drivers, and mitigation recommendations |
| Policy connector | publishes badges and optionally sets CD gates (canary vs. full deploy) |
| Calibration job | back-tests predictions against realized change failures |

## 4. Data Flow

1. A release candidate is assembled; the collector gathers commits, diffs, tickets, and history.
2. Deterministic features are computed; the retriever adds correlated past incidents.
3. The LLM writes an explainable risk narrative with concrete mitigation suggestions.
4. The risk card gates or informs the pipeline per team policy.
5. Outcomes (successful, rolled back, caused incident) are recorded to calibrate future scores.

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

* `commit set and diff stats`
* `component criticality (SLO tier)`
* `author familiarity with the component`
* `recent deploy frequency`
* `incident history for touched components`
* `deploy timing (freeze windows, on-call load)`

## 7. Human-in-the-Loop & Approval

The score informs gating policy defined by humans; authors can appeal scores, and appeals are logged to improve the model.

## 8. Security Considerations

* Keep scoring advisory until calibrated; a miscalibrated hard gate is a delivery outage.
* Access to incident and HR-adjacent data (author history) needs privacy review; aggregate where possible.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [12 · AI Deployment Troubleshooting Agent](../12-ai-deployment-troubleshooting-agent/README.md)
- [09 · AI Release Summary Generator](../09-ai-release-summary-generator/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
