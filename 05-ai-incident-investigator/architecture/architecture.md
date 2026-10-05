# AI Incident Investigator — Architecture

> An agentic first responder: given an incident or alert, it pulls metrics, logs, traces, deploys, and tickets to build a live timeline and root-cause hypothesis.

*Focus: 🚨 SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

An incident-investigation agent is invoked when an incident is declared (PagerDuty/Opsgenie webhook or Slack `/investigate`). It plans an investigation, gathers evidence through MCP servers for Grafana/Prometheus, Loki, GitHub, cloud APIs, and the incident platform, correlates changes, and streams a structured situation report into the incident channel: timeline, affected services, ranked hypotheses, and suggested next actions. Responders can direct it conversationally ('check EU traffic', 'compare to last week').

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Incident declared / alert page                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Investigation planner                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ MCP tool fan-out (metrics · logs · deploys)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-only scope
┌────────────────────────────────────────────────────┐
│ Change correlation + blast radius                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Situation report + ranked hypotheses               │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← streamed to chat
┌────────────────────────────────────────────────────┐
│ Responders direct · agent verifies                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Evidence package → postmortem                      │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Incident trigger | PagerDuty/Opsgenie/FireHydrant webhooks plus a Slack slash command |
| Agent orchestrator | LangGraph/Microsoft Agent Framework graph with planner, gatherer, and correlator roles |
| MCP tool belt | Grafana MCP, GitHub MCP, cloud MCP servers, incident platform MCP — each with scoped credentials |
| Topology store | service catalog and dependency graph for blast-radius reasoning |
| Timeline builder | normalizes events from all sources into one chronological stream |
| Similar-incident retrieval | vector search over past incident reports and resolutions |
| Chat presenter | streams updates into a dedicated incident channel thread |
| Evidence packager | hands a structured bundle to the postmortem generator (idea 36) |

## 4. Data Flow

1. Incident declaration triggers the agent with the alert payload and affected service.
2. The planner selects checks based on service topology and the alert type.
3. Parallel read-only tool calls collect metrics snapshots, log patterns, trace samples, deploys, and flag changes around the window.
4. The correlator aligns everything on one timeline and proposes ranked hypotheses with confidence and disconfirming checks.
5. A situation report streams into the incident thread; responders ask follow-ups which trigger further tool calls.
6. At resolution the evidence bundle is archived and linked to the ticket.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "incident_id": "INC-2041",
  "status": "investigating",
  "impact_summary": "Elevated 5xx error rate (8.4%) on checkout API affecting EU region",
  "timeline": [
    { "timestamp": "14:02 UTC", "event": "Deploy checkout-v2.14.0 merged by @alice" },
    { "timestamp": "14:07 UTC", "event": "Error rate alert fired in #incident-2041" },
    { "timestamp": "14:08 UTC", "event": "Feature flag 'enable-v2-stripe' turned on" }
  ],
  "ranked_hypotheses": [
    {
      "rank": 1,
      "hypothesis": "Feature flag 'enable-v2-stripe' activated invalid webhook secret causing signature failures",
      "confidence": 0.91,
      "disconfirming_check": "Inspect stripe webhook logs for signature verification failures"
    }
  ],
  "suggested_mitigation": {
    "immediate_action": "Toggle flag 'enable-v2-stripe' to OFF in LaunchDarkly EU environment",
    "rollback_needed": false
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `alert payload and history`
* `service topology and owners`
* `metrics + logs + traces around the window`
* `recent deploys, config and flag changes`
* `similar past incidents`
* `open tickets`

## 8. Human-in-the-Loop & Approval

The investigator is read-only by default. Any state-changing action (restart, rollback, flag flip) is only suggested as a pre-filled command or requires an explicit approval interaction; fully-supervised runbook execution is a later phase.

## 9. Security Considerations

* Least privilege per tool: read-only Grafana viewer, read-only GitHub, scoped cloud 'describe-only' roles.
* Every tool call is logged with parameters and results in the AI observability platform for audit.
* Prompt-injection surface is real (log lines, ticket text can contain instructions): treat all tool output as data, validate actions against allowlists, and require human confirmation for anything mutating.
* Incident channels are sensitive; choose the model deployment (cloud vs. self-hosted) per compliance requirement.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

A resident service with an agent runtime and MCP gateway, deployed near your observability stack. Statelessness is limited (timelines, sessions); use a small durable store. Horizontal scaling is trivial since investigations are independent.

## 12. Cost Considerations

Incidents are rare relative to CI/CD events, so volume is low, but each investigation is deep (20-50 tool calls). Frontier models earn their cost here; hybrid routing keeps chat follow-ups on cheaper tiers. Expect single-digit dollars per major incident — trivial next to downtime cost.

## 13. Related Ideas

- [36 · AI Postmortem Generator](../../36-ai-postmortem-generator/README.md)
- [31 · AI Incident Summarizer](../../31-ai-incident-summarizer/README.md)
- [50 · AI On-Call Copilot](../../50-ai-on-call-copilot/README.md)
- [02 · AI Kubernetes Troubleshooter](../../02-ai-kubernetes-troubleshooter/README.md)
