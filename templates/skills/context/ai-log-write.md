---
name: ai-log-write
description: Log a session where AI generated committed code.
tier: fast
---

# Skill: ai-log-write

Log any session where the AI generated committed code.

---

## When to generate

- AI generated code that was committed or is being committed.
- AI generated code that was rejected (a rejection is just as valuable).
- AI made a deviation from the plan during implementation.
- AI produced a plan that shaped subsequent work.

---

## File naming

`.context/ai-log/YYYY-MM-DD-[slug].md` — use the date of the session, not the
ticket date.

**Monorepo (ADR-013):** write to the nearest `.context/` at-or-above the files
the session touched (create `<workspace>/.context/ai-log/` on first use); a
session spanning workspaces logs once, at the root.

---

## Log format

```markdown
# AI log: [Task description]

**Date:** YYYY-MM-DD
**Skill(s) used:** [list]
**Ticket / context:** [ticket ID or brief]
**Complexity:** [S/M/L]

## What was asked
[1–3 sentences. The intent, not the prompt.]

## What the AI generated
| File | Action | Summary |
|------|--------|---------|

## What was accepted
[Specific things used as-is or with minor edits.]

## What was rejected or modified
| Item | Why rejected / how modified |
|------|-----------------------------|

## Deviations from plan
[Any deviations and whether accepted. If none: "None."]

## Patterns confirmed
[Patterns the AI correctly identified and followed.]

## Patterns missed or wrong
[Patterns the AI got wrong — with a mandatory action:
update rules/X.md | update CLAUDE.md | no action needed]

## Context for future sessions
[1–2 direct instructions for future AI sessions working on this area.]
```

---

## After writing

Update `.context/INDEX.md` (via `context-update`).

---

## Rules

- "What was rejected" must be filled honestly — an empty section means the
  review was skipped.
- "Patterns missed" must include a concrete action, never just an observation.
- "Context for future sessions" must be directive, not descriptive.
- File naming uses the date of the session, not the ticket date.
