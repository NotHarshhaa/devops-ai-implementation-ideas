# 45 · AI Pull Request Infrastructure Reviewer

> Infra-aware PR review: catches the deployment, config, and dependency consequences of code changes before merge.

![Area](https://img.shields.io/badge/Area-Developer%20Experience-yellow) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🧑‍💻 Developer Experience |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub / GitLab · CodeRabbit / Greptile / Qodo · Config/secret managers · Service catalog |

---

## 📌 Problem

Code review catches code problems; nobody systematically reviews PRs for their infrastructure consequences — the new env var that isn't set in prod, the dependency that changes startup behavior.

* PRs add config keys, dependencies, and endpoints whose deployment implications are invisible in the diff.
* Reviewers don't have the deployment context (which envs exist, which vars are set) at review time.
* Infrastructure-adjacent mistakes (missing migration, incompatible config) pass review and fail in staging/prod.
* Generic AI reviewers don't know your deployment topology.

**Why it matters:** Catching deploy-breaking PRs at review time removes an entire class of staging surprises and rollbacks.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Config-aware review | compares new env vars/flags/ports against actual environment configs |
| Dependency consequence check | flags dependency changes with runtime/size/security implications |
| Deployment-contract review | checks that changes respect the deployment method (migrations needed? rolling restart safe? health endpoints present?) |
| Targeted questions | asks the author the two questions a senior reviewer would |

## 💡 Proposed Solution

A PR reviewer specialized for infrastructure awareness: it reads the diff plus deployment configs, env inventories, and org conventions, then comments on deployment consequences. Complements generic AI reviewers (CodeRabbit/Greptile/Qodo — use those for general code review) with deployment-topology knowledge they don't have.

### Workflow

1. **Diff** — parse the PR for config, dependency, and endpoint changes
2. **Enrich** — environment configs, deploy manifests, service catalog context
3. **Reason** — deployment-consequence analysis per change class
4. **Comment** — targeted inline comments and questions
5. **Learn** — false-positive feedback tunes rules and prompts

**Human-in-the-loop:** Comments only; merge gates stay human and policy-driven.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ PR opened / updated                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Diff classifier (config · deps · endpoints)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deployment context enrichment                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← envs · manifests · catalog
┌────────────────────────────────────────────────────┐
│ Consequence review + inline comments               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human review · merge                               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub / GitLab | PR webhooks and comments |
| CodeRabbit / Greptile / Qodo | complementary generic review layer |
| Config/secret managers | env inventory (metadata only) |
| Service catalog | deployment topology |

## 📥 Context & Data Sources

* `PR diff`
* `deployment manifests`
* `environment variable inventories`
* `dependency manifests`
* `service catalog entry`
* `org conventions`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS PR API (comments)
* Config inventory (read)

## ✅ Expected Benefits

* Fewer deploy-breaking surprises; review catches what CI can't.
* Institutional deployment knowledge applied to every PR.
* Layered with generic reviewers for full coverage.

## 🔒 Safety & Guardrails

* Env inventories must be metadata-only (names/types, never values).
* Reviewer comments are public to the repo: no sensitive data in explanations.

## 🚀 Future Implementation

* Suggestion patches for mechanical fixes (add missing env var declaration).
* Cross-PR awareness: warn when two PRs together exceed a resource/deployment budget.

## 🔗 Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [42 · AI Dependency Risk Analyzer](../42-ai-dependency-risk-analyzer/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
