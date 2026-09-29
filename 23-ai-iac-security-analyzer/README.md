# 23 · AI IaC Security Analyzer

> Triage IaC security findings with context: which of these 40 scanner alerts actually matter, and what's the fix?

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | tfsec / Checkov / KICS / Semgrep · PR flow (GitHub/GitLab) · Cloud APIs · Security Hub / Defender for Cloud |

---

## 📌 Problem

IaC scanners generate floods of findings with generic severities; real risk depends on context (exposure, data sensitivity, compensating controls) that scanners don't model.

* High-volume findings cause alert fatigue; genuinely dangerous ones get lost in the queue.
* Severity is static (a public S3 bucket is 'critical' even when encrypted, versioned, and access-logged).
* Fixes require understanding intent of the resource, not just flipping an attribute.
* Suppression culture: broad ignores accumulate and hide real risk.

**Why it matters:** IaC is where security fixes are cheapest — if teams can find the 2 findings that matter among the 40.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Contextual triage | combines scanner findings with resource context (exposure, data class, controls) to re-rank by real risk |
| Exploitability reasoning | explains the actual attack path a misconfiguration enables |
| Fix generation | produces corrected HCL preserving resource intent |
| Suppression review | audits existing ignores for staleness and blanket abuse |

## 💡 Proposed Solution

On PRs and scheduled scans, run tfsec/Checkov/KICS as usual, then let an LLM triage: merge duplicates, re-rank with resource context, explain attack paths in plain language, and suggest precise fixes. Findings become a small, honest list instead of a wall.

### Workflow

1. **Scan** — run scanners on PR and schedule (nightly full-repo)
2. **Contextualize** — attach resource purpose, exposure, environment, and data classification from catalog/tags
3. **Triage** — LLM re-ranks, dedupes, and explains top findings with attack-path narratives
4. **Fix** — inline HCL suggestions on the PR; verified by re-scan
5. **Audit** — monthly suppression review with auto-flagged stale ignores

**Human-in-the-loop:** Security engineers set triage policy; PR findings are advisory until teams opt into gates on the top severity class.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Scanners (tfsec · Checkov · KICS)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Resource context enrichment                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← catalog · tags
┌────────────────────────────────────────────────────┐
│ LLM triage (dedupe · re-rank · explain)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Inline fixes on PR                                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Suppression audit (monthly)                        │
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
| tfsec / Checkov / KICS / Semgrep | finding sources |
| PR flow (GitHub/GitLab) | comments and gates |
| Cloud APIs | exposure/context enrichment |
| Security Hub / Defender for Cloud | aggregate findings sync |
| Data catalog / tags | data sensitivity context |

## 📥 Context & Data Sources

* `scanner findings`
* `resource configuration`
* `network exposure`
* `environment and data classification`
* `existing suppressions`
* `past incident history for the service`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Scanners (CI-internal)
* VCS PR comments
* Cloud read APIs (context)

## ✅ Expected Benefits

* Security signal rises above noise: short lists, real explanations.
* Fixes are precise and intent-preserving.
* Suppression debt becomes visible and managed.

## 🔒 Safety & Guardrails

* The LLM's re-ranking must never auto-dismiss findings silently — dismissals are recorded with rationale and reviewable.
* Policy-as-code stays the enforcement layer; this system advises humans who then set policy.

## 🚀 Future Implementation

* Auto-fix PRs for mechanical findings (encryption flags, public-access blocks).
* Risk trending: real-risk score per service over time for security leadership.

## 🔗 Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [38 · AI Kubernetes Security Analyzer](../38-ai-kubernetes-security-analyzer/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
