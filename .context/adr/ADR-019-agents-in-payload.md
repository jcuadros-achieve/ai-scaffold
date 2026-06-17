# ADR-019: Agents in the payload — read-only specialists, model by `effort`/tier

**Date:** 2026-06-16
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Redesign on `feature/redesign`. ADR-014 deliberately kept
`.claude/agents/` out of the payload — subagents were read-only analysts invoked
via fan-out *directives* inside skills, with the sequential path as the contract.
The catalog model (ADR-018) reopens the question: per-language reviewer/explorer
agents are the canonical example of catalog bloat that `appliesWhen` filtering
solves, and shipping agent definitions unlocks two things a skill directive
cannot.

## Context

A skill directive cannot pin a model per task, and cannot run in a tool-scoped
fresh context. Those are exactly the two gains an agent file provides:
**model-pinning** (Haiku for mechanical work, Opus for deep review — aligns with
the model-selection strategy in `performance.md`) and a **specialized,
tool-restricted context** that does not pollute the main thread. The repo's own
`ecc:*` reviewer set (one per language) is precisely the kind of per-stack
expertise the filter should narrow — a strong argument *for* shipping agents,
since they fit `appliesWhen` better than almost any other surface.

## Decision

### 1. Agents ship as a catalog surface

`.claude/agents/<name>.md`, filtered by `appliesWhen` like every other entry
(e.g. a `typescript-reviewer` only for TS projects).

### 2. Fase 1 — read-only specialists only

Reviewers, explorers, diagnostic build-resolvers. **No writer agents** in this
phase: parallel file mutation means conflicts and worktrees, a bigger step that
reopens more of ADR-014 than necessary. Writer agents are deferred to a future
ADR.

### 3. Model declared as `effort`/tier intent, never a model id

An agent entry declares `effort: <tier>` (the intent), not a concrete model id —
this **extends ADR-005** (model tiers as metadata, never IDs, "a test rejects
them") to the agent surface. `ai-init` concretizes the intent to the real model
for the project/environment at apply/customize time. Tool restriction is part of
the entry (`tools: [...]`).

```yaml
id: agent/typescript-reviewer
surface: agent
appliesWhen: { any: [ { lang: typescript }, { file: "**/tsconfig.json" } ] }
readOnly: true
effort: deep                     # tier intent — NOT a model id
tools: [Read, Grep, Glob, Bash]
```

### 4. Fan-out-as-content survives

ADR-014's posture for `ai-init`, `pr-review` and `security-review` — read-only
fan-out as skill *content* with a mandatory sequential degradation clause — is
unchanged. What this ADR overturns is only the "no agents/workflow artifacts"
clause, and only for read-only specialist agents.

## Consequences

**Positive:**
- Model-pinned, tool-scoped specialists — capabilities skills cannot express.
- Agents are the best fit for `appliesWhen` filtering (per-stack reviewer set).
- Stays model-agnostic via `effort`/tier; no model id ever ships.

**Negative / tradeoffs:**
- A new surface to govern and version.
- Supersedes a recent decision (ADR-014's agents clause).
- The `effort`→model concretization step in `ai-init` becomes load-bearing.

## Alternatives considered

### Keep agents out, directives only (status quo, ADR-014)
Rejected: a directive cannot pin a model or scope tools — the two gains that
justify shipping agents at all.

### Ship agents with concrete model ids
Rejected: breaks ADR-005 and guarantees staleness as new models ship. Intent via
`effort`, concretized by `ai-init`, is the agnostic path.

### Ship writer agents too in fase 1
Deferred: the risk (parallel mutation, worktrees) is out of proportion to the
fase-1 goal. Read-only specialists first; writers via a later ADR.

## Context for AI assistants

- Agent frontmatter declares `effort`, never a model id (the catalog test
  rejects ids — ADR-018 §6).
- Fase-1 catalog agents are read-only. `ai-init` maps `effort`→model at install.
- Writer agents are out of scope until a future ADR supersedes this one.
- This ADR supersedes ADR-014's "no agents in the payload" clause and extends
  ADR-005 (tier metadata) to the agent surface.
