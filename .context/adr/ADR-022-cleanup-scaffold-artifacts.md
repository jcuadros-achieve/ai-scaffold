# ADR-022: Clean up ephemeral `.scaffold/` artifacts when ai-init completes

**Date:** 2026-06-22
**Status:** Accepted
**Deciders:** Jonathan Huamani
**Refines:** ADR-017 §4 (the "ephemeral artifacts" clause — keeps the during-flow
rationale, adds an after-flow cleanup)
**Ticket / context:** ADR-017 §4 places `project-profile.json`, `candidates.json`
and `install-plan.json` under a gitignored `.scaffold/` "so `apply` can re-run
without re-scanning." That rationale is real *during* the flow, but nothing
consumes the directory once ai-init finishes: `update`, `status`, and `diff` all
read `.claude/.scaffold-state.json` + the catalog, never `.scaffold/`. The
artifacts are declared "ephemeral" yet never collected, so they linger in every
target indefinitely — a gap between the stated intent and the behavior.

## Context

`.scaffold/` holds three handoff files between the agent (`ai-init`) and the CLI:

```
ai-init (scan)      →  project-profile.json   (facts; the agent→CLI boundary)
ai-scaffold suggest →  candidates.json         (mechanical appliesWhen filter)
ai-init (curation)  →  install-plan.json       (ranked, justified, confirmed)
```

Only two CLI commands read them: `suggest` (profile) and `apply` (plan). After
`apply` writes the payload and state, no later command touches the directory —
verified in `update.ts`, `status.ts`, and `diff.ts`, which key off
`.claude/.scaffold-state.json` and the compiled catalog. Those commands even
print "Re-run ai-init to pick up entries newly applicable to the project",
meaning new entries come from a fresh scan (Phase 1 regenerates everything), not
from reusing old artifacts.

So the only live consumer of a *persisted* `.scaffold/` is the narrow "re-run
`apply` without re-scanning" case — and that case is only meaningful **while the
flow is in progress** (apply failed, the plan was hand-edited, a conflict was
resolved and re-applied). Once ai-init reaches Phase 5, that window is closed.

The skill already acknowledges the gap in words but not in action
(`templates/skills/ai-init.md`):

> "The three `.scaffold/*.json` files are ephemeral (gitignored) — re-running is
> safe."

## Decision

ai-init cleans up `.scaffold/` as the final step of Phase 5, after the payload
is written and the summary is printed. The directory is removed; the three files
do not persist past a completed run.

### 1. Cleanup is the agent's, not the CLI's

The agent already writes `.scaffold/project-profile.json` and
`.scaffold/install-plan.json` directly — it is the owner of that directory, and
the directory is **not payload** (ADR-017 §2's "single writer" rule governs
payload, i.e. `.claude/` and `.context/`, not the ephemeral handoff workspace).
So instructing the agent to remove its own workspace does not violate the layer
split; it is consistent with it. No cleanup logic is added to `installer.ts` —
that stays pure, payload-only logic.

### 2. The ADR-017 §4 rationale is preserved *during* the flow

The "re-run `apply` without re-scanning" benefit is unchanged while ai-init is
in progress: if `apply` fails or the plan is revised, `.scaffold/` is still
present because Phase 5 has not run. Cleanup happens **only on full completion**.
A run interrupted before Phase 5 leaves the artifacts in place, so the recovery
path (re-run `apply`, or resume ai-init) is unaffected.

### 3. Re-running ai-init is unaffected

ai-init is explicitly re-runnable ("re-run after major changes" — its help
card). Phase 1 re-scans from scratch and overwrites any prior artifacts, so a
clean directory is not a special case: the flow regenerates everything it needs
on entry. There is no dependency on a prior run's `.scaffold/`.

### 4. State is the persistent record, not `.scaffold/`

What must survive a clone for `update`/`status`/`diff` to work is
`.claude/.scaffold-state.json` (tracked, id-keyed install state — ADR-017 §3).
`.scaffold/` was never that record. Removing it changes nothing about how later
commands reconcile installed entries against the catalog.

## Consequences

**Positive:**
- The workspace reflects the stated "ephemeral" intent — no stale artifacts
  linger in every target after onboarding.
- Less confusion for users who encounter `.scaffold/` and wonder what it is or
  whether it should be committed.
- Closes the gap between the skill's stated contract ("ephemeral") and its
  behavior.

**Negative / tradeoffs:**
- After a completed run, the scan/profile/plan are no longer available for
  inspection. The install *state* (what got installed, at what version) is still
  in `.claude/.scaffold-state.json`; what is lost is the *reasoning trail*
  (facts, candidates, justification). This is acceptable because those are
  point-in-time inputs to a one-shot decision, not durable memory.
- A user who wants to re-run `apply` alone (without re-scanning) after ai-init
  has finished must re-run ai-init instead — one extra phase, but it produces a
  fresh, accurate plan rather than re-applying a stale one.

## Alternatives considered

### Clean up inside `apply`
Rejected: breaks the ADR-017 §4 rationale at the moment it matters most. If
`apply` deletes `.scaffold/` on success, a failed `apply` (or a follow-up
re-apply after a hand-edit) loses the plan and forces a full re-scan. Cleanup
belongs at the *flow's* boundary (Phase 5), not the *command's* boundary.

### An explicit `ai-scaffold clean` CLI command
Deferred. It is a reasonable manual escape hatch (e.g. an interrupted run that
left `.scaffold/` behind), but it adds command surface for a case the agent
already handles at completion. If the need shows up in practice (interrupted
runs being common), add it then — not speculatively.

### Never clean up (keep ADR-017 §4 as-is)
Rejected: the "re-run without re-scanning" benefit is real but scoped to the
in-progress flow, and the artifacts are already declared ephemeral. Keeping them
forever contradicts the design's own stated intent and leaves every target with
a gitignored directory that no command ever reads again.

## Context for AI assistants

- `.scaffold/` is the agent's ephemeral handoff workspace, not payload and not
  state. ai-init removes it at the end of Phase 5, after writing the payload.
- Do NOT add cleanup to `apply` or to `installer.ts` — that destroys the
  during-flow re-run benefit and leaks UI/orchestration into pure logic.
- `.claude/.scaffold-state.json` is the durable record; `.scaffold/` never was.
- Re-running ai-init is the recovery path for a cleaned-up directory; Phase 1
  regenerates everything.
- This refines (does not supersede) ADR-017 §4: the artifacts stay present
  *during* the flow and are removed *after* it completes.
