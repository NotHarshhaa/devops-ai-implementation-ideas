# 09 · AI Release Summary Generator

> Turn a release's commits and PRs into audience-tailored notes: engineering changelog, product highlights, and customer-facing summary.

![Area](https://img.shields.io/badge/Area-CI%2FCD-blue) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔄 CI/CD |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub / GitLab · Slack / Teams · Confluence / Notion |

---

## 📌 Problem

Release notes are a chore, so they're skipped or useless: a wall of merge-commit titles nobody can act on.

* Squashed and dependabot commits hide the actual changes; humans must reconstruct intent from dozens of PRs.
* Different audiences need different notes (engineers vs. support vs. customers) and nobody has time to write four versions.
* Breaking changes and migration steps get buried, causing avoidable upgrade pain.

**Why it matters:** Good release notes reduce support load, smooth upgrades, and make releases communicable events instead of silent version bumps.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Change synthesis | groups commits/PRs into themes (features, fixes, deps, breaking) using titles, bodies, and diffs |
| Audience rewriting | produces parallel versions: technical changelog, product highlights, customer-facing summary |
| Breaking-change extraction | detects API/config/behavior changes and drafts migration notes |
| Credit and attribution | links PRs and authors; preserves conventional-commit categorization |

## 💡 Proposed Solution

On tag/release, the generator collects PRs, commit messages, linked issues, and labels for the release range, then produces structured notes per audience into the GitHub Release, a changelog file (PR), and a Slack announcement draft — with humans editing before anything customer-facing goes out.

### Workflow

1. **Range** — collect PRs/issues/commits between tags (or since last deploy)
2. **Enrich** — PR bodies, labels, linked issues, semantic-version bump type
3. **Draft** — LLM drafts themed, audience-specific notes; flags breaking changes with migration steps
4. **Publish** — GitHub Release body + changelog PR + Slack draft
5. **Iterate** — humans edit; diffs between draft and final feed style evals

**Human-in-the-loop:** All outputs are drafts. Customer-facing text requires explicit human approval by default.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Tag / release event                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ VCS change collector (PRs · issues)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM synthesis (themed · per-audience)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Release notes · changelog PR · Slack draft         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human edit → publish                               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub / GitLab | releases, compare ranges, PR metadata |
| Slack / Teams | announcement drafts |
| Confluence / Notion | optional wiki changelog sync |

## 📥 Context & Data Sources

* `PR titles/bodies/labels`
* `linked issues`
* `commit messages`
* `semantic version delta`
* `past release notes style`
* `CODEOWNERS for review routing`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS APIs (read) + release publishing (write)

## ✅ Expected Benefits

* Every release gets usable notes at near-zero marginal cost.
* Breaking changes surface with migration guidance instead of surprising users.
* Consistent voice and structure across teams.

## 🔒 Safety & Guardrails

* Internal-only notes must not leak to public changelogs: separate templates and explicit approval for external publication.
* Strip internal hostnames/ticket URLs from customer-facing drafts.

## 🚀 Future Implementation

* Auto-translate notes for multi-language products.
* Release-comms assistant: draft email/blog/social variants from the same structured change data.

## 🔗 Related Ideas

- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [08 · AI Deployment Risk Analyzer](../08-ai-deployment-risk-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
