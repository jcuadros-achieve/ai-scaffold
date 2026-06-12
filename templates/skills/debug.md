---
name: debug
description: Analyze a bug root cause before proposing a fix.
tier: deep
---

# Skill: debug

> **`/debug help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Analyzes a bug's root cause before proposing any fix.
> - **When:** Failures with an unclear cause.
> - **Gates / asks:** None — but no fix is applied until the cause is established.
> - **Output:** Root-cause analysis + proposed fix option(s).
> - **Chain:** On-demand, outside the linear chain.
> - **Example:** `/debug login returns 500 since yesterday's deploy`

Bug: [current behavior]
Expected: [correct behavior]
Reproduction: [steps or failing test]
Context: [stack trace / relevant logs]
Analyze root cause before proposing a fix.
