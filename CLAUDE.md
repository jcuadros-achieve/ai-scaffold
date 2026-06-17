# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ai-scaffold` is a CLI that installs a standardized AI workflow structure
(`CLAUDE.md`, `.claude/` and `.context/`) into **other** projects. One command
gives any repo a consistent set of context files, rules, and reusable skill
templates for AI-assisted development. Claude Code is the primary target
(ADR-002): skills install as native Claude skills under `.claude/skills/`,
which GitHub Copilot also discovers natively.

This repo is the tool itself. The files under `templates/` are **not** this
project's own config — they are the payload installed into target projects
(in a *target*, `CLAUDE.md` is the generic placeholder `ai-init` populates;
this file documents the tool's own codebase).

## What it establishes (product flow)

Understanding the payload's purpose makes the code make sense. ai-scaffold sets
up, in each target project, two chains of skills with human gates between stages:

- **Work chain:** `ticket-create → ticket-clarify → task-plan →
  task-implement → verify → pr-write → pr-review` (ticket authored by asking
  when starting from an idea — ADR-012, understanding approved before
  planning, plan before coding, TDD during implementation, `verify` runs real
  gates before the PR).
- **Context chain:** `adr-write → ai-log-write → context-update` — append-only
  project memory (decisions + AI sessions), with a regenerated `INDEX.md`.

Work-chain skills end with a `Hand-off` proposing the next step (the human
approves), and context capture runs automatically: `task-implement` drafts any
required ADR at step 0 (right after plan approval, before code) and writes the
session log at its close; `pr-write` verifies the ADR still matches what was
implemented and refreshes the index (ADR-003/ADR-004). Human ask-points
(elicitation, Hand-offs, deviation choices, filing approvals) instruct the
agent to use the harness's structured-question dialog, degrading to plain text
(ADR-015). Keep that shape when editing workflow skills.

Shipped rules enforce consistency, protected zones, and "read the memory first":
`code-style`, `security`, `no-touch`, `context`, `test-strategy`, `dependency`,
`ci-gates`, `performance`, `observability`, `resilience`, `api-contract`, `docs`,
`git-workflow`. On-demand skills (`security-review`, `refactor`, `migration`, …)
cover deeper tasks. `ai-init` is the keystone: it analyzes a real codebase and
fills the generic rules with project-specific facts. Full breakdown:
[`docs/OVERVIEW.md`](docs/OVERVIEW.md).

## Commands

```bash
npm install            # install deps
npm run build          # tsc → compiles src/ to dist/
npm run dev            # node --watch dist/cli.js  (build first)
npm test               # builds, then unit tests (node --test, test/*.test.mjs)

# After ANY change under templates/ (test/catalog-index.test.mjs fails otherwise):
node scripts/build-catalog.mjs

# Run a command locally after building:
node dist/cli.js install   # also: suggest | apply | update | diff | status

# Verify the package contents (run after any structural change):
npm pack && tar -tzf achieve-ai-scaffold-*.tgz   # then rm the .tgz
```

Unit tests cover the pure logic in `installer.ts` (`test/installer.test.mjs`,
zero extra deps — `node:test` against `dist/`); new installer behavior must land
with a test in the same commit (ADR-001). There is **no linter** configured.
UI behavior in `commands/` is still verified manually: install into a throwaway
dir and inspect the result.

```bash
# Manual end-to-end check:
mkdir /tmp/t && cd /tmp/t && git init
node /ABS/PATH/ai-scaffold/dist/cli.js install
```

## Architecture

The flow is **inverted** (ADR-017): `install` lays only a minimal *seed*; the
decision of *what else to install* moves to `ai-init`, which scans the real
codebase and curates with the user. The data flow is:

```
ai-init (scan)      AGENT → .scaffold/project-profile.json   (facts + evidence)
ai-scaffold suggest CLI   → .scaffold/candidates.json         (pure appliesWhen match)
ai-init (curation)  AGENT → .scaffold/install-plan.json       (rank + justify + dialog)
ai-scaffold apply   CLI   → writes files / merges .mcp.json / updates state
```

`project-profile.json` is the **only** agent→CLI boundary; `suggest` trusts its
facts and never re-derives them. `apply` is the **single writer** (the agent
never writes payload). The three `.scaffold/*.json` artifacts are gitignored
(ADR-017 §4). Two layers, deliberately separated:

- **`src/installer.ts` — pure logic, no UI.**
  - `installSeed(root)` lays the seed (ADR-017 §1): every template file *not*
    owned by a catalog entry (infra: `CLAUDE.md`, `.context/**`) created-if-absent,
    plus the catalog entries flagged `seed: true` (ai-init skill, context rule)
    applied through the single writer. `templates/mcp/**` is skipped (mcp has no
    body).
  - `apply(root, items)` is the single writer: for each `{entry, workspaces}` it
    writes the body via `mapTemplatePath()`, classifies three-way against the
    recorded base per **id** (`merge`: `clean`/`customized`/`conflict`/`unknown`,
    ADR-006 — conflicts never auto-applied), merges mcp entries add-only into
    `.mcp.json` (ADR-008), and persists id-keyed state. Prior ids not in the plan
    are preserved.
  - `reconcile(root, catalog)` is read-only: classifies each installed id against
    the current catalog (upstream change vs local drift). `status`/`diff`/`update`
    all share it.
  - `readState`/`writeState` manage `.claude/.scaffold-state.json`
    (`installed: { <id> → {version, hash, merge, workspaces} }`). `loadCatalogIndex()`
    reads the compiled catalog. No prompts, no `console`.
- **`src/catalog.ts` — the pure matcher.** `suggest(profile, catalog)` filters
  the index against the per-workspace profile (ADR-020), `detectConflicts()`
  finds same-workspace clashes. Filesystem-free and fully unit-tested.
- **`src/commands/*.ts` — UI / orchestration.** `install`→`installSeed`;
  `suggest` reads the profile, runs the matcher, writes candidates; `apply` reads
  the plan, resolves ids → `apply()`; `update` reconciles installed state against
  the catalog and re-applies (clean fast-forwards, conflicts kept); `status`/`diff`
  render `reconcile()`. Render with `src/differ.ts`, drive `prompts`.
- **`src/cli.ts`** routes `argv[2]` to one of the six commands.

When adding behavior, keep planning/applying in `installer.ts`, the matcher in
`catalog.ts`, and all user interaction in `commands/`.

## Critical, non-obvious invariants

These caused real bugs and are easy to reintroduce:

1. **`templates/` is a logical layout; `mapTemplatePath()` is the only bridge.**
   `templates/skills/**/<name>.md` → `.claude/skills/<name>/SKILL.md` (subdirs
   like `workflow/` are organizational and flattened — skill basenames must stay
   unique), `templates/rules/*` → `.claude/rules/*`, `templates/agents/*` →
   `.claude/agents/*`, `templates/context/**` → `.context/**`, root files
   (`CLAUDE.md`) verbatim. Catalog entry `body` uses the **logical** form
   (`skills/migration.md`), not the install form. Tests in
   `test/installer.test.mjs` pin this mapping.

2. **One version signal: the per-entry catalog (ADR-018 §7).** The coarse
   `SCAFFOLD_VERSION` is **gone** (redesign). Each catalog entry carries its own
   `version`/`updated`/`hash` in `catalog.index.json`, compiled from frontmatter
   by `node scripts/build-catalog.mjs` — run it after ANY change under
   `templates/`; `test/catalog-index.test.mjs` fails the suite on drift. Never
   hand-edit the index. `scripts/` is dev-only (not in the `files` whitelist,
   ships nowhere).

3. **Every skill template must carry frontmatter** (`name` + `description` +
   `tier: fast | deep`) — name/description make the installed `SKILL.md`
   discoverable; `tier` declares effort semantics (ADR-005: never model IDs —
   a test rejects them), kept as metadata for tools that learn to read it.
   No symlinks and no generated files are created (ADR-010/ADR-011);
   `applyAction` still replaces a pre-existing symlink at a destination
   instead of writing through it (protects pre-2.0 installs where `CLAUDE.md`
   was a link).

4. **Build output must not equal source.** `tsconfig.json` uses
   `rootDir: ./src`, `outDir: ./dist`. Do not set `outDir` to `./src` — tsc
   auto-excludes the outDir and the build fails with `TS18003`.

5. **`TEMPLATES_DIR` assumes `dist/` is a sibling of `templates/`.**
   `installer.ts` resolves `path.resolve(__dirname, '../templates')`, i.e.
   `dist/installer.js` → `../templates`. Changing `outDir` breaks this path. The
   same applies to `CATALOG_INDEX_FILE` (`../catalog.index.json`).

6. **Almost nothing auto-installs; the catalog is offered, not laid (ADR-018 §7).**
   Only entries flagged `seed: true` are installed by `install` (the ADR-017
   bootstrap: `skill/ai-init`, `rule/context`); everything else is offered through
   `appliesWhen` and laid only when a curated plan names it. The old
   "core implicit / optional explicit" manifest model is **retired** — there is no
   `scaffold.manifest.json`. To add a catalog entry, drop a `.md` (or
   `templates/mcp/*.json`) with the frontmatter envelope and rebuild the index.

7. **State is keyed by catalog entry `id`, in `.claude/.scaffold-state.json`**
   (`installed: { <id> → {version, hash, merge, workspaces} }`, ADR-017 §3). The
   recorded base drives the 3-way update classification (ADR-006): customized +
   upstream-unchanged skips silently; conflicts are never auto-applied. The base
   is always a catalog hash, never a local file's hash — and applying/declining
   an update re-records the latest catalog, so a declined conflict is not
   re-nagged until upstream changes again. `workspaces` attribute each entry to
   the workspaces that justified it (ADR-020). `status`/`diff`/`update` all read
   state via `reconcile()` so they stay coherent. We never delete user files.

## Packaging & distribution

- **`package.json` `files: ["dist", "templates", "catalog.index.json"]`** is
  the publish whitelist. `templates` MUST stay in it — otherwise `install`
  copies nothing; `catalog.index.json` MUST stay in it or `suggest`/`apply` see
  an empty catalog. The `files` whitelist intentionally overrides `.gitignore`
  (which excludes `dist/`). Re-verify with `npm pack` after structural changes.
- **`prepare: tsc`** builds on install. This is what makes
  `npx github:<owner>/ai-scaffold` work: npm clones the repo, runs `prepare` to
  compile, then runs the `bin` (`dist/cli.js`).
- **Current distribution (private demo):**
  `npx github:jcuadros-achieve/ai-scaffold <command>`.
- **Future (company):** publish to Artifactory/jfrog under the `@achieve` scope →
  `npx @achieve/ai-scaffold <command>`. The package `name` is already
  `@achieve/ai-scaffold`; the README keeps the jfrog form as a "Future" note.

## The `templates/` payload

Generic placeholders, not finished content. The keystone is
`templates/skills/ai-init.md`: a four-phase skill (Read → Analyze →
Generate → Write) meant to be run by an AI agent **inside a target project** to
analyze that codebase and replace the generic templates with project-specific
versions. It is archetype-aware (app/service, library, CLI, IaC, data pipeline,
frontend): the deep-read checklist and the generated rules adapt to the kind of
repo, the Phase 2 analysis is the central artifact every file derives from, and
"non-obvious invariants & gotchas" + "observations & risks" synthesis is
mandatory — the target `CLAUDE.md` template's sections are a floor, not a
ceiling. When editing templates, preserve that intent — they are starting points
`ai-init` customizes, not final docs.

**Keep core rules stack-neutral.** Core rules state language-agnostic principles;
stack-specific guidance (e.g. TS `any`, zod, npm, SQL framing) appears only as
*examples*, and `ai-init` concretizes them per project. Do not hardcode one
stack's idioms as a core requirement — that breaks the agnostic promise. Truly
stack-shaped concerns belong in their own catalog entries with an `appliesWhen`
predicate (e.g. `rule/stack-nextjs`), not the universal rules.

`templates/context/` holds the append-only project-memory structure (ADRs +
AI interaction log + a regenerated `INDEX.md`); its rules live in
`templates/rules/context.md`.

**Monorepo behavior lives in content, not in the installer (ADR-013):** the
installer always installs one scaffold at the repo root; `ai-init` detects
workspaces and generates the root map + nested per-workspace `CLAUDE.md`
(project content, never tracked by `update`), the context skills resolve the
nearest `.context/`, and stack rules carry an `Applies to` scope. Do not add
per-workspace installation logic without superseding ADR-013.

**Parallelization is also content, not artifacts (ADR-014):** `ai-init`
(per top-level workspace), `pr-review` and `security-review` carry subagent
fan-out directives with a mandatory degradation clause (sequential = the
contract). Subagents are read-only; no `.claude/agents/` or workflow scripts
ship in the payload, and the work chain is never parallelized.

## Tool integration (ADR-002, ADR-010, ADR-011)

Skills install as **native Claude skills** (`.claude/skills/<name>/SKILL.md`),
invoked `/<name>` in Claude Code. The payload is **Claude-only**: exactly
`CLAUDE.md` + `.claude/` + `.context/`, with no stored adapters and no
generated per-tool artifacts of any kind (ADR-011). Other tools' compatibility
comes from them reading `.claude/` natively (Copilot and Cursor both do —
verified in the ffn-resiliency test); if a team wants a tool-specific pointer
(`AGENTS.md`, `copilot-instructions.md`), that file is user content they write
and own. Do not add generated files to the installer for any tool without
superseding ADR-011 first.

## Rules for changes in this repo

These are binding for any work done here. They are repo-specific, not generic
advice. The full change flow (decision gate, verification gates, release) is
defined in [`.context/adr/ADR-001-development-flow.md`](.context/adr/ADR-001-development-flow.md);
this repo records its own decisions in `.context/adr/` (dogfooding the model it
ships — that directory is *not* part of the payload and never installs into
targets).

1. **Document every change in the same commit that makes it.** A change is not
   done until its documentation is updated alongside it:
   - Touched architecture, the build, or one of the invariants above → update
     this `CLAUDE.md`.
   - Touched user-facing behavior or commands → update `README.md`.
   - Made a cross-cutting or structural decision → record an ADR in
     `.context/adr/` **before** implementing (see ADR-001 for what qualifies).
   - Touched anything under `templates/` → run `node scripts/build-catalog.mjs`
     (otherwise `status`/`update` can't detect the change and
     `test/catalog-index.test.mjs` fails). A new catalog entry needs its
     frontmatter envelope (`id`/`surface`/`rationale`/`stability`, + `appliesWhen`
     unless universal); mark `seed: true` only for the ADR-017 bootstrap.
   - Commit messages use conventional-commits (`type(scope): summary`) and state
     **what** changed and **why** — never "modified file X". Undocumented changes
     should be rejected in review.

2. **Follow good development practices, enforced concretely.**
   - Preserve the layer split: planning/applying stays in `installer.ts`, all
     user interaction stays in `commands/`. Do not leak `console`/`prompts` into
     `installer.ts`.
   - The rules this tool ships in `templates/rules/code-style.md` and
     `security.md` (no `any`, small focused functions, validate external input,
     no hardcoded secrets) apply to this repo's own `src/` too — dogfood them.
   - Verify before committing: `npm test`, install into a throwaway dir, and run
     `npm pack` to confirm the tarball still contains `templates/` and
     `catalog.index.json` after any structural change.

3. **New skills and rules must fit a correct flow and be justified.** Anything
   added under `templates/skills/` or `templates/rules/`:
   - Must slot into an existing chain rather than duplicate or bypass it — the
     workflow chain (`ticket-clarify → task-plan → task-implement → pr-write →
     pr-review`) or the context chain (`adr-write` / `ai-log-write` /
     `context-update`). State which chain it belongs to.
   - Must carry an explicit justification: what gap it fills and why the existing
     skills don't cover it. "It was convenient" is not a justification.
   - Must preserve the placeholder intent — a generic starting point that
     `ai-init` customizes per project, not finished project-specific content.
   - For a cross-cutting addition, capture the reasoning in this repo's own
     `.context/adr/` (the same model this tool promotes in targets).
   - Every **skill** template starts with `name`/`description`/`tier`
     frontmatter (invariant 3) **and a help card** right after the title
     (`/<name> help` prints it and stops — ADR-016; behavior changes must
     update the card in the same edit). Add the catalog frontmatter envelope
     (`id: skill/<name>`, `surface: skill`, `rationale`, `stability`, and
     `appliesWhen` unless it is universal), then rebuild the index.
