# 03 · AI Terraform Reviewer

> Review every Terraform pull request like a senior platform engineer: safety, cost, conventions, and drift risk explained line by line.

![Area](https://img.shields.io/badge/Area-IaC-purple) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🏗️ IaC |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub / GitLab · Terraform / OpenTofu CLI · Checkov · tfsec · KICS · Infracost |

---

## 📌 Problem

Terraform changes are small diffs with enormous blast radius, and the humans reviewing them rarely have the full picture of what a plan will actually do in the cloud account.

* PRs show `.tf` diffs, but reviewers must mentally execute `terraform plan` to know what changes in real infrastructure.
* Security groups, IAM changes, deletions, and replacements hide inside plan output that nobody reads carefully.
* Static scanners (tfsec, Checkov) produce findings that lack business context, so they get ignored or blanket-suppressed.
* Org conventions (naming, tagging, module usage) live in wikis and tribal memory instead of the review loop.

**Why it matters:** A single unnoticed Terraform mistake can expose a database, delete a volume, or double a bill; review quality is the last line of defense.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Plan interpretation | translates `terraform show -json` plans into human summaries: what is created, replaced, destroyed, and why |
| Risk assessment | flags destructive actions, public exposure, IAM broadening, and tagged-for-deletion resources with severity |
| Convention checking | compares the change against org standards (modules, naming, tagging) retrieved from a knowledge base |
| Cost reasoning | combines Infracost-style estimates with the plan to explain monthly-impact of the change |
| Actionable comments | posts inline PR comments with suggested corrected HCL |

## 💡 Proposed Solution

On every PR touching `.tf` files, the reviewer runs a speculative plan in an ephemeral runner, parses the JSON plan, fetches scanner findings and cost estimates, and hands the package to an LLM that writes a structured review: summary, risk items, convention violations, and inline HCL suggestions. Managed alternatives (CodeRabbit, Greptile, Qodo) can cover the generic-review layer, with this custom pass adding Terraform-plan-specific depth.

### Workflow

1. **Trigger** — PR opened/updated with `.tf` changes
2. **Plan** — run `terraform plan` against a sandbox workspace using short-lived cloud credentials
3. **Parse** — extract resource actions, attribute diffs, and unknown values from the JSON plan
4. **Enrich** — add scanner findings (Checkov/tfsec/KICS), Infracost estimate, and org conventions from RAG
5. **Review** — LLM produces structured review with severities and suggested HCL
6. **Publish** — post the summary as a PR comment and inline annotations; block merge on critical items
7. **Track** — log which findings humans dismissed to tune noise over time

**Human-in-the-loop:** The reviewer only comments and (optionally) labels. Apply and merge remain human decisions guarded by CODEOWNERS; 'critical' findings are advisory blocks, not hard locks, until the team builds trust.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ PR touching .tf files                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Speculative terraform plan                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← sandbox creds
┌────────────────────────────────────────────────────┐
│ Plan JSON parser + scanners                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Conventions & cost enrichment                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← RAG
┌────────────────────────────────────────────────────┐
│ AI reviewer (structured output)                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Inline PR comments + risk summary                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human merge decision                               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub / GitLab | webhooks, PR comments, check runs, branch protection |
| Terraform / OpenTofu CLI | speculative plans in CI (Atlantis-style) |
| Checkov · tfsec · KICS | security findings passed as context |
| Infracost | cost deltas per resource |
| OPA / Sentinel | policy decisions the LLM explains rather than re-implements |
| Terraform Cloud / Spacelift / env0 | alternative: consume their plan APIs instead of self-running |

## 📥 Context & Data Sources

* `terraform plan JSON`
* ``.tf` diff`
* `module source and registry metadata`
* `scanner findings`
* `cost estimates`
* `org conventions (naming, tagging, module policy)`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* VCS PR API (comments, checks)
* Terraform plan output (read-only)
* Optional: cloud pricing APIs

## ✅ Expected Benefits

* Reviewers see real infrastructure impact, not just HCL diffs.
* Destructive and high-risk actions are systematically flagged instead of occasionally caught.
* Conventions are enforced where they change behavior — in review, not in a wiki.
* Faster review cycles: the boring 80% is pre-analyzed before a human looks.

## 🔒 Safety & Guardrails

* Plan jobs use short-lived, read-mostly cloud credentials and can never apply.
* State and plan data can contain secret values (sensitive attributes); keep plan processing inside your boundary and prefer self-hosted models for regulated accounts.
* The LLM output is advisory: never let review comments alone unlock anything; keep policy-as-code as the hard gate.
* Log every plan context package sent to external providers, with a size cap and redaction pass.

## 🚀 Future Implementation

* Auto-suggest corrected HCL as a PR patch (apply suggestion button).
* Drift detective: explain planned-vs-actual drift using state history.
* Module upgrade advisor: translate deprecated provider syntax across a fleet of repos.
* Tighten into a hard gate once false-positive rate is measured and acceptable.

## 🔗 Related Ideas

- [21 · AI Terraform Plan Explainer](../21-ai-terraform-plan-explainer/README.md)
- [23 · AI IaC Security Analyzer](../23-ai-iac-security-analyzer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
