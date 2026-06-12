---
name: task-implement
description: Execute an approved plan test-first (TDD), without silent deviation.
tier: deep
---

# Skill: task-implement

> **`/task-implement help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Executes the approved plan test-first (TDD); stops on any deviation from the plan.
> - **When:** The plan is approved and its remaining questions read None.
> - **Gates / asks:** Step 0 records the decision (ADR) before any code; deviations are A/B choices you decide; closes by writing the session log automatically.
> - **Output:** Code + tests + completion report (files, tests, deviations, manual checks).
> - **Chain:** After `task-plan` → next: `verify`.
> - **Example:** `/task-implement`

Execute an approved `task-plan`. Write code and tests. Do **not** deviate
silently.

**Requires:**
- The plan is approved.
- The plan's "Remaining open questions" reads `None`.

---

## Step 0 — Record the decision (automatic, before any code)

The approved plan just fixed a technical decision. Before writing any code,
evaluate the triggers in the `adr-write` playbook ("When to generate") against
the chosen approach. If any applies, draft the ADR now by following
`.claude/skills/adr-write/SKILL.md` — alternatives are recorded while they are
fresh, and `pr-review` later checks the code against the recorded decision
([[context]] rule 6). If none applies, state `No ADR triggers apply` and
continue.

This step is **not gated** — recording an approved decision is part of
starting, not a separate thing to remember.

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

Do not continue until you receive direction. Present the choice as a
structured question when your harness supports option dialogs (ADR-015) —
options A and B plus free-text for a third direction. An **approved deviation
is a decision change** — note it so the ADR from step 0 gets updated or
superseded at `pr-write`'s closing check.

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

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with verify` / `Adjust first` / `Stop here`. Never declare
success on unrun tests — `verify` runs the real gates.

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
