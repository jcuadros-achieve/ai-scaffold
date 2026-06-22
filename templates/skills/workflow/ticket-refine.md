---
name: ticket-refine
description: Improve an existing ticket in place — sharpen acceptance criteria, fill gaps, split an over-large ticket into actionable ones; asks, then mutates.
tier: deep
id: skill/ticket-refine
surface: skill
summary: Refine an existing ticket in place (sharpen, fill, split), with asks and a gate before filing
tags: [requirements, workflow]
appliesWhen:
  contains: "ticket"
  file: "**/TASK.md"
rationale: Maintenance op on the work chain; rescues stale/vague/too-big tickets so they can re-enter planning
stability: stable
---

# Skill: ticket-refine

> **`/ticket-refine help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Improves an existing ticket in place — sharpens acceptance criteria, fills gaps, splits an over-large ticket into actionable ones.
> - **When:** A ticket exists but is stale, vague, contradictory, or too big to plan in one pass.
> - **Gates / asks:** Asks What/Scope/criteria as option dialogs (max 2 rounds); splitting and filing need your explicit approval.
> - **Output:** Refined ticket (and/or split into N child tickets), optionally filed.
> - **Chain:** Maintenance op → re-enters the work chain at `ticket-clarify` for each refined/split ticket.
> - **Example:** `/ticket-refine PROJ-123` (the epic that's really three tickets)

Rescue a ticket that has decayed: vague scope, missing criteria, stale context,
or so large it can't be planned in one pass. Unlike `ticket-clarify` (read-only
analysis that produces a **brief** and never asks), `ticket-refine` **mutates
the ticket itself** — it can ask, sharpen, fill, and split, because improving an
existing artifact benefits from confirmation. Use `ticket-clarify` to plan from
a ticket; use `ticket-refine` to fix the ticket.

---

## Phase 1 — Diagnose

Read the existing ticket and classify what's wrong, against the same completeness
bars as `ticket-create`:

- **Vague** — What/Why/Scope missing or hand-wavy.
- **No criteria** — acceptance criteria absent or untestable.
- **Stale** — references old system/state; context no longer true.
- **Contradictory** — scope vs. criteria conflict.
- **Too big** — one ticket spans multiple independent outcomes (split candidate).

State the diagnosis plainly before touching anything.

---

## Phase 2 — Refine (and ask, if needed)

Fix the diagnosed gaps directly where the answer is obvious from context. Ask
**only** for genuinely ambiguous points, batched (aim for one round, max two,
~5 questions), covering What/Why/Scope/criteria — the same dimensions as
`ticket-create`. **Structured questions (ADR-015):** use an option-dialog tool
when available, offering best-guess options derived from the ticket plus the
free-text "Other"; a skipped answer records `⚠ NOT PROVIDED`.

Sharpen to the `ticket-create` quality bar:

- **What/Why** — observable outcome + business reason.
- **Scope** — explicit In/Out.
- **Acceptance criteria** — observable and testable, one per line.
- **Context** — current and correct.

---

## Phase 3 — Split (if too big)

If the ticket spans multiple independent outcomes, propose a split into N child
tickets, each a complete unit on its own (its own What/Scope/criteria). **A split
is always gated** — present the proposed child tickets and require explicit
approval before treating them as real. Each child then re-enters the chain via
`ticket-clarify`.

Don't split a ticket that's merely large-but-coherent — size alone isn't a
reason; independence of outcomes is.

---

## Phase 4 — Compose & file

## Ticket: [title — verb + outcome] (refined)

### What / Why / How / Context / Scope / Acceptance criteria / Details

(same shape as `ticket-create`)

[If split:]
### Split into
- **PROJ-NNN-a —** ...
- **PROJ-NNN-b —** ...

If a tracker MCP server is configured in `.mcp.json`, offer to update the ticket
(and create children) directly. **Never file without showing the final text and
receiving explicit approval** — mutation of an existing ticket, and creating new
ones, are outward-facing. Present the approval as a structured question when
available (ADR-015): `File it` / `Edit first` / `Don't file`.

---

## Hand-off

> Ticket [ID] refined[, split into N children]. Continue with `ticket-clarify`
> [per child] to produce the technical brief[s]?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with ticket-clarify` / `Adjust first` / `Stop here`.

---

## Rules

- Mutates the ticket (unlike `ticket-clarify`); asks only for genuine ambiguity,
  batched, max two rounds.
- A split is always gated on explicit approval — and only when outcomes are
  independent, not merely because the ticket is big.
- Never file/update/create in a tracker without showing the final text and
  getting approval.
- Never invent answers; `⚠ NOT PROVIDED` beats a plausible guess.
- "How" records constraints, never designs — solutioning belongs to `task-plan`.
