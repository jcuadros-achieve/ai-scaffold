# ADR-002: Claude Code as primary target, logical template layout, install-time generation

**Date:** 2026-06-10
**Status:** Accepted — Cursor-specific outputs in decision 3 superseded by ADR-010
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. Adding one skill currently
requires touching four places (playbook, regenerated adapters, `DESC` map,
manifest adapter paths), and `templates/` must mirror the target's dotted
layout verbatim (invariant #1 in `CLAUDE.md`). GitHub's documentation
(verified 2026-06-10, [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills))
states Copilot discovers agent skills in `.github/skills`, **`.claude/skills`**,
and `.agents/skills`, across Copilot CLI, cloud agent, code review, the app,
and VS Code agent mode.

## Context

The `.ai/` directory was a tool-neutral abstraction layer: canonical playbooks
in `.ai/skills/`, with per-tool adapters (`.claude/commands/`,
`.github/agents/`, `.cursor/rules/`) generated at dev time and stored under
`templates/`. That neutrality was insurance against tool lock-in. Now that
Copilot natively reads `.claude/skills/`, the two main target tools consume the
same location directly — the insurance costs more (triple bookkeeping, stored
derived files, drift risk) than it protects.

## Decision

1. **Claude Code is the primary target.** Canonical artifacts install in
   Claude-native locations: skills at `.claude/skills/<name>/SKILL.md`
   (frontmatter `name` + `description`), rules at `.claude/rules/<name>.md`,
   and the project context as a **real `CLAUDE.md` file** at the root. The
   `.ai/` directory and the `CLAUDE.md` symlink disappear.
2. **`templates/` adopts a logical layout** that does not mirror the target:
   `templates/skills/`, `templates/rules/`, `templates/context/`,
   `templates/CLAUDE.md`. The installer owns an explicit logical→physical
   mapping table (e.g. `skills/<name>.md` → `.claude/skills/<name>/SKILL.md`,
   `context/**` → `.context/**`). No dot-prefixed directories on disk.
3. **Derived files are generated at install time, not stored:**
   `.github/copilot-instructions.md` (pointer to `CLAUDE.md` + rules),
   `.cursor/rules/ai-scaffold.mdc` (skill-name → playbook map), and the
   `.cursorrules` symlink → `CLAUDE.md`. The `.claude/commands/` and
   `.github/agents/` adapter sets are **removed entirely** — Claude Code and
   Copilot both discover `.claude/skills/` natively.
4. **`scripts/gen-adapters.mjs` is deleted.** Manifest `paths` reference
   logical template paths only; adapter paths vanish from the manifest.
5. **The version/selection file moves to `.claude/.scaffold-version`.** The
   installer recognizes a legacy `.ai/.scaffold-version` and offers migration.
6. This is a **breaking payload change**: `SCAFFOLD_VERSION` and the package
   version jump to 2.0.0, and all skill/rule content referencing `.ai/...`
   paths (especially `ai-init`) is rewritten to the new locations in the same
   change, with installer tests covering the mapping table.

## Consequences

**Positive:**
- One canonical location consumed natively by both main tools; adding a skill
  touches one or two places (the skill file, plus the manifest if optional)
  instead of four.
- `templates/` becomes readable (no hidden dot-dirs) and invariant #1
  ("paths map verbatim, keep the dots") is replaced by an explicit, tested
  mapping table in code.
- Derived files can no longer drift from their source — they don't exist in
  the repo.

**Negative / tradeoffs:**
- Cursor is demoted to pointer-rule support (it reads neither `.claude/skills`
  nor per-skill invocation); acceptable — it was already a single `.mdc` map.
- Breaking migration for existing installs (`.ai/` layout); the installer must
  detect and migrate, and `update` against an old layout must not corrupt it.
- Betting on a Claude-shaped convention; mitigated by `.claude/skills` now
  being a documented multi-tool convention on GitHub's side.

## Alternatives considered

### Keep the `.ai/` neutral layer with stored adapters (status quo)
Rejected: triple bookkeeping with real drift risk, and the neutrality is
redundant now that both primary tools read the same native location.

### `.agents/skills/` as the canonical location
Copilot reads it, but Claude Code does not — the primary tool must consume the
canonical location natively. Rejected.

### Generate adapters at dev time into `templates/` (current mechanism)
Rejected: still stores derived files and relies on a human remembering to
regenerate; the failure mode (stale adapter committed) is silent.

## Context for AI assistants

- Do not add per-tool adapter files under `templates/` — derived outputs belong
  in the installer's install-time generation step.
- Do not reintroduce `.ai/` or the `CLAUDE.md` symlink in targets; `CLAUDE.md`
  is a real file and `.claude/` is the canonical home.
- Until this ADR is implemented the repo still has the old layout; the
  implementation must land as one change (mapping table + content path rewrite
  + migration + tests) with a major version bump.
