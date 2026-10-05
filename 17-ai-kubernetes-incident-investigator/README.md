# 17 · AI Kubernetes Incident Investigator

> The Kubernetes-focused incident agent: reconstructs what happened across pods, nodes, controllers, and rollouts into a causal narrative.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | Kubernetes API + events · Prometheus / Loki / Tempo · Argo CD / Helm · PagerDuty / incident platform |

---

## 📌 Problem

Kubernetes incidents rarely live in one object: a node drain cascades through PDBs, HPA behavior, DNS, and app retries, and the story must be reassembled from dozens of API objects.

* Causal chains span resources: node pressure → evictions → PDB deadlock → service degradation.
* Controller behavior (HPA, KEDA, operators) is part of the story but invisible in simple dashboards.
* Reconstruction after the fact is slow and error-prone; timeline details evaporate.
* Each responder investigates a slice; nobody assembles the whole picture in the moment.

**Why it matters:** Cluster incidents take longer to understand than to fix; a reconstructed causal narrative compresses both investigation and review time.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Multi-object reconstruction | assembles event chains across pods, nodes, controllers, and network components with timestamps |
| Controller-behavior analysis | explains what HPA/KEDA/operators did and why during the window |
| Dependency tracing | follows impact across services via topology and traffic data |
| Narrative generation | produces the incident story: trigger, propagation, impact, recovery — with evidence links |

## 💡 Proposed Solution

A deep-investigation agent for Kubernetes incidents: given a time window and affected service, it sweeps API events, controller logs, node conditions, network policies, and rollout history, then constructs a causal graph and narrative. Designed to complement idea 05 (cross-domain) with cluster-native depth, feeding its findings to responders and the postmortem generator.

### Workflow

1. **Scope** — incident ID/service + time window from the incident platform
2. **Sweep** — collect events, controller logs, node conditions, HPA/KEDA history, network policies, rollouts
3. **Correlate** — build a causal graph aligning all timestamps; identify trigger and propagation path
4. **Narrate** — produce timeline + causal narrative with confidence labels
5. **Support** — answer responder questions with additional targeted sweeps
6. **Hand off** — structured evidence package for postmortems

**Human-in-the-loop:** Read-only investigation. Responders make all decisions; the agent's causal graph is a hypothesis to verify, not a verdict.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Incident scope (service · window)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ K8s event & controller sweep                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-only
┌────────────────────────────────────────────────────┐
│ Causal graph builder                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Narrative + evidence timeline                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Responder Q&A · extra sweeps                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Evidence → postmortem (idea 36)                    │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Kubernetes API + events | primary evidence source (read-only) |
| Prometheus / Loki / Tempo | metrics, logs, traces around the window |
| Argo CD / Helm | rollout and revision history |
| PagerDuty / incident platform | scope and hand-off |
| Backstage catalog | ownership and topology |

## 📥 Context & Data Sources

* `cluster events in window`
* `controller decisions (HPA/KEDA/operator logs)`
* `node conditions and pressure`
* `rollout timeline`
* `network policy/DNS state`
* `topology and dependencies`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Kubernetes MCP (read-only events, pods, nodes, controllers)
* Grafana MCP (Prometheus metrics, Loki logs, Tempo traces)
* GitHub MCP (deployment and change history)

## ✅ Expected Benefits

* Faster shared understanding during the incident, not after.
* Causal narratives that make postmortems materially cheaper.
* Controller misbehavior (HPA flapping, operator loops) becomes visible and fixable.

## 🔒 Safety & Guardrails

* Large sweeps must be namespace-scoped and redacted; event and log data can embed sensitive values.
* Audit all API reads; cap collection to the incident window to limit data movement.

## 🚀 Future Implementation

* Live mode: stream the causal graph during the incident as events arrive.
* Cluster-history replay: identify chronic cascade patterns across past incidents.

## 🔗 Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
