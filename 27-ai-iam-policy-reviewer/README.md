# 27 · AI IAM Policy Reviewer

> Review IAM policies and roles for least privilege: over-grants explained, unused permissions identified, tighter policies drafted.

![Area](https://img.shields.io/badge/Area-Cloud-orange) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☁️ Cloud |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | AWS IAM Access Analyzer · Azure · GCP IAM analyzers · CloudTrail / activity logs · Terraform IaC repos · Security ticketing |

---

## 📌 Problem

IAM is the highest-stakes, least-understood surface in cloud security: policies accrete wildcard grants that nobody remembers adding and nobody dares remove.

* `Action: '*'` spreads because crafting precise policies is genuinely hard.
* Access analyzers flag over-grants but not what the principal actually uses or needs.
* Reviewing a role's permissions against its real usage is laborious and rarely done.
* Tightening policies risks breaking production, so risky grants stay forever.

**Why it matters:** Over-broad IAM is the root enabler of most cloud breaches; least-privilege review is the control that never happens because it's too expensive to do manually.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Over-grant analysis | combines Access-Analyzer-style external-access findings with actual usage (CloudTrail/activity logs) to separate 'granted' from 'needed' |
| Least-privilege drafting | generates tightened policies from observed usage with explicit 'added because' annotations |
| Blast-radius explanation | explains in plain language what a role can actually do (exfiltrate bucket X, escalate via iam:PassRole) |
| Safe rollout planning | sequences changes with monitoring for AccessDenied spikes and easy rollback |

## 💡 Proposed Solution

A policy review service that ingests policies, trust relationships, access-analyzer findings, and usage logs; produces a per-role report (over-grants, unused, escalations, external exposure); and drafts tightened policies as PRs against the IaC repo, with a canary-and-rollback plan attached.

### Workflow

1. **Collect** — policies, roles, trust relationships, analyzer findings, usage logs (90 days)
2. **Analyze** — deterministic pass: granted vs. used; escalation paths; external access
3. **Explain** — LLM narrates findings per role in plain language with risk framing
4. **Draft** — tightened policies as PRs with annotations and rollout/rollback notes
5. **Monitor** — post-merge AccessDenied monitoring with auto-revert proposal

**Human-in-the-loop:** All tightening via PR review; security and service owners co-approve. Analyzer never edits IAM directly.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ IAM state + usage logs (read-only)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Granted-vs-used analyzer                           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM risk narrative per role                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Tightened policy PRs                               │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← annotations + rollback plan
┌────────────────────────────────────────────────────┐
│ AccessDenied monitor post-merge                    │
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
| AWS IAM Access Analyzer · Azure · GCP IAM analyzers | finding sources |
| CloudTrail / activity logs | usage evidence |
| Terraform IaC repos | policy change delivery |
| Security ticketing | findings workflow |

## 📥 Context & Data Sources

* `policies and trust relationships`
* `90-day usage logs`
* `access-analyzer findings`
* `resource sensitivity classifications`
* `org role conventions`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Cloud IAM APIs & Access Analyzers (AWS / Azure / GCP read-only)
* CloudTrail & Activity Logs Query Engine (90-day usage)
* VCS PR Creation (GitHub / GitLab MCP)

## ✅ Expected Benefits

* Least privilege becomes maintainable instead of aspirational.
* Unused grants identified with evidence, not guesswork.
* Escalation paths (PassRole chains, privilege boundaries) surfaced in plain language.

## 🔒 Safety & Guardrails

* The reviewer has read-only access; generated policies go through full human review — an automated IAM change is its own incident class.
* Usage logs may contain sensitive resource identifiers: redact before model calls.
* Beware learned over-fitting: deny recommendations must consider break-glass and seasonal patterns.

## 🚀 Future Implementation

* Continuous mode: drift alerts when new broad grants appear.
* Just-in-time access advisor: recommend shorter-lived credentials where usage is spiky.

## 🔗 Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [41 · AI Security Incident Assistant](../41-ai-security-incident-assistant/README.md)
- [25 · AI Cloud Troubleshooting Assistant](../25-ai-cloud-troubleshooting-assistant/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
