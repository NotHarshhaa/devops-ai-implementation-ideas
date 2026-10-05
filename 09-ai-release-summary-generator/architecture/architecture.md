# AI Release Summary Generator — Architecture

> Turn a release's commits and PRs into audience-tailored notes: engineering changelog, product highlights, and customer-facing summary.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

On tag/release, the generator collects PRs, commit messages, linked issues, and labels for the release range, then produces structured notes per audience for the GitHub Release, a changelog file (PR), and a Slack announcement draft — with humans editing before anything customer-facing goes out.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Release trigger | tag push / release event / scheduled (internal releases) |
| Collector | compare API for the range; PR and issue enrichment |
| Synthesis engine | LLM producing structured notes with themes and breaking-change sections |
| Publisher | GitHub Releases, changelog file PR, Slack webhook |
| Style store | past approved notes as few-shot examples via retrieval |

## 4. Data Flow

1. A tag or release event defines the change range.
2. The collector gathers PRs, issues, labels, and commit metadata for the range.
3. The model drafts notes in each configured audience/template, grounding every bullet in a linked PR.
4. Drafts go to the release body, a changelog PR, and a Slack draft for editing.
5. Human edits are captured as style feedback.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "release_tag": "v2.5.0",
  "compare_range": "v2.4.1...v2.5.0",
  "total_prs": 18,
  "breaking_changes": [
    {
      "component": "Authentication API",
      "description": "Removed support for legacy API token query parameters; headers now required",
      "migration_steps": "Pass 'Authorization: Bearer <token>' in HTTP headers instead of '?token=...' query params"
    }
  ],
  "audience_summaries": {
    "engineering_changelog": "- feat(auth): migrate to Bearer token headers (#412) by @bob\n- fix(db): fix connection pool leak on idle timeout (#415)",
    "product_highlights": "Enhanced API security with strict bearer token enforcement and improved database connection resilience.",
    "customer_facing_notes": "We've upgraded our API authentication standards to ensure top-grade security for your account credentials."
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `PR titles/bodies/labels`
* `linked issues`
* `commit messages`
* `semantic version delta`
* `semantic versioning tags & milestone metadata`
* `past release notes style`
* `CODEOWNERS for review routing`

## 8. Human-in-the-Loop & Approval

All outputs are drafts. Customer-facing text requires explicit human approval by default.

## 9. Security Considerations

* Internal-only notes must not leak to public changelogs: separate templates and explicit approval for external publication.
* Strip internal hostnames/ticket URLs from customer-facing drafts.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [24 · AI Infrastructure Documentation Generator](../../24-ai-infrastructure-documentation-generator/README.md)
- [43 · AI DevOps Documentation Generator](../../43-ai-devops-documentation-generator/README.md)
- [08 · AI Deployment Risk Analyzer](../../08-ai-deployment-risk-analyzer/README.md)
