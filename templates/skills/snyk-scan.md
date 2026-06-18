---
name: snyk-scan
description: Run Snyk against the project, triage the findings (real vs noise), remediate at the gate, and convert each real hit into a tracked ticket.
tier: deep
id: skill/snyk-scan
surface: skill
summary: Run Snyk, triage findings, remediate at the gate, convert real hits into tracked tickets
tags: [security, dependencies]
appliesWhen:
  any:
    - file: "**/package.json"
    - file: "**/go.mod"
    - file: "**/requirements.txt"
    - file: "**/pyproject.toml"
    - file: "**/Dockerfile"
    - contains: "snyk"
rationale: The run-and-remediate op of the security chain; activates the dependency-scan rule into actual practice
stability: stable
---

# Skill: snyk-scan

> **`/snyk-scan help`** — if the invocation argument is `help` (or `--help`),
> print this card verbatim and stop; do not run the skill.
>
> - **What:** Runs Snyk against the project, triages findings, remediates the ones at the gate, and converts each real hit into a tracked ticket.
> - **When:** You changed a dependency/manifest, or you're running the security chain.
> - **Gates / asks:** Confirms each remediation (upgrade / pin / patch / defer) before applying; high/critical findings block the PR.
> - **Output:** A scan summary, the remediations applied, and a remediation ticket per real finding (via `ticket-from-finding`).
> - **Chain:** Security chain — `dependency-scan` rule gates this; real findings hand off to `ticket-from-finding`.
> - **Example:** `/snyk-scan` after bumping express in package.json

The `dependency-scan` rule says SCA is a pre-PR gate. This skill **runs** it: it
invokes Snyk at the project's threshold, separates real findings from noise,
remediates the ones that block, and makes sure every real finding leaves a trace
as a tracked ticket. The discipline is triage + trace, not panic-patching.

---

## Phase 1 — Run

Run Snyk at the project's recorded threshold. `ai-init` records the exact command;
the default shape is:

```bash
snyk test --all-projects --severity-threshold=high
```

- Use the project's threshold (`--severity-threshold`); the workspace default is
  `high`. Don't silently lower it to make findings disappear.
- Monorepo-aware: `--all-projects` so transitive and sub-package vulns surface,
  not just the root.
- If a `snyk` script exists in `package.json` (e.g. `npm run snyk`), prefer it —
  it carries the project's chosen flags.

Capture the raw output; it's the evidence for every ticket you'll file.

---

## Phase 2 — Triage

Separate real from noise before touching anything. For each finding:

- **Is it reachable / in scope?** A vuln in a dev-only dep or an unreachable code
  path may be a defer, not a patch. State the reasoning, don't just downgrade.
- **What's the fix?** Snyk usually names one: upgrade to a fixed version, a Snyk
  patch, or a base-image pin. Record it.
- **Severity at this project's threshold?** high/critical = blocks the PR (gate);
  medium/low = tracked, decide blocking per project.

Do not auto-suppress. A suppression (`.snyk` ignore, `# nosec`, lockfile
`resolutions`/`overrides`) names the reason and a review/expiry date.

---

## Phase 3 — Remediate (gated)

Apply the chosen remediation **per finding, with confirmation**:

- **Upgrade** the package to the fixed version (preferred when the range allows).
- **Patch** via Snyk's patch when an upgrade isn't available.
- **Pin / override** the transitive via `resolutions`/`overrides` (npm/yarn) or a
  `Dockerfile` base-image pin — and **leave a comment naming the CVE + Snyk vuln
  id** (the workspace pattern: `# fix vulnerability - https://security.snyk.io/...`).
- **Defer** only with a recorded reason + review date; never silently.

Re-run the scan after remediating to confirm the finding clears. A high/critical
that doesn't clear blocks the PR.

---

## Phase 4 — Convert to tickets (no silent fixes)

Every real finding becomes a tracked ticket via `ticket-from-finding` — patching
without a trace is the anti-pattern the `dependency-scan` rule forbids. For each:

- Preserve the **severity verbatim** and the **CVE / Snyk vuln id**.
- Link the **evidence** (the scan output / vuln detail URL).
- Record the **remediation applied** (or `deferred — reason + review date`).

Output a compact summary, then the tickets.

## Scan summary

- **Tool/version:** snyk @ [version], threshold `[high]`
- **Scope:** [all-projects / root], [N manifests]
- **Findings:** [N high/critical], [M medium/low]
- **Remediated at the gate:** [list — pkg → action]
- **Deferred (tracked):** [list — pkg → reason + review date]

## Remediation tickets (via ticket-from-finding)

- **PROJ-NNN — [pkg] [CVE] ([severity]):** [remediation / deferred]

---

## Hand-off

> Scan complete: [N] findings, [X] remediated at the gate, [Y] ticketed. [If
> high/critical remain unremediated: ⚠ blocks the PR.] File the remediation
> tickets?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015): `Approve — file the
tickets` / `Adjust first` / `Stop here`.

---

## Rules

- Run at the project's threshold; never lower `--severity-threshold` to clear a
  finding. Scan `--all-projects`; transitive vulns are the real exposure.
- Triage before patching — reachable/in-scope reasoning is stated, not assumed.
- Every suppression/pin/override carries a comment with the CVE + Snyk vuln id and
  a review date; no unattributed suppressions.
- Re-run after remediating to confirm the finding clears.
- Every real finding becomes a tracked ticket (`ticket-from-finding`); no silent
  fixes. Severity and CVE are preserved verbatim into the ticket.
- High/critical that doesn't clear blocks the PR — say so plainly in the hand-off.
