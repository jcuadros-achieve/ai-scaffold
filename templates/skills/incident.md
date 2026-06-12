---
name: incident
description: Handle a production incident: mitigate first, then hotfix and postmortem.
tier: deep
---

# Skill: incident

> **`/incident help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Handles a production incident: mitigate first, then hotfix, then postmortem.
> - **When:** Production is degraded or down. (Optional module.)
> - **Gates / asks:** Mitigation precedes diagnosis-perfectionism; postmortem is mandatory.
> - **Output:** Mitigation steps, hotfix, postmortem draft.
> - **Chain:** On-demand, outside the linear chain.
> - **Example:** `/incident api returning 502s since 14:00`

Handle a production incident or urgent hotfix. The normal `ticket-clarify →
task-plan → …` flow is for planned work; an incident inverts the priority:
**mitigate first, understand second.** Optional module — relevant to deployed
services.

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
5. **Follow up:** a blameless postmortem, and an `ai-log-write`. If the fix
   reveals a pattern or a guardrail gap, that's a "Patterns missed" action and
   often an `adr-write` (see [[context]]).

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

### Prevention
What guardrail (test, gate, alert, rule) would have caught this — the follow-up.

---

## Rules

- Never skip mitigation to chase root cause while users are impacted.
- A hotfix still gets a test and `verify` — incidents are when skipping them
  hurts most.
- No blame in the postmortem; fix systems, not people.
- Record it: an unlogged incident teaches nothing.
