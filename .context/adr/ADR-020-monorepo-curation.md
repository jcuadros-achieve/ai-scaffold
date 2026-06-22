# ADR-020: Monorepo curation — per-workspace filtering, union install at the root

**Date:** 2026-06-16
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Redesign on `feature/redesign`. The inverted filter
(ADR-017 + ADR-018) de-noises only if it is scoped per workspace. A monorepo —
the `achieve` workspace itself, 19 projects, is the canonical test case — unioned
naively yields a profile with `pg` **and** `mysql2` **and** Next **and**
Terraform, so `suggest` would offer postgres **and** mysql patterns and
everything else, reintroducing exactly the noise the redesign exists to kill.

## Context

ADR-013 set the monorepo backbone — one scaffold installed at the repo root,
`ai-init` detects workspaces, generates the root map + nested per-workspace
`CLAUDE.md`, memory resolves to the nearest `.context/`, and stack rules carry an
`Applies to` scope. The redesign must layer per-workspace *filtering* on that
backbone without breaking the single-install model. `.claude/` is resolved
repo-wide by the tooling, so a skill/agent/mcp cannot be installed "for one
workspace only" — relevance has to be expressed in content, not file location.

## Decision

### 1. The profile becomes a per-workspace collection

```json
{
  "root": "/repo",
  "workspaces": [
    { "path": "ffn-la-backend-session-store/session-store",
      "languages": ["typescript"], "deps": ["express","kysely","pg"],
      "archetype": "service", "evidence": { "pg": "...client.ts" } },
    { "path": "ffn-flow-explore-growth-partners-api/growth-partners-api",
      "languages": ["typescript"], "deps": ["express","sequelize","mysql2"],
      "archetype": "service" }
  ]
}
```

### 2. `suggest` filters per workspace and attributes candidates

`appliesWhen` runs **per `workspaces[]` entry**; the candidates are unioned, and
each carries the list of workspaces that justified it.

### 3. `conflictsWith` and matching resolve *within* a workspace, not globally

postgres and mysql both legitimately apply — in different workspaces — and
coexist in the root union, each scoped via `Applies to`. Resolving the conflict
globally would wrongly drop one. This is the one fine-grained change the monorepo
case forces on the ADR-018 schema.

### 4. Physical install stays single, at the root; the union is curated

The installed set is the **curated union** — only what *some* workspace needs,
never the full company catalog. *When/where* an entry applies is expressed by the
nested per-workspace `CLAUDE.md` + `Applies to` in rules (ADR-013), not by file
location. In `achieve` that yields postgres + mysql + next + terraform, but never
rust/django/redis.

### 5. Plan and state carry workspace attribution

Each `install-plan.json` and `.scaffold-state.json` entry records the
`workspaces` that justified it, so `update` can re-evaluate per workspace (a new,
changed, or orphaned workspace).

### 6. Dialog groups by workspace

In a large monorepo, grouping by workspace ("for the Postgres services…", "for
growth-partners-api…") is far more legible than grouping by surface. An entry
justified by N workspaces is offered **once**, with the workspace list as
evidence — never confirmed N times.

## Consequences

**Positive:**
- De-noising holds in monorepos — the redesign's core promise survives the
  hardest case.
- Per-workspace relevance is preserved while the install stays single.
- `update` is workspace-aware (re-scans per workspace).

**Negative / tradeoffs:**
- `profile`/`plan`/`state` gain a workspace dimension.
- Per-workspace conflict semantics are a subtlety that is easy to implement
  wrong (global resolution silently drops legitimately-needed entries).

## Alternatives considered

### Union the whole repo into one profile
Rejected: reintroduces the exact noise the redesign kills (offers postgres *and*
mysql to a repo that needs both, with no scoping).

### Install a separate scaffold per workspace
Rejected: `.claude/` is repo-wide; ADR-013's one-install-at-root backbone stands.
Relevance is carried by content (nested `CLAUDE.md`, `Applies to`), not by extra
installs.

### Global `conflictsWith`
Rejected: drops entries that are legitimately needed by different workspaces.

## Context for AI assistants

- In a monorepo: filter per workspace, install the curated union at the root,
  resolve `conflictsWith` *within* a workspace.
- `project-profile.json` is a `workspaces[]` collection; plan/state entries carry
  workspace attribution.
- The union is still curated — never the full catalog.
- Relevance is expressed by nested `CLAUDE.md` + `Applies to` (ADR-013), not by
  where files physically sit.
- This ADR extends ADR-013 (keeps its backbone) with the per-workspace filtering
  the inverted flow requires.
