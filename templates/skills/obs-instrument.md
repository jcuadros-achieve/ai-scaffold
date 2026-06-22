---
name: obs-instrument
description: Add the missing observability for a path — structured logs with correlation ids, the page-on metrics, trace propagation, honest error reporting — per the observability rule.
tier: deep
id: skill/obs-instrument
surface: skill
summary: Add missing observability (structured logs, correlation ids, page-on metrics, trace propagation, error reporting) for a path
tags: [observability]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
    - contains: "instrument"
    - contains: "telemetry"
rationale: Implement op of the observability chain; closes the gaps that obs-audit finds, per the observability rule
stability: stable
---

# Skill: obs-instrument

> **`/obs-instrument help`** — if the invocation argument is `help` (or
> `----help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Adds the missing observability for a path — structured logs w/ correlation ids, page-on metrics, trace propagation, honest error reporting.
> - **When:** After `obs-audit` finds gaps, or when instrumenting a new path.
> - **Gates / asks:** Confirms the metric names/labels and the PII redaction policy before writing.
> - **Output:** The instrumentation changes, verified to emit, on a branch/draft PR.
> - **Chain:** Observability chain — implements the gaps `obs-audit` surfaces, under the `observability` rule.
> - **Example:** `/obs-instrument` the checkout path from the obs-audit findings

`obs-audit` finds the blind spots; this skill **instruments** them — it adds the
logs, metrics, traces, and error reporting that make a path debuggable in
production. Everything it adds is governed by the `observability` rule: structured
logs with correlation context, metrics on the signals you'd page on, trace
propagation across boundaries, and no swallowed errors or leaked PII.

---

## Phase 1 — Align to the project's stack

`ai-init` records the real tools (logger, metrics, tracing, error tracker). Use
them — don't introduce a second logger or a parallel metrics path. Confirm:

- **Logger** + its structured format and correlation-id convention.
- **Metrics** library + the naming/label convention (so dashboards/alerts match).
- **Tracer** + how trace context propagates across this service's boundaries.
- **Error tracker** + what context it expects.
- **PII redaction policy** — what must never be logged for this project.

---

## Phase 2 — Instrument (per the rule)

For each gap (typically from `obs-audit`), add the minimum that closes it:

- **Structured logs** — key/value or JSON, at the right level; every line carries
  the correlation id (request/trace) so the flow reconstructs.
- **Metrics** — emit the page-on signals: error rate, latency (p95), throughput,
  saturation of the critical resource. Use the confirmed names/labels.
- **Trace propagation** — spans across the service boundary; the trace context
  handed to downstream calls, not dropped at the edge.
- **Error reporting** — unexpected errors reported to the error tracker with
  reproduce-context; nothing swallowed without a log.
- **PII** — redact at the boundary; never log tokens/passwords/full card/SSN/raw
  personal-data bodies. If a field is borderline, don't log it.

Don't over-instrument — log noise at `info` is itself a gap. Add the minimum that
makes the path debuggable.

---

## Phase 3 — Verify it emits

Instrumentation that doesn't emit is theatre. Verify:

- Run the path (locally or in a test) and confirm the **log lines appear** with
  the correlation id, the **metrics are emitted** (scrape/test endpoint), and the
  **trace spans propagate** to the downstream.
- Confirm **no PII** appears in the emitted output (grep the test run for the
  fields you redacted).

---

## Hand-off

> Instrumented [path]: [structured logs w/ correlation id], [N metrics on page-on
> signals], [trace propagation across boundary], [error reporting]. Verified to
> emit; no PII in output. Branch/draft PR ready.

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — open the draft PR` / `Adjust first` / `Stop here`.

---

## Rules

- Use the project's recorded stack (`ai-init`) — never introduce a parallel
  logger/metrics path.
- Structured logs with correlation context; right level; no noise at `info`.
- Metrics on the page-on signals (error rate, latency p95, throughput,
  saturation), with the confirmed names/labels.
- Trace context propagates across boundaries — the most common gap; don't drop it
  at the edge.
- No swallowed errors; no PII/secrets in logs — redact at the boundary; when in
  doubt, don't log the field.
- Verify the instrumentation actually emits (logs, metrics, trace) and that no PII
  is in the output — unverified instrumentation is theatre.
