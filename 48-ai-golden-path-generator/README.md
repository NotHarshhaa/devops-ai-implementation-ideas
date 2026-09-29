# 48 · AI Golden Path Generator

> Turn your best repo into the platform's next golden path: analyze what great looks like and generate the template, docs, and guardrails.

![Area](https://img.shields.io/badge/Area-Platform%20Engineering-blueviolet) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏢 Platform Engineering |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Backstage scaffolder / Cookiecutter / Copier · Exemplar repos · OPA / Kyverno · CI |

---

## 📌 Problem

Golden paths (opinionated templates for 'the blessed way to build a service here') are powerful but expensive: platform teams must distill patterns from real repos into templates by hand.

* Great patterns live in exemplary repos, not in templates; codification lags reality by years.
* Template authoring (Cookiecutter/Backstage scaffolder) is meticulous, thankless work.
* Templates age as fast as the practices they encode.
* Teams fork templates the moment they feel restrictive, fragmenting standards.

**Why it matters:** More, fresher golden paths mean faster compliant service creation — the core platform-engineering promise.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Pattern extraction | analyzes exemplary repos to extract the de-facto standard: structure, CI, manifests, testing, ops hooks |
| Template synthesis | generates scaffolder/cookiecutter templates with parameterization and sane defaults |
| Guardrail derivation | proposes the policy-as-code checks that keep paths compliant |
| Maintenance diffing | when exemplars evolve, proposes template updates |

## 💡 Proposed Solution

A golden-path factory: point it at the reference repo(s) and the template framework; it analyzes, drafts the template with documentation, and proposes the guardrails. Platform engineers review and adopt; template drift is monitored by diffing exemplars against templates over time.

### Workflow

1. **Select** — choose exemplar repo(s) and target template framework
2. **Extract** — identify the repeatable pattern vs. repo-specific detail
3. **Generate** — template files, parameterization, docs, example output
4. **Guardrail** — propose Kyverno/OPA checks enforcing the path
5. **Maintain** — drift detection between exemplars and template over time

**Human-in-the-loop:** Platform engineers review every template as code. The factory accelerates authoring; it doesn't decide standards.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Exemplar repo selection                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Pattern extraction (structure · CI · ops)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Template synthesis (scaffolder · cookiecutter)     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Guardrail proposals (OPA · Kyverno)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Drift monitoring over time                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Backstage scaffolder / Cookiecutter / Copier | template targets |
| Exemplar repos | pattern sources |
| OPA / Kyverno | guardrail targets |
| CI | template smoke tests |

## 📥 Context & Data Sources

* `exemplar repo structure and CI`
* `org standards and scorecards`
* `existing templates`
* `platform policies`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS (read exemplars; PR for templates)
* Template rendering test harness

## ✅ Expected Benefits

* Golden paths multiply without proportional platform-team cost.
* Templates stay current with real practice.
* Guardrails and templates arrive together.

## 🔒 Safety & Guardrails

* Templates must embed security defaults (no secrets, least-privilege scaffolding) — review for that specifically.
* Never extract org-internal identifiers/secrets into shareable templates.

## 🚀 Future Implementation

* Template eval suite: spin up generated services in CI to catch template rot.
* Cross-org template exchange with sanitization review.

## 🔗 Related Ideas

- [47 · AI Internal Developer Platform Assistant](../47-ai-internal-developer-platform-assistant/README.md)
- [49 · AI Service Catalog Assistant](../49-ai-service-catalog-assistant/README.md)
- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
