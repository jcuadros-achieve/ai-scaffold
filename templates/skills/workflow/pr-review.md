---
name: pr-review
description: Review a diff in seven structured passes with actionable findings.
---

# Skill: pr-review

Run seven structured review passes over a diff. Produce actionable findings, not
opinions. Assumes the gates already passed via `verify`; this is the human-facing
judgment layer, not a replacement for [[ci-gates]].

---

## The seven passes (run all — do not skip)

1. **Scope** — does the diff match the brief? Any unmet acceptance criteria? Any
   change outside the stated scope?
2. **Correctness** — edge cases, null guards, async/concurrency issues, logic vs.
   intent; resilience of external calls (see [[resilience]]).
3. **Security** — apply `.claude/rules/security.md` line by line. For auth, input,
   data-handling, or dependency changes, run the `security-review` skill.
4. **Code rules** — apply `.claude/rules/code-style.md` and the other applicable
   rules in `.claude/rules/` line by line.
5. **Tests** — new behavior untested, edge cases without tests, weak assertions,
   coverage of changed code (see [[test-strategy]]).
6. **Performance** — N+1s, unbounded queries, missing pagination, complexity on
   user-scaled data (see [[performance]]).
7. **Decision records & docs** — does a cross-cutting or hard-to-reverse change
   have an ADR (via `adr-write`)? Are README / contract docs updated in this
   diff (see [[docs]], [[api-contract]])? A missing required ADR is a blocker.

---

## Output format

## Review: [title]

### Summary
Two sentences: overall assessment + the single most important finding.

### Findings

#### Blockers — must fix before merge
| # | Pass | File | Line | Issue | Suggestion |
|---|------|------|------|-------|------------|

#### Warnings — should fix, not blocking
| # | Pass | File | Line | Issue | Suggestion |
|---|------|------|------|-------|------------|

#### Notes — informational
| # | Pass | File | Line | Issue | Suggestion |
|---|------|------|------|-------|------------|

### Acceptance criteria status
- [x] met / [ ] not met → finding #N

### Scope check
Anything in the diff outside the stated scope.

### Verdict
A recommendation only — the human decides.

---

## Hand-off

End of the work chain — there is no next skill to propose. Merging is the
human's decision. If blockers were found, propose returning to
`task-implement` with the findings as input.

---

## Rules

- Every finding must have: pass, file, line number, specific issue, specific
  suggestion.
- "Specific" means: "line 42 returns undefined when result is empty", not
  "could be more robust".
- If a pass finds nothing, write: `Pass N: no issues found`.
- No rewrites or suggestions outside the PR's scope.
- The verdict is a recommendation, never a decision.
