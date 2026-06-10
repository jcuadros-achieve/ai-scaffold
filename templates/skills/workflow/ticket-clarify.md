---
name: ticket-clarify
description: Turn any input into a structured technical brief; mark gaps instead of asking.
---

# Skill: ticket-clarify

Convert any input — a ticket, a Slack message, a verbal description — into a
structured technical brief.

Do **not** ask clarifying questions. Mark gaps explicitly instead. Marking is
faster than a question round-trip and keeps the flow moving.

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
approval.

---

## Rules

- Produce the brief from the input alone — do not read the codebase.
- Acceptance criteria must be observable without reading code.
- Never start `task-plan` without explicit approval — always end with the
  Hand-off proposal.
