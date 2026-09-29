# AI Kubernetes Security Analyzer — Architecture

> Explain and fix your cluster's security posture: RBAC sprawl, missing Pod Security controls, NetworkPolicy gaps — prioritized and explained.

*Focus: 🔐 DevSecOps · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A posture analyzer that combines cluster state, audit logs, and traffic observations into a prioritized hardening report: each finding explained (attack path in plain language), each fix provided as reviewable manifests, rollout risks noted. Kyverno/PSS baseline policies and admission-time enforcement are the endgame; this provides the guided path there.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Cluster state · audit logs · flows                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deterministic posture passes                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM risk narrative (attack paths)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hardening PRs (RBAC · PSS · NetPol)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Graduate to Kyverno / PSS enforce                  │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| State collector | RBAC, workloads, policies, audit logs via read-only access |
| Flow analyzer | traffic observations for policy synthesis |
| Risk narrator | LLM explanations with attack-path detail |
| Fix generator | manifest PRs with rollout notes |
| Policy pipeline | Kyverno/PSS enforcement graduation |

## 4. Data Flow

1. Scheduled collection snapshots the security-relevant cluster state.
2. Deterministic analysis finds escalation paths, gaps, and exposure.
3. The model explains findings in context and drafts fixes.
4. Fixes roll out via PR; enforcement graduates as violations drop.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `RBAC bindings and audit evidence`
* `workload security contexts`
* `network flows and policies`
* `image provenance`
* `secret usage patterns`

## 7. Human-in-the-Loop & Approval

All fixes via PR with owner review; enforcement mode changes require platform-team sign-off.

## 8. Security Considerations

* The analyzer sees audit logs and RBAC detail — crown-jewel data: restrict to local/approved models.
* Fix PRs are security-sensitive changes: require security-team review, not just owners.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)
- [37 · AI Container Vulnerability Explainer](../37-ai-container-vulnerability-explainer/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
