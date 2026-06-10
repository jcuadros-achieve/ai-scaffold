# Dependency & supply-chain rules

> Generic defaults. Run `ai-init` to align these with your package manager and
> registry policy.

Adding a dependency is a long-term liability and a security surface. Treat every
new dependency as a decision.

## Before adding a dependency

- **Justify it.** Prefer the standard library or existing project utilities. A
  one-function need rarely justifies a new package.
- **Vet it:** maintenance status, last release, open critical issues, download
  trust, and transitive dependency weight.
- **Check the license** is compatible with this project's distribution.
- A new runtime dependency that crosses a cross-cutting concern warrants an ADR
  (see [[context]] and `adr-write`).

## Hygiene

- **Commit the lockfile.** Installs must be reproducible. Never hand-edit it.
- **Pin / range deliberately.** Avoid floating to unreviewed major versions.
- Run the audit tool (`npm audit`, `pip-audit`, etc.) in CI; treat known
  critical/high vulnerabilities as blockers.
- Keep production and dev dependencies separated correctly.

## Removing

- When code that used a dependency is deleted, remove the dependency too. Dead
  dependencies are attack surface for nothing.

> Run ai-init to record the audit command, license policy, and lockfile in use.
