---
name: pr-write
description: Generate a conventional-commits PR description from the diff and brief.
tier: fast
---

# Skill: pr-write

> **`/pr-write help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Generates a conventional-commits PR description and squash commit message from the diff and brief.
> - **When:** Verification passed.
> - **Gates / asks:** Closes by checking the ADR still matches what was built and refreshing `.context/INDEX.md`; Hand-off to `pr-review`.
> - **Output:** PR text (what/why/how-to-test/checklist) under 400 words + commit message.
> - **Chain:** After `verify` → next: `pr-review`.
> - **Example:** `/pr-write`

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

## Closing — capture context (automatic)

After producing the description, persist the project memory. These steps are
**not gated** — they are part of finishing, not a separate favor to remember:

1. **ADR check (safety net)** — the ADR for this change should already exist:
   `task-implement` drafts it at step 0, right after plan approval. Verify it
   still matches what was implemented — approved deviations are decision
   changes, so update or supersede it if needed. If no ADR exists, evaluate
   the `adr-write` triggers now and draft it; a required ADR missing at review
   is a blocker ([[context]] rule 6).
2. **Index refresh** — follow `.claude/skills/context-update/SKILL.md` so
   `.context/INDEX.md` reflects the new log entries and any ADR.

---

## Hand-off

> PR description ready, context updated[, ADR-NNN drafted]. Continue with
> `pr-review`?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with pr-review` / `Adjust first` / `Stop here`.

---

## Rules

- Title must follow conventional commits.
- "What changed" describes behavior, never "I modified file X".
- "How to test" must be actionable without reading the code.
- Flag any out-of-scope changes with `⚠`.
- Keep the whole description under 400 words (the Closing artifacts don't count).
