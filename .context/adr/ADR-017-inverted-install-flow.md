# ADR-017: Inverted install flow — seed install, `ai-init` curation, `suggest`/`apply` split

**Date:** 2026-06-16
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Redesign on `feature/redesign`. The pre-redesign flow ran a
full-catalog checklist at `install` time, then `ai-init` concretized the generic
templates. The selection happened **before** any project knowledge existed, so
the user picked blind and could install things the project never needs (a MySQL
skill on a Postgres project). The pain is structural and gets worse as the
catalog grows company-wide across teams and stacks: the checklist becomes heavy
and noisy. The knowledge about the project lives in `ai-init`; the selection must
move there too.

## Context

`install` had no way to know the project, yet it was where the user chose what to
install. `ai-init` is the only component that reads the real codebase. With a
small catalog the mismatch was tolerable; at company scale (many teams, many
stacks) the full-catalog checklist is unreadable. We can rebuild freely — the
pre-redesign flow is new and unused, so backward compatibility is not a
constraint (only the append-only ADR record is).

## Decision

Invert the flow. The decision of *what to install* moves from a blind checklist
to `ai-init`, which decides **with** the user, informed by a real scan.

### 1. `install` lays only the seed

The minimum needed for `ai-init` to run, and nothing else:

```
CLAUDE.md                          # placeholder; ai-init populates it
.claude/skills/ai-init/SKILL.md    # the keystone
.claude/rules/context.md           # so ai-init reads/writes .context/
.context/INDEX.md                  # initial index
.context/adr/  .context/ai-log/    # empty scaffolds
.claude/.scaffold-state.json       # initial state (seed installed, catalog version)
```

No checklist. `install` produces a bootstrap, not a usable scaffold.

### 2. The data flow — who produces what

```
ai-init (scan)      AGENT →  project-profile.json   (facts + evidence)
ai-scaffold suggest CLI   →  candidates.json         (mechanical appliesWhen — PURE, testable)
ai-init (curation)  AGENT →  install-plan.json       (rank + justify + structured dialog)
ai-scaffold apply   CLI   →  writes files / merges .mcp.json / updates state
```

`project-profile.json` is the **only** boundary the agent crosses into the CLI.
`suggest` trusts the profile's declared facts and never re-derives them — that
keeps the matcher pure and testable. `apply` is the **single writer**; the agent
never writes payload (preserves ADR-011 and idempotency).

### 3. State keyed by entry `id`, not file path

`.claude/.scaffold-state.json` records `installed: { <id> → {version, hash,
merge, workspaces} }`. The three-way base-aware classification of **ADR-006**
(clean / customized / conflict, never auto-applied) carries over unchanged in
spirit, but the unit of tracking becomes the catalog entry `id` instead of the
raw file path. `update` compares `installed[id].version` against the catalog and
`installed[id].hash` against the file on disk.

### 4. Ephemeral artifacts

`project-profile.json`, `candidates.json` and `install-plan.json` live under a
gitignored `.scaffold/` in the target, so `apply` can re-run without re-scanning.

### 5. Layer split preserved

`suggest`/`apply`/state I/O are pure logic in `installer.ts`; scanning and the
dialog live in the `ai-init` skill (agent); UI orchestration stays in
`commands/`. No `console`/prompts leak into `installer.ts`.

## Consequences

**Positive:**
- Selection is informed by a real scan instead of a blind checklist.
- De-noised: the user sees only what the project plausibly needs.
- Scales to a large catalog — the readability problem disappears at the source.
- `update` gains a better story (catalog grew **or** project changed → new
  applicable entries), built on the same per-`id` state.

**Negative / tradeoffs:**
- More moving parts (`profile`/`candidates`/`plan` files) than a single install.
- `ai-init` becomes mandatory — `install` alone yields no useful scaffold.
- The seed must stay genuinely minimal; padding it re-creates the old problem.

## Alternatives considered

### The agent writes the files directly
Rejected: two writers, the catalog/diff/update model goes blind to what the agent
did, and `ai-init` would start *generating* payload — a head-on collision with
ADR-011. The agent decides; the CLI executes.

### Keep the full-catalog checklist, filter client-side in `install`
Rejected: `install` has no project knowledge. Filtering requires the scan, which
only `ai-init` does.

## Context for AI assistants

- `install` ≠ a usable scaffold; it is a bootstrap for `ai-init`.
- `apply` is the single writer. The agent must never write payload.
- `project-profile.json` is the sole agent→CLI boundary; `suggest` trusts it and
  does not re-derive facts.
- State is keyed by catalog entry `id`; ADR-006's three-way classification still
  governs conflicts, now per entry.
- This ADR re-homes ADR-006's mechanism and retires the pre-redesign full-catalog
  checklist and the coarse `SCAFFOLD_VERSION` signal (the per-entry catalog
  version in ADR-018 replaces it).
