# 32 · AI Root Cause Analysis Assistant

> Guide root-cause analysis with evidence: candidate causes ranked by data, each with the check that confirms or kills it.

![Area](https://img.shields.io/badge/Area-Observability%20%26%20SRE-green) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 📊 Observability & SRE |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Incident platform · Grafana / Loki / traces · Postmortem tools |

---

## 📌 Problem

RCA often converges too fast on the first plausible story ('network was flaky') because testing alternative hypotheses is expensive and unfashionable.

* Multiple plausible causes exist; humans anchor on the first one.
* Evidence gathering for each hypothesis is manual and slow.
* Five-whys sessions drift into blame rather than mechanism.
* Confirmed root causes aren't connected to the actions that actually prevented recurrence.

**Why it matters:** Structured, evidence-based RCA produces fixes that work — and a culture where 'we don't know yet' is acceptable mid-analysis.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Hypothesis generation | candidate causes from the incident evidence, including unglamorous ones (quota, DNS, cache) |
| Discriminating tests | for each hypothesis, the specific query/check that would confirm or refute it |
| Evidence scoring | updates ranking as humans feed back results |
| Mechanism narrative | explains the full causal chain once evidence converges |

## 💡 Proposed Solution

An RCA companion for the investigation phase (post-mitigation or during): it reads the incident evidence (from idea 05's investigation or raw sources), proposes a hypothesis tree, and for each branch names the decisive check. Humans run checks and report back; the assistant re-ranks and narrates the emerging mechanism.

### Workflow

1. **Load evidence** — incident timeline, metrics, logs, changes, past incidents
2. **Propose** — hypothesis tree with priors based on base rates and history
3. **Guide** — for each hypothesis: the discriminating check (query/command)
4. **Update** — re-rank as results come in; eliminate or escalate branches
5. **Narrate** — final causal chain with residual-uncertainty notes

**Human-in-the-loop:** Humans run all checks; the assistant structures the process. It can be wrong — its job is to make hypotheses explicit and testable, not to declare truth.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Incident evidence loaded                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hypothesis tree proposed                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← priors from history
┌────────────────────────────────────────────────────┐
│ Discriminating checks suggested                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Humans run checks · results fed back               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Causal-chain narrative + uncertainty               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Incident platform | evidence source |
| Grafana / Loki / traces | checks via MCP |
| Postmortem tools | output hand-off |

## 📥 Context & Data Sources

* `incident timeline`
* `metrics/logs/traces`
* `change history`
* `past RCA records`
* `architecture/topology`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Observability MCP (read)
* Incident platform (read)

## ✅ Expected Benefits

* Faster convergence on true causes with fewer anchoring errors.
* Explicit uncertainty instead of confident guesses.
* Better postmortems: mechanism, not just chronology.

## 🔒 Safety & Guardrails

* RCA narratives can name people/systems: keep them in access-controlled postmortem tools.
* Blameless framing enforced in templates and prompts.

## 🚀 Future Implementation

* Base-rate learning: which hypothesis classes actually win in your org.
* Interactive simulation: replay candidate mechanisms against recorded telemetry.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
- [17 · AI Kubernetes Incident Investigator](../17-ai-kubernetes-incident-investigator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
