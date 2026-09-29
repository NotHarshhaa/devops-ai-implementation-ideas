# 15 · AI Resource Optimization Advisor

> Right-size requests and limits continuously using real usage data — explained, safe, and reviewable as GitOps PRs.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Prometheus / metrics-server / Thanos · Kubernetes + VPA · GitOps (Argo CD/Flux) · Grafana |

---

## 📌 Problem

Resource requests and limits are set once at creation and rarely revisited, so clusters pay for phantom capacity while individual pods still get OOMKilled.

* Requests are guesses from manifests copied years ago; utilization is often 5-15%.
* Manual right-sizing doesn't scale across hundreds of workloads and environments.
* Crude autosuggestions ignore burstiness, SLO tier, and cron/batch patterns, producing flapping.
* Changes to requests affect scheduler behavior and can cause incidents if done naively.

**Why it matters:** Typical savings from proper right-sizing are 30-50% of cluster compute cost, plus reliability gains from fewer OOM kills and better scheduling.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Usage analysis | P95/P99 memory/CPU patterns, seasonality, and burst behavior per workload |
| Safe recommendation | proposes requests/limits with headroom policy based on SLO tier and variance — never naive averages |
| Rollout planning | sequences changes (canary a few workloads first) and predicts scheduling impact |
| Explanation | shows the evidence: charts, percentiles, and why this number |

## 💡 Proposed Solution

A scheduled advisor consumes Prometheus/metrics-server history per workload, computes robust statistics, and drafts right-sizing PRs against the manifests repo — annotations explain the math, changes roll out via normal GitOps review. VPA in recommendation mode and commercial ML optimizers (StormForge-style) are cited as build-vs-buy baselines.

### Workflow

1. **Profile** — collect 2-4 weeks of per-container usage (P50/P95/P99, spikes, periodicity)
2. **Classify** — steady service vs. bursty vs. batch vs. cron; SLO tier per workload
3. **Recommend** — apply headroom policy; generate requests/limits with rationale annotations
4. **Deliver** — GitOps PR per namespace/team; batch small, defer risky ones
5. **Monitor** — track post-change OOM/throttling; auto-revert policy if regressions appear

**Human-in-the-loop:** Every change is a PR. Teams review their own workloads; the advisor never edits live specs.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Prometheus usage history                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Workload profiler (P95 · spikes · periodic)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Headroom policy engine                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← SLO-tier aware
┌────────────────────────────────────────────────────┐
│ GitOps PRs with rationale                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human review
┌────────────────────────────────────────────────────┐
│ Post-change monitor (OOM · throttle)               │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Prometheus / metrics-server / Thanos | usage history |
| Kubernetes + VPA | VPA recommendation mode as a data source |
| GitOps (Argo CD/Flux) | PR-based delivery |
| Grafana | before/after dashboards |
| Kubecost / OpenCost | cost attribution of savings |

## 📥 Context & Data Sources

* `container usage percentiles`
* `workload type and cron patterns`
* `SLO tier`
* `OOM/throttle event history`
* `current requests/limits`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Prometheus (read)
* VCS PR creation

## ✅ Expected Benefits

* Major compute cost reduction with reviewable, explainable changes.
* Fewer OOM kills from blind limit guessing.
* Org-wide consistency: one policy, many teams.

## 🔒 Safety & Guardrails

* Never downsize stateful or latency-critical tiers without owner sign-off.
* PRs are batched small to keep blast radius low and reviews fast.

## 🚀 Future Implementation

* Continuous mode: weekly PR batches with trend tracking.
* Schedule-aware rightsizing for dev/test namespaces (scale-to-zero off-hours proposals).

## 🔗 Related Ideas

- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [18 · AI HPA Recommendation Assistant](../18-ai-hpa-recommendation-assistant/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
