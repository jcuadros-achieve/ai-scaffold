# Context rules

Rules governing how the AI reads and writes `.context/`.

1. Always read `.context/INDEX.md` before starting any task.
2. If ADRs exist for the task area, read them before proposing approaches.
3. Read the "Context for future sessions" notes from recent AI log entries for
   the same area before starting.
4. Never propose an approach that an ADR explicitly rejected.
5. After generating committed code, run `ai-log-write`.
6. An ADR is required when introducing or changing a cross-cutting pattern.
7. Never update `INDEX.md` manually — always use `context-update`.
8. `.context/` is append-only — never delete or rewrite ADRs.
9. AI log entries are permanent — corrections go in new entries, not edits.
