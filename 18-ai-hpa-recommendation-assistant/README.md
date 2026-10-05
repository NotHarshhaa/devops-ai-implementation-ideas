# 18 · AI HPA Recommendation Assistant

> Design and tune autoscaling policies (HPA, KEDA, VPA) from real traffic patterns instead of YAML folklore.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Prometheus · HPA / KEDA / VPA · GitOps repos · Grafana |

---

## 📌 Problem

Autoscaling configs are copied between services and rarely match actual load shape, producing both over-provisioning and painful cold-start gaps.

* Wrong metrics (CPU for queue-driven workers), bad targets, and no stabilization windows cause flapping.
* Scale-out lag (cold starts, cache warmup) is ignored, so scaling arrives too late.
* Min/max bounds are arbitrary; scale-to-zero is feared rather than engineered.
* Event-driven workloads (queues, schedules) get HTTP-era HPA configs.

**Why it matters:** Correct autoscaling directly cuts cost and improves latency; wrong autoscaling does both harm simultaneously.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Load pattern analysis | traffic seasonality, burstiness, and growth from metrics history |
| Policy design | recommends the right mechanism (HPA vs. KEDA vs. scheduled scaling), metrics, targets, and windows |
| Flapping diagnosis | identifies oscillation from behavior and proposes stabilization (behavior blocks, warmup) |
| Simulation notes | explains how the proposal would have behaved against last week's load |

## 💡 Proposed Solution

An advisor that studies each workload's traffic and scaling behavior, then drafts concrete HPA/KEDA configuration PRs with rationale: metric choice, target, min/max, stabilization and scale-down windows — plus what to watch after rollout.

### Workflow

1. **Measure** — request rates/queue depths, current scaling actions, and resource data over 2-4 weeks
2. **Diagnose** — detect flapping, lag, and ceiling hits in current behavior
3. **Design** — LLM drafts the policy with mechanism choice and parameters, grounded in measured patterns
4. **Deliver** — config PR with rationale and monitoring plan
5. **Verify** — post-rollout review of scaling actions vs. expectations

**Human-in-the-loop:** All changes as reviewable PRs; owners approve for their services.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Traffic & scaling history (Prometheus)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Pattern analyzer (seasonality · bursts)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Policy designer (HPA · KEDA · schedule)            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Config PR + rationale + watch plan                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Post-rollout verification                          │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Prometheus | traffic, queue depth, and scaling metrics |
| HPA / KEDA / VPA | policy targets |
| GitOps repos | PR delivery |
| Grafana | before/after dashboards |

## 📥 Context & Data Sources

* `request/queue metrics with seasonality`
* `current HPA/KEDA config and action history`
* `pod start/warmup times`
* `resource usage`
* `SLOs and latency targets`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Prometheus / Thanos PromQL API (read usage metrics)
* Kubernetes Metrics Server & VPA API (read)
* Kubecost / OpenCost API (cost attribution)
* VCS PR Creation (GitHub / GitLab MCP)

## ✅ Expected Benefits

* Scaling that matches real load: cost down, latency spikes avoided.
* End of copy-paste autoscaling configs.
* Measured verification closes the loop.

## 🔒 Safety & Guardrails

* Scale-to-zero proposals need owner opt-in per service.
* Avoid metrics endpoints that leak sensitive business data into shared dashboards without review.

## 🚀 Future Implementation

* Reinforcement-from-outcomes: tune targets from observed latency vs. replica curves.
* Cross-service capacity simulation for major events (sales, launches).

## 🔗 Related Ideas

- [15 · AI Kubernetes Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [13 · AI Pod Crash Analyzer](../13-ai-pod-crash-analyzer/README.md)
- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
