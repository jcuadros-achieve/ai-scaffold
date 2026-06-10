# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ai-scaffold` is a CLI that installs a standardized AI workflow structure
(`.ai/` and `.context/`) into **other** projects. One command gives any repo a
consistent set of context files, rules, and reusable skill templates for
AI-assisted development.

This repo is the tool itself. The files under `templates/` are **not** this
project's own config — they are the payload copied into target projects.

> Note: in a *target* project, `CLAUDE.md` is installed as a symlink to
> `.ai/AI_CONTEXT.md`. This file (the one you are reading) is a real file
> documenting the tool's own codebase, not that symlink.

## What it establishes (product flow)

Understanding the payload's purpose makes the code make sense. ai-scaffold sets
up, in each target project, two chains of skills with human gates between stages:

- **Work chain:** `ticket-clarify → task-plan → task-implement → verify →
  pr-write → pr-review` (understanding approved before planning, plan before
  coding, TDD during implementation, `verify` runs real gates before the PR).
- **Context chain:** `adr-write → ai-log-write → context-update` — append-only
  project memory (decisions + AI sessions), with a regenerated `INDEX.md`.

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

# Run a command locally after building:
node dist/cli.js install   # also: update | diff | status

# Verify the package contents (run after any structural change):
npm pack && tar -tzf achieve-ai-scaffold-*.tgz   # then rm the .tgz
```

There is **no test runner and no linter** configured. Verification is manual:
install into a throwaway dir and inspect the result.

```bash
# Manual end-to-end check:
mkdir /tmp/t && cd /tmp/t && git init
node /ABS/PATH/ai-scaffold/dist/cli.js install
```

## Architecture

Two layers, deliberately separated:

- **`src/installer.ts` — pure logic, no UI.** `planInstall(root, selected)` walks
  `templates/` recursively and, for each file, emits a `FileAction`
  (`create` / `update` / `skip` / `symlink`) by diffing the template against the
  target — skipping optional-module files whose id isn't in `selected`.
  `applyAction()` executes one action. `loadManifest()` reads the optional-module
  list; `writeVersionFile()` / `readVersionFile()` / `readInstalledSelection()`
  manage `.ai/.scaffold-version` (which records the chosen modules). No prompts,
  no `console`.
- **`src/commands/*.ts` — UI / orchestration.** Each command calls
  `planInstall()`, renders with `src/differ.ts`, drives `prompts`, then calls
  `applyAction()`. `install` parses flags (`--all`/`--core`/`--modules=`/`--yes`)
  and, in a TTY, prompts a module checklist. `update` is the same flow,
  pre-selecting the previously-installed modules; `diff`/`status` plan against the
  installed selection so they don't report unselected optional files as missing.
- **`src/cli.ts`** routes `argv[2]` to one of the four commands; flags are read
  from `process.argv` inside the command.

When adding behavior, keep planning/applying in `installer.ts` and all
user interaction in `commands/`.

## Critical, non-obvious invariants

These caused real bugs and are easy to reintroduce:

1. **Template paths map verbatim to the target.** `planInstall` copies
   `templates/<rel>` → `<projectRoot>/<rel>` with no transformation. That is why
   the template directories are **dot-prefixed on disk**: `templates/.ai/`,
   `templates/.context/`, `templates/.github/`. Renaming them to `ai/` etc.
   would install non-dotted folders and break the symlink targets. Keep the dots.

2. **`SCAFFOLD_VERSION` lives in `src/installer.ts`.** Bump it whenever you change
   anything under `templates/`, or `status`/`update` won't signal the change to
   installed projects.

3. **Symlink targets are hardcoded** in `installer.ts` (`planInstall`):
   `CLAUDE.md` and `.cursorrules` → `.ai/AI_CONTEXT.md`. They must point at a
   template that actually exists.

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
   and the `paths` use the dot-prefixed rel form (`.ai/rules/x.md`) that
   `path.relative(TEMPLATES_DIR, …)` produces. Future module ideas are mapped in
   `docs/CANDIDATE-MODULES.md` — add on demand, not up front.

7. **The installed selection is persisted** in `.ai/.scaffold-version`
   (`optional: [...]`). `diff`/`status`/`update` all read it via
   `readInstalledSelection` so they stay coherent. Deselecting a module on
   re-install does **not** delete its files (we never delete user files) — it
   just stops tracking them; note this if it surprises you.

## Packaging & distribution

- **`package.json` `files: ["dist", "templates", "scaffold.manifest.json"]`** is
  the publish whitelist. `templates` MUST stay in it, including its
  dot-directories — otherwise `install` copies nothing; the manifest MUST stay in
  it or every module reads as core. The `files` whitelist intentionally overrides
  `.gitignore` (which excludes `dist/`). Re-verify with `npm pack` after
  structural changes.
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
`templates/.ai/skills/ai-init.md`: a four-phase skill (Read → Analyze →
Generate → Write) meant to be run by an AI agent **inside a target project** to
analyze that codebase and replace the generic templates with project-specific
versions. It is archetype-aware (app/service, library, CLI, IaC, data pipeline,
frontend): the deep-read checklist and the generated rules adapt to the kind of
repo, the Phase 2 analysis is the central artifact every file derives from, and
"non-obvious invariants & gotchas" + "observations & risks" synthesis is
mandatory — the `AI_CONTEXT.md` template's sections are a floor, not a ceiling.
When editing templates, preserve that intent — they are starting points
`ai-init` customizes, not final docs.

**Keep core rules stack-neutral.** Core rules state language-agnostic principles;
stack-specific guidance (e.g. TS `any`, zod, npm, SQL framing) appears only as
*examples*, and `ai-init` concretizes them per project. Do not hardcode one
stack's idioms as a core requirement — that breaks the agnostic promise. Truly
stack-shaped concerns belong in optional modules (see `scaffold.manifest.json`),
not the core.

`templates/.context/` holds the append-only project-memory structure (ADRs +
AI interaction log + a regenerated `INDEX.md`); its rules live in
`templates/.ai/rules/context.md`.

## Tool adapters

The `.ai/skills/*.md` playbooks are tool-agnostic and are **not** auto-discovered
by any tool on their own. To make them invocable, `scripts/gen-adapters.mjs`
generates thin per-skill adapters into `templates/`:

- `.github/agents/<name>.md` — Copilot CLI custom agents, invoked `/agent <name>`.
- `.claude/commands/<name>.md` — Claude Code slash commands, invoked `/<name>`.
- `.cursor/rules/ai-scaffold.mdc` — a single Cursor context rule (Cursor has no
  per-skill invocation) mapping skill names to playbook paths.

Each adapter just points the tool at the canonical `.ai/skills/...` playbook —
the skill content lives in one place. The adapters for optional-module skills
(`migration`, `incident`) are listed in that module's manifest `paths`, so they
install only when the module is selected. `scripts/` is dev-only (not in the
`files` whitelist), so the generator ships nowhere; only its output (under
`templates/`) is published.

## Rules for changes in this repo

These are binding for any work done here. They are repo-specific, not generic
advice.

1. **Document every change in the same commit that makes it.** A change is not
   done until its documentation is updated alongside it:
   - Touched architecture, the build, or one of the invariants above → update
     this `CLAUDE.md`.
   - Touched user-facing behavior or commands → update `README.md`.
   - Touched anything under `templates/` → bump `SCAFFOLD_VERSION` in
     `src/installer.ts` (otherwise `status`/`update` can't detect the change).
   - Commit messages use conventional-commits (`type(scope): summary`) and state
     **what** changed and **why** — never "modified file X". Undocumented changes
     should be rejected in review.

2. **Follow good development practices, enforced concretely.**
   - Preserve the layer split: planning/applying stays in `installer.ts`, all
     user interaction stays in `commands/`. Do not leak `console`/`prompts` into
     `installer.ts`.
   - The rules this tool ships in `templates/.ai/rules/code-style.md` and
     `security.md` (no `any`, small focused functions, validate external input,
     no hardcoded secrets) apply to this repo's own `src/` too — dogfood them.
   - Verify before committing: install into a throwaway dir, and run `npm pack`
     to confirm the tarball still contains `templates/` (with its dot-dirs)
     after any structural change.

3. **New skills and rules must fit a correct flow and be justified.** Anything
   added under `templates/.ai/skills/` or `templates/.ai/rules/`:
   - Must slot into an existing chain rather than duplicate or bypass it — the
     workflow chain (`ticket-clarify → task-plan → task-implement → pr-write →
     pr-review`) or the context chain (`adr-write` / `ai-log-write` /
     `context-update`). State which chain it belongs to.
   - Must carry an explicit justification: what gap it fills and why the existing
     skills don't cover it. "It was convenient" is not a justification.
   - Must preserve the placeholder intent — a generic starting point that
     `ai-init` customizes per project, not finished project-specific content.
   - For a cross-cutting addition, capture the reasoning where it belongs: an ADR
     in the target's `.context/adr/` is the model this tool itself promotes.
   - After adding/renaming/removing a **skill**, rerun `node scripts/gen-adapters.mjs`
     to regenerate its tool adapters, add a curated description to the script's
     `DESC` map, and — if the skill is optional — add its adapter paths to the
     module's `paths` in `scaffold.manifest.json`.
