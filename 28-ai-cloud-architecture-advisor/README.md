# 28 · AI Cloud Architecture Advisor

> A Well-Architected reviewer on demand: assess designs and live architecture against best practices, with tradeoffs explained.

![Area](https://img.shields.io/badge/Area-Cloud-orange) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☁️ Cloud |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Diagrams-as-code (Mermaid, PlantUML, Structurizr) · Cloud read APIs · Confluence/Notion/ADRs · Jira/Linear |

---

## 📌 Problem

Architecture review depends on scarce senior engineers, and Well-Architected reviews happen rarely — usually after something breaks.

* Designs are reviewed ad hoc, inconsistently, and late.
* The Well-Architected Frameworks are long documents nobody applies systematically.
* Live drift (what's deployed vs. what was designed) is invisible to reviewers.
* Tradeoff discussions (cost vs. resilience, consistency vs. latency) need a thinking partner more than a rulebook.

**Why it matters:** Earlier, more consistent architecture feedback prevents expensive rework and outages born in design docs.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Design assessment | reviews architecture docs/diagrams against Well-Architected pillars with concrete, prioritized gaps |
| Live-arch reality check | compares intended design to deployed state via read-only APIs |
| Tradeoff exploration | discusses options (multi-region? queue vs. sync?) with cost/complexity/risk framing |
| Improvement roadmap | turns findings into a sequenced improvement plan with effort estimates |

## 💡 Proposed Solution

An advisory assistant fed with your architecture docs, diagrams, IaC, and live cloud state (read-only). It produces structured assessments per pillar, answers design questions in chat, and drafts improvement roadmaps. Positioned as the always-available first reviewer before human architecture councils.

### Workflow

1. **Ingest** — architecture docs, diagrams (as code), IaC, and live resource topology
2. **Assess** — LLM evaluation against pillar checklists with evidence from the actual setup
3. **Discuss** — chat Q&A for design tradeoffs grounded in the ingested context
4. **Recommend** — prioritized roadmap: finding, why it matters, suggested change, effort

**Human-in-the-loop:** Advisory only. Architecture decisions stay with humans; the advisor informs the conversation.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Docs · diagrams · IaC · live state ingest          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Pillar-by-pillar assessment                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← evidence-based
┌────────────────────────────────────────────────────┐
│ Chat tradeoff exploration                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Prioritized improvement roadmap                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human architecture review                          │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Diagrams-as-code (Mermaid, PlantUML, Structurizr) | design sources |
| Cloud read APIs | deployed-state reality check |
| Confluence/Notion/ADRs | architecture knowledge base |
| Jira/Linear | roadmap items |

## 📥 Context & Data Sources

* `architecture docs and diagrams`
* `IaC definitions`
* `live resource topology`
* `org standards`
* `past incident postmortems`
* `Well-Architected frameworks`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Cloud read APIs
* Docs/wiki search

## ✅ Expected Benefits

* Consistent early feedback on every significant design.
* Design-vs-reality drift made visible.
* Senior-engineer patterns scaled to every team.

## 🔒 Safety & Guardrails

* Architecture docs may name sensitive systems: keep assessments within approved providers or local models.
* Assessments are advisory; don't let scores become mindless compliance theater.

## 🚀 Future Implementation

* Scenario testing: 'what happens to this design if the region fails?' reasoning over the topology.
* Cost modeling integration for design options.

## 🔗 Related Ideas

- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
