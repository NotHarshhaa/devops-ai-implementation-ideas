# 39 · AI Secrets Detection Assistant

> Triage secrets findings fast: is this credential real, what does it access, how urgent is rotation, and has it been used?

![Area](https://img.shields.io/badge/Area-DevSecOps-red) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔐 DevSecOps |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Gitleaks / TruffleHog / push protection · Cloud audit logs · Secret managers (Vault/ASM/KeyVault) · Security ticketing |

---

## 📌 Problem

Secret scanners find hundreds of 'potential' secrets; each needs the same manual questions — is it real, what can it do, was it used, is it rotated? — before anyone acts.

* High false-positive rates (test keys, examples) train teams to ignore findings.
* Real leaks require urgent, multi-step response (revoke, rotate, purge history, audit usage) that's easy to fumble.
* Git history means deletion doesn't fix anything; remediation guidance is often missing.
* Prioritization is blind: a Stripe key and a dummy AWS key look identical to the scanner.

**Why it matters:** Fast, correct secret-leak response closes your most direct compromise path; slow response is how leaks become breaches.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Validity classification | pattern + metadata reasoning to separate real credentials from examples/dummies (with optional live check for non-destructive validation) |
| Blast-radius assessment | given the credential type and (where safe) its scopes, explain what access it grants |
| Rotation runbook | step-by-step response: revoke, rotate, purge history, audit usage, notify |
| Usage audit reading | interprets access logs for signs of use since the leak |

## 💡 Proposed Solution

A triage assistant layered on Gitleaks/TruffleHog findings: each finding gets classified, prioritized, and — if real — attached to a concrete response runbook with the exact commands for that credential type. Push-protection and pre-commit stay the prevention layer; this handles the findings that slip through.

### Workflow

1. **Ingest** — scanner findings from CI, push protection, or scheduled repo scans
2. **Classify** — real vs. test/example; credential type and provider
3. **Assess** — what the credential can access; check usage logs where available
4. **Instruct** — tailored rotation runbook with exact commands
5. **Track** — response status per finding until closed

**Human-in-the-loop:** The assistant never touches credentials or revokes anything. Live validation (e.g., a get-caller-identity call) only runs under policy with human trigger.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Secrets findings (Gitleaks · TruffleHog)           │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Validity classifier (real · test · stale)          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Blast-radius + usage assessment                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Tailored rotation runbook                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Response tracking to closure                       │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Gitleaks / TruffleHog / push protection | finding sources |
| Cloud audit logs | usage evidence |
| Secret managers (Vault/ASM/KeyVault) | rotation targets |
| Security ticketing | response workflow |

## 📥 Context & Data Sources

* `finding location and context`
* `credential type/pattern`
* `provider metadata`
* `usage/audit logs`
* `repo history state`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Secret Scanning Ingestion API (Gitleaks / TruffleHog / GitHub Secret Scanning)
* Cloud Provider Audit Logs (read-only usage check)
* Secret Management Platform (HashiCorp Vault / AWS Secrets Manager)
* Security Incident Ticketing API

## ✅ Expected Benefits

* Real leaks identified and worked immediately; noise dismissed with documented reasoning.
* Correct response steps for each credential type — no improvisation under stress.
* Response time measurable and improving.

## 🔒 Safety & Guardrails

* Never send the secret value itself to the model — only type, prefix, and metadata.
* Live validation is destructive-adjacent: policy-gated, logged, human-triggered only.
* The runbook itself should avoid embedding current credential values.

## 🚀 Future Implementation

* Git-history purge automation (BFG/filter-repo) as drafted PRs.
* Proactive scanning of unmanaged surfaces (wikis, ticket comments, chat).

## 🔗 Related Ideas

- [40 · AI Cloud Misconfiguration Analyzer](../40-ai-cloud-misconfiguration-analyzer/README.md)
- [41 · AI Security Incident Assistant](../41-ai-security-incident-assistant/README.md)
- [03 · AI Terraform Reviewer](../03-ai-terraform-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
