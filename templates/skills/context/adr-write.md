---
name: adr-write
description: Record a significant technical decision as an ADR and update the index.
tier: deep
---

# Skill: adr-write

Generate an Architecture Decision Record when a significant technical decision is
made. Update the ADR index automatically.

---

## When to generate

At least one of these must be true:
- Affects more than one module or service.
- Introduces or changes a cross-cutting pattern.
- Rejects a common alternative for a non-obvious reason.
- Has significant tradeoffs future devs should understand.
- Would be hard to reverse without significant rework.

---

## Phase 1 — Read

**Resolve the target `.context/` first (ADR-013):** the nearest `.context/`
at-or-above the files the decision affects — a workspace-local decision goes
to `<workspace>/.context/` (create it with its own `adr/ADR-000-index.md` on
first use; numbering is independent per workspace); a decision crossing
workspaces goes to the root `.context/`.

Read:
- The target's `adr/ADR-000-index.md` — to find the next ADR number there.
- `CLAUDE.md` (and the workspace's nested `CLAUDE.md` if one exists).
- The relevant source files.

---

## ADR format

```markdown
# ADR-[NNN]: [Title — decision as noun phrase, not question]

**Date:** YYYY-MM-DD
**Status:** Accepted
**Deciders:** [who]
**Ticket / context:** [what triggered this]

## Context
[2–4 sentences. The situation that made a decision necessary.]

## Decision
[1–3 sentences. What was decided. "We will use X" not "X is better."]

## Consequences
**Positive:** [list]
**Negative / tradeoffs:** [list]

## Alternatives considered
### [Alternative A]
[What it was and why rejected — one concrete reason.]

## Context for AI assistants
[Direct instructions for future AI sessions.
"Do not suggest X — it was evaluated and rejected because of Y."]
```

---

## After writing

- Update `.context/adr/ADR-000-index.md`.
- Update `.context/INDEX.md` (via `context-update`).

---

## Naming

`ADR-[NNN]-[slug].md` — zero-padded number, slug of at most 5 words.

## Superseding

- Change the old ADR's status to `Superseded by ADR-NNN`.
- Add `Supersedes: ADR-NNN` to the new ADR.

---

## Rules

- The "Context for AI assistants" section is mandatory.
- Never fabricate alternatives that were not actually considered.
- Status is always `Accepted` on creation.
- The title states the decision, not a question.
