---
name: prevent-tickets
description: Turn an incident/postmortem's prevention actions into a batch of tracked tickets — each tied to the incident, closing the learning loop.
tier: deep
id: skill/prevent-tickets
surface: skill
summary: Turn prevention actions from an incident/postmortem into a batch of tracked tickets (closing the learning loop)
tags: [incident, operations, post-deploy, requirements]
appliesWhen:
  any:
    - contains: "postmortem"
    - contains: "incident"
    - contains: "prevention"
rationale: The loop-closing op of the post-deploy chain; batch-extracts systemic prevention actions into tracked work so incidents don't recur silently
stability: stable
---

# Skill: prevent-tickets

> **`/prevent-tickets help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Turns an incident/postmortem's prevention actions into a batch of tracked tickets — each tied to the incident.
> - **When:** After a postmortem (`postmortem-write`) surfaces prevention actions.
> - **Gates / asks:** Confirms the extracted action set before filing; filing via tracker MCP needs your explicit approval.
> - **Output:** A batch of prevention tickets (one per action), each linking the incident + rationale, optionally filed.
> - **Chain:** Post-deploy chain close — `incident` → `postmortem-write` → this skill.
> - **Example:** `/prevent-tickets` from the PROD-NNN postmortem's prevention list

An incident that teaches nothing is a recurring incident. `postmortem-write`
surfaces the prevention actions (the missing test, alert, gate, rule, ADR);
`prevent-tickets` **files them as tracked work** so they don't die in a doc. It is
a batch-extraction op specialized for prevention — distinct from the single-ticket
skills, because an incident typically yields several related actions that share a
common provenance and must each be triaged.

The discipline: every prevention action becomes a ticket tied back to the
incident, with its rationale intact. No action is silently dropped, and no ticket
is filed without a human confirming the set.

---

## Phase 1 — Extract

Read the postmortem (or the incident's prevention actions) and extract each as a
distinct, actionable unit. For each action:

- **The guardrail** — what test, alert, gate, rule, or ADR would have caught or
  prevented the incident (or detected it sooner).
- **The gap it closes** — the contributing factor from the postmortem it addresses.
- **Type** — `test` (regression test, e2e), `alert` (detection), `gate` (CI/PR
  check, a `dependency-scan`/`perf-guard` rule), `rule` (a project rule/ADR), or
  `runbook` (operational doc).
- **Severity/urgency** — how much of the incident it would have blunted.

De-duplicate: if two actions address the same gap, merge them. Don't invent
actions the postmortem didn't surface — extraction, not brainstorming.

---

## Phase 2 — Compose (batch)

One ticket per action, each in the `ticket-from-report` shape, sharing a common
provenance block:

## Ticket: [Prevent: verb + guardrail, e.g. "Add regression test for X rollback"]

### What
The guardrail, observable.

### Why (ties to incident)
**Incident:** [PROD-NNN — title, date]. **Gap:** [contributing factor]. This
action [prevents / detects sooner] by [how].

### How
[The guardrail type + where it lives — test in pkg X, alert on metric Y, gate in
CI, rule/ADR Z.]

### Context / Scope / Acceptance criteria / Details

(same shape as `ticket-from-report`; priority reflects how much of the incident
the action would blunt)

---

## Phase 3 — File (gated, batch)

Present the **full set** of prevention tickets for confirmation before filing any
— the human may merge, defer, or drop. Then, if a tracker MCP is configured, offer
to create the batch. **Never file without showing the final text and receiving
explicit approval** — these are outward-facing and may govern SLAs/follow-ups.
Present the approval as a structured question when available (ADR-015):
`File all` / `File selected` / `Edit first` / `Don't file`.

---

## Hand-off

> [N] prevention tickets ready from incident [PROD-NNN][, filed]. Learning loop
> closed.

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — file the batch` / `Adjust first` / `Stop here`.

---

## Rules

- One ticket per prevention action; de-duplicate actions addressing the same gap.
- Every ticket links back to the incident and states the gap it closes —
  provenance is the point (an untied prevention ticket loses its rationale).
- Don't invent actions the postmortem didn't surface; extraction only.
- Confirm the full set before filing; never file the batch without explicit
  approval.
- Extraction, not solutioning — "How" names the guardrail type and location, not a
  full design (`task-plan` owns that).
- If an action is really an architectural pattern, route it to `adr-write`
  ([[context]]) rather than a ticket.
