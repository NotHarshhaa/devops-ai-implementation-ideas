# 35 · AI Anomaly Investigation Agent

> When something looks off but no alert fired, the agent notices first: investigates the anomaly, explains it, and files it if it matters.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | Prometheus / Grafana ML / Elastic ML · Loki / traces · GitHub / deploy records · Jira |

---

## 📌 Problem

Alerts catch known failure modes; the weird stuff — slow degradations, shifting distributions, silent partial failures — floats between dashboards until a human notices or a customer does.

* Threshold alerts miss novel and slow-onset problems.
* Anomaly detectors produce leads, not explanations; investigating each is costly.
* Minor anomalies are common; humans must judge which matter, and usually have no time.
* Seasonality confuses both humans and naive detectors.

**Why it matters:** Catching degradations before alert thresholds (or customers) do is the difference between a ticket and an incident.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Anomaly detection triage | takes detector outputs (or runs its own) and judges significance using context, seasonality, and impact |
| Automated investigation | for each significant anomaly: correlated signals, affected segments, first occurrence, related changes |
| Explanation writing | anomaly report: what deviates, since when, who's affected, likely cause, recommended action |
| Feedback learning | human dispositions (real/noise/known) tune future triage |

## 💡 Proposed Solution

A continuous agent fed by anomaly detectors (Prometheus-based, Elastic/ADR-style ML) and metric scans: it investigates flagged anomalies within a bounded budget, writes a short report, and posts significant ones to the right team. The expensive part (investigation) is automated; the judgment stays with humans.

### Workflow

1. **Detect** — consume detector outputs and scheduled metric scans
2. **Triage** — contextual significance: seasonality, scope, impact, novelty
3. **Investigate** — bounded tool-use: related metrics, logs, segments, changes
4. **Report** — explained anomaly card with recommendation; file or notify per policy
5. **Learn** — human dispositions feed back into triage thresholds

**Human-in-the-loop:** The agent files reports; humans decide on action. Escalation to pages requires policy changes, not agent discretion.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

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

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Prometheus / Grafana ML / Elastic ML | detector sources |
| Loki / traces | investigation evidence |
| GitHub / deploy records | change correlation |
| Jira | finding filing |
| Slack | reports |

## 📥 Context & Data Sources

* `anomaly signal and history`
* `seasonality baselines`
* `correlated metrics/logs`
* `recent changes`
* `past anomaly dispositions`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* mcp-grafana (read)
* Deploy history (read)
* Ticketing (file)

## ✅ Expected Benefits

* Silent failures surface before they page anyone.
* Detector noise gets explained instead of ignored.
* Investigation toil drops; humans keep judgment.

## 🔒 Safety & Guardrails

* Hard budgets on investigation frequency/cost to avoid a self-inflicted observability bill.
* Findings routed by ownership rules; no broadcast of sensitive anomalies to broad channels.

## 🚀 Future Implementation

* Proactive SLO drift watch: flag slow error-budget erosion trends.
* Cross-service anomaly graphs: upstream cause identification.

## 🔗 Related Ideas

- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
