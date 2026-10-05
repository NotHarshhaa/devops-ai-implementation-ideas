# 19 · AI Cluster Operations Agent

> A resident cluster operations agent: watches fleet health, drafts maintenance plans, and executes supervised runbooks via an audited control plane.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-High-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | High |
| **Automation level** | Supervised automation |
| **Primary integrations** | kagent / HolmesGPT · Kubernetes API · OPA / Kyverno · PagerDuty / Slack |

---

## 📌 Problem

Cluster operations — upgrades, node maintenance, certificate rotation, namespace hygiene — are recurring, checklist-heavy work that consumes platform-team capacity.

* Version upgrades and node maintenance require careful sequencing that is re-derived by hand every cycle.
* Hygiene tasks (orphaned resources, expired certs, stale namespaces) accumulate silently.
* Operators who could do this work safely don't, because access is concentrated in a few experts.
* Existing automation is brittle scripts with no reasoning about cluster state.

**Why it matters:** An operations agent with a controlled action surface converts the platform team's recurring toil into reviewable proposals and supervised executions.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Fleet health assessment | continuous sweep: versions, CVEs, certificate expiry, node pressure, quota anomalies |
| Maintenance planning | drafts upgrade/drain/replacement plans respecting PDBs, topology, and orderings |
| Supervised execution | runs pre-approved runbooks through a policy-checked control plane (kagent-style), each step logged |
| Hygiene automation | detects and (with approval) cleans orphaned/stale resources |

## 💡 Proposed Solution

A resident agent platform in-cluster (kagent-style control plane) with a curated tool set: read-everything, plus write actions gated by policy and approval workflows. Scheduled tasks produce maintenance proposals; humans approve; execution is step-wise audited with dry-runs and aborts. Think of it as an SRE teammate whose every action is logged.

### Workflow

1. **Observe** — scheduled fleet sweeps produce a health/maintenance backlog
2. **Plan** — drafts concrete maintenance plans (upgrade order, node-by-node drain steps)
3. **Approve** — humans review plans; approval unlocks a scoped execution session
4. **Execute** — step-wise runbook execution with dry-run, checkpoints, and abort
5. **Verify & report** — post-action verification and a full audit trail

**Human-in-the-loop:** Nothing executes without an explicit approval per plan; pre-approved routine actions (like cert renewals) run under narrow policy with full audit.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Scheduled fleet sweep                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Maintenance backlog + plans                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human approval per plan                            │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Step-wise execution (dry-run · checkpoints)        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← policy-gated
┌────────────────────────────────────────────────────┐
│ Verification + audit report                        │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| kagent / HolmesGPT | agent runtime and runbook foundations |
| Kubernetes API | via policy-gated MCP tools |
| OPA / Kyverno | policy gate for actions |
| PagerDuty / Slack | approvals and notifications |
| Argo CD | GitOps-first execution where possible |

## 📥 Context & Data Sources

* `cluster versions and skew`
* `CVE feeds for deployed images`
* `certificate/credential expiry`
* `node health and pressure`
* `PDB/topology constraints`
* `org maintenance windows`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Kubernetes MCP (read-all; write actions policy-gated)
* OPA / Kyverno Policy Engine
* Approval Workflow API (Slack / PagerDuty / Webhook)
* Argo CD API (GitOps operations)

## ✅ Expected Benefits

* Recurring platform toil becomes reviewable proposals.
* Maintenance happens on schedule instead of under duress.
* Full audit trail satisfies change-management requirements.

## 🔒 Safety & Guardrails

* The action surface is the design centerpiece: default-deny, allowlisted verbs, time-boxed sessions, dry-run first.
* Two-person approval for cluster-affecting plans; emergency path pre-defined and drilled.
* Agent runtime runs in a locked-down namespace; its credentials are scoped per tool, never cluster-admin.
* Treat all cluster output as untrusted data (prompt injection); schema-validate every plan before execution.

## 🚀 Future Implementation

* Fleet federation: one agent managing upgrades across many clusters with wave scheduling.
* Self-serve maintenance for service teams under platform-set policies.
* Integration with cloud provider maintenance events for coordinated node work.

## 🔗 Related Ideas

- [14 · AI kubectl Assistant](../14-ai-kubectl-assistant/README.md)
- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
