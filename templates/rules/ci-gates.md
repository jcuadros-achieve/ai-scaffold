# CI gates & enforcement rules

> Generic defaults. Run `ai-init` to map these to your actual CI config and
> hooks.

Rules in `.md` are advice; **gates are enforcement**. A quality bar that isn't
checked by a machine will eventually be skipped. Every project must have at least
one automated gate that *fails the build* on violation.

## Required checks (must pass before merge)

These run in CI on every PR and block merge on failure:

1. **Build / typecheck** — the project compiles with no errors.
2. **Lint / format** — no lint errors; formatting is enforced, not debated.
3. **Tests** — the full suite passes; coverage meets the threshold in
   [[test-strategy]].
4. **Dependency audit** — no known critical/high vulnerabilities (see
   [[dependency]]).
5. **Secret scan** — no secrets committed (see [[security]]).

## Local gates

- A pre-commit (or pre-push) hook runs the fast subset (format, lint, typecheck,
  affected tests) so failures are caught before they reach CI.
- The hook must be fast enough to keep, or it will be bypassed.

## Discipline

- **Never merge red.** Do not merge with failing or skipped required checks.
- **Never disable a gate to pass.** Fix the cause. If a gate is genuinely wrong,
  change it deliberately in its own PR with justification — not inline with the
  change it would have blocked.
- `pr-review` confirms the gates ran and passed; it does not replace them.

> Run ai-init to record the CI provider, hook setup, and exact check commands.
