# 47 · AI Internal Developer Platform Assistant

> Give your IDP a conversational front door: create services, find owners, understand scorecards, and troubleshoot platform issues by asking.

![Area](https://img.shields.io/badge/Area-Platform%20Engineering-blueviolet) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 🏢 Platform Engineering |
| **Complexity to prototype** | Medium |
| **Automation level** | Supervised automation |
| **Primary integrations** | Backstage · Slack / Teams · CI/CD and cloud accounts · Port / Humanitec / OpsLevel |

---

## 📌 Problem

Internal developer platforms fail not on capability but on discoverability: developers don't know what exists, how to use it, or why their scorecard is red.

* Platform capability is spread across Backstage, docs, templates, and Slack — none searchable by intent.
* Self-service flows (scaffold a service, add a resource) have UI friction and require platform vocabulary.
* Scorecards and goldengate requirements are opaque ('what does 'production readiness' even require?').
* Platform teams drown in repetitive questions.

**Why it matters:** A conversational layer measurably increases platform adoption and cuts the question load on the platform team — the two metrics IDPs live by.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Intent-based self-service | 'create a service with a Postgres and a queue' → scaffolder flow with the right template and defaults |
| Catalog Q&A | ownership, dependencies, SLOs, scorecards answered from the software catalog with citations |
| Platform troubleshooting | why did my scaffold fail / why is my scorecard red — with explanations and fixes |
| Guided onboarding | role-aware introduction to the platform's capabilities |

## 💡 Proposed Solution

A platform assistant wired into Backstage (and Slack): it answers catalog questions via retrieval over the catalog and docs, drives scaffolder templates conversationally (still generating the same reviewable PRs), and explains platform policies. Tools are Backstage-API-backed MCP tools with scoped permissions.

### Workflow

1. **Ask** — developer asks in Backstage or Slack
2. **Resolve** — retrieval over catalog, templates, docs, scorecards
3. **Act** — for self-service intents, drive scaffolder/API flows (producing normal PRs)
4. **Explain** — answers with citations and links into the IDP UI
5. **Measure** — deflected questions and adoption analytics for the platform team

**Human-in-the-loop:** Self-service actions produce the same reviewable artifacts as the UI (PRs, catalog entries); the assistant doesn't bypass any platform governance.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Developer question (Backstage · Slack)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Catalog + docs retrieval                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Self-service action (scaffold · request)           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← same PRs as UI
┌────────────────────────────────────────────────────┐
│ Cited answers + IDP links                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Adoption + deflection analytics                    │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Backstage | catalog, scaffolder, TechDocs, scorecards |
| Slack / Teams | chat surface |
| CI/CD and cloud accounts | the resources scaffolder creates |
| Port / Humanitec / OpsLevel | alternative IDP backends |

## 📥 Context & Data Sources

* `software catalog entities`
* `templates and docs`
* `scorecard rules`
* `platform policies`
* `org terminology`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Backstage REST API & Scaffolder MCP (catalog read, template parameterization)
* Software Scorecard & Production Readiness API
* TechDocs Vector Search API
* Slack / Teams Interactive Assistant Bot

## ✅ Expected Benefits

* Higher platform adoption; lower question load.
* Self-service without governance bypass.
* Analytics reveal what to document or simplify next.

## 🔒 Safety & Guardrails

* Assistant inherits user permissions (no privilege escalation through the chat layer).
* Scaffold actions are the same governed flows as the UI — no side doors.
* Catalog metadata is org-sensitive: retrieval respects existing access controls.

## 🚀 Future Implementation

* Scorecard coach: guided remediation plans for failing checks.
* Proactive nudges: 'your service's dependency is unmaintained — here's the migration path'.

## 🔗 Related Ideas

- [48 · AI Golden Path Generator](../48-ai-golden-path-generator/README.md)
- [49 · AI Service Catalog Assistant](../49-ai-service-catalog-assistant/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
