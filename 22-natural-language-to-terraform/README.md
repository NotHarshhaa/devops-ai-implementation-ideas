# 22 · Natural Language → Terraform

> Describe the infrastructure you need in plain language; get a reviewed, standards-compliant Terraform module using your golden modules.

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Module registry (private registry / Git) · Backstage · GitHub / GitLab · Infracost |

---

## 📌 Problem

Engineers who know what they need (a queue with a dead-letter policy behind a private endpoint) still can't produce compliant Terraform without a platform engineer's help.

* Hand-written infra drifts from org standards (modules, tagging, security defaults).
* Platform teams become bottlenecks for routine requests.
* Generic LLM output doesn't know your naming, module registry, or guardrails.
* Copy-paste infra from AI chats is a governance nightmare.

**Why it matters:** Safe NL→IaC turns platform engineers into reviewers instead of ticket-takers, and keeps self-service inside guardrails.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Intent extraction | clarifying questions to pin down requirements (region, access, retention, env) |
| Golden-module composition | generates code that uses YOUR registered modules, not from-scratch HCL |
| Standards enforcement | naming, tagging, and security defaults applied automatically |
| Plan verification | runs plan in a sandbox so the user sees real impact before anything is proposed |

## 💡 Proposed Solution

A self-service assistant (web/CLI/Backstage plugin) that interviews the user briefly, composes Terraform from the org's module registry (retrieved via RAG), runs a speculative plan with cost estimate, and opens a PR with explanations. From-scratch HCL is a last resort behind policy checks.

### Workflow

1. **Request** — user describes need; assistant asks clarifying questions
2. **Compose** — retrieves matching golden modules; generates root module + tfvars per standards
3. **Verify** — sandbox `init`/`validate`/`plan` with cost estimate; iterate on errors
4. **Propose** — PR with rationale, plan summary, and cost; routed to platform review
5. **Learn** — accepted patterns feed back into the module library and prompts

**Human-in-the-loop:** Platform review on every PR (CODEOWNERS). The assistant never applies; it proposes.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ User intent (Backstage · CLI · web)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Clarifying questions                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Golden-module composition                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← RAG over registry
┌────────────────────────────────────────────────────┐
│ Sandbox plan + cost estimate                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR → platform review                               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Module registry (private registry / Git) | golden modules source |
| Backstage | self-service UX via scaffolder/plugin |
| GitHub / GitLab | PR flow |
| Infracost | cost estimates |
| Policy (OPA/Sentinel) | hard guardrails on generated code |

## 📥 Context & Data Sources

* `golden module docs and examples`
* `org standards (naming, tagging)`
* `similar past requests`
* `environment constraints`
* `plan output`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Module registry (read)
* VCS PR creation
* Terraform plan (sandbox)

## ✅ Expected Benefits

* Self-service without standards erosion.
* Platform team time shifts from writing to reviewing.
* Every request produces reusable, indexed patterns.

## 🔒 Safety & Guardrails

* Policy-as-code remains the hard gate regardless of how good the LLM output looks.
* Sandbox plans use scoped, expiring credentials; generated code is scanned (secrets/IaC misconfig) before PR.
* Prevent prompt-driven scope creep: the assistant can't request elevated permissions, only standard catalog items.

## 🚀 Future Implementation

* One-click import of existing console-created resources into generated modules.
* Drift-aware suggestions: 'you have an unmanaged S3 bucket matching this need — import instead?'

## 🔗 Related Ideas

- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)
- [24 · AI Infrastructure Documentation Generator](../24-ai-infrastructure-documentation-generator/README.md)
- [48 · AI Golden Path Generator](../48-ai-golden-path-generator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
