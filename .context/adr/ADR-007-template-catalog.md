# ADR-007: Template catalog with per-template versioning, mechanically enforced

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. Today the only version
signal is the global `SCAFFOLD_VERSION`: `update` can say "something changed"
but not *what*, targets cannot know which template revision they have, and the
manual bump relies on discipline (the exact failure mode that has already
bitten this repo). ADR-006 (update vs `ai-init` layering) needs per-file
base versions to do 3-way merging.

## Context

`scaffold.manifest.json` currently lists only the optional modules. There is
no per-template metadata: no version, no last-updated date, no integrity
check. A "rule that says update the JSON when you touch a template" would rot
exactly like the manual `SCAFFOLD_VERSION` bump — rules-by-discipline don't
survive; only mechanical checks do.

## Decision

1. **`scaffold.manifest.json` gains a `templates` catalog** listing *every*
   template file (core and optional), keyed by logical path:
   `{ path, kind (skill|rule|context|root), version, updated (YYYY-MM-DD),
   hash (sha256), tags }`. Module membership is **not** duplicated into the
   catalog — `optional[].paths` remains the single source for it.
2. **A dev script maintains the catalog** (`scripts/update-catalog.mjs`): it
   walks `templates/`, adds entries for new files (version `1.0.0`), bumps the
   patch version + date + hash for changed files, and drops entries for
   deleted ones. Humans never hand-edit hashes.
3. **A test enforces it mechanically** (`test/catalog.test.mjs`, part of
   `npm test`): catalog and `templates/` must match 1:1 and every recorded
   hash must equal the file's actual hash. Editing a template without running
   the update script fails the suite — the "update the JSON" rule is a failing
   test, not a memory exercise.
4. **Installs record their base versions:** `writeVersionFile` adds a
   `templates` map (`logical path → { version, hash }`) for the files that
   were actually installed (selection-aware) to `.claude/.scaffold-version`.
   This is the raw material for ADR-006: knowing the installed base enables
   3-way reasoning (base vs local file vs incoming template).
5. `SCAFFOLD_VERSION` stays as the coarse "anything changed" signal for now;
   deriving it from the catalog is a possible follow-up, out of scope here.

## Consequences

**Positive:**
- `update`/`diff` gain the data to report per-file "installed 1.0.0 →
  incoming 1.2.0" and ADR-006 gains its 3-way base.
- Catalog drift is impossible to merge unnoticed — the suite fails.
- `tags` gives the catalog room for richer metadata (technologies, topics)
  without another schema change; MCP suggestions (ADR-008) can hang off the
  module entries.

**Negative / tradeoffs:**
- One more dev step after editing templates (`node scripts/update-catalog.mjs`)
  — but a *forced* one, which is the point.
- `scripts/` returns as a dev-only directory (it shipped nothing before and
  ships nothing now; not in the `files` whitelist).
- Version-file format grows; old readers ignore the extra field (additive).

## Alternatives considered

### A documentation rule ("update the JSON when you change a template")
Rejected: identical failure mode to the manual `SCAFFOLD_VERSION` bump —
discipline-based bookkeeping drifts silently. The check must be mechanical.

### Per-file version embedded in each template's frontmatter
Rejected: scatters bookkeeping across ~40 files, makes diffs noisy, and rules
or context files have no frontmatter today. One catalog file keeps the
metadata reviewable in a single diff.

### Git history as the version source (no catalog)
Rejected: targets receive the payload via npm tarball, not git — they cannot
query this repo's history; and git mtimes/log don't survive `npm pack`.

## Context for AI assistants

- After **any** change under `templates/`: run `node scripts/update-catalog.mjs`
  (then `npm test` must pass). Do not edit `templates` entries in
  `scaffold.manifest.json` by hand.
- Do not duplicate module membership into the catalog; `optional[].paths`
  owns it.
- The `templates` map in `.claude/.scaffold-version` records the *installed
  base* — never rewrite it on `diff`/`status`, only on install/update apply.
