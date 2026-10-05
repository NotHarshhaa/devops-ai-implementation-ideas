# AI Cloud Architecture Advisor — Architecture

> A Well-Architected reviewer on demand: assess designs and live architecture against best practices, with tradeoffs explained.

*Focus: ☁️ Cloud · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An advisory assistant fed with your architecture docs, diagrams, IaC, and live cloud state (read-only). It produces structured assessments per pillar, answers design questions in chat, and drafts improvement roadmaps. Positioned as the always-available first reviewer before human architecture councils.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Docs · diagrams · IaC · live state ingest          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Pillar-by-pillar assessment                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← evidence-based
┌────────────────────────────────────────────────────┐
│ Chat tradeoff exploration                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Prioritized improvement roadmap                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human architecture review                          │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Context ingester | docs, diagrams-as-code, IaC, and cloud topology snapshots |
| Assessment engine | LLM with pillar frameworks + org-specific standards |
| Chat advisor | grounded Q&A interface |
| Roadmap publisher | findings → trackable items in the team's tracker |

## 4. Data Flow

1. The advisor ingests the current architecture sources.
2. Assessments compare design and reality against frameworks and org standards.
3. Engineers explore tradeoffs in chat with cited evidence.
4. A prioritized roadmap lands in the tracker for human review.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "assessment_id": "arch-review-checkout-v2",
  "system_name": "Global Checkout Platform",
  "cloud_provider": "AWS",
  "pillar_scores": {
    "security": 92,
    "reliability": 62,
    "performance_efficiency": 78,
    "cost_optimization": 70,
    "operational_excellence": 85
  },
  "critical_architectural_gaps": [
    {
      "pillar": "Reliability",
      "finding": "Single-AZ RDS Database Cluster",
      "severity": "HIGH",
      "design_vs_reality_drift": "Architecture RFC 08 specified Multi-AZ deployment; deployed Terraform state shows Multi-AZ set to false in us-east-1a.",
      "failure_mode_analysis": "An Availability Zone outage in us-east-1a will cause complete checkout processing failure with estimated RTO > 3 hours.",
      "architectural_tradeoff": "Enabling Multi-AZ increases RDS database spend by $840/month but reduces failover RTO from 3 hours to 90 seconds."
    }
  ],
  "improvement_roadmap": [
    {
      "phase": 1,
      "milestone": "Resilience Hardening",
      "actions": [
        "Enable RDS Multi-AZ failover via Terraform PR #341",
        "Configure cross-zone load balancing on internal ALB"
      ],
      "target_quarter": "Q4-2026"
    }
  ]
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `architecture docs and diagrams`
* `IaC definitions`
* `live resource topology`
* `org standards`
* `past incident postmortems`
* `Well-Architected frameworks`

## 8. Human-in-the-Loop & Approval

Advisory only. Architecture decisions stay with humans; the advisor informs the conversation.

## 9. Security Considerations

* Architecture docs may name sensitive systems: keep assessments within approved providers or local models.
* Assessments are advisory; don't let scores become mindless compliance theater.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [24 · AI Infrastructure Documentation Generator](../../24-ai-infrastructure-documentation-generator/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../../26-ai-cloud-cost-analysis-assistant/README.md)
- [05 · AI Incident Investigator](../../05-ai-incident-investigator/README.md)
