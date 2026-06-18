---
name: ticket-update
description: Sync an existing ticket's status with what actually happened — gather the real progress, compose the update, gate before filing.
tier: deep
id: skill/ticket-update
surface: skill
summary: Reflect real work progress back onto an existing ticket (status + evidence), with a gate before filing
tags: [requirements, workflow]
appliesWhen:
  contains: "ticket"
  file: "**/TASK.md"
rationale: The close-the-loop reflection op of the work chain; only useful where a ticket/tracker context exists
stability: stable
---

# Skill: ticket-update

> **`/ticket-update help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Syncs an existing ticket's status with what actually happened — gathers evidence (commits, verify results, PR) and composes a status update.
> - **When:** Work has progressed, blocked, or finished — and the ticket is stale.
> - **Gates / asks:** Never marks a ticket Done without confirming acceptance criteria are met; filing via tracker MCP needs your explicit approval.
> - **Output:** Paste-ready status update (status, what changed, evidence, next), optionally filed.
> - **Chain:** Runs alongside the work chain (`task-implement`/`verify`/`pr-write`) to reflect progress back; not a linear successor.
> - **Example:** `/ticket-update PROJ-123` after the PR merges

The inverse of authoring: where `ticket-create` asks and `ticket-clarify`
analyzes, `ticket-update` **reflects** — it reads what actually happened in the
work and writes that back onto the existing ticket so the tracker matches
reality. Stale tickets (the tracker says "to do", the PR is merged) are a
coordination bug; this skill closes that gap.

---

## Phase 1 — Gather

Identify the ticket (ID/link in the prompt, or the active ticket in `TASK.md`)
and read the **real** progress, never guessing:

- **Status** — infer the canonical state from evidence, don't take the requester's
  word: `In progress` (commits exist, work underway), `Blocked` (a named blocker
  with who/what), `In review` (PR open), `Done` (merged + criteria met), or
  `Needs info` (a specific question back to the requester).
- **What changed** — the observable delta since the last update, in plain language.
- **Evidence** — commits (with hashes), verify/PR links, test results. No
  evidence, no status claim.
- **Blockers / next** — if blocked, name the blocker and the unblock owner; if
  in flight, the concrete next step.

If acceptance criteria aren't verifiable from the evidence, say so — do **not**
assert Done.

---

## Phase 2 — Compose

## Update: [ticket ID — title]

**Status:** [In progress / Blocked / In review / Done / Needs info]

**What changed:** [observable delta since last update, plain language]

**Evidence:** [commit hashes, PR/verify links, test results — or `none yet`]

**Blockers:** [named blocker + owner, or `None`]

**Next:** [concrete next step, or `—` if Done]

---

## Phase 3 — File it (optional)

If a tracker MCP server is configured in `.mcp.json` (e.g. `atlassian`), offer to
post the update directly. **Never file without showing the final text and
receiving explicit approval** — a tracker update is outward-facing. Present the
approval as a structured question when available (ADR-015): `File it` /
`Edit first` / `Don't file`. Otherwise the markdown above is paste-ready.

**Closing a ticket is a stricter gate:** present the acceptance criteria
alongside the evidence and require explicit confirmation each criterion is met
before any `Done`/`Closed` transition. The skill never auto-closes.

---

## Hand-off

> Ticket [ID] updated to [status][, filed]. [If Done: all acceptance criteria
> confirmed.] [Next: ...]

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — file the update` / `Edit first` / `Stop here`.

---

## Rules

- Status is inferred from evidence, not the requester's optimism — no evidence,
  no `Done`.
- Never close/Done a ticket without explicit per-criterion confirmation.
- Never file to a tracker without showing the final text and getting approval.
- Do not invent progress; if nothing changed, say `no change since last update`
  rather than padding.
- Keep the update to the delta — a status update is not a re-authoring (that's
  `ticket-refine`).
