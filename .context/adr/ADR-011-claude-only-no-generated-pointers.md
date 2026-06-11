# ADR-011: Claude-only payload — no per-tool generated artifacts at all

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Supersedes:** ADR-010 decision 1 (the Copilot pointer) and the last remaining
generated output of ADR-002 decision 3. Also makes ADR-005 decision 3 (tier
surfaced in generated pointers) inoperative — `tier` stays as frontmatter
metadata.
**Ticket / context:** Follow-up to the ffn-resiliency test (2026-06-10). After
dropping the Cursor artifacts (ADR-010), the decision is taken to its
conclusion: generate nothing for Copilot or any other tool either. The
scaffold centers on Claude, full stop; other tools' compatibility comes from
them reading `.claude/` — it is their concern, not this payload's.

## Context

The only generated artifact left was `.github/copilot-instructions.md`, a
pointer at `CLAUDE.md` + `.claude/rules/` with the skill list. Maintaining
per-tool pointers is an open-ended commitment (every tool, every format
change), contradicts the single-surface principle, and the real-world test
showed the native route works.

## Decision

1. **The installer generates nothing.** `generatedFiles()` and its supporting
   code (`collectSkills`, frontmatter parsing, the `content` field on
   `FileAction`) are removed; `planInstall` plans template files only. The
   payload is exactly: `CLAUDE.md`, `.claude/`, `.context/`.
2. **Compatibility is the consuming tool's job.** Copilot and Cursor read
   `.claude/` natively for skills; a team that wants tool-specific context
   routing (e.g. an `AGENTS.md` or their own `copilot-instructions.md`
   pointing at `CLAUDE.md`) writes and owns that file — it is user content,
   not scaffold content.
3. `tier` remains in skill frontmatter (ADR-005) as the stable effort
   contract, available to any tool that learns to read it.
4. Existing installs keep their orphaned generated files (we never delete
   user files).

## Consequences

**Positive:**
- One surface, zero derived artifacts, zero pointer-maintenance treadmill;
  the installer simplifies back to "map and copy + classify".
- The product statement is unambiguous: Claude-first means Claude-only
  payload.

**Negative / tradeoffs:**
- Copilot loses the shipped context pointer (it does not read `CLAUDE.md` for
  repo instructions by itself); teams that rely on Copilot add their own
  pointer file. Accepted explicitly.

## Alternatives considered

### Keep the single Copilot pointer (status quo after ADR-010)
Rejected: it is the same per-tool commitment in miniature, and the decision's
principle ("compatibility is not our problem") removes its justification.

## Context for AI assistants

- Do not add generated files to the installer for any tool. If a future tool
  integration is wanted, it must supersede this ADR first.
- `tier` frontmatter stays — do not remove it just because nothing surfaces
  it today.
