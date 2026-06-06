# Skill: pr-review

Run five structured review passes over a diff. Produce actionable findings, not
opinions.

---

## The five passes (run all — do not skip)

1. **Scope** — does the diff match the brief? Any unmet acceptance criteria?
2. **Correctness** — edge cases, null guards, async issues, logic vs. intent.
3. **Security** — apply `.ai/rules/security.md` line by line.
4. **Code rules** — apply `.ai/rules/code-style.md` line by line.
5. **Tests** — new behavior untested, edge cases without tests, weak assertions.

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

## Rules

- Every finding must have: pass, file, line number, specific issue, specific
  suggestion.
- "Specific" means: "line 42 returns undefined when result is empty", not
  "could be more robust".
- If a pass finds nothing, write: `Pass N: no issues found`.
- No rewrites or suggestions outside the PR's scope.
- The verdict is a recommendation, never a decision.
