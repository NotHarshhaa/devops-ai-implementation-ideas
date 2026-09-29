# AI Developer Environment Troubleshooter — Architecture

> Fix 'works on my machine' fast: the assistant reads local error output, checks the environment, and walks the developer to a fix.

*Focus: 🧑‍💻 Developer Experience · Status: 📐 Architecture documented · Part of the [DevOps AI Implementation Ideas](../../README.md) catalog.*

## 1. Overview

A CLI/IDE-resident assistant (Claude Code / Copilot / Cline-class tools, or a custom CLI) plus a chat fallback: developers paste errors or run a diagnostic command; the assistant inspects the local environment read-only, explains the problem, and guides the fix. Anonymized issue classes aggregate into org-level fixes (better Makefiles, setup scripts, docs).

## 2. High-Level Architecture

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

## 3. Components

| Component | Responsibility |
| --- | --- |
| CLI assistant | local diagnostic command and chat |
| Local inspectors | versions, ports, containers, caches, env |
| Diagnosis engine | LLM with org-specific environment knowledge |
| Knowledge base | known local issues and fixes |
| Aggregator | anonymized issue-class reporting |

## 4. Data Flow

1. The developer invokes the assistant with an error.
2. Local checks run with consent and read-only scope.
3. A diagnosis and ordered fix plan is presented.
4. Outcomes (fixed/not) and issue classes feed org improvements.

## 5. AI Platform Mapping

The design is provider-agnostic; any layer can be swapped without touching the others.

| Category | Options | Role |
| --- | --- | --- |
| AI coding agents (human-invoked) | Claude Code · OpenAI Codex · GitHub Copilot coding agent · Cursor · Cline · OpenHands | author the suggested fix as a reviewed pull request |
| Cost-efficient model tiers | GPT-5 Mini/Nano · Claude Haiku 4.5 · Gemini Flash · DeepSeek V4 · Mistral Small | high-volume events (every failure, every alert) at a fraction of frontier cost |
| Open-weight / self-hosted models | DeepSeek V4 · Qwen 3.x · Llama 4 · Mistral Large 2 served via vLLM or Ollama | keeps sensitive logs and infrastructure data in-house; zero per-token cost |
| RAG stack | pgvector · Qdrant · Weaviate · OpenSearch k-NN; embeddings from OpenAI, Cohere Embed, or open BGE-M3 | retrieval over runbooks, docs, wikis, past incidents, and changelogs |
| AI observability & evaluation | Langfuse · Arize Phoenix · LangSmith · W&B Weave · OpenTelemetry GenAI conventions · promptfoo | tracing of every model and tool call, cost/latency tracking, prompt regression evals |

## 6. Context Building Strategy

The context builder assembles only what the model needs — fresh, relevant, and redacted — rather than dumping raw system output. Sources:

* `error output`
* `local versions and state`
* `org setup docs`
* `known issue database`
* `recent repo setup changes`

## 7. Human-in-the-Loop & Approval

Runs on the developer's machine with their consent; destructive commands (docker system prune) require explicit confirmation and show alternatives.

## 8. Security Considerations

* Local inspection is privacy-sensitive: explicit scope, nothing leaves the machine except redacted error context.
* Never exfiltrate env vars/secrets; metadata (presence, not value) only.

## 9. AI Observability

Every prompt, completion, and tool call is traced with OpenTelemetry GenAI conventions into Langfuse or Arize Phoenix: latency, token cost, retrieval hits, tool errors, and human accept/reject outcomes become the eval dataset that gates prompt and model changes (promptfoo regression suites run in CI before any prompt ships).

## 10. Deployment & Scaling

Start as a stateless service (or even a CLI) invoked by webhooks, schedules, or chat commands. Containerize it, give it read-only credentials scoped to one system, and only graduate to a long-running agent with an approval queue once precision is trusted.

## 11. Cost Considerations

Events are batch-shaped and bursts follow working hours, so spend is spiky but low. Mini/flash-class models typically handle triage at a fraction of a cent per event; a frontier model is reserved for the deep-analysis step, and an open-weight model via Ollama or vLLM can bring marginal cost to zero at the price of self-hosting.

## 12. Related Ideas

- [43 · AI DevOps Documentation Generator](../43-ai-devops-documentation-generator/README.md)
- [44 · AI Repository Infrastructure Analyzer](../44-ai-repository-infrastructure-analyzer/README.md)
- [12 · AI Deployment Troubleshooting Agent](../12-ai-deployment-troubleshooting-agent/README.md)
