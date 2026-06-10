---
name: migration
description: Write a safe, reversible, backward-compatible DB/data migration.
---

# Skill: migration

Write a database (or data) migration safely. Migrations are in a no-touch zone
(see [[no-touch]]) — they require human review and must never be edited after
they've run anywhere.

---

## Principles

- **Forward-only and reversible-by-design.** Provide a down/rollback path, or
  document explicitly why it's irreversible and how to recover.
- **Backward compatible / expand–contract.** Deploy in phases so old and new code
  both work during rollout:
  1. **Expand** — add the new column/table/index (nullable, with default).
     Old code keeps working.
  2. **Migrate** — backfill data in batches; deploy code that writes both.
  3. **Contract** — once nothing reads the old shape, remove it in a later
     migration.
- **Never** rename/drop a column in the same release that stops using it — that
  breaks the running old version mid-deploy.

## Safety

- **Backfills run in batches**, not one giant transaction that locks the table.
- Adding an index on a large table uses the non-blocking/concurrent variant.
- Preserve data integrity: constraints, foreign keys, and uniqueness are
  considered explicitly. Never lose data to make a schema "cleaner".
- Test the migration on a realistic data copy before production. Time it.

---

## Output format

## Migration: [title]

### Change
[What schema/data change and why.]

### Phase
Expand / Migrate / Contract — and what must ship before the next phase.

### Up / Down
[The migration and its rollback, or the documented irreversibility + recovery.]

### Risk & rollout
[Locking, data volume, backfill batching, downtime expectation.]

### Verify
[How to confirm success and how to detect/triage failure mid-rollout.]

---

## Rules

- A schema change that affects a contract or other services warrants an
  `adr-write`.
- Never edit a migration that has already run anywhere — write a new one.
- Destructive steps (drop/truncate) require explicit human sign-off, called out
  loudly.
