---
name: security-review
description: Threat-model-style security pass (authz, injection, SSRF, secrets, crypto).
---

# Skill: security-review

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
