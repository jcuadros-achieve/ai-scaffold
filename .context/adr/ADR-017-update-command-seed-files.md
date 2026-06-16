# ADR-017: `update` as its own command — seed files installed once, a changelog for the rest

**Date:** 2026-06-15
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-15. ADR-006 reconciled `update`
with `ai-init` by classifying every differing file three-way against the
recorded base. It works for files upstream leaves alone (they go `customized`
→ silent skip). But `ai-init` rewrites `CLAUDE.md` and concretizes the rules
with project facts, so the moment the tool improves one of *those* templates in
a later version the file is "customized locally **and** changed upstream" =
`conflict`. The user is then shown a `CLAUDE.md`-of-their-project vs
generic-placeholder diff on every release, answers "keep" every time, and the
project freezes. ADR-006 removed half the noise; this is the other half. The
requester's framing: these files are *installed one way and generated later* —
reconciling them at all is the mistake, and folding update into install just to
share a wizard complicates the logic for no benefit.

## Context

Two facts make a separate, simpler `update` the right shape:

1. **Some templates are seeds, not tracked content.** `CLAUDE.md` and the rules
   ship as generic placeholders that `ai-init` overwrites with project-specific
   content. After that, the project *owns* the file; the generic template is
   irrelevant to it. ADR-013 already accepted exactly this for nested
   per-workspace `CLAUDE.md` ("never tracked or touched by `update`"). This ADR
   generalizes that property to every seed template instead of hard-coding one
   path.

2. **`update` currently reuses the full `install` wizard.** `update.ts` is a
   thin wrapper that calls `install()`, which re-prompts the module checklist,
   the MCP multiselect, and the initial-commit prompt. None of that is what an
   update is for. Adding or removing a module is an *install* concern; pulling
   upstream changes to what you already have is an *update* concern. They are
   different operations sharing one entry point by accident.

The per-template catalog (ADR-007) already records, per file, a version and
hash — it is the single source of truth for "what shipped". A changelog of what
changed between versions is a *view* derived from it, never a hand-maintained
second list (invariant: catalog entries are mechanically generated, ADR-007).

## Decision

### 1. `track` becomes a per-template property in the catalog

Each catalog entry gains `track: "seed" | "reconcile"`:

- **`seed`** — installed once if absent, then **never reconciled, diffed, or
  overwritten by `update`**. The project owns the content after `ai-init`.
  Initial assignment: `CLAUDE.md` and everything under `rules/`, plus any skill
  `ai-init` rewrites with project-specific content (`verify` and others
  concretized per ADR-013). The exact set is recorded per file in the catalog,
  so it is reviewable in one place and `update-catalog.mjs` is its only writer.
- **`reconcile`** — the existing ADR-006 three-way behavior, unchanged: files
  `ai-init` leaves structurally intact (generic workflow skills, `.context/`
  scaffolding). These still fast-forward when clean and conflict when both
  sides moved.

`track` is metadata only; it does not affect install-time copying (`ai-init`
still customizes seed files exactly as today).

### 2. `update` becomes its own command, distinct from `install`

`update.ts` stops wrapping `install()`. It:

- reads the previously-installed module + MCP selection silently
  (`readInstalledSelection` / `readInstalledMcp`) — **no wizard, no MCP
  multiselect, no commit prompt**;
- plans against that selection and acts per file:
  - **new file** (`create`, seed or reconcile) → install it;
  - **seed file already present** → leave untouched; list it in the changelog
    only (see §3) so an upstream improvement is *discoverable*, never imposed;
  - **reconcile file** → existing ADR-006 path: clean fast-forwards (confirmed),
    conflicts shown and never auto-applied;
- records the new base afterward, as today.

Changing *which* modules are installed stays in `install` (re-run it to add or
drop a module). `update` only pulls upstream changes to the current selection.
This is the separation the requester asked for: install = compose the scaffold;
update = catch up to the latest templates.

### 3. A generated changelog, surfaced by `update`

`scripts/update-catalog.mjs` emits a `changelog` section in
`scaffold.manifest.json` keyed by `SCAFFOLD_VERSION`: per release, the list of
template paths that were **added** or whose version **bumped**, each tagged with
its `track`. It is generated from the catalog diff — never hand-edited — so it
cannot drift from the hashes it describes.

`update` prints, as a header, the slice of that changelog between the project's
installed version and the latest, with seed-file changes called out separately
("changed upstream — review and pull manually if you want it") because those are
the ones `update` deliberately will not apply for you. The per-project "what
changed since your install" set is computed live from the recorded bases vs the
current catalog; the stored changelog is the human-readable release-notes view.

### 4. `diff` / `status` stay coherent

Both already read the installed selection. They report seed files as
"install-once (not tracked)" rather than as missing or conflicting, so the
three commands tell the same story.

## Consequences

**Positive:**
- The `CLAUDE.md` / rules forever-diff disappears at the root cause: those files
  leave the reconciliation machinery entirely. `update` output becomes purely
  actionable — new files, real fast-forwards, and a readable "what's new".
- `update` is a clean, wizard-free operation; its intent (catch up) is no longer
  tangled with install's intent (compose).
- Upstream improvements to seed files are not lost, just *opt-in*: the changelog
  makes them visible so the user can pull them deliberately.
- One source of truth preserved: `track` and the changelog both live in the
  catalog, generated by the existing dev script.

**Negative / tradeoffs:**
- Seed files never auto-update, so a genuinely valuable rule improvement reaches
  existing projects only if the user acts on the changelog. Accepted: ADR-006
  showed users already "keep" these every time; this formalizes reality and
  makes the improvement discoverable instead of nagging.
- The seed/reconcile line is a judgment call per template and can be wrong; it
  is mitigated by being a single reviewable column in the catalog, changeable in
  one place.
- `install` and `update` now diverge in code where they used to share a path —
  more surface, but each is simpler than the conflated version.

## Alternatives considered

### Keep ADR-006 as-is (three-way for everything)
Rejected: it is the documented residual failure. Three-way silences upstream-
unchanged files but cannot stop the conflict noise on `ai-init`-owned files when
the template legitimately evolves — which is most releases for rules.

### Seed flag only, keep the shared `install`/`update` entry point
Considered and declined for this scope (it was offered as the minimal option).
It removes the diff noise but leaves `update` running the install wizard, which
the requester identified as unnecessary complexity. Doing both — seed files
*and* a real update command — addresses noise and UX together.

### Hand-maintained changelog as the update driver
Rejected: a second source of truth that drifts from the catalog the first time
someone forgets to update it. Deriving the changelog from the catalog keeps
ADR-007's "mechanically enforced, never hand-edited" guarantee.

### Store full base contents for true 3-way merges (ADR-006's deferral)
Still deferred and now largely moot for seed files: if they are never
reconciled, there is no merge to anchor. Remains available for `reconcile` files
if conflicts there prove frequent.

## Context for AI assistants

- `track` is recorded per template in `scaffold.manifest.json` and written only
  by `scripts/update-catalog.mjs` — never hand-edit it, same as every catalog
  field (ADR-007).
- A `seed` file is installed if absent and otherwise never touched by `update`:
  no diff, no prompt, no overwrite — not even behind `--yes`. Listing it in the
  changelog is the only thing `update` does with a changed seed file.
- `update` must not run the module or MCP selection wizard or the commit prompt;
  those belong to `install`. Adding/removing modules is an install operation.
- The changelog is a generated view of the catalog; do not introduce a separate
  hand-written changelog file.
- This supersedes ADR-006 **only** for seed files (they leave the three-way
  classification). For `reconcile` files, ADR-006 stands unchanged.
