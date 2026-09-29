# 26 · AI Cloud Cost Analysis Assistant

> Explain your cloud bill: what changed, why it changed, who owns it, and what to do about it — in plain language.

![Area](https://img.shields.io/badge/Area-Cloud-orange) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☁️ Cloud |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | AWS CUR · Azure Cost Management · GCP Billing export · Warehouse (Athena / BigQuery / Snowflake) · OpenCost / Kubecost · Deploy records / Git |

---

## 📌 Problem

Cloud cost reports tell you what was spent, not why. Anomalies arrive as '$12k up in us-east-1' with no story attached.

* Billing data (CUR/exports) is opaque: cost by service/region/tag, but not by cause.
* Anomalies (a forgotten load test, a log shipment mistake, an auto-scaling loop) are found weeks later.
* Savings recommendations (rightsizing, savings plans, storage tiers) exist but aren't prioritized against engineering effort.
* Cost ownership by team is fuzzy without tagging discipline.

**Why it matters:** Proactive cost explanation turns FinOps from a monthly surprise into a daily conversation with clear actions.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Anomaly explanation | drills from cost spike → service → resource → cause (deploy, config, usage pattern) |
| Forecast reasoning | explains trajectory vs. budget with the drivers called out |
| Recommendation prioritization | ranks savings actions by value/effort, with the exact IaC or config change |
| Owner attribution | maps spend to teams/services via tags, catalog, and usage metadata |

## 💡 Proposed Solution

A cost-analysis service on top of billing exports plus usage metrics: scheduled anomaly detection flags changes, the LLM investigates likely causes (correlating deploys, config changes, usage patterns), and posts an explained digest per team with prioritized actions. Chat mode answers 'why did our bill go up?' interactively.

### Workflow

1. **Ingest** — daily CUR/billing export + usage metrics into the warehouse
2. **Detect** — statistical anomaly detection per service/team/region
3. **Investigate** — LLM correlates anomalies with deploys, config changes, and usage shifts
4. **Explain** — per-team digest: what changed, why, owner, recommended action with effort estimate
5. **Answer** — chat follow-ups drilling into any line item

**Human-in-the-loop:** Read-only analysis; recommendations are actions for engineering teams, not automated changes.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Billing export + usage metrics                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Anomaly detection (service · team · region)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Cause correlation (deploys · config · usage)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explained digest per team                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat drill-down ('why the increase?')              │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| AWS CUR · Azure Cost Management · GCP Billing export | data sources |
| Warehouse (Athena / BigQuery / Snowflake) | query layer |
| OpenCost / Kubecost | Kubernetes cost attribution |
| Deploy records / Git | cause correlation |
| Slack | digests and chat |

## 📥 Context & Data Sources

* `billing line items`
* `usage metrics`
* `deploy and config-change timeline`
* `tagging/catalog ownership`
* `savings-plan/RI coverage`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Warehouse queries (read)
* Deploy history lookup

## ✅ Expected Benefits

* Cost anomalies explained in days, not month-end.
* Savings actions arrive prioritized with concrete change suggestions.
* Team-level cost literacy via explained digests.

## 🔒 Safety & Guardrails

* Billing data is sensitive: warehouse-level access control; model calls receive aggregates, not raw account detail.
* Avoid tagging PII into cost metadata.

## 🚀 Future Implementation

* Policy integration: proposed savings become reviewable IaC PRs automatically.
* Unit economics: cost per request/customer for product teams.

## 🔗 Related Ideas

- [15 · AI Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [08 · AI Deployment Risk Analyzer](../08-ai-deployment-risk-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
