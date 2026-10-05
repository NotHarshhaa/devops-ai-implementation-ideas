# 13 · AI Pod Crash Analyzer

> Explain `CrashLoopBackOff`, `OOMKilled`, and probe failures instantly: exit code, last logs, config change, and the fix.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Kubernetes API · Prometheus / metrics-server · Argo CD / Helm · Slack / kubectl plugin |

---

## 📌 Problem

Pod crashes announce themselves loudly but explain themselves poorly: a state, an exit code, and a wall of logs.

* The same symptom (restart loop) has wildly different causes: bad config, missing dependency, OOM, failed probe, node pressure.
* Engineers jump between `kubectl describe`, `logs --previous`, events, and the deploy history to reconstruct the story.
* The question 'what changed?' is usually answerable (a deploy 20 minutes ago) but nobody checks first.

**Why it matters:** Crash loops are high-frequency, high-distraction events; instant diagnosis keeps them a five-minute fix instead of an hour of context switching.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Exit-code reasoning | maps exit codes, termination reasons, and probe outcomes to candidate causes |
| Log interpretation | reads the previous container's tail for the actual error (missing env var, failed migration, port in use) |
| Change correlation | links the crash to the most recent rollout/config change touching the pod |
| Fix drafting | proposes the patch: env/secret fix, resource bump, probe tuning, image tag, or rollback |

## 💡 Proposed Solution

A focused analyzer for crash-class pod failures: on detection it collects pod spec/status, events, last logs (current and previous), owner rollout history, and resource metrics, then returns a plain-language diagnosis with evidence and a ready-to-review patch. Lightweight enough to embed in Slack alerts, `kubectl` plugins, or as the crash module of idea 02.

### Workflow

1. **Detect** — CrashLoopBackOff / OOMKilled / probe-failure event or alert
2. **Snapshot** — pod spec/status, events, logs (previous container), rollout history, metrics
3. **Diagnose** — LLM ranks causes with evidence; checks 'what changed' from revision history
4. **Propose** — patch or rollback suggestion validated with dry-run
5. **Report** — Slack card / CLI output with evidence links

**Human-in-the-loop:** Read-only diagnosis; patches are suggestions requiring human apply (or GitOps PR).

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

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

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Kubernetes API | read-only snapshotting |
| Prometheus / metrics-server | memory/CPU context for OOM diagnosis |
| Argo CD / Helm | revision history for change correlation |
| Slack / kubectl plugin | delivery surfaces |

## 📥 Context & Data Sources

* `pod status and container states`
* `exit codes and termination reasons`
* `previous container logs`
* `recent events`
* `rollout/revision diff`
* `memory/CPU vs. limits`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Kubernetes API (read-only pods, events, logs)
* Prometheus / Metrics Server (OOM memory usage)
* GitOps & Helm Revision API (read rollout diffs)

## ✅ Expected Benefits

* Five-minute crash-loop fixes with junior-safe guidance.
* Fewer reflex restarts; changes get examined first.
* Pattern stats reveal systemic issues (chronically under-provisioned services).

## 🔒 Safety & Guardrails

* Pod logs and environment variables can contain secrets: redact env values and filtered log lines before model calls.
* Read-only service account; namespace scoping for multi-tenant clusters.

## 🚀 Future Implementation

* Predictive mode: flag pods likely to OOM based on memory trend before they die.
* Auto-remediation for safe classes (e.g., bump probe timeout) via approval queue.

## 🔗 Related Ideas

- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [17 · AI Kubernetes Incident Investigator](../17-ai-kubernetes-incident-investigator/README.md)
- [15 · AI Kubernetes Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
