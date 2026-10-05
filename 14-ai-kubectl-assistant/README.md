# 14 · AI kubectl Assistant

> Natural-language Kubernetes operations with guardrails: the assistant writes the command, validates it with dry-run, and you execute it.

![Area](https://img.shields.io/badge/Area-Kubernetes-326ce5) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☸️ Kubernetes |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | kubectl / Helm / Kustomize · kubernetes MCP server · Shell (CLI plugin) · Slack / Teams |

---

## 📌 Problem

Everyone from product engineers to SREs needs to interact with Kubernetes, but the kubectl surface area (and its capacity for damage) makes that intimidating.

* Constructing the right command — selectors, jsonpath, patch syntax — is a skill barrier for most engineers.
* Copy-pasting commands from LLM chat windows into production terminals is dangerous: no validation, no context, no audit.
* Cross-namespace/multi-resource questions ('which pods on node X are missing requests?') require scripting most people don't have.

**Why it matters:** A validated NL→kubectl path makes cluster operations accessible and safe, shrinking the expert bottleneck without raising risk.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Intent translation | converts natural language to kubectl (or Helm/Kustomize) commands with correct syntax and scope |
| Safety classification | labels each generated command read-only vs. mutating vs. destructive and refuses out-of-policy requests |
| Dry-run validation | executes `--dry-run=server` for mutating commands and shows the diff before the human runs anything |
| Output explanation | summarizes command output in context ('this deployment has no PDB — a node drain will take it down') |

## 💡 Proposed Solution

A terminal (or Slack) assistant wired to the cluster through the kubernetes MCP server. It generates commands, classifies their safety, validates mutating ones via server dry-run, and hands execution to the human — the assistant never applies directly. Audit log records every generated and executed command.

### Workflow

1. **Ask** — engineer states intent in the terminal or chat
2. **Generate** — model drafts the command(s) with cluster context (namespaces, resource kinds)
3. **Classify** — policy engine labels safety level; destructive requests need explicit confirmation
4. **Validate** — server dry-run / `--debug` checks; show resulting diff or filtered output
5. **Execute (human)** — one-keystroke approval runs the command in the user's own RBAC context
6. **Explain** — assistant summarizes the output and suggests follow-ups

**Human-in-the-loop:** The human executes everything in their own context; the assistant is a writer/validator, never an executor.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Engineer intent (CLI · Slack)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Command drafter (cluster-aware)                    │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← MCP kubernetes
┌────────────────────────────────────────────────────┐
│ Safety classifier (read · mutate · delete)         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Server dry-run validation                          │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Human executes in own RBAC                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Output explained + follow-ups                      │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| Kubernetes AI tooling (CNCF) | K8sGPT · HolmesGPT · kagent · kubectl-ai | open-source analyzers and agents to build on instead of starting from scratch |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| kubectl / Helm / Kustomize | command generation targets |
| kubernetes MCP server | cluster access for context and dry-run |
| Shell (CLI plugin) | terminal-native experience |
| Slack / Teams | chat mode for quick questions |

## 📥 Context & Data Sources

* `live cluster metadata (namespaces, kinds, labels)`
* `user's RBAC context`
* `resource schemas`
* `org policies`
* `recent changes to the target resource`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Kubernetes MCP (read & server dry-run validation)
* Kubectl / Helm / Kustomize CLI wrappers
* RBAC Context & Policy Validator

## ✅ Expected Benefits

* Lower barrier to safe cluster work for all engineers.
* Validation and audit close the copy-paste-from-ChatGPT risk.
* Faster answers to cross-cutting questions that used to need scripting.

## 🔒 Safety & Guardrails

* The assistant's own credentials are strictly read-only and dry-run validated; execution happens solely in the human's authenticated RBAC context.
* Destructive verbs (delete, scale to zero, drain) require explicit typed confirmation and are logged.
* Watch for prompt injection via resource names/annotations; treat all cluster output as data.
* Prefer local models (Ollama/vLLM) in regulated environments so cluster metadata stays in-network.

## 🚀 Future Implementation

* Read-only 'explain mode' by default, with per-user unlock for mutating suggestions.
* Team playbooks: saved, parameterized multi-step flows the assistant can walk users through.

## 🔗 Related Ideas

- [02 · AI Kubernetes Troubleshooter](../02-ai-kubernetes-troubleshooter/README.md)
- [19 · AI Cluster Operations Agent](../19-ai-cluster-operations-agent/README.md)
- [13 · AI Pod Crash Analyzer](../13-ai-pod-crash-analyzer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
