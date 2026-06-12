# ADR-016: Self-documenting skills — a `help` invocation card in every skill

**Date:** 2026-06-12
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Improvement proposal (2026-06-12). Skill usage docs live
in the tool repo (`docs/SKILLS.md`); inside a target project a dev only has
the one-line frontmatter description. Installing documentation files was
considered and declined — instead, each skill should answer
`/<name> help` with its own usage card.

## Context

Skills receive the invocation argument; an instruction at the top of the
playbook can branch on it. That makes every skill self-documenting exactly
where it is used, with zero new payload files and no doc that can drift
separately from the skill (the card lives in the same file reviewers see).

## Decision

1. **Every skill starts with a standardized help card** (a blockquote right
   after the title): if the invocation argument is `help` (or `--help`),
   print the card verbatim and stop — never run the skill's phases.
2. **Card fields, fixed:** What / When / Gates–asks / Output / Chain /
   Example. One line each — the card is a summary; the playbook below it
   remains the source of truth for behavior.
3. **New skills must include the card** — added to the repo's
   new-skill checklist alongside frontmatter, and the card is part of what
   `ai-init` preserves when customizing a skill (update the card only if the
   reinterpretation changes what the skill does).

## Consequences

**Positive:**
- `/<skill> help` works in any target project, offline from the tool repo;
  examples and gate expectations are one invocation away.
- No new payload artifacts and no second source of truth — the card travels
  inside the skill file through install, catalog versioning and 3-way update.

**Negative / tradeoffs:**
- ~15 lines per skill file; a behavior change now requires touching the card
  too (mitigated: same file, same diff, same review).

## Alternatives considered

### Install `docs/SKILLS.md` into targets
Declined by the requester and by ADR-011's payload minimalism; a doc file in
the target drifts from the skills it describes.

### A single meta-skill (`/skills-help <name>`)
Rejected: one more skill to maintain that duplicates every other skill's
summary in a second place — the opposite of single-source.

## Context for AI assistants

- When a skill is invoked with `help`, print the card and stop — running the
  phases on a help request is a bug.
- When changing a skill's behavior, update its card in the same edit.
- Never remove the card to "save tokens" — it costs nothing unless invoked.
