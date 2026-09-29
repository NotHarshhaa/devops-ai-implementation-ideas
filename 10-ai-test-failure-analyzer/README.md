# 10 · AI Test Failure Analyzer

> Classify test failures as bug, flake, or environment in seconds — with evidence, retry policy, and the owning team.

![Area](https://img.shields.io/badge/Area-CI%2FCD-blue) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔄 CI/CD |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub Actions / GitLab CI / Jenkins · Issue trackers · Playwright / Cypress / pytest · Dashboards |

---

## 📌 Problem

A red test suite is ambiguous: is it a real regression, a flaky test, or a broken environment? Teams burn triage time and lose trust in CI answering wrong.

* Flaky tests erode trust; engineers reflexively re-run instead of investigating.
* Environment failures (timeouts, services down, resource limits) get filed as product bugs.
* Ownership is unclear: failing test in a shared library, who investigates?
* Quarantine lists go stale; flaky tests hide for years.

**Why it matters:** Test-failure triage is pure overhead multiplied by every commit; accurate classification directly restores trust in CI and shortens feedback loops.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Failure classification | bug vs. flake vs. environment vs. test-debt, with confidence and evidence from stack traces and history |
| Flake detection | compares failure history, pass-rate variance, and timing to quantify flakiness |
| Root-cause hints | points to the commit or change most likely responsible (test-aware blame) |
| Routing | assigns to the owning team via code ownership and test maps |

## 💡 Proposed Solution

The analyzer consumes JUnit/pytest/jest results from CI (or a test-reporting service), enriches each failure with its history and the triggering diff, and posts a classification card: cause, evidence, suggested action (fix, retry policy, quarantine with expiry, revert). Feeds dashboards for flake trends and per-team failure debt.

### Workflow

1. **Ingest** — test results (JUnit XML, TRX, JSON) from CI artifacts or reporting service
2. **Enrich** — failure history for the test, triggering commits, run environment metadata
3. **Classify** — LLM + heuristics produce class, confidence, evidence, and action
4. **Route** — open/comment on issues for the owning team; attach to the PR
5. **Track** — quarantine entries with expiry; flake dashboards; classification accuracy feedback

**Human-in-the-loop:** Classifications are advisory; auto-quarantine only after a team opts in and always with expiry and owner.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ CI test results (JUnit · TRX · JSON)               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ History & diff enrichment                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Classifier (LLM + heuristics)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← bug · flake · env · debt
┌────────────────────────────────────────────────────┐
│ PR card · issue routing                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Quarantine (expiring) · dashboards                 │
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
| GitHub Actions / GitLab CI / Jenkins | test artifacts and PR comments |
| Issue trackers | Jira/Linear routing |
| Playwright / Cypress / pytest | rich reporters with traces and screenshots |
| Dashboards | flake and failure-debt trends (Grafana) |

## 📥 Context & Data Sources

* `stack traces and assertion diffs`
* `per-test failure history`
* `triggering commit/diff`
* `runner environment info`
* `test ownership map`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS read APIs; issue tracker (create/comment)

## ✅ Expected Benefits

* Trust in CI: red means investigate, with the investigation already started.
* Flaky debt becomes visible and shrinkable with expiry-based quarantines.
* Right team gets the failure first time.

## 🔒 Safety & Guardrails

* Test output can embed fixtures/secrets: redact before model calls.
* Quarantine must not become a black hole: expiries and owner reviews are mandatory.

## 🚀 Future Implementation

* Auto-flaky-fix agent: propose determinism fixes (async waits, clock injection) as PRs.
* Cross-repo flake correlation for shared libraries.

## 🔗 Related Ideas

- [01 · AI Pipeline Failure Analyzer](../01-ai-pipeline-failure-analyzer/README.md)
- [07 · AI GitHub Actions Debugger](../07-ai-github-actions-debugger/README.md)
- [35 · AI Anomaly Investigation Agent](../35-ai-anomaly-investigation-agent/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
