# 29 · AI Cloud Resource Optimization Assistant

> Continuously find waste across your cloud: idle resources, oversized instances, storage tiering, and scheduling wins — as reviewable PRs.

![Area](https://img.shields.io/badge/Area-Cloud-orange) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☁️ Cloud |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | AWS / Azure / GCP APIs · CUR / billing exports · IaC repos · OpenCost / Kubecost |

---

## 📌 Problem

Cloud waste accumulates in the gaps: unattached volumes, forgotten snapshots, oversized RDS instances, dev environments running 24/7, and log storage nobody knows is billed.

* Waste detection tools list findings but don't verify them (is this 'idle' volume actually a failover candidate?)
* Engineers ignore reports because false positives erode trust.
* Actions require cross-team coordination that never happens.
* Savings opportunities span services (compute, storage, network, licensing) needing different expertise.

**Why it matters:** Compared to compute right-sizing alone (idea 15), whole-cloud optimization routinely finds another 15-30% of bill.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Verified waste findings | corroborates each candidate with usage evidence and owner context before reporting |
| Action packaging | each finding ships with the exact IaC/config change and its risk notes |
| Prioritization | ranks by savings vs. effort vs. risk, per team |
| Trend reporting | shows waste accruing vs. eliminated to keep the program honest |

## 💡 Proposed Solution

A scheduled optimizer that scans cloud inventory and usage (CUR, CloudWatch/monitor metrics, storage analytics), verifies candidates with LLM reasoning over evidence, and files recommendations — where possible as IaC PRs — to owning teams. Trust comes from verified, explained findings rather than raw lists.

### Workflow

1. **Inventory** — enumerate resources and their usage signals across services
2. **Candidate detection** — deterministic rules: idle, oversized, unattached, unencrypted-but-billed, wrong storage class
3. **Verify** — LLM examines evidence per candidate; rejects weak ones with reasons
4. **Deliver** — PRs or tickets to owning teams with risk notes
5. **Track** — savings realized vs. proposed; report per team

**Human-in-the-loop:** Recommendations only. Destructive actions (delete snapshot) require owner confirmation even in later phases.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Cloud inventory + usage scan                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Candidate detection (idle · oversized · tiering)   │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM verification with evidence                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ IaC PRs / team recommendations                     │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Savings tracking dashboard                         │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| AWS / Azure / GCP APIs | inventory and metrics (read-only) |
| CUR / billing exports | spend evidence |
| IaC repos | PR-based remediation |
| OpenCost / Kubecost | K8s overlap |
| Slack | team digests |

## 📥 Context & Data Sources

* `resource inventory and utilization`
* `billing line items`
* `tagging/ownership`
* `environment purpose (dev/prod)`
* `backup/DR requirements`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Cloud Provider APIs (AWS / Azure / GCP inventory & CloudWatch read)
* Cloud Billing & CUR Exports Query Engine
* Kubecost & OpenCost API
* VCS PR Creation (GitHub / GitLab MCP)

## ✅ Expected Benefits

* Verified findings teams actually act on.
* Waste program with measured results instead of one-off cleanups.
* Cross-service expertise centralized in one advisor.

## 🔒 Safety & Guardrails

* Never auto-delete; destructive recommendations require explicit owner sign-off with retention checks (is it a backup? compliance hold?)
* Inventory scans are read-only and region/allowlist scoped.

## 🚀 Future Implementation

* Scheduling automation for non-prod (opt-in, with override escape hatch).
* Commitment planning: model savings-plan/RI coverage from usage forecasts.

## 🔗 Related Ideas

- [15 · AI Kubernetes Resource Optimization Advisor](../15-ai-kubernetes-resource-optimization-advisor/README.md)
- [26 · AI Cloud Cost Analysis Assistant](../26-ai-cloud-cost-analysis-assistant/README.md)
- [28 · AI Cloud Architecture Advisor](../28-ai-cloud-architecture-advisor/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
