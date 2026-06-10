# ADR-001: Development flow for payload, installer, and releases

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. The repo had binding rules in
`CLAUDE.md` but no end-to-end flow defining how a change moves from idea to a
released version, when an ADR is required, or what verification gates apply.
Several structural decisions (Claude-first targeting, generated adapters, model
tiers, context-chain merge) need a defined flow to land through.

## Context

This repo ships a payload (`templates/`) consumed by other projects via `npx`.
Changes have three distinct risk profiles: payload content (skills/rules),
installer logic (`src/`), and structure (manifest, packaging, canonical
locations). Verification has been ad-hoc and manual; the invariants list in
`CLAUDE.md` exists because ad-hoc verification let real bugs through.

## Decision

We will route every change through the following flow, by change type.

### 1. Decision gate (before coding)

A change requires an ADR in `.context/adr/` **before** implementation when it:

- changes the payload's structure or canonical file locations,
- adds, removes, or reorders a chain or a human gate,
- changes the update/versioning model, or
- rejects an obvious alternative for a non-obvious reason.

Routine fixes and content edits to existing templates do not need an ADR.

### 2. New skill or rule (payload content)

1. **Justify** — state which chain it belongs to (work / context / on-demand)
   and what gap the existing skills don't cover. Recorded in the commit message;
   in an ADR if cross-cutting.
2. **Classify** — core (universal, stack-neutral) vs optional
   (project-shape-dependent → entry in `scaffold.manifest.json`). Core is the
   *mechanical default*, so classification must be a deliberate step, not an
   omission.
3. **Author** the playbook preserving placeholder intent: a generic starting
   point that `ai-init` customizes, never finished project-specific content.
4. **Adapters** — rerun `node scripts/gen-adapters.mjs`, add the `DESC` entry,
   and (if optional) list the adapter paths in the module's manifest `paths`.
   *Transitional:* this step disappears when adapter generation moves into the
   installer (see pending ADR-002 in the index).
5. **Bump `SCAFFOLD_VERSION`** in `src/installer.ts`.

### 3. Fix or change to the installer (`src/`)

- Preserve the layer split: planning/applying in `installer.ts`, all user
  interaction in `commands/`.
- No `SCAFFOLD_VERSION` bump unless `templates/` changed.
- Update `README.md` if user-facing behavior changed.

### 4. Verification gates (every change, in order)

1. `npm run build` passes.
2. **Unit tests** for `installer.ts` pure logic run green (`node --test`).
   *The test harness is the first task to be executed under this flow;* from
   then on, new installer behavior must land with a test in the same commit.
3. **E2E smoke**: install into a throwaway git dir (`mkdir /tmp/t && git init`),
   assert the expected files exist and `diff`/`status` report coherently.
4. `npm pack && tar -tzf …` after any structural change, confirming `templates/`
   (with its dot-dirs) and `scaffold.manifest.json` are in the tarball.

### 5. Documentation in the same commit

As already mandated by `CLAUDE.md` rule 1: `CLAUDE.md` for
architecture/invariants, `README.md` for user-facing behavior, ADR for
cross-cutting decisions, conventional-commit message stating what and why.

### 6. Release

`package.json` version and `SCAFFOLD_VERSION` move together, semver-style:
payload addition → minor, payload/installer fix → patch, structural or breaking
change → major. Tag on `main`; consumers pull via `npx github:…` (later jfrog).

## Consequences

**Positive:**
- Predictable path for every change type; classification (core vs optional) and
  chain-fit become explicit steps instead of defaults by omission.
- Tests become a gate, not an aspiration; the e2e smoke catches packaging and
  path regressions that caused past bugs.
- ADR trail for structural decisions, dogfooding the model this tool promotes.

**Negative / tradeoffs:**
- More ceremony per change (acceptable: the payload is the product; silent
  drift in it is costlier than the ceremony).
- E2E smoke is manual until scripted; the test harness doesn't exist yet, so
  gate 4.2 is aspirational for exactly one commit — the one that adds it.

## Alternatives considered

### CI-enforced gates from day one
Rejected for now: the repo is in single-maintainer demo phase. Scripted local
gates come first; CI enforcement when distribution moves to the company
registry (jfrog) and there is more than one contributor.

### Free-form flow (status quo)
Rejected: the invariants section in `CLAUDE.md` is the scar tissue of ad-hoc
verification. A payload consumed by other repos via `update` cannot afford
silent regressions.

## Context for AI assistants

- Before touching anything under `templates/`: classify core vs optional
  deliberately, and bump `SCAFFOLD_VERSION` in the same commit.
- Once the test harness exists, do not add installer behavior without a unit
  test in the same commit.
- Cross-cutting/structural changes need an ADR here **first**; cite it in the
  commit message.
- This `.context/adr/` directory documents *this repo's own* decisions. It is
  not part of the payload (`templates/.context/` is) and is not in the npm
  `files` whitelist, so it never ships to targets.
