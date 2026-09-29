# AI Cluster Operations Agent — Architecture

> A resident cluster operations agent: watches fleet health, drafts maintenance plans, and executes supervised runbooks via an audited control plane.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A resident agent platform in-cluster (kagent-style control plane) with a curated tool set: read-everything, plus write actions gated by policy and approval workflows. Scheduled tasks produce maintenance proposals; humans approve; execution is step-wise audited with dry-runs and aborts. Think of it as an SRE teammate whose every action is logged.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Scheduled fleet sweep                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Maintenance backlog + plans                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human approval per plan                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Step-wise execution (dry-run · checkpoints)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← policy-gated
┌────────────────────────────────────────────────────┐
│ Verification + audit report                        │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Agent control plane | kagent-style in-cluster runtime defining agents, tools, and policies |
| Fleet sweeper | scheduled checks: versions, CVEs, certs, quotas, node health |
| Planner | LLM drafting maintenance plans from cluster state and org rules |
| Policy gate | OPA/Kyverno-style rules over proposed actions; approval workflow integration |
| Executor | tool runtime with scoped credentials, dry-run defaults, step audit log |
| Reporting | backlog dashboards and execution reports |

## 4. Data Flow

1. Scheduled sweeps maintain a live maintenance backlog.
2. The planner drafts a plan for the next item (e.g., control-plane upgrade) with step detail.
3. Approvers review; approval opens a scoped, time-boxed execution session.
4. The executor runs steps with dry-run and checkpoints; any anomaly aborts.
5. Verification and the audit trail are published.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `cluster versions and skew`
* `CVE feeds for deployed images`
* `certificate/credential expiry`
* `node health and pressure`
* `PDB/topology constraints`
* `org maintenance windows`

## 7. Human-in-the-Loop & Approval

Nothing executes without an explicit approval per plan; pre-approved routine actions (like cert renewals) run under narrow policy with full audit.

## 8. Security Considerations

* The action surface is the design centerpiece: default-deny, allowlisted verbs, time-boxed sessions, dry-run first.
* Two-person approval for cluster-affecting plans; emergency path pre-defined and drilled.
* Agent runtime runs in a locked-down namespace; its credentials are scoped per tool, never cluster-admin.
* Treat all cluster output as untrusted data (prompt injection); schema-validate every plan before execution.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [14 · AI kubectl Assistant](../14-ai-kubectl-assistant/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
