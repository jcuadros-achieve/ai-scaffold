---
name: test-gen
description: Write tests for a function/module following the project test conventions.
tier: fast
---

# Skill: test-gen

> **`/test-gen help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Writes tests for existing code following the project's test conventions.
> - **When:** Coverage gaps or new tests for untested behavior.
> - **Gates / asks:** None — on-demand.
> - **Output:** Tests (happy path, boundaries, error cases) in the project's layout.
> - **Chain:** On-demand, outside the linear chain.
> - **Example:** `/test-gen src/services/auth.ts`

Write tests for [function/module].
Required cases: [happy path], [not found], [external error]
Required mocks: [external clients]
Follow the existing test structure and naming conventions.
