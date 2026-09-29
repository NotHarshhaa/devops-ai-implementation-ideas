# AI Kubernetes Incident Investigator — Architecture

> The Kubernetes-focused incident agent: reconstructs what happened across pods, nodes, controllers, and rollouts into a causal narrative.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A deep-investigation agent for Kubernetes incidents: given a time window and affected service, it sweeps API events, controller logs, node conditions, network policies, and rollout history, then constructs a causal graph and narrative. Designed to complement idea 05 (cross-domain) with cluster-native depth, feeding its findings to responders and the postmortem generator.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Scope resolver | maps incident to namespaces/services/window via catalog |
| Cluster sweeper | parallel collectors for events, controller state, node conditions, policy objects |
| Correlator | temporal alignment and causal-graph construction |
| Narrative engine | LLM composing the story with explicit uncertainty and evidence links |
| Responder chat | thread-based follow-ups |

## 4. Data Flow

1. The incident scope is resolved to concrete cluster objects and a time window.
2. Sweepers collect API events, controller histories, node states, and rollout records.
3. The correlator builds a timestamped causal graph.
4. The narrative engine writes the incident story with evidence links and uncertainty markers.
5. Responders query for specifics; final evidence is packaged for the postmortem.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `cluster events in window`
* `controller decisions (HPA/KEDA/operator logs)`
* `node conditions and pressure`
* `rollout timeline`
* `network policy/DNS state`
* `topology and dependencies`

## 7. Human-in-the-Loop & Approval

Read-only investigation. Responders make all decisions; the agent's causal graph is a hypothesis to verify, not a verdict.

## 8. Security Considerations

* Large sweeps must be namespace-scoped and redacted; event and log data can embed sensitive values.
* Audit all API reads; cap collection to the incident window to limit data movement.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [36 · AI Postmortem Generator](../36-ai-postmortem-generator/README.md)
