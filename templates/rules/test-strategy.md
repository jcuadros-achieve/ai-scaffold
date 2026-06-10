# Test strategy rules

> Generic defaults. Run `ai-init` to replace these with rules derived from your
> actual codebase and test framework.

## TDD is the default

Write the test **before** the implementation:

1. **Red** — write a failing test that expresses the desired behavior. Run it;
   confirm it fails for the right reason.
2. **Green** — write the minimum code to make it pass.
3. **Refactor** — clean up with the test as a safety net.

`task-implement` follows this loop. If a change is genuinely untestable first
(e.g. a spike), say so explicitly — do not skip tests silently.

## Test the pyramid, in this order of preference

- **Unit** — fast, isolated, the majority. Pure logic and single units.
- **Integration** — modules + real boundaries (DB, queue) where they matter.
- **End-to-end** — few, only critical user paths. Slow and brittle; keep minimal.

## Coverage

- Coverage is a floor, not a goal. **Changed code must be covered** — new logic
  ships with tests for it.
- Target: meaningful coverage of branches and error paths, not just lines.
  Suggested gate: **80% on changed lines** (ai-init sets the project's real
  threshold).
- Never game coverage: a test with no meaningful assertion does not count.

## What makes a good test

- Test **observable behavior**, not implementation details. Refactors should not
  break tests that didn't change behavior.
- One reason to fail per test. Clear arrange / act / assert.
- Always cover: happy path, boundary/empty, the documented error case.
- Mock only true external boundaries; never mock the unit under test.

## Flaky tests

A flaky test is a failing test. Quarantine and fix it immediately — never
re-run CI until green. Track quarantined tests; do not let them accumulate.

> Run ai-init to set the real framework, coverage threshold, and test layout.
