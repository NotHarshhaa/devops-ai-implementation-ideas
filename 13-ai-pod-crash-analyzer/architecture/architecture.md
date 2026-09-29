# AI Pod Crash Analyzer — Architecture

> Explain `CrashLoopBackOff`, `OOMKilled`, and probe failures instantly: exit code, last logs, config change, and the fix.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A focused analyzer for crash-class pod failures: on detection it collects pod spec/status, events, last logs (current and previous), owner rollout history, and resource metrics, then returns a plain-language diagnosis with evidence and a ready-to-review patch. Lightweight enough to embed in Slack alerts, `kubectl` plugins, or as the crash module of idea 02.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Crash event (CrashLoop · OOM · probe)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ K8s API snapshot (spec · events · logs)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-only
┌────────────────────────────────────────────────────┐
│ Rollout/change correlation                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis + fix patch                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← dry-run validated
┌────────────────────────────────────────────────────┐
│ Slack / CLI report                                 │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Crash detector | workload watcher or alert webhook for crash-class states |
| Snapshot collector | pod spec/status, events, previous logs, revision history, metrics |
| Diagnosis engine | LLM with exit-code/probe knowledge and revision diff |
| Patch drafter | manifest patch or GitOps PR with dry-run validation |

## 4. Data Flow

1. A crash-class event or alert names the pod.
2. The collector snapshots state, logs, and the rollout history around the last change.
3. The model ranks likely causes, citing exit code, log lines, and the change diff.
4. A validated patch or revert suggestion is returned with evidence links.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `pod status and container states`
* `exit codes and termination reasons`
* `previous container logs`
* `recent events`
* `rollout/revision diff`
* `memory/CPU vs. limits`

## 7. Human-in-the-Loop & Approval

Read-only diagnosis; patches are suggestions requiring human apply (or GitOps PR).

## 8. Security Considerations

* Pods logs/env can contain secrets: redact env values and filtered log lines before model calls.
* Read-only service account; namespace scoping for multi-tenant clusters.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [17 · AI Kubernetes Incident Investigator](../17-ai-kubernetes-incident-investigator/README.md)
- [15 · AI Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
