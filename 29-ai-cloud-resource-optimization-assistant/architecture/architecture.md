# AI Cloud Resource Optimization Assistant — Architecture

> Continuously find waste across your cloud: idle resources, oversized instances, storage tiering, and scheduling wins — as reviewable PRs.

*Focus: ☁️ Cloud · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A scheduled optimizer that scans cloud inventory and usage (CUR, CloudWatch/monitor metrics, storage analytics), verifies candidates with LLM reasoning over evidence, and files recommendations — where possible as IaC PRs — to owning teams. Trust comes from verified, explained findings rather than raw lists.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Cloud inventory + usage scan                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Candidate detection (idle · oversized · tiering)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM verification with evidence                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ IaC PRs / team recommendations                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Savings tracking dashboard                         │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Inventory scanner | multi-service resource and usage enumeration |
| Rule engine | deterministic waste heuristics |
| Verifier | LLM evidence review and rejection rationale |
| Recommendation publisher | PRs/tickets per owning team |
| Savings tracker | proposed vs. realized reporting |

## 4. Data Flow

1. Scheduled scans build the resource/usage inventory.
2. Rules propose candidates; the verifier filters with evidence and explanations.
3. Verified findings become PRs or tickets for owning teams.
4. Realized savings are tracked and published.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `resource inventory and utilization`
* `billing line items`
* `tagging/ownership`
* `environment purpose (dev/prod)`
* `backup/DR requirements`

## 7. Human-in-the-Loop & Approval

Recommendations only. Destructive actions (delete snapshot) require owner confirmation even in later phases.

## 8. Security Considerations

* Never auto-delete; destructive recommendations require explicit owner sign-off with retention checks (is it a backup? compliance hold?)
* Inventory scans are read-only and region/allowlist scoped.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [15 · AI Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)
- [28 · AI Cloud Architecture Advisor](../28-ai-cloud-architecture-advisor/README.md)
