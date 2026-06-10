# ADR-006: Base-aware updates — reconciling `update` with `ai-init` customization

**Date:** 2026-06-10
**Status:** Accepted
**Deciders:** Jonathan Cuadros
**Ticket / context:** Design review of 2026-06-10. The product's central
tension: install ships generic templates, `ai-init` rewrites them with
project-specific content, and from then on every `update` shows a wall of
"your customized file vs the new generic template" diffs. Users answer "keep"
to everything and the project freezes on the version it installed. The update
mechanism and the personalization mechanism cancel each other out.

## Context

`planInstall` only compared two points: the local file and the incoming
template. It cannot distinguish "the user customized this" from "upstream
changed this". ADR-007 added the missing third point: the **installed base**
(per-template version + hash recorded in `.claude/.scaffold-version`).

## Decision

Classify every differing file three-way in `planInstall`, using the recorded
base hash:

| Local vs base | Incoming vs base | Classification | Behavior |
|---------------|------------------|----------------|----------|
| unmodified | unchanged | — (local == incoming) | `skip`, as today |
| **modified** | **unchanged** | `customized` | **`skip` silently** — upstream has nothing new; this kills the post-`ai-init` diff noise |
| unmodified | changed | `clean` | safe `update` — fast-forward to the new template |
| **modified** | **changed** | `conflict` | `update`, **never auto-applied**: default is "keep current", diff shown for a deliberate manual merge |
| no base recorded (pre-2.3 install) | — | `unknown` | legacy behavior (today's update flow) |

Supporting decisions:

1. The classification lives in `installer.ts` (`FileAction.merge`); commands
   only render it. `--yes`/non-TTY applies `clean` (and legacy `unknown`)
   updates but **never** applies `conflict`s — a known customization is never
   overwritten unattended.
2. Install-time-generated pointer files have no base entries and keep plain
   behavior — they carry "do not edit" headers by design.
3. After an update applies, the version file records the **latest catalog** as
   the new base for all installed paths. Known simplification: declining a
   `clean` update reclassifies that file as `customized` on later runs —
   conservative (it degrades to "skip / conflict", never to silent overwrite).
4. `ai-init` needs no changes: its rewrites are exactly what the `customized`
   classification captures.

## Consequences

**Positive:**
- Post-`ai-init` updates stop drowning the user: customized files with no
  upstream change disappear from the report; what remains is genuinely
  actionable (clean fast-forwards + real conflicts).
- Customizations can never be silently destroyed, including in CI (`--yes`).
- `diff`/`status` can finally answer "what did *we* change vs what did
  *upstream* change".

**Negative / tradeoffs:**
- Conflicts still require a manual merge — the diff shown is local-vs-incoming
  (we record the base *hash*, not the base *content*, so a true base-anchored
  3-way diff isn't possible). Storing base contents (or shipping prior
  template versions) would enable real merges; deferred until conflicts prove
  frequent enough to justify it.
- Pre-2.3 installs get no classification until their next `update` records
  bases.

## Alternatives considered

### Ownership split: separate generic file + project-facts file per rule
Rejected: doubles the rule count, reads worse (a stack concretization belongs
inline with the principle it concretizes), and forces `ai-init` and every rule
template into a structural rewrite. The base-aware classification gets most of
the value with zero content changes.

### Store full base contents in the target (true 3-way merge)
Deferred, not rejected: hash classification removes the bulk of the noise.
If real conflict merges turn out to be common, base content storage (e.g.
`.claude/.scaffold-base/`) composes cleanly on top of this design.

### Status quo (two-point compare)
Rejected: it is the documented failure — personalize once, freeze forever.

## Context for AI assistants

- `merge` classification belongs in `installer.ts`; do not re-derive it in
  commands.
- Never make `conflict` actions auto-applicable, in any mode — not even behind
  a flag default.
- The recorded base must always be a *template* hash from the catalog, never
  the hash of a user's local file.
