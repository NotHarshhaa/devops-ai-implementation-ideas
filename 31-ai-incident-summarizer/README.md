# 31 · AI Incident Summarizer

> Live incident summaries for every audience: exec updates, channel newcomers' briefings, and stakeholder comms drafted from the real timeline.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Slack / Teams · PagerDuty / FireHydrant / incident.io · Status page |

---

## 📌 Problem

During incidents, communication competes with mitigation for the incident commander's attention, and it loses — leaving executives, support, and newcomers in the dark.

* Execs ask 'what's the impact and ETA?' mid-incident, interrupting the IC.
* Joining responders lack a briefing and waste minutes scrolling the channel.
* Customer-facing/support teams get inconsistent or delayed information.
* Post-incident, reconstructing communication history is painful.

**Why it matters:** Good incident communication preserves trust and prevents the 'circle back and ask what happened' tax on the whole org.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Timeline synthesis | reads the incident channel/timeline and produces an accurate current-state summary |
| Audience adaptation | exec brief (impact, status, ETA, next update), responder briefing (what's known/tried/believed), support script |
| Periodic updates | scheduled drafts every N minutes for IC approval |
| Closure recap | end-of-incident summary for the record and postmortem seed |

## 💡 Proposed Solution

A summarizer bot watching the incident channel and timeline data: it drafts audience-specific updates on demand ('/brief execs') or on schedule, always posted as drafts for IC approval before sending. Nothing goes out unreviewed.

### Workflow

1. **Observe** — ingest channel messages, timeline events, and status changes
2. **Draft** — audience-specific summaries grounded in the actual timeline
3. **Review** — IC edits/approves in a thread
4. **Distribute** — approved updates to target channels
5. **Archive** — communication log preserved for the postmortem

**Human-in-the-loop:** Every external update requires IC approval; the bot drafts, humans speak.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Incident channel + timeline ingest                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Summary drafter (per audience)                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ IC review thread                                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Approved distribution                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Comms archive → postmortem                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Slack / Teams | channel listening and posting |
| PagerDuty / FireHydrant / incident.io | timeline source |
| Status page | optional approved publishing |

## 📥 Context & Data Sources

* `incident channel messages`
* `timeline events`
* `severity and status`
* `impacted services`
* `past incident comms style`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Incident platform API (read)
* Chat APIs (post on approval)

## ✅ Expected Benefits

* IC time goes to mitigation, not narration.
* Consistent, honest updates build org trust.
* Newcomers get instant briefings.

## 🔒 Safety & Guardrails

* Incident channels contain sensitive info: summaries respect channel boundaries; no cross-posting secrets.
* Drafts-only default prevents the bot from ever speaking unapproved to execs/customers.

## 🚀 Future Implementation

* Multilingual comms for global support teams.
* Sentiment check: flag when stakeholder questions are drifting unanswered.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
- [50 · AI On-Call Copilot](../50-ai-on-call-copilot/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
