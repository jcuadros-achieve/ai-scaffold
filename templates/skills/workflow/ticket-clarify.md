---
name: ticket-clarify
description: Turn any input into a structured technical brief; mark gaps instead of asking.
tier: deep
---

# Skill: ticket-clarify

> **`/ticket-clarify help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Converts an existing ticket/message into a structured technical brief — never asks, marks gaps with ❓.
> - **When:** A ticket or written description already exists.
> - **Gates / asks:** Hand-off: approve the brief before any planning.
> - **Output:** Brief: what/why, scope in/out, acceptance criteria, S/M/L estimate, open questions.
> - **Chain:** After `ticket-create` (or direct entry) → next: `task-plan`.
> - **Example:** `/ticket-clarify` + paste the ticket

Convert any input — a ticket, a Slack message, a verbal description — into a
structured technical brief.

Do **not** ask clarifying questions. Mark gaps explicitly instead. Marking is
faster than a question round-trip and keeps the flow moving. (If the input is
a rough idea rather than a ticket, it should come through `ticket-create`
first — that skill's job is to ask.)

---

## Output format

## Brief: [title]

### What
Observable behavior, not implementation. Describe what the system should do from
the outside.

### Why
The business or user reason. If the input does not state it, write `⚠ NOT STATED`.

### Scope
- **In:** what this change includes.
- **Out of scope:** what it explicitly does not include.

### Acceptance criteria
- [ ] Observable and testable criteria, one per line.
- [ ] Each must be verifiable without reading the code.

### Complexity estimate
One of S / M / L, with a one-sentence reason:
- **S** = isolated, one module, clear pattern.
- **M** = 2–3 modules, some ambiguity.
- **L** = cross-cutting, multiple unknowns.

### Open questions
Format each as:
`❓ [Question] — needed before: [planning/implementation/PR]`

---

## Hand-off

End by presenting the brief and proposing the next step explicitly:

> Brief ready ([complexity], [N] open questions). Approve to continue with
> `task-plan`?

The skill proposes; the human decides. Proceed to `task-plan` only on explicit
approval. Present this Hand-off as a structured question when your harness
supports option dialogs (ADR-015): `Approve — continue with task-plan` /
`Adjust first` / `Stop here`.

---

## Rules

- Produce the brief from the input alone — do not read the codebase.
- Acceptance criteria must be observable without reading code.
- Never start `task-plan` without explicit approval — always end with the
  Hand-off proposal.
