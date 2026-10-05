# 05 · AI Incident Investigator

> An agentic first responder: given an incident or alert, it pulls metrics, logs, traces, deploys, and tickets to build a live timeline and root-cause hypothesis.

![Area](https://img.shields.io/badge/Area-SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 🚨 SRE |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | PagerDuty / Opsgenie · Grafana / Prometheus / Loki · GitHub / GitLab · AWS / Azure / GCP |

---

## 📌 Problem

The first 15 minutes of an incident are lost to mechanical work: finding dashboards, correlating deploy times, checking what changed, and herding context into the incident channel.

* Investigation requires jumping across monitoring, logs, deploys, feature flags, status pages, and ticketing — each with its own UI and access pattern.
* Institutional knowledge (which service breaks when X happens) is in people's heads, not available during the incident.
* Timelines are reconstructed after the fact from memory, losing key details.
* Multiple responders duplicate the same checks because no one has a shared, up-to-date picture.

**Why it matters:** Mean-time-to-mitigation is dominated by investigation overhead; an agent that pre-assembles 80% of the context lets responders spend their time on judgment calls.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Automated evidence gathering | fan-out queries across metrics, logs, traces, deploys, flags, and tickets the moment an incident opens |
| Change correlation | 'what changed?' analysis: deploys, config changes, flag flips, and traffic shifts aligned to the incident start |
| Timeline construction | a living, timestamped timeline assembled from real events, maintained as the incident evolves |
| Hypothesis ranking | candidate root causes ranked by evidence, each with a disconfirming check the responder can run |
| Tool orchestration | reads (and optionally safe writes) across systems through audited MCP tools |

## 💡 Proposed Solution

An incident-investigation agent is invoked when an incident is declared (PagerDuty/Opsgenie webhook or Slack `/investigate`). It plans an investigation, gathers evidence through MCP servers for Grafana/Prometheus, Loki, GitHub, cloud APIs, and the incident platform, correlates changes, and streams a structured situation report into the incident channel: timeline, affected services, ranked hypotheses, and suggested next actions. Responders can direct it conversationally ('check EU traffic', 'compare to last week').

### Workflow

1. **Declare** — incident webhook or manual invocation with the alert/incident ID
2. **Plan** — the agent drafts an investigation plan from the alert and service topology
3. **Gather** — parallel MCP tool calls: dashboards/metrics, logs, traces, recent deploys, flags, similar past incidents
4. **Correlate** — align changes and signals onto a common timeline; identify blast radius from dependency graph
5. **Report** — stream a situation report: impact, timeline, ranked hypotheses, next steps
6. **Assist** — respond to follow-up questions; run additional checks; keep the timeline updated
7. **Hand off** — on resolution, package evidence for the postmortem generator

**Human-in-the-loop:** The investigator is read-only by default. Any state-changing action (restart, rollback, flag flip) is only suggested as a pre-filled command or requires an explicit approval interaction; fully-supervised runbook execution is a later phase.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

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

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| PagerDuty / Opsgenie | incident webhooks and acknowledgment status |
| Grafana / Prometheus / Loki | metrics and logs via mcp-grafana |
| GitHub / GitLab | recent merges, deploys, and runbook lookup via MCP |
| AWS / Azure / GCP | service health, quotas, network checks via cloud MCP servers |
| Slack / Teams | incident channel integration |
| Backstage / service catalog | ownership and dependency graph |

## 📥 Context & Data Sources

* `alert payload and history`
* `service topology and owners`
* `metrics + logs + traces around the window`
* `recent deploys, config and flag changes`
* `similar past incidents`
* `open tickets`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* mcp-grafana (dashboards, PromQL, LogQL)
* GitHub MCP (deploys, runbooks)
* Cloud MCP servers (health, quotas)
* Incident platform MCP (timeline, stakeholders)

## ✅ Expected Benefits

* Investigation overhead drops from a human-hour to seconds of agent fan-out at incident open.
* One shared, factual picture in the channel — less duplicated checking, faster mitigation decisions.
* 'What changed?' answered automatically, which resolves a large share of incidents immediately.
* Postmortems start from a real timeline instead of reconstructed memory.

## 🔒 Safety & Guardrails

* Least privilege per tool: read-only Grafana viewer, read-only GitHub, scoped cloud 'describe-only' roles.
* Every tool call is logged with parameters and results in the AI observability platform for audit.
* Prompt-injection surface is real (log lines, ticket text can contain instructions): treat all tool output as data, validate actions against allowlists, and require human confirmation for anything mutating.
* Incident channels are sensitive; choose the model deployment (cloud vs. self-hosted) per compliance requirement.

## 🚀 Future Implementation

* Supervised runbook execution: pre-approved mitigations executable from the thread after a two-person approval.
* Automatic stakeholder updates (exec summary every 15 min) via the incident summarizer (idea 31).
* Federated investigators: one agent per domain (k8s, cloud, app) coordinated by a lead agent.
* Confidence-calibrated hypothesis tracking: measure how often rank-1 hypothesis was the actual cause.

## 🔗 Related Ideas

- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
- [31 · AI Incident Summarizer](../31-ai-incident-summarizer/README.md)
- [50 · AI On-Call Copilot](../50-ai-on-call-copilot/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
