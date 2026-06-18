---
name: ticket-from-report
description: Convert a report (incident, bug, customer, test-failure) into a complete ticket — extract, mark gaps, ask minimally, gate before filing.
tier: deep
id: skill/ticket-from-report
surface: skill
summary: Convert a report into a complete ticket (extract, mark gaps, ask minimally, gate before filing)
tags: [requirements, workflow]
appliesWhen:
  contains: "report"
rationale: Bridges ad-hoc/external reports into the work chain; universal entry for unstructured input that already describes a problem
stability: stable
---

# Skill: ticket-from-report

> **`/ticket-from-report help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Converts a report (incident, bug, customer, test-failure) into a complete, ready-to-file ticket.
> - **When:** A report already exists describing a problem — but it's not a ticket yet.
> - **Gates / asks:** Asks only for critical missing facts (max 1 round); filing via tracker MCP needs your explicit approval.
> - **Output:** Paste-ready ticket (Overview, What, Why, How, Context, Scope, acceptance criteria, details), optionally filed.
> - **Chain:** Report source → this skill → `ticket-clarify` for the technical brief.
> - **Example:** `/ticket-from-report` + paste the incident write-up

A report describes a problem that has already happened (or is observed). This
skill turns it into an **actionable ticket** without re-litigating what the report
already says. Where `ticket-create` interrogates a rough idea, and
`ticket-from-finding` consumes a **structured** finding (perf/security), this
skill consumes a **free-form report** and extracts the ticket from it.

The discipline: extract everything the report already states, mark genuine gaps,
ask only for what's blocking — a report round-trip should be rare and cheap.

---

## Phase 1 — Extract

Read the report and pull out the ticket fields directly. Do not invent; map what's
there and flag what isn't:

- **What** — the observable problem/outcome the report describes.
- **Why** — the impact stated in the report (users affected, cost, severity
  language). If unstated, `⚠ NOT STATED`.
- **How** — any mandated fix or constraint the report asserts; otherwise
  `Open — to be defined in task-plan.`
- **Context** — system/module, reproduction steps, environment, timestamps,
  related tickets/incidents, links from the report.
- **Scope** — infer In/Out from what the report focuses on; mark inferred scope
  as `inferred` so the human can correct it.
- **Acceptance criteria** — derive observable, testable criteria from the report's
  definition of "fixed" (e.g. "the 500 stops", "login succeeds under load"). If
  the report doesn't define done, mark `⚠ NOT DERIVED — needed before: PR`.
- **Priority & dependencies** — map the report's urgency/severity words to
  P0–P3; note named blockers.

Reproduction and evidence from the report (logs, traces, stack traces, metrics)
go in **Context** — they're the ticket's evidence, not its acceptance criteria.

---

## Phase 2 — Ask (minimally, only if blocking)

If a critical fact is missing that prevents the ticket standing on its own
(typically What or reproduction), ask **once**, batched (~3 questions max),
using structured questions (ADR-015) with best-guess options derived from the
report plus the free-text "Other". A skipped answer records `⚠ NOT PROVIDED`.

Do not ask for things a competent dev could derive, and do not ask more than one
round — the report is the primary input, not a starting prompt.

---

## Phase 3 — Compose

## Ticket: [title — verb + outcome, e.g. "Fix 500 on /login under load"]

### Overview
2–3 sentences: situation (from report) → what this ticket does → expected effect.

### What / Why / How / Context / Scope / Acceptance criteria / Details

(same shape as `ticket-create`; evidence and reproduction live in **Context**,
severity-mapped priority in **Details**)

---

## Phase 4 — File it (optional)

If a tracker MCP server is configured in `.mcp.json` (e.g. `atlassian`), offer to
create the ticket directly. **Never file without showing the final text and
receiving explicit approval** — filing is outward-facing. Present the approval as
a structured question when available (ADR-015): `File it` / `Edit first` /
`Don't file`. Otherwise the markdown above is paste-ready.

---

## Hand-off

> Ticket ready from report[, filed as PROJ-NNN]. Continue with `ticket-clarify`
> to produce the technical brief?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with ticket-clarify` / `Adjust first` / `Stop here`.

---

## Rules

- Extract first, ask never — and when you do ask, one batched round max, only for
  blocking facts.
- Evidence/reproduction from the report go in Context, not in acceptance criteria.
- Never invent; `⚠ NOT STATED` / `⚠ NOT DERIVED` / `⚠ NOT PROVIDED` beats a guess.
- Map the report's severity words to P0–P3; don't invent urgency the report
  doesn't support.
- "How" records constraints, never designs — solutioning belongs to `task-plan`.
- Never file to a tracker without explicit approval of the final text.
