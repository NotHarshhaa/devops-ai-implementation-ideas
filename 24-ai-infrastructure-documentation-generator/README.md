# 24 · AI Infrastructure Documentation Generator

> Keep infrastructure docs alive: auto-generate and refresh module docs, diagrams, and examples from the code itself.

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Terraform / OpenTofu / Helm / Kustomize repos · terraform-docs · GitHub / GitLab · Backstage / TechDocs |

---

## 📌 Problem

Infrastructure documentation is written once and rots immediately; the code changes, the docs don't, and new engineers inherit folklore.

* Modules lack current docs: inputs, outputs, examples, and caveats live in reviewers' heads.
* Architecture diagrams drift from reality within months.
* Onboarding questions repeat because knowledge isn't written down where people look.
* Manual docs are a chore that everyone defers.

**Why it matters:** Accurate docs compound: faster onboarding, safer changes, fewer repeat questions — and generation makes accuracy nearly free.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Doc generation | README per module: inputs/outputs, resources, examples, caveats — derived from code and schema |
| Diagram synthesis | Mermaid architecture/sequence diagrams from resource definitions and dependencies |
| Drift detection | flags docs vs. code divergence and opens refresh PRs |
| Narrative enrichment | writes the 'why' sections from commit history, RFCs, and ADRs via retrieval |

## 💡 Proposed Solution

A scheduled/push-based generator walks IaC repos, extracts structure (via terraform-docs-style parsing plus LLM enrichment), and maintains docs as PRs — never direct writes. Diagrams regenerate on structural change; narrative sections update only with human review to preserve voice.

### Workflow

1. **Extract** — parse modules/variables/outputs/resources; collect examples and tests
2. **Generate** — produce/update README, Mermaid diagrams, and usage examples
3. **Compare** — diff against existing docs; detect drift
4. **Propose** — doc-refresh PRs with clear scope; auto-merge for mechanical sections (optional)
5. **Enrich** — retrieval adds 'why' context from ADRs/commits where missing

**Human-in-the-loop:** Doc PRs reviewed like code; mechanical regeneration can auto-merge under label policy.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ IaC repo scan (scheduled · push)                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Structure extraction (modules · vars · outputs)    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Generator (docs · Mermaid · examples)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Drift diff → refresh PRs                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human review · auto-merge label                    │
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
| Terraform / OpenTofu / Helm / Kustomize repos | targets |
| terraform-docs | deterministic sections to build on |
| GitHub / GitLab | PR publishing |
| Backstage / TechDocs | docs portal sync |
| Mermaid / diagrams.net | diagram formats |

## 📥 Context & Data Sources

* `module code and schemas`
* `examples and tests`
* `commit history and ADRs`
* `existing docs`
* `module registry metadata`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Terraform-docs & HCL Schema Parser
* Mermaid Diagram Engine
* VCS PR Creation & Review API (GitHub / GitLab MCP)
* Backstage / TechDocs Publishing API

## ✅ Expected Benefits

* Docs that are actually current — because they're generated.
* Onboarding gets real answers instead of archaeology.
* Diagrams regenerate with the architecture.

## 🔒 Safety & Guardrails

* Never render secret values in docs; schema-only extraction with redaction tests in CI.
* Public-repo publishing needs an explicit allowlist per module.

## 🚀 Future Implementation

* Queryable docs: chat over your infra repos ('which modules create KMS keys?').
* Runbook hooks: link each module to its operational runbooks automatically.

## 🔗 Related Ideas

- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [22 · Natural Language → Terraform](../22-natural-language-to-terraform/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
