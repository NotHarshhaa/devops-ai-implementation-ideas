# 42 · AI Dependency Risk Analyzer

> Decide on dependency alerts fast: is this vulnerable dependency actually used, what's the upgrade path, and what breaks?

![Area](https://img.shields.io/badge/Area-DevSecOps-red) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔐 DevSecOps |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Dependabot / Renovate / Snyk · GitHub / GitLab · CI · OSV / GitHub Advisory DB |

---

## 📌 Problem

Dependabot and friends file endless dependency alerts and PRs; teams bulk-dismiss them because evaluating each one properly takes longer than they have.

* Vulnerability alerts lack usage context: the vulnerable function may never be called.
* Upgrade PRs can break builds/runtimes; verification burden falls on already-busy teams.
* Major-version jumps (framework upgrades) are projects, not PRs, and never get scheduled.
* License and maintenance-risk signals (unmaintained, hijacked packages) aren't surfaced at all.

**Why it matters:** Unmanaged dependency risk accumulates silently; a triaged, explained queue makes it manageable without heroics.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Usage-aware triage | checks whether the vulnerable code path is referenced in the repo before escalating severity |
| Upgrade-path planning | for each alert: direct bump, interim step, or major-upgrade project — with breaking-change notes |
| Ecosystem-risk briefing | maintainer health, license issues, and suspicious-version signals for key dependencies |
| Batch strategy | groups related upgrades to minimize churn and CI cycles |

## 💡 Proposed Solution

A triage layer over dependency alerts: each alert is evaluated against the repo's actual code usage, upgrade feasibility is assessed (changelog/diff summaries), and teams receive a short, explained queue — trivial bumps as auto-prepared PRs, risky ones as scoped proposals with migration notes.

### Workflow

1. **Ingest** — alerts and PRs from Dependabot/Renovate/Snyk
2. **Assess usage** — search repo for references to vulnerable APIs/classes
3. **Plan upgrade** — changelog/diff-informed path; breaking-change summary
4. **Deliver** — explained queue: auto-PR (safe), guided PR (medium), project ticket (major)
5. **Verify** — CI results feed back; flaky/broken upgrades get annotated

**Human-in-the-loop:** Humans merge everything. The system's contribution is ranked, explained, pre-worked queue items.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Dependency alerts ingest (Dependabot · Renovate)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Repo usage analysis                                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Upgrade path + breaking-change summary             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explained queue · tiered PRs                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ CI feedback loop                                   │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Dependabot / Renovate / Snyk | alert sources |
| GitHub / GitLab | alerts, PRs, code search |
| CI | verification runs |
| OSV / GitHub Advisory DB | vulnerability data |

## 📥 Context & Data Sources

* `alert details and CVEs`
* `repo code usage of affected APIs`
* `changelogs and diffs`
* `build/test status`
* `dependency maintenance signals`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Code search (read)
* PR creation
* CI trigger (read results)

## ✅ Expected Benefits

* Dependency risk handled in minutes per alert instead of bulk dismissal.
* Major upgrades become scoped projects with real migration notes.
* Audit-ready record of why each dependency decision was made.

## 🔒 Safety & Guardrails

* Supply-chain caution: generated upgrade PRs are still code from outside — CI, signing, and review rules apply fully.
* Pinned versions and lockfile integrity checks remain mandatory.

## 🚀 Future Implementation

* Organization-wide dependency dashboard: risk concentration by ecosystem and team.
* Proactive advisory: warn before adopting dependencies with risk signals.

## 🔗 Related Ideas

- [37 · AI Container Vulnerability Explainer](../37-ai-container-vulnerability-explainer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)
- [07 · AI GitHub Actions Debugger](../07-ai-github-actions-debugger/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
