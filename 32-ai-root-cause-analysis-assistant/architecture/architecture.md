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

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "rca_case_id": "RCA-2026-10-04",
  "incident_ref": "INC-2026-10-9182",
  "primary_symptom": "504 Gateway Timeout spike reaching 18% during payment checkout operations",
  "hypothesis_tree": [
    {
      "hypothesis_id": "H1",
      "rank": 1,
      "title": "Keep-alive connection pool timeout mismatch between Ingress Envoy and backend payment-service",
      "prior_probability": 0.85,
      "discriminating_check": {
        "check_type": "LogQL",
        "command_or_query": "{app="ingress-nginx"} |= "upstream connect error or disconnect/reset before headers"",
        "expected_if_true": "High volume of premature connection resets originating immediately after 15s idle intervals.",
        "expected_if_false": "Evenly distributed timeouts occurring across full request duration spectrum (>60s)."
      },
      "evaluation_status": "CONFIRMED"
    },
    {
      "hypothesis_id": "H2",
      "rank": 2,
      "title": "Database connection pool exhaustion on Postgres primary replica",
      "prior_probability": 0.10,
      "discriminating_check": {
        "check_type": "PromQL",
        "command_or_query": "pg_stat_activity_count{state="active"} / pg_settings_max_connections",
        "expected_if_true": "Database connection utilization ratio exceeding 95%.",
        "expected_if_false": "Utilization steady under 40%."
      },
      "evaluation_status": "REFUTED"
    }
  ],
  "confirmed_mechanism_narrative": {
    "trigger_event": "Commit a1b2c3d lowered backend Node.js server.keepAliveTimeout to 15 seconds to save idle socket memory.",
    "propagation_path": "Upstream Envoy ingress maintained a 60-second idle connection timeout. Envoy dispatched active checkout requests over sockets that Node.js had already closed, producing immediate 502/504 Bad Gateway responses.",
    "safeguard_failure": "Integration tests lacked HTTP keep-alive socket reuse assertion under idle delay conditions.",
    "residual_uncertainties": [
      "Determining why Envoy did not automatically retry idempotent GET/POST requests upon initial socket reset."
    ]
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `incident timeline`
* `metrics/logs/traces`
* `change history`
* `past RCA records`
* `architecture/topology`

## 8. Human-in-the-Loop & Approval

Humans run all checks; the assistant structures the process. It can be wrong — its job is to make hypotheses explicit and testable, not to declare truth.

## 9. Security Considerations

* RCA narratives can name people/systems: keep them in access-controlled postmortem tools.
* Blameless framing enforced in templates and prompts.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [05 · AI Incident Investigator](../../05-ai-incident-investigator/README.md)
- [36 · AI Postmortem Generator](../../36-ai-postmortem-generator/README.md)
- [17 · AI Kubernetes Incident Investigator](../../17-ai-kubernetes-incident-investigator/README.md)
