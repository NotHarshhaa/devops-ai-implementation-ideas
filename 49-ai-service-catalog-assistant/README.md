# 49 · AI Service Catalog Assistant

> Keep the service catalog true: auto-enrich entities, detect ownership gaps and drift, and answer 'who owns X?' instantly.

![Area](https://img.shields.io/badge/Area-Platform%20Engineering-blueviolet) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏢 Platform Engineering |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Backstage / OpsLevel / Port · GitHub / GitLab activity · PagerDuty / Opsgenie · Cloud tags / IaC |

---

## 📌 Problem

Service catalogs (Backstage, OpsLevel, Port) decay immediately: ownership stale after reorgs, metadata missing, dependencies unrecorded — and then nobody trusts or uses the catalog.

* Ownership goes stale after reorgs; 'who owns this?' returns folklore.
* Metadata (SLOs, runbooks, on-call, dependencies) is incomplete and unverified.
* New services appear untracked (shadow catalog in spreadsheets).
* Incident response depends on catalog data that's quietly wrong.

**Why it matters:** A trustworthy catalog underpins incidents, security, cost, and compliance — it's the platform's source of truth, or it's nothing.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Enrichment | infers missing metadata from repos, CI, cloud tags, and deploy data (with confidence labels) |
| Drift detection | flags stale ownership (git activity vs. recorded owners), orphaned entities, and shadow services |
| Instant Q&A | 'who owns checkout? what's its SLO? who's on-call?' answered with citations |
| Review campaigns | generates targeted confirmation requests per owner instead of org-wide spam |

## 💡 Proposed Solution

A catalog-maintenance service: scheduled analysis compares catalog entities against reality (repos, activity, deploys, cloud), proposes enrichment PRs, and flags drift for owner confirmation. Chat Q&A makes the catalog useful in Slack where people actually ask.

### Workflow

1. **Compare** — catalog entities vs. repo/cloud/deploy reality
2. **Propose** — enrichment PRs and drift flags with confidence and evidence
3. **Confirm** — targeted review requests to actual owners
4. **Answer** — Q&A over the verified catalog
5. **Report** — catalog health score and trends for the platform team

**Human-in-the-loop:** Ownership and critical metadata always require owner confirmation; inferred data is labeled as inferred.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Catalog vs. reality comparison                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Enrichment PRs + drift flags                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← confidence-labeled
┌────────────────────────────────────────────────────┐
│ Owner confirmation campaigns                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat Q&A with citations                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Catalog health reporting                           │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Backstage / OpsLevel / Port | catalog backends |
| GitHub / GitLab activity | ownership evidence |
| PagerDuty / Opsgenie | on-call data |
| Cloud tags / IaC | resource linkage |
| Slack | Q&A surface |

## 📥 Context & Data Sources

* `catalog entities and metadata`
* `repo activity and CODEOWNERS`
* `deploy history`
* `on-call schedules`
* `cloud resource tags`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Service Catalog REST API (Backstage / OpsLevel / Port read & propose)
* VCS Activity & CODEOWNERS Analyzer (GitHub / GitLab MCP)
* On-Call Schedule API (PagerDuty / Opsgenie)
* Cloud Resource Tagging Inventory API

## ✅ Expected Benefits

* A catalog people trust because it's verified against reality.
* Incident, security, and cost tooling get accurate ownership.
* Platform team sees catalog health as a managed metric.

## 🔒 Safety & Guardrails

* Inferred ownership must never auto-replace confirmed owners — confirmation flows are mandatory.
* Catalog Q&A respects existing access permissions.

## 🚀 Future Implementation

* Dependency-graph completion from runtime traffic data.
* Lifecycle advisor: flag likely-deprecated services for sunset review.

## 🔗 Related Ideas

- [47 · AI Internal Developer Platform Assistant](../47-ai-internal-developer-platform-assistant/README.md)
- [48 · AI Golden Path Generator](../48-ai-golden-path-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
