# AI IaC Security Analyzer — Architecture

> Triage IaC security findings with context: which of these 40 scanner alerts actually matter, and what's the fix?

*Focus: 🏗️ IaC · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

On PRs and scheduled scans, run tfsec/Checkov/KICS as usual, then let an LLM triage: merge duplicates, re-rank with resource context, explain attack paths in plain language, and suggest precise fixes. Findings become a small, honest list instead of a wall.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Scanners (tfsec · Checkov · KICS)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Resource context enrichment                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← catalog · tags
┌────────────────────────────────────────────────────┐
│ LLM triage (dedupe · re-rank · explain)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Inline fixes on PR                                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Suppression audit (monthly)                        │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Scan orchestrator | multi-scanner execution and result normalization |
| Context service | resource metadata from catalog, tags, and network posture |
| Triage engine | LLM re-ranking with documented rationale per finding |
| Fix generator | HCL suggestions validated by re-scan |
| Suppression auditor | ongoing review of ignore directives |

## 4. Data Flow

1. Scanners produce normalized findings on PRs and schedules.
2. Context enrichment attaches exposure and data-sensitivity data.
3. The triage engine produces a short, ranked, explained list.
4. Fixes appear inline; suppression hygiene is reviewed periodically.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "scan_id": "iac-sec-scan-8120",
  "repository": "org/ecommerce-core-infra",
  "commit_sha": "7b8a9f0e1c2d",
  "raw_scanner_findings_count": 42,
  "contextual_triaged_findings_count": 2,
  "noise_reduction_percentage": 95.2,
  "critical_actionable_findings": [
    {
      "finding_id": "CKV_AWS_144",
      "rule_description": "Ensure S3 bucket has cross-region replication enabled",
      "raw_scanner_severity": "HIGH",
      "contextual_risk_rating": "CRITICAL",
      "resource_address": "aws_s3_bucket.customer_invoices",
      "risk_justification": "Bucket stores PCI-regulated invoice archives with no cross-region replication, violating org disaster recovery RPO standard of 15 minutes.",
      "attack_or_failure_path": "Primary us-east-1 outage causes total invoice ingestion failure and irreversible transaction document loss.",
      "suggested_hcl_fix": "resource "aws_s3_bucket_replication_configuration" "invoices" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.customer_invoices.id
  rule {
    status = "Enabled"
    destination {
      bucket = aws_s3_bucket.customer_invoices_backup.arn
    }
  }
}",
      "rescan_verification": "VERIFIED_RESOLVED"
    }
  ],
  "deprioritized_noise_summary": [
    {
      "rule_id": "CKV_AWS_20",
      "reason_deprioritized": "S3 bucket customer_assets allows public read, but resource is intentionally tagged 'asset-type: public-cdn-origin' with dedicated CloudFront distribution."
    }
  ],
  "stale_suppressions_audit": [
    {
      "file": "modules/vpc/security_groups.tf",
      "line": 48,
      "rule_suppressed": "CKV_AWS_260",
      "suppression_reason": "# checkov:skip=CKV_AWS_260: Temporary bypass for dev testing",
      "age_days": 184,
      "recommendation": "REVOKE_SUPPRESSION: Temporary bypass has exceeded 30-day policy limit."
    }
  ]
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `scanner findings`
* `resource configuration`
* `network exposure`
* `environment and data classification`
* `existing suppressions`
* `past incident history for the service`

## 8. Human-in-the-Loop & Approval

Security engineers set triage policy; PR findings are advisory until teams opt into gates on the top severity class.

## 9. Security Considerations

* The LLM's re-ranking must never auto-dismiss findings silently — dismissals are recorded with rationale and reviewable.
* Policy-as-code stays the enforcement layer; this system advises humans who then set policy.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../../40-ai-cloud-misconfiguration-analyzer/README.md)
- [38 · AI Kubernetes Security Analyzer](../../38-ai-kubernetes-security-analyzer/README.md)
- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
