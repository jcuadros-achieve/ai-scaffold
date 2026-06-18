---
name: postmortem-write
description: Author a blameless postmortem from an incident — timeline, impact, root cause, contributing factors, and prevention actions; gate before publishing.
tier: deep
id: skill/postmortem-write
surface: skill
summary: Author a blameless postmortem from an incident (timeline, root cause, contributing factors, prevention), gate before publishing
tags: [incident, operations, post-deploy]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
    - contains: "incident"
rationale: Post-deploy chain authoring op; separates postmortem authoring from the heat of incident response, only relevant for deployed runtimes
stability: stable
---

# Skill: postmortem-write

> **`/postmortem-write help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Authors a blameless postmortem from an incident — timeline, impact, root cause, contributing factors, and prevention actions.
> - **When:** After an incident is mitigated/hotfixed — not during the heat of response.
> - **Gates / asks:** Asks for missing timeline/cause facts (max 1 round); publishing needs your explicit approval.
> - **Output:** Paste-ready postmortem doc, optionally published.
> - **Chain:** Post-deploy chain — after `incident` (mitigate+hotfix) → this skill → `prevent-tickets`.
> - **Example:** `/postmortem-write` after the PROJ-NNN incident is hotfixed

Separate **learning** from **responding**. The `incident` skill mitigates and
hotfixes under pressure; this skill runs once users are safe, and writes the
record that turns a single incident into systemic improvement. It is blameless by
construction: it fixes systems and guardrails, never people.

The prevention actions it surfaces are the input to `prevent-tickets`, which
turns them into tracked work — so this skill focuses on *finding* the actions,
not filing them.

---

## Phase 1 — Gather

Collect the factual record from the incident (the `incident` output, the incident
channel, logs/metrics/traces, deploy history):

- **Timeline** — detection, mitigation, recovery, with timestamps and who/what
  acted. Anchor it to evidence (alert fired, rollback deployed).
- **Impact** — what was broken, for whom, duration, user/business impact. If not
  measurable, state the bounds, not a fake number.
- **Detection** — how it was found (alert, customer, on-call) and the lag between
  cause and detection.
- **Root cause** — the proximate technical cause, stated precisely once known.
  "Unknown — investigating" is not a valid final state; if it's genuinely unknown,
  say so with what's been ruled out.
- **Contributing factors** — the systemic conditions that let the cause reach users:
  missing test, missing alert, a gate that didn't fire, a doc gap.

If a critical fact is missing, ask **once**, batched (~3 questions), structured
(ADR-015). A skipped answer records `⚠ NOT PROVIDED`. Do not invent a cause to
fill a gap.

---

## Phase 2 — Author (blameless)

## Postmortem: [incident title]

### Summary
2–3 sentences a passer-by understands: what happened, impact, current status.

### Timeline
- `[time] —` [event, with evidence link]

### Impact
What was broken, for whom, duration, severity.

### Root cause
[Proximate technical cause, precise.]

### Contributing factors
- [Systemic condition that let it reach users — missing test/alert/gate/doc.]

### What went well
- [Detection/mitigation that worked — credit the systems.]

### What we learned
- [Insight, not blame.]

### Prevention actions
- [Guardrail that would have caught/prevented it — test, alert, gate, rule, ADR. These hand off to `prevent-tickets`.]

---

## Phase 3 — Publish (optional, gated)

If the team records postmortems in a known location (wiki, repo path, tracker),
offer to publish. **Never publish without showing the final text and receiving
explicit approval** — a postmortem is a durable, blameless record that may be read
well beyond the team. Present the approval as a structured question when available
(ADR-015): `Publish it` / `Edit first` / `Don't publish`.

Blameless is enforced at the review gate: if any line attributes cause to a person
rather than a system/guardrail, rewrite it before publishing.

---

## Hand-off

> Postmortem ready[, published]. The [N] prevention actions become tracked work —
> continue with `prevent-tickets`?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with prevent-tickets` / `Adjust first` / `Stop here`.

---

## Rules

- Runs after mitigation, never during — learning is separated from responding.
- Blameless by construction: every contributing factor names a system/guardrail
  gap, never a person; enforce this at the publish gate.
- "Unknown" is not an acceptable final root cause — state what's been ruled out.
- Prevention actions are surfaced here, filed by `prevent-tickets` — don't file
  tickets inline.
- Never publish without showing the final text and getting approval.
- Record it: an unpublishable/unlogged postmortem teaches nothing (see
  `ai-log-write`, [[context]]).
