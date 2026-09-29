# AI Cloud Troubleshooting Assistant — Architecture

> Investigate AWS/Azure/GCP issues conversationally: the assistant queries cloud APIs read-only, reads the evidence, and explains what's wrong.

*Focus: ☁️ Cloud · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A chat-first assistant (Slack/CLI/web) wired to cloud APIs through scoped, read-only MCP servers. The engineer describes the problem; the assistant plans diagnostic reads, executes them, and explains findings with resource links. It never mutates; it drafts the fix as steps or a pull request against IaC.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Engineer describes issue (Slack · CLI)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Diagnostic plan per service class                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Read-only cloud API fan-out                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← cloud MCP servers
┌────────────────────────────────────────────────────┐
│ Cross-resource correlation                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explanation + fix steps / IaC PR                   │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Chat interface | Slack bot with thread context and audit visibility |
| Agent runtime | plan-investigate-correlate loop (LangGraph/Agents SDK) |
| Cloud MCP servers | AWS/Azure/GCP read-only tool sets |
| Runbook retriever | org runbooks and known-issues index |
| Audit log | every API call with parameters and result summary |

## 4. Data Flow

1. The engineer describes the problem in chat.
2. The agent plans diagnostics and executes read-only calls, narrating each.
3. Evidence is correlated into an explanation with deep links to the console/CLI equivalents.
4. Fix steps or an IaC PR draft are proposed for human execution.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `resource state via API`
* `cloud service health`
* `org runbooks`
* `service quotas and limits`
* `recent change records`

## 7. Human-in-the-Loop & Approval

Strictly read-only tool access; the assistant narrates every API call it makes so nothing happens invisibly.

## 8. Security Considerations

* Read-only roles only (ViewReader/Reader equivalents); no write verbs anywhere in the tool set.
* Account/subscription allowlists; sensitive accounts routed to local models.
* Prompt injection via resource tags/names is possible: treat API output as data; no action execution from text.
* Log every call for security review; cap result sizes.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [27 · AI IAM Policy Reviewer](../27-ai-iam-policy-reviewer/README.md)
