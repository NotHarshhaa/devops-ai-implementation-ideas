# AI Terraform Reviewer — Architecture

> Review every Terraform pull request like a senior platform engineer: safety, cost, conventions, and drift risk explained line by line.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

On every PR touching `.tf` files, the reviewer runs a speculative plan in an ephemeral runner, parses the JSON plan, fetches scanner findings and cost estimates, and hands the package to an LLM that writes a structured review: summary, risk items, convention violations, and inline HCL suggestions. Managed alternatives (CodeRabbit, Greptile, Qodo) can cover the generic-review layer, with this custom pass adding Terraform-plan-specific depth.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| PR trigger | GitHub/GitLab webhook filtering `.tf` paths |
| Plan runner | ephemeral CI job: `init`, `plan -out`, `show -json` with scoped credentials and no apply rights |
| Plan parser | converts JSON plan into per-resource action summaries and attribute-level diffs |
| Enrichment layer | scanner results, Infracost estimates, policy (OPA) results, org conventions via retrieval |
| LLM reviewer | produces structured review JSON: risks, conventions, cost notes, suggested HCL |
| PR publisher | summary comment + line-anchored annotations via the VCS API |
| Feedback loop | dismissed-finding tracking to reduce false positives |

## 4. Data Flow

1. A PR webhook triggers an ephemeral plan job with no apply permissions.
2. The parser turns the plan JSON into a compact per-resource change summary (create/replace/delete + attribute diffs).
3. Scanner and cost data plus org conventions are attached as structured context.
4. The LLM returns a severity-ranked review; every claim references a specific resource and attribute.
5. Comments are posted inline; a risk badge (none/minor/critical) is set on the PR.
6. Reviewer feedback is recorded and used to calibrate future noise.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `terraform plan JSON`
* ``.tf` diff`
* `module source and registry metadata`
* `scanner findings`
* `cost estimates`
* `org conventions (naming, tagging, module policy)`

## 7. Human-in-the-Loop & Approval

The reviewer only comments and (optionally) labels. Apply and merge remain human decisions guarded by CODEOWNERS; 'critical' findings are advisory blocks, not hard locks, until the team builds trust.

## 8. Security Considerations

* Plan jobs use short-lived, read-mostly cloud credentials and can never apply.
* State and plan data can contain secret values (sensitive attributes); keep plan processing inside your boundary and prefer self-hosted models for regulated accounts.
* The LLM output is advisory: never let review comments alone unlock anything; keep policy-as-code as the hard gate.
* Log every plan context package sent to external providers, with a size cap and redaction pass.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [21 · AI Terraform Plan Explainer](../21-ai-terraform-plan-explainer/README.md)
- [23 · AI IaC Security Analyzer](../23-ai-iac-security-analyzer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../45-ai-pull-request-infrastructure-reviewer/README.md)
