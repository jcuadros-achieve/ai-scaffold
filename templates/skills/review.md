---
name: review
description: Quick review of a diff for rule violations, edge cases, security and tests.
tier: fast
---

# Skill: review

> **`/review help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Quick review of a diff: rule violations, edge cases, security, tests.
> - **When:** A fast check — lighter than the full seven-pass `pr-review`.
> - **Gates / asks:** None — on-demand.
> - **Output:** Findings list with file:line and suggestions.
> - **Chain:** On-demand, outside the linear chain.
> - **Example:** `/review`

Review this diff. Check for:
1. Project rule violations
2. Unhandled edge cases
3. Security issues (secrets, unvalidated input, unsafe queries)
4. Missing tests for new logic
5. Anything outside the stated scope
