---
name: obs-audit
description: Read-only audit of a path's observability against the observability rule — find the gaps (silent failures, missing traces/metrics, unredacted PII) and hand each off as a finding.
tier: deep
id: skill/obs-audit
surface: skill
summary: Read-only audit of observability coverage (gaps in logs/metrics/traces, silent failures, PII) → findings via ticket-from-finding
tags: [observability]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
    - contains: "observability"
    - contains: "debuggable"
rationale: Audit op of the observability chain; activates the observability rule into a concrete coverage check, only for runtimes
stability: stable
---

# Skill: obs-audit

> **`/obs-audit help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Read-only audit of a path's observability — gaps in logs/metrics/traces, silent failures, unredacted PII — against the observability rule.
> - **When:** Before a path ships, or after an incident revealed a blind spot.
> - **Gates / asks:** None — it reads and reports; it does not edit code.
> - **Output:** A finding per observability gap, each handed off via `ticket-from-finding`.
> - **Chain:** Observability chain — gated by the `observability` rule; gaps are instrumented by `obs-instrument`.
> - **Example:** `/obs-audit` on the payments path before launch

The `observability` rule says: if it breaks in production and you can't see why,
the code is not done. This skill **audits** a path against that bar — read-only,
like a reviewer — and surfaces the gaps that would make a future incident
un-debuggable. It's the cheap moment to find a blind spot: before launch, or right
after an incident exposed one. It reports; `obs-instrument` fixes.

---

## Phase 1 — Scope

Take the path (an endpoint, a job, a user flow) and trace it end to end across
service boundaries. Read the code and the existing logs/metrics/traces for it.

---

## Phase 2 — Audit against the rule

Check each clause of the `observability` rule and mark pass/gap:

- **Logging** — structured (key/value/JSON), not string concat? Carries
  correlation context (request/trace id) so the flow reconstructs? Right level
  (error/warn/info/debug), not noise at `info`?
- **PII / secrets** — anything logged that shouldn't be (tokens, passwords, full
  card/SSN, raw personal-data bodies)? A PII leak is a **CRITICAL** finding, not a
  style note.
- **Metrics** — are the page-on signals emitted (error rate, latency,
  throughput, saturation of critical resources) for this path?
- **Tracing** — does the trace propagate across service boundaries for this flow?
  Or does it stop at the edge, leaving the downstream blind?
- **Errors** — are unexpected errors reported with reproduce-context to the error
  tracker? Or swallowed without a log (an invisible failure)?

For each gap, note the exact location and what a future responder would be missing.

---

## Phase 3 — Findings

Produce one finding per gap, classified by severity:

- **CRITICAL** — PII/secret in logs; a swallowed error with no log on a critical
  path.
- **HIGH** — missing trace propagation across a boundary; no error/latency metric
  on a path you'd page on.
- **MEDIUM** — unstructured logs; missing correlation id (flow not reconstructable).
- **LOW** — wrong log level / noise at info.

## Observability audit: [path]

- **Scope:** [endpoint/job/flow], [N services]
- **CRITICAL:** [list — PII leaks, swallowed errors]
- **HIGH:** [list — missing traces/metrics on page-on signals]
- **MEDIUM/LOW:** [list — unstructured logs, levels, correlation]

---

## Phase 4 — Hand off

Convert each real gap to a ticket via `ticket-from-finding`, preserving the
severity and the exact location. Instrumentation is done by `obs-instrument`, not
here.

---

## Hand-off

> Audit complete: [N] gaps ([X critical], [Y high]). Convert to tickets via
> `ticket-from-finding`? [If critical: ⚠ the PII/swallowed-error gaps should be
> fixed before launch.]

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with ticket-from-finding` / `Adjust first` / `Stop here`.

---

## Rules

- Read-only — it reports gaps; it does not edit code (instrumentation is
  `obs-instrument`).
- A PII/secret in logs is CRITICAL, not a style note; a swallowed error on a
  critical path is CRITICAL.
- Check every clause of the `observability` rule; mark pass/gap with the exact
  location.
- Findings preserve severity and location into tickets (`ticket-from-finding`).
- If the whole path lacks basic observability, say so plainly rather than listing
  every sub-gap as separate findings.
