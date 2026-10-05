# AI Build Optimization Assistant — Architecture

> Profile slow pipelines and get concrete, prioritized speedups: caching, parallelization, dependency pruning, and runner sizing.

*Focus: 🔄 CI/CD · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A scheduled analyzer pulls pipeline timing data and logs across repos, computes where time goes, and asks the model for a prioritized optimization plan per repo — each item with expected savings, effort, and a concrete config diff. Ships as a report plus optional PRs, tracked over time to verify savings.

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────┐
│ CI timing & cache data (multi-repo)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deterministic profiler                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM optimization planner                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← prioritized · with diffs
┌────────────────────────────────────────────────────┐
│ Report · optional auto-PR                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Re-measure → savings tracked                       │
└────────────────────────────────────────────────────┘
```

## 3. Components

| Component | Responsibility |
| --- | --- |
| Metrics collector | CI APIs and runner telemetry for timings, queues, cache stats |
| Profiler | deterministic time attribution and trend detection |
| Optimizer | LLM producing ranked, concrete recommendations |
| PR bot | opens config-change PRs for safe, high-confidence items |
| Tracker | before/after measurements and org-wide savings dashboard |

## 4. Data Flow

1. Scheduled collection pulls timing and cache statistics for all registered pipelines.
2. The profiler attributes time and detects regressions vs. history.
3. The model drafts per-repo plans with expected savings and config diffs.
4. Reports are delivered; safe fixes go out as reviewable PRs.
5. Post-change measurements verify and publicize savings.

## 5. Example Structured Output Schema

The model responds with a validated JSON payload conforming to a strict schema:

```json
{
  "pipeline_id": "checkout-service-ci",
  "repository": "org/checkout-service",
  "branch": "main",
  "current_p50_duration_sec": 1420,
  "projected_duration_sec": 780,
  "projected_time_savings_pct": 45.1,
  "bottlenecks": [
    {
      "stage": "integration-tests",
      "step": "run-e2e-suite",
      "duration_sec": 650,
      "pct_of_pipeline": 45.8,
      "bottleneck_type": "SERIAL_EXECUTION",
      "recommendation": "Shard test suite across 4 matrix runners partitioned by test duration history."
    },
    {
      "stage": "build-container",
      "step": "docker-build",
      "duration_sec": 380,
      "pct_of_pipeline": 26.8,
      "bottleneck_type": "CACHE_MISS",
      "recommendation": "Configure buildx cache with GitHub Actions cache backend and bind mount go.mod lockfile."
    }
  ],
  "cache_optimization": {
    "current_hit_rate_pct": 22.4,
    "primary_cache_miss_cause": "Cache key incorporates dynamic timestamp instead of package-lock.json hash",
    "suggested_cache_key": "${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}",
    "estimated_speedup_sec": 240
  },
  "runner_rightsizing": {
    "current_runner_type": "standard-2cpu-4gb",
    "peak_cpu_utilization_pct": 98.2,
    "memory_swapping_detected": true,
    "recommended_runner_type": "compute-4cpu-8gb",
    "estimated_monthly_cost_delta_usd": 18.50
  },
  "proposed_pull_request": {
    "title": "ci: optimize e2e test sharding and npm cache key",
    "target_file": ".github/workflows/ci.yml",
    "risk_level": "LOW",
    "diff_snippet": "@@ -24,3 +24,5 @@
-      run: npm test
+      strategy:
+        matrix:
+          shard: [1/4, 2/4, 3/4, 4/4]
+      run: npm test -- --shard=${{ matrix.shard }}"
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

* `step-level timings and trends`
* `cache hit/miss statistics`
* `runner and queue metrics`
* `dependency manifests`
* `org golden-pipeline patterns`

## 8. Human-in-the-Loop & Approval

All changes are proposed PRs; humans merge. Reports only inform.

## 9. Security Considerations

* Build logs and dependency lists are sensitive in private repos: keep data within approved providers or local models.
* Auto-PRs limited to low-risk config items with clear review labels.

## 10. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 11. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 12. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 13. Related Ideas

- [01 · AI Pipeline Failure Analyzer](../../01-ai-pipeline-failure-analyzer/README.md)
- [07 · AI GitHub Actions Debugger](../../07-ai-github-actions-debugger/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../../29-ai-cloud-resource-optimization-assistant/README.md)
