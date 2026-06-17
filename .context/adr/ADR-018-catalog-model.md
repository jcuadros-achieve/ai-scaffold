# ADR-018: Catalog model — frontmatter-colocated entries compiled to an index, declarative `appliesWhen`

**Date:** 2026-06-16
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Redesign on `feature/redesign`. With the inverted flow
(ADR-017), the catalog becomes the core artifact: `ai-init` filters it against a
project scan and offers the user a short, justified list. The pre-redesign model
— `scaffold.manifest.json` cataloging optional modules with paths (ADR-007), and
stack expertise modeled as `kind: stack` optional modules (ADR-009) — does not
scale to a company-wide catalog and does not express *when* an entry applies.

## Context

A company catalog will hold hundreds of entries across teams and stacks. Two
problems with the old model: (1) a single monolithic manifest is a merge-conflict
magnet when many teams add entries, and (2) the core-vs-optional axis is the
wrong one — what matters is "applies when the project uses X", not "is this
optional". The filter must be declarative and testable, with the agent adding
judgment on top, not the other way round.

## Decision

### 1. Metadata as frontmatter, colocated with the body, compiled to an index

Each catalog entry carries its metadata as **frontmatter next to its body** —
the convention skills already use (`name`/`description`/`tier`). Skills, rules
and agents are `.md` with frontmatter; MCP entries (no body) are a small JSON
file. A dev build (`scripts/build-catalog.mjs`) compiles all frontmatter into a
single shippable `catalog.index.json`. **One file per entry** → teams PR
independently with no monolith conflicts. The compiled index is never hand-edited
(regenerated, like the pre-redesign catalog).

### 2. Entry schema (common envelope)

```yaml
id: skill/postgres-patterns      # namespaced by surface: skill|rule|agent|mcp
surface: skill
title: "Postgres patterns"
summary: "Kysely/pg pooling, query builder, migration discipline"
body: skills/postgres-patterns.md   # logical path (or `server:` block for mcp)
tags: [database, postgres, backend]
appliesWhen:
  any:
    - dep: pg
    - dep: kysely
    - { dep: "@prisma/client", file: "**/schema.prisma", contains: 'provider = "postgresql"' }
conflictsWith: [skill/mysql-patterns]
requires: []
rationale: "Postgres-specific guidance the core db rule can't carry generically"
seed: false
stability: stable                # stable | experimental
```

### 3. `appliesWhen` — the declarative, mechanical filter

Predicates: `dep`, `file` (optional `contains`), `lang`, `framework`,
`archetype`. Combined with `any` (OR) / `all` (AND), nestable **one level**.
**Absence of `appliesWhen` = universal** (always recommended) — that is how
transversal entries (security, code-style) stay visible without a tag.

The mechanical filter runs in the CLI (`suggest`); the agent ranks and writes
the evidence-based justification on top. Declarative base, agent above — never
the reverse. `rationale` is static (why the entry exists); the live justification
("detected Kysely+Postgres in id-check") is the agent's, produced at scan time.

### 4. Escape hatch

The filtered set is the **default view, not a wall**. The user can request the
full catalog or add an unmatched entry. Filtering narrows the default; it never
locks the user out.

### 5. Index/body separation → future on-demand registry

The compiled index is lightweight metadata; bodies are heavy. This leaves the
door open to a future registry where the CLI fetches only selected bodies,
without a redesign. Fase 1 stays bundled in the package.

### 6. Hardened catalog test

The drift test additionally fails if an entry lacks `id`/`surface`/`body`(or
`server`)/`rationale`, if an `agent` declares a model id instead of `effort`
(ADR-019), or if an `mcp` `server.env` carries a credential-shaped value
(preserving ADR-008's no-credentials rule).

### 7. Core/optional inverts

Almost nothing auto-installs (only `seed: true`, the ADR-017 bootstrap);
everything else is offered through `appliesWhen`. The old "core implicit /
optional explicit" distinction is replaced.

## Consequences

**Positive:**
- Scales to a company catalog; governance via one-file-per-entry, no monolith.
- The filter is mechanical and testable; justification is the agent's job.
- Index/body split gives a migration path to an on-demand registry.

**Negative / tradeoffs:**
- A compile step (`build-catalog.mjs`) joins the toolchain; the index is a
  generated artifact that must be regenerated, never hand-edited.
- Frontmatter discipline becomes load-bearing — a mistagged entry is mis-offered.
- Per-ecosystem detection resolvers (for `dep`/`lang`) are real work, carried by
  the `ai-init` scan (ADR-017).

## Alternatives considered

### Monolithic `catalog.json`
Rejected: a merge-conflict magnet at company scale. One file per entry, compiled.

### Pure-prompt filtering by the agent over the raw catalog
Rejected: lossy, unauditable, and does not scale to hundreds of entries. The
mechanical `appliesWhen` filter is the base; the agent only ranks and justifies.

### Keep `kind: stack` optional modules (ADR-009)
Rejected: core-vs-optional is the wrong axis; it cannot express *applies-when*.
Stack rules become ordinary catalog entries with `appliesWhen`.

## Context for AI assistants

- Metadata lives in frontmatter next to the body; `catalog.index.json` is
  generated — regenerate via `build-catalog.mjs`, never hand-edit.
- Absent `appliesWhen` means universal. The filter is mechanical (CLI); the
  justification is the agent's, with repo evidence.
- No model IDs in agent frontmatter (ADR-019); no credentials in `mcp` `env`
  (ADR-008).
- This ADR supersedes ADR-007 (template catalog) and ADR-009 (stack modules as
  optional). ADR-008's MCP add-only merge survives as one catalog surface.
