# 16 · AI Helm Chart Analyzer

> Review Helm charts for correctness, upgrade safety, and best practices — before `helm upgrade` finds out the hard way.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Helm 3 · CI (GitHub Actions/GitLab) · Argo CD · Artifact Hub |

---

## 📌 Problem

Helm charts encode a huge amount of implicit contract: values schemas, upgrade semantics, and Kubernetes best practices that are easy to violate invisibly.

* Charts pass `helm lint` yet produce broken deployments (probe paths, resource units, wrong selectors).
* Upgrades fail at runtime: immutable field changes, CRD version skews, breaking template changes between chart versions.
* Forked vendor charts drift without warning until the next upgrade.
* Best-practice review (security context, PDBs, probes, labels) is manual and inconsistent.

**Why it matters:** Chart defects surface as failed upgrades and outages during exactly the moments change pressure is highest.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Rendered-manifest review | analyzes `helm template` output the way an SRE would: probes, resources, security contexts, PDBs, selectors |
| Upgrade diffing | combines `helm diff` with Kubernetes field-mutability knowledge to predict breaking upgrades |
| Best-practice checks | explains and prioritizes deviations (missing limits, runAsRoot, no PDB) with fixes |
| Values validation | spots schema violations and suspicious value overrides |

## 💡 Proposed Solution

PR-time and pre-upgrade analysis: render the chart, lint, diff against the deployed release, and hand the manifests plus findings to an LLM for a structured review — breaking-change risks, best-practice gaps, and suggested template fixes — posted to the PR or shown before running upgrade in CI.

### Workflow

1. **Render** — `helm template`/`helm diff upgrade` in CI on chart PRs and pre-deploy
2. **Lint** — kubeconform/polaris-style structural checks first
3. **Review** — LLM reviews rendered manifests + diff for correctness, mutability risks, and practices
4. **Report** — PR comments and a go/no-go summary for the upgrade

**Human-in-the-loop:** Advisory findings on PRs; upgrade execution remains a human/CI decision.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Chart PR / pre-upgrade hook                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Render + diff (helm template/diff)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Structural lint (kubeconform · polaris)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM review (mutability · practices)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR findings + go/no-go summary                     │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Helm 3 | template/diff/lint pipelines |
| CI (GitHub Actions/GitLab) | PR triggers |
| Argo CD | pre-sync hooks for upgrade checks |
| Artifact Hub | chart metadata for dependency advisories |

## 📥 Context & Data Sources

* `rendered manifests`
* `helm diff output`
* `values files`
* `chart version deltas`
* `lint results`
* `deployed release state`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Helm CLI in CI; VCS PR comments

## ✅ Expected Benefits

* Upgrade failures caught before they hit the cluster.
* Consistent best-practice enforcement across all charts.
* Faster, less scary chart adoption for new services.

## 🔒 Safety & Guardrails

* Rendered manifests may embed secret values from values files: render with redacted/placeholder secrets.
* Keep vendor chart analysis within approved providers or local models.

## 🚀 Future Implementation

* Auto-upgrade PRs for vendor chart bumps with generated migration notes.
* Fleet view: which deployments still run charts with known risky patterns.

## 🔗 Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [38 · AI Kubernetes Security Analyzer](../38-ai-kubernetes-security-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
