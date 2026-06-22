---
id: rule/incident-response
surface: rule
title: "Incident response"
summary: On-call readiness — runbooks for critical paths, severity definitions, comms cadence, a practiced rollback; optional module for deployed runtimes
tags: [incident, operations, on-call]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
rationale: On-call readiness only matters for deployed runtimes; optional — adopt when the system is on-call
stability: stable
---

# Incident response rules

> Generic defaults. Run `ai-init` to record the severity scheme, the incident
> channel, the on-call rotation, and where runbooks live.

This rule governs **readiness**, not the response itself — the `incident` skill
runs the response (mitigate → hotfix → hand off to `postmortem-write`). A system
that's on-call needs the scaffolding in place *before* the page: a runbook for the
thing that will break, a severity scheme everyone agrees on, a practiced
rollback. Without these, the first incident is where you discover they're missing.

## Runbooks

- **A runbook exists for each critical path** (the top failure modes `ai-init`
  records) — the alert, the likely cause, the mitigation levers, and the owner.
  An alert without a runbook is a page someone has to improvise through.
- The runbook names the **lowest-risk mitigation first** (rollback, flag-off,
  scale) — matching the `incident` skill's "mitigate before diagnosing" order.
- Runbooks live where on-call actually looks (runbook repo / wiki / the alert
  payload links them), and are kept current — a stale runbook misleads.

## Severity & communications

- **A shared severity scheme** (Sev-1 through Sev-3 or the project's terms),
  defined by user impact, not by which component is noisy. Sev-1 = users down /
  data loss; Sev-2 = degraded; Sev-3 = limited/cosmetic.
- **A comms cadence during a Sev-1/Sev-2** — a stated interval for updates in the
  incident channel, so stakeholders aren't pinging for status. The `incident`
  skill enforces "communicate"; this rule ensures the channel + cadence exist.
- A clear **incident commander** role for Sev-1 — one person coordinates, others
  execute. No IC during a Sev-1 is thrash.

## Reversibility

- **A practiced rollback** is the default mitigation — deploys are reversible,
  and the rollback is rehearsed, not theoretical. "We can roll back" isn't true
  until it's been done.
- Feature flags gate risky changes so the mitigation is a flag flip, not a deploy.

> Run ai-init to record the severity scheme, incident channel, on-call rotation,
> and runbook location.
