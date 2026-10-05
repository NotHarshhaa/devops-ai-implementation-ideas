# 12 · AI Deployment Troubleshooting Agent

> When a deploy goes sideways, an agent verifies health across the stack and recommends (or drafts) the rollback — with human-in-the-loop authorization.

![Area](https://img.shields.io/badge/Area-CI%2FCD-blue) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | 🔄 CI/CD |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | Argo CD / Flux · Prometheus / Grafana · Feature flags · PagerDuty |

---

## 📌 Problem

Post-deploy failures are the worst time to start debugging: production is degraded, signals are scattered, and the safe default (rollback) competes with 'quick fix forward' under pressure.

* Health signals live in CD tooling, Kubernetes, APM, and synthetics — no single view of 'is this deploy healthy?'
* Rollback is avoided because it feels risky (schema changes, queue compatibility) even when it's right.
* Fix-forward pressure produces hotfix churn and cascading risk.
* Deployment observability (which pod got the new version? did traffic shift?) is manual.

**Why it matters:** Minutes matter during bad deploys; automated verification plus a prepared rollback path cuts both MTTD and decision latency.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Deploy health verification | checks version rollout status, error rates, latency, saturation, and synthetic checks against pre-deploy baseline |
| Failure attribution | distinguishes deploy-caused regressions from coincidental issues |
| Rollback readiness | precomputes the exact rollback steps and their risks (schema, queues, flags) before they're needed |
| Decision support | recommends rollback vs. fix-forward with evidence and tradeoffs, draft communications included |

## 💡 Proposed Solution

Triggered by deploy events or SLO burn, an agent snapshots the pre-deploy baseline, verifies rollout health across CD and monitoring tools via MCP, and on regression produces a rollback plan (or executes a pre-approved one after approval). Integrates with GitOps: rollback = revert PR, keeping humans in the loop.

### Workflow

1. **Baseline** — at deploy start, snapshot key metrics and versions
2. **Watch** — compare canary/full-rollout health against baseline for the burn window
3. **Attribute** — on regression, correlate with the deploy (vs. other candidates) using change and traffic analysis
4. **Plan** — draft rollback steps with risk notes, or targeted fix-forward options
5. **Act (gated)** — with human approval: trigger revert PR, pause rollout, or flip flag
6. **Report** — timeline of the decision for the postmortem

**Human-in-the-loop:** Watching and planning are automatic. Execution requires approval, except optionally pre-approved flag-flips for revert-to-safe-default. GitOps reverts keep the audit trail in Git.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Deploy event / SLO burn trigger                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Baseline snapshot                                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Health verifier (CD · metrics · synthetics)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP tools
┌────────────────────────────────────────────────────┐
│ Regression attribution                             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Rollback plan + risk notes                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human approval
┌────────────────────────────────────────────────────┐
│ Revert PR / flag flip · report                     │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Argo CD / Flux | rollout status, history, revert PRs |
| Prometheus / Grafana | baseline and live metrics via MCP |
| Feature flags | kill-switch flips (approval-gated) |
| PagerDuty | escalation if human approval isn't available |
| Slack / Teams | decision thread with evidence |

## 📥 Context & Data Sources

* `deploy metadata and diff vs. previous`
* `pre-deploy baseline metrics`
* `live rollout health (errors, latency, saturation)`
* `synthetic/e2e results`
* `schema and queue compatibility notes`
* `runbook for the service`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Argo CD / Flux CD API (read; gated write)
* Grafana MCP (Prometheus metrics & APM)
* GitHub / GitLab MCP (revert PR)
* Feature Flags API (gated kill-switches)

## ✅ Expected Benefits

* Bad deploys caught in the burn window, not by users.
* Rollback decisions arrive pre-analyzed: steps, risks, and comms ready.
* GitOps-native reverts keep history clean and auditable.

## 🔒 Safety & Guardrails

* Executor credentials are separate, scoped, and approval-gated; every action is logged immutably.
* Guard against prompt injection flowing from logs/metrics: action allowlists and schema-validated plans only.
* Test rollback paths (incl. DB compat) in drills; an untested rollback plan is a risk, not a mitigation.

## 🚀 Future Implementation

* Progressive-delivery integration: auto-adjust canary weights within policy bounds on evidence.
* Learning from outcomes: which signals best predicted failure, refining baselines per service.

## 🔗 Related Ideas

- [08 · AI Deployment Risk Analyzer](../08-ai-deployment-risk-analyzer/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
