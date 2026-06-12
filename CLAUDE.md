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

# After ANY change under templates/ (test/catalog.test.mjs fails otherwise):
node scripts/update-catalog.mjs

# Run a command locally after building:
node dist/cli.js install   # also: update | diff | status

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

Two layers, deliberately separated:

- **`src/installer.ts` — pure logic, no UI.** `planInstall(root, selected)` walks
  `templates/` recursively and, for each file, emits a `FileAction`
  (`create` / `update` / `skip`) by diffing the incoming content
  against the target — skipping optional-module files whose id isn't in
  `selected`. `mapTemplatePath()` translates the logical template path to its
  install location; nothing is generated — the payload is exactly the mapped
  templates (ADR-011). Differing files are
  classified three-way against the recorded installed base (`FileAction.merge`:
  `clean` / `customized` / `conflict` / `unknown`, ADR-006) — commands render
  the classification but never re-derive it. `applyAction()` executes
  one action. `loadManifest()` reads the optional-module list;
  `writeVersionFile()` / `readVersionFile()` / `readInstalledSelection()` manage
  `.claude/.scaffold-version` (which records the chosen modules; the pre-2.0
  `.ai/.scaffold-version` is still readable). `loadMcpCatalog()` /
  `mcpChoicesFor()` / `mergeMcpServers()` implement the MCP catalog (ADR-008):
  add-only merge into the user-owned `.mcp.json` — existing entries always win,
  the file is never tracked by diff/update, and the catalog carries no
  credentials (a test rejects credential-shaped strings). No prompts, no
  `console`.
- **`src/commands/*.ts` — UI / orchestration.** Each command calls
  `planInstall()`, renders with `src/differ.ts`, drives `prompts`, then calls
  `applyAction()`. `install` parses flags
  (`--all`/`--core`/`--modules=`/`--mcp=`/`--yes`)
  and, in a TTY, prompts a module checklist plus an MCP-server multiselect. `update` is the same flow,
  pre-selecting the previously-installed modules; `diff`/`status` plan against the
  installed selection so they don't report unselected optional files as missing.
- **`src/cli.ts`** routes `argv[2]` to one of the four commands; flags are read
  from `process.argv` inside the command.

When adding behavior, keep planning/applying in `installer.ts` and all
user interaction in `commands/`.

## Critical, non-obvious invariants

These caused real bugs and are easy to reintroduce:

1. **`templates/` is a logical layout; `mapTemplatePath()` is the only bridge.**
   `templates/skills/**/<name>.md` → `.claude/skills/<name>/SKILL.md` (subdirs
   like `workflow/` are organizational and flattened — skill basenames must stay
   unique), `templates/rules/*` → `.claude/rules/*`, `templates/context/**` →
   `.context/**`, root files (`CLAUDE.md`) verbatim. Manifest `paths` and the
   exclusion check use the **logical** form (`skills/migration.md`), not the
   install form. Tests in `test/installer.test.mjs` pin this mapping.

2. **Two version signals, both mandatory on template changes.**
   `SCAFFOLD_VERSION` (in `src/installer.ts`) is the coarse signal — bump it or
   `status`/`update` won't notice. The **per-template catalog** in
   `scaffold.manifest.json` (`templates`: version/date/sha256 per file, ADR-007)
   is the fine signal — run `node scripts/update-catalog.mjs` after any change
   under `templates/`; `test/catalog.test.mjs` fails the suite on drift. Never
   hand-edit catalog entries. `scripts/` is dev-only (not in the `files`
   whitelist, ships nowhere).

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
   same applies to `MANIFEST_FILE` (`../scaffold.manifest.json`).

6. **Core is implicit; optional is explicit.** `scaffold.manifest.json` lists
   only the **optional** modules (and the template paths each owns); everything
   else under `templates/` is core and always installed. A new template is core
   by default — to make it optional, add it to the manifest. The manifest lives
   at the repo root (sibling of `templates/`, so it is *not* copied into targets)
   and the `paths` use the logical rel form (`rules/x.md`, `skills/x.md`) that
   `path.relative(TEMPLATES_DIR, …)` produces. Future module ideas are mapped in
   `docs/CANDIDATE-MODULES.md` — add on demand, not up front.

7. **The installed selection is persisted** in `.claude/.scaffold-version`
   (`optional: [...]`; pre-2.0 installs used `.ai/.scaffold-version`, which the
   readers still fall back to). Since 2.3.0 it also records the **installed
   base** per template (`templates: { path → {version, hash} }`, selection-aware),
   which drives the 3-way update classification (ADR-006/ADR-007): customized +
   upstream-unchanged skips silently; conflicts are never auto-applied, even
   with `--yes`. Since 2.9.0 it also records the chosen MCP servers
   (`mcp: [...]`, ADR-008) so `update` preselects them. The recorded base is always a catalog hash, never a local
   file's hash — and applying/declining an update re-records the latest catalog,
   so a declined conflict is not re-nagged until upstream changes again.
   `diff`/`status`/`update` all read it via
   `readInstalledSelection` so they stay coherent. Deselecting a module on
   re-install does **not** delete its files (we never delete user files) — it
   just stops tracking them; note this if it surprises you.

## Packaging & distribution

- **`package.json` `files: ["dist", "templates", "scaffold.manifest.json"]`** is
  the publish whitelist. `templates` MUST stay in it — otherwise `install`
  copies nothing; the manifest MUST stay in it or every module reads as core.
  The `files` whitelist intentionally overrides `.gitignore` (which excludes
  `dist/`). Re-verify with `npm pack` after structural changes.
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
stack-shaped concerns belong in optional modules (see `scaffold.manifest.json`),
not the core.

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
   - Touched anything under `templates/` → bump `SCAFFOLD_VERSION` in
     `src/installer.ts` **and** run `node scripts/update-catalog.mjs`
     (otherwise `status`/`update` can't detect the change and the catalog
     test fails).
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
     `npm pack` to confirm the tarball still contains `templates/` and the
     manifest after any structural change.

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
   - Every **skill** template starts with `name`/`description` frontmatter
     (invariant 3). If the skill is optional, add its logical path
     (`skills/<name>.md`) to the module's `paths` in `scaffold.manifest.json` —
     the generated pointers pick it up automatically.
