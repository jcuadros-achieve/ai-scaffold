---
id: rule/dependency-scan
surface: rule
title: "Dependency scan"
summary: A dependency/SCA scan is a pre-PR gate on changed manifests; findings become tracked tickets, not silent fixes
tags: [security, dependencies]
appliesWhen:
  any:
    - file: "**/package.json"
    - file: "**/package-lock.json"
    - file: "**/yarn.lock"
    - file: "**/go.mod"
    - file: "**/go.sum"
    - file: "**/requirements.txt"
    - file: "**/pyproject.toml"
    - file: "**/Dockerfile"
rationale: Universal wherever dependencies live; SCA is a routine pre-merge gate, not an afterthought
stability: stable
---

# Dependency scan rules

> Generic defaults. Run `ai-init` to record the SCA tool (snyk/trivy/dependabot),
> the scan command, the severity threshold, and where findings are filed.

A dependency change (a new package, a bumped base image) is the most common way a
vulnerability enters a project. Treat the scan the way you treat the linter: it's
a gate, it runs before the PR merges, and its findings are tracked — not silently
patched away in an unrelated commit.

## The gate

- **A dependency/manifest change triggers a scan** before the PR is opened —
  `package.json`/lockfile, `go.mod`/`go.sum`, `requirements.txt`/`pyproject.toml`,
  or a `Dockerfile` base-image change.
- Run the project's SCA tool at the project's threshold. The default is `high`
  (e.g. `snyk test --severity-threshold=high`); `ai-init` records the real value.
- A `high`/`critical` finding blocks the merge. Medium/low are tracked, not
  necessarily blocking — record the decision either way.

## Findings become tickets, not silent fixes

- A real finding is **tracked work**, not an inline patch that disappears into a
  commit. Patching is fine — but the finding should leave a trace. Use
  `ticket-from-finding` to convert a scan hit into a remediation ticket that
  preserves the severity and the CVE.
- Document **why** a finding is accepted/deferred, not just that it was. A pinned
  override or a base-image bump (the `Dockerfile` pin pattern) carries a comment
  naming the CVE and the Snyk vuln id.
- A suppress/ignore (e.g. `.snyk` ignore, `# nosec`) names the reason and an
  expiry or review date — never an unattributed suppression.

## Scope

- Scan the whole dependency tree, not just top-level deps — transitive vulns are
  where most real exposure is. `--all-projects` / monorepo-aware scanning is the
  default, not opt-in.
- Re-scan on lockfile drift, not just on explicit bumps — a `yarn.lock`/`go.sum`
  change can pull a vulnerable transitive without a manifest edit.

> Run ai-init to record the SCA tool, scan command, severity threshold, and where
> findings are filed.
