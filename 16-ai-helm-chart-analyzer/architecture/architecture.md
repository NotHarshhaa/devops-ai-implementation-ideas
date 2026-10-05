# AI Helm Chart Analyzer — Architecture

> Review Helm charts for correctness, upgrade safety, and best practices — before `helm upgrade` finds out the hard way.

*Focus: ☸️ Kubernetes · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

PR-time and pre-upgrade analysis: render the chart, lint, diff against the deployed release, and hand the manifests plus findings to an LLM for a structured review — breaking-change risks, best-practice gaps, and suggested template fixes — posted to the PR or shown before running upgrade in CI.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ Chart PR / pre-upgrade hook                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Render + diff (helm template/diff)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Structural lint (kubeconform · polaris)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM review (mutability · practices)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ PR findings + go/no-go summary                     │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| CI integration | chart PR and pre-upgrade hooks |
| Renderer | helm template/diff with values for target environment |
| Linters | schema and structural validation |
| Reviewer | LLM with Kubernetes field-mutability and best-practice knowledge |
| Reporter | PR annotations and upgrade gate summary |

## 4. Data Flow

1. A chart change or upgrade plan triggers rendering and diffing.
2. Structural lints run first; only surviving output goes to the model.
3. The reviewer ranks findings: upgrade-breaking, correctness, best-practice.
4. Findings post to the PR with suggested template fixes.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "chart_metadata": {
    "name": "customer-portal",
    "current_release_version": "3.4.1",
    "target_release_version": "4.0.0",
    "kubernetes_target_version": "1.30"
  },
  "validation_verdict": {
    "status": "BLOCKED",
    "can_safely_upgrade": false,
    "breaking_changes_count": 1,
    "security_warnings_count": 2,
    "best_practice_recommendations_count": 3
  },
  "upgrade_blockers": [
    {
      "resource": "apps/v1/Deployment: customer-portal",
      "issue_type": "IMMUTABLE_FIELD_MODIFICATION",
      "severity": "CRITICAL",
      "details": "Template changes spec.selector.matchLabels from 'app.kubernetes.io/name: portal' to 'app: portal'. Kubernetes forbids updating deployment selector labels on existing resources.",
      "remediation": "Retain original spec.selector.matchLabels or configure a blue/green migration step."
    }
  ],
  "security_findings": [
    {
      "rule": "KSV-012",
      "severity": "HIGH",
      "resource": "customer-portal-worker",
      "finding": "Container runs without 'securityContext.readOnlyRootFilesystem: true'",
      "suggested_fix": "Set values.securityContext.readOnlyRootFilesystem = true and mount emptyDir on /tmp"
    },
    {
      "rule": "KSV-003",
      "severity": "MEDIUM",
      "resource": "customer-portal-web",
      "finding": "PodDisruptionBudget is missing while replicaCount is 3",
      "suggested_fix": "Enable pdb.enabled=true with minAvailable=1 in values.yaml"
    }
  ],
  "values_schema_diff": {
    "deprecated_keys_used": [
      "ingress.annotations.kubernetes.io/ingress.class (migrate to spec.ingressClassName)"
    ],
    "missing_required_keys": []
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Managed AI code reviewers | CodeRabbit · Greptile · Qodo · Graphite · GitLab Duo | buy-instead-of-build option for PR-facing analysis |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `rendered manifests`
* `helm diff output`
* `values files`
* `chart version deltas`
* `lint results`
* `deployed release state`

## 8. Human-in-the-Loop & Approval

Advisory findings on PRs; upgrade execution remains a human/CI decision.

## 9. Security Considerations

* Rendered manifests may embed secret values from values files: render with redacted/placeholder secrets.
* Keep vendor chart analysis within approved providers or local models.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [03 · AI Terraform Reviewer](../../03-ai-terraform-reviewer/README.md)
- [02 · AI Kubernetes Troubleshooter](../../02-ai-kubernetes-troubleshooter/README.md)
- [38 · AI Kubernetes Security Analyzer](../../38-ai-kubernetes-security-analyzer/README.md)
