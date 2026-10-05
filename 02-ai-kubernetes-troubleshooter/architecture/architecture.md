# AI Kubernetes Troubleshooter — Architecture

> Investigate unhealthy workloads automatically: collect events, logs, and pod state, then explain the failure and the fix in plain language.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A troubleshooting service (or in-cluster agent) watches for unhealthy workloads and alert triggers. It collects pod specs, events, container logs, and resource metrics; optionally uses proven open-source analyzers (K8sGPT, HolmesGPT) for triage; then an LLM agent reasons over the package and returns a diagnosis with a proposed fix. Interactive mode lets engineers ask follow-up questions in Slack or the terminal, with every tool call executed through a read-scoped Kubernetes RBAC identity.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Alert / unhealthy workload trigger                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Kubernetes API (events · logs · specs)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-scoped RBAC
┌────────────────────────────────────────────────────┐
│ Evidence collector + K8sGPT/HolmesGPT              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ AI agent (hypothesis → tool → refine)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP kubernetes tools
┌────────────────────────────────────────────────────┐
│ Diagnosis + ranked causes                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Fix proposal (dry-run / GitOps PR)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human approval
┌────────────────────────────────────────────────────┐
│ Engineer applies · knowledge base updated          │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Trigger listener | Prometheus/Alertmanager webhooks and a workload-state watcher for CrashLoops and probe failures |
| Evidence collector | kubernetes client fetching specs, events, logs, owner chains, and resource metrics |
| Analyzer plugins | optional K8sGPT analyzers and HolmesGPT runbooks for well-known failure classes |
| Agent runtime | LangGraph/OpenAI Agents SDK loop with MCP `kubernetes` tools, scoped to read-only verbs |
| Diagnosis engine | LLM producing ranked root causes, each tied to concrete evidence objects |
| Remediation drafter | emits kubectl patches, manifest diffs, or GitOps PR content; validates with server dry-run |
| Chat interface | Slack bot and `kubectl ai`-style CLI for follow-up questions |
| Knowledge base | confirmed diagnoses indexed for retrieval next time |

## 4. Data Flow

1. An alert or workload watcher identifies a struggling resource and opens an investigation.
2. The collector snapshots pod spec, events, logs, owner resources, and node state through a read-only service account.
3. The agent forms hypotheses and makes targeted tool calls (previous-container logs, node describe, PVC status) until evidence is sufficient.
4. The LLM produces a ranked diagnosis with evidence links and a proposed fix.
5. The fix is validated with `--dry-run=server` and offered as a command or GitOps pull request.
6. The engineer approves or rejects; the outcome is stored for retrieval and evaluation.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "workload": {
    "namespace": "production",
    "kind": "Deployment",
    "name": "payment-service"
  },
  "status_summary": "CrashLoopBackOff (exit code 137 - OOMKilled)",
  "ranked_causes": [
    {
      "rank": 1,
      "hypothesis": "Container exceeded 512Mi memory limit during JVM heap initialization",
      "confidence": 0.94,
      "evidence": "Pod status terminated reason: OOMKilled, restart count: 8 within 15 minutes"
    }
  ],
  "remediation": {
    "type": "manifest_patch",
    "safe_dry_run_command": "kubectl patch deployment payment-service -n production --patch '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"1Gi"}}}]}}}}' --dry-run=server",
    "gitops_pull_request": {
      "repo": "infra/k8s-manifests",
      "file": "apps/payment-service/values.yaml",
      "diff": "- resources.limits.memory: 512Mi\n+ resources.limits.memory: 1Gi"
    }
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `pod spec and status`
* `recent events`
* `container logs (current + previous)`
* `resource requests vs. usage`
* `rollout and Helm revision history`
* `node conditions`
* `related ConfigMaps/Secrets`

## 8. Human-in-the-Loop & Approval

Diagnosis is automatic; every change goes through approval. The agent proposes kubectl commands that are shown with `--dry-run=server` output, or a GitOps PR, and a human applies them.

## 9. Security Considerations

* Run the agent under a dedicated service account with read-only verbs; never bind cluster-admin.
* Scrub Secret contents and sensitive annotations from all context; log redaction at the collector boundary.
* Allowlist namespaces and clusters the agent may investigate; per-tenant audit trail of every API call the model made.
* For regulated clusters, run the model locally (Ollama/vLLM) so pod data never leaves the network.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Investigations are event-driven (alerts, crash loops). A typical investigation is 5-15 tool calls plus one or two reasoning calls — cents with cloud models, free with self-hosted open-weight models.

## 13. Alternative Approaches

* Buy: deploy K8sGPT or HolmesGPT directly and skip custom plumbing; build custom only for org-specific context.
* In-cluster operator vs. external service: in-cluster has direct API access; external keeps model traffic off-cluster.
* CLI-first (`kubectl ai`-style) instead of chat — same evidence pipeline, developer-invoked.

## 14. Related Ideas

- [13 · AI Pod Crash Analyzer](../../13-ai-pod-crash-analyzer/README.md)
- [17 · AI Kubernetes Incident Investigator](../../17-ai-kubernetes-incident-investigator/README.md)
- [19 · AI Cluster Operations Agent](../../19-ai-cluster-operations-agent/README.md)
