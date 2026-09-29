# AI Root Cause Analysis Assistant — Architecture

> Guide root-cause analysis with evidence: candidate causes ranked by data, each with the check that confirms or kills it.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An RCA companion for the investigation phase (post-mitigation or during): it reads the incident evidence (from idea 05's investigation or raw sources), proposes a hypothesis tree, and for each branch names the decisive check. Humans run checks and report back; the assistant re-ranks and narrates the emerging mechanism.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Incident evidence loaded                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hypothesis tree proposed                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← priors from history
┌────────────────────────────────────────────────────┐
│ Discriminating checks suggested                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Humans run checks · results fed back               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Causal-chain narrative + uncertainty               │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Evidence loader | pulls from investigation packages (idea 05) or raw sources |
| Hypothesis engine | LLM + historical base rates from past RCAs |
| Check recommender | maps hypotheses to concrete queries/commands |
| State tracker | hypothesis tree status through the session |
| Narrative writer | final mechanism description |

## 4. Data Flow

1. Evidence is loaded from the incident record.
2. A hypothesis tree is proposed with initial ranking.
3. Each round, the assistant names the most decisive next check.
4. Results update the tree; the final narrative explains the mechanism and what remains unknown.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `incident timeline`
* `metrics/logs/traces`
* `change history`
* `past RCA records`
* `architecture/topology`

## 7. Human-in-the-Loop & Approval

Humans run all checks; the assistant structures the process. It can be wrong — its job is to make hypotheses explicit and testable, not to declare truth.

## 8. Security Considerations

* RCA narratives can name people/systems: keep them in access-controlled postmortem tools.
* Blameless framing enforced in templates and prompts.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
- [17 · AI Kubernetes Incident Investigator](../17-ai-kubernetes-incident-investigator/README.md)
