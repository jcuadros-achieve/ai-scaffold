---
name: task-implement
description: Execute an approved plan test-first (TDD), without silent deviation.
---

# Skill: task-implement

Execute an approved `task-plan`. Write code and tests. Do **not** deviate
silently.

**Requires:**
- The plan is approved.
- The plan's "Remaining open questions" reads `None`.

---

## Deviation protocol

If a step turns out to be wrong — the code does not match what the plan assumed —
stop and output:

```
⚠ Deviation detected at step [N]
Expected: [what the plan said]
Found: [what the code shows]
Options: A) [safest] B) [alternative]
Waiting for direction.
```

Do not continue until you receive direction.

---

## Test-driven (default)

Implement each step test-first, per [[test-strategy]]:

1. **Red** — write a failing test for the step's behavior; confirm it fails for
   the right reason.
2. **Green** — write the minimum code to pass it.
3. **Refactor** — clean up with the test green.

Cover happy path, boundaries/empty, and the documented error case. If a step is
genuinely untestable-first, say so explicitly — never skip tests silently.

---

## Output format (after completion)

## Implementation complete: [title]

### What was done
One sentence per step.

### Files changed
| File | Change |
|------|--------|

### Tests written
List each test with the behavior it covers.

### Verify manually
Things the tests cannot cover.

### Did not touch
As specified in the plan's "What NOT to touch".

### Deviations from plan
Any deviations and their resolution. If none: `None.`

---

## Closing — write the session log (automatic)

After producing the output above, record the session by following the
`ai-log-write` playbook (`.claude/skills/ai-log-write/SKILL.md`) — an
implementation session always qualifies. This step is **not gated**: capturing
memory is part of finishing, not a separate favor to remember
([[context]] rule 5).

---

## Hand-off

> Implementation complete, session logged. Continue with `verify`?

The skill proposes; the human decides. Never declare success on unrun tests —
`verify` runs the real gates.

---

## Rules

- Match the pattern file's style exactly.
- Apply **all** rules in `.claude/rules/` — at minimum `code-style`, `security`,
  `test-strategy`, and any rule relevant to the change (`performance`,
  `resilience`, `observability`, `api-contract`).
- Work test-first (TDD); never skip tests.
- Never add features that are not in the plan.
- Never modify files listed in "What NOT to touch".
- Never hardcode secrets.
- When done, hand off to `verify` before `pr-write` — do not declare success on
  unrun tests.
