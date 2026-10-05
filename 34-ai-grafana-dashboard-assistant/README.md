# 34 · AI Grafana Dashboard Assistant

> Generate, clean up, and standardize Grafana dashboards from a description — consistent with your org's panel conventions.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Grafana · mcp-grafana · Dashboard-as-code (Jsonnet/Terraform provider) · Prometheus/loki datasources |

---

## 📌 Problem

Dashboard creation is high-effort and low-standard: every engineer's dashboards look different, duplicate, and rot.

* Building a good dashboard takes an hour of panel fiddling most people skip.
* No consistency: same service, five dashboards, none complete.
* Old dashboards accumulate with broken queries and no owner.
* Incident reviews reveal missing views, but nobody circles back to build them.

**Why it matters:** Standard, complete dashboards per service make every investigation faster and onboarding dramatically easier.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Dashboard generation | service-focused dashboard from a description plus metric discovery: golden signals, saturation, dependencies |
| Convention enforcement | org panel templates, naming, and variables applied automatically |
| Cleanup analysis | finds unused/broken/duplicate dashboards and proposes consolidation |
| Incident-driven additions | after an incident, drafts the panels the responders wished existed |

## 💡 Proposed Solution

A dashboard assistant operating via the Grafana API: generate new dashboards from natural language + metadata discovery, refactor existing ones to conventions, and report hygiene issues. All writes go through a review PR (exported JSON) or Grafana folder permissions — humans approve before dashboards land.

### Workflow

1. **Describe** — service and purpose; assistant discovers available metrics
2. **Generate** — draft dashboard with golden signals and conventions
3. **Review** — human previews; iterate in chat
4. **Publish** — via API (with folder permissions) or dashboard-as-code PR
5. **Maintain** — hygiene reports: broken queries, unused panels, duplicates

**Human-in-the-loop:** Generation is interactive; publishing requires explicit approval. Hygiene suggestions are reports, not deletions.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Service description + metric discovery             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Draft dashboard (golden signals)                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat iteration + preview                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Approved publish (API · PR)                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hygiene report (unused · broken)                   │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Grafana | API for folders, dashboards, permissions |
| mcp-grafana | build-on tooling |
| Dashboard-as-code (Jsonnet/Terraform provider) | PR-based publishing |
| Prometheus/loki datasources | query grounding |

## 📥 Context & Data Sources

* `available metrics per service`
* `org dashboard conventions`
* `existing dashboards`
* `SLO definitions`
* `incident learnings`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Grafana REST API (dashboard, folder, datasource management)
* Grafana MCP Server
* Datasource Query APIs (Prometheus / Loki read)
* Dashboard-as-Code Repo (Jsonnet / Terraform provider PR)

## ✅ Expected Benefits

* Good dashboards become cheap; coverage gaps close.
* Consistency across teams; hygiene debt gets managed.
* Incident learnings convert into permanent views.

## 🔒 Safety & Guardrails

* Dashboards can expose business metrics: respect Grafana permissions and folder scoping.
* Prevent query-heavy dashboards from hammering datasources (row limits, time bounds).

## 🚀 Future Implementation

* Auto-layout from traces: propose panels from actual request paths.
* Dashboard diffs on PR for dashboard-as-code shops.

## 🔗 Related Ideas

- [33 · AI Prometheus Query Generator](../33-ai-prometheus-query-generator/README.md)
- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
