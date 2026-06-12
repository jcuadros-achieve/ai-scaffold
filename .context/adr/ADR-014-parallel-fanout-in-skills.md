# ADR-014: Parallel subagent fan-out as skill content, with graceful degradation

**Date:** 2026-06-12
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Improvement proposal (2026-06-12): exploit parallel
subagents where the harness offers them. Pilot data from `ffn-cxt-packages`:
~7 apps + ~5 packages, where each package holds up to ~16 independently
compiled, versioned libraries — a two-level monorepo.

## Context

Some skill work decomposes into genuinely independent sub-tasks. The dominant
benefit is not speed but **context budget**: a subagent starts with a clean
window and returns a structured summary — in `ai-init`'s monorepo mode,
analyzing the last workspaces with a saturated window is exactly where the
synthesis (the part that matters most) degrades. The work chain, by contrast,
is sequential **by design**: its human gates are the product, not a
bottleneck.

## Decision

1. **Parallelization is expressed as skill content** — markdown directives
   with a degradation clause ("without subagent support, do the same work
   sequentially; identical output either way"). No `.claude/agents/`
   definitions (deferred until inline prompts prove insufficient) and no
   `.claude/workflows/` scripts (rejected for now: a second execution paradigm
   and JS maintenance inside the payload, against ADR-011's simplicity).
2. **Where it applies** — only where sub-tasks are independent:
   - `ai-init` (monorepo): one subagent per **top-level workspace** runs the
     deep read + per-workspace analysis and returns it structured; the main
     agent keeps the cross-cutting layer, generation and all writes.
   - `pr-review`: one subagent per pass (7), returning findings in the
     standard table; the main agent merges, dedupes and writes the verdict.
   - `security-review`: one subagent per dimension (7), same shape.
   The work chain itself is **explicitly not parallelized**.
3. **The fan-out unit in a monorepo is the top-level workspace, never the
   sub-library.** A package's libraries are inventoried *inside* that
   package's analysis (per-lib fan-out would mean ~80 agents in the pilot);
   only an unusually heavy library earns its own pass. The same granularity
   bounds ADR-013's nested `CLAUDE.md`: one per top-level workspace, with a
   library index inside a package's file — not ~80 nested files.
4. **Subagents are read-only analysts.** They never write files or make
   decisions; synthesis, verdicts and writes belong to the main agent. No
   model configuration anywhere (ADR-005: subagents inherit the session
   model).
5. **Suggested concurrency: ~4–6 in flight** — enough for the pilot's ~12
   workspaces in two to three waves without saturating the machine or the
   session.

## Consequences

**Positive:**
- `ai-init` quality on large monorepos improves where it matters: every
  workspace is analyzed with a fresh window, and the main context only holds
  summaries plus the cross-cutting layer.
- Reviews parallelize with a defined merge step (dedupe by file+line+issue,
  highest severity wins).
- Zero new payload surface; harnesses without subagents lose nothing.

**Negative / tradeoffs:**
- Inline fan-out prompts make the three skills longer.
- Merge/dedupe quality in reviews depends on the main agent following the
  merge rule; mitigated by making the rule explicit in the skill.

## Alternatives considered

### Shipped subagent definitions (`.claude/agents/`)
Deferred, not rejected: pays only if inline prompts prove insufficient (the
monorepo pilot will tell); adding the mapping later is trivial.

### Workflow scripts (`.claude/workflows/`)
Rejected for now: deterministic orchestration is attractive, but it introduces
a second execution paradigm and versioned JS inside a payload that just
converged on "markdown playbooks only".

### Parallelizing the work chain
Rejected: the gates between understanding, planning and coding are the value
proposition (ADR-003); there is nothing independent to fan out.

## Context for AI assistants

- Fan-out only in the three designated skills; do not add parallelization to
  work-chain skills.
- Subagents never write files; if a fan-out instruction seems to need writes,
  the design is wrong — restructure so the main agent writes.
- Keep the degradation clause when editing these sections; the sequential
  path is the contract, the parallel path is an optimization.
