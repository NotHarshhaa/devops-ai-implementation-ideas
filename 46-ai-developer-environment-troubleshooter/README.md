# 46 · AI Developer Environment Troubleshooter

> Fix 'works on my machine' fast: the assistant reads local error output, checks the environment, and walks the developer to a fix.

![Area](https://img.shields.io/badge/Area-Developer%20Experience-yellow) ![Status](https://img.shields.io/badge/Status-Architecture%20Documented-orange) ![Complexity](https://img.shields.io/badge/Complexity-Low-lightgrey) ![Automation](https://img.shields.io/badge/Automation-Assistive-informational)

| | |
| --- | --- |
| **Focus area** | 🧑‍💻 Developer Experience |
| **Complexity to prototype** | Low |
| **Automation level** | Assistive |
| **Primary integrations** | Docker / Podman · IDE assistants (Copilot/Claude Code/Cline) · Setup scripts / Makefiles · Slack help channels |

---

## 📌 Problem

Local environment failures — broken containers, port conflicts, version mismatches, stale caches — cost individual developers hours and interrupt teammates who help them.

* Errors are local and thus invisible to any centralized tooling; no telemetry, no triage.
* Causes are mundane but varied (Docker state, PATH, port conflicts, versions, permissions).
* Help-seeking interrupts senior teammates repeatedly for the same classes of problem.
* Environment docs (idea 43) help setup, but breakage diagnosis is different.

**Why it matters:** Developer-flow interruptions are among the most expensive productivity losses; fast local unblocking pays back daily.

## 🤖 AI Opportunity

| AI capability | How it helps here |
| --- | --- |
| Error interpretation | reads pasted errors/logs and identifies the likely local cause |
| Environment inspection | with permission, checks versions, ports, containers, caches on the developer's machine |
| Fix guidance | step-by-step unblock with explanation, preferring reversible commands |
| Pattern learning | org-wide view of recurring environment issues → better defaults and docs |

## 💡 Proposed Solution

A CLI/IDE-resident assistant (Claude Code / Copilot / Cline-class tools, or a custom CLI) plus a chat fallback: developers paste errors or run a diagnostic command; the assistant inspects the local environment read-only, explains the problem, and guides the fix. Anonymized issue classes aggregate into org-level fixes (better Makefiles, setup scripts, docs).

### Workflow

1. **Ask** — developer pastes error or runs `devdoctor`
2. **Inspect** — read-only local checks (versions, ports, containers, disk, env vars presence)
3. **Diagnose** — likely cause with reasoning shown
4. **Guide** — ordered fix steps; explanations for each; nothing destructive without confirmation
5. **Aggregate** — issue classes across the org feed setup-script and doc improvements

**Human-in-the-loop:** Runs on the developer's machine with their consent; destructive commands (docker system prune) require explicit confirmation and show alternatives.

## 🏗️ Architecture

Full component breakdown, data flow, and platform mapping: [`architecture/architecture.md`](architecture/architecture.md).

```text
┌────────────────────────────────────────────────────┐
│ Error pasted / devdoctor run                       │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Read-only local inspection                         │
└────────────────────────────────────────────────────┘
                          │
                          ▼  ← with consent
┌────────────────────────────────────────────────────┐
│ Diagnosis + reasoning                              │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Guided fix (reversible first)                      │
└────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────┐
│ Org-wide pattern aggregation                       │
└────────────────────────────────────────────────────┘
```

## 🧠 AI Platforms

| Category | Options | Role in this idea |
| --- | --- | --- |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 🔌 DevOps Integrations

| System / tool | Integration point |
| --- | --- |
| Docker / Podman | container state inspection |
| IDE assistants (Copilot/Claude Code/Cline) | embed point |
| Setup scripts / Makefiles | org-standard fixes |
| Slack help channels | fallback human path + pattern capture |

## 📥 Context & Data Sources

* `error output`
* `local versions and state`
* `org setup docs`
* `known issue database`
* `recent repo setup changes`

## 🛠️ Tools the AI May Call

Exposed to the model with scoped, read-first permissions:

* Local System Diagnostic Runner (docker, port, process, file checks)
* Redacted Error Log Analyzer
* Developer Environment Knowledge Base (RAG)
* Shell Remediation Command Generator

## ✅ Expected Benefits

* Developers unblocked in minutes without interrupting teammates.
* Recurring environment issues fixed at the source (scripts, docs).
* Institutional memory for local-environment quirks.

## 🔒 Safety & Guardrails

* Local inspection is privacy-sensitive: explicit scope, nothing leaves the machine except redacted error context.
* Never exfiltrate env vars/secrets; metadata (presence, not value) only.

## 🚀 Future Implementation

* Pre-flight checks: `devdoctor --preflight` before first run of a repo.
* Nix/devcontainer suggestions to eliminate environment drift entirely.

## 🔗 Related Ideas

- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)
- [12 · AI Deployment Troubleshooting Agent](../12-ai-deployment-troubleshooting-agent/README.md)

---

*Status: 📐 Architecture documented — no implementation code yet. See the [idea catalog](../README.md#-idea-catalog) for all ideas.*
