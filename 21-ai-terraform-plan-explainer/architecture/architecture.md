# AI Terraform Plan Explainer — Architecture

> Before you approve: a plain-language, per-resource explanation of what the plan will do, why, and what could go wrong.

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A companion to any plan flow (CI PR check, Atlantis, TFC): parse `terraform show -json`, and produce an explainer — summary block, per-resource table, danger callouts, and a 'why' section traced to source lines or drift. Posted as the PR comment humans actually read before clicking approve.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Plan JSON from CI / TFC / Atlantis                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Action analyzer (replacements · deletions · drift) │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM narrator (per-resource · audience-tuned)       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR explainer + danger callouts                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Informed human approval                            │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Plan source | consumes plan JSON from CI artifacts or TFC/Atlantis APIs |
| Analyzer | deterministic extraction of actions, reasons, and unknowns |
| Narrator | LLM explainer with severity emphasis |
| Publisher | PR comments/check runs |

## 4. Data Flow

1. The plan JSON is fetched from the running pipeline.
2. Deterministic analysis extracts every action and its reason code.
3. The narrator writes the explainer, escalating risky actions to the top.
4. The comment is posted where approval happens.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "plan_id": "tfplan-prod-networking-9182",
  "workspace": "networking-production",
  "terraform_version": "1.8.5",
  "blast_radius_rating": "HIGH",
  "action_summary": {
    "to_add": 2,
    "to_change": 3,
    "to_destroy": 0,
    "to_replace": 1
  },
  "critical_danger_alerts": [
    {
      "resource_address": "aws_route_table.public_egress",
      "action": "replace",
      "forces_replacement_attributes": [
        "vpc_id"
      ],
      "requires_downtime": true,
      "plain_text_risk": "Destroying and recreating this route table will sever internet egress for all 16 public subnet workloads during the 3-5 minute recreation window."
    }
  ],
  "drift_detected": [
    {
      "resource_address": "aws_security_group_rule.ingress_ssh",
      "attribute": "cidr_blocks",
      "configured_value": "['10.0.0.0/16']",
      "actual_cloud_value": "['0.0.0.0/0']",
      "explanation": "Out-of-band change opened SSH to the public internet; this Terraform apply will revert port 22 access back to internal VPC only."
    }
  ],
  "resource_changes_narrative": [
    {
      "resource": "aws_subnet.private_app_c",
      "action": "create",
      "purpose": "Adds third availability zone subnet to satisfy multi-AZ redundancy policy."
    },
    {
      "resource": "aws_nat_gateway.public",
      "action": "update",
      "purpose": "Updates allocation_id to new secondary Elastic IP."
    }
  ],
  "approval_checklist": [
    "Verify maintenance window is active before approving public_egress route table replacement",
    "Confirm on-call network engineer is present in #infra-deploys channel"
  ]
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `plan JSON`
* `state diffs for drift tracing`
* `configuration diff`
* `provider version changes`
* `resource criticality tags`

## 8. Human-in-the-Loop & Approval

Pure explanation. Approval remains human; the explainer makes that approval informed.

## 9. Security Considerations

* Plans can expose sensitive attributes: mask before model calls; local model option for sensitive workspaces.
* Keep explainer output free of secret values — it quotes structure, not contents.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
- [20 · AI Terraform Error Analyzer](../../20-ai-terraform-error-analyzer/README.md)
- [45 · AI Pull Request Infrastructure Reviewer](../../45-ai-pull-request-infrastructure-reviewer/README.md)
