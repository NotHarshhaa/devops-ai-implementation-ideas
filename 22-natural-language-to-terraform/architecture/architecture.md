# Natural Language → Terraform — Architecture

> Describe the infrastructure you need in plain language; get a reviewed, standards-compliant Terraform module using your golden modules.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A self-service assistant (web/CLI/Backstage plugin) that interviews the user briefly, composes Terraform from the org's module registry (retrieved via RAG), runs a speculative plan with cost estimate, and opens a PR with explanations. From-scratch HCL is a last resort behind policy checks.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Conversation front end | Backstage plugin/CLI/web with structured request flow |
| Module registry + retriever | indexed golden modules with usage examples |
| Generator | LLM composing standards-compliant root modules |
| Sandbox planner | isolated plan runs with cost estimation |
| PR publisher | repo PR with explanation and review routing |

## 4. Data Flow

1. The user describes the need; clarifications resolve ambiguities.
2. The generator composes Terraform from retrieved golden modules.
3. A sandbox plan validates the result and attaches cost.
4. A PR is opened for platform review; outcomes improve the library.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "request_id": "nl-tf-4091",
  "user_intent": "Provision a secure SQS queue for processing order events with a dead-letter queue, 14-day retention, and server-side KMS encryption.",
  "clarified_parameters": {
    "service_owner": "orders-team",
    "environment": "production",
    "region": "us-east-1",
    "retention_days": 14,
    "max_receive_count": 5
  },
  "retrieved_golden_modules": [
    {
      "module_name": "terraform-aws-sqs-secure",
      "source": "app.terraform.io/my-org/sqs-secure/aws",
      "version": "~> 3.2.0",
      "compliance_tags_enforced": [
        "Environment",
        "Owner",
        "DataClassification"
      ]
    }
  ],
  "generated_terraform_code": {
    "target_file": "modules/order_queue/main.tf",
    "hcl_content": "module "order_events_queue" {
  source  = "app.terraform.io/my-org/sqs-secure/aws"
  version = "~> 3.2.0"

  name                       = "orders-processing-events-prod"
  message_retention_seconds  = 1209600
  kms_master_key_id          = "alias/aws/sqs"
  enable_dead_letter_queue   = true
  max_receive_count          = 5

  tags = {
    Environment        = "production"
    Owner              = "orders-team"
    DataClassification = "confidential"
  }
}",
    "policy_as_code_status": "PASSED (OPA Sentinel rules 4/4 compliant)"
  },
  "sandbox_plan_validation": {
    "plan_exit_code": 0,
    "resources_to_create": 2,
    "estimated_monthly_cost_usd": 4.80,
    "validation_summary": "Successfully planned: 1 primary SQS queue, 1 DLQ, and 1 redrive policy."
  },
  "pull_request": {
    "title": "feat(infra): provision orders-processing-events SQS queue via golden module",
    "branch": "feat/orders-sqs-queue",
    "target_repo": "org/infrastructure-live",
    "assigned_reviewers": [
      "@platform-engineers"
    ]
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `golden module docs and examples`
* `org standards (naming, tagging)`
* `similar past requests`
* `environment constraints`
* `plan output`

## 8. Human-in-the-Loop & Approval

Platform review on every PR (CODEOWNERS). The assistant never applies; it proposes.

## 9. Security Considerations

* Policy-as-code remains the hard gate regardless of how good the LLM output looks.
* Sandbox plans use scoped, expiring credentials; generated code is scanned (secrets/IaC misconfig) before PR.
* Prevent prompt-driven scope creep: the assistant can't request elevated permissions, only standard catalog items.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
- [24 · AI Infrastructure Documentation Generator](../../24-ai-infrastructure-documentation-generator/README.md)
- [48 · AI Golden Path Generator](../../48-ai-golden-path-generator/README.md)
