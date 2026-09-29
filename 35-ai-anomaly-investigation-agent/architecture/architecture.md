# AI Anomaly Investigation Agent — Architecture

> When something looks off but no alert fired, the agent notices first: investigates the anomaly, explains it, and files it if it matters.

*Focus: 📊 Observability & SRE · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A continuous agent fed by anomaly detectors (Prometheus-based, Elastic/ADR-style ML) and metric scans: it investigates flagged anomalies within a bounded budget, writes a short report, and posts significant ones to the right team. The expensive part (investigation) is automated; the judgment stays with humans.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Anomaly detectors / metric scans                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Significance triage                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← seasonality · impact
┌────────────────────────────────────────────────────┐
│ Bounded investigation (correlated signals)         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Anomaly report + recommendation                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human disposition → learning loop                  │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Detector bridge | interfaces with anomaly sources |
| Triage engine | context-aware significance scoring |
| Investigator | budgeted agent over observability MCP tools |
| Report publisher | team channels and ticket filing |
| Learning store | dispositions and outcomes |

## 4. Data Flow

1. Detectors flag candidate anomalies continuously.
2. Triage filters using context and seasonality understanding.
3. Significant candidates get a bounded investigation and a written report.
4. Reports reach owning teams; dispositions tune the system.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `anomaly signal and history`
* `seasonality baselines`
* `correlated metrics/logs`
* `recent changes`
* `past anomaly dispositions`

## 7. Human-in-the-Loop & Approval

The agent files reports; humans decide on action. Escalation to pages requires policy changes, not agent discretion.

## 8. Security Considerations

* Hard budgets on investigation frequency/cost to avoid a self-inflicted observability bill.
* Findings routed by ownership rules; no broadcast of sensitive anomalies to broad channels.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)
