---
name: incident
description: "Handle a production incident: mitigate first, then hotfix. Entry of the post-deploy chain."
tier: deep
id: skill/incident
surface: skill
summary: Mitigate a production incident first, then hotfix (post-deploy chain entry → postmortem-write → prevent-tickets)
tags: [incident, operations, post-deploy]
appliesWhen:
  any:
    - archetype: service
    - archetype: app
    - archetype: data-pipeline
rationale: Production incident response, only relevant for deployed runtimes; entry of the post-deploy learning chain
stability: stable
---

# Skill: incident

> **`/incident help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Handles a production incident: mitigate first, then hotfix. The **entry** of the post-deploy chain.
> - **When:** Production is degraded or down. (Optional module.)
> - **Gates / asks:** Mitigation precedes diagnosis-perfectionism; the postmortem is mandatory but authored separately once users are safe.
> - **Output:** Mitigation steps + hotfix (with the regression test), and a hand-off to `postmortem-write`.
> - **Chain:** Post-deploy chain entry → `postmortem-write` → `prevent-tickets`.
> - **Example:** `/incident api returning 502s since 14:00`

Handle a production incident or urgent hotfix. The normal `ticket-clarify →
task-plan → …` flow is for planned work; an incident inverts the priority:
**mitigate first, understand second.** This skill owns the *response* — mitigate
and hotfix under pressure. Once users are safe, it hands off to
`postmortem-write` (the blameless record) and `prevent-tickets` (the tracked
follow-ups); authoring those under incident pressure produces worse results.
Optional module — relevant to deployed services.

---

## Order of operations

1. **Mitigate before diagnosing.** Stop the bleeding with the lowest-risk lever
   first: roll back the last deploy, flip a feature flag off, scale, or
   fail over. Restoring service is the priority, not root cause.
2. **Communicate.** State impact, scope, and that mitigation is in progress, in
   the team's incident channel. Keep updating.
3. **Stabilize**, then **diagnose** root cause from logs/metrics/traces (see
   [[observability]]) once users are safe.
4. **Hotfix** the root cause: the smallest correct change. Tests still required
   (see [[test-strategy]]); the bug becomes a regression test. Run `verify`.
   Fast-track review, never zero review.
5. **Hand off the learning** once users are safe: `postmortem-write` authors the
   blameless record (timeline, root cause, contributing factors, prevention
   actions), then `prevent-tickets` files those actions as tracked work. Don't
   author the postmortem under incident pressure. Then `ai-log-write`; if the fix
   reveals an architectural pattern, that's an `adr-write` (see [[context]]).

---

## Output format

## Incident: [title]

### Impact
What's broken, for whom, since when.

### Mitigation applied
The lever pulled and at what time; current status.

### Root cause
Once known. "Unknown — investigating" is a valid interim state.

### Fix
The change + the regression test that pins it.

### Prevention (hand-off)
The guardrails that would have caught this (test, gate, alert, rule) — surfaced
for `postmortem-write` / `prevent-tickets` to own. This skill stops at the hotfix;
it does not author or publish the postmortem.

---

## Hand-off

> Mitigated + hotfixed. Users are safe. Continue with `postmortem-write` to
> author the blameless record?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with postmortem-write` / `Adjust first` / `Stop here`.

---

## Rules

- Never skip mitigation to chase root cause while users are impacted.
- A hotfix still gets a test and `verify` — incidents are when skipping them
  hurts most.
- This skill owns response (mitigate + hotfix); it does **not** author or publish
  the postmortem — hand off to `postmortem-write` once users are safe. No blame in
  that record; fix systems, not people.
- Record it: an unlogged incident teaches nothing (`ai-log-write`).
