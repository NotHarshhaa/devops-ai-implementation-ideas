# 25 · AI Cloud Troubleshooting Assistant

> Investigate AWS/Azure/GCP issues conversationally: the assistant queries cloud APIs read-only, reads the evidence, and explains what's wrong.

![Area](https://img.shields.io/badge/Area-Cloud-orange) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Medium-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | ☁️ Cloud |
| **Complexity to prototype** | Medium |
| **Automation level** | Assistive |
| **Primary integrations** | AWS / Azure / GCP · Slack / Teams · Terraform repos · Confluence / wikis |

---

## 📌 Problem

Cloud troubleshooting means navigating three console UIs, half-remembered service quirks, and API docs — while the out-of-memory instance is still on fire.

* Each cloud has hundreds of services with different diagnostics patterns (VPC flow logs, SG rules, IAM policies, quotas, service health).
* Engineers know what to check but not the exact API/CLI incantation, or lack console access.
* Cross-service causality (security group + NACL + route table) requires joining several reads mentally.
* Late-night incidents amplify all of the above.

**Why it matters:** Faster cloud triage reduces MTTR and — more importantly — reduces the temptation to 'just restart it' without understanding.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Guided cloud investigation | asks the right diagnostic questions per service (is the SG attached? is the subnet routable? is the quota hit?) |
| Read-only tool use | runs describe/get/list calls via cloud MCP servers and reads the results for you |
| Cross-service correlation | assembles multi-resource explanations (instance + SG + NACL + route) into one narrative |
| Runbook retrieval | finds and follows the org's existing runbook for the symptom class |

## 💡 Proposed Solution

A chat-first assistant (Slack/CLI/web) wired to cloud APIs through scoped, read-only MCP servers. The engineer describes the problem; the assistant plans diagnostic reads, executes them, and explains findings with resource links. It never mutates; it drafts the fix as steps or a pull request against IaC.

### Workflow

1. **Describe** — engineer states the problem and the resource
2. **Plan** — assistant drafts a diagnostic checklist for the service class
3. **Investigate** — read-only API calls via MCP (describe, get, list) with every call shown in the thread
4. **Correlate** — joins multi-resource evidence into an explanation with console deep links
5. **Recommend** — fix steps or IaC PR draft; human executes

**Human-in-the-loop:** Strictly read-only tool access; the assistant narrates every API call it makes so nothing happens invisibly.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Engineer describes issue (Slack · CLI)             │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Diagnostic plan per service class                  │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Read-only cloud API fan-out                        │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← cloud MCP servers
┌────────────────────────────────────────────────────┐
│ Cross-resource correlation                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Explanation + fix steps / IaC PR                   │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| MCP servers (Model Context Protocol) | GitHub · kubernetes-mcp-server · mcp-grafana · Terraform MCP · AWS & Azure MCP · Slack · PagerDuty | standardized, permission-scoped, auditable tool access to DevOps systems |
| Agent frameworks | LangGraph · OpenAI Agents SDK · Microsoft Agent Framework · Google ADK · PydanticAI · CrewAI | orchestration: tool calling, retries, structured outputs, human-approval interrupts |
| Frontier cloud models | OpenAI GPT-5.x · Anthropic Claude Opus/Sonnet 4.x · Google Gemini 3 Pro · xAI Grok · Z.ai GLM | deep reasoning over the assembled context; strongest for root-cause analysis and fix suggestions |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| Model routing & AI gateways | LiteLLM · OpenRouter · Portkey · Kong AI Gateway · Cloudflare AI Gateway | provider-agnostic routing with fallbacks, budgets, caching, and audit logs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| AWS / Azure / GCP | via official cloud MCP servers and read-only IAM roles |
| Slack / Teams | primary interface |
| Terraform repos | fix-as-code drafts |
| Confluence / wikis | runbook retrieval |

## 📥 Context & Data Sources

* `resource state via API`
* `cloud service health`
* `org runbooks`
* `service quotas and limits`
* `recent change records`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Cloud MCP servers (describe/get/list only)
* Runbook search

## ✅ Expected Benefits

* Expert-level cloud diagnostics for every engineer, at any hour.
* All investigations auditable: every API call is in the thread.
* Fixes flow back as reviewed IaC instead of console clicks.

## 🔒 Safety & Guardrails

* Read-only roles only (ViewReader/Reader equivalents); no write verbs anywhere in the tool set.
* Account/subscription allowlists; sensitive accounts routed to local models.
* Prompt injection via resource tags/names is possible: treat API output as data; no action execution from text.
* Log every call for security review; cap result sizes.

## 🚀 Future Implementation

* Supervised write mode with per-service approval gates after trust is earned.
* Proactive checks: nightly exposure/health sweep with explained findings.

## 🔗 Related Ideas

- [29 · AI Cloud Resource Optimization Assistant](../29-ai-cloud-resource-optimization-assistant/README.md)
- [05 · AI Incident Investigator](../05-ai-incident-investigator/README.md)
- [27 · AI IAM Policy Reviewer](../27-ai-iam-policy-reviewer/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../../README.md#-idea-catalog) for all ideas.*
