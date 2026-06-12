---
name: security-review
description: Threat-model-style security pass (authz, injection, SSRF, secrets, crypto).
tier: deep
---

# Skill: security-review

> **`/security-review help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Threat-model-style pass over seven dimensions (authz, input, exposure, SSRF, secrets/crypto, dependencies, abuse).
> - **When:** Auth changes, new endpoints, data handling, dependency changes, anything touching a trust boundary.
> - **Gates / asks:** Critical/High findings block merge and trigger a log entry.
> - **Output:** Findings (dimension, severity, file:line, fix) + verdict.
> - **Chain:** On-demand; also triggered from `pr-review`'s security pass.
> - **Example:** `/security-review`

A focused, threat-model-style security pass. Goes deeper than the line-by-line
`rules/security.md` check inside `pr-review` — use it for auth changes, new
endpoints, data handling, dependency changes, or anything touching a trust
boundary.

---

## Phase 1 — Read

Map the trust boundaries the change touches: where untrusted input enters, what
data it reads/writes, what privileges it runs with, what it calls out to.

## Review dimensions (run all)

1. **AuthN / AuthZ** — is the caller authenticated? Is every action authorized
   for *this* user? Check for missing object-level checks (IDOR) — the most
   common real-world hole.
2. **Input handling** — injection (SQL/NoSQL/command/template), unsafe
   deserialization, path traversal, unvalidated redirects. All external input
   validated at the boundary (see [[security]]).
3. **Output / data exposure** — no secrets or PII in responses, logs, or errors;
   correct field-level filtering; no stack traces to clients.
4. **SSRF / outbound** — server-side requests to user-controlled URLs are
   validated and constrained.
5. **Secrets & crypto** — no hardcoded secrets; secrets from the manager; correct
   use of vetted crypto (no home-rolled, no weak/legacy algorithms).
6. **Dependencies** — new packages vetted and audited (see [[dependency]]).
7. **Rate limiting / abuse** — expensive or auth endpoints are protected against
   brute force and abuse.

**Parallel fan-out (ADR-014 — if your harness supports subagents):** run the
seven dimensions as parallel **read-only** subagents — each receives the
change, the trust-boundary map from Phase 1, and its single dimension, and
returns findings in the table format below. The main agent merges and dedupes
(same file:line + issue → one finding, highest severity wins) and writes the
verdict itself. Without subagent support, run the dimensions sequentially —
identical output either way.

---

## Output format

## Security review: [title]

### Threat surface
[What boundaries this change touches.]

### Findings
| # | Dimension | Severity | File:line | Issue | Fix |
|---|-----------|----------|-----------|-------|-----|

Severity: Critical / High / Medium / Low.

### Verdict
Recommendation only. Critical/High findings are merge blockers.

---

## Rules

- Every finding: dimension, severity, file:line, concrete issue, concrete fix.
- Default to suspicion on auth and input handling — call out the absence of a
  check, not just wrong checks.
- If a dimension is clean: "Dimension N: no issues found."
- A confirmed Critical/High blocks merge and should trigger an `ai-log-write`.
