---
name: ticket-from-finding
description: Convert a structured finding (perf/security/observability) into a remediation ticket — map fields, preserve severity & evidence, gate before filing.
tier: deep
id: skill/ticket-from-finding
surface: skill
summary: Convert a structured finding into a remediation ticket (map fields, preserve severity & evidence, gate before filing)
tags: [requirements, workflow, security, performance]
appliesWhen:
  any:
    - contains: "finding"
    - contains: "vulnerability"
    - contains: "regression"
rationale: Structured bridge from the perf/security/observability chains into the work chain; findings carry severity+evidence that must survive into the ticket
stability: stable
---

# Skill: ticket-from-finding

> **`/ticket-from-finding help`** — if the invocation argument is `help` (or
> `--help`), print this card verbatim and stop; do not run the skill.
>
> - **What:** Converts a structured finding (from `snyk-scan`, `perf-investigate`, `obs-audit`, a security review) into a remediation ticket.
> - **When:** A finding with severity + evidence already exists — now it needs to become trackable work.
> - **Gates / asks:** Asks only if the finding lacks a clear remediation path (max 1 round); filing via tracker MCP needs your explicit approval.
> - **Output:** Paste-ready remediation ticket preserving severity, evidence, and a link back to the finding/report, optionally filed.
> - **Chain:** End of the perf/security/observability chains → this skill → `ticket-clarify` for the technical brief.
> - **Example:** `/ticket-from-finding` + paste the snyk-scan output for CVE-XXXX

A **finding** is structured: it has a severity, evidence, and usually a
recommendation (a vuln scan hit, a perf regression with a flame graph, an obs
gap). Unlike `ticket-from-report` (free-form report), the structure lets this
skill **map fields** rather than extract prose — and the discipline is to
**preserve the severity and evidence intact**, because a remediation ticket that
loses the CVSS score or the regression metric is un-triageable.

---

## Phase 1 — Map

Read the finding and map its structured fields onto the ticket. Do not invent; map
what's there and flag what isn't:

- **What** — the vulnerability / regression / gap, stated precisely (CVE id,
  metric + direction, missing signal).
- **Why (severity)** — the finding's severity, **preserved verbatim** (CVSS score
  + vector, P50→P95 regression %, blast radius). This is the triage signal; never
  paraphrase it away.
- **How (remediation)** — the finding's recommended fix if it states one; otherwise
  `⚠ NO REMEDIATION — needed before: task-plan`.
- **Context** — the affected component(s)/file(s)/endpoint(s), the scan or
  investigation that produced it, the tool + version, reproduction, and a **link
  back to the finding/report** (the snyk run, the perf-investigate output, the
  audit doc).
- **Evidence** — the proof the finding is real (CVE detail link, before/after
  metrics, flame graph, trace). Goes in Context as the ticket's evidence.
- **Scope** — infer In/Out from the finding's blast radius; mark inferred scope
  as `inferred`.
- **Acceptance criteria** — derive from the finding's definition of "remediated":
  vuln no longer flagged at this severity, metric back within budget, signal now
  present. If the finding doesn't define done, mark `⚠ NOT DERIVED — needed
  before: PR`.
- **Priority** — map the finding's severity to P0–P3 using the project's
  convention (Critical/High → P0/P1; Medium → P2; Low → P3). `ai-init` records
  the mapping.

---

## Phase 2 — Ask (only if no remediation path)

If the finding states no remediation and none is obvious, ask **once**, batched
(~2 questions), using structured questions (ADR-015) with best-guess options
derived from the finding plus the free-text "Other". A skipped answer records
`⚠ NOT PROVIDED`. Do not ask about severity or evidence — those are the finding's,
not open questions.

---

## Phase 3 — Compose

## Ticket: [title — verb + outcome, e.g. "Remediate CVE-XXXX in auth-service (High)"]

### Overview
2–3 sentences: the finding → what this ticket does → the remediated state.

### What
[The vulnerability / regression / gap, precise.]

### Why (severity)
**[Severity verbatim]** — [CVSS / metric / blast radius]. [Evidence summary.]

### How (remediation)
[Recommended fix, or `⚠ NO REMEDIATION — needed before: task-plan.`]

### Context
- **Affected:** [component/file/endpoint]
- **Source:** [scan/investigation + tool/version] — [link back to finding]
- **Evidence:** [CVE link / before-after metrics / flame graph / trace]
- **Reproduction:** [steps, or `see source finding`]

### Scope
- **In:** / **Out:** [inferred from blast radius]

### Acceptance criteria
- [ ] [Observable remedi\ation: vuln not flagged / metric within budget / signal present]

### Details
- **Priority:** [P0–P3, severity-mapped]
- **Dependencies / blockers:** [or `None known`]
- **Open questions:** `⚠ ... — needed before: [stage]`

---

## Phase 4 — File it (optional)

If a tracker MCP server is configured in `.mcp.json` (e.g. `atlassian`), offer to
create the ticket directly. **Never file without showing the final text and
receiving explicit approval** — a security/perf ticket is outward-facing and often
governs an SLA. Present the approval as a structured question when available
(ADR-015): `File it` / `Edit first` / `Don't file`. Otherwise the markdown above
is paste-ready.

---

## Hand-off

> Remediation ticket ready from finding ([severity], [Pn])[, filed as PROJ-NNN].
> Continue with `ticket-clarify` to produce the technical brief?

The skill proposes; the human decides. Present this Hand-off as a structured
question when your harness supports option dialogs (ADR-015):
`Approve — continue with ticket-clarify` / `Adjust first` / `Stop here`.

---

## Rules

- Map structured fields; preserve severity and evidence verbatim — they are the
  triage signal, not prose to paraphrase.
- Always link back to the source finding/report; a remediation ticket with no
  provenance is un-auditable.
- Ask only for a missing remediation path, one batched round max; never ask about
  severity or evidence.
- Map severity → priority with the project's convention; don't invent urgency.
- "How" records the recommended remediation, never a full design — solutioning
  belongs to `task-plan`.
- Never file to a tracker without explicit approval of the final text.
