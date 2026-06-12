---
name: task-plan
description: Produce a file-level technical plan from an approved brief.
tier: deep
---

# Skill: task-plan

Take an approved `ticket-clarify` brief and produce a file-level technical plan.
Do **not** write implementation code.

**Requires:**
- The brief is approved.
- No unresolved `❓` marked "needed before: planning".

---

## Phase 1 — Read (silent)

Read, without producing output:
- The files the change will affect.
- The closest existing similar feature.
- Error handling in nearby code.
- The test file for a similar feature.
- `CLAUDE.md`.
- `.claude/rules/`.

When done, output exactly:

```
✓ Codebase read. Producing plan.
```

---

## Output format

## Plan: [title]

### Complexity confirmation
Confirm or revise the S/M/L estimate from the brief, with a reason.

### Files to change
| File | Change type | What changes |
|------|-------------|--------------|

### Files to create
| File | Purpose |
|------|---------|

### Pattern to follow
Reference a real existing file — not a generic description.

### Implementation steps
Ordered list. Each step independently verifiable.

### Edge cases to handle
Specific case → how to handle it.

### Risks
What could go wrong → mitigation.

### What NOT to touch
File → reason.

### Open questions resolved
Questions from the brief, now answered by reading the code.

### Remaining open questions
If none: `None — ready to implement`.

---

## Hand-off

End by presenting the plan and proposing the next step explicitly:

> Plan ready ([N] files, [N] steps, remaining questions: [none/N]). Approve to
> continue with `task-implement`?

The skill proposes; the human decides. Proceed to `task-implement` only on
explicit approval — and only if "Remaining open questions" is `None`. Present
this Hand-off as a structured question when your harness supports option
dialogs (ADR-015): `Approve — continue with task-implement` / `Adjust first` /
`Stop here`.

Approving the plan **fixes the technical decision**: `task-implement` opens by
recording any required ADR (its step 0) before writing code.

---

## Rules

- Every file in "Files to change" must already exist in the codebase.
- "Pattern to follow" must reference a real file.
- Never start `task-implement` without explicit approval — always end with the
  Hand-off proposal.
