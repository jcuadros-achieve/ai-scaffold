# ADR-013: Monorepo support — process at the root, context nearest to what it describes

**Date:** 2026-06-12
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Post-rollout review (2026-06-12). The scaffold assumed
repo = one project: a single `CLAUDE.md`, a global module selection, one ADR
sequence. In a monorepo (apps/libs/packages, each with its own purpose, stack
and decisions) that flattens distinct contexts — and `ai-init`'s "treat the
dominant package as primary" instruction was a placeholder, not an answer.
Inputs from the team: devs open sessions both at the root and inside a
package; pilot is `ffn-cxt-packages`; workspace tooling varies per repo
(pnpm/yarn workspaces, turbo, nx — no standard).

## Context

Claude Code natively supports half the problem: it always loads the root
`CLAUDE.md`, loads a subdirectory's `CLAUDE.md` on demand when working in that
subtree, and resolves `.claude/` configuration at the repo root — so both
session styles (root or inside a package) see the same scaffold. The natural
design is therefore **one scaffold + nested contexts**, not N scaffolds.

## Decision

1. **The installer does not change: one scaffold per repo, at the root.**
   Module selection is the union of what the workspaces need. (Per-workspace
   selection is deferred until a real monorepo demands it with evidence.)
   Per-package installs were rejected: N copies of the process skills drift,
   `update` multiplies, and the work/context chains are shared process by
   design.
2. **`ai-init` gains a real monorepo mode** (replacing "dominant package"):
   - **Detect** workspaces by marker (`pnpm-workspace.yaml`, `workspaces` in
     package.json, `turbo.json`, `nx.json`, `lerna.json`) with a structural
     fallback (`apps/`, `packages/`, `libs/` containing their own manifests) —
     tooling varies per repo, so detection is multi-marker.
   - **Classify each workspace's archetype** and analyze each one, plus the
     cross-cutting layer: package boundaries, the dependency graph between
     workspaces, shared tooling, what a change in a shared lib implies.
   - **Generate**: the root `CLAUDE.md` becomes the **monorepo map** (what
     each workspace is, boundaries, inter-package dependencies, shared
     conventions, how to run each); each workspace gets its own nested
     `CLAUDE.md` (purpose, stack, invariants, risks, how to run). Nested
     files are project content created by `ai-init` — never tracked or
     touched by `update`.
3. **Memory lives nearest to what it describes.** Cross-cutting decisions →
   root `.context/`; package-local decisions → `<workspace>/.context/` with
   its **own ADR numbering** (independent sequences; no cross-team numbering
   conflicts). The context skills resolve the target as: nearest `.context/`
   at-or-above the files affected — created on first use in a workspace; when
   the change crosses workspaces, the root. The root `INDEX.md` aggregates by
   listing workspace indexes.
4. **Scoped rules.** Stack rules carry a scope line (`Applies to: …`) that
   `ai-init` fills with the matching workspaces; outside that scope the rule
   instructs agents to ignore it. Core rules stay global (process and
   principles are repo-wide). `verify` is concretized per workspace by
   `ai-init` (e.g. filtered turbo/nx commands).

## Consequences

**Positive:**
- Both session styles work unchanged: root sessions get the map and load
  package context on demand; in-package sessions get root + local context
  automatically.
- Nearly all the weight lands on content (`ai-init`, context skills), not on
  installer code: catalog, 3-way updates, MCP and versioning are untouched.
- Per-package ADR sequences remove cross-team numbering contention.

**Negative / tradeoffs:**
- Rule *loading* is still global (a Claude limitation): scope lines mitigate
  misapplication but don't remove the tokens.
- Aggregated root `INDEX.md` depends on `context-update` walking workspace
  indexes — one more thing the skill must do consistently.
- Union module selection can install a stack rule irrelevant to most
  workspaces; acceptable with scope lines, revisit if it bloats.

## Alternatives considered

### Scaffold per package (run install in each workspace)
Rejected: N copies of 19 process skills drifting independently, N updates,
and a root session sees none of it. Process is shared; only context is local.

### Status quo ("dominant archetype")
Rejected: it is the documented failure — non-dominant packages get wrong
context by design.

### Per-workspace module selection in the installer
Deferred, not rejected: real complexity (selection schema, version-file
shape, prompts) with no demanding monorepo yet; scope lines cover the gap.

## Context for AI assistants

- Do not create per-package scaffolds or track nested `CLAUDE.md` /
  `.context/` files as templates — they are `ai-init`-generated project
  content.
- Context skills must resolve the nearest `.context/`; never default to the
  root when all touched files live in one workspace.
- Keep core rules unscoped; scope lines are for stack modules only.
