# 43 · AI DevOps Documentation Generator

> Generate and maintain the DevOps documentation nobody has time to write: pipeline guides, environment docs, operational how-tos — from the actual repo and infra.

![Area](https://img.shields.io/badge/Area-Developer%20Experience-yellow) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🧑‍💻 Developer Experience |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub / GitLab · CI configs (Actions/GitLab/Jenkins) · Backstage / TechDocs / wiki · Slack / Teams |

---

## 📌 Problem

Every team's most-viewed internal docs are their most stale: the deploy guide, the environment variables list, the 'how to run this locally' page.

* DevOps docs are written during onboarding urgency and never updated after.
* The truth (pipelines, manifests, dockerfiles, CI configs) changes weekly; docs can't keep up manually.
* New joiners ask the same setup questions every month.
* Operational knowledge (how to rollback, where logs live) lives in chat scrollback.

**Why it matters:** Accurate DevOps docs are a force multiplier for onboarding and operations — and generation makes them maintainable at near-zero cost.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Doc synthesis | pipeline/deploy/environment docs generated from CI configs, manifests, and scripts |
| Change-driven refresh | docs regenerate (as PRs) when the underlying configs change |
| How-to drafting | operational guides (rollback, debug, scale) drafted from pipelines, runbooks, and history |
| Q&A mode | chat over the repo+docs for instant answers with citations to source files |

## 💡 Proposed Solution

A doc service that watches infrastructure-relevant repos: on meaningful changes it regenerates affected docs and opens refresh PRs; on demand it answers questions with citations. Focus on the high-traffic pages: local setup, deploy guide, environment/variables, and operations how-tos.

### Workflow

1. **Index** — parse CI configs, Dockerfiles, manifests, scripts, and existing docs
2. **Detect** — map which doc pages depend on which config files
3. **Refresh** — on change, regenerate affected sections and open doc PRs
4. **Answer** — chat Q&A with file-level citations
5. **Improve** — unanswered questions become doc-gap tickets

**Human-in-the-loop:** Doc PRs are reviewed; auto-merge only for purely mechanical sections under label policy.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Repo + CI config indexing                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc-dependency mapping                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Regeneration on change → PRs                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Chat Q&A with citations                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Doc-gap tickets from questions                     │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub / GitLab | webhooks, PRs, code search |
| CI configs (Actions/GitLab/Jenkins) | primary sources |
| Backstage / TechDocs / wiki | publishing targets |
| Slack / Teams | Q&A interface |

## 📥 Context & Data Sources

* `CI pipeline definitions`
* `Dockerfiles and manifests`
* `scripts and Makefiles`
* `existing docs`
* `git history for 'why' context`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS (read; PR write)
* CI config parsing

## ✅ Expected Benefits

* High-traffic docs stay current automatically.
* Onboarding questions answered instantly with citations.
* Doc gaps become visible and fixable.

## 🔒 Safety & Guardrails

* Never document secrets (even internal-only pages should reference the secret manager).
* Q&A respects repo access permissions; no cross-repo leakage.

## 🚀 Future Implementation

* Auto-generated architecture decision records from PR discussions.
* Onboarding path generator: personalized first-week checklist per role.

## 🔗 Related Ideas

- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)
- [22 · Natural Language → Terraform](../22-natural-language-to-terraform/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
