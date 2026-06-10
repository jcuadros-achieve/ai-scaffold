---
name: task-plan
description: Produce a file-level technical plan from an approved brief.
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

## Rules

- Every file in "Files to change" must already exist in the codebase.
- "Pattern to follow" must reference a real file.
- Never start `task-implement` automatically.
