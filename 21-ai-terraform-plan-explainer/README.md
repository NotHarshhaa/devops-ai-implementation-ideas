# 21 · AI Terraform Plan Explainer

> Before you approve: a plain-language, per-resource explanation of what the plan will do, why, and what could go wrong.

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Terraform / OpenTofu · Terraform Cloud / Spacelift / env0 / Atlantis · GitHub / GitLab |

---

## 📌 Problem

`terraform plan` output is the most consequential unread document in infrastructure: hundreds of lines of +/-/~/-/+ symbols whose meaning is blast radius.

* Reviewers approve plans they haven't fully parsed; the -/+ replacement hiding a database replacement is the classic accident.
* Why-did-this-change questions (drift, dependency side effects) require state archaeology.
* Non-Terraform-fluent stakeholders (security, app owners) can't participate in reviewing infra changes.

**Why it matters:** Plan misreads are a leading cause of self-inflicted infra incidents; comprehension is the cheapest control available.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Plan narration | translates the JSON plan into plain language per resource: what changes, why, and what it implies |
| Danger highlighting | escalates replacements, deletions, and force-new attributes with clear warnings |
| Drift explanation | identifies out-of-band changes being 'corrected' and whether that's expected |
| Audience adaptation | technical version for engineers; summary for approvers and auditors |

## 💡 Proposed Solution

A companion to any plan flow (CI PR check, Atlantis, TFC): parse `terraform show -json`, and produce an explainer — summary block, per-resource table, danger callouts, and a 'why' section traced to source lines or drift. Posted as the PR comment humans actually read before clicking approve.

### Workflow

1. **Parse** — JSON plan from the CI plan step
2. **Analyze** — group actions; detect replacements/deletions; trace causes (diff vs. state vs. provider change)
3. **Explain** — LLM writes the structured explainer with danger callouts
4. **Publish** — PR comment/check summary; optional approval checklist for high-risk plans

**Human-in-the-loop:** Pure explanation. Approval remains human; the explainer makes that approval informed.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Plan JSON from CI / TFC / Atlantis                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Action analyzer (replacements · deletions · drift) │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM narrator (per-resource · audience-tuned)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR explainer + danger callouts                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Informed human approval                            │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Terraform / OpenTofu | plan JSON source of truth |
| Terraform Cloud / Spacelift / env0 / Atlantis | run integration |
| GitHub / GitLab | PR comments and checks |

## 📥 Context & Data Sources

* `plan JSON`
* `state diffs for drift tracing`
* `configuration diff`
* `provider version changes`
* `resource criticality tags`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Terraform & OpenTofu CLI (plan JSON parser)
* VCS PR Comments & Review API (GitHub / GitLab MCP)
* Terraform Cloud / Spacelift Run API (read)

## ✅ Expected Benefits

* Approvals become informed decisions with minimal extra effort.
* Replacements and deletions stop sneaking through.
* Drift gets explained instead of silently 'fixed'.

## 🔒 Safety & Guardrails

* Plans can expose sensitive attributes: mask before model calls; local model option for sensitive workspaces.
* Keep explainer output free of secret values — it quotes structure, not contents.

## 🚀 Future Implementation

* Interactive mode: 'what happens to X?' drill-downs from the PR comment.
* Blast-radius mapping: overlay plan changes on the dependency graph.

## 🔗 Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [20 · AI Terraform Error Analyzer](../20-ai-terraform-error-analyzer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
