# 38 · AI Kubernetes Security Analyzer

> Explain and fix your cluster's security posture: RBAC sprawl, missing Pod Security controls, NetworkPolicy gaps — prioritized and explained.

![Area](https://img.shields.io/badge/Area-DevSecOps-red) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🔐 DevSecOps |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | Kubernetes RBAC / PSS / NetworkPolicy · Audit logs / Falco · Cilium Hubble / eBPF · Kyverno / OPA Gatekeeper |

---

## 📌 Problem

Kubernetes security posture degrades quietly: roles accumulate verbs, workloads run privileged 'temporarily', and namespaces lack network segmentation — until an audit or incident reveals the iceberg.

* RBAC bindings grow without review; who can do what is nobody's full-time question.
* Pod Security Standards adoption is stalled by 'it'll break workloads' fears that are never tested.
* NetworkPolicies are absent or wrong; lateral movement is trivially easy.
* Static posture tools report findings without workload context or remediation paths.

**Why it matters:** Cluster compromise blast radius is determined by exactly these controls; a explained, prioritized fix list makes hardening tractable.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| RBAC analysis | who can escalate, read secrets, or exec where — with usage evidence from audit logs to right-size grants |
| Workload hardening review | per-workload gaps (privileged, hostPath, no seccomp, root user) with fix manifests |
| Network segmentation planning | proposes NetworkPolicies from observed traffic flows (via Cilium Hubble-style data or eBPF) |
| Audit-log anomaly reading | explains suspicious API access patterns in plain language |

## 💡 Proposed Solution

A posture analyzer that combines cluster state, audit logs, and traffic observations into a prioritized hardening report: each finding explained (attack path in plain language), each fix provided as reviewable manifests, rollout risks noted. Kyverno/PSS baseline policies and admission-time enforcement are the endgame; this provides the guided path there.

### Workflow

1. **Collect** — RBAC bindings, workload security contexts, NetworkPolicies, audit logs, traffic flows
2. **Analyze** — deterministic passes: escalation paths, secret access, unsegmented traffic
3. **Explain** — LLM narrates top findings with attack scenarios and business context
4. **Fix** — hardening manifests as PRs (RBAC tightening, PSS labels, NetworkPolicies)
5. **Enforce** — graduation path to Kyverno/PSS enforcement once violations drain

**Human-in-the-loop:** All fixes via PR with owner review; enforcement mode changes require platform-team sign-off.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Cluster state · audit logs · flows                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Deterministic posture passes                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ LLM risk narrative (attack paths)                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Hardening PRs (RBAC · PSS · NetPol)                │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Graduate to Kyverno / PSS enforce                  │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Kubernetes RBAC / PSS / NetworkPolicy | control surfaces |
| Audit logs / Falco | runtime evidence |
| Cilium Hubble / eBPF | traffic flows for policy synthesis |
| Kyverno / OPA Gatekeeper | enforcement layer |
| K8sGPT security analyzers | build-on option |

## 📥 Context & Data Sources

* `RBAC bindings and audit evidence`
* `workload security contexts`
* `network flows and policies`
* `image provenance`
* `secret usage patterns`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Kubernetes API (read-only RBAC, workloads, NetworkPolicies)
* Kubernetes Audit Logs & Falco Security Events API
* Cilium Hubble / eBPF Network Flow API
* VCS PR Creation (GitHub / GitLab MCP)

## ✅ Expected Benefits

* Hardening becomes a prioritized, explained roadmap instead of an audit surprise.
* Fixes ship as reviewed manifests, not console changes.
* Enforcement graduation path with fewer breakages.

## 🔒 Safety & Guardrails

* The analyzer sees audit logs and RBAC detail — crown-jewel data: restrict to local/approved models.
* Fix PRs are security-sensitive changes: require security-team review, not just owners.

## 🚀 Future Implementation

* Admission-time advisor: explain rejected pods and suggest compliant alternatives interactively.
* Cross-cluster posture comparison to spread good patterns.

## 🔗 Related Ideas

- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)
- [37 · AI Container Vulnerability Explainer](../37-ai-container-vulnerability-explainer/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
