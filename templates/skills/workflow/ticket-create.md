---
name: ticket-create
description: Author a complete ticket from a rough idea by asking the right questions first.
tier: deep
---

# Skill: ticket-create

Turn a rough idea ("we need X", a Slack thread, a hallway request) into a
complete, ready-to-file ticket.

This is the deliberate **inverse of `ticket-clarify`**: that skill never asks
(it converts existing input into a brief, marking gaps); this skill's job
**is** to ask — interrogate the requester until the ticket stands on its own.
Use `ticket-create` when starting from an idea; enter the chain at
`ticket-clarify` when a ticket already exists.

---

## Phase 1 — Elicit

Extract everything the prompt already answers first — never ask for what was
already said. Then ask **only** for what's missing, in batched rounds (aim for
one round, maximum two, ~5 questions per round), covering:

- **What** — the observable outcome. What does the system do afterward that it
  doesn't do today?
- **Why** — the business or user reason. What happens if this is never done?
- **How** — known constraints or a mandated approach, if any. Do **not**
  solutioneer here; record constraints, not designs.
- **Context** — where this lives (system / module / flow), who is affected,
  related tickets or incidents, relevant links.
- **Scope** — what is explicitly out.
- **Acceptance criteria** — how "done" is observed.
- **Priority & dependencies** — urgency, blockers, who else is involved.

If the requester can't answer something, mark it `⚠ NOT PROVIDED` — do not
invent. Stop eliciting when a competent dev could pick the ticket up cold.

---

## Phase 2 — Compose

## Ticket: [title — verb + outcome, e.g. "Prevent duplicate session writes"]

### Overview
2–3 sentences a passer-by understands: situation → what this ticket does →
expected effect.

### What
Observable behavior, from the outside. Not implementation.

### Why
The reason and the cost of not doing it.

### How
Only if constraints or a mandated approach exist. Otherwise: `Open — to be
defined in task-plan.`

### Context
System/module, affected users/flows, related tickets/incidents, links.

### Scope
- **In:**
- **Out:**

### Acceptance criteria
- [ ] Observable, testable, one per line.

### Details
- **Priority:** [P0–P3 / requester's words]
- **Dependencies / blockers:** [or `None known`]
- **Open questions:** each as `⚠ NOT PROVIDED — needed before: [stage]`

---

## Phase 3 — File it (optional)

If a tracker MCP server is configured in `.mcp.json` (e.g. `atlassian`),
offer to create the ticket directly. **Never file without showing the final
text and receiving explicit approval** — filing is outward-facing. Otherwise
the markdown above is paste-ready for any tracker.

---

## Hand-off

> Ticket ready[, filed as PROJ-NNN]. Continue with `ticket-clarify` to produce
> the technical brief?

The skill proposes; the human decides.

---

## Rules

- Asking is the point — but batched and only for what the prompt didn't
  answer; never more than two rounds.
- Never invent answers; `⚠ NOT PROVIDED` beats a plausible guess.
- "How" records constraints, never designs — solutioning belongs to
  `task-plan`.
- Never file to a tracker without explicit approval of the final text.
- Do not weaken `ticket-clarify`'s no-questions rule to compensate for a thin
  ticket — that input should have come through this skill.
