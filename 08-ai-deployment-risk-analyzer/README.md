# 08 · AI Deployment Risk Analyzer

> Score every deployment's risk before it ships by reading the change, its history, and the system's incident past.

![Area](https://img.shields.io/badge/Area-CI%2FCD-blue) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔄 CI/CD |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | GitHub / GitLab · Argo CD / Spinnaker / Jenkins / GitLab CD · Jira / Linear · PagerDuty / incident records |

---

## 📌 Problem

Not all deployments deserve the same scrutiny, but most pipelines treat them identically: same gates, same speed, same review depth — which means high-risk changes slide through and low-risk ones crawl.

* Risk signals (change size, past failure correlation, unfamiliarity of the author with the service) exist but aren't systematically used.
* Change failure rates are measured after the fact, never predicted before the deploy.
* Review effort is allocated by org chart and calendar, not by risk.

**Why it matters:** Predictive risk scoring lets teams put scrutiny where it matters — faster safe deploys, slower careful ones — cutting change-failure rates without throttling delivery.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Risk scoring | combines diff size/complexity, component criticality, author familiarity, and deploy timing into an explainable score |
| Historical correlation | finds past incidents linked to similar changes in the same components |
| Anomaly detection | flags deploys that look statistically unusual for this service (frequency, size, timing) |
| Recommendation | suggests mitigations: canary first, extra reviewers, off-peak window, feature flag default-off |

## 💡 Proposed Solution

Before deployment, a risk service ingests the release candidate's metadata — commits, diffs, linked tickets, author history, component SLO criticality, and recent incident data — and produces an explainable risk card consumed by the CD pipeline: informational badge, auto-approved canary policy, or mandatory extra review. The LLM's job is explanation and recommendation over ML/statistical features, not magic scoring.

### Workflow

1. **Collect** — release diff, commits, tickets, author/deployer history, component criticality, recent incidents
2. **Compute features** — statistical features (size, novelty, frequency, timing) computed deterministically
3. **Explain** — LLM synthesizes a risk narrative and recommendations from the features and history
4. **Publish** — risk card on the release/PR; optional pipeline gate by policy
5. **Calibrate** — compare predictions to actual failures weekly; tune features and thresholds

**Human-in-the-loop:** The score informs gating policy defined by humans; authors can appeal scores, and appeals are logged to improve the model.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Release candidate (commits · diff)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Feature extractor (size · history · timing)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Incident & deploy history lookup                   │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← RAG
┌────────────────────────────────────────────────────┐
│ LLM risk narrative + recommendations               │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Risk card → CD policy (badge · canary · review)    │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| GitHub / GitLab | commits, diffs, PR metadata |
| Argo CD / Spinnaker / Jenkins / GitLab CD | deployment metadata and gates |
| Jira / Linear | linked tickets for intent and scope |
| PagerDuty / incident records | correlation with past failures |
| Feature flags (LaunchDarkly, Flagsmith) | flag usage in the change |

## 📥 Context & Data Sources

* `commit set and diff stats`
* `component criticality (SLO tier)`
* `author familiarity with the component`
* `recent deploy frequency`
* `incident history for touched components`
* `deploy timing (freeze windows, on-call load)`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Read-only VCS and ticket APIs

## ✅ Expected Benefits

* Scrutiny flows to risky changes automatically; safe changes stop queuing for extra review.
* Explainable cards build trust — every score shows its drivers.
* Calibrated over time against real outcomes, not vibes.

## 🔒 Safety & Guardrails

* Keep scoring advisory until calibrated; a miscalibrated hard gate is a delivery outage.
* Access to incident and HR-adjacent data (author history) needs privacy review; aggregate where possible.

## 🚀 Future Implementation

* Live risk adaptation: raise canary analysis sensitivity for high-risk deploys automatically.
* Org-wide deploy-risk analytics: which components, change types, and times drive incidents.

## 🔗 Related Ideas

- [12 · AI Deployment Troubleshooting Agent](../12-ai-deployment-troubleshooting-agent/README.md)
- [09 · AI Release Summary Generator](../09-ai-release-summary-generator/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
