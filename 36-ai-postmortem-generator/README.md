# 36 · AI Postmortem Generator

> Draft the postmortem from real evidence — timeline, causal chain, contributing factors, action items — so humans edit instead of excavate.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Incident platform (PagerDuty/FireHydrant/incident.io) · Slack export · Confluence/Notion/Google Docs · Jira/Linear |

---

## 📌 Problem

Postmortems are written days later from memory, so timelines are wrong, causes are simplified, and action items are vague — then nothing changes.

* Evidence (channel scrolls, dashboards, deploys) is scattered and decays fast.
* Writing takes hours, so postmortems are late or shallow.
* Action items lack owners/dates and quietly die.
* Learning doesn't accumulate across postmortems.

**Why it matters:** High-quality, fast postmortems are the engine of organizational learning; automation makes them cheap enough to actually do well.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Timeline assembly | reconstructs the incident timeline from channel logs, alerts, deploys, and metrics (fed by ideas 05/17) |
| Draft composition | summary, impact, causal chain, detection/response evaluation in blameless language |
| Contributing-factor analysis | surfaces systemic factors beyond the trigger (alerting gaps, runbook holes, config debt) |
| Action-item drafting | concrete, owner-ready items with priority based on recurrence data |
| Cross-incident patterns | flags when this incident resembles a past one |

## 💡 Proposed Solution

After incident resolution, the generator assembles the evidence package (from the investigator's bundle), drafts a complete postmortem in the org template, and opens it as a doc PR for human editing. It tracks action items afterward and reports on their status.

### Workflow

1. **Assemble** — collect timeline, comms, metrics, changes, and the investigator's evidence bundle
2. **Draft** — full postmortem per template: summary → impact → timeline → analysis → factors → actions
3. **Review** — doc PR with inline comments; humans correct and deepen
4. **Track** — action items synced to the tracker with owners/dates
5. **Learn** — pattern analysis across the postmortem corpus

**Human-in-the-loop:** Drafts only. Humans own the narrative, the judgment, and the blamelessness review before anything is published.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Incident resolved → evidence package               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Timeline + causal reconstruction                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Draft postmortem (org template)                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc PR · human edits                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Action items tracked · patterns reported           │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Incident platform (PagerDuty/FireHydrant/incident.io) | timeline and roles |
| Slack export | channel evidence |
| Confluence/Notion/Google Docs | postmortem home |
| Jira/Linear | action item tracking |
| Grafana | impact charts embedded |

## 📥 Context & Data Sources

* `incident timeline and comms`
* `alert and mitigation history`
* `metrics around the window`
* `deploy/config changes`
* `past related postmortems`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Incident platform (read)
* Chat export (read)
* Doc/tracker APIs (write after review)

## ✅ Expected Benefits

* Postmortems within a day, grounded in evidence instead of memory.
* Systemic factors surface, not just proximate causes.
* Action items survive the week after the incident.

## 🔒 Safety & Guardrails

* Postmortems are sensitive: drafts stay in access-controlled systems; external sharing requires explicit sanitization.
* Blameless language enforced by template and prompt; personal data minimized.

## 🚀 Future Implementation

* Auto-verification of action items (did the alert actually get added?).
* Org learning reports: quarterly themes across the postmortem corpus.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [32 · AI Root Cause Analysis Assistant](../32-ai-root-cause-analysis-assistant/README.md)
- [31 · AI Incident Summarizer](../31-ai-incident-summarizer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
