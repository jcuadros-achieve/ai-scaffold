# Context rules

Rules governing how the AI reads and writes `.context/`.

1. Always read `.context/INDEX.md` before starting any task — and in a
   monorepo, also the `.context/INDEX.md` of the workspace(s) you will touch.
2. If ADRs exist for the task area, read them before proposing approaches.
3. Read the "Context for future sessions" notes from recent AI log entries for
   the same area before starting.
4. Never propose an approach that an ADR explicitly rejected.
5. After generating committed code, run `ai-log-write`.
6. An ADR is **required** when a decision is cross-cutting, hard to reverse,
   rejects a common alternative, or has significant tradeoffs. When in doubt,
   write it. Merging such a change without an ADR is a defect — `pr-review`
   treats a missing required ADR as a blocker.
7. Every ADR is **complete**: all sections filled, especially the mandatory
   "Context for AI assistants". A stub ADR is worse than none — it looks
   decided. Use `adr-write`; never hand-author a partial one.
8. Never update `INDEX.md` manually — always use `context-update`.
9. `.context/` is append-only — never delete or rewrite ADRs. Supersede instead
   (mark the old "Superseded by ADR-NNN").
10. AI log entries are permanent — corrections go in new entries, not edits.
11. A "Patterns missed" action in an AI log is not resolved until the referenced
    rule or `CLAUDE.md` is actually updated; `context-update` surfaces these
    until they are.
12. **Memory lives nearest to what it describes (ADR-013).** In a monorepo,
    workspace-local decisions and logs go to `<workspace>/.context/` (own ADR
    numbering); cross-workspace ones go to the root `.context/`. The root
    `INDEX.md` aggregates the workspace indexes.
