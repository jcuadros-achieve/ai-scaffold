---
name: pr-write
description: Generate a conventional-commits PR description from the diff and brief.
---

# Skill: pr-write

Generate a PR description from the diff and the brief. The output is ready to
paste into a PR or open one directly.

---

## Output format

**Title:** conventional commits format — `type(scope): description`

### What changed
Describe the behavior, not the code mechanics. Never write "I modified file X".

### Why
The business reason. Reference the ticket if available.

### How
Optional — include only if the approach is non-obvious.

### How to test
Concrete steps a reviewer can follow without reading the code.

### Checklist
- [ ] Tests added/updated
- [ ] No secrets committed
- [ ] Follows code style rules
- [ ] No unintended files included
- [ ] Acceptance criteria met

### Linked ticket / context
[ticket ID or link]

## Commit message (for squash merge)
`type(scope): short summary`

A 2–3 sentence body explaining what and why.

---

## Rules

- Title must follow conventional commits.
- "What changed" describes behavior, never "I modified file X".
- "How to test" must be actionable without reading the code.
- Flag any out-of-scope changes with `⚠`.
- Keep the whole description under 400 words.
