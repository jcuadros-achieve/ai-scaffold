# ADR-009: Technology stack modules as optional modules (`kind: stack`)

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. The scaffold ships
stack-neutral content by principle, and `ai-init` concretizes it per project —
but `ai-init`'s evidence rule means it can only derive what the codebase
already exhibits. Curated *external* expertise per technology (conventions,
pitfalls the code doesn't yet avoid) has no home. A survey of the
`~/Projects/TrueNorth/achieve` portfolio (2026-06-10) grounds the pilots:
Next.js in 7 projects, Express in 6, TypeScript/Jest in 13, a ~10-repo
Terraform family, MUI in 6.

## Context

Three mechanisms exist and none covers this: core rules are agnostic
principles; `ai-init` personalizes from evidence in the repo; optional modules
are *shape*-based (has a DB, exposes an API), not technology-based. The gap is
guidance like "Next.js server/client boundary pitfalls" — knowledge a generic
rule can't state and `ai-init` won't invent. The risk is equally real: static
tech content rots with framework majors, and for mainstream technologies the
models already know more than a stale markdown. The marginal value is highest
for team conventions ("how *we* do Next.js") and internal frameworks — the
company-distribution use case.

## Decision

1. **Stack modules are optional modules with `kind: "stack"`.** No new
   infrastructure: the manifest, the per-template catalog (ADR-007 — makes
   staleness visible via per-file `updated`), tags, and three-way updates
   (ADR-006) all apply as-is. They are **never core** — the stack-neutral
   promise is untouched.
2. **Rules, not skills, by default.** Generic skills are already reinterpreted
   per archetype by `ai-init` (`new-endpoint` → "create an App Router page").
   A stack *skill* requires the unit of work to differ structurally — none
   identified yet.
3. **Content contract:** durable conventions and pitfalls plus team-opinion
   placeholders — **never API reference** (that is live-docs territory and rots
   first). Each stack rule states the version range it covers in its header,
   and contains "Run ai-init to…" markers so `ai-init` concretizes it like any
   optional rule.
4. **Pilots (demand-backed):** `stack-nextjs` and `stack-node-express`.
   Next candidates when a real project asks: `stack-terraform` (largest repo
   family), `stack-go`.
5. **`ai-init` recommends, generically:** its final output suggests checking
   `ai-scaffold update` for stack modules matching the detected stack — without
   hardcoding module names into the skill (the target has no manifest, and a
   hardcoded list would rot).
6. **On-demand with an owner** (the `CANDIDATE-MODULES` principle): a stack
   module is added when a real project asks, and someone answers for keeping
   it fresh.

## Consequences

**Positive:**
- Curated tech expertise ships without touching the agnostic core; selection
  stays explicit at install time.
- The maintenance surface is bounded by demand, and the catalog's per-file
  `updated` date makes staleness measurable instead of silent.
- The mechanism is exactly what internal/company frameworks will need at
  `@achieve` scale — where the value is highest because no model knows them.

**Negative / tradeoffs:**
- Tech content rots faster than shape content; mitigated (version range in the
  header, durable-conventions-only contract, owner per module) but not
  eliminated.
- Two coarse pilots can't prove the internal-framework case yet; that waits
  for company distribution.

## Alternatives considered

### Per-framework-version modules (`nextjs-14`, `nextjs-15`)
Rejected: combinatorial maintenance for marginal precision; the version range
header on a single module covers the need.

### Having `ai-init` generate tech rules from model knowledge (no shipped content)
Rejected as the primary mechanism: it breaks `ai-init`'s evidence rule, is not
curated or reviewable, and produces different content per run. It also can't
encode team opinions.

### A big up-front stack catalog
Rejected: the `CANDIDATE-MODULES` principle — a bloated catalog of
half-relevant rules erodes "every rule here matters".

## Context for AI assistants

- Stack-specific content goes ONLY in optional `kind: "stack"` modules; never
  into core rules or core skills.
- A stack rule must state its covered version range and contain no API
  reference detail — durable conventions and pitfalls only.
- Do not hardcode available module names inside `ai-init`; the recommendation
  stays generic.
