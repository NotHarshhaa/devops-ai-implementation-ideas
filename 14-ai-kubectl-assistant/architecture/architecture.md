# AI kubectl Assistant — Architecture

> Natural-language Kubernetes operations with guardrails: the assistant writes the command, validates it with dry-run, and you execute it.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A terminal (or Slack) assistant wired to the cluster through the kubernetes MCP server. It generates commands, classifies their safety, validates mutating ones via server dry-run, and hands execution to the human — the assistant never applies directly. Audit log records every generated and executed command.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Engineer intent (CLI · Slack)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Command drafter (cluster-aware)                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP kubernetes
┌────────────────────────────────────────────────────┐
│ Safety classifier (read · mutate · delete)         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Server dry-run validation                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human executes in own RBAC                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Output explained + follow-ups                      │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Chat front end | CLI plugin and/or Slack bot |
| Command drafter | LLM with schema knowledge of kubectl/Helm/Kustomize plus live cluster metadata |
| Policy classifier | allowlist-based safety labeling (read/mutate/delete) with org-specific rules |
| Dry-run validator | executes validation via read-scoped service account |
| Audit log | every generated command, classification, and execution outcome |

## 4. Data Flow

1. The engineer asks in natural language.
2. The drafter produces a candidate command using live cluster context.
3. The classifier labels safety; policy blocks or flags as needed.
4. Mutating commands are dry-run validated and presented with their effect.
5. The human executes; the assistant explains output and offers next steps.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `live cluster metadata (namespaces, kinds, labels)`
* `user's RBAC context`
* `resource schemas`
* `org policies`
* `recent changes to the target resource`

## 7. Human-in-the-Loop & Approval

The human executes everything in their own context; the assistant is a writer/validator, never an executor.

## 8. Security Considerations

* The assistant's own credentials are strictly read-only + dry-run; execution happens in the human's RBAC context.
* Destructive verbs (delete, scale to zero, drain) require explicit typed confirmation and are logged.
* Watch for prompt injection via resource names/annotations; treat all cluster output as data.
* Prefer local models (Ollama/vLLM) in regulated environments so cluster metadata stays in-network.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)
- [13 · AI Pod Crash Analyzer](../13-ai-pod-crash-analyzer/README.md)
