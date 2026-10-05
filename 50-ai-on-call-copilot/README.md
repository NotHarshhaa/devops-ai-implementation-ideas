# 50 · AI On-Call Copilot

> The capstone: a copilot that rides along with the on-call engineer — investigating alerts, drafting mitigations, executing pre-approved runbooks, and keeping everyone informed.

![Area](https://img.shields.io/badge/Area-Agentic%20DevOps-black) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 🤖 Agentic DevOps |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | PagerDuty / Opsgenie · kubernetes + cloud MCP servers · mcp-grafana / Loki / traces · GitHub MCP |

---

## 📌 Problem

On-call engineers face the union of every problem in this catalog at 3am, alone, with context evaporating. The capstone idea ties the pieces into a single copilot that acts as their junior teammate.

* Every alert requires the same scramble: dashboards, logs, deploys, runbooks, history — while the clock runs.
* Knowledge (what worked last time) is locked in people's heads and past postmortems.
* Routine mitigations are safe but must be executed manually under stress.
* Communication overhead (updates, escalations) competes with diagnosis.

**Why it matters:** An on-call copilot compounds every other idea in this catalog into one interface — this is where agentic DevOps becomes a daily reality.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Alert ride-along | for each page: pre-investigated context (idea 30), timeline, hypotheses, runbook suggestions |
| Conversational investigation | natural-language follow-ups driving the same tool belt as ideas 02/05/25 |
| Supervised mitigation | pre-approved runbook steps executable after explicit confirmation, fully audited |
| Comms autopilot (drafts) | stakeholder updates via the incident summarizer pattern (idea 31) |
| Shift handover | structured handoff briefings from the shift's actual events |

## 💡 Proposed Solution

A copilot service that unifies the catalog's building blocks behind one chat/CLI surface: an agent runtime with an MCP tool belt across Kubernetes, cloud, observability, GitHub, and incident tooling; a policy engine separating read (free), write (confirm), and pre-approved runbook (fast-confirm) actions; and memory linking alerts → investigations → outcomes. Built on LangGraph or a kagent-style control plane, with every model and tool call observable.

### Workflow

1. **Page received** — copilot attaches to the alert thread with pre-investigated context
2. **Investigate together** — engineer directs; copilot executes read-only tool calls and reports
3. **Mitigate** — copilot proposes actions; pre-approved runbooks confirm-fast, everything else waits for explicit approval
4. **Communicate** — drafted updates flow to stakeholders on the summarizer pattern
5. **Hand over / resolve** — structured handoff or resolution record feeding postmortems (idea 36)
6. **Learn** — each engagement's outcome tunes runbooks, priors, and evals

**Human-in-the-loop:** The defining design constraint: read is free, write is confirmed, runbooks are pre-approved per-step by their owners. The copilot is a junior teammate with a fast, auditable approval loop — never an autonomous operator.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Page → copilot attaches + pre-investigates         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Conversational investigation                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP tool belt
┌────────────────────────────────────────────────────┐
│ Mitigation proposal (confirm · fast-confirm)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← policy engine
┌────────────────────────────────────────────────────┐
│ Stakeholder update drafts                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Handover / resolution record                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Outcome → runbook + eval tuning                    │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| PagerDuty / Opsgenie | paging and escalation |
| kubernetes + cloud MCP servers | investigation and gated action |
| mcp-grafana / Loki / traces | observability evidence |
| GitHub MCP | revert PRs, runbook repos |
| Slack / Teams | primary interaction surface |
| Vault / secret managers | credential brokering for tools |

## 📥 Context & Data Sources

* `alert and incident context`
* `service topology and runbooks`
* `metrics/logs/traces`
* `past engagements and postmortems`
* `approval policies per service`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Read tier: k8s, cloud, observability, GitHub (always available)
* Write tier: gated by per-action approval
* Runbook tier: pre-approved steps with fast confirm

## ✅ Expected Benefits

* One interface instead of seven consoles during every page.
* Institutional memory available at 3am, not just in retrospect.
* Safe automation lane for routine mitigations with full auditability.
* Compounding value: each catalog idea it consumes makes it better.

## 🔒 Safety & Guardrails

* Tiered permissions are the core design: no blanket credentials, per-tool scoping, deny-by-default writes.
* Every action (model call, tool call, approval, execution) is immutably logged — the audit trail is the product.
* Prompt-injection defense: treat all telemetry as data; schema-validated action plans; allowlisted runbooks only.
* Break-glass path documented and drilled: what happens if the copilot is down or wrong.
* Sensitive services can require two-person approval even for runbook tiers.

## 🚀 Future Implementation

* Multi-agent mode: domain investigators (k8s, cloud, app) coordinated by the copilot.
* Autonomy graduation: promote runbook steps to auto-execution only with measured reliability and owner consent.
* Shift analytics: what consumed on-call time, what the copilot saved, where runbooks are missing.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [31 · AI Incident Summarizer](../31-ai-incident-summarizer/README.md)
- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
