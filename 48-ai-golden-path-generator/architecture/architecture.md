# AI Golden Path Generator — Architecture

> Turn your best repo into the platform's next golden path: analyze what great looks like and generate the template, docs, and guardrails.

*Focus: 🏢 Platform Engineering · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A golden-path factory: point it at the reference repo(s) and the template framework; it analyzes, drafts the template with documentation, and proposes the guardrails. Platform engineers review and adopt; template drift is monitored by diffing exemplars against templates over time.

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| Repo analyzer | deep analysis of exemplar structure and practices |
| Template generator | framework-aware template synthesis |
| Guardrail proposer | policy-as-code drafts |
| Drift monitor | exemplar-vs-template diffing |

## 4. Data Flow

1. Platform team selects exemplars and framework.
2. The factory extracts the pattern and drafts the template with docs.
3. Guardrails are proposed to keep derived services compliant.
4. Drift monitoring keeps templates current as practices evolve.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "golden_path_id": "gp-gen-nodejs-microservice",
  "source_exemplar_repository": "org/payment-gateway-reference",
  "target_scaffolder_format": "Backstage Scaffolder Template v1beta3",
  "extracted_patterns": {
    "runtime": "Node.js 20 LTS (TypeScript)",
    "package_manager": "pnpm",
    "testing_framework": "Vitest + Playwright E2E",
    "dockerfile_pattern": "Multi-stage build with gcr.io/distroless/nodejs20-debian12",
    "ci_workflow": "GitHub Actions with automated matrix test sharding and Docker buildx caching"
  },
  "generated_artifacts": {
    "template_manifest": "templates/nodejs-service/template.yaml",
    "skeleton_files_count": 22,
    "derived_policy_guardrails": [
      {
        "engine": "Kyverno",
        "rule_name": "require-distroless-base-image",
        "policy_yaml": "apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-distroless
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-image
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Base image must derive from approved distroless registry."
      pattern:
        spec:
          containers:
          - image: "gcr.io/distroless/*""
      }
    ]
  },
  "smoke_test_validation": {
    "dry_run_scaffold_passed": true,
    "test_build_exit_code": 0
  }
}
```

## 6. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 7. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `exemplar repo structure and CI`
* `org standards and scorecards`
* `existing templates`
* `platform policies`

## 8. Human-in-the-Loop & Approval

Platform engineers review every template as code. The factory accelerates authoring; it doesn't decide standards.

## 9. Security Considerations

* Templates must embed security defaults (no secrets, least-privilege scaffolding) — review for that specifically.
* Never extract org-internal identifiers/secrets into shareable templates.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [47 · AI Internal Developer Platform Assistant](../../47-ai-internal-developer-platform-assistant/README.md)
- [49 · AI Service Catalog Assistant](../../49-ai-service-catalog-assistant/README.md)
- [24 · AI Infrastructure Documentation Generator](../../24-ai-infrastructure-documentation-generator/README.md)
