# 02 · AI Kubernetes Troubleshooter

> Investigate unhealthy workloads automatically: collect events, logs, and pod state, then explain the failure and the fix in plain language.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Supervised_automation-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Medium |
| **Automation level** | Supervised automation |
| **Primary integrations** | Kubernetes API · Prometheus / Alertmanager · Grafana / Loki · Argo CD / Flux |

---

## 📌 Problem

Kubernetes failures arrive as cryptic exit codes, probe timeouts, and OOM kills, and debugging requires stitching together events, logs, spec changes, and cluster context under time pressure.

* `CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, and probe failures each have many distinct root causes that require experience to separate.
* The evidence is scattered: pod events, container logs, resource requests vs. usage, recent deploys, node conditions, and Helm/Kustomize diffs.
* Junior engineers don't know which commands are safe to run in production; senior engineers spend their day running them for everyone.
* Alert tools flag the symptom (pod restarting) but never the cause (bad config released an hour ago).

**Why it matters:** Kubernetes troubleshooting is the single most common on-call time sink in cloud-native teams, and the same class of misconfiguration recurs weekly.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Symptom classification | maps pod state, exit codes, and events to a ranked list of likely causes |
| Cluster-state reasoning | correlates workload spec, resource usage, node pressure, and recent rollouts into one explanation |
| Guided investigation | decides which next command (logs, describe, get events) would discriminate between hypotheses and requests it |
| Plain-language explanation | produces a diagnosis a junior engineer can act on, with the evidence attached |
| Safe remediation drafting | writes the kubectl patch or manifest change, always via dry-run and human approval |

## 💡 Proposed Solution

A troubleshooting service (or in-cluster agent) watches for unhealthy workloads and alert triggers. It collects pod specs, events, container logs, and resource metrics; optionally uses proven open-source analyzers (K8sGPT, HolmesGPT) for triage; then an LLM agent reasons over the package and returns a diagnosis with a proposed fix. Interactive mode lets engineers ask follow-up questions in Slack or the terminal, with every tool call executed through a read-scoped Kubernetes RBAC identity.

### Workflow

1. **Trigger** — alert fires, or a workload enters an unhealthy state (CrashLoop, high restarts, probe failures)
2. **Collect** — gather pod spec, events, last logs, owner references (Deployment/Helm), and node conditions
3. **Enrich** — add recent rollout history, resource metrics vs. requests/limits, and related ConfigMaps/Secrets existence
4. **Investigate** — agent loop: form hypotheses, request targeted reads (logs of the previous container, node status) via MCP tools
5. **Diagnose** — produce ranked causes with evidence and a concrete fix (patch, limits change, rollback)
6. **Propose** — offer the fix as a dry-run validated command or a GitOps PR — never applied directly
7. **Close the loop** — record what was accepted; recurring patterns feed a known-issues knowledge base

**Human-in-the-loop:** Diagnosis is automatic; every change goes through approval. The agent proposes kubectl commands that are shown with `--dry-run=server` output, or a GitOps PR, and a human applies them.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Alert / unhealthy workload trigger                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Kubernetes API (events · logs · specs)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← read-scoped RBAC
┌────────────────────────────────────────────────────┐
│ Evidence collector + K8sGPT/HolmesGPT              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ AI agent (hypothesis → tool → refine)              │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP kubernetes tools
┌────────────────────────────────────────────────────┐
│ Diagnosis + ranked causes                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Fix proposal (dry-run / GitOps PR)                 │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← human approval
┌────────────────────────────────────────────────────┐
│ Engineer applies · knowledge base updated          │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Kubernetes API | read-only service account (get/list/watch pods, events, deployments, nodes) |
| Prometheus / Alertmanager | alert webhooks as investigation triggers |
| Grafana / Loki | metrics snapshots and log context via the Grafana MCP server |
| Argo CD / Flux | fix proposals become GitOps PRs against the manifests repo |
| Slack / Teams | interactive investigation threads |

## 📥 Context & Data Sources

* `pod spec and status`
* `recent events`
* `container logs (current + previous)`
* `resource requests vs. usage`
* `rollout and Helm revision history`
* `node conditions`
* `related ConfigMaps/Secrets`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* kubernetes MCP tools (read-only: get, logs, describe, top)
* Grafana MCP (dashboards, Loki logs)
* GitHub MCP (open GitOps PR)

## ✅ Expected Benefits

* First-line triage before a human is paged; many incidents die before they become tickets.
* Consistent expertise: every engineer gets senior-SRE-quality first analysis.
* Safer debugging: investigations run under read-only RBAC instead of ad-hoc kubectl from laptops.
* A growing, searchable knowledge base of confirmed diagnoses for your specific clusters.

## 🔒 Safety & Guardrails

* Run the agent under a dedicated service account with read-only verbs; never bind cluster-admin.
* Scrub Secret contents and sensitive annotations from all context; log redaction at the collector boundary.
* Allowlist namespaces and clusters the agent may investigate; per-tenant audit trail of every API call the model made.
* For regulated clusters, run the model locally (Ollama/vLLM) so pod data never leaves the network.

## 🚀 Future Implementation

* Supervised auto-remediation for pre-approved playbooks (restart stuck rollout, bump memory limit) with an approval queue.
* Multi-cluster rollout of the same diagnosis capability via kagent-style agent control planes.
* Proactive mode: detect misconfigurations (missing requests, probe mismatches) before they cause incidents.

## 🔗 Related Ideas

- [13 · AI Pod Crash Analyzer](../13-ai-pod-crash-analyzer/README.md)
- [17 · AI Kubernetes Incident Investigator](../17-ai-kubernetes-incident-investigator/README.md)
- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
