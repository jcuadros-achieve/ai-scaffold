---
name: new-endpoint
description: Scaffold a new endpoint following an existing pattern.
tier: fast
---

# Skill: new-endpoint

> **`/new-endpoint help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Scaffolds a new endpoint/resource following an existing pattern in this codebase.
> - **When:** Adding this project's natural unit of work (route, public API, resource — per archetype).
> - **Gates / asks:** None — on-demand.
> - **Output:** Code + tests matching the referenced pattern.
> - **Chain:** On-demand, outside the linear chain.
> - **Example:** `/new-endpoint POST /sessions`

Create [METHOD] [/route]
Input: { field: type, ... }
Validate input. Follow the pattern of [similar existing endpoint].
Include: handler, service, types, tests.
