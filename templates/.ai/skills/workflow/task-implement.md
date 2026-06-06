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

### Ready for
`pr-write`

---

## Rules

- Match the pattern file's style exactly.
- Apply all rules from `.ai/rules/code-style.md` and `.ai/rules/security.md`.
- Never add features that are not in the plan.
- Never skip tests.
- Never modify files listed in "What NOT to touch".
- Never hardcode secrets.
