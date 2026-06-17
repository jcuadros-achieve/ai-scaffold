# AI log: Redesign of the install flow — inverted curation, ADRs 017–020

**Date:** 2026-06-16
**Skill(s) used:** None (open design brainstorm + manual ADR authoring)
**Ticket / context:** `feature/redesign` branch. Reworking how a target project
gets its scaffold: move the "what to install" decision out of a blind
install-time checklist and into `ai-init`, which decides *with* the user after
scanning the project. Motivation: the catalog will grow company-wide across teams
and stacks, making the full-catalog checklist unreadable and offering irrelevant
things (a MySQL skill on a Postgres project).
**Complexity:** L (structural, cross-cutting; supersedes three prior ADRs)

## What was asked

Brainstorm and harden a redesign where `install` lays only a minimal seed and
`ai-init` scans the project, then suggests — from a static catalog, never
generated on the fly — only the skills/rules/agents/mcps that the project
plausibly needs, for the user to choose from. Close the design, then record it as
ADRs before any implementation.

## What the AI generated

| File | Action | Summary |
|------|--------|---------|
| `.context/adr/ADR-017-inverted-install-flow.md` | create | Seed install; `ai-init` curation; `suggest`(pure)/`apply`(single writer) split; state keyed by entry `id` |
| `.context/adr/ADR-018-catalog-model.md` | create | Frontmatter-colocated entries → compiled `catalog.index.json`; declarative `appliesWhen`; mechanical filter + agent ranking; index/body split |
| `.context/adr/ADR-019-agents-in-payload.md` | create | Read-only specialist agents ship; `model` as `effort`/tier intent concretized by `ai-init` |
| `.context/adr/ADR-020-monorepo-curation.md` | create | Per-workspace filtering; curated union install at root; `conflictsWith` per workspace |
| `.context/adr/ADR-000-index.md` | edit | 4 rows added; ADR-007/009 marked superseded; ADR-014 footnote³; Pending-decisions refreshed |

No source code (`src/`, `templates/`) was touched — ADRs precede implementation
(ADR-001 decision gate).

## What was accepted

All four ADRs and the index update, as designed in the conversation. The user
gave explicit green light on the 4-ADR decomposition before any file was written.

## What was rejected or modified

| Item | Why rejected / how modified |
|------|-----------------------------|
| `settings.json` surfaces (hooks / permissions / allowedTools) | Cut from scope by the user — operational posture the project owners should set by hand, not a catalog concern. Removed the entire highest-risk write surface; no new write mechanic needed. |
| `commands` as a distinct surface | Folded into `skills` (skills are already invoked `/<name>`); avoids a redundant catalog category. |
| Agent writer-mode in fase 1 | Deferred — parallel mutation/worktrees risk out of proportion; fase 1 is read-only specialists only. |
| Agents with concrete model ids | Rejected — breaks ADR-005; use `effort`/tier intent concretized by `ai-init`. |
| Naive whole-repo union profile (monorepo) | Rejected — reintroduces the noise the redesign kills; profile became per-workspace. |

## Deviations from plan

None — there was no implementation plan; this was a design session that produced
decision records.

## Patterns confirmed

- Append-only `.context/`: new ADRs supersede rather than rewrite; ADR-007/009
  marked *Superseded by ADR-018*, ADR-014's agents clause noted as superseded by
  ADR-019 while its fan-out posture stands (context rule 9).
- ADR completeness (rule 7): every section filled, including "Context for AI
  assistants".
- Layer split preserved as a design invariant: the agent decides (produces data —
  the plan), the CLI executes (single writer) — keeps ADR-011 intact.

## Patterns missed or wrong

- The repo's own `.context/` has no top-level `INDEX.md` and no `context-update`
  tooling wired (only the hand-maintained `ADR-000-index.md`). `ai-log-write`
  says to update `.context/INDEX.md`, which doesn't exist here.
  **Action: no action needed** for this design session; if root-level context
  memory grows, create and maintain `.context/INDEX.md` then.

## Context for future sessions

- Implementation has NOT started. Start from the catalog: define the literal
  per-surface frontmatter and write `scripts/build-catalog.mjs` (compiles
  frontmatter → `catalog.index.json`) — it unblocks `suggest`, `apply`, and the
  `ai-init` prompt (ADR-018).
- Keep the writer boundary: `apply` is the only thing that writes payload; the
  agent only emits `project-profile.json` / `install-plan.json`. Never let
  `ai-init` write files (ADR-017, ADR-011).
- Agent frontmatter declares `effort`, never a model id — the catalog drift test
  must reject ids (ADR-018 §6, ADR-019).
- In monorepos, filter per workspace and resolve `conflictsWith` per workspace,
  not globally — global resolution silently drops legitimately-needed entries
  (ADR-020).
- Three deferred decisions are recorded in `ADR-000-index.md` "Pending
  decisions": CLI verb naming, exact compiler frontmatter, `.scaffold/` location.
