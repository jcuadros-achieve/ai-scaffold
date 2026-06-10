# ADR-004: Decision capture at plan approval, before implementation

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Supersedes:** ADR-003, decision 2 only (the *timing* of ADR drafting; the
session log and the Hand-off mechanism are unchanged)
**Ticket / context:** Design review of 2026-06-10 (follow-up). ADR-003 placed
all context capture at the work chain's closing edges; the review observed
that architectural decisions should be documented *before* coding, not after.

## Context

ADR-003 made `pr-write` draft any required ADR at its close. But the
architectural decision is actually *made* when the human approves the plan —
that is when the approach is chosen and the alternatives are rejected. By PR
time the alternatives have faded (and `adr-write` forbids fabricating them),
and `pr-review`'s "is there an ADR?" pass can only check existence, not
whether the code respects the recorded decision. This repo's own flow
(ADR-001) already requires "ADR before implementing" — the payload should
practice what the tool practices.

## Decision

Split memory capture by type, anchored to when each becomes true:

1. **Decisions — at the start of `task-implement` (step 0).** The approved
   plan just fixed a decision. Before writing any code, evaluate the
   `adr-write` triggers against the chosen approach; if any applies, draft the
   ADR now. Not gated. The capture is *not* inside `task-plan` because until
   the human approves, there is no decision to record — only a proposal.
2. **Session log — unchanged at `task-implement`'s close** (`ai-log-write` is
   retrospective by nature: it records what was done).
3. **`pr-write`'s close becomes a safety net, not the author:** verify the ADR
   exists and still matches what was implemented — approved deviations may
   have changed the decision; update or supersede it if so. Draft from scratch
   only if the step-0 capture was missed. `context-update` (index refresh)
   stays here.

## Consequences

**Positive:**
- ADRs record alternatives while they are fresh, instead of reconstructing
  them at PR time.
- `pr-review` pass 7 upgrades from "does an ADR exist?" to "does the code
  match the recorded decision?".
- The payload's flow now mirrors the discipline this repo applies to itself
  (decision gate before implementation, ADR-001).

**Negative / tradeoffs:**
- An early ADR can be invalidated by implementation reality; mitigated by the
  deviation protocol (a deviation is a decision change → the `pr-write` safety
  net updates or supersedes the ADR).
- `task-implement` runs slightly longer before the first line of code.

## Alternatives considered

### Draft the ADR inside `task-plan`
Rejected: the decision does not exist until the human approves the plan; an
ADR written before approval documents a proposal, and `adr-write` requires
recording made decisions (status `Accepted` on creation).

### Keep drafting at `pr-write` (ADR-003 as written)
Rejected for the reasons above: stale alternatives, and review can only check
existence rather than conformance.

### A separate human gate for the ADR
Rejected: writing memory is append-only and direction-free; gating it adds
friction without control (same reasoning as ADR-003).

## Context for AI assistants

- `task-implement` must run its step 0 (ADR trigger check) **before any code**;
  do not move it back to `pr-write`.
- `pr-write`'s closing ADR step is verification/update, not authorship — do not
  turn it back into the primary capture point.
- The session log stays retrospective at `task-implement`'s close; do not try
  to write it before implementation.
