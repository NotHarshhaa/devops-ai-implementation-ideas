# AI Security Incident Assistant — Architecture

> First-response support for security incidents: containment options with tradeoffs, evidence collection checklists, and comms drafts — at 3am, without panic.

*Focus: 🔐 DevSecOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A security-incident mode for the investigation platform (idea 05) with security-specific playbooks: strictly read-only evidence tools, containment options presented with explicit tradeoffs (never executed directly), and comms/audit drafting. Integrates with the security incident process (not a replacement for the IR team).

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Incident mode | security-specific prompts, playbooks, and stricter guardrails |
| Evidence collector | read-only, hash-and-timestamp preserving |
| Blast-radius analyzer | access-path reasoning from IAM/network data |
| Comms drafter | stakeholder and regulatory templates |
| Record builder | complete, reviewable response log |

## 4. Data Flow

1. Declaration attaches the assistant to the incident channel.
2. It structures the response plan and begins evidence collection.
3. Containment options with side effects are laid out for the humans.
4. Comms drafts and the response record are produced for review.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `initial report`
* `IAM and network state`
* `audit/SIEM events`
* `asset criticality`
* `regulatory notification requirements`
* `IR playbooks`

## 7. Human-in-the-Loop & Approval

Absolute: containment and eradication are human decisions. The assistant gathers evidence and drafts; it never blocks, revokes, isolates, or deletes.

## 8. Security Considerations

* This assistant is itself a target: hardened deployment, no write credentials, immutable audit of its own actions.
* Evidence handling must meet forensics standards — chain of custody, no silent alteration.
* Prompt injection from logs/malware strings is a live threat: output-as-data discipline, schema-validated plans only.
* Access strictly limited to authorized responders; sensitive-model routing per legal guidance.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [39 · AI Secrets Detection Assistant](../39-ai-secrets-detection-assistant/README.md)
- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
