# 41 · AI Security Incident Assistant

> First-response support for security incidents: containment options with tradeoffs, evidence collection checklists, and comms drafts — at 3am, without panic.

![Area](https://img.shields.io/badge/Area-DevSecOps-red) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 🔐 DevSecOps |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | SIEM / audit logs · Cloud + Kubernetes read APIs · PagerDuty / incident platform · Ticketing |

---

## 📌 Problem

Security incidents are rare enough that responders are rusty, stressful enough that mistakes multiply, and time-critical enough that mistakes are expensive.

* Containment decisions (isolate host? revoke keys? block IP?) have side effects responders forget under pressure.
* Evidence preservation is an afterthought; forensics suffers.
* Multiple consoles and logs must be checked simultaneously by a small team.
* Communication (legal, leadership, customers) has requirements nobody remembers mid-incident.

**Why it matters:** A structured assistant reduces response errors, preserves evidence, and shortens containment time — the two things that determine incident cost.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Triage structuring | turns the initial report into a response plan: containment options, side effects, evidence steps |
| Evidence collection | read-only gathering of relevant logs/configs with preservation hygiene (timestamps, hashes) |
| Blast-radius analysis | what the attacker/compromise could reach given observed access |
| Comms drafting | internal/stakeholder/legal-prescribed notifications as drafts for human review |

## 💡 Proposed Solution

A security-incident mode for the investigation platform (idea 05) with security-specific playbooks: strictly read-only evidence tools, containment options presented with explicit tradeoffs (never executed directly), and comms/audit drafting. Integrates with the security incident process (not a replacement for the IR team).

### Workflow

1. **Declare** — security incident declared; assistant attached to the channel
2. **Plan** — triage structure: containment options, evidence plan, comms requirements
3. **Collect** — read-only evidence with preservation metadata
4. **Advise** — containment tradeoffs; blast-radius updates as evidence arrives
5. **Draft** — comms and audit documentation for human approval
6. **Close** — response record assembled for review and lessons

**Human-in-the-loop:** Absolute: containment and eradication are human decisions. The assistant gathers evidence and drafts; it never blocks, revokes, isolates, or deletes.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Security incident declared                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Response plan drafted (containment · evidence)     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Read-only evidence collection                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← preservation hygiene
┌────────────────────────────────────────────────────┐
│ Containment options + blast radius                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Comms drafts → human approval                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Response record for review                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| SIEM / audit logs | evidence sources |
| Cloud + Kubernetes read APIs | state inspection |
| PagerDuty / incident platform | process integration |
| Ticketing | response tracking |

## 📥 Context & Data Sources

* `initial report`
* `IAM and network state`
* `audit/SIEM events`
* `asset criticality`
* `regulatory notification requirements`
* `IR playbooks`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* SIEM & Security Lake Query API (Splunk / Chronicle / Elastic Security read-only)
* Cloud & Kubernetes Forensics MCP (read-only snapshots)
* Incident Response Ticketing & Evidence Locker API

## ✅ Expected Benefits

* Fewer containment mistakes; explicit tradeoffs instead of reflexes.
* Forensics-quality evidence preserved by default.
* Response documentation written as you go, not reconstructed later.

## 🔒 Safety & Guardrails

* This assistant is itself a target: hardened deployment, no write credentials, immutable audit of its own actions.
* Evidence handling must meet forensics standards — chain of custody, no silent alteration.
* Prompt injection from logs/malware strings is a live threat: output-as-data discipline, schema-validated plans only.
* Access strictly limited to authorized responders; sensitive-model routing per legal guidance.

## 🚀 Future Implementation

* Tabletop-training mode: simulate incidents for response practice.
* Auto-correlation with threat intel feeds during investigation.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [39 · AI Secrets Detection Assistant](../39-ai-secrets-detection-assistant/README.md)
- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
