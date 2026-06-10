---
name: verify
description: Run build, tests, lint, coverage and audit to prove the change works before a PR.
---

# Skill: verify

Run after `task-implement` and before `pr-write`. Proves the change actually
works by running the project's real gates — not by asserting it should work.

**Requires:** implementation is complete and the plan's steps are done.

"Tests written" is not "tests pass". This skill closes that gap.

---

## What it runs (all of them — do not skip)

Run the project's real commands (recorded in `CLAUDE.md` and
[[ci-gates]]), in this order, stopping to report on first hard failure:

1. **Build / typecheck** — compiles with no errors.
2. **Lint / format** — no violations.
3. **Tests** — full (or affected) suite passes.
4. **Coverage** — meets the threshold in [[test-strategy]]; changed code is
   covered.
5. **Dependency audit** — no new critical/high vulnerabilities (see
   [[dependency]]).

Then **run the feature path manually** for anything tests can't cover (the
"Verify manually" items from `task-implement`).

---

## Output format

## Verification: [title]

### Gate results
| Gate | Command | Result |
|------|---------|--------|
| Build | … | ✅ / ❌ |
| Lint | … | ✅ / ❌ |
| Tests | … | ✅ / ❌ (N passed) |
| Coverage | … | ✅ / ❌ (X% changed) |
| Audit | … | ✅ / ❌ |

### Manual checks
- [ ] [observable behavior] → result

### Verdict
`Ready for pr-write` — only if every gate passed. Otherwise list what failed and
stop.

---

## Rules

- Never report "ready" with a failing or skipped gate.
- Never weaken a gate (lower coverage, disable a lint rule, skip a test) to pass.
  Fix the cause; if a gate is wrong, that's a separate change (see [[ci-gates]]).
- Show the real command output, not a claim that it passed.
