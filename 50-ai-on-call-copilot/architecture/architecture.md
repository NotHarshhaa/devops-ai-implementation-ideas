# AI On-Call Copilot — Architecture

> The capstone: a copilot that rides along with the on-call engineer — investigating alerts, drafting mitigations, executing pre-approved runbooks, and keeping everyone informed.

*Focus: 🤖 Agentic DevOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A copilot service that unifies the catalog's building blocks behind one chat/CLI surface: an agent runtime with an MCP tool belt across Kubernetes, cloud, observability, GitHub, and incident tooling; a policy engine separating read (free), write (confirm), and pre-approved runbook (fast-confirm) actions; and memory linking alerts → investigations → outcomes. Built on LangGraph or a kagent-style control plane, with every model and tool call observable.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Page → copilot attaches + pre-investigates         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Conversational investigation                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP tool belt
┌────────────────────────────────────────────────────┐
│ Mitigation proposal (confirm · fast-confirm)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← policy engine
┌────────────────────────────────────────────────────┐
│ Stakeholder update drafts                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Handover / resolution record                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Outcome → runbook + eval tuning                    │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Copilot runtime | agent graph (LangGraph/kagent-style) with session memory |
| MCP tool belt | kubernetes, cloud, Grafana, GitHub, PagerDuty MCP servers — permission-tiered |
| Policy engine | read/write/runbook tiers, per-service approval policies |
| Approval UX | one-tap confirm in Slack with full context of what will run |
| Memory | past engagements, service priors, runbook outcomes |
| Observability | every model/tool call traced (Langfuse/Phoenix) with cost control |

## 4. Data Flow

1. A page triggers pre-investigation and the copilot joins the thread.
2. The engineer and copilot investigate together through read-only tools.
3. Mitigations are proposed with clear tiers: fast-confirm runbooks vs. explicit-approval writes.
4. Comms drafts keep stakeholders current; resolution records feed learning.
5. Outcomes tune runbooks and evaluation sets for the next shift.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `alert and incident context`
* `service topology and runbooks`
* `metrics/logs/traces`
* `past engagements and postmortems`
* `approval policies per service`

## 7. Human-in-the-Loop & Approval

The defining design constraint: read is free, write is confirmed, runbooks are pre-approved per-step by their owners. The copilot is a junior teammate with a fast, auditable approval loop — never an autonomous operator.

## 8. Security Considerations

* Tiered permissions are the core design: no blanket credentials, per-tool scoping, deny-by-default writes.
* Every action (model call, tool call, approval, execution) is immutably logged — the audit trail is the product.
* Prompt-injection defense: treat all telemetry as data; schema-validated action plans; allowlisted runbooks only.
* Break-glass path documented and drilled: what happens if the copilot is down or wrong.
* Sensitive services can require two-person approval even for runbook tiers.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

A resident service near your incident tooling with the MCP gateway and policy engine. Session state is durable (investigations span hours); tool credentials are brokered per-tier. Start read-only for one team, graduate action tiers per service with measured trust.

## 11. Cost Considerations

Pages are infrequent; each engagement is deep. Hybrid routing (cheap models for chat, frontier for investigation) plus strict tool-call budgets keep per-incident cost in single-digit dollars — versus the on-call hour it compresses.

## 12. Alternative Approaches

* Build on kagent/HolmesGPT as the runtime and add the policy/approval layer, rather than starting from scratch.
* CLI-first copilot for teams that live in terminals, Slack app for everyone else — same tool belt.
* Start as pure enrichment (idea 30) and grow into the full copilot as trust data accumulates.

## 13. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [30 · AI Alert Investigation Assistant](../30-ai-alert-investigation-assistant/README.md)
- [31 · AI Incident Summarizer](../31-ai-incident-summarizer/README.md)
- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)
