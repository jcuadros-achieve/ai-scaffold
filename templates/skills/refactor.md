---
name: refactor
description: Improve structure without changing behavior, tests-first.
---

# Skill: refactor

Improve the structure of existing code **without changing its behavior**. A
refactor that changes behavior is a feature or a bugfix — do that separately.

**Requires:** the code under change has test coverage. If it doesn't, write
characterization tests first (see [[test-strategy]]) — that's step 1, not
optional.

---

## Protocol

1. **Pin behavior with tests.** Green before you start. These are the safety net.
2. **Small steps.** One structural change at a time (extract, rename, inline,
   move), running tests after each. Never a big-bang rewrite under one commit.
3. **No behavior change.** No new features, no bug "fixes" smuggled in, no
   signature changes that ripple to callers unless that *is* the refactor — and
   then it's scoped and noted.
4. **Land it on its own.** A refactor PR contains only the refactor (see
   [[git-workflow]]). Don't bundle it with a feature.

---

## Output format

## Refactor: [title]

### Goal
[What structural problem this addresses — duplication, long function, leaky
abstraction, etc.]

### Behavior preserved by
[Which tests guard it; confirm they were green before and after.]

### Changes
| File | Transformation |
|------|----------------|

### Risk
[What could subtly change; how it was checked.]

### Ready for
`verify` → `pr-write`

---

## Rules

- Tests stay green at every step. If a test must change, behavior changed — stop
  and reconsider whether this is really a refactor.
- Never mix refactor and feature in one change.
- If a deeper redesign is warranted, capture it with `adr-write` before doing it.
