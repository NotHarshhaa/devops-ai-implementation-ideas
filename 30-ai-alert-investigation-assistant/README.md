# 30 · AI Alert Investigation Assistant

> Every alert arrives pre-investigated: enriched with metrics, logs, recent changes, runbooks, and a first hypothesis before a human looks.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Prometheus / Alertmanager · PagerDuty / Opsgenie · Grafana / Loki · GitHub / deploy records |

---

## 📌 Problem

Alerts page humans with a symptom and nothing else; the first 10 minutes of every page are mechanical enrichment that an agent could have finished before the phone buzzed.

* Alerts lack context: what's normal, what changed, what to check first.
* Runbooks exist but aren't linked, or don't match the actual alert.
* Duplicate/related alerts fire simultaneously, multiplying noise.
* Alert quality decays because feedback about useless alerts has no channel.

**Why it matters:** Pre-investigated alerts cut time-to-engagement dramatically and filter the noise that burns out on-call engineers.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Auto-enrichment | attaches relevant dashboards, top queries, log patterns, deploys, and linked tickets to each alert |
| First hypothesis | a ranked 'likely causes' list with suggested first checks |
| Correlation | groups related alerts firing together into one incident view |
| Runbook matching | retrieves the best-matching runbook and highlights the relevant section |

## 💡 Proposed Solution

An enrichment stage between Alertmanager/PagerDuty and humans: on alert, an agent runs a bounded investigation (30-60 seconds of tool calls over metrics/logs/deploys) and appends a structured context card to the page and incident thread. Feedback buttons tune future quality.

### Workflow

1. **Trigger** — alert webhook from Alertmanager/PagerDuty/monitoring SaaS
2. **Bound** — identify service, dashboard set, and check list from the alert and catalog
3. **Enrich** — parallel reads: metric snapshots, log patterns, recent deploys, similar past alerts
4. **Hypothesize** — ranked causes + first checks + runbook excerpt
5. **Deliver** — context card on the page/Slack thread; dedupe/correlate siblings
6. **Learn** — human feedback (useful/noise) tracked per alert rule

**Human-in-the-loop:** Enrichment only — the page still goes out. The agent never resolves, silences, or escalates alerts autonomously.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Alert webhook                                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Service resolution (catalog · labels)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Bounded investigation (metrics · logs · deploys)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← 30-60s budget
┌────────────────────────────────────────────────────┐
│ Context card + first hypothesis                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Page + thread (correlated)                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Prometheus / Alertmanager | alert source |
| PagerDuty / Opsgenie | page enrichment |
| Grafana / Loki | evidence via MCP |
| GitHub / deploy records | change correlation |
| Slack | incident threads |

## 📥 Context & Data Sources

* `alert payload and labels`
* `metric snapshots around the window`
* `log patterns`
* `recent deploys and config changes`
* `similar past alerts and resolutions`
* `runbook corpus`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Alertmanager & PagerDuty Webhook API
* Grafana MCP (Prometheus metrics & Loki logs read)
* VCS & CI/CD Deployment History API
* Runbook Knowledge Base (Vector RAG)

## ✅ Expected Benefits

* Responders start with a briefing, not a symptom.
* Noise groups up instead of stacking up.
* Alert-rule quality finally gets a feedback loop.

## 🔒 Safety & Guardrails

* Strict time and call budget per alert to control cost and runaway loops.
* Enrichment is read-only; silence/resolve actions stay human.
* Sensitive environments can be excluded or routed to local models.

## 🚀 Future Implementation

* Auto-triage classes: known-safe alerts get de-prioritized summaries instead of pages (with policy).
* Alert-rule doctor: weekly report of noisy rules with suggested fixes.

## 🔗 Related Ideas

- [04 · AI Log Analyzer](../04-ai-log-analyzer/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [35 · AI Anomaly Investigation Agent](../35-ai-anomaly-investigation-agent/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
