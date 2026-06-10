# ADR-010: Drop Cursor-specific artifacts — Cursor consumes `.claude/` natively

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Supersedes:** ADR-002, decision 3 partially (the Cursor-specific generated
outputs; the Copilot pointer and the generation mechanism stand)
**Ticket / context:** Real-world test in `ffn-resiliency` (2026-06-10).
Verified during the manual test: Cursor reads the `.claude/` structure
directly, so the generated `.cursor/rules/ai-scaffold.mdc` and the
`.cursorrules` symlink add files without adding compatibility.

## Context

ADR-002 kept two Cursor accommodations: a generated context rule mapping skill
names to playbooks, and a `.cursorrules` symlink → `CLAUDE.md` (Cursor's
legacy config file). The Claude-first bet was that `.claude/` would become a
multi-tool convention; the `ffn-resiliency` test confirms Cursor now reads it
natively, making both artifacts redundant.

## Decision

1. **Stop generating `.cursor/rules/ai-scaffold.mdc`** — `generatedFiles()`
   produces only the Copilot pointer (Copilot discovers `.claude/skills/`
   natively but still reads `copilot-instructions.md` for context routing).
2. **Stop creating the `.cursorrules` symlink.** With it gone, the `symlink`
   `FileAction` type has no remaining producer and is **removed** (dead code);
   `applyAction` keeps its replace-a-preexisting-symlink guard, which pre-2.0
   migrations still need.
3. Existing installs keep their orphaned `.cursor/`/`.cursorrules` files — we
   never delete user files; they simply stop being tracked or regenerated.

## Consequences

**Positive:** two fewer installed artifacts and one less action type; the
payload converges fully on `CLAUDE.md` + `.claude/` as the single surface
every tool reads.

**Negative / tradeoffs:** Cursor versions old enough to predate `.claude/`
support lose the pointer; acceptable — the test validated current Cursor, and
the legacy `.cursorrules` format is deprecated by Cursor itself.

## Alternatives considered

### Keep generating both "just in case"
Rejected: contradicts the verified behavior and keeps dead surface alive; the
generation mechanism remains, so reintroducing a pointer later is one entry in
`generatedFiles()`.

## Context for AI assistants

- Do not reintroduce Cursor-specific outputs (or any per-tool pointer) without
  verifying the tool cannot read `.claude/` natively first.
- The `symlink` action type was removed deliberately — if a future tool needs
  a symlink, restore it via this ADR's supersession, not ad hoc.
