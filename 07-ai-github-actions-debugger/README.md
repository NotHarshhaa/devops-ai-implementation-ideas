# 07 · AI GitHub Actions Debugger

> Deep-dive GitHub Actions failures — matrix jobs, annotations, runner issues — with fixes as ready-to-apply suggestions.

![Area](https://img.shields.io/badge/Area-CI%2FCD-blue) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔄 CI/CD |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub Actions · GitHub Checks · Slack |

---

## 📌 Problem

GitHub Actions failures come with annotations, matrix expansion, re-run semantics, and runner quirks; the raw logs API gives you the data but not the interpretation.

* Matrix builds multiply logs; finding which combination failed and why is manual.
* Runner/environment failures (disk, network, dependency cache) masquerade as code failures.
* Annotations help but say what failed, never why or what to do.
* Workflow syntax (expressions, conditions, needs graph) has subtle bugs that only appear at runtime.

**Why it matters:** GitHub Actions is the default CI for most modern repos; unclear failures slow every team touching the repo.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Job/matrix analysis | identifies failing matrix legs, common causes, and whether it's one leg or systemic |
| Workflow syntax reasoning | spots condition/expression/needs-graph bugs from the YAML plus error output |
| Environment classification | separates code failures from runner, cache, quota, and network failures |
| Suggested patch | produces concrete workflow YAML fixes as PR suggestions |

## 💡 Proposed Solution

On workflow failure, a GitHub App fetches the run's jobs, steps, annotations, and logs via the API, reduces them, and runs an Actions-specialized analysis. Output: a run summary with root cause, classification, and — for workflow-file issues — a one-click 'apply suggestion' patch. Pairs naturally with the managed reviewers (CodeRabbit/Qodo) for the code-side review layer.

### Workflow

1. **Hook** — `check_suite`/`workflow_run` failure event via GitHub App
2. **Fetch** — jobs, steps, annotations, logs, runner info, triggering PR
3. **Reduce** — per-job error windows; matrix grouping; secret redaction
4. **Diagnose** — LLM analysis with workflow YAML and repo context
5. **Respond** — run summary + classification + YAML patch suggestion via PR review comment

**Human-in-the-loop:** Advisory comments and review suggestions only; humans click 'commit suggestion' or fix manually.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ workflow_run failure event                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ GitHub API (jobs · logs · annotations)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Reducer + matrix grouping                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis (workflow YAML aware)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Run summary + YAML patch suggestion                │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub Actions | webhooks, Actions API, PR review suggestions |
| GitHub Checks | annotated check runs |
| Slack | failure digests |

## 📥 Context & Data Sources

* `workflow YAML`
* `job/step logs`
* `annotations`
* `runner labels and metadata`
* `matrix combinations`
* `triggering PR diff`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* GitHub API (read logs, metadata; write PR comments)

## ✅ Expected Benefits

* Matrix and runner failures explained instantly, ending the 're-run and hope' loop.
* Workflow YAML bugs fixed via one-click suggestions.
* Consistent classification feeds CI-health dashboards.

## 🔒 Safety & Guardrails

* GitHub App with minimal permissions (actions: read, checks: write, pull_requests: write for suggestions).
* Redact masked-secret echoes and third-party log noise; keep private-repo analysis within approved providers.

## 🚀 Future Implementation

* Auto-retry policies for classified infra failures with explanatory labels.
* Workflow hygiene reports: unused inputs, cache misses, slowest steps with reasons.

## 🔗 Related Ideas

- [01 · AI Pipeline Failure Analyzer](../01-ai-pipeline-failure-analyzer/README.md)
- [10 · AI Test Failure Analyzer](../10-ai-test-failure-analyzer/README.md)
- [11 · AI Build Optimization Assistant](../11-ai-build-optimization-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
