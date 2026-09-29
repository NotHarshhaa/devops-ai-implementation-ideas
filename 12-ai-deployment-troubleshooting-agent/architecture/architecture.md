# AI Deployment Troubleshooting Agent — Architecture

> When a deploy goes sideways, an agent verifies health across the stack and recommends (or drafts) the rollback — with humans holding the trigger.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

Triggered by deploy events or SLO burn, an agent snapshots the pre-deploy baseline, verifies rollout health across CD and monitoring tools via MCP, and on regression produces a rollback plan (or executes a pre-approved one after approval). Integrates with GitOps: rollback = revert PR, keeping humans in the loop.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Deploy event / SLO burn trigger                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Baseline snapshot                                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Health verifier (CD · metrics · synthetics)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP tools
┌────────────────────────────────────────────────────┐
│ Regression attribution                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Rollback plan + risk notes                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human approval
┌────────────────────────────────────────────────────┐
│ Revert PR / flag flip · report                     │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Deploy listener | Argo CD/Jenkins/GitLab CD events, version annotations |
| Baseline store | pre-deploy metric snapshots and manifests |
| Health verifier | MCP-backed checks: rollout status, error/latency deltas, synthetic results |
| Attribution engine | change correlation to rule out non-deploy causes |
| Plan drafter | rollback steps with risk annotations and comms drafts |
| Gated executor | approval-gated actions: revert PR, rollout pause, flag flip |

## 4. Data Flow

1. A deploy event starts the watcher, which snapshots the baseline.
2. During rollout, health checks compare live signals to baseline.
3. On regression, attribution separates deploy-caused vs. other causes.
4. A rollback/fix-forward recommendation with full evidence is posted to the deploy thread.
5. On approval, the gated executor opens the revert PR (GitOps) or pauses the rollout; everything is recorded for the postmortem.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `deploy metadata and diff vs. previous`
* `pre-deploy baseline metrics`
* `live rollout health (errors, latency, saturation)`
* `synthetic/e2e results`
* `schema and queue compatibility notes`
* `runbook for the service`

## 7. Human-in-the-Loop & Approval

Watching and planning are automatic. Execution requires approval, except optionally pre-approved flag-flips for revert-to-safe-default. GitOps reverts keep the audit trail in Git.

## 8. Security Considerations

* Executor credentials are separate, scoped, and approval-gated; every action is logged immutably.
* Guard against prompt injection flowing from logs/metrics: action allowlists and schema-validated plans only.
* Test rollback paths (incl. DB compat) in drills; an untested rollback plan is a risk, not a mitigation.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [08 · AI Deployment Risk Analyzer](../08-ai-deployment-risk-analyzer/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
