# ADR-021: Writer agents — bounded read-write specialists under a human gate

**Date:** 2026-06-18
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Supersedes:** ADR-019 §2 (the "fase 1 read-only only, no writer agents" clause)
**Ticket / context:** Read-only was a conservative fase-1 guardrail while the
agent surface settled (ADR-019 §2 explicitly deferred writers as future work).
The surface and its toolchain are now stable, and the workflow gains real value
from agents that implement (write HCL, scaffold a module, run build/test), not
just review. The question is how to allow writers without reopening the parallel-
mutation risk ADR-019 named.

## Context

ADR-019 shipped agents as a read-only surface — reviewers and explorers — and a
test enforces `readOnly: true` on every agent entry. That bound the blast radius
to "report, don't touch", which was right while the surface was new. But several
high-value agents are builders by nature: a `terraform-builder` that writes HCL
and plans, a `go-builder`/`typescript-builder` that implements following repo
patterns and runs the toolchain. A read-only reviewer cannot produce these. The
risk ADR-019 cited — parallel file mutation, conflicts, worktrees — is real but
is a *coordination* problem, not a reason to never write.

## Decision

### 1. Writer agents are allowed as a catalog surface

An agent may declare `readOnly: false` with `tools: [Read, Grep, Glob, Bash,
Edit, Write]` (a superset of the read-only tool set). Writers are marked
`stability: experimental` until they earn `stable` through use.

### 2. The read-write contract bounds the blast radius

Every writer agent documents, in its body, four non-negotiable controls:

1. **Isolated worktree** — `git worktree add` its own branch off the base; never
   the main checkout or a shared branch.
2. **Scoped writes** — only the files its role owns; secrets, lockfiles, and
   generated/state files are no-touch (the `no-touch` rule's protected zones).
3. **Human gate** — destructive or production-facing actions (apply, deploy,
   force anything) are surfaced as yes/no and never taken autonomously.
4. **Durable artifact hand-off** — a branch, patch, or draft PR the human
   reviews, never silent in-place mutation of the working tree.

The "worktree + scope + gate + hand-off" quartet is the contract that earns the
write tools; an agent without it stays read-only.

### 3. The catalog test changes from "must be read-only" to "must be bounded"

`catalog-index.test.mjs` no longer asserts `readOnly === true` on all agents.
Instead: every agent declares `readOnly` (boolean), and a writer (`readOnly:
false`) must declare the **four control fields** that make its blast radius
auditable — `tools` including Edit/Write, and a documented contract in the body.
Read-only agents (the existing ones) are unchanged.

### 4. Model stays `effort`/tier, never an id

Unchanged from ADR-019 §3 — a writer declares `effort: deep`, concretized by
`ai-init`. Adding write tools does not touch model selection.

## Consequences

**Positive:**
- High-value builder agents (terraform, language stacks) can ship and be
  filtered by `appliesWhen` like every other entry.
- The blast radius is auditable from the catalog alone (tools + documented
  contract), not implicit.
- Read-only remains the safe default; writers are opt-in and `experimental`.

**Negative / tradeoffs:**
- A writer misused can mutate files — mitigated by worktree isolation + the human
  gate, but the surface is riskier than read-only.
- A new test invariant replaces a simpler one; more to maintain.
- Worktree coordination with the orchestrator (and parallel writer agents) is a
  real operational concern — writers must not collide on the same checkout.

## Alternatives considered

### Keep all agents read-only forever (ADR-019 §2 as permanent)
Rejected: leaves the builder value on the table and forces every implementation
task back onto the main thread, which is exactly what specialists exist to offload.

### Allow writers with no declared contract
Rejected: an unauditable blast radius. The four control fields are what make a
writer safe-by-construction rather than safe-by-hope.

### Model writers as skills instead of agents
Rejected: a skill runs on the main thread with the main context; it cannot pin a
model, cannot run in a tool-scoped fresh context, and cannot be dispatched in
parallel — the three reasons agents exist. Writers belong on the agent surface.

## Context for AI assistants

- Agents may now be `readOnly: false`; they are `experimental` until proven, and
  must document the read-write contract (worktree, scoped writes, human gate,
  durable hand-off) in their body.
- Read-only is still the default and the norm; create a writer only where the
  value of writing/running the toolchain clearly justifies it.
- The catalog test now checks that a writer declares its control fields, not that
  all agents are read-only. Do not relax the contract to add a writer — add the
  fields instead.
- This ADR supersedes the "no writer agents" clause of ADR-019 §2; everything
  else in ADR-019 (effort/tier, appliesWhen filtering, tool scoping) stands.
