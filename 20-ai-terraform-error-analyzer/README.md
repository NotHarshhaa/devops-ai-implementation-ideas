# 20 · AI Terraform Error Analyzer

> Translate cryptic Terraform failures — state locks, provider API errors, drift conflicts — into cause and fix.

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Terraform / OpenTofu · Terraform Cloud / Spacelift / env0 / Atlantis · CI (GitHub Actions/GitLab) · Slack |

---

## 📌 Problem

Terraform errors are legible to its authors and opaque to everyone else: state locks, serialization conflicts, provider quirks, and refresh errors each need different handling.

* Errors reference internals (state addresses, provider internals) that don't say what to do.
* State-related failures scare people into dangerous workarounds (manual state edits).
* Provider API rate limits and auth errors look like code failures.
* Plan-time vs. apply-time errors have different root causes but similar-looking output.

**Why it matters:** Every cryptic Terraform error stalls a deployment until someone experienced decodes it — or worse, someone improvises.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Error classification | state lock, refresh/drift, provider auth/quota, config syntax, dependency cycle, API change |
| Safe-path guidance | explains the sanctioned fix (unlock, re-plan, import, provider pin) and warns against unsafe ones |
| Context retrieval | pulls the relevant state snippet, provider version, and recent changes to the resource |
| Fix drafting | generates the corrected HCL, CLI command, or config change |

## 💡 Proposed Solution

Wrap Terraform failure points (CI apply jobs, Atlantis, Terraform Cloud runs) with an analyzer that captures stderr, state metadata, and provider config, then returns a diagnosis with the safe remediation path and rationale. Delivered as a CI annotation plus Slack card.

### Workflow

1. **Capture** — on failed plan/apply: stderr, exit code, workspace, provider versions, state backend info
2. **Enrich** — relevant state resource snippet (redacted), recent runs, provider release notes via retrieval
3. **Diagnose** — classify and explain; rank possible causes for ambiguous errors
4. **Recommend** — the safe fix path with commands/HCL and explicit warnings on risky ones
5. **Deliver** — CI annotation + Slack with links to the run

**Human-in-the-loop:** Advisory. State surgery is explicitly flagged as human-expert territory with a checklist, never automated.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Failed plan / apply (CI · TFC · Atlantis)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Error capture + state/provider context             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM diagnosis (error taxonomy)                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Safe fix path + warnings                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ CI annotation · Slack card                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Terraform / OpenTofu | plan/apply failure capture |
| Terraform Cloud / Spacelift / env0 / Atlantis | run APIs as trigger and context |
| CI (GitHub Actions/GitLab) | annotations |
| Slack | team notifications |

## 📥 Context & Data Sources

* `error output`
* `run/workspace metadata`
* `provider versions`
* `redacted state snippets`
* `recent runs touching the same resources`
* `provider changelogs`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* CI/TFC APIs (read)

## ✅ Expected Benefits

* Instant decoding of Terraform's most confusing failure classes.
* Fewer risky state manipulations; sanctioned paths become the default.
* Recurring provider issues get documented automatically.

## 🔒 Safety & Guardrails

* State may contain sensitive values: redact rigorously; prefer local models for state-adjacent context.
* Analyzer credentials are read-only; it cannot unlock, edit state, or apply.

## 🚀 Future Implementation

* Pre-flight mode: predict errors from the plan before apply (quota, drift, lock risk).
* Provider-upgrade advisor: map deprecated syntax across the codebase with fix PRs.

## 🔗 Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [21 · AI Terraform Plan Explainer](../21-ai-terraform-plan-explainer/README.md)
- [23 · AI IaC Security Analyzer](../23-ai-iac-security-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
