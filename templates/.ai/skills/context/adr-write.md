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

Read:
- `.context/adr/ADR-000-index.md` — to find the next ADR number.
- `.ai/AI_CONTEXT.md`.
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
